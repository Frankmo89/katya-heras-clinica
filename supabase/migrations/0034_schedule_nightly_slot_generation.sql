-- Migration: nightly job that keeps available_slots filled 60 days ahead.
--
-- Uses pg_cron, which is available on Supabase's paid plans (and self-host)
-- but may not be enabled on every project. If `create extension pg_cron`
-- fails or errors as unavailable on your plan, skip this file — a Vercel
-- Cron fallback is provided instead (src/app/api/cron/generate-slots/route.ts
-- + vercel.json in this same change), which calls the same
-- generate_available_slots() function over HTTP on the same schedule. Only
-- one of the two is needed; having both running is harmless (the function
-- is idempotent — see 0031) but redundant.
--
-- 09:00 UTC ≈ 01:00 America/Tijuana (PST) / 02:00 (PDT during daylight
-- saving) — adjust the cron expression below if you'd rather it run at a
-- different local hour. Note this schedule happens to fall AFTER Tijuana's
-- own midnight, so plain current_date (server/UTC) and Tijuana's date agree
-- at the instant this runs — but that's a coincidence of this specific
-- hour, not something to rely on, so the call below computes Tijuana's
-- date explicitly instead of assuming it.
create extension if not exists pg_cron;

select cron.schedule(
  'generate-available-slots-nightly',
  '0 9 * * *',
  $$
    select public.generate_available_slots(
      (now() at time zone 'America/Tijuana')::date,
      (now() at time zone 'America/Tijuana')::date + 60
    )
  $$
);

-- To remove this schedule later:
--   select cron.unschedule('generate-available-slots-nightly');
