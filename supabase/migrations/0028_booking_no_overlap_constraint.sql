-- Migration: reject any overlap between two non-cancelled bookings, at
-- the database level. Step 2 of 2 — see
-- 0027_booking_time_range_backfill.sql for the columns this depends on.
--
-- An application-level check (confirm_booking, 0032) is necessary but not
-- sufficient on its own: two simultaneous booking requests can both pass
-- an app-level "is this slot free?" check before either has written its
-- row. Only a constraint enforced atomically as part of the INSERT itself
-- closes that race — this is that constraint.
--
-- ============================================================================
-- BEFORE running this file: run supabase/queries/find_overlapping_bookings.sql
-- and resolve every pair it returns. If any non-cancelled bookings still
-- overlap, this ALTER TABLE fails immediately (Postgres validates existing
-- rows against a new exclusion constraint the same way it would a new
-- unique constraint).
-- ============================================================================

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  )
  where (is_cancelled = false and status <> 'cancelled' and starts_at is not null);
