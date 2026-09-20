-- Migration: set clinic_schedule to Katya's actual hours.
--
-- clinic_schedule exists (0006_create_availability_tables.sql) but is
-- currently empty/stale on the live project — generate_available_slots()
-- (0031) reads it to know when the clinic is open, so without real rows
-- it would generate nothing. Sets the same hours as the admin's manual
-- 4-week stopgap insert: Mon–Fri 15:00–20:00, Sat–Sun 11:00–17:00,
-- America/Tijuana (the column values are plain `time`, interpreted as
-- Tijuana wall-clock time by generate_available_slots — there's no
-- timezone stored on this table itself).
--
-- day_of_week: 0 = Sunday, 1 = Monday, ... 6 = Saturday.
-- Upsert (on conflict do update) so this is safe to run whether or not
-- clinic_schedule already has rows for these days.

insert into public.clinic_schedule (day_of_week, is_open, open_time, close_time) values
  (0, true, '11:00', '17:00'),  -- Sunday
  (1, true, '15:00', '20:00'),  -- Monday
  (2, true, '15:00', '20:00'),  -- Tuesday
  (3, true, '15:00', '20:00'),  -- Wednesday
  (4, true, '15:00', '20:00'),  -- Thursday
  (5, true, '15:00', '20:00'),  -- Friday
  (6, true, '11:00', '17:00')   -- Saturday
on conflict (day_of_week) do update
  set is_open    = excluded.is_open,
      open_time  = excluded.open_time,
      close_time = excluded.close_time;
