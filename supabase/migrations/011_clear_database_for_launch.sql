-- ==========================================================
-- 011_clear_database_for_launch.sql
-- Reset all tables and data for clean public launch
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==========================================================

-- 1. Delete all existing test products
DELETE FROM public.products;

-- 2. Delete all submissions in review queue
DELETE FROM public.submissions;

-- 3. Delete all test upvotes
DELETE FROM public.upvotes;

-- 4. Clear global featured spot settings
DELETE FROM public.site_settings WHERE key IN ('featured_product_id', 'featured_expires_at');

-- Verify counts are zero
SELECT
  (SELECT count(*) FROM public.products) AS products_count,
  (SELECT count(*) FROM public.submissions) AS submissions_count,
  (SELECT count(*) FROM public.upvotes) AS upvotes_count,
  (SELECT count(*) FROM public.site_settings) AS site_settings_count;
