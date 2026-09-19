-- Diagnostic query — read-only, not a migration, safe to run any time.
--
-- Lists every distinct bookings.service_id that does not match any row in
-- public.services (id is uuid; service_id is a free text column — see
-- 0001_create_bookings.sql — so any value is possible). This is the exact
-- set of values 0023_map_legacy_booking_service_ids.sql needs a mapping
-- for. Run this FIRST to know what to fill in there — most of these should
-- be the six legacy slugs (estructural, visceral, craneal, postural,
-- deportiva, embarazo), but this also surfaces anything else orphaned.
--
-- Run in the Supabase SQL Editor:

select
  b.service_id,
  count(*)      as booking_count,
  min(b.date)   as earliest_date,
  max(b.date)   as latest_date
from public.bookings b
where not exists (
  select 1 from public.services s where s.id::text = b.service_id
)
group by b.service_id
order by booking_count desc;
