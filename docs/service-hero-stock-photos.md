# Service hero stock photos (placeholders)

**Status:** PLACEHOLDER images until Katya provides real clinic photos.  
**Date:** 2026-09-22 (PT); Thai hero replaced same day after review  
**Branch intent:** `feat/service-hero-stock-photos` → `dev` only (never `master`).  
**Storage:** Supabase bucket `service-images` / folder `services` (public URLs).  
**License rule:** Unsplash / Pexels / Pixabay only. All three licenses allow commercial use and do **not** require attribution (attribution appreciated but not required).

---

## Summary

| Service | Source site | License | Face-free | Technique-specific | Storage public URL |
|---|---|---|---|---|---|
| Kinesiotaping | Pexels | Pexels License (commercial OK, attribution not required) | Pass | Pass (KT tape on knee) | see below |
| Masaje Relajante | Pexels | Pexels License | Pass | Pass (hands on back) | see below |
| Masaje Tailandés | Pexels | Pexels License | Pass | Pass (leg/ankle pressure on Thai futon) | see below |
| Osteopatía Estructural y Visceral | Pexels | Pexels License | Pass | Pass (visceral abdominal hands) | see below |
| Terapia Craneosacral | Pexels | Pexels License | Pass | Pass (hands on skull / occiput, patient prone) | see below |
| Terapia ATM | Pexels | Pexels License | Pass (tight jaw/neck crop; eyes/nose/mouth out) | Pass (hands on mandibular / TMJ region) | see below |

All six active services received a hero image. Crops are ~16:10 WebP (~q80), under 5 MB.

---

## Per service

### 1. Kinesiotaping — `931811c6-9f4e-4781-83d1-df0569a6fb1e`

- **Chosen source (v2, tone pass):** https://www.pexels.com/photo/a-person-with-kinesio-tapes-on-his-knees-6094040/
- **Site / license:** Pexels / Pexels License — commercial use OK, attribution not required.
- **Storage URL:** https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/service-images/services/kinesiotaping-v2.webp
- **Checks:** Face-free. Magenta + black KT tape on knee — unmistakable. Light–medium warm skin (closer to the rest of the set / local Latino–Mestizo lean). Clean clinical white backdrop.
- **Replaced:** Pexels 6076123 (red tape on shoulder) — patient skin was visibly much darker than the other five heroes and broke grid consistency. Old file remains as `kinesiotaping.webp` but is no longer referenced in DB.
- **Rejected shortlist:** 6076123 (tone mismatch); 6076134 / 5794055 (faces); 6094335 (three-person studio catalog, busier); 8219160 (OK technique but purple table + lighter than preferred).

### 2. Masaje Relajante — `aa07b066-e954-40ad-a3fe-f4c09620d5a9`

- **Chosen source:** https://www.pexels.com/photo/woman-hands-on-man-back-16246679/
- **Site / license:** Pexels / Pexels License — commercial use OK, attribution not required.
- **Storage URL:** https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/service-images/services/masaje-relajante.webp
- **Checks:** Face-free top-down back work. No candles/stones. Calm clinical lighting.
- **Rejected shortlist:** Pexels 20860606 — practitioner face visible; several hot-stone images rejected (spa aesthetic).

### 3. Masaje Tailandés — `2709217b-12f0-4ada-95ec-fec7c73b2510`

- **Chosen source (v2, 2026-09-22 review):** https://www.pexels.com/photo/traditional-thai-massage-leg-therapy-session-34927635/
- **Site / license:** Pexels / Pexels License — commercial use OK, attribution not required.
- **Storage URL:** https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/service-images/services/masaje-tailandes-v2.webp
- **Checks:** Face-free. Therapist hands applying pressure to client's calf/ankle on a floor futon; client in traditional loose white Thai pants — immediately readable as Thai massage (not bandage/injury).
- **Replaced:** Pexels 6187421 herbal compress (Luk Pra Kob) — too ambiguous for unfamiliar viewers (could read as gauze/bandage). Old file kept in Storage as `masaje-tailandes.webp` but no longer referenced in DB.
- **Alt shortlist kept:** Pexels 5793898 (foot/ankle pressure on table) — also face-free; preferred 34927635 for clearer Thai-futon context.
- **Rejected shortlist:** Pexels 4599425, 6186750, 6188042, 6188120, 6187421 — faces and/or ambiguous compress.

