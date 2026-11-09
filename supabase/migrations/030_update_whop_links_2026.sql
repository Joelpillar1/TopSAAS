-- Migration 030: Update Whop Direct Checkout Links for Sponsor, Featured Spot, and Verified Launch
-- 1 week Sponsor $10: https://whop.com/checkout/plan_Ux5pdAxT3WN7D
-- 1-Month Sponsor $29: https://whop.com/checkout/plan_VHCOSyqWd9l9Q
-- 1-Week Featured Spot $15: https://whop.com/checkout/plan_YGXtgHZnspc77
-- 1-Month Featured Spot $39: https://whop.com/checkout/plan_GBN00B27YgYdx
-- $19 Per Product Pass / Verified Launch: https://whop.com/checkout/plan_B4wY8ei9eab1S
-- Weekly Relaunch $5: https://whop.com/checkout/plan_81SmEHd2w16EG

insert into public.whop_payments_config (key, value, description) values
  ('checkout_url_sponsor_1wk', 'https://whop.com/checkout/plan_Ux5pdAxT3WN7D', 'Whop 1-Week Sponsor ($10/wk) Direct Checkout'),
  ('checkout_url_1wk', 'https://whop.com/checkout/plan_Ux5pdAxT3WN7D', 'Whop 1-Week Sponsor ($10/wk) Direct Checkout'),
  ('checkout_url_sponsor_1mo', 'https://whop.com/checkout/plan_bUdLJ46TGXi2C', 'Whop 1-Month Sponsor Direct Checkout'),
  ('checkout_url_1mo', 'https://whop.com/checkout/plan_bUdLJ46TGXi2C', 'Whop 1-Month Sponsor Direct Checkout'),
  ('checkout_url_featured_1wk', 'https://whop.com/checkout/plan_YGXtgHZnspc77', 'Whop 1-Week Featured Spot ($15/wk) Direct Checkout'),
  ('checkout_url_featured_1mo', 'https://whop.com/checkout/plan_GBN00B27YgYdx', 'Whop 1-Month Featured Spot ($39/mo) Direct Checkout'),
  ('checkout_url_onetime', 'https://whop.com/checkout/plan_B4wY8ei9eab1S', 'Whop $19 Per Product Pass / Verified Launch Direct Checkout'),
  ('checkout_url_per_product_pass', 'https://whop.com/checkout/plan_B4wY8ei9eab1S', 'Whop $19 Per Product Pass Direct Checkout'),
  ('checkout_url_weekly_relaunch', 'https://whop.com/checkout/plan_81SmEHd2w16EG', 'Whop Weekly Relaunch ($5/mo) Direct Checkout')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

create or replace function public.get_whop_checkout_url(p_plan_type text default '1mo')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_url text;
begin
  if p_plan_type in ('featured_1wk', 'featured1wk', 'featured-1wk') then
    v_key := 'checkout_url_featured_1wk';
  elsif p_plan_type in ('featured_1mo', 'featured1mo', 'featured-1mo') then
    v_key := 'checkout_url_featured_1mo';
  elsif p_plan_type in ('sponsor_1wk', 'sponsor1wk', 'sponsor-1wk', '1wk', 'weekly') then
    v_key := 'checkout_url_sponsor_1wk';
  elsif p_plan_type in ('sponsor_1mo', 'sponsor1mo', 'sponsor-1mo') then
    v_key := 'checkout_url_1mo';
  elsif p_plan_type in ('weekly_relaunch', 'weekly-relaunch', 'relaunch') then
    v_key := 'checkout_url_weekly_relaunch';
  elsif p_plan_type in ('onetime', 'one-time', 'one-time-fe', 'lifetime', 'verified_launch', 'per_product_pass', 'per-product-pass') then
    v_key := 'checkout_url_onetime';
  elsif p_plan_type = '3mo' then
    v_key := 'checkout_url_3mo';
  elsif p_plan_type = '1yr' then
    v_key := 'checkout_url_1yr';
  else
    v_key := 'checkout_url_1mo';
  end if;

  select value into v_url
  from public.whop_payments_config
  where key = v_key;

  return coalesce(v_url, '');
end;
$$;

grant execute on function public.get_whop_checkout_url(text) to anon, authenticated, service_role;
