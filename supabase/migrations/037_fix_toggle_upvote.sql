-- Migration 037: Fix toggle_upvote to handle canonical vs bare product IDs and require authentication
-- Run in Supabase SQL Editor

create or replace function public.toggle_upvote(p_product_id text)
returns boolean as $$
declare
  existing_id uuid;
  v_user_id uuid := auth.uid();
  v_target_id text := p_product_id;
begin
  if v_user_id is null then
    raise exception 'User must be authenticated to upvote';
  end if;

  -- Resolve actual product ID from products table if prefix differs
  if not exists (select 1 from public.products where id = v_target_id) then
    if v_target_id like 'prod-%' then
      if exists (select 1 from public.products where id = substring(v_target_id from 6)) then
        v_target_id := substring(v_target_id from 6);
      end if;
    else
      if exists (select 1 from public.products where id = 'prod-' || v_target_id) then
        v_target_id := 'prod-' || v_target_id;
      end if;
    end if;
  end if;

  -- Check if user already upvoted under target ID or alternate format
  select id into existing_id
  from public.upvotes
  where user_id = v_user_id and (
    product_id = v_target_id
    or product_id = p_product_id
    or (p_product_id like 'prod-%' and product_id = substring(p_product_id from 6))
    or (p_product_id not like 'prod-%' and product_id = 'prod-' || p_product_id)
  )
  limit 1;

  if existing_id is not null then
    -- Remove upvote
    delete from public.upvotes where id = existing_id;
    update public.products
    set upvotes = greatest(0, coalesce(upvotes, 1) - 1),
        updated_at = extract(epoch from now()) * 1000
    where id = v_target_id or id = p_product_id;
    return false;
  else
    -- Add upvote
    insert into public.upvotes (user_id, product_id) values (v_user_id, v_target_id);
    update public.products
    set upvotes = coalesce(upvotes, 0) + 1,
        updated_at = extract(epoch from now()) * 1000
    where id = v_target_id or id = p_product_id;
    return true;
  end if;
end;
$$ language plpgsql security definer;

grant execute on function public.toggle_upvote(text) to authenticated, service_role;

