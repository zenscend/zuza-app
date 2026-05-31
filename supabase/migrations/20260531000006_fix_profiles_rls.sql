-- ============================================================
-- FIX: Recursive RLS on profiles table
--
-- The "admins_select_all_profiles" policy used a subquery
-- against public.profiles from within a profiles RLS policy.
-- PostgreSQL evaluates RLS recursively which causes the read
-- to silently fail — the profile appears null to the app even
-- though the row exists.
--
-- Fix: create a SECURITY DEFINER function that reads the
-- current user's role while bypassing RLS, then use that in
-- the policy instead of the recursive subquery.
-- ============================================================

-- Helper: get the current authenticated user's role safely
-- SECURITY DEFINER bypasses RLS so there is no recursion.
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Drop the recursive policy
drop policy if exists "admins_select_all_profiles" on public.profiles;

-- Recreate using the non-recursive helper
create policy "admins_select_all_profiles"
  on public.profiles for select
  using (
    public.get_my_role() in ('admin', 'super_admin')
  );
