-- Add admin-facing status tracking to bookings.
-- status:    replaces the boolean is_cancelled for admin control.
--            'confirmed' (default) → 'completed' or 'cancelled'.
-- is_manual: flag for appointments added directly by the clinic owner.

alter table public.bookings
  add column if not exists status    text    not null default 'confirmed'
    constraint bookings_status_check check (status in ('confirmed', 'completed', 'cancelled')),
  add column if not exists is_manual boolean not null default false;
