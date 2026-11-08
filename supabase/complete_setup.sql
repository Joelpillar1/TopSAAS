-- ==============================================================================
-- TopSAAS Complete Database Setup (Single-File Migration for New Project)
-- ==============================================================================
-- Run this ONCE in your new Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
--
-- This script sets up:
--   1. Extensions
--   2. Profiles & Admin Auth Functions (is_admin, promote_first_admin)
--   3. Submissions Table (All columns, RLS read/write protections)
--   4. Products Directory Table (All columns, RLS)
--   5. Upvotes & Comments Tables
--   6. Site Settings & App Secrets Tables
--   7. Whop Payments Configuration & RPC Functions
--   8. Atomic RPCs (increment_product_clicks, increment_product_upvotes)
--   9. High-performance Database Indexes
--  10. Supabase Storage Bucket ('screenshots') & Storage RLS Policies
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ──────────────────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES TABLE & AUTH TRIGGER
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin', 'moderator')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile row on OAuth / Email signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin helper functions
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$ language sql security definer stable;

create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_user_id;
end;
$$ language plpgsql security definer;

create or replace function public.promote_first_admin(target_email text)
returns void as $$
begin
  update public.profiles set role = 'admin', updated_at = now() where email = target_email;
  if not found then
    raise exception 'User with email % not found', target_email;
  end if;
end;
$$ language plpgsql security definer;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. PRODUCTS DIRECTORY TABLE
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id text primary key,
  rank integer not null default 1,
  previous_rank integer,
  name text not null,
  tagline text not null,
  url text not null,
  logo_url text,
  screenshots jsonb,
  demo_video_url text,
  twitter_handle text,
  socials jsonb,
  creator_name text,
  creator_username text,
  creator_x_handle text,
  creator_avatar text,
  creator_role text,
  category text not null,
  upvotes integer not null default 0,
  dino_score integer default 0,
  total_bid integer not null default 0,
  clicks integer not null default 0,
  created_at bigint not null,
  updated_at bigint not null,
  submitted_by uuid references auth.users(id) on delete set null,
  is_user_owned boolean default false,
  verified boolean default false,
  is_sponsored boolean default false,
  sponsor_tier text,
  sponsor_started_at bigint,
  sponsor_expires_at bigint,
  sponsor_contact_email text,
  sponsor_clicks integer default 0,
  pricing_model text,
  target_audience text,
  offer_discount text,
  offer_code text,
  offer_url text,
  offer_details text,
  problem_it_solves text,
  solution text,
  unique_selling_point text,
  description text,
  what_it_does jsonb,
  features jsonb,
  use_cases jsonb,
  key_highlights jsonb,
  bid_history jsonb,
  auto_relaunch boolean default false,
  relaunch_weeks text[],
  is_relaunched boolean default false,
  last_relaunched_at bigint,
  scheduled_launch_week text,
  scheduled_launch_date text,
  db_created_at timestamptz default now(),
  db_updated_at timestamptz default now()
);

alter table public.products enable row level security;

drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone"
  on public.products for select using (true);

drop policy if exists "Authenticated users can insert products" on public.products;
create policy "Authenticated users can insert products"
  on public.products for insert to authenticated with check (true);

drop policy if exists "Authenticated users can update products" on public.products;
create policy "Authenticated users can update products"
  on public.products for update to authenticated using (true);

