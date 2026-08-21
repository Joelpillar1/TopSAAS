-- Create submissions table to store website submissions
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

create table if not exists public.submissions (
  id text primary key,
  name text not null,
  tagline text not null,
  url text not null,
  logo_url text,
  twitter_handle text,
  category text not null,
  backer_name text not null default 'Creator',
  backer_email text,
  status text not null default 'under_review' check (status in ('under_review', 'approved', 'rejected')),
  submitted_at bigint not null,
  reviewed_at bigint,
  rejection_reason text,
  target_audience text,
  pricing_model text,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.submissions enable row level security;

-- Everyone can read submissions (for counting pending, etc.)
create policy "Submissions are viewable by everyone"
  on public.submissions for select
  using (true);

-- Authenticated users can insert their own submissions
create policy "Authenticated users can submit"
  on public.submissions for insert
  to authenticated
  with check (true);

-- Authenticated users can update submissions (for admin moderation)
create policy "Authenticated users can update submissions"
  on public.submissions for update
  to authenticated
  using (true);

-- Authenticated users can delete submissions
create policy "Authenticated users can delete submissions"
  on public.submissions for delete
  to authenticated
  using (true);

-- Also allow anon inserts (for users not signed in)
create policy "Anonymous can submit"
  on public.submissions for insert
  to anon
  with check (true);

-- Auto-update updated_at timestamp
create or replace function public.update_submissions_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger submissions_updated_at
  before update on public.submissions
  for each row
  execute function public.update_submissions_timestamp();

-- Enable Realtime for live admin updates
alter publication supabase_realtime add table public.submissions;
