-- Blocked time slots — block specific hours within a working day
create table blocked_slots (
  id           uuid primary key default gen_random_uuid(),
  blocked_date date not null,
  blocked_time time not null,
  reason       text,
  created_at   timestamptz not null default now(),
  constraint blocked_slots_unique unique (blocked_date, blocked_time)
);

alter table blocked_slots enable row level security;

create policy "Public read-only"
  on blocked_slots for select using (true);

create policy "Authenticated full access"
  on blocked_slots for all using (auth.role() = 'authenticated');
