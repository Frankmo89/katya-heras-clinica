-- Migration: add hero appearance fields to clinic_settings
-- and create the public_assets storage bucket with RLS policies.

-- ── 1. New columns on clinic_settings ─────────────────────────────────────────
alter table public.clinic_settings
  add column if not exists hero_title     text,
  add column if not exists hero_subtitle  text,
  add column if not exists hero_image_url text;

-- ── 2. Storage bucket: public_assets ──────────────────────────────────────────
-- The bucket is marked public so asset URLs are accessible without auth.
insert into storage.buckets (id, name, public)
values ('public_assets', 'public_assets', true)
on conflict (id) do nothing;

-- ── 3. RLS policies on storage.objects for the new bucket ─────────────────────

-- Any visitor can read/view assets
create policy "public_assets: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'public_assets');

-- Only authenticated users (Katya) can upload new files
create policy "public_assets: auth insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'public_assets');

-- Only authenticated users can replace / overwrite existing files
create policy "public_assets: auth update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'public_assets');

-- Only authenticated users can delete files
create policy "public_assets: auth delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'public_assets');

-- ── 4. Reload PostgREST schema cache ──────────────────────────────────────────
notify pgrst, 'reload schema';
