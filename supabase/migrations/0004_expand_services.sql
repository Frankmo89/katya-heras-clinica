-- Migration: expand services table with rich content columns
-- Run this in the Supabase SQL Editor AFTER 0003_create_services_table.sql

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS subtitle_es      TEXT,
  ADD COLUMN IF NOT EXISTS subtitle_en      TEXT,
  ADD COLUMN IF NOT EXISTS hero_image       TEXT,
  ADD COLUMN IF NOT EXISTS gallery_images   TEXT[],
  -- Array of { time: string, title: string, desc: string }
  ADD COLUMN IF NOT EXISTS timeline         JSONB,
  -- Array of strings
  ADD COLUMN IF NOT EXISTS ideal_for        JSONB,
  -- Array of strings
  ADD COLUMN IF NOT EXISTS not_for          JSONB,
  -- Array of { question: string, answer: string }
  ADD COLUMN IF NOT EXISTS faqs             JSONB;
