# Case Study: Katya Heras Clinic Platform

**A technical deep-dive into the architecture, decisions, and engineering challenges of building a full-stack clinical SaaS from the ground up.**

---

## 1. The Problem

A solo-practitioner osteopathy clinic operating across the US–México border faced a set of compounding operational problems that are common in small healthcare practices but painful to solve without custom software:

- **Scheduling chaos.** Appointments were managed via WhatsApp and a paper calendar. There was no system for preventing double-bookings, no way to block days in advance, and no record of cancellations.
- **No patient continuity.** Clinical notes lived in physical folders. Cross-referencing a patient's history required physical presence at the clinic. There was no searchable record.
- **Zero digital commerce.** Products sold at the clinic (oils, candles, accessories) had no online presence. Sales were entirely opportunity-based — if a patient didn't pick something up during their session, the sale was lost.
- **Fragmented content.** The clinic's branding, copy, and imagery were scattered across Canva exports and a static HTML page. Any update required a developer.

The goal was a **single platform that unified all of this** — without requiring the clinic operator to learn anything beyond a web browser.

---

## 2. Architecture Decisions

### Why Next.js App Router (with a mix of SSR and Client Components)

The public-facing pages (home, services, shop, about) are **async server components** by default. This is a deliberate choice:

- Content like the hero image, service list, and testimonials is managed via the CMS and needs to be **fresh on every request** — ISR would introduce a staleness window, and client-side fetching would cause layout shift and FOUC.
- SSR also means **zero JavaScript overhead** for purely presentational sections. The testimonial carousel and service cards are the only sections that opt into `"use client"`, and only because they require DOM measurements (`useLayoutEffect`) or interval-based animation.

The admin panel is entirely client-side (`"use client"`) because it requires complex, stateful multi-step interactions — the config page alone manages six independent sections of form state simultaneously.

### Why Supabase over a Custom Backend

Three reasons, all security-motivated:

1. **Row-Level Security (RLS).** Patient data is sensitive. Supabase's Postgres RLS policies enforce access rules at the database engine layer — not in application code where they can be accidentally bypassed. Even if a bug in the API exposed the wrong query, the DB would reject unauthorized reads.
2. **Storage with signed URLs.** Clinic images are stored in Supabase Storage buckets with public read policies. Uploads go through the Supabase JS client using the service role key, which is never exposed to the browser — only used in server-side API routes.
3. **Zero-ops scaling.** The clinic is not a high-traffic service, but it should never go down on a busy Monday morning. Supabase's managed Postgres eliminates connection pooling, patching, and backup concerns entirely.

### The Single-Row Settings Table Pattern

Rather than modeling `clinic_settings` as a lookup table or a normalized entity, it is implemented as a **single row with id = 1** containing ~25 columns for every configurable aspect of the clinic (hero copy, images, phone number, booking toggle, testimonials list, currency config, etc.).

This is a conscious denormalization. The alternatives — a key-value settings table, or multiple settings tables — both introduce indirection that makes reads slower and application code more complex. With a single row, the entire settings object can be fetched in one query and passed to any component that needs it. Updates are a single `UPDATE ... WHERE id = 1`.

The tradeoff is that schema changes require migrations. This is acceptable: the migration list is versioned, sequential, and each one is a single `ALTER TABLE ADD COLUMN IF NOT EXISTS` — safe to replay and easy to audit.

### The `clinic_settings` Context Provider

On the client side, settings are distributed via a React context (`ClinicSettingsContext`) populated at the layout level. This avoids prop-drilling through arbitrarily deep component trees and means any component — including carousels, the language toggle, and the booking form — can read settings without issuing a new network request.

The context is populated server-side in the root layout, serialized as a JSON prop to the client provider, and hydrated once. No re-fetches, no loading states for settings consumers.

---

## 3. Technical Challenges Solved

### Challenge 1: Preventing Double-Bookings Without a Queue

The booking flow is a stateless, multi-step client-side form. When a patient submits step 3 (contact details), the server must validate that the selected slot is still available — another patient may have booked it in the time between the patient reaching step 2 and submitting step 3.

The solution is a **two-layer guard**:

1. The slot selection UI (step 2) queries `available_slots` and `bookings` in real time to build the availability grid. Slots that are blocked or already booked are rendered as disabled buttons, never selectable.
2. On submission, the API route performs a **read-before-write with a conflict check**: it queries `bookings` for the same `(date, time, service_id)` tuple before inserting. If a conflict is found, it returns a `409 Conflict` and the UI surfaces a specific error message prompting the patient to select a different time — without losing the rest of their form data.

