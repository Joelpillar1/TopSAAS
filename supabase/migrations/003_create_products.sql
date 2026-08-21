-- Create products table to persist the directory
-- Run in Supabase SQL Editor

create table if not exists public.products (
  id text primary key,
  rank integer not null default 1,
  previous_rank integer,
  name text not null,
  tagline text not null,
  url text not null,
  logo_url text,
  twitter_handle text,
  category text not null,
  upvotes integer not null default 0,
  total_bid integer not null default 0,
  clicks integer not null default 0,
  created_at bigint not null,
  updated_at bigint not null,
  is_user_owned boolean default false,
  verified boolean default false,
  description text,
  what_it_does jsonb,
  features jsonb,
  use_cases jsonb,
  target_audience text,
  pricing_model text,
  key_highlights jsonb,
  bid_history jsonb,
  db_created_at timestamptz default now(),
  db_updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Products are viewable by everyone"
  on public.products for select using (true);

create policy "Authenticated users can insert products"
  on public.products for insert to authenticated with check (true);

create policy "Authenticated users can update products"
  on public.products for update to authenticated using (true);

create policy "Authenticated users can delete products"
  on public.products for delete to authenticated using (true);

-- Allow anon reads (for unauthenticated browsing)
create policy "Anonymous can read products"
  on public.products for select to anon using (true);

create or replace function public.update_products_timestamp()
returns trigger as $$
begin
  new.db_updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger products_updated_at
  before update on public.products
  for each row
  execute function public.update_products_timestamp();

alter publication supabase_realtime add table public.products;
