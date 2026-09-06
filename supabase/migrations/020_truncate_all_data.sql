-- ==========================================================
-- 020_truncate_all_data.sql
-- Wipe all data for a clean slate — keeps tables, users,
-- functions, triggers, and RLS policies intact.
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ==========================================================

-- Delete in dependency order (children first so FK constraints are satisfied)
DELETE FROM public.upvotes;
DELETE FROM public.comments;
DELETE FROM public.submissions;
DELETE FROM public.products;
DELETE FROM public.site_settings;
DELETE FROM public.dodo_payments_config;

-- Re-seed default site_settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('featured_product_id', '', 'Active featured product ID'),
  ('featured_expires_at', '0', 'Expiry timestamp in milliseconds for featured product')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Re-seed default dodo_payments_config
INSERT INTO public.dodo_payments_config (key, value, description) VALUES
  ('api_key', '', 'DodoPayments API key from dashboard'),
  ('product_7days', '', 'Product ID for 7-Day Featured Spot ($59)'),
  ('product_30days', '', 'Product ID for 30-Day Featured Spot ($199)'),
  ('api_base_url', 'https://test.dodopayments.com', 'DodoPayments API base URL (test or live)')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = now();

-- Verify counts are zero (except settings which are re-seeded)
SELECT
  (SELECT count(*) FROM public.products)      AS products,
  (SELECT count(*) FROM public.submissions)   AS submissions,
  (SELECT count(*) FROM public.upvotes)       AS upvotes,
  (SELECT count(*) FROM public.comments)      AS comments,
  (SELECT count(*) FROM public.profiles)      AS profiles,
  (SELECT count(*) FROM public.site_settings) AS site_settings;
