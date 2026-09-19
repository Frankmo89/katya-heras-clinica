-- Diagnostic query — read-only, not a migration, safe to run any time.
--
-- Run this AFTER 0027_booking_time_range_backfill.sql (it needs
-- starts_at/ends_at populated) and BEFORE
-- 0028_booking_no_overlap_constraint.sql. That migration adds a database
-- constraint that rejects any two non-cancelled bookings with overlapping
-- time ranges — if any already exist, the ALTER TABLE will fail outright.
-- This lists them so you can resolve each pair by hand (cancel one side,
-- or fix a bad date/time) before adding the constraint.
--
-- Every pair is reported once (a.id < b.id) with both bookings' details
-- side by side.

select
  a.id            as booking_a_id,
  a.booking_ref   as booking_a_ref,
  a.patient_name  as booking_a_patient,
  a.starts_at     as booking_a_starts,
  a.ends_at       as booking_a_ends,
  b.id            as booking_b_id,
  b.booking_ref   as booking_b_ref,
  b.patient_name  as booking_b_patient,
  b.starts_at     as booking_b_starts,
  b.ends_at       as booking_b_ends
from public.bookings a
join public.bookings b
  on a.id < b.id
  and a.is_cancelled = false and a.status <> 'cancelled'
  and b.is_cancelled = false and b.status <> 'cancelled'
  and a.starts_at is not null and b.starts_at is not null
  and tstzrange(a.starts_at, a.ends_at) && tstzrange(b.starts_at, b.ends_at)
order by a.starts_at;
