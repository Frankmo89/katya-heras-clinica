-- Migration: make bookings.status the single source of truth for
-- cancellation, harden confirm_booking, fix a UTC/Tijuana date bug.
-- Single transaction — if any statement fails, nothing here applies.
--
-- ============================================================================
-- BACKGROUND
-- ============================================================================
-- is_cancelled and status have been written independently since 0014 added
-- status: cancel_booking (0026/0033) sets both, but the admin panel's
-- updateBookingStatus only ever set status, never is_cancelled. That's why
-- production had rows with status = 'cancelled' but is_cancelled = false —
-- confirmed by hand: confirmed/false 4, cancelled/false 7,
-- confirmed/true 1 (that last one was today's manual fix).
--
-- Going forward, status is authoritative. is_cancelled is kept only because
-- 0012's anon RLS policy and some historical code reference it; a trigger
-- below keeps it mechanically in sync with status so nothing that still
-- reads is_cancelled can drift out of agreement again.
--
-- WHERE EACH FLAG IS WRITTEN TODAY (before this migration):
--   is_cancelled — only ever written by cancel_booking() (SQL, 0026/0033).
--                  No TypeScript/JS code writes it directly; every insert
--                  gets it from the column default (false).
--   status       — written by three places:
--                    1. cancel_booking() (SQL, 0026/0033) → 'cancelled'.
--                    2. src/app/admin/citas/page.tsx, updateBookingStatus()
--                       (~line 269) → 'completed' or 'cancelled', from the
--                       admin's per-booking action buttons.
--                    3. src/app/admin/citas/page.tsx, saveManualBooking()
--                       (~line 358) → 'confirmed', explicitly, when staff
--                       create a manual/phone booking.
--                  confirm_booking (0032) did NOT set it explicitly — it
--                  relied on the column default. Fixed below (point 2).
--
-- The admin panel's read side is updated in this same change (application
-- code, not SQL) to filter bookings by status instead of is_cancelled.
--
-- Not addressed here: src/app/admin/citas/page.tsx's saveManualBooking()
-- still queries available_slots without scoping to the chosen service, and
-- marks is_booked = true instead of removing the slot / going through
-- confirm_booking — so a manually-created booking gets no starts_at/ends_at
-- (invisible to the exclusion constraint) and its slot keeps showing as
-- bookable on the public site. That's a separate, pre-existing gap in the
-- admin manual-booking flow, flagged here but out of scope for this
-- migration.
-- ============================================================================

begin;

-- ── 1a. One-time fix: sync existing drift (status='cancelled' rows whose
--        is_cancelled never got flipped) ──────────────────────────────────
update public.bookings
set is_cancelled = true
where status = 'cancelled'
  and is_cancelled is distinct from true;

-- ── 1b. Trigger: is_cancelled always mirrors status, on every write ───────
create or replace function public.sync_is_cancelled_from_status()
returns trigger
language plpgsql
as $$
begin
  new.is_cancelled := (new.status = 'cancelled');
  return new;
end;
$$;

drop trigger if exists bookings_sync_is_cancelled on public.bookings;

create trigger bookings_sync_is_cancelled
  before insert or update on public.bookings
  for each row
  execute function public.sync_is_cancelled_from_status();

-- ── 1c. cancel_booking: write only status; the trigger above derives
--        is_cancelled — no more setting both by hand in two places ────────
create or replace function public.cancel_booking(ref text, email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  update public.bookings
  set status = 'cancelled'
  where booking_ref    = trim(ref)
    and patient_email  = trim(email)
    and status         <> 'cancelled';

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- ── 2. confirm_booking: reject a p_slot_start that isn't an existing
--       available_slots row for p_service_id, or that's already past;
--       insert status = 'confirmed' explicitly instead of relying on the
--       column default ──────────────────────────────────────────────────
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
  v_duration    integer;
  v_slot_end    timestamptz;
  v_ref         text;
  v_id          uuid;
  v_blocked     boolean;
  v_slot_exists boolean;
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

  if p_slot_start <= now() then
    return query select false, null::uuid, null::text, 'slot_unavailable';
    return;
  end if;

  select exists (
    select 1 from public.available_slots
    where service_id = p_service_id and start_time = p_slot_start
  ) into v_slot_exists;

  if not v_slot_exists then
    return query select false, null::uuid, null::text, 'slot_unavailable';
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
      service_id, date, time, starts_at, ends_at, status,
      patient_name, patient_email, patient_phone, notes, booking_ref
    ) values (
      p_service_id::text,
      (p_slot_start at time zone 'America/Tijuana')::date,
      to_char(p_slot_start at time zone 'America/Tijuana', 'HH24:MI'),
      p_slot_start,
      v_slot_end,
      'confirmed',
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

-- ── 3a. Regenerate-on-cancel trigger: fire strictly on the status
--        transition into 'cancelled' (status is now authoritative), and use
--        Tijuana-local dates — new.starts_at::date takes the UTC calendar
--        date, which during Tijuana evenings is already the next day, so a
--        booking cancelled in the evening could regenerate the wrong day's
--        slots ──────────────────────────────────────────────────────────
create or replace function public.regenerate_slots_after_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_active    boolean;
  v_now_cancelled boolean;
begin
  v_was_active    := (coalesce(old.status, '') <> 'cancelled');
  v_now_cancelled := (new.status = 'cancelled');

  if v_was_active and v_now_cancelled and new.starts_at is not null then
    perform public.generate_available_slots(
      (new.starts_at at time zone 'America/Tijuana')::date,
      (new.ends_at   at time zone 'America/Tijuana')::date
    );
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_regenerate_slots_on_cancel on public.bookings;

create trigger bookings_regenerate_slots_on_cancel
  after update on public.bookings
  for each row
  execute function public.regenerate_slots_after_cancel();

-- ── 3b. Exclusion constraint: rebuild against status only (now the single
--        source of truth), with coalesce so a future null status or
--        is_cancelled can't silently fall outside the WHERE predicate and
--        escape the overlap guarantee — a partial index/constraint only
--        protects rows where its predicate evaluates to true, and NULL is
--        not true ───────────────────────────────────────────────────────
alter table public.bookings drop constraint if exists bookings_no_overlap;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  )
  where (
    coalesce(status, '') <> 'cancelled'
    and starts_at is not null
  );

-- ── 3c. generate_available_slots: same coalesce guard on its own conflict
--        check (status only, not is_cancelled), and populate using
--        Tijuana's "today" instead of the server's (UTC) current_date —
--        0031's original self-populate call ran at whatever moment the
--        migration was executed, so during a Tijuana evening it could have
--        started one day late ─────────────────────────────────────────
create or replace function public.generate_available_slots(p_from date, p_to date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_service          record;
  v_day              date;
  v_dow              integer;
  v_exception        record;
  v_is_open          boolean;
  v_open_time        time;
  v_close_time       time;
  v_cursor           time;
  v_slot_start       timestamptz;
  v_slot_end         timestamptz;
  v_booking_conflict boolean;
  v_block_conflict   boolean;
  v_inserted         integer := 0;
  v_row_count        integer;
  v_step             interval := interval '30 minutes';
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
            where coalesce(b.status, '') <> 'cancelled'
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

-- Re-run with Tijuana's actual "today" to correct any boundary gap from
-- 0031's original UTC-based call. Idempotent (on conflict do nothing), so
-- safe even if there was no gap to fix.
select public.generate_available_slots(
  (now() at time zone 'America/Tijuana')::date,
  (now() at time zone 'America/Tijuana')::date + 60
);

commit;
