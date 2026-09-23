# Service gallery stock photos (placeholders)

**Status:** PLACEHOLDER images until Katya provides real clinic photos.  
**Date:** 2026-09-22 (PT)  
**Scope:** All 6 active services — 5 photos each (mosaic filled).  
**Branch intent:** `feat/service-gallery-stock-photos` → **`dev` only** (never `master`).  
**Storage:** Supabase bucket `service-images` / folder `services/` (public URLs, not hotlinks).  
**License rule:** Unsplash / Pexels / Pixabay only. Commercial use OK; attribution not required.

UI mosaic (`ServiceDetailContent.tsx`): `grid-cols-[2fr_1fr_1fr] grid-rows-[200px_200px]` — index 0 is tall left (`row-span-2`); indices 1–4 smaller. Aim: **exactly 5 photos**. Prefer **4 technique + 1 accessory**. No faces. Clinical/calm. No spa clichés unless literally part of the technique. Skin tones lean Latino/Mestizo medium, consistent with each service’s hero.

---

## 1. Masaje Tailandés — `2709217b-12f0-4ada-95ec-fec7c73b2510`

| # | Role | Tag | Source | Site / license | Storage path |
|---|---|---|---|---|---|
| 01 (large) | Tall left — portrait wood-stick pressure | **technique** | https://www.pexels.com/photo/6187847/ | Pexels | `services/gallery-tailandes-01.webp` |
| 02 | Tok Sen wooden peg + mallet on neck/shoulder | **technique** | https://www.pexels.com/photo/traditional-thai-massage-tok-sen-therapy-35176574/ | Pexels | `services/gallery-tailandes-02.webp` |
| 03 | Thai foot/ankle stretch with therapist hands | **technique** | https://www.pexels.com/photo/6188032/ | Pexels | `services/gallery-tailandes-03.webp` |
| 04 | Luk Pra Kob herbal compress + herbs on tray | **accessory** | https://www.pexels.com/photo/fragrant-herbs-used-in-herbal-stamp-massage-6560254/ | Pexels | `services/gallery-tailandes-04.webp` |
| 05 | Luk Pra Kob herbal compresses pressed on back | **technique** | https://www.pexels.com/photo/6187848/ | Pexels | `services/gallery-tailandes-05.webp` |

**Public URLs:** `…/gallery-tailandes-0{1–5}.webp`  
**Not reused:** hero Pexels **34927635**, legacy **6187421**.

---

## 2. Kinesiotaping — `931811c6-9f4e-4781-83d1-df0569a6fb1e`

| # | Role | Tag | Source | Site / license | Storage path |
|---|---|---|---|---|---|
| 01 (large) | Applying black KT tape on knee (hands, no face) | **technique** | https://www.pexels.com/photo/7339489/ | Pexels | `services/gallery-kinesiotaping-01.webp` |
| 02 | Applying pink/blue tape on forearm | **technique** | https://www.pexels.com/photo/8219160/ | Pexels | `services/gallery-kinesiotaping-02.webp` |
| 03 | Finished black+pink tape on elbow + knee | **technique** | https://www.pexels.com/photo/6094058/ | Pexels | `services/gallery-kinesiotaping-03.webp` |
| 04 | Black+red patterned tape on upper/lower back | **technique** | https://www.pexels.com/photo/6094033/ | Pexels | `services/gallery-kinesiotaping-04.webp` |
| 05 | Hands holding multicolour KT rolls (clinical coat) | **accessory** | https://www.pexels.com/photo/6094072/ | Pexels | `services/gallery-kinesiotaping-05.webp` |

**Ratio:** 4 technique + 1 accessory.  
**Not reused:** hero Pexels **6094040** (`kinesiotaping-v2.webp`). Different from hero knee-only finished shot (01 shows application in progress).

---

## 3. Masaje Relajante — `aa07b066-e954-40ad-a3fe-f4c09620d5a9`

| # | Role | Tag | Source | Site / license | Storage path |
|---|---|---|---|---|---|
| 01 (large) | Oiled hands on upper back / shoulders | **technique** | https://www.pexels.com/photo/37719557/ | Pexels | `services/gallery-masaje-relajante-01.webp` |
| 02 | Thumbs along mid-back with oil sheen | **technique** | https://www.pexels.com/photo/38407790/ | Pexels | `services/gallery-masaje-relajante-02.webp` |
| 03 | Lumbar thumbs pressure (portrait) | **technique** | https://www.pexels.com/photo/6560291/ | Pexels | `services/gallery-masaje-relajante-03.webp` |
| 04 | Pouring oil from dark bowl onto hand over back | **technique** | https://www.pexels.com/photo/19641816/ | Pexels | `services/gallery-masaje-relajante-04.webp` |
| 05 | Glass dropper + frosted oil bottle (unique to this service) | **accessory** | https://pixabay.com/photos/dropper-6939335/ | Pixabay | `services/gallery-masaje-relajante-05.webp` |

**Ratio:** 4 technique + 1 accessory.  
**Not reused:** hero Pexels **16246679**. Oil bottle accessory is unique (not shared with other galleries).

---

## 4. Osteopatía Estructural y Visceral — `d6926cc7-91fe-4c32-af5e-529e973f8e7d`

