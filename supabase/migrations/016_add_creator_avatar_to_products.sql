-- Add creator avatar & role to products and submissions tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

alter table public.products
  add column if not exists creator_avatar text,
  add column if not exists creator_role text;

alter table public.submissions
  add column if not exists creator_avatar text,
  add column if not exists creator_role text;

comment on column public.products.creator_avatar is 'Profile image URL of the creator / founder';
comment on column public.products.creator_role is 'Role or title of the founder (e.g. Founder & CEO, Creator)';
