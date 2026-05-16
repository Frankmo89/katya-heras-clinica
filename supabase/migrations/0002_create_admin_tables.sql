-- Migration: create admin tables (patients, patient_histories, physical_evaluations)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- or via: supabase db push

-- ── 1. patients ────────────────────────────────────────────────────────────
create table if not exists public.patients (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null    default now(),
  full_name         text        not null,
  birth_date        date,
  sex               text,
  phone             text,
  email             text,
  address           text,
  occupation        text,
  civil_status      text,
  emergency_contact text,
  emergency_phone   text
);

alter table public.patients enable row level security;

-- Anon users cannot read patient data
create policy "Authenticated can manage patients"
  on public.patients for all
  to authenticated
  using (true)
  with check (true);

-- ── 2. patient_histories ───────────────────────────────────────────────────
-- Stores all non-physical clinical data: motivo, antecedentes, línea del tiempo.
-- pathological_history and timeline are JSONB for flexibility across sessions.

create table if not exists public.patient_histories (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null    default now(),
  patient_id            uuid        not null    references public.patients(id) on delete cascade,
  chief_complaint       text,
  -- JSONB shape for pathological_history:
  --   { patologias: string[], surgeries: string, accidents: string,
  --     allergies: string, current_medications: string, family_history: string,
  --     lifestyle: { smoking, alcohol, exercise }, gyneco_history: string }
  pathological_history  jsonb       not null    default '{}',
  -- JSONB shape for timeline:
  --   { gestacion, primera_infancia, infancia, adolescencia, vida_adulta,
  --     traumas, relacion_padres, contexto_actual }
  timeline              jsonb       not null    default '{}'
);

alter table public.patient_histories enable row level security;

create policy "Authenticated can manage histories"
  on public.patient_histories for all
  to authenticated
  using (true)
  with check (true);

-- ── 3. physical_evaluations ────────────────────────────────────────────────
-- Stores vital signs and P.M.O. osteopathic test results.
-- pmo_findings JSONB shape: { "Pelvis / Ilíacos": { left, right, notes }, … }

create table if not exists public.physical_evaluations (
  id                        uuid        primary key default gen_random_uuid(),
  created_at                timestamptz not null    default now(),
  patient_id                uuid        not null    references public.patients(id) on delete cascade,
  weight                    numeric(5,1),           -- kg
  height                    numeric(5,1),           -- cm
  bmi                       numeric(4,1),           -- calculated client-side
  heart_rate                integer,                -- lpm
  blood_pressure_systolic   integer,                -- mmHg
  blood_pressure_diastolic  integer,                -- mmHg
  respiratory_rate          integer,                -- rpm
  temperature               numeric(4,1),           -- °C
  pmo_findings              jsonb       not null    default '{}'
);

alter table public.physical_evaluations enable row level security;

create policy "Authenticated can manage evaluations"
  on public.physical_evaluations for all
  to authenticated
  using (true)
  with check (true);

-- ── Useful indexes ─────────────────────────────────────────────────────────
create index if not exists idx_patient_histories_patient   on public.patient_histories(patient_id);
create index if not exists idx_physical_evaluations_patient on public.physical_evaluations(patient_id);
create index if not exists idx_patients_full_name          on public.patients(full_name);
