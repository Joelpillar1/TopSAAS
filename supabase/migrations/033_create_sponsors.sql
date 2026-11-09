-- ============================================================
-- Migration 033: Move sponsors out of products into their own table
-- Run this in your Supabase SQL Editor.
--
-- Products are directory listings only. Paid and trial placements live in
-- public.sponsors, so the admin Live Products list and count stay clean.
-- ============================================================

-- 1. Make the legacy product sponsor columns safe to read during backfill.
alter table public.products
  add column if not exists is_sponsor_only boolean default false,
  add column if not exists is_sponsored boolean default false,
  add column if not exists sponsor_tier text,
  add column if not exists sponsor_started_at bigint,
  add column if not exists sponsor_expires_at bigint,
  add column if not exists sponsor_contact_email text,
  add column if not exists sponsor_clicks integer default 0;

-- 2. Create the dedicated sponsors table.
create table if not exists public.sponsors (
  id text primary key,
  product_id text references public.products(id) on delete set null,
  name text not null,
  tagline text not null default '',
  url text not null default '',
  logo_url text,
  category text not null default 'SaaS',
  contact_email text,
  tier text not null default 'paid',
  status text not null default 'active',
  started_at bigint not null,
  expires_at bigint not null,
  paused_remaining_ms bigint,
  clicks integer not null default 0,
  source text not null default 'admin_grant',
  whop_payment_id text,
  plan_type text,
  created_at bigint not null,
  updated_at bigint not null
);

create index if not exists sponsors_status_expires_idx
  on public.sponsors (status, expires_at);
create index if not exists sponsors_product_id_idx
  on public.sponsors (product_id);
create unique index if not exists sponsors_whop_payment_id_key
  on public.sponsors (whop_payment_id)
  where whop_payment_id is not null;

alter table public.sponsors enable row level security;

drop policy if exists "Sponsors are viewable by everyone" on public.sponsors;
create policy "Sponsors are viewable by everyone"
  on public.sponsors for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can create sponsors" on public.sponsors;
create policy "Anyone can create sponsors"
  on public.sponsors for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can update sponsors" on public.sponsors;
create policy "Anyone can update sponsors"
  on public.sponsors for update
  to anon, authenticated
  using (true);

drop policy if exists "Admins can delete sponsors" on public.sponsors;
create policy "Admins can delete sponsors"
  on public.sponsors for delete
  to authenticated
  using (public.is_admin());

-- 3. Backfill sponsors that were stored as product rows.
insert into public.sponsors (
  id,
  product_id,
  name,
  tagline,
  url,
  logo_url,
  category,
  contact_email,
  tier,
  status,
  started_at,
  expires_at,
  paused_remaining_ms,
  clicks,
  source,
  created_at,
  updated_at
)
select
  'spn_' || p.id,
  case
    when p.id like 'prod_sp_%' or p.id like 'sponsor_%' then null
    else p.id
  end,
  p.name,
  coalesce(p.tagline, ''),
  coalesce(p.url, ''),
  p.logo_url,
  coalesce(p.category, 'SaaS'),
  p.sponsor_contact_email,
  case
    when p.sponsor_tier in ('trial', 'paid', '1mo', '3mo', '1yr') then p.sponsor_tier
    else 'paid'
  end,
  case
    when coalesce(p.sponsor_expires_at, 0) > (extract(epoch from now()) * 1000)::bigint then 'active'
    when p.is_sponsored then 'active'
    else 'expired'
  end,
  coalesce(p.sponsor_started_at, p.created_at, (extract(epoch from now()) * 1000)::bigint),
  coalesce(p.sponsor_expires_at, (extract(epoch from now()) * 1000)::bigint + 2592000000),
  null,
  coalesce(p.sponsor_clicks, 0),
  'legacy',
  coalesce(p.created_at, (extract(epoch from now()) * 1000)::bigint),
  (extract(epoch from now()) * 1000)::bigint
from public.products p
where p.is_sponsored = true
   or p.id like 'prod_sp_%'
   or p.id like 'sponsor_%'
on conflict (id) do nothing;

-- 4. Backfill sponsors that only existed in site_settings JSON.
insert into public.sponsors (
  id,
  product_id,
  name,
  tagline,
  url,
  logo_url,
  category,
  contact_email,
  tier,
  status,
  started_at,
  expires_at,
  paused_remaining_ms,
  clicks,
  source,
  created_at,
  updated_at
)
select
  'spn_' || coalesce(p.id, 'legacy_' || substr(md5(ss.key || coalesce(s ->> 'productId', '')), 1, 16)),
  p.id,
  coalesce(p.name, s ->> 'productName', 'Sponsor'),
  coalesce(p.tagline, ''),
  coalesce(p.url, ''),
  p.logo_url,
  coalesce(p.category, 'SaaS'),
  coalesce(s ->> 'contactEmail', s ->> 'customerEmail'),
  case
    when s ->> 'tier' in ('trial', 'paid', '1mo', '3mo', '1yr') then s ->> 'tier'
    else 'paid'
  end,
  case
    when coalesce((s ->> 'ended')::boolean, false) then 'ended'
    when coalesce((s ->> 'isPaused')::boolean, false) then 'paused'
    when coalesce((s ->> 'expiresAt')::bigint, 0) <= (extract(epoch from now()) * 1000)::bigint then 'expired'
    else 'active'
  end,
  coalesce((s ->> 'startedAt')::bigint, (extract(epoch from now()) * 1000)::bigint),
  coalesce((s ->> 'expiresAt')::bigint, (extract(epoch from now()) * 1000)::bigint + 2592000000),
  (s ->> 'pausedRemainingMs')::bigint,
  coalesce((s ->> 'clicks')::integer, 0),
  'legacy',
  coalesce((s ->> 'startedAt')::bigint, (extract(epoch from now()) * 1000)::bigint),
  (extract(epoch from now()) * 1000)::bigint
from public.site_settings ss
cross join lateral jsonb_array_elements(
  case
    when ss.value ~ '^\s*\[' then ss.value::jsonb
    else '[]'::jsonb
  end
) s
left join lateral (
  select p2.*
  from public.products p2
  where p2.id = s ->> 'productId'
     or p2.id = 'prod-' || (s ->> 'productId')
  limit 1
) p on true
where ss.key in ('active_sponsors_v1', 'active_sponsors')
  -- Skip orphan settings entries that have neither a matching product nor a
  -- usable display name; they would otherwise surface as a generic "Sponsor".
  and (p.id is not null or coalesce(p.name, s ->> 'productName') is not null)
on conflict (id) do nothing;

-- 5. Remove sponsor-only rows from the products directory.
delete from public.products
where id like 'prod_sp_%'
   or id like 'sponsor_%';

-- 6. Clear sponsor flags on real directory listings. Sponsorship now lives in
--    public.sponsors, linked by sponsors.product_id.
update public.products
set is_sponsored = false,
    sponsor_tier = null,
    sponsor_started_at = null,
    sponsor_expires_at = null,
    sponsor_contact_email = null,
    sponsor_clicks = 0
where is_sponsored = true
   or sponsor_tier is not null
   or sponsor_started_at is not null
   or sponsor_expires_at is not null;

-- 7. Retire the legacy JSON sponsor lists.
delete from public.site_settings
where key in ('active_sponsors_v1', 'active_sponsors');
