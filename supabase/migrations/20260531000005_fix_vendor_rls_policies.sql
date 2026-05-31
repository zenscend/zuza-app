-- ============================================================
-- FIX: "permission denied for table users"
--
-- The SELECT and UPDATE policies were using a subquery against
-- auth.users directly:
--   (select email from auth.users where id = auth.uid())
--
-- Supabase restricts direct access to auth.users from RLS
-- policy expressions. Replace with the built-in auth.email()
-- function which returns the current user's email safely.
--
-- Also re-applies the INSERT fix from migration 004 in case
-- that migration was not yet run.
-- ============================================================

-- Fix SELECT policy
drop policy if exists "vendors_select_own" on public.vendors;

create policy "vendors_select_own"
  on public.vendors for select
  using (email = auth.email());

-- Fix UPDATE policy
drop policy if exists "vendors_update_own" on public.vendors;

create policy "vendors_update_own"
  on public.vendors for update
  using (email = auth.email())
  with check (email = auth.email());

-- Fix INSERT policy (idempotent — safe to run even if 004 already applied)
drop policy if exists "authenticated_insert_vendor" on public.vendors;

create policy "authenticated_insert_vendor"
  on public.vendors for insert
  with check (auth.uid() is not null);
