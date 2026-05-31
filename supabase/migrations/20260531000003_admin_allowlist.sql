-- ============================================================
-- ADMIN ALLOWLIST
-- Pre-approved emails that are auto-promoted on sign-up.
-- To add more admins: INSERT INTO public.admin_allowlist.
-- No code change required.
-- ============================================================

create table public.admin_allowlist (
  email      text             not null primary key,
  role       public.user_role not null default 'admin',
  created_at timestamptz      not null default now()
);

-- Seed initial admins
insert into public.admin_allowlist (email, role) values
  ('bongani@zuzatech.com', 'super_admin');

-- Only super_admins can view or modify the allowlist
alter table public.admin_allowlist enable row level security;

create policy "super_admins_manage_allowlist"
  on public.admin_allowlist for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

-- ============================================================
-- UPDATE TRIGGER — check allowlist on every new sign-up
-- Replaces the version from migration 001.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  assigned_role public.user_role := 'vendor';
begin
  -- Auto-promote if email is in the allowlist
  select al.role into assigned_role
  from public.admin_allowlist al
  where al.email = new.email;

  if assigned_role is null then
    assigned_role := 'vendor';
  end if;

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    assigned_role
  );

  return new;
end;
$$;

-- ============================================================
-- RETROACTIVE PROMOTION
-- Promotes any users who already signed up and are in the
-- allowlist. Safe to run multiple times (idempotent).
-- ============================================================

update public.profiles p
set role = al.role
from public.admin_allowlist al
join auth.users u on lower(u.email) = lower(al.email)
where p.id = u.id
  and p.role != al.role;
