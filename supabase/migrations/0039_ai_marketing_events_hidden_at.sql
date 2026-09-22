-- Soft-delete / archive for marketing learning events (Publicidad / Insights).
-- Does NOT hard-delete. Staff UI sets hidden_at; Insights excludes those rows by default.
-- Apply manually on the clinic Supabase project — do not auto-run from CI.

alter table public.ai_marketing_events
  add column if not exists hidden_at timestamptz null;

comment on column public.ai_marketing_events.hidden_at is
  'Soft-delete timestamp; null = visible in Insights. Set by staff hide API.';

create index if not exists ai_marketing_events_visible_created_at_idx
  on public.ai_marketing_events (created_at desc)
  where hidden_at is null;
