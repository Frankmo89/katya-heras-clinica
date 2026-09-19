-- Migration: proper self-cancel booking RPC.
--
-- Replaces the anon RLS policy dropped in 0025 ("Patient can self-cancel
-- booking"), which never actually bound booking_ref/patient_email to the
-- row it let you flip — any anonymous request could cancel any booking.
--
-- This function binds both values to the SAME row atomically inside the
-- WHERE clause, where the caller has no way to bypass it (unlike an RLS
-- policy, which only controls row visibility — the actual filtering here
-- happens inside the function body, not in whatever WHERE clause a client
-- sends). It returns a plain boolean and never distinguishes "wrong email"
-- from "ref doesn't exist" from "already cancelled" — all three produce
-- `false`, so the function can't be used to probe for the existence of a
-- booking_ref.
--
-- security definer: needs to write to bookings without any anon UPDATE
-- policy existing at all (0025 removed the only one). Runs as the
-- function owner, which is safe here because the only write this function
-- can ever perform is "set is_cancelled = true on a row matching both
-- caller-supplied values, and only if it isn't already cancelled" — there
-- is no way to parameterize it into doing anything else.

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
  set is_cancelled = true
  where booking_ref    = trim(ref)
    and patient_email  = trim(email)
    and is_cancelled   = false;

  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

-- Postgres grants EXECUTE on new functions to PUBLIC by default — revoke
-- that explicitly, then grant only to the role that needs it. Staff
-- already have direct UPDATE access via the existing "Authenticated users
-- can manage bookings" policy (0001_create_bookings.sql) and don't need
-- this RPC.
revoke all on function public.cancel_booking(text, text) from public;
grant execute on function public.cancel_booking(text, text) to anon;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
