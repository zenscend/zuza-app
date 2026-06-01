-- ============================================================
-- FIELD AGENT ROLE  — Part 2 of 2
--
-- Run AFTER Part 1 has been committed (separate query execution).
-- Adds RLS policies for field agents on the vendors table.
-- ============================================================

-- Field agents: SELECT only vendors they personally onboarded
create policy "field_agents_select_own_vendors"
  on public.vendors for select
  using (
    public.get_my_role() = 'field_agent'
    and onboarded_by = auth.uid()
  );

-- Field agents: INSERT vendors (must set themselves as onboarded_by)
create policy "field_agents_insert_vendors"
  on public.vendors for insert
  with check (
    public.get_my_role() = 'field_agent'
    and onboarded_by = auth.uid()
  );
