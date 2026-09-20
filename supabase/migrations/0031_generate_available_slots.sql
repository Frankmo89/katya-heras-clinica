-- Migration: generate_available_slots(from, to) — the core slot generator.
--
-- For each active service, for each day in [p_from, p_to], reads open
-- hours from schedule_exceptions (if that exact date has one) or
-- clinic_schedule (by day of week) otherwise, walks the open window in
-- 30-minute steps, and inserts a candidate (service_id, start_time) row
-- for every step where [start, start + service.duration_minutes) doesn't
-- overlap an existing non-cancelled booking or a blocked_slots entry.
--
-- Called from four places:
--   1. Immediately below, once, as part of this migration — see the run-
--      order note at the bottom of this file for why that matters.
--   2. A nightly job (see 0034 for the pg_cron schedule, or the Vercel
--      Cron fallback route) with a wide window (today .. today+60).
--   3. The bookings-regenerate-on-cancel trigger (0033), with a narrow
--      window covering just the freed booking's own day(s).
--   4. On demand from the admin schedule editor, right after saving a
--      change to clinic_schedule/schedule_exceptions, with a wide window —
--      so a schedule edit shows up on /reservar immediately rather than
--      waiting for the next nightly run.
--
-- Idempotent: re-running over the same range only fills in gaps
-- (on conflict do nothing on the (service_id, start_time) unique
-- constraint from 0030) — it never removes a slot. Removal only ever
-- happens inside confirm_booking (0032), when an actual booking is made.
--
-- Blocked_slots has no duration of its own (it's a single date+time
-- point, from before slots were duration-aware) — treated here as
-- blocking a fixed 30-minute window starting at that time, matching the
-- step size below.

create or replace function public.generate_available_slots(p_from date, p_to date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service         record;
  v_day             date;
  v_dow             integer;
  v_exception       record;
  v_is_open         boolean;
  v_open_time       time;
  v_close_time      time;
  v_cursor          time;
  v_slot_start      timestamptz;
  v_slot_end        timestamptz;
  v_booking_conflict boolean;
  v_block_conflict   boolean;
  v_inserted        integer := 0;
  v_row_count       integer;
  v_step            interval := interval '30 minutes';
begin
  for v_service in
    select id, duration_minutes
    from public.services
    where is_active = true and duration_minutes is not null and duration_minutes > 0
  loop
    v_day := p_from;
    while v_day <= p_to loop
      v_dow := extract(dow from v_day);
      v_is_open := null;
      v_open_time := null;
      v_close_time := null;

      select * into v_exception
        from public.schedule_exceptions
        where exception_date = v_day;

      if found then
        if v_exception.is_closed then
          v_is_open := false;
        else
          v_is_open := true;
          v_open_time := v_exception.open_time;
          v_close_time := v_exception.close_time;
        end if;
      else
        select cs.is_open, cs.open_time, cs.close_time
          into v_is_open, v_open_time, v_close_time
          from public.clinic_schedule cs
          where cs.day_of_week = v_dow;
      end if;

      if coalesce(v_is_open, false) and v_open_time is not null and v_close_time is not null then
        v_cursor := v_open_time;
        while v_cursor + make_interval(mins => v_service.duration_minutes) <= v_close_time loop
          v_slot_start := (v_day + v_cursor) at time zone 'America/Tijuana';
          v_slot_end   := v_slot_start + make_interval(mins => v_service.duration_minutes);

          select exists (
            select 1 from public.bookings b
            where b.is_cancelled = false
              and b.status <> 'cancelled'
              and b.starts_at is not null
              and tstzrange(b.starts_at, b.ends_at) && tstzrange(v_slot_start, v_slot_end)
          ) into v_booking_conflict;

          v_block_conflict := false;
          if not v_booking_conflict then
            select exists (
              select 1 from public.blocked_slots bs
              where tstzrange(
                      (bs.blocked_date + bs.blocked_time) at time zone 'America/Tijuana',
                      (bs.blocked_date + bs.blocked_time) at time zone 'America/Tijuana' + v_step
                    ) && tstzrange(v_slot_start, v_slot_end)
            ) into v_block_conflict;
          end if;

          if not v_booking_conflict and not v_block_conflict then
            insert into public.available_slots (service_id, start_time)
            values (v_service.id, v_slot_start)
            on conflict (service_id, start_time) do nothing;
            get diagnostics v_row_count = row_count;
            v_inserted := v_inserted + v_row_count;
          end if;

          v_cursor := v_cursor + v_step;
        end loop;
      end if;

      v_day := v_day + 1;
    end loop;
  end loop;

  return v_inserted;
end;
$$;

revoke all on function public.generate_available_slots(date, date) from public;
grant execute on function public.generate_available_slots(date, date) to authenticated;

-- Populate the next 60 days right now, as part of this migration. Without
-- this call, available_slots is empty from the moment 0030 deleted the old
-- rows until whenever the nightly job or an admin next happens to run this
-- function — during which /reservar would show zero slots for every
-- service, for anyone who visits.
select public.generate_available_slots(current_date, current_date + 60);

-- ============================================================================
-- RUN ORDER — do not deploy the new frontend code (the /reservar rewrite
-- that filters available_slots by the selected service and calls
-- confirm_booking) until every migration through this one has been run,
-- in order: 0027, [resolve overlaps], 0028, 0029, 0030, 0031.
--
-- What breaks if the code deploys first:
--   - Before 0030 runs: available_slots still has the stopgap rows with
--     service_id = null. The new code queries
--     `.eq('service_id', selectedServiceId)`, which never matches a NULL
--     column in SQL — every service shows zero slots.
--   - After 0030 but before this file's populate call above: 0030 already
--     deleted those rows, so the table is empty outright — same zero-slots
--     result, for the same reason (nothing to match).
--   - Regardless of available_slots: the new code also calls
--     `.rpc('confirm_booking', ...)` on submit. Until 0032 has run, that
--     function doesn't exist yet — every booking attempt fails outright,
--     not just the slot list.
-- ============================================================================
