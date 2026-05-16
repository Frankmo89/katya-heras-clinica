-- Migration: create shop_settings table
-- Same singleton pattern as clinic_settings (CHECK id = 1).

create table if not exists public.shop_settings (
  id                      integer        primary key check (id = 1),
  shipping_enabled        boolean        not null default true,
  shipping_cost           numeric(10, 2) not null default 150.00,
  free_shipping_threshold numeric(10, 2) not null default 1500.00,
  pickup_enabled          boolean        not null default true,
  pickup_instructions     text
);

alter table public.shop_settings enable row level security;

-- Storefront and cart pages need read access without authentication
create policy "Anon can read shop settings"
  on public.shop_settings for select
  to anon
  using (true);

-- Only Katya (authenticated) can update
create policy "Authenticated can manage shop settings"
  on public.shop_settings for all
  to authenticated
  using (true)
  with check (true);

-- Seed: shipping $150 MXN, free over $1500 MXN, pickup enabled
insert into public.shop_settings (
  id,
  shipping_enabled,
  shipping_cost,
  free_shipping_threshold,
  pickup_enabled
) values (
  1,
  true,
  150.00,
  1500.00,
  true
) on conflict (id) do nothing;
