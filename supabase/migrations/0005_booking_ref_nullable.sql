-- Migration: make booking_ref nullable
-- booking_ref was previously generated client-side with Math.random() before the
-- insert was confirmed. We now derive it from the UUID returned by Supabase after
-- a successful insert, so it must be allowed to be NULL until we can set it, or
-- simply left as the display-only field that lives on the client.

ALTER TABLE public.bookings
  ALTER COLUMN booking_ref DROP NOT NULL;
