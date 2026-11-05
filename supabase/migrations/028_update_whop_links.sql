-- Migration 028: Add Whop Checkout Links for Weekly Relaunch, One-Time Feature, and Per-Product Pass

insert into public.whop_payments_config (key, value, description) values
  ('checkout_url_weekly_relaunch', 'https://whop.com/topsaas/weekly-relaunch/', 'Whop Weekly Relaunch ($5/mo)'),
  ('checkout_url_onetime', 'https://whop.com/topsaas/one-time-fe/', 'Whop One-Time Feature Pass'),
  ('checkout_url_per_product_pass', 'https://whop.com/topsaas/per-product-pass/', 'Whop $49/mo Per-Product Pass')
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
  if p_plan_type in ('weekly_relaunch', 'weekly-relaunch', 'relaunch') then
    v_key := 'checkout_url_weekly_relaunch';
  elsif p_plan_type in ('onetime', 'one-time', 'one-time-fe', 'lifetime') then
    v_key := 'checkout_url_onetime';
  elsif p_plan_type in ('per_product_pass', 'per-product-pass', 'pro_monthly', 'pro') then
    v_key := 'checkout_url_per_product_pass';
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
