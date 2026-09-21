-- Migration: admin_create_booking RPC — replaces the admin panel's direct
-- insert into bookings for manual/phone bookings (saveManualBooking in
-- src/app/admin/citas/page.tsx).
--
-- The old flow queried available_slots for ANY service (not scoped to the
-- one being booked), inserted without starts_at/ends_at, and marked
-- is_booked = true instead of removing the slot — so a manual booking:
--   1. Left starts_at/ends_at null, making it invisible to the
--      bookings_no_overlap exclusion constraint (0028/0035) — no overlap
--      protection at all for staff-created bookings.
--   2. Never removed the slot from public availability, since neither the
--      public /reservar frontend nor confirm_booking has read is_booked
--      since the service-specific redesign — the slot kept showing as
--      bookable to patients even after staff filled it.
--
-- This function fixes both: it sets starts_at/ends_at like confirm_booking
-- does, relies on the same exclusion constraint for the actual overlap
-- guarantee (catching the race the same way), and deletes every
-- now-overlapping available_slots row across all services on success.
--
-- Deliberately different from confirm_booking:
--   - No available_slots existence check. Staff routinely book outside
--     published hours (early/late walk-ins, exceptions) — requiring a
--     pre-generated slot row would block exactly the bookings this form
--     exists for.
--   - No "must be in the future" check, for the same reason — staff may be
--     logging a booking taken over the phone for a time that's already
--     passed relative to when they get around to entering it.
--   - No is_active filter on the service — the old direct-insert code never
--     checked it either, so staff could already manually book a hidden/
--     retired service (e.g. a legacy offering kept for existing patients).
--     Keeping that; confirm_booking is the one that must stay
--     active-only, since that's the public-facing path.
--   - patient_email/patient_phone stay optional, matching the existing
--     manual-booking form (some walk-ins only give a name).
--
-- Granted to authenticated only (staff), not anon — this is not a
-- patient-facing function.

begin;

create or replace function public.admin_create_booking(
  p_service_id     uuid,
  p_slot_start     timestamptz,
  p_patient_name   text,
  p_patient_email  text default null,
  p_patient_phone  text default null,
  p_notes          text default null
)
returns table (success boolean, booking_id uuid, booking_ref text, error_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration integer;
  v_slot_end timestamptz;
  v_ref      text;
  v_id       uuid;
begin
  select duration_minutes into v_duration
    from public.services
    where id = p_service_id;

  if v_duration is null then
    return query select false, null::uuid, null::text, 'invalid_service';
    return;
  end if;

  if coalesce(trim(p_patient_name), '') = '' then
    return query select false, null::uuid, null::text, 'missing_fields';
    return;
  end if;

  v_slot_end := p_slot_start + make_interval(mins => v_duration);

  v_ref := 'KH-' || to_char(now(), 'YYYY') || '-'
           || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  begin
    insert into public.bookings (
      service_id, date, time, starts_at, ends_at, status, is_manual,
      patient_name, patient_email, patient_phone, notes, booking_ref
    ) values (
      p_service_id::text,
      (p_slot_start at time zone 'America/Tijuana')::date,
      to_char(p_slot_start at time zone 'America/Tijuana', 'HH24:MI'),
      p_slot_start,
      v_slot_end,
      'confirmed',
      true,
      trim(p_patient_name),
      nullif(trim(coalesce(p_patient_email, '')), ''),
      nullif(trim(coalesce(p_patient_phone, '')), ''),
      nullif(trim(coalesce(p_notes, '')), ''),
      v_ref
    )
    returning id into v_id;
  exception
    when exclusion_violation then
      return query select false, null::uuid, null::text, 'slot_overlap';
      return;
  end;

  -- Same cleanup as confirm_booking: remove every available_slots row (any
  -- service) whose window now overlaps this booking, so a longer manual
  -- booking can't leave a shorter, now-impossible slot still bookable.
  delete from public.available_slots a
  using public.services s
  where a.service_id = s.id
    and tstzrange(a.start_time, a.start_time + make_interval(mins => s.duration_minutes))
        && tstzrange(p_slot_start, v_slot_end);

  return query select true, v_id, v_ref, null::text;
end;
$$;

revoke all on function public.admin_create_booking(uuid, timestamptz, text, text, text, text) from public;
grant execute on function public.admin_create_booking(uuid, timestamptz, text, text, text, text) to authenticated;

commit;
