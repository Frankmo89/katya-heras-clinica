-- Migration: create availability tables (clinic_schedule, schedule_exceptions)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- or via: supabase db push

-- ── 1. clinic_schedule ────────────────────────────────────────────────────
-- Stores the standard weekly hours for the clinic.
-- day_of_week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday

create table if not exists public.clinic_schedule (
  id           uuid    primary key default gen_random_uuid(),
  day_of_week  integer not null unique check (day_of_week >= 0 and day_of_week <= 6),
  is_open      boolean not null    default false,
  open_time    time,
  close_time   time
);

alter table public.clinic_schedule enable row level security;

-- Public visitors can read the schedule (needed for the booking page)
create policy "Anon can read clinic schedule"
  on public.clinic_schedule for select
  to anon
  using (true);

-- Only authenticated users (Katya) can manage the schedule
create policy "Authenticated can manage clinic schedule"
  on public.clinic_schedule for all
  to authenticated
  using (true)
  with check (true);

-- ── 2. schedule_exceptions ────────────────────────────────────────────────
-- Stores specific dates that are blocked or have different hours.
-- If is_closed = true, open_time and close_time are ignored.

create table if not exists public.schedule_exceptions (
  id             uuid primary key default gen_random_uuid(),
  exception_date date not null unique,
  is_closed      boolean not null default true,
  open_time      time,
  close_time     time,
  reason         text
);

alter table public.schedule_exceptions enable row level security;

-- Public visitors can read exceptions (needed for the booking page)
create policy "Anon can read schedule exceptions"
  on public.schedule_exceptions for select
  to anon
  using (true);

-- Only authenticated users (Katya) can manage exceptions
create policy "Authenticated can manage schedule exceptions"
  on public.schedule_exceptions for all
  to authenticated
  using (true)
  with check (true);

-- ── 3. Seed default weekly schedule ──────────────────────────────────────
-- Insert default Mon-Fri 9:00-18:00, Sat 9:00-14:00, Sun closed.
-- The "on conflict do nothing" ensures re-running is safe.

insert into public.clinic_schedule (day_of_week, is_open, open_time, close_time) values
  (0, false, '09:00', '18:00'),  -- Domingo
  (1, true,  '09:00', '18:00'),  -- Lunes
  (2, true,  '09:00', '18:00'),  -- Martes
  (3, true,  '09:00', '18:00'),  -- Miércoles
  (4, true,  '09:00', '18:00'),  -- Jueves
  (5, true,  '09:00', '18:00'),  -- Viernes
  (6, false, '09:00', '14:00')   -- Sábado
on conflict (day_of_week) do nothing;
