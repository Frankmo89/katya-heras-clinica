-- Migration: create services table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)

create table if not exists public.services (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  title_es         text        not null,
  title_en         text,
  description_es   text,
  description_en   text,
  duration_minutes integer,
  price            numeric(10, 2),
  -- 'pink' | 'green' | 'blue' — maps to the pastel surface tokens in globals.css
  tone             text        check (tone in ('pink', 'green', 'blue'))
);

alter table public.services enable row level security;

-- ── RLS Policies ────────────────────────────────────────────────────────────

-- Anyone (anon + authenticated) can read the catalogue
create policy "Public can read services"
  on public.services for select
  to anon, authenticated
  using (true);

-- Only authenticated users (clinic staff) can create services
create policy "Authenticated can insert services"
  on public.services for insert
  to authenticated
  with check (true);

-- Only authenticated users can update existing services
create policy "Authenticated can update services"
  on public.services for update
  to authenticated
  using (true)
  with check (true);

-- Only authenticated users can delete services
create policy "Authenticated can delete services"
  on public.services for delete
  to authenticated
  using (true);
