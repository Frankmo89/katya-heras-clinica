-- Diagnostic query — read-only, not a migration, safe to run any time.
-- Self-contained: computes each booking's time range from date + time +
-- services.duration_minutes directly, so it works BEFORE 0027 has added
-- starts_at/ends_at (this is meant to be your very first step, before any
-- migration runs).
--
-- If this returns zero rows, go straight to the combined 0027-0033 script.
-- If it returns rows, resolve each pair (cancel one side, or fix a bad
-- date/time) before running that script — the exclusion constraint it adds
-- (0028) will otherwise fail outright on any pair still overlapping.
--
-- Every pair is reported once (a.id < b.id) with both bookings' details
-- side by side. Same timezone assumption as the migrations: America/Tijuana.

select
  a.id            as booking_a_id,
  a.booking_ref   as booking_a_ref,
  a.patient_name  as booking_a_patient,
  (a.date + a.time::time) at time zone 'America/Tijuana' as booking_a_starts,
  ((a.date + a.time::time) at time zone 'America/Tijuana')
    + make_interval(mins => sa.duration_minutes)         as booking_a_ends,
  b.id            as booking_b_id,
  b.booking_ref   as booking_b_ref,
  b.patient_name  as booking_b_patient,
  (b.date + b.time::time) at time zone 'America/Tijuana' as booking_b_starts,
  ((b.date + b.time::time) at time zone 'America/Tijuana')
    + make_interval(mins => sb.duration_minutes)         as booking_b_ends
from public.bookings a
join public.services sa on sa.id::text = a.service_id
join public.bookings b on b.id > a.id
join public.services sb on sb.id::text = b.service_id
where a.is_cancelled = false and a.status <> 'cancelled'
  and b.is_cancelled = false and b.status <> 'cancelled'
  and tstzrange(
        (a.date + a.time::time) at time zone 'America/Tijuana',
        ((a.date + a.time::time) at time zone 'America/Tijuana')
          + make_interval(mins => sa.duration_minutes)
      ) && tstzrange(
        (b.date + b.time::time) at time zone 'America/Tijuana',
        ((b.date + b.time::time) at time zone 'America/Tijuana')
          + make_interval(mins => sb.duration_minutes)
      )
order by 4;
