-- Create table to store global site settings (e.g. active featured product)

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz default now()
);

-- Insert default keys
insert into public.site_settings (key, value, description) values
  ('featured_product_id', '', 'Active featured product ID'),
  ('featured_expires_at', '0', 'Expiry timestamp in milliseconds for featured product')
on conflict (key) do nothing;

-- Enable Row Level Security
alter table public.site_settings enable row level security;

-- Allow public read access to all visitors
create policy "Allow public read access to site_settings"
  on public.site_settings for select
  using (true);

-- Allow upsert/update access for payment callbacks and admins
create policy "Allow update access to site_settings"
  on public.site_settings for insert
  with check (true);

create policy "Allow modify access to site_settings"
  on public.site_settings for update
  using (true);
