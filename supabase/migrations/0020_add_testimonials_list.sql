-- Migration: add testimonials_list (jsonb array) to clinic_settings
-- Replaces the single testimonial_quote / testimonial_author columns
-- with a dynamic ordered list of { quote, author } objects.

alter table public.clinic_settings
  add column if not exists testimonials_list jsonb not null default '[]'::jsonb;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
