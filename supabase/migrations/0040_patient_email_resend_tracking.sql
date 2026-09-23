-- Additive tracking for patient confirmation email attempts / staff resends.
-- Does NOT change overlap, exclusion constraints, confirm_booking, or slots.
-- Apply manually (Frank) — do not run against prod from CI/agent.
--
-- patient_email_last_status: 'sent' | 'failed' | null (= never attempted)
-- patient_email_last_attempt_at: when the last send attempt finished
-- patient_email_staff_resend_count: how many times staff used the admin
--   resend endpoint (capped in the API; cooldown also uses last_attempt_at)

begin;

alter table public.bookings
  add column if not exists patient_email_last_status text,
  add column if not exists patient_email_last_attempt_at timestamptz,
  add column if not exists patient_email_staff_resend_count integer not null default 0;

-- Soft check: null or known values only (existing rows stay null = never).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bookings_patient_email_last_status_check'
  ) then
    alter table public.bookings
      add constraint bookings_patient_email_last_status_check
      check (
        patient_email_last_status is null
        or patient_email_last_status in ('sent', 'failed')
      );
  end if;
end $$;

commit;
