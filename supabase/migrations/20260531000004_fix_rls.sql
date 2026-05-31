-- ============================================================
-- FIX: Replace deprecated auth.role() in vendors INSERT policy
-- auth.role() = 'authenticated' no longer works reliably in
-- Supabase. Replaced with auth.uid() is not null which is the
-- correct way to check for an authenticated session.
-- ============================================================

drop policy if exists "authenticated_insert_vendor" on public.vendors;

create policy "authenticated_insert_vendor"
  on public.vendors for insert
  with check (auth.uid() is not null);
