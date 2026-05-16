# Katya Heras Clínica — Design System

> **Holistic Luxury** — Osteopathy & wellness clinic where premium clinical care meets a deeply relaxing spa experience.

---

## About the brand

Katya Heras Clínica is a premium osteopathy and holistic wellness practice. The brand sits at an unusual intersection: **clinical credibility** (real pain relief, measurable outcomes, professional expertise) wrapped in a **spa-like sensorial experience** (calm, warmth, generous whitespace, soft pastels). Patients should feel their shoulders drop the moment a page loads.

The clinic operates on a **cross-border model** (San Diego ↔ Tecate). The bilingual ES/EN structure is core to every screen. Cross-border / location messaging is intentionally **secondary and subtle** — never the headline, always a quiet reassurance.

### Audience

- Adults seeking pain relief who are evaluating premium / boutique options
- Wellness-oriented patients (chronic tension, posture, stress, sports recovery)
- Cross-border clients comfortable with bilingual interfaces

### Brand pillars

1. **Calm first.** The interface itself is part of the treatment. No pressure, no urgency, no aggressive CTAs.
2. **Clinical confidence.** Behind the softness is real expertise. Typography, spacing, and copy are precise — never floaty or vague-spiritual.
3. **Bilingual by default.** ES first in body markets, EN parallel. Never Google-Translate-feeling.
4. **Touch over noise.** Manual therapy is a tactile profession; the visual language reflects that — soft, tangible, low-glare.

---

## Sources

This design system was built from a written brief (no codebase, Figma, or slide deck attached). All visual decisions are interpretations of the brief's stated palette, voice, and component rules. **If a real codebase or Figma exists, please attach it** — the system can be rebuilt against actual product source for pixel fidelity.

- **Brief:** Provided by client (palette, type pairing rules, spacing, shapes, voice)
- **Codebase:** _Not yet provided_
- **Figma:** _Not yet provided_

---

## Index

Once you've read this README, the rest of the system lives at:

| Path | Purpose |
|------|---------|
| `colors_and_type.css` | All color, type, spacing, radius, and shadow CSS vars (base + semantic) |
| `fonts/` | Web fonts (currently Google-hosted — see Caveats) |
| `assets/` | Logos, marks, brand imagery, illustrations |
| `preview/` | HTML cards rendered in the Design System tab (one concept per card) |
| `ui_kits/website/` | High-fidelity marketing-site UI kit (React/JSX) — homepage, services, booking, about |
| `SKILL.md` | Agent-invocable skill manifest (Claude Code compatible) |
| `preview/website-home.png` | Reference screenshot of the website kit (above-the-fold) |

---

## Content fundamentals

> _Voice: empathetic, calming, premium, highly professional. Never salesy. Never "wellness-influencer." Bilingual ES/EN throughout._

### Tone & register

- **Calm authority.** Like a senior practitioner who doesn't need to raise their voice. We make claims plainly and back them with expertise — never with hype.
- **You, not we.** Address the patient directly: _"Tu cuerpo merece una pausa." / "Your body deserves a pause."_ Use "we" sparingly, only for the team's collective expertise.
- **Empathy before service.** Lead with the patient's experience ("Si llevas semanas con dolor de espalda…"), then introduce what we do.
- **Precise, not floral.** Avoid "energies," "vibrations," "alignments of the soul." Osteopathy is clinical. Use anatomical correctness ("cervical tension," "fascial release") next to plain language ("stiff neck," "deep release").

### Casing & punctuation

- **Sentence case** for headings and buttons. Title Case is too American-corporate.
- Curly quotes (`"…"` / `« »` for ES editorial moments). Em-dashes — like this — for soft pauses.
- Spanish punctuation: `¿…?` and `¡…!` always paired. Never lazy `?` only in ES copy.
- Numerals: spell out one through nine in body copy; numerals from 10. Times use 24h in ES (`14:00`), 12h in EN (`2:00 pm`).

### Bilingual structure

- Every patient-facing surface ships **ES + EN in parallel.** Default visible language follows the visitor; the toggle is always reachable.
- Never machine-translate. ES is the originating voice for clinical copy; EN is a parallel rewrite, not a literal translation. _"Una hora para soltar"_ → _"An hour to let go"_ (not _"An hour to release"_).
- Numbers, units, and clinical terms stay consistent across languages. "Osteopatía" / "Osteopathy" — same root, no aggressive localization.

### Emoji & ornamentation

- **No emoji.** Ever. Emoji break the calm clinical register instantly.
- **No exclamation marks** in marketing copy except the very rare warm welcome (`¡Bienvenida!` once on a thank-you page).
- A small set of unicode glyphs is allowed as quiet ornament: `·` (middle dot for separators), `—` (em-dash), `→` (only in nav/footer, never CTAs).

### Examples

> **Hero (ES):** _"Tu cuerpo recuerda. Yo te escucho."_
> **Hero (EN):** _"Your body remembers. I listen."_

