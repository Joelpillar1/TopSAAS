-- Add feature screenshots gallery to products (JSONB array of image URLs / data URLs)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

alter table public.products
  add column if not exists screenshots jsonb;

comment on column public.products.screenshots is 'Up to 10 feature screenshots shown in a gallery on the listing page';
