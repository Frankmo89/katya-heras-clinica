# Katya Heras Clinic — Comprehensive SaaS Platform

> A full-stack clinical management system and patient-facing portal built for a cross-border osteopathy clinic operating between Tecate, México and San Diego, CA.

[![Next.js](https://img.shields.io/badge/Next.js_15-App_Router-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%7C_Storage_%7C_RLS-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-Utility--First-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

---

## Project Overview

This platform replaces a fragmented workflow — paper scheduling, scattered patient notes, and no e-commerce presence — with a unified digital ecosystem. It serves two audiences simultaneously:

- **Patients** — a polished, bilingual (ES/EN) public portal for browsing services, purchasing products, and self-booking appointments in a 3-step guided flow.
- **The clinic operator** — a fully featured admin panel covering scheduling, clinical records, inventory, and site content, all from a single dashboard.

The entire system is built on a **serverless, zero-ops infrastructure**: Supabase handles the database (PostgreSQL with Row-Level Security), file storage, and authentication. Next.js App Router provides SSR where data freshness matters and client-side interactivity where responsiveness does.

---

## Key Features

### Smart Booking Engine
- Dynamic availability computed in real time from the clinic's weekly schedule, manual slot blocks, and existing confirmed bookings — preventing double-bookings at the database level via constraint validation.
- Multi-step UX (Service → Date & Time → Contact) with a persistent stepper and in-progress state preserved across route re-renders.
- Automated WhatsApp notification dispatch on booking confirmation via a dedicated Next.js API route, with graceful fallback if the webhook fails.
- Admin controls to globally disable online bookings with a single toggle, surfacing a contextual message to patients.

### Clinical CRM & Patient EMR
- Searchable patient directory with server-side filtering and autocomplete routing from the appointments list.
- Per-patient clinical history module: structured JSONB records supporting multi-entry session notes, fully editable from the admin panel.
- Individual patient profile pages with complete appointment history and expandable clinical notes.
- Supabase RLS policies ensure patient data is never accessible to unauthenticated or unauthorized requests at the API layer.

### Custom Headless CMS
- Clinic operators manage all public-facing content from the admin panel: hero copy, philosophy text, image galleries (uploaded directly to Supabase Storage), and service descriptions.
- Testimonials managed as a dynamic JSONB array — operators add, edit, and reorder testimonials via an in-panel UI; the homepage carousel hydrates from this column at request time with zero client JS overhead.
- Single-row `clinic_settings` table pattern keeps the schema clean and avoids migration complexity for content updates.

### Service & Appointment Carousel
- Pixel-accurate responsive carousel built from scratch (zero external library dependency): `useLayoutEffect` computes card width from a container ref before first paint, eliminating layout flash on hydration.
- Auto-advances every 8 s with a `resetKey` pattern to restart the timer on manual navigation, cleanly guarding against stale closures in `setInterval` callbacks.
- Shows 3 cards on desktop (≥ 1024 px) and 1 on mobile, computed from container width — no hardcoded breakpoints.

### Multi-Currency Local E-Commerce
- Product catalog with category filtering and a slide-in cart drawer.
- Currency toggling (MXN ↔ USD) implemented statelessly — a single formatting utility reads the locale preference from context and formats on the fly, with no global state manager or server round-trips.
- In-clinic pickup logistics model: no shipping infrastructure, no third-party payment gateway overhead.

### Fully Responsive, Bilingual UI
- Mobile-first layout throughout: responsive breakpoints on every section, touch-target-compliant interactive elements (≥ 44 px), and `overflow-x-auto` horizontal-scroll tables in admin views.
- Language toggle (ES/EN) via a lightweight React context — zero library overhead, zero route changes, instant switch.
- Admin panel features a tabbed interface (Schedules / Clinic / Website) with `overflow-x-auto` navigation for small screens.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 (CSS custom properties) |
| Database | Supabase — PostgreSQL 15 |
| Auth & RLS | Supabase Auth + Row-Level Security policies |
| File Storage | Supabase Storage (signed public URLs) |
| Icons | lucide-react |
| Deployment | Vercel (edge-optimized) |

---

## Local Setup

### Prerequisites
- Node.js >= 20
- A Supabase project with the migrations in `supabase/migrations/` applied in order

### 1. Clone & install

```bash
git clone https://github.com/your-username/katya-heras-clinica.git
cd katya-heras-clinica
npm install
```

### 2. Configure environment variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` is used only in server-side API routes and is never exposed to the browser.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

### 4. Apply database migrations

Migrations live in `supabase/migrations/`. Apply them in sequence via the Supabase dashboard SQL editor or the Supabase CLI:

```bash
supabase db push
```

---

## Project Structure

```
src/
├── app/                  # Next.js App Router — pages & API routes
│   ├── admin/            # Protected admin panel (CRM, CMS, bookings)
│   ├── api/              # Server-side API routes (notifications)
│   ├── reservar/         # Patient-facing 3-step booking flow
│   ├── servicios/        # Service catalog
│   └── tienda/           # E-commerce storefront
├── components/
│   ├── admin/            # Admin-specific layout components
│   └── ui/               # Shared UI (carousels, cards, forms)
├── context/              # React contexts (language, clinic settings)
├── data/                 # Typed static data (services, products)
└── lib/                  # Supabase client & utility functions
supabase/
└── migrations/           # Versioned SQL migrations (17 total)
```

---

## Architecture Notes

See [CASE_STUDY.md](./CASE_STUDY.md) for a deep-dive into the architectural decisions, technical tradeoffs, and engineering challenges solved during development.

---

## License

Built for a specific client. Shared here for portfolio purposes only. All rights reserved.