> **Service card:** _"Osteopatía visceral · 60 min — Una sesión profunda para liberar tensión acumulada en el sistema digestivo y respiratorio."_

> **CTA:** _"Reservar una sesión"_ / _"Book a session"_ — not "Book Now!" or "Get Started."

> **Empty state on the booking calendar:** _"No quedan horarios esta semana. Te avisamos cuando se abran nuevos espacios."_

---

## Visual foundations

### Palette

The palette is the brief's law. All UI is built from these and only these:

| Token | Hex | Use |
|-------|-----|-----|
| `--bg` | `#FFFFFF` | Primary background |
| `--bg-soft` | `#F8FAFC` (Slate-50) | Section alternation, app shells |
| `--bronze` | `#C08A5E` | Primary action, key accent, link, brand mark |
| `--pastel-pink` | `#F7D9DA` | Soft surfaces (testimonials, calm callouts) |
| `--pastel-green` | `#E0F2F1` | Soft surfaces (services, "ready" states) |
| `--pastel-blue` | `#E1F5FE` | Soft surfaces (info, schedule, cross-border) |
| `--text` | `#1E293B` (Slate-800) | All body copy |
| `--text-muted` | `~Slate-500` | Secondary copy, meta |

Pastels are **surface colors** — never used for type, never used for icons except inside their own surface. Bronze is the **only saturated color** — it carries every CTA, link, and key brand moment. This restraint is what makes the system feel premium.

### Typography

Editorial serif for display + headings, clean sans for everything else.

- **Display / Headings:** _Cormorant Garamond_ — high-contrast serif with elegant restrained ligatures. Used at large sizes only (≥ 28px). Light to Medium weights. Slight negative tracking on hero (`-0.01em`).
- **Body / UI:** _Inter_ — neutral, hyper-legible sans. 400 / 500 / 600. Generous line-height (`1.6` for body, `1.4` for UI).

> **Caveat:** Brief did not specify exact fonts. Cormorant Garamond + Inter is a substitution chosen to match "elegant editorial serif + clean readable sans." If the clinic has a registered brand pairing (e.g. Canela / Söhne), please share so we can swap.

### Spacing

Generosity is the rule. Default to **more**, not less.

