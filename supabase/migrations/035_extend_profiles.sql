-- Migration 035: Extend profiles with founder fields, RLS policies, and delete_user_account RPC

alter table public.profiles
  add column if not exists username text,
  add column if not exists bio text,
  add column if not exists looking_for text[] default '{}',
  add column if not exists twitter_url text,
  add column if not exists linkedin_url text,
  add column if not exists website_url text,
  add column if not exists booking_url text,
  add column if not exists membership_tier text default 'free';

-- Ensure unique username index when username is not null
create unique index if not exists profiles_username_idx
  on public.profiles (lower(username))
  where username is not null and username <> '';

-- Fast security definer function to check username availability
create or replace function public.is_username_available(check_username text)
returns boolean as $$
begin
  if check_username is null or trim(check_username) = '' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(check_username))
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
end;
$$ language plpgsql security definer stable;

grant execute on function public.is_username_available(text) to anon, authenticated;

-- Ensure RLS policies on profiles support both insert and update with check
alter table public.profiles enable row level security;

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Function to allow authenticated users to delete their own account completely
create or replace function public.delete_user_account()
returns void as $$
declare
  uid uuid := auth.uid();
  uid_text text := auth.uid()::text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Delete associated products, submissions, and relations
  delete from public.products where submitted_by = uid_text;
  delete from public.submissions where submitted_by = uid_text;
  delete from public.upvotes where user_id = uid_text;
  delete from public.comments where user_id = uid_text;
  delete from public.user_drafts where user_id = uid_text;
  delete from public.sponsors where created_by = uid_text;
  
  -- 2. Delete public profile
  delete from public.profiles where id = uid;

  -- 3. Delete from auth.users (requires security definer)
  delete from auth.users where id = uid;
end;
$$ language plpgsql security definer;

-- Grant execution to authenticated users
grant execute on function public.delete_user_account() to authenticated;