A database-level unique constraint on `(date, time)` provides a final backstop against any race condition that slips through both checks.

### Challenge 2: The Custom Carousel Without Layout Flash

Building a carousel that shows exactly 3 cards on desktop and exactly 1 on mobile sounds trivial — until you factor in SSR hydration. The problem: the server renders the component without knowing the client's viewport, so any approach that reads `window.innerWidth` will cause a flash of incorrect content on hydration.

The solution uses `useLayoutEffect` (which fires synchronously before the browser paints) to read the container's actual rendered width via a `ref` on mount:

```typescript
useLayoutEffect(() => {
  if (!containerRef.current) return;
  const w = containerRef.current.offsetWidth;
  const perPage = w >= 1024 ? 3 : 1;
  const cardW = perPage === 1 ? w : (w - CARD_GAP * (perPage - 1)) / perPage;
  setCardWidth(cardW);
  setPerPage(perPage);
}, []);
```

Because `useLayoutEffect` runs before paint, the carousel renders at the correct size on the first frame the user sees — no flash, no reflow. The CSS fallback (`w-full shrink-0`) handles the zero-width initial render on the server without breaking the layout.

### Challenge 3: Stale Closures in the Auto-Advance Interval

Auto-advancing carousels with `setInterval` are a classic source of stale closure bugs: the interval callback captures the index value from its creation scope and never sees updates.

The solution uses two patterns in combination:

1. A `useRef` that is kept in sync with the current index on every render. The interval callback reads from the ref (always current) rather than from the closed-over state variable.
2. A `resetKey` state variable that is incremented on every manual navigation action. The `useEffect` that sets up the interval has `resetKey` in its dependency array, so it tears down and restarts the interval — with a fresh closure — any time the user manually changes slides.

```typescript
const indexRef = useRef(current);
indexRef.current = current;

useEffect(() => {
  const id = setInterval(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, 8000);
  return () => clearInterval(id);
}, [resetKey, total]);
```

This guarantees the auto-advance timer always resets after a manual interaction, matching the UX expectation that "the countdown starts fresh when I touch it."

### Challenge 4: Dynamic JSONB Array Management for Testimonials

The original design stored a single testimonial quote as two varchar columns. The CMS upgrade required supporting an arbitrary-length array of `{ quote, author }` objects, editable from the admin panel.

At the database layer, this was a single `ALTER TABLE ADD COLUMN testimonials_list jsonb NOT NULL DEFAULT '[]'` — one migration, no join table, no new API endpoint.

At the application layer, the admin panel renders the array as a managed list: each entry is an editable pair of text inputs, with add (append empty object) and delete (filter by index) handlers that operate on an in-memory copy of the array before saving. The entire array is saved in a single `UPDATE` on confirmation.

The homepage carousel receives the array as a typed `Testimonial[]` prop via SSR, iterates it with `Array.from`, and falls back to a hardcoded bilingual list if the array is empty — ensuring the page is never blank during initial setup.

### Challenge 5: Stateless Multi-Currency Without a State Manager

Displaying prices in either MXN or USD without a global state manager (Redux, Zustand, etc.) required a disciplined architecture:

- Currency preference is stored in `clinic_settings` (a single `currency` column: `"MXN"` or `"USD"`) and read at the component level via the settings context.
- A single `formatPrice(amount, currency)` utility function handles all formatting logic. It reads the currency from context and applies `Intl.NumberFormat` with the appropriate locale and currency code.
- Exchange rate (if USD is selected) is stored as a `decimal` column in `clinic_settings`, editable from the admin panel — no third-party API, no caching layer, no stale rate problem.

The result: currency "toggling" is actually a **settings update**. The admin changes the preferred currency in the config panel, saves, and all prices across the storefront update on the next page load via SSR — without any client-side global state.

---

## 4. What This Demonstrates

| Engineering Principle | Where It Appears |
|---|---|
| Defense-in-depth security | RLS policies + server-side key usage + conflict-checked writes |
| Progressive enhancement | SSR public pages, CSR only where interactivity is required |
| Schema design for operational simplicity | Single-row settings, JSONB for flexible content |
| Avoiding over-engineering | No state manager, no cache layer, no microservices |
| Mobile-first UX discipline | Responsive breakpoints, touch targets, overflow-safe admin tables |
| Stale closure hygiene | `useRef` + `resetKey` pattern in all interval-based hooks |
| Type safety at the boundary | Typed Supabase responses, typed context values, no `any` in business logic |

This project is deliberately free of framework-for-framework's-sake decisions. Every architectural choice traces directly to a business requirement or a specific class of bug it prevents.
