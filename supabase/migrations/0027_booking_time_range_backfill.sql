-- Migration: add starts_at/ends_at to bookings and backfill existing rows.
-- Step 1 of 2 for preventing overlapping bookings — see
-- 0028_booking_no_overlap_constraint.sql for the actual guarantee.
--
-- date (date) + time ("HH:MM" text) only ever existed for display; there's
-- no stored "when does this booking end," so nothing in the database can
-- check whether two bookings overlap. starts_at/ends_at are real, explicit
-- columns (not a generated column — Postgres GENERATED ALWAYS AS can't
-- join to services.duration_minutes) populated here for existing rows and
-- by confirm_booking (0032) going forward. date/time are untouched;
-- nothing that reads them today needs to change.
--
-- Clinic timezone assumed throughout this and the following migrations:
-- America/Tijuana.
--
-- ============================================================================
-- BEFORE running this file: run supabase/queries/find_overlapping_bookings.sql
-- and resolve (e.g. cancel one side of) any overlapping pair it finds. This
-- migration only backfills columns — it's safe regardless. The NEXT one
-- (0028) adds a constraint that will fail outright if any non-cancelled
-- bookings still overlap after backfill, so check first.
-- ============================================================================

alter table public.bookings
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at   timestamptz;

-- (date + time::time) is a plain "timestamp without time zone"; `at time
-- zone 'America/Tijuana'` is what interprets that naive value as Tijuana
-- wall-clock time and converts it to a real UTC timestamptz.
update public.bookings b
set
  starts_at = (b.date + b.time::time) at time zone 'America/Tijuana',
  ends_at   = ((b.date + b.time::time) at time zone 'America/Tijuana')
              + make_interval(mins => s.duration_minutes)
from public.services s
where s.id::text = b.service_id
  and b.starts_at is null;

-- Run this after applying: any row here has an unknown/legacy service_id
-- and couldn't be backfilled — it won't be protected by 0028's constraint.
--   select id, service_id, date, time from public.bookings where starts_at is null;
