---
name: katya-heras-design
description: Use this skill to generate well-branded interfaces and assets for Katya Heras Clínica (osteopathy & holistic wellness), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and a website UI kit for prototyping in the "Holistic Luxury" aesthetic.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files:

- `colors_and_type.css` — all design tokens (colors, type, spacing, radii, shadows, motion)
- `fonts/` — font notes (currently Cormorant Garamond + Inter via Google Fonts)
- `assets/` — wordmark, monogram, brand imagery
- `preview/` — rendered cards for every foundational concept (colors, type, spacing, components, voice)
- `ui_kits/website/` — high-fidelity React/JSX recreation of the marketing site (Home, Services, Booking, About) with shared components

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Always link `colors_and_type.css` for tokens, and prefer the patterns shown in `ui_kits/website/components/` for buttons, nav, cards, forms, and language toggles.

If working on production code, read the rules in `README.md` (especially Visual Foundations, Content Fundamentals, and Iconography) to become an expert in designing for this brand. Use Tailwind classes that match the documented palette: `bg-white` / `bg-slate-50`, text `slate-800`, accent `#C08A5E` (bronze), pastels for surfaces only, `rounded-2xl`/`3xl` cards, `rounded-full` CTAs, soft wide shadows, `p-8`+ padding. Pair Cormorant Garamond (serif headings, ≥28px) with Inter (body, UI). Always design with bilingual ES/EN structure in mind.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (audience, surface, language priority, photography availability), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
