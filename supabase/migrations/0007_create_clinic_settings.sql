-- Migration: create clinic_settings table
-- Single-row pattern: the CHECK (id = 1) constraint guarantees only one row
-- can ever exist, acting as a lightweight singleton.

create table if not exists public.clinic_settings (
  id               integer primary key check (id = 1),
  whatsapp_number  text not null default '+52 664 000 0000',
  contact_email    text not null default 'katyamheras@gmail.com',
  physical_address text not null default 'Av. Hidalgo 142, Tecate, BC',
  maps_url         text not null default 'https://maps.google.com/?q=Av+Hidalgo+142+Tecate+BC',
  instagram_url    text,
  facebook_url     text
);

alter table public.clinic_settings enable row level security;

-- Public visitors can read (footer, booking page need this data)
create policy "Anon can read clinic settings"
  on public.clinic_settings for select
  to anon
  using (true);

-- Only authenticated users (Katya) can update
create policy "Authenticated can manage clinic settings"
  on public.clinic_settings for all
  to authenticated
  using (true)
  with check (true);

-- Seed with current clinic data
insert into public.clinic_settings (
  id,
  whatsapp_number,
  contact_email,
  physical_address,
  maps_url
) values (
  1,
  '+52 664 000 0000',
  'katyamheras@gmail.com',
  'Av. Hidalgo 142, Tecate, BC',
  'https://maps.google.com/?q=Av+Hidalgo+142+Tecate+BC'
) on conflict (id) do nothing;
