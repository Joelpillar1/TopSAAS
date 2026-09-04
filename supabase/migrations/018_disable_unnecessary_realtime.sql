-- ==============================================================================
-- Supabase Realtime Quota Protection & Optimization
-- ==============================================================================
--
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- This dynamically checks and drops high-write tables from `supabase_realtime`
-- without throwing errors if a table is not currently published.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename IN ('products', 'comments', 'site_settings', 'profiles')
  LOOP
    EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I;', tbl);
    RAISE NOTICE 'Dropped % from supabase_realtime publication', tbl;
  END LOOP;
END $$;
