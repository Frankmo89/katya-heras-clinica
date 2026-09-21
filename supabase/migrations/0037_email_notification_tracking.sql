-- Migration: tracking columns so each notification email can be sent at
-- most once per booking, enforced by an atomic claim (see the rewritten
-- src/app/api/send-patient-confirmation and send-booking-notification
-- routes). Both routes used to accept patient/clinic email addresses and
-- full booking content directly from the request body with no server-side
-- lookup at all — anyone could POST arbitrary recipients and content,
-- making the clinic's Resend account (and, once verified, the
-- katyaheras.app domain) an open mail relay. This migration is the DB side
-- of closing that: the routes now look the booking up server-side by
-- (id, booking_ref) and claim one of these columns atomically before
-- sending anything.
--
-- Three columns, not one, because the two routes fire independently and at
-- different points in a booking's life:
--   patient_email_sent_at      — the patient confirmation (CREATE only).
--   clinic_notified_created_at — the clinic's "new booking" notification.
--   clinic_notified_cancelled_at — the clinic's "cancelled" notification,
--                                  fired separately, later, from the admin
--                                  panel — a single sent_at column shared
--                                  with the created-notification would make
--                                  the cancel email permanently unsendable
--                                  once the create email had already set it.

begin;

alter table public.bookings
  add column if not exists patient_email_sent_at        timestamptz,
  add column if not exists clinic_notified_created_at    timestamptz,
  add column if not exists clinic_notified_cancelled_at  timestamptz;

commit;
