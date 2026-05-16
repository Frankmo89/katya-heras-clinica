-- Migration 0018: allow patient_email and patient_phone to be NULL
-- Manual bookings created from the admin panel may not have contact details.

ALTER TABLE public.bookings
  ALTER COLUMN patient_email DROP NOT NULL,
  ALTER COLUMN patient_phone DROP NOT NULL;
