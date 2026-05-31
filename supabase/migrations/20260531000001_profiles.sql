-- ============================================================
-- PROFILES TABLE
-- Extends auth.users with app-specific data. Auto-created via
-- trigger on new user signup so the app never has to do it.
-- ============================================================

create type public.user_role as enum ('vendor', 'admin', 'super_admin');
create type public.billing_status as enum ('free', 'active', 'past_due', 'cancelled');

create table public.profiles (
  id             uuid        not null references auth.users(id) on delete cascade,
  full_name      text,
  avatar_url     text,
  phone_number   text,
  role           public.user_role    not null default 'vendor',
  billing_status public.billing_status not null default 'free',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  primary key (id)
);

-- Index for admin queries that filter by role
create index idx_profiles_role on public.profiles(role);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;

-- Users read and update their own profile
create policy "users_select_own_profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users_update_own_profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can read all profiles (for user management)
create policy "admins_select_all_profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    )
  );
