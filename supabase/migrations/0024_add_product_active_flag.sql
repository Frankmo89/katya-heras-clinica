-- Migration: add is_active flag to products
--
-- Same purpose as 0022_add_service_active_flag.sql: lets /tienda read
-- straight from the "products" table (replacing the hardcoded
-- SHOP_PRODUCTS catalog in src/data/shop.ts) while still letting staff hide
-- a product without deleting it.

alter table public.products
  add column if not exists is_active boolean not null default true;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
