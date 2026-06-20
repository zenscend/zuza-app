-- ============================================================
-- SCHEMA REFACTOR
-- 1. Rename profiles → users
-- 2. Replace user_role enum with a user_role lookup table
--    (UUID primary key)
-- 3. Update all functions, triggers, and RLS policies
-- ============================================================

-- ── Drop ALL policies that depend on profiles.role or the
--    old enum BEFORE touching any columns or types ──────────
drop policy if exists "users_select_own_profile"        on public.profiles;
drop policy if exists "users_update_own_profile"        on public.profiles;
drop policy if exists "admins_select_all_profiles"      on public.profiles;
drop policy if exists "admins_all_vendors"              on public.vendors;
drop policy if exists "vendors_select_own"              on public.vendors;
drop policy if exists "vendors_update_own"              on public.vendors;
drop policy if exists "authenticated_insert_vendor"     on public.vendors;
drop policy if exists "field_agents_select_own_vendors" on public.vendors;
drop policy if exists "field_agents_insert_vendors"     on public.vendors;
drop policy if exists "super_admins_manage_allowlist"   on public.admin_allowlist;

-- Drop functions that reference the enum so the type can be dropped later
drop function if exists public.get_my_role();
drop function if exists public.is_admin();

-- ── Rename old enum to free the name ──────────────────────
alter type public.user_role rename to user_role_enum;

-- ── user_role lookup table ─────────────────────────────────
create table public.user_role (
  id         uuid        not null default gen_random_uuid(),
  name       text        not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

-- Seed roles
insert into public.user_role (name) values
  ('Vendor'),
  ('Field Agent'),
  ('Admin'),
  ('Super Admin');

-- All authenticated users can read the lookup table
alter table public.user_role enable row level security;
create policy "user_role_select_all" on public.user_role for select using (true);

-- ── Add user_role_id to profiles ──────────────────────────
alter table public.profiles add column user_role_id uuid references public.user_role(id);

update public.profiles set user_role_id = (
  select id from public.user_role
  where name = case role::text
    when 'vendor'      then 'Vendor'
    when 'field_agent' then 'Field Agent'
    when 'admin'       then 'Admin'
    when 'super_admin' then 'Super Admin'
    else 'Vendor'
  end
);

alter table public.profiles alter column user_role_id set not null;

-- ── Drop the old role enum column ─────────────────────────
alter table public.profiles drop column role;

-- ── Rename profiles → users ───────────────────────────────
alter table public.profiles rename to users;
drop index if exists idx_profiles_role;
create index idx_users_role_id on public.users(user_role_id);

-- ── Update admin_allowlist: enum → FK ─────────────────────
alter table public.admin_allowlist add column role_id uuid references public.user_role(id);

update public.admin_allowlist set role_id = (
  select id from public.user_role
  where name = case role::text
    when 'vendor'      then 'Vendor'
    when 'field_agent' then 'Field Agent'
    when 'admin'       then 'Admin'
    when 'super_admin' then 'Super Admin'
    else 'Admin'
  end
);

alter table public.admin_allowlist alter column role_id set not null;
alter table public.admin_allowlist drop column role;

-- ── Drop old enum (all dependents are gone now) ───────────
drop type public.user_role_enum;

-- ── Recreate helper functions ─────────────────────────────
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ur.name
  from public.users u
  join public.user_role ur on u.user_role_id = ur.id
  where u.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select public.get_my_role() in ('Admin', 'Super Admin');
$$;

-- ── Recreate RLS policies ─────────────────────────────────

-- users table
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "admins_select_all_users"
  on public.users for select
  using (public.get_my_role() in ('Admin', 'Super Admin'));

-- vendors table
create policy "admins_all_vendors"
  on public.vendors for all
  using (public.is_admin())
  with check (public.is_admin());

create policy "vendors_select_own"
  on public.vendors for select
  using (email = auth.email());

create policy "vendors_update_own"
  on public.vendors for update
  using (email = auth.email())
  with check (email = auth.email());

create policy "authenticated_insert_vendor"
  on public.vendors for insert
  with check (auth.uid() is not null);

create policy "field_agents_select_own_vendors"
  on public.vendors for select
  using (
    public.get_my_role() = 'Field Agent'
    and onboarded_by = auth.uid()
  );

create policy "field_agents_insert_vendors"
  on public.vendors for insert
  with check (
    public.get_my_role() = 'Field Agent'
    and onboarded_by = auth.uid()
  );

-- admin_allowlist
create policy "super_admins_manage_allowlist"
  on public.admin_allowlist for all
  using (public.get_my_role() = 'Super Admin')
  with check (public.get_my_role() = 'Super Admin');

-- ── Rewrite handle_new_user trigger function ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  assigned_role_id uuid;
begin
  -- Auto-promote if email is in the allowlist
  select al.role_id into assigned_role_id
  from public.admin_allowlist al
  where al.email = new.email;

  -- Default to Vendor if not in allowlist
  if assigned_role_id is null then
    select id into assigned_role_id from public.user_role where name = 'Vendor';
  end if;

  insert into public.users (id, full_name, avatar_url, user_role_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    assigned_role_id
  );

  return new;
end;
$$;
