-- Add demo_video_url to products and submissions tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

alter table public.products
  add column if not exists demo_video_url text;

alter table public.submissions
  add column if not exists demo_video_url text;

comment on column public.products.demo_video_url is 'URL to product demo video (YouTube, Loom, Vimeo, etc.)';
comment on column public.submissions.demo_video_url is 'URL to product demo video (YouTube, Loom, Vimeo, etc.)';
