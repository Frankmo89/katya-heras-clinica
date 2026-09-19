-- Migration: add is_active flag to services
--
-- Needed so the public booking flow (/reservar) can read its service catalog
-- from the same "services" table as /servicios instead of a hardcoded list,
-- while still letting staff hide a service from booking/browsing without
-- deleting it (which would break historical bookings and detail-page links).

alter table public.services
  add column if not exists is_active boolean not null default true;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
