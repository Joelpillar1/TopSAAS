-- Add creator profile + social links to products (JSONB array of { platform, url })
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

alter table public.products
  add column if not exists socials jsonb,
  add column if not exists creator_name text,
  add column if not exists creator_username text,
  add column if not exists creator_x_handle text;

comment on column public.products.socials is 'Product social links: X, GitHub, Product Hunt, Discord, LinkedIn, app stores, chrome web store';
comment on column public.products.creator_name is 'Display name of the person who submitted the product';
comment on column public.products.creator_username is 'Username/handle of the submitter';
comment on column public.products.creator_x_handle is 'X (Twitter) handle of the submitter';