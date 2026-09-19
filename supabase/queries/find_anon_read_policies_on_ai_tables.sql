-- Diagnostic query — read-only, not a migration, safe to run any time.
--
-- 0017_create_ai_learning_events.sql explicitly denies anon everything
-- ("deny_all_anon_ai_learning_events" for all to anon using (false) with
-- check (false)) and grants SELECT only to authenticated. But live testing
-- (service-role key vs. anon key, comparing row visibility) found anon CAN
-- currently SELECT from all four ai_* tables. A `using (false)` policy is
-- PERMISSIVE by default in Postgres — it contributes nothing, but it does
-- NOT block a different, more permissive policy on the same table/role
-- from granting access; Postgres OR-combines permissive policies together.
-- So there must be at least one other anon-readable policy on each table
-- that isn't in any tracked migration.
--
-- Run this in the Supabase SQL Editor and send back the full result —
-- 0027_lock_down_ai_tables.sql needs the exact policy name(s) it finds to
-- drop them by name.

select
  schemaname,
  tablename,
  policyname,
  cmd,          -- which command this policy applies to (select/insert/update/delete/all)
  permissive,   -- 'PERMISSIVE' or 'RESTRICTIVE'
  roles,        -- which role(s) this policy applies to
  qual,         -- the USING expression
  with_check    -- the WITH CHECK expression
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ai_learning_events',
    'ai_clinical_audit',
    'ai_clinical_events',
    'ai_marketing_events'
  )
order by tablename, cmd, policyname;
