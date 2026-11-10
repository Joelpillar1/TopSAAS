-- Create table to store Whop configuration securely
create table if not exists public.whop_payments_config (
  key text primary key,
  value text not null default '',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default rows with your Whop integration details
insert into public.whop_payments_config (key, value, description) values
  ('api_key', '', 'Whop API key from dashboard (configure securely in Supabase / Edge Secrets)'),
  ('webhook_secret', '', 'Whop Webhook signing secret (configure securely in Supabase / Edge Secrets)'),
  ('company_id', 'topsaas', 'Whop Company route / ID'),
  ('plan_1mo_id', 'plan_VHCOSyqWd9l9Q', 'Whop Plan ID for 1-Month Sponsor ($29)'),
  ('plan_3mo_id', 'plan_SMad32AkVoMeu', 'Whop Plan ID for 3-Month Sponsor ($69)'),
  ('plan_1yr_id', 'plan_2uumEoGYQUKtb', 'Whop Plan ID for 1-Year Partner Sponsor ($199)'),
  ('checkout_url_1mo', 'https://whop.com/checkout/plan_VHCOSyqWd9l9Q', 'Whop Direct Checkout URL for 1-Month Sponsor ($29)'),
  ('checkout_url_3mo', 'https://whop.com/checkout/plan_SMad32AkVoMeu', 'Whop Direct Checkout URL for 3-Month Sponsor ($69)'),
  ('checkout_url_1yr', 'https://whop.com/checkout/plan_2uumEoGYQUKtb', 'Whop Direct Checkout URL for 1-Year Partner Sponsor ($199)'),
  ('checkout_url_weekly_relaunch', 'https://whop.com/topsaas/weekly-relaunch/', 'Whop Weekly Relaunch ($5/mo)'),
  ('checkout_url_onetime', 'https://whop.com/topsaas/one-time-fe/', 'Whop One-Time Feature Pass'),
  ('checkout_url_per_product_pass', 'https://whop.com/topsaas/per-product-pass/', 'Whop $49/mo Per-Product Pass')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

-- Enable RLS to prevent unauthorized access
alter table public.whop_payments_config enable row level security;

-- Policies: public can ONLY read checkout URLs and plan IDs, never secrets
drop policy if exists "Allow read access to public checkout URLs" on public.whop_payments_config;
create policy "Allow read access to public checkout URLs"
  on public.whop_payments_config for select
  using (key like 'checkout_url_%' or key like 'plan_%');

-- Admins can manage all rows
drop policy if exists "Admins can manage whop_payments_config" on public.whop_payments_config;
create policy "Admins can manage whop_payments_config"
  on public.whop_payments_config for all
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Indexes
create index if not exists idx_whop_payments_config_key on public.whop_payments_config(key);

-- RPC function to safely fetch the checkout link for any plan from Supabase
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

-- Grant execution to public/anon
grant execute on function public.get_whop_checkout_url(text) to anon, authenticated, service_role;

-- Clean up obsolete Dodo config table if exists
drop table if exists public.dodo_payments_config cascade;
