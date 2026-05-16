-- Migration 0016: Add flat text columns to patient_histories to match verified schema.
-- The pre-existing JSONB columns (pathological_history, timeline) and chief_complaint
-- are left untouched so that any data already stored there is preserved.

alter table public.patient_histories
  add column if not exists family_history    text,
  add column if not exists emotional_timeline text,
  add column if not exists observations       text;
