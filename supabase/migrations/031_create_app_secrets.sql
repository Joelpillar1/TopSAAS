-- Migration 031: Create app_secrets table to store secrets securely in Supabase
-- This table is strictly protected by Row Level Security (RLS) so that:
-- 1. Anonymous and standard public users cannot view or select any secrets.
-- 2. Supabase Edge Functions (using the service role key) can safely read them.
-- 3. Authenticated administrators can manage them from the admin panel if needed.

create table if not exists public.app_secrets (
  key text primary key,
  value text not null default '',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert placeholder row for OpenAI API Key
insert into public.app_secrets (key, value, description) values
  ('openai_api_key', '', 'OpenAI API key used server-side for submission auto-fill')
on conflict (key) do nothing;

-- Enable Row Level Security to prevent unauthorized access
alter table public.app_secrets enable row level security;

-- Strictly deny public read access: no public select policy exists.
-- Only authenticated admins can view and manage secrets:
drop policy if exists "Admins can manage app_secrets" on public.app_secrets;
create policy "Admins can manage app_secrets"
  on public.app_secrets for all
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to update updated_at timestamp
create or replace function public.update_app_secrets_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_app_secrets_updated_at on public.app_secrets;
create trigger trigger_app_secrets_updated_at
  before update on public.app_secrets
  for each row
  execute function public.update_app_secrets_updated_at();

