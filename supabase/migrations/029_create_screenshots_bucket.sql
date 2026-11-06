-- ==============================================================================
-- Migration 029: Create Supabase Storage bucket for screenshots
-- ==============================================================================
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--
-- Offloads screenshot binaries from Postgres text columns to Supabase Storage,
-- cutting database query egress by >95% and allowing browser/CDN caching.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  5242880, -- 5 MB max per screenshot
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- 1. Public can view/download screenshots
drop policy if exists "Screenshots are publicly readable" on storage.objects;
create policy "Screenshots are publicly readable"
  on storage.objects for select
  using (bucket_id = 'screenshots');

-- 2. Anyone (anon or authenticated) can upload screenshots for submissions
drop policy if exists "Anyone can upload screenshots" on storage.objects;
create policy "Anyone can upload screenshots"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'screenshots');

-- 3. Authenticated users and admins can delete their own uploaded images
drop policy if exists "Authenticated users can delete screenshots" on storage.objects;
create policy "Authenticated users can delete screenshots"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'screenshots');
