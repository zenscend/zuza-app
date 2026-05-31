-- ============================================================
-- VENDOR PRODUCT LINES
-- Replaces the flat estimated_monthly_spend + primary_products
-- with a structured product_lines JSONB column so each product
-- can carry its own spend estimate.
-- Schema: [{ name: string, monthly_spend?: number }]
-- ============================================================

alter table public.vendors
  add column if not exists product_lines jsonb not null default '[]'::jsonb;