drop policy if exists "Authenticated users can delete products" on public.products;
create policy "Authenticated users can delete products"
  on public.products for delete to authenticated using (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. SUBMISSIONS QUEUE TABLE
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.submissions (
  id text primary key,
  name text not null,
  tagline text not null,
  url text not null,
  logo_url text,
  screenshots jsonb,
  demo_video_url text,
  twitter_handle text,
  socials jsonb,
  creator_name text,
  creator_username text,
  creator_x_handle text,
  creator_avatar text,
  creator_role text,
  category text not null,
  backer_name text not null default 'Creator',
  backer_email text,
  status text not null default 'under_review' check (status in ('under_review', 'approved', 'rejected')),
  submitted_at bigint not null,
  reviewed_at bigint,
  rejection_reason text,
  target_audience text,
  pricing_model text,
  offer_discount text,
  offer_code text,
  offer_url text,
  offer_details text,
  problem_it_solves text,
  solution text,
  unique_selling_point text,
  description text,
  what_it_does jsonb,
  features jsonb,
  use_cases jsonb,
  key_highlights jsonb,
  auto_relaunch boolean default false,
  auto_relaunch_paid boolean default false,
  auto_relaunch_paid_at bigint,
  verified boolean default false,
  scheduled_launch_week text,
  scheduled_launch_date text,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.submissions enable row level security;

-- Protected reads (Migration 025)
drop policy if exists "Submissions are viewable by everyone" on public.submissions;
drop policy if exists "Approved submissions are public" on public.submissions;
create policy "Approved submissions are public"
  on public.submissions for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "Owners can read their own submissions" on public.submissions;
create policy "Owners can read their own submissions"
  on public.submissions for select to authenticated
  using (
    submitted_by = auth.uid()
    or (backer_email is not null and lower(backer_email) = lower(auth.jwt() ->> 'email'))
  );

drop policy if exists "Admins can read all submissions" on public.submissions;
create policy "Admins can read all submissions"
  on public.submissions for select to authenticated
  using (public.is_admin());

-- Protected writes (Migration 026)
drop policy if exists "Authenticated users can submit" on public.submissions;
create policy "Authenticated users can submit"
  on public.submissions for insert to authenticated
  with check (status = 'under_review' and (submitted_by is null or submitted_by = auth.uid()));

drop policy if exists "Anonymous can submit" on public.submissions;
create policy "Anonymous can submit"
  on public.submissions for insert to anon
  with check (status = 'under_review' and submitted_by is null);

drop policy if exists "Admins can update any submission" on public.submissions;
create policy "Admins can update any submission"
  on public.submissions for update to authenticated
  using (public.is_admin());

drop policy if exists "Owners can update their pending submission" on public.submissions;
create policy "Owners can update their pending submission"
  on public.submissions for update to authenticated
  using (
    status = 'under_review'
    and (
      submitted_by = auth.uid()
      or (backer_email is not null and lower(backer_email) = lower(auth.jwt() ->> 'email'))
    )
  )
  with check (status = 'under_review');

drop policy if exists "Admins can delete any submission" on public.submissions;
create policy "Admins can delete any submission"
  on public.submissions for delete to authenticated
  using (public.is_admin());

drop policy if exists "Owners can delete their pending submission" on public.submissions;
create policy "Owners can delete their pending submission"
  on public.submissions for delete to authenticated
  using (
    status = 'under_review'
    and (
      submitted_by = auth.uid()
      or (backer_email is not null and lower(backer_email) = lower(auth.jwt() ->> 'email'))
    )
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. UPVOTES & COMMENTS TABLES
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.upvotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table public.upvotes enable row level security;

drop policy if exists "Upvotes are viewable by everyone" on public.upvotes;
create policy "Upvotes are viewable by everyone"
  on public.upvotes for select using (true);

drop policy if exists "Users can upvote once" on public.upvotes;
create policy "Users can upvote once"
  on public.upvotes for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can remove their upvote" on public.upvotes;
create policy "Users can remove their upvote"
  on public.upvotes for delete to authenticated using (auth.uid() = user_id);

-- Discussion comments
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade not null,
  user_name text not null,
  user_email text,
  user_avatar text,
  content text not null check (char_length(content) between 1 and 2000),
  created_at bigint not null
);

alter table public.comments enable row level security;

drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

drop policy if exists "Anyone can add a comment" on public.comments;
create policy "Anyone can add a comment"
  on public.comments for insert with check (true);

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. SITE SETTINGS & APP SECRETS
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  description text,
  updated_at timestamptz default now()
);

insert into public.site_settings (key, value, description) values
  ('featured_product_id', '', 'Active featured product ID'),
  ('featured_expires_at', '0', 'Expiry timestamp in milliseconds for featured product')
on conflict (key) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Allow public read access to site_settings" on public.site_settings;
create policy "Allow public read access to site_settings"
  on public.site_settings for select using (true);

drop policy if exists "Allow update access to site_settings" on public.site_settings;
create policy "Allow update access to site_settings"
  on public.site_settings for insert with check (true);

drop policy if exists "Allow modify access to site_settings" on public.site_settings;
create policy "Allow modify access to site_settings"
  on public.site_settings for update using (true);

-- App secrets (stored server-side, never readable by public anon)
create table if not exists public.app_secrets (
  key text primary key,
  value text not null default '',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_secrets (key, value, description) values
  ('openai_api_key', '', 'OpenAI API key used server-side for submission auto-fill')
on conflict (key) do nothing;

alter table public.app_secrets enable row level security;

drop policy if exists "Admins can manage app_secrets" on public.app_secrets;
create policy "Admins can manage app_secrets"
  on public.app_secrets for all
  using (
    auth.role() = 'authenticated' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. WHOP PAYMENTS CONFIGURATION & RPC
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.whop_payments_config (
  key text primary key,
  value text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.whop_payments_config (key, value, description) values
  ('checkout_url_sponsor_1wk', 'https://whop.com/checkout/plan_Ux5pdAxT3WN7D', 'Whop 1-Week Sponsor ($10/wk) Direct Checkout'),
  ('checkout_url_1wk', 'https://whop.com/checkout/plan_Ux5pdAxT3WN7D', 'Whop 1-Week Sponsor ($10/wk) Direct Checkout'),
  ('checkout_url_sponsor_1mo', 'https://whop.com/checkout/zero-ce-84f1', 'Whop 1-Month Sponsor Direct Checkout'),
  ('checkout_url_1mo', 'https://whop.com/checkout/zero-ce-84f1', 'Whop 1-Month Sponsor Direct Checkout'),
  ('checkout_url_3mo', 'https://whop.com/checkout/plan_SMad32AkVoMeu', 'Whop 3-Month Sponsor Direct Checkout'),
  ('checkout_url_1yr', 'https://whop.com/checkout/plan_2uumEoGYQUKtb', 'Whop 1-Year Sponsor Direct Checkout'),
  ('checkout_url_featured_1wk', 'https://whop.com/checkout/plan_YGXtgHZnspc77', 'Whop 1-Week Featured Spot ($15/wk) Direct Checkout'),
  ('checkout_url_featured_1mo', 'https://whop.com/checkout/plan_GBN00B27YgYdx', 'Whop 1-Month Featured Spot ($39/mo) Direct Checkout'),
  ('checkout_url_onetime', 'https://whop.com/checkout/plan_B4wY8ei9eab1S', 'Whop $19 Per Product Pass / Verified Launch Direct Checkout'),
  ('checkout_url_per_product_pass', 'https://whop.com/checkout/plan_B4wY8ei9eab1S', 'Whop $19 Per Product Pass Direct Checkout'),
  ('checkout_url_weekly_relaunch', 'https://whop.com/checkout/plan_81SmEHd2w16EG', 'Whop Weekly Relaunch ($5/mo) Direct Checkout')
on conflict (key) do update set
  value = excluded.value,
  description = excluded.description,
  updated_at = now();

alter table public.whop_payments_config enable row level security;

drop policy if exists "Allow public read access to whop_payments_config" on public.whop_payments_config;
create policy "Allow public read access to whop_payments_config"
  on public.whop_payments_config for select using (true);

drop policy if exists "Allow admins to update whop_payments_config" on public.whop_payments_config;
create policy "Allow admins to update whop_payments_config"
  on public.whop_payments_config for all
  using (
    auth.role() = 'authenticated' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

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
  elsif p_plan_type in ('sponsor_1mo', 'sponsor1mo', 'sponsor-1mo', '1mo', 'monthly') then
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

  select value into v_url from public.whop_payments_config where key = v_key;
  return v_url;
end;
$$;

grant execute on function public.get_whop_checkout_url(text) to anon, authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. ATOMIC RPCS (UPVOTES & CLICKS)
-- ──────────────────────────────────────────────────────────────────────────────

-- Atomic upvote toggle
create or replace function public.toggle_upvote(p_product_id text)
returns boolean as $$
declare
  existing_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return false;
  end if;

  select id into existing_id
  from public.upvotes
  where user_id = v_user_id and product_id = p_product_id;

  if existing_id is not null then
    delete from public.upvotes where id = existing_id;
    update public.products set upvotes = greatest(0, upvotes - 1) where id = p_product_id;
    return false;
  else
    insert into public.upvotes (user_id, product_id) values (v_user_id, p_product_id);
    update public.products set upvotes = upvotes + 1 where id = p_product_id;
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Atomic guest upvote counter increment
create or replace function public.increment_product_upvotes(p_product_id text, p_delta int)
returns int
language plpgsql
security definer
as $$
declare
  v_new_upvotes int;
begin
  update public.products
  set upvotes = greatest(0, coalesce(upvotes, 0) + p_delta),
      updated_at = extract(epoch from now()) * 1000
  where id = p_product_id
  returning upvotes into v_new_upvotes;

  if not found then
    if p_product_id like 'prod-%' then
      update public.products
      set upvotes = greatest(0, coalesce(upvotes, 0) + p_delta),
          updated_at = extract(epoch from now()) * 1000
      where id = substring(p_product_id from 6)
      returning upvotes into v_new_upvotes;
    else
      update public.products
      set upvotes = greatest(0, coalesce(upvotes, 0) + p_delta),
          updated_at = extract(epoch from now()) * 1000
      where id = 'prod-' || p_product_id
      returning upvotes into v_new_upvotes;
    end if;
  end if;

  return coalesce(v_new_upvotes, 0);
end;
$$;

grant execute on function public.increment_product_upvotes(text, int) to anon, authenticated, service_role;

-- Atomic outbound click counter increment
create or replace function public.increment_product_clicks(p_product_id text)
returns int
language plpgsql
security definer
as $$
declare
  v_new_clicks int;
begin
  update public.products
  set clicks = coalesce(clicks, 0) + 1,
      updated_at = extract(epoch from now()) * 1000
  where id = p_product_id
  returning clicks into v_new_clicks;

  if not found then
    if p_product_id like 'prod-%' then
      update public.products
      set clicks = coalesce(clicks, 0) + 1,
          updated_at = extract(epoch from now()) * 1000
      where id = substring(p_product_id from 6)
      returning clicks into v_new_clicks;
    else
      update public.products
      set clicks = coalesce(clicks, 0) + 1,
          updated_at = extract(epoch from now()) * 1000
      where id = 'prod-' || p_product_id
      returning clicks into v_new_clicks;
    end if;
  end if;

  return coalesce(v_new_clicks, 0);
end;
$$;

grant execute on function public.increment_product_clicks(text) to anon, authenticated, service_role;

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. PERFORMANCE INDEXES
-- ──────────────────────────────────────────────────────────────────────────────
create index if not exists products_rank_asc_idx on public.products (rank asc);
create index if not exists products_category_idx on public.products (category);
create index if not exists products_submitted_by_idx on public.products (submitted_by) where submitted_by is not null;
create index if not exists products_is_sponsored_idx on public.products (is_sponsored) where is_sponsored = true;
create index if not exists products_created_at_desc_idx on public.products (created_at desc);

create index if not exists submissions_submitted_at_desc_idx on public.submissions (submitted_at desc);
create index if not exists submissions_submitted_by_idx on public.submissions (submitted_by) where submitted_by is not null;
create index if not exists submissions_backer_email_idx on public.submissions (lower(backer_email)) where backer_email is not null;
create index if not exists submissions_status_idx on public.submissions (status);
create index if not exists submissions_submitted_by_status_idx on public.submissions (submitted_by, status) where submitted_by is not null;
create index if not exists submissions_url_lower_idx on public.submissions (lower(url));

create index if not exists comments_product_id_idx on public.comments (product_id, created_at);
create index if not exists upvotes_user_product_idx on public.upvotes (user_id, product_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. SUPABASE STORAGE BUCKET ('screenshots')
-- ──────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  5242880, -- 5 MB max per screenshot
  array['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Public read access
drop policy if exists "Screenshots are publicly readable" on storage.objects;
create policy "Screenshots are publicly readable"
  on storage.objects for select
  using (bucket_id = 'screenshots');

-- Public and authenticated upload
drop policy if exists "Anyone can upload screenshots" on storage.objects;
create policy "Anyone can upload screenshots"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'screenshots');

-- Authenticated delete
drop policy if exists "Authenticated users can delete screenshots" on storage.objects;
create policy "Authenticated users can delete screenshots"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'screenshots');

-- ──────────────────────────────────────────────────────────────────────────────
-- ALL DONE! YOUR NEW SUPABASE PROJECT IS READY.
-- ──────────────────────────────────────────────────────────────────────────────