| # | Role | Tag | Source | Site / license | Storage path |
|---|---|---|---|---|---|
| 01 (large) | Visceral / abdominal hand placement | **technique** | https://www.pexels.com/photo/6809460/ | Pexels | `services/gallery-osteopatia-01.webp` |
| 02 | Lumbar / iliac crest palpation in blue scrubs | **technique** | https://www.pexels.com/photo/20860598/ | Pexels | `services/gallery-osteopatia-02.webp` |
| 03 | Side-lying flank / lower-back finger pressure | **technique** | https://pixabay.com/photos/massage-2441817/ | Pixabay | `services/gallery-osteopatia-03.webp` |
| 04 | Shoulder / scapula mobilization (side-lying) | **technique** | https://www.pexels.com/photo/5473182/ | Pexels | `services/gallery-osteopatia-04.webp` |
| 05 | Oil-prep hands over back on white treatment linens | **accessory** | https://www.pexels.com/photo/5888070/ | Pexels | `services/gallery-osteopatia-05.webp` |

**Ratio:** 4 technique + 1 accessory (clean linens visible). No candles.  
**Not reused:** hero Pexels **29821661**.

---

## 5. Terapia Craneosacral — `3282ecf6-8143-49a7-b28d-b8f59eba6581`

| # | Role | Tag | Source | Site / license | Storage path |
|---|---|---|---|---|---|
| 01 (large) | Hands at cranial base / upper cervical from behind | **technique** | https://www.pexels.com/photo/20860604/ | Pexels | `services/gallery-craneosacral-01.webp` |
| 02 | Light-touch hands at upper back / cranial-base area | **technique** | https://pixabay.com/photos/wellness-285589/ | Pixabay | `services/gallery-craneosacral-02.webp` |
| 03 | Neck / upper trapezius from behind (face hidden) | **technique** | https://www.pexels.com/photo/5723190/ | Pexels | `services/gallery-craneosacral-03.webp` |
| 04 | Upper back / cervical hands, grey hair, face-down | **technique** | https://www.pexels.com/photo/7235054/ | Pexels | `services/gallery-craneosacral-04.webp` |
| 05 | Brain MRI sheet (clinical accessory) | **accessory** | https://www.pexels.com/photo/5723883/ | Pexels | `services/gallery-craneosacral-05.webp` |

**Ratio:** 4 technique + 1 accessory. Extremely strict face check — occiput/posterior only.  
**Not reused:** hero Pexels **5794043**.  
**Note (weak picks / scarcity):** True occiput-hold stocks without any profile are scarce on Pexels/Pixabay. 03–04 lean cervical/structural but stay face-free and clinical; replaced a candle-background candidate (6629554).

---

## 6. Terapia ATM — `7d9aa20c-caad-4c02-9edd-4560581a391d`

| # | Role | Tag | Source | Site / license | Storage path |
|---|---|---|---|---|---|
| 01 (large) | Thumb at TMJ / jaw angle (tight crop, no eye) | **technique** | https://pixabay.com/photos/head-massage-3530560/ | Pixabay | `services/gallery-atm-01.webp` |
| 02 | Hand near jaw / upper cervical on white towel | **technique** | https://www.pexels.com/photo/14187889/ | Pexels | `services/gallery-atm-02.webp` |
| 03 | Hands cradling head near ear (hair hides face) | **technique** | https://pixabay.com/photos/head-650878/ | Pixabay | `services/gallery-atm-03.webp` |
| 04 | Hand on posterior neck / cranial base from behind | **technique** | https://www.pexels.com/photo/7298881/ | Pexels | `services/gallery-atm-04.webp` |
| 05 | Anatomical skull model (TMJ anatomy accessory) | **accessory** | https://www.pexels.com/photo/11680763/ | Pexels | `services/gallery-atm-05.webp` |

**Ratio:** 4 technique + 1 accessory.  
**Not reused:** hero Pexels **6663371** (tight jaw crop).  
**Note (weak picks / face scarcity):** Face-free true masseter/TMJ stocks are extremely scarce. 01–02 are tight crops of jaw/ear contact; 03–04 are adjacent cranial-base/neck holds used as clinical stand-ins; 05 skull model clearly signals ATM anatomy. Prefer Katya’s real jaw/intraoral-adjacent photos when available.

---

## Screenshots (El espacio mosaic)

Saved under `/workspace/katya-service-photos/screenshots/` (not committed; evidence for review):

- `gallery-tailandes-mosaic-only.png` (already existed)
- `gallery-kinesiotaping.png`
- `gallery-masaje-relajante.png`
- `gallery-osteopatia.png`
- `gallery-craneosacral.png`
- `gallery-atm.png`

Live URLs: `https://www.katyaheras.app/servicios/<id>`

---

## Processing notes

- Downloaded to ephemeral box path `/workspace/katya-service-photos/` (not committed).
- Visual face check via image inspection; rejected faces, spa candles/stone bowls, and any hero/gallery reuse.
- Pillow export WebP quality ~80–82.
- Uploaded to Supabase Storage `service-images/services/gallery-<slug>-0N.webp` via temporary anon INSERT/UPDATE policies (dropped after upload).
- `gallery_images` arrays updated in production DB (CMS-driven UI — live without waiting for this PR merge).
- **Reminder:** These are **PLACEHOLDERS**. Replace with Katya’s real clinic photos when available.

## License confirmations

| Site | License | Commercial | Attribution required? |
|---|---|---|---|
| Unsplash | Unsplash License | Yes | No (appreciated) |
| Pexels | Pexels License | Yes | No (appreciated) |
| Pixabay | Pixabay Content License | Yes | No (appreciated) |
