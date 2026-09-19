-- Migration: remove two overly-permissive anon RLS policies.
--
-- Confirmed live via pg_policies (not inferred — see the audit-methodology
-- note in conversation for why my own write-based tests gave a false
-- negative on the second one):
--
--   1. "anon_insert_patients" on public.patients (for insert to anon
--      with check (true)) — from 0015_create_patients_table.sql.
--   2. "Patient can self-cancel booking" on public.bookings (for update
--      to anon using (is_cancelled = false) with check (is_cancelled = true))
--      — from 0012_add_booking_cancellation.sql.
--
-- ── Why #1 is safe to drop ───────────────────────────────────────────────
-- Patient records are created by bookings_sync_patient_trigger (also from
-- 0015), whose function sync_patient_from_booking() is `security definer`
-- — it runs with its owner's privileges, bypassing RLS on public.patients
-- entirely, independent of this policy. Verified live: a booking insert
-- executed with no patients-table privileges at all still produced a
-- patients row via the trigger. Without this fix, anyone holding the
-- public anon key (published in every client bundle) could call
--   supabase.from('patients').insert({ full_name: '...', ... })
-- directly, writing arbitrary rows into the clinical patients table with
-- no relation to a real booking.
--
-- ── Why #2 is safe to drop ───────────────────────────────────────────────
-- The policy's own comment claimed "requires knowing BOTH values [booking_ref
-- + email] as dual-factor proof," but its using/with check clauses never
-- reference booking_ref or patient_email at all — RLS enforces row
-- visibility, not whatever WHERE clause the client happens to send. As
-- written, ANY anonymous request could flip is_cancelled to true on ANY
-- booking (or all of them in one call), regardless of whose it is. This is
-- replaced by a proper security definer RPC — see
-- 0026_cancel_booking_rpc.sql — that binds both values to the same row
-- inside the function itself, where the client's WHERE clause can't be
-- bypassed.

drop policy if exists "anon_insert_patients" on public.patients;
drop policy if exists "Patient can self-cancel booking" on public.bookings;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
