-- ============================================================
-- Migration 023: Add All Missing Columns to Products & Submissions
-- Run this in your Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
--
-- Resolves errors:
--   "column products.socials does not exist"
--   "column products.offer_code does not exist"
--   "column products.screenshots does not exist"
--
-- This script uses "ADD COLUMN IF NOT EXISTS" everywhere,
-- making it completely safe and idempotent to run.
-- ============================================================

-- 1. Ensure all rich product columns exist on products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS screenshots jsonb,
  ADD COLUMN IF NOT EXISTS demo_video_url text,
  ADD COLUMN IF NOT EXISTS twitter_handle text,
  ADD COLUMN IF NOT EXISTS socials jsonb,
  ADD COLUMN IF NOT EXISTS creator_name text,
  ADD COLUMN IF NOT EXISTS creator_username text,
  ADD COLUMN IF NOT EXISTS creator_x_handle text,
  ADD COLUMN IF NOT EXISTS creator_avatar text,
  ADD COLUMN IF NOT EXISTS creator_role text,
  ADD COLUMN IF NOT EXISTS offer_discount text,
  ADD COLUMN IF NOT EXISTS offer_code text,
  ADD COLUMN IF NOT EXISTS offer_url text,
  ADD COLUMN IF NOT EXISTS offer_details text,
  ADD COLUMN IF NOT EXISTS problem_it_solves text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS unique_selling_point text,
  ADD COLUMN IF NOT EXISTS what_it_does jsonb,
  ADD COLUMN IF NOT EXISTS features jsonb,
  ADD COLUMN IF NOT EXISTS use_cases jsonb,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS pricing_model text,
  ADD COLUMN IF NOT EXISTS key_highlights jsonb,
  ADD COLUMN IF NOT EXISTS bid_history jsonb,
  ADD COLUMN IF NOT EXISTS dino_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS description text;

-- 2. Ensure all rich submission columns exist on submissions table
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS screenshots jsonb,
  ADD COLUMN IF NOT EXISTS demo_video_url text,
  ADD COLUMN IF NOT EXISTS twitter_handle text,
  ADD COLUMN IF NOT EXISTS socials jsonb,
  ADD COLUMN IF NOT EXISTS creator_name text,
  ADD COLUMN IF NOT EXISTS creator_username text,
  ADD COLUMN IF NOT EXISTS creator_x_handle text,
  ADD COLUMN IF NOT EXISTS creator_avatar text,
  ADD COLUMN IF NOT EXISTS creator_role text,
  ADD COLUMN IF NOT EXISTS offer_discount text,
  ADD COLUMN IF NOT EXISTS offer_code text,
  ADD COLUMN IF NOT EXISTS offer_url text,
  ADD COLUMN IF NOT EXISTS offer_details text,
  ADD COLUMN IF NOT EXISTS problem_it_solves text,
  ADD COLUMN IF NOT EXISTS solution text,
  ADD COLUMN IF NOT EXISTS unique_selling_point text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS pricing_model text;

-- 3. Ensure comments table has user_avatar
ALTER TABLE IF EXISTS public.comments
  ADD COLUMN IF NOT EXISTS user_avatar text;

-- 4. Reload PostgREST schema cache so Supabase immediately recognizes the new columns
NOTIFY pgrst, 'reload schema';
