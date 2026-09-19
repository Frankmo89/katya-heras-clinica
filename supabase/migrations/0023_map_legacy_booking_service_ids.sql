-- Migration: map legacy hardcoded service slugs stored on old bookings to
-- real rows in the "services" table — explicit, hand-filled mapping.
--
-- Background: before this fix, /reservar read a hardcoded list
-- (src/data/services.ts) and saved bookings.service_id as one of six fixed
-- text slugs: 'estructural', 'visceral', 'craneal', 'postural', 'deportiva',
-- 'embarazo'. bookings.service_id is `text` (see 0001_create_bookings.sql),
-- so those slugs were accepted without any foreign-key check. /reservar now
-- saves the real services.id (a uuid, cast to text) for every new booking.
-- Old bookings still hold the slug, which can never equal a services.id
-- since that column is uuid.
--
-- An earlier version of this migration tried to match slugs to services
-- rows by title (e.g. 'estructural' -> title_es = 'Osteopatía estructural').
-- That's unreliable: a live catalog can have been renamed or restructured
-- since ("Terapia Craneosacral" instead of "Cráneo-sacral", etc.), so a
-- title match can silently miss or — worse — hit the wrong row. This
-- version instead requires you to paste the real services.id by hand.
--
-- ============================================================================
-- Mapping confirmed by the clinic (2026-09-19): 'estructural' and 'visceral'
-- are the only two service_id values across all bookings (9 + 3 rows).
-- Both now map to the single combined service "Osteopatía Estructural y
-- Visceral" — there's no separate current service for either technique
-- alone. 'craneal', 'postural', 'deportiva', and 'embarazo' never appear on
-- any booking, so they're left NULL/skipped intentionally, not by oversight.
-- ============================================================================

do $$
declare
  r record;
  v_service_exists boolean;
  v_orphan_count   integer;
  v_updated_count  integer;
begin
  for r in
    select * from (values
      -- slug          services.id
      ('estructural', 'd6926cc7-91fe-4c32-af5e-529e973f8e7d'::uuid),
      ('visceral',    'd6926cc7-91fe-4c32-af5e-529e973f8e7d'::uuid),
      ('craneal',     null::uuid),
      ('postural',    null::uuid),
      ('deportiva',   null::uuid),
      ('embarazo',    null::uuid)
    ) as t(slug, service_id)
  loop
    if r.service_id is null then
      select count(*) into v_orphan_count from public.bookings where service_id = r.slug;
      raise notice '[%] SKIPPED — no services.id provided in the mapping (% booking(s) still hold this slug)', r.slug, v_orphan_count;
      continue;
    end if;

    select exists(select 1 from public.services where id = r.service_id) into v_service_exists;
    if not v_service_exists then
      raise notice '[%] SKIPPED — % is not a real services.id (check for a typo/paste error)', r.slug, r.service_id;
      continue;
    end if;

    update public.bookings set service_id = r.service_id::text where service_id = r.slug;
    get diagnostics v_updated_count = row_count;

    if v_updated_count = 0 then
      raise notice '[%] matched services.id % — 0 bookings updated (already migrated, or none ever used this slug)', r.slug, r.service_id;
    else
      raise notice '[%] matched services.id % — % booking(s) updated', r.slug, r.service_id, v_updated_count;
    end if;
  end loop;
end $$;

-- Safe to re-run: after a slug's bookings are updated to a real uuid, the
-- WHERE service_id = slug clause above can never match them again, so a
-- second run reports "0 bookings updated" for anything already done.
