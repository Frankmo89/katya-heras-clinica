-- Migration: create the "service-images" and "shop-images" Storage buckets
-- and their RLS policies. Safe to run more than once.
--
-- Root cause of "new row violates row-level security policy" on photo
-- upload in /admin/servicios and /admin/tienda: the app code
-- (uploadToStorage in both pages) uploads to buckets named
-- "service-images" and "shop-images". Only "public_assets" (see
-- 0018_add_hero_settings.sql) ever had matching RLS policies — whether or
-- not "service-images"/"shop-images" already existed as buckets (e.g.
-- created by hand in the dashboard), storage.objects has RLS enabled by
-- default, and with no bucket-specific policy every insert was rejected.
-- This migration doesn't assume either way: bucket creation is a no-op if
-- they're already there, and every policy is dropped-and-recreated so
-- re-running this file is always safe.
--
-- Policy shape mirrors the working "public_assets" bucket: public read,
-- authenticated (= clinic staff — this project has no separate admin
-- role/profiles table; every Supabase Auth user is clinic staff, the
-- same convention already used by 0009/0010) can insert/update/delete.
--
-- Upsert coverage: neither upload flow currently calls .upload() with
-- upsert:true for these two buckets (servicios/nuevo, servicios/[id], and
-- tienda/nuevo all generate a fresh random file path per upload), so SELECT
-- and UPDATE aren't strictly required for that reason today. They're
-- granted anyway, matching public_assets, so an upsert-based flow added
-- later (e.g. a "replace image in place" feature) works without another
-- migration.

-- ── 1. Buckets — no-op if they already exist ─────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('service-images', 'service-images', true),
  ('shop-images',     'shop-images',    true)
on conflict (id) do nothing;

-- ── 2. service-images policies ───────────────────────────────────────────────
drop policy if exists "service-images: public read"   on storage.objects;
drop policy if exists "service-images: auth insert"    on storage.objects;
drop policy if exists "service-images: auth update"    on storage.objects;
drop policy if exists "service-images: auth delete"    on storage.objects;

create policy "service-images: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'service-images');

create policy "service-images: auth insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'service-images');

create policy "service-images: auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'service-images')
  with check (bucket_id = 'service-images');

create policy "service-images: auth delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'service-images');

-- ── 3. shop-images policies ──────────────────────────────────────────────────
drop policy if exists "shop-images: public read"   on storage.objects;
drop policy if exists "shop-images: auth insert"    on storage.objects;
drop policy if exists "shop-images: auth update"    on storage.objects;
drop policy if exists "shop-images: auth delete"    on storage.objects;

create policy "shop-images: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'shop-images');

create policy "shop-images: auth insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'shop-images');

create policy "shop-images: auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'shop-images')
  with check (bucket_id = 'shop-images');

create policy "shop-images: auth delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'shop-images');

-- ── 4. Reload PostgREST schema cache ──────────────────────────────────────────
notify pgrst, 'reload schema';
