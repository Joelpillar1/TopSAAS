-- Create comments table for launch directory discussion threads
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  product_id text references public.products(id) on delete cascade not null,
  user_name text not null,
  user_email text,
  user_avatar text,
  content text not null check (char_length(content) between 1 and 2000),
  created_at bigint not null
);

create index if not exists comments_product_id_idx
  on public.comments (product_id, created_at);

alter table public.comments enable row level security;

-- Everyone can read comments (public discussion threads)
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

-- Anyone can post a comment (the directory is public by design; the display name is user-supplied)
drop policy if exists "Anyone can add a comment" on public.comments;
create policy "Anyone can add a comment"
  on public.comments for insert
  with check (true);