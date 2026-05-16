-- Migration: create products table for the Tienda (store) module
-- Run this in the Supabase SQL Editor AFTER 0004_expand_services.sql

CREATE TABLE IF NOT EXISTS public.products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title_es       TEXT NOT NULL,
  title_en       TEXT,
  description_es TEXT,
  description_en TEXT,
  price          NUMERIC(10, 2),
  category       TEXT,
  card_style     TEXT,   -- 'editorial' | 'minimal' | 'polaroid'
  tone           TEXT,   -- 'pink' | 'green' | 'blue' | 'bronze'
  stock          INTEGER DEFAULT 0,
  images         TEXT[], -- Array of public Storage URLs
  details        JSONB   -- Array of { label: string, value: string }
);

-- ── Row Level Security ────────────────────────────────────────────────────
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anon users can read all products (public storefront)
CREATE POLICY "products_anon_select"
  ON public.products
  FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can insert new products
CREATE POLICY "products_auth_insert"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update any product
CREATE POLICY "products_auth_update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete any product
CREATE POLICY "products_auth_delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (true);
