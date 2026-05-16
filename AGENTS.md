# Project AI Agent Rules — Katya Heras Clinic

> **STOP.** This is NOT the Next.js from your training data. Read `node_modules/next/dist/docs/` before writing any routing, data-fetching, or metadata code. Breaking changes exist.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, Turbopack |
| Language | TypeScript 5, strict mode |
| Styling | Tailwind CSS 4 |
| Database | Supabase — PostgreSQL (RLS enforced) |
| Storage | Supabase Storage (signed public URLs) |
| State | React Context only — no Redux, no Zustand |

---

## Component Model

- **Default to Server Components.** Every file in `src/app/` is a server component unless it requires interactivity.
- **Add `"use client"` only when the component uses:** `useState`, `useEffect`, `useLayoutEffect`, `useRef`, event handlers, browser APIs, or any React context hook.
- **Never mix concerns.** If a server component needs to pass interactive behavior to a child, extract a dedicated `"use client"` leaf component — do not promote the whole tree.
- Layouts in `src/app/admin/layout.tsx` and `src/app/layout.tsx` are the correct place to provide context. Do not add providers inside pages.

---

## Supabase Rules

- **Never expose `SUPABASE_SERVICE_ROLE_KEY` in any file that is or could become a client component.** It belongs only in `src/app/api/` route handlers.
- **Always depend on RLS** for data protection. Do not replicate access control in application code.
- The **`clinic_settings` table always has exactly one row (`id = 1`).** Query it with `.eq("id", 1).single()`. Never insert; always `UPDATE ... WHERE id = 1`.
- **JSONB columns** (`testimonials_list`, `history_records`): always define and validate types before rendering. The `Testimonial` type is exported from `src/components/ui/TestimonialCarousel.tsx`. Use it.
- **Migrations** live in `supabase/migrations/` as sequentially numbered SQL files (`0001_...` → `0017_...`). New migrations must continue the sequence and use `IF NOT EXISTS` / `IF EXISTS` guards so they are safe to replay.

---

## TypeScript

- **Never use `any`.** Define explicit interfaces for every Supabase response and component prop.
- Type Supabase payloads at the call site — do not cast with `as`.
- Prefer `type` for unions and aliases; use `interface` for extensible component props.

---

## Tailwind CSS

- **Mobile-first always.** Base styles target mobile; use `md:` and `lg:` to scale up. Never write desktop-first overrides.
- Standard scale values are preferred. Arbitrary values (`text-[clamp(...)]`, `max-w-[1200px]`, `px-[22px]`) are acceptable for design-precision requirements — do not avoid them when they are the right tool.
- **CSS custom properties** are defined in `src/app/globals.css` and drive the design system. Use them — do not hardcode hex values:
  - `--color-bronze`, `--color-bronze-hover`
  - `--color-text`, `--color-text-muted`
  - `--color-background`, `--color-background-soft`
  - `--color-surface-green`, `--color-surface-blue`, `--color-surface-pink`
  - `--shadow-sm`, `--shadow-md`

---

## Performance & UX Patterns

- **Prefer SSR for content pages.** Fetch in async server components; pass data as props to client leaves.
- **Eliminate layout shift** in carousels and computed-layout components using `useLayoutEffect` with a container `ref` — not `useEffect`, not media query listeners.
- **`setInterval` in carousels:** use a `useRef` to track current index (avoids stale closures) and a `resetKey` state variable (incremented on manual navigation) as the `useEffect` dependency to restart the timer cleanly.
- **Avoid client-side fetches** for data that is available at render time. Only use `useEffect` + fetch for truly dynamic, user-triggered data loads (e.g., availability slots after a date is selected).

---

## Project Conventions

- Public UI components live in `src/components/ui/`.
- Admin-only components live in `src/components/admin/`.
- Global contexts (`ClinicSettingsContext`, `LanguageContext`) are in `src/context/` — read them with their exported hooks, do not access `useContext` directly.
- Utility functions and the Supabase client are in `src/lib/`.
- Static typed data (services, products) lives in `src/data/` — do not fetch this from the database at runtime.
