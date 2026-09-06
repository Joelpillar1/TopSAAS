-- Add offer/discount and rich fields to products and submissions tables
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

alter table public.products
  add column if not exists screenshots jsonb,
  add column if not exists demo_video_url text,
  add column if not exists socials jsonb,
  add column if not exists creator_name text,
  add column if not exists creator_username text,
  add column if not exists creator_x_handle text,
  add column if not exists creator_avatar text,
  add column if not exists creator_role text,
  add column if not exists offer_discount text,
  add column if not exists offer_code text,
  add column if not exists offer_url text,
  add column if not exists offer_details text;

alter table public.submissions
  add column if not exists screenshots jsonb,
  add column if not exists demo_video_url text,
  add column if not exists socials jsonb,
  add column if not exists creator_name text,
  add column if not exists creator_username text,
  add column if not exists creator_x_handle text,
  add column if not exists creator_avatar text,
  add column if not exists creator_role text,
  add column if not exists offer_discount text,
  add column if not exists offer_code text,
  add column if not exists offer_url text,
  add column if not exists offer_details text,
  add column if not exists problem_it_solves text,
  add column if not exists solution text,
  add column if not exists unique_selling_point text;

comment on column public.products.offer_discount is 'Discount label (e.g. 20% OFF, $50 Credit)';
comment on column public.products.offer_code is 'Coupon or promo code';
comment on column public.products.offer_url is 'Special redemption or offer URL';
comment on column public.products.offer_details is 'Fine print or conditions for the offer';
