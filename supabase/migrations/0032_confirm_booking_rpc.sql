-- Migration: confirm_booking RPC — replaces the client's two-step
-- "insert into bookings, then best-effort update available_slots".
--
-- The old flow (still in the current /reservar code until the following
-- frontend change) does the insert and the slot update as two separate
-- requests from the browser, with a comment acknowledging the update is
-- "best-effort" — i.e. a known gap even for the same slot, let alone a
-- different service's overlapping slot. This function does both, plus the
-- actual availability check, in one atomic transaction.
--
-- Layered defenses, in order:
--   1. Reject up front if the requested window overlaps a blocked_slots
--      entry (app-level check).
--   2. Attempt the insert. If two requests for an overlapping window race
--      each other, the exclusion constraint from 0028 lets exactly one
--      INSERT succeed and raises exclusion_violation for the other —
--      caught below and returned as a normal `slot_taken` failure, not a
--      raw Postgres error.
--   3. On success, delete every available_slots row (any service, not
--      just the one just booked) whose own interval now overlaps this
--      booking — this is the step that actually prevents a 90-minute
--      booking from leaving a still-bookable 60-minute slot half-inside it.
--
-- Returns a single row rather than raising on the expected failure paths,
-- so the client can show a normal message instead of a generic 500.

create or replace function public.confirm_booking(
  p_service_id     uuid,
  p_slot_start     timestamptz,
  p_patient_name   text,
  p_patient_email  text,
  p_patient_phone  text,
  p_notes          text default null
)
returns table (success boolean, booking_id uuid, booking_ref text, error_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration   integer;
  v_slot_end   timestamptz;
  v_ref        text;
  v_id         uuid;
  v_blocked    boolean;
begin
  select duration_minutes into v_duration
    from public.services
    where id = p_service_id and is_active = true;

  if v_duration is null then
    return query select false, null::uuid, null::text, 'invalid_service';
    return;
  end if;

  if coalesce(trim(p_patient_name), '') = ''
     or coalesce(trim(p_patient_email), '') = ''
     or coalesce(trim(p_patient_phone), '') = '' then
    return query select false, null::uuid, null::text, 'missing_fields';
    return;
  end if;

  v_slot_end := p_slot_start + make_interval(mins => v_duration);

  select exists (
    select 1 from public.blocked_slots bs
    where tstzrange(
            (bs.blocked_date + bs.blocked_time) at time zone 'America/Tijuana',
            (bs.blocked_date + bs.blocked_time) at time zone 'America/Tijuana' + interval '30 minutes'
          ) && tstzrange(p_slot_start, v_slot_end)
  ) into v_blocked;

  if v_blocked then
    return query select false, null::uuid, null::text, 'slot_blocked';
    return;
  end if;

  v_ref := 'KH-' || to_char(now(), 'YYYY') || '-'
           || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));

  begin
    insert into public.bookings (
      service_id, date, time, starts_at, ends_at,
      patient_name, patient_email, patient_phone, notes, booking_ref
    ) values (
      p_service_id::text,
      (p_slot_start at time zone 'America/Tijuana')::date,
      to_char(p_slot_start at time zone 'America/Tijuana', 'HH24:MI'),
      p_slot_start,
      v_slot_end,
      trim(p_patient_name),
      trim(p_patient_email),
      trim(p_patient_phone),
      nullif(trim(coalesce(p_notes, '')), ''),
      v_ref
    )
    returning id into v_id;
  exception
    when exclusion_violation then
      return query select false, null::uuid, null::text, 'slot_taken';
      return;
  end;

  delete from public.available_slots a
  using public.services s
  where a.service_id = s.id
    and tstzrange(a.start_time, a.start_time + make_interval(mins => s.duration_minutes))
        && tstzrange(p_slot_start, v_slot_end);

  return query select true, v_id, v_ref, null::text;
end;
$$;

revoke all on function public.confirm_booking(uuid, timestamptz, text, text, text, text) from public;
grant execute on function public.confirm_booking(uuid, timestamptz, text, text, text, text) to anon;
