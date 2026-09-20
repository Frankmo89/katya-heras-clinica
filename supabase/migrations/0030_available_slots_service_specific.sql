-- Migration: available_slots becomes always service-specific.
--
-- Today service_id is nullable ("null = open for any service", per
-- 0013's own comment) and the unique constraint is on start_time ALONE —
-- meaning the table physically cannot hold a 15:00 candidate for Service A
-- and a separate 15:00 candidate for Service B at the same time. That
-- can't work once slots are generated per-service (a 90-minute service and
-- a 60-minute service starting at the same time occupy different-length
-- windows, so they need independent rows).
--
-- This drops the old constraint, removes any existing "any service" or
-- manually-inserted rows (they predate the per-service model — including
-- the admin's 4-week stopgap insert — and will be regenerated correctly by
-- generate_available_slots(), see 0031), and makes service_id a real
-- foreign key.
--
-- IMPORTANT — this migration empties the table (see the delete below).
-- Do not deploy the new /reservar frontend code until AFTER 0031 has run
-- (0031 both defines generate_available_slots and immediately calls it) —
-- see the run-order note at the end of 0031 for exactly what breaks if you
-- deploy first.

alter table public.available_slots drop constraint if exists available_slots_unique;

delete from public.available_slots where service_id is null;

-- If this next statement fails, some remaining service_id value isn't a
-- valid uuid — run `select distinct service_id from public.available_slots`
-- first to see what's there before this migration, if you want to check.
alter table public.available_slots
  alter column service_id type uuid using service_id::uuid,
  alter column service_id set not null;

alter table public.available_slots
  add constraint available_slots_service_fk
  foreign key (service_id) references public.services(id) on delete cascade;

alter table public.available_slots
  add constraint available_slots_unique unique (service_id, start_time);
