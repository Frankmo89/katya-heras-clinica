-- Migration: add currency column to clinic_settings
-- Stores the active currency denomination for both services and the shop.
-- Only 'MXN' (Pesos Mexicanos) and 'USD' (Dólares Americanos) are allowed.
-- Existing RLS policies ("Anon can read clinic settings" and
-- "Authenticated can manage clinic settings") already cover this column
-- via SELECT / ALL respectively — no new policies are needed.

alter table public.clinic_settings
  add column if not exists currency text not null default 'MXN'
  check (currency in ('MXN', 'USD'));

-- Reload PostgREST schema cache so the new column is visible via the API.
notify pgrst, 'reload schema';
