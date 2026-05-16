-- Migration: create bookings table
-- Run this in the Supabase SQL Editor or via the Supabase CLI:
--   supabase db push

create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  service_id     text        not null,
  date           date        not null,
  time           text        not null,   -- "HH:MM" format, e.g. "10:00"
  patient_name   text        not null,
  patient_email  text        not null,
  patient_phone  text        not null,
  notes          text,
  booking_ref    text        not null    -- client-generated display ID, e.g. "KH-2026-4821"
);

-- Enable Row Level Security (all writes are anonymous via the anon key)
alter table public.bookings enable row level security;

-- Allow anyone with the anon key to INSERT (booking form is public)
create policy "Public can insert bookings"
  on public.bookings
  for insert
  to anon
  with check (true);

-- Only authenticated users (admin) can SELECT / UPDATE / DELETE
create policy "Authenticated users can manage bookings"
  on public.bookings
  for all
  to authenticated
  using (true)
  with check (true);
