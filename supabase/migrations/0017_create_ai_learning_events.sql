-- Unified learning loop events (privacy-aware)
create table if not exists public.ai_learning_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null check (source in ('osteorag','publicidad','resumen_clinico','feedback','other')),
  event_type text not null check (event_type in ('query','generate','rating','conclusion')),
  topic_or_question text,
  folder_filter text,
  patient_id uuid,
  rating smallint check (rating is null or rating in (-1, 1)),
  rating_note text,
  output_preview text,
  citation_titles text[] default '{}',
  related_event_id uuid references public.ai_learning_events(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  admin_user_id uuid
);

create index if not exists ai_learning_events_created_at_idx on public.ai_learning_events (created_at desc);
create index if not exists ai_learning_events_source_idx on public.ai_learning_events (source, event_type);
create index if not exists ai_learning_events_patient_id_idx on public.ai_learning_events (patient_id) where patient_id is not null;

alter table public.ai_learning_events enable row level security;

create policy "deny_all_anon_ai_learning_events"
  on public.ai_learning_events
  for all
  to anon
  using (false)
  with check (false);

create policy "authenticated_read_own_or_all_admin"
  on public.ai_learning_events
  for select
  to authenticated
  using (true);
