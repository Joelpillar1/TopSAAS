-- Create upvotes table: one upvote per user per product
-- Run in Supabase SQL Editor

create table if not exists public.upvotes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id text references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table public.upvotes enable row level security;

-- Everyone can count upvotes
create policy "Upvotes are viewable by everyone"
  on public.upvotes for select using (true);

-- Authenticated users can insert their own upvotes
create policy "Users can upvote once"
  on public.upvotes for insert to authenticated
  with check (auth.uid() = user_id);

-- Users can remove their own upvote (un-upvote)
create policy "Users can remove their upvote"
  on public.upvotes for delete to authenticated
  using (auth.uid() = user_id);

-- Function to toggle upvote and update product count
create or replace function public.toggle_upvote(p_product_id text)
returns boolean as $$
declare
  existing_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    return false;
  end if;

  -- Check if already upvoted
  select id into existing_id
  from public.upvotes
  where user_id = v_user_id and product_id = p_product_id;

  if existing_id is not null then
    -- Remove upvote
    delete from public.upvotes where id = existing_id;
    update public.products set upvotes = greatest(0, upvotes - 1) where id = p_product_id;
    return false;
  else
    -- Add upvote
    insert into public.upvotes (user_id, product_id) values (v_user_id, p_product_id);
    update public.products set upvotes = upvotes + 1 where id = p_product_id;
    return true;
  end if;
end;
$$ language plpgsql security definer;

-- Function to get user's upvoted product IDs
create or replace function public.get_user_upvotes()
returns setof text as $$
  select product_id from public.upvotes where user_id = auth.uid();
$$ language sql security definer;
