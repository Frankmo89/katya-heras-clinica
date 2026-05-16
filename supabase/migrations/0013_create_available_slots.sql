-- Whitelist-based availability: admin explicitly opens each appointment window.
-- Replaces the mathematical slot-generation from clinic_schedule + schedule_exceptions.

create table public.available_slots (
  id          uuid primary key default gen_random_uuid(),
  service_id  text,                          -- null = open for any service
  start_time  timestamptz not null,
  is_booked   boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint available_slots_unique unique (start_time)
);

alter table public.available_slots enable row level security;

-- Public visitors can only read future unbooked slots.
create policy "Public read unbooked slots"
  on public.available_slots
  for select to anon
  using (is_booked = false);

-- Anon can flip is_booked false → true when a patient confirms.
-- Only one direction allowed — they cannot un-book a slot.
create policy "Anon can mark slot booked"
  on public.available_slots
  for update to anon
  using (is_booked = false)
  with check (is_booked = true);

-- Admin has full access.
create policy "Authenticated full access"
  on public.available_slots
  for all to authenticated
  using (true)
  with check (true);