- Section padding: `p-8` minimum, `p-12` on hero / signature surfaces, `py-24` between major sections.
- Card padding: `p-6` minimum, `p-8` for primary content cards.
- The 4-pt baseline grid: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128`.

### Shapes & radii

- Cards: `rounded-2xl` (16px) baseline, `rounded-3xl` (24px) for hero / spotlight cards.
- Buttons: `rounded-full` for primary CTAs (pill shape). Secondary buttons may use `rounded-xl` (12px) when sitting alongside form fields.
- Inputs: `rounded-xl` (12px). Never sharp corners.
- Imagery: always softened — `rounded-2xl` on portraits, `rounded-3xl` on full-bleed feature images.

### Shadows & borders

Borders are minimized. Shadows do the lifting work, and they are **soft and wide** — never crisp.

```
--shadow-xs:  0 1px 2px   rgba(30, 41, 59, 0.04);
--shadow-sm:  0 4px 16px  rgba(30, 41, 59, 0.05);
--shadow-md:  0 12px 32px rgba(30, 41, 59, 0.06);
--shadow-lg:  0 24px 64px rgba(30, 41, 59, 0.08);
```

When a border is unavoidable (form fields, table dividers): `1px solid rgba(30,41,59,0.08)` — barely there.

### Backgrounds & imagery

- **Solid white or Slate-50.** No gradients on backgrounds. (One exception: a very soft radial wash of `--pastel-blue` at 20% opacity behind hero imagery, optional.)
- **Photography:** warm natural light, soft focus, hands-on-bodies imagery (treatment moments), interiors with linen / wood / plants. **No stock smiles.** Skin tones realistic, not over-saturated. Slight film grain is welcome; harsh contrast is not.
- **Negative space dominates.** A hero image may occupy 50% of the viewport with the other 50% as pure white.
- **No hand-drawn illustrations** unless the clinic provides them. No icon scribbles.

### Animation

> Animations exist to ease, never to surprise.

- **Easing:** `cubic-bezier(0.22, 0.61, 0.36, 1)` (ease-out-quart) — slow trail-off.
- **Durations:** **400–700ms** for most transitions. Hero fade-ins can go to 1200ms. Nothing under 250ms.
- **Patterns used:** gentle fade-up on scroll (12–16px translate, opacity 0→1), slow cross-fade on image swaps, breathing-style scale on the loading mark (`scale 1.00 → 1.02 → 1.00` over 4s).
- **Patterns banned:** bounces, springs with overshoot, parallax, shake, anything under 250ms, anything that draws attention to itself.

### Hover & press states

- **Hover (links / text):** color shift to `--bronze`, no underline appearing/disappearing — underline is on by default for text links, with `text-underline-offset: 4px` and a thin pen weight.
- **Hover (cards):** translate-Y `-2px` over 500ms with shadow stepping from `--shadow-sm` → `--shadow-md`. No scale.
- **Hover (primary button):** background darkens ~6% (bronze deepens), no scale.
- **Press (button):** scale `0.98` for 120ms, then settles. The only fast animation in the system, because press response must feel immediate.
- **Focus:** 2px bronze ring at 40% opacity, 4px offset. Always visible — this is a clinic, accessibility matters.

### Transparency & blur

- Used sparingly. The sticky nav uses `backdrop-blur-md` over `rgba(255,255,255,0.72)` to dissolve into the page.
- Image overlays may use a very soft white-to-transparent gradient (`linear-gradient(to top, rgba(255,255,255,0.85), transparent 40%)`) to host text on top of photography.
- No frosted-glass cards. No translucent UI panels.

### Cards

- Background: white (on `--bg-soft` sections) or `--bg-soft` (on white sections).
- Radius: `rounded-2xl` (16px).
- Shadow: `--shadow-sm` at rest, `--shadow-md` on hover.
- Border: none, except a hairline `1px solid rgba(30,41,59,0.06)` on cards that sit on white-on-white surfaces.
- Padding: `p-6` to `p-8`.

### Layout rules

- Max content width: **1200px** (marketing) / **1440px** (dashboard surfaces, if any).
- Hero compositions are asymmetric: image on one side, copy with breathing room on the other. Never centered hero stacks.
- Sticky elements: nav only, and it gets the backdrop-blur treatment so it never feels imposing.
- Footer is intentionally tall and quiet — addresses, hours, bilingual toggle, no marketing.

---

## Iconography

> **System: Lucide.** Stroke `1.5`, line-cap and line-join `round`. Used sparingly — icons clarify meta (clock, map-pin, calendar), they do not decorate.

### Rules

- **Library:** [Lucide](https://lucide.dev) — `lucide-react` in production, inline SVG in this kit. Substitution flag: the brief did not specify an icon library; Lucide was chosen because its low-contrast humanist line work matches the brand's calm tone.
- **Weight:** `stroke-width: 1.5` everywhere. Never `2` (too clinical-stern), never `1` (too thin to read on dark surfaces).
- **Sizes:** `14px` (inline with body text), `16px` (form fields, list bullets), `18–20px` (buttons), `24–28px` (feature callouts). Never larger — icons are not illustrations.
- **Color:** inherits `currentColor`. Default `var(--text)` for navigational/structural icons; `var(--bronze)` only when paired with a CTA, link, or as a quiet highlight.
- **No emoji.** Anywhere. (Reaffirmed from Content Fundamentals — emoji break the calm clinical register.)
- **No unicode glyphs as icons** except `→` for directional cues in nav/footer-only contexts. CTAs use the Lucide `arrow-right`, not `→`.
- **No hand-drawn illustrations** — if the clinic provides custom illustrations later, they live in `assets/illustrations/` and are flagged as a separate visual class from icons.

### In use

| Icon | Where |
|------|-------|
| `clock`         | Service cards (duration), booking confirmation |
| `calendar`      | Booking flow header, date displays |
| `map-pin`       | Address, cross-border note, footer |
| `check`         | Booking step completion, success states |
| `arrow-right`   | All "next/continue/learn more" CTAs |
| `phone` / `mail` | Footer contact only |
| `heart`         | Reserved for favorites / "save for later" if needed — not currently used |

See `preview/iconography.html` for the rendered set, and `ui_kits/website/components/Chrome.jsx` for the inline SVG definitions used in this kit.

---

## Caveats & open questions

1. **Fonts are substitutions.** Cormorant Garamond + Inter via Google Fonts. If the clinic owns a paid pairing, please share license + files.
2. **No real photography yet.** UI kit uses placeholder treatments. Clinic should supply a curated photography library (treatment rooms, hands-on-care moments, practitioner portraits).
3. **No real logo.** A wordmark using Cormorant Garamond is provided as a stand-in. If a vector logo exists, it should replace this.
4. **Cross-border specifics not detailed.** The brief mentions San Diego is secondary. We've reflected this in nav/footer prominence; please confirm the exact dual-location structure (one clinic with cross-border patients vs. two physical addresses).
5. **No codebase / Figma.** Components were modeled to spec, not pulled from real source. If a Next.js / React repo exists, attaching it would let us rebuild components 1:1.

---

## How to iterate

The fastest path to making this perfect:

1. Drop a logo file into `assets/` and we'll wire it through the kit.
2. Share 4–8 hero-quality photos and we'll replace placeholders.
3. If a Figma board or production codebase exists — attach it via the Import menu.
4. Tell us which 2–3 pages matter most for v1 (Home, Services, Book, About — currently all four are in the kit).
