-- ============================================================
-- VENDORS TABLE
-- Core entity. Vendors can be created by admins (field
-- onboarding) or by the vendor themselves (self-serve).
-- ============================================================

create type public.vendor_status as enum ('pending', 'active', 'inactive', 'rejected');
create type public.business_type as enum ('kota_outlet', 'chisanyama', 'street_food', 'spaza_shop', 'other');
create type public.primary_product as enum ('cooking_oil', 'potatoes', 'other');

create table public.vendors (
  id                       uuid        not null default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- Business info
  business_name            text        not null,
  business_type            public.business_type not null,

  -- Owner contact
  owner_name               text        not null,
  phone_number             text        not null,
  email                    text,

  -- Location
  street_address           text,
  suburb                   text,
  city                     text        not null,
  province                 text,
  coordinates              point,       -- (longitude, latitude) for future map features

  -- Products & spend
  primary_products         public.primary_product[] not null default '{}',
  estimated_monthly_spend  numeric(12, 2),

  -- Status & admin tracking
  status                   public.vendor_status not null default 'pending',
  onboarded_by             uuid references public.profiles(id) on delete set null,
  notes                    text,

  -- Zuza Wallet (Phase 2)
  wallet_balance           numeric(12, 2) not null default 0.00,

  primary key (id)
);

-- Indexes for common query patterns
create index idx_vendors_status      on public.vendors(status);
create index idx_vendors_onboarded_by on public.vendors(onboarded_by);
create index idx_vendors_city        on public.vendors(city);
create index idx_vendors_created_at  on public.vendors(created_at desc);

create trigger on_vendors_updated
  before update on public.vendors
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.vendors enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- Admins can do everything
create policy "admins_all_vendors"
  on public.vendors for all
  using (public.is_admin())
  with check (public.is_admin());

-- Vendors can view and update only their own record
-- (matched by email since vendors may not have a profiles row yet at onboarding time)
create policy "vendors_select_own"
  on public.vendors for select
  using (
    email = (select email from auth.users where id = auth.uid())
  );

create policy "vendors_update_own"
  on public.vendors for update
  using (
    email = (select email from auth.users where id = auth.uid())
  )
  with check (
    email = (select email from auth.users where id = auth.uid())
  );

-- Authenticated users can insert (self-serve onboarding)
create policy "authenticated_insert_vendor"
  on public.vendors for insert
  with check (auth.role() = 'authenticated');
