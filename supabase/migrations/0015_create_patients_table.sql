-- Migration 0015: Book-to-patient sync.
-- The patients table already exists (migration 0002) with full clinical columns.
-- This migration:
--   1. Adds a unique index on phone for deduplication (IF NOT EXISTS).
--   2. Adds an anon INSERT policy so the public booking flow can register patients.
--   3. Creates a trigger that upserts a minimal patient record from each new booking.
--
-- Column mapping matches migration 0002:
--   patients.full_name  ← bookings.patient_name
--   patients.email      ← bookings.patient_email
--   patients.phone      ← bookings.patient_phone  (used as conflict key)

-- ── 1. Unique phone index ──────────────────────────────────────────────────
create unique index if not exists patients_phone_key
  on public.patients (phone);

-- ── 2. Anon INSERT policy (idempotent via DO block) ───────────────────────
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'patients'
      and policyname = 'anon_insert_patients'
  ) then
    execute '
      create policy "anon_insert_patients"
        on public.patients
        for insert to anon
        with check (true)
    ';
  end if;
end
$$;

-- ── 3. Trigger function ────────────────────────────────────────────────────
create or replace function public.sync_patient_from_booking()
  returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  -- Only sync when a non-empty phone number is provided
  if new.patient_phone is not null and trim(new.patient_phone) <> '' then
    insert into public.patients (full_name, email, phone)
    values (
      new.patient_name,
      new.patient_email,
      trim(new.patient_phone)
    )
    on conflict (phone) do update
      set
        -- Keep the most recent name from any booking
        full_name = excluded.full_name,
        -- Preserve existing email if the new booking didn't supply one
        email     = coalesce(excluded.email, patients.email);
  end if;
  return new;
end;
$$;

create trigger bookings_sync_patient_trigger
  after insert on public.bookings
  for each row
  execute function public.sync_patient_from_booking();
