-- Migration: regenerate freed slots immediately when a booking is
-- cancelled, from either cancellation path in this app.
--
-- There are two existing, historically inconsistent cancellation flows:
--   - The patient self-cancel RPC (cancel_booking, 0026) sets is_cancelled
--     = true only.
--   - The admin panel (admin/citas's updateBookingStatus) sets status =
--     'cancelled' only, and never touches is_cancelled.
-- Rather than unify those two columns (out of scope here, and either flag
-- already correctly drops a row out of the exclusion constraint's
-- protected set from 0028), a single AFTER UPDATE trigger reacts to
-- *either* transition and regenerates slots for that booking's day(s) —
-- so this doesn't require changing admin/citas's code at all, and covers
-- any future cancellation path the same way.
--
-- cancel_booking is updated to also set status = 'cancelled' (previously
-- only is_cancelled), purely for consistency with the admin panel's own
-- status column — not required for the trigger to fire, which checks
-- either flag.

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
  set is_cancelled = true,
      status       = 'cancelled'
  where booking_ref    = trim(ref)
    and patient_email  = trim(email)
    and is_cancelled   = false;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

create or replace function public.regenerate_slots_after_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_active boolean;
  v_now_cancelled boolean;
begin
  v_was_active    := (old.is_cancelled = false and old.status <> 'cancelled');
  v_now_cancelled := (new.is_cancelled = true  or  new.status = 'cancelled');

  if v_was_active and v_now_cancelled and new.starts_at is not null then
    perform public.generate_available_slots(new.starts_at::date, new.ends_at::date);
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_regenerate_slots_on_cancel on public.bookings;

create trigger bookings_regenerate_slots_on_cancel
  after update on public.bookings
  for each row
  execute function public.regenerate_slots_after_cancel();
