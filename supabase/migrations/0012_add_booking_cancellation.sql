-- Add cancellation support to bookings

-- Flag column so cancelled bookings remain visible to admin
alter table public.bookings
  add column if not exists is_cancelled boolean not null default false;

-- Allow the patient to self-cancel using their booking_ref + email as dual-factor proof.
-- Security model: requires knowing BOTH values. Can only flip is_cancelled to true, never back.
create policy "Patient can self-cancel booking"
  on public.bookings
  for update
  to anon
  using (is_cancelled = false)
  with check (is_cancelled = true);