### 4. Osteopatía Estructural y Visceral — `d6926cc7-91fe-4c32-af5e-529e973f8e7d`

- **Chosen source:** https://www.pexels.com/photo/therapist-performing-abdominal-massage-therapy-29821661/
- **Site / license:** Pexels / Pexels License — commercial use OK, attribution not required.
- **Storage URL:** https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/service-images/services/osteopatia-estructural-visceral.webp
- **Checks:** Face-free visceral / abdominal hands work on draped table. Clinical calm.
- **Rejected shortlist:** Pexels 5793990 — patient’s chin/mouth in frame; 20860606 — practitioner face.

### 5. Terapia Craneosacral — `3282ecf6-8143-49a7-b28d-b8f59eba6581`

- **Chosen source:** https://www.pexels.com/photo/5794043/  
  (same photo family as related Pexels head-work shots; ID **5794043**)
- **Site / license:** Pexels / Pexels License — commercial use OK, attribution not required.
- **Storage URL:** https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/service-images/services/terapia-craneosacral.webp
- **Checks:** Hands gently on skull/occiput; patient prone; face not identifiable; clinical pastel setting (no candles).
- **2026-09-22 re-check:** Top-down crown/occiput framing — **zero** visible face or profile (no eyes/ears/nose/mouth).
- **Rejected shortlist:** Pexels 6629549 — patient face + candles; 5794044 — practitioner face unless extreme crop loses technique; 5659011 / 6663371 — patient face/profile.

### 6. Terapia de Articulación Temporomandibular (ATM) — `7d9aa20c-caad-4c02-9edd-4560581a391d`

- **Chosen source:** https://www.pexels.com/photo/a-therapist-massaging-the-head-6663371/
- **Site / license:** Pexels / Pexels License — commercial use OK, attribution not required.
- **Storage URL:** https://hlotbgirhjbnppdtllkv.supabase.co/storage/v1/object/public/service-images/services/terapia-atm.webp
- **Checks:** Tight 16:10 crop on jaw / mandibular region + practitioner hands; eyes, nose, and mouth excluded so the person is not identifiable. Clinical calm.
- **2026-09-22 re-check:** Confirmed jaw/TMJ-specific — ear + jawline with hand contact just below/behind the earlobe (TMJ area), **not** a generic neck/shoulder shot. Clearer masseter-only stocks either showed faces or were not available on Pexels/Unsplash/Pixabay without identifiable features.
- **Rejected shortlist:** Pexels 4506167 / 4506216 / 6663377 / 14187889 — identifiable faces; looser crop of 6663371 showed a closed eye and was discarded.

---

## Processing notes

- Downloaded originals to ephemeral box path `/workspace/katya-service-photos/raw/` (not committed).
- Visual face check via image inspection; technique + aesthetic check per service.
- Pillow crop ≈16:10, export WebP quality ~80, all files ≪ 5 MB (`uploadImage.ts` max).
- Uploaded to Supabase Storage `service-images/services/{slug}.webp` (not hotlinked).
- `hero_image` updated in production DB (CMS-driven UI — live without waiting for this PR merge).
- **Skin-tone consistency (2026-09-22):** Reviewed the six heroes for grid consistency; prefer light–medium warm tones representative of the Tijuana/San Diego (predominantly Latino/Mestizo) patient base. Kinesiotaping swapped for that reason.
- **Reminder:** These are **PLACEHOLDERS**. Replace with Katya’s real clinic photos when available; update or remove this log accordingly.

## License confirmations (general)

| Site | License name | Commercial use | Attribution required? |
|---|---|---|---|
| Unsplash | Unsplash License | Yes | No (appreciated) |
| Pexels | Pexels License | Yes | No (appreciated) |
| Pixabay | Pixabay Content License | Yes | No (appreciated) |

This log cites Pexels only for the six chosen files. Pixabay/Unsplash were searched; several Pixabay candidates were rejected on face/specificity/aesthetic grounds.
