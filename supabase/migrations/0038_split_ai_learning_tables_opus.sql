-- Opus P0: document live split of ML tables (already applied on clinic project
-- hlotbgirhjbnppdtllkv). Idempotent — safe to re-run. Does NOT drop or alter
-- existing data destructively.
--
-- Live schema (2026-09):
--   ai_marketing_events  — publicidad generate / rating / publish / outcome
--   ai_clinical_events   — osteorag / resumen_clinico (NO patient_id)
--   ai_clinical_audit    — EMR trazabilidad only (patient_id + clinical_event_id)
--   ai_learning_events   — DEPRECATED; stop writing new rows

-- ── Marketing events ────────────────────────────────────────────────────────
create table if not exists public.ai_marketing_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  topic text,
  folder_filter text,
  prompt_version text,
  model text,
  output_draft text,
  output_published text,
  rating smallint check (rating is null or rating in (-1, 1)),
  rating_note text,
  citation_titles text[] default '{}',
  downvoted_sources text[] default '{}',
  related_event_id uuid,
  outcome_leads integer,
  outcome_bookings integer,
  outcome_notes text,
  outcome_at timestamptz,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists ai_marketing_events_created_at_idx
  on public.ai_marketing_events (created_at desc);
create index if not exists ai_marketing_events_event_type_idx
  on public.ai_marketing_events (event_type);

alter table public.ai_marketing_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_marketing_events'
      and policyname = 'deny_all_anon_ai_marketing_events'
  ) then
    create policy "deny_all_anon_ai_marketing_events"
      on public.ai_marketing_events
      for all
      to anon
      using (false)
      with check (false);
  end if;
end $$;

comment on table public.ai_marketing_events is
  'Opus ML loop — publicidad: generate / rating / publish / outcome. No PHI.';

-- ── Clinical events (ML — no patient_id) ────────────────────────────────────
create table if not exists public.ai_clinical_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,
  event_type text not null,
  topic_or_question text,
  folder_filter text,
  prompt_version text,
  model text,
  output_draft text,
  rating smallint check (rating is null or rating in (-1, 1)),
  rating_note text,
  citation_titles text[] default '{}',
  downvoted_sources text[] default '{}',
  related_event_id uuid,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists ai_clinical_events_created_at_idx
  on public.ai_clinical_events (created_at desc);
create index if not exists ai_clinical_events_source_idx
  on public.ai_clinical_events (source, event_type);

alter table public.ai_clinical_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_clinical_events'
      and policyname = 'deny_all_anon_ai_clinical_events'
  ) then
    create policy "deny_all_anon_ai_clinical_events"
      on public.ai_clinical_events
      for all
      to anon
      using (false)
      with check (false);
  end if;
end $$;

comment on table public.ai_clinical_events is
  'Opus ML loop — osteorag / resumen_clinico. NO patient_id (audit table aparte).';

-- ── Clinical audit (EMR trazabilidad — has patient_id) ──────────────────────
create table if not exists public.ai_clinical_audit (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  patient_id uuid,
  clinical_event_id uuid,
  source text,
  note text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists ai_clinical_audit_patient_id_idx
  on public.ai_clinical_audit (patient_id)
  where patient_id is not null;
create index if not exists ai_clinical_audit_clinical_event_id_idx
  on public.ai_clinical_audit (clinical_event_id)
  where clinical_event_id is not null;

alter table public.ai_clinical_audit enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_clinical_audit'
      and policyname = 'deny_all_anon_ai_clinical_audit'
  ) then
    create policy "deny_all_anon_ai_clinical_audit"
      on public.ai_clinical_audit
      for all
      to anon
      using (false)
      with check (false);
  end if;
end $$;

comment on table public.ai_clinical_audit is
  'EMR trazabilidad only — patient_id + clinical_event_id. Not for ML datasets.';

-- ── Deprecate monolithic table ──────────────────────────────────────────────
comment on table public.ai_learning_events is
  'DEPRECATED (Opus P0). Stop writing new rows. Use ai_marketing_events / ai_clinical_events / ai_clinical_audit.';
