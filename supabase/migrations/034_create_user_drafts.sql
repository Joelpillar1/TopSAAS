-- ==============================================================================
-- 034_create_user_drafts.sql
-- Table to store user launch drafts for cross-device persistence
-- ==============================================================================

create table if not exists public.user_drafts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text default '',
  tagline text default '',
  url text default '',
  category text default '',
  step integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_user_drafts_user_id on public.user_drafts (user_id);
create index if not exists idx_user_drafts_updated_at on public.user_drafts (updated_at desc);

-- Enable Row Level Security
alter table public.user_drafts enable row level security;

-- RLS Policies:
-- 1. Users can select only their own drafts
drop policy if exists "Users can read their own drafts" on public.user_drafts;
create policy "Users can read their own drafts"
  on public.user_drafts for select
  using (auth.uid() = user_id);

-- 2. Users can insert their own drafts
drop policy if exists "Users can insert their own drafts" on public.user_drafts;
create policy "Users can insert their own drafts"
  on public.user_drafts for insert
  with check (auth.uid() = user_id);

-- 3. Users can update their own drafts
drop policy if exists "Users can update their own drafts" on public.user_drafts;
create policy "Users can update their own drafts"
  on public.user_drafts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. Users can delete their own drafts
drop policy if exists "Users can delete their own drafts" on public.user_drafts;
create policy "Users can delete their own drafts"
  on public.user_drafts for delete
  using (auth.uid() = user_id);

-- 5. Admins can manage all drafts
drop policy if exists "Admins can manage all drafts" on public.user_drafts;
create policy "Admins can manage all drafts"
  on public.user_drafts for all
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

