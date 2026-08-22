-- Create table to store DodoPayments configuration

create table if not exists public.dodo_payments_config (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert default configuration keys
insert into public.dodo_payments_config (key, value, description) values
  ('api_key', '', 'DodoPayments API key from dashboard'),
  ('product_7days', '', 'Product ID for 7-Day Featured Spot ($59)'),
  ('product_30days', '', 'Product ID for 30-Day Featured Spot ($199)'),
  ('api_base_url', 'https://test.dodopayments.com', 'DodoPayments API base URL (test or live)')
on conflict (key) do nothing;

-- Enable Row Level Security
alter table public.dodo_payments_config enable row level security;

-- Allow authenticated users to read config (but not modify)
create policy "Allow authenticated read access"
  on public.dodo_payments_config for select
  using (true);

-- Allow only admins to update config
create policy "Allow admin update access"
  on public.dodo_payments_config for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'moderator')
    )
  );

-- Create index for faster lookups
create index idx_dodo_payments_config_key on public.dodo_payments_config(key);
