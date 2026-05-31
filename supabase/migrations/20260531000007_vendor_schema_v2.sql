-- ============================================================
-- VENDOR SCHEMA V2
-- Adds operational intelligence fields captured during onboarding:
-- tech infrastructure, order scale, stock sourcing, comms prefs.
-- All columns are nullable — safe to run against existing rows.
-- ============================================================

alter table public.vendors
  -- Technical infrastructure
  add column if not exists has_pos               boolean,
  add column if not exists pos_provider          text,
  add column if not exists payment_methods       text[] not null default '{}',

  -- Operational scale
  add column if not exists monthly_order_volume  text,

  -- Stock sourcing (how they currently buy stock)
  add column if not exists stock_order_method    text,

  -- Location extras
  add column if not exists trading_spot          text,

  -- Communication preferences
  add column if not exists preferred_contact     text[] not null default '{}',

  -- Additional products beyond the quick-select enum
  add column if not exists additional_products   text;
