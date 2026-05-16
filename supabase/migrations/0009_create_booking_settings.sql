-- Booking policies — singleton row (id must equal 1)
create table booking_settings (
  id                integer primary key check (id = 1),
  min_hours_advance integer not null default 24,
  max_days_advance  integer not null default 60,
  is_booking_enabled boolean not null default true
);

-- RLS: public read-only, authenticated users can modify
alter table booking_settings enable row level security;

create policy "Public read-only"
  on booking_settings for select
  using (true);

create policy "Authenticated full access"
  on booking_settings for all
  using (auth.role() = 'authenticated');

-- Seed with sane defaults
insert into booking_settings (id, min_hours_advance, max_days_advance, is_booking_enabled)
values (1, 24, 60, true);
