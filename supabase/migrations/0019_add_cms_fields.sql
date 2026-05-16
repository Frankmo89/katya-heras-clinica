-- Migration: add CMS content fields to clinic_settings

alter table public.clinic_settings
  -- Homepage: Philosophy section
  add column if not exists philosophy_image_url    text,
  add column if not exists testimonial_quote       text,
  add column if not exists testimonial_author      text,
  -- About page: Practice section
  add column if not exists about_practice_image_url text,
  add column if not exists about_practice_text      text,
  -- About page: Gallery
  add column if not exists about_gallery_1_url      text,
  add column if not exists about_gallery_2_url      text,
  add column if not exists about_gallery_3_url      text,
  -- About page: Location
  add column if not exists about_location_image_url text;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
