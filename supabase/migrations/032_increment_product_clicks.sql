-- ==============================================================================
-- Migration 032: Atomic function to increment product outbound clicks safely
-- ==============================================================================
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--
-- Safely increments the `clicks` counter on a product when visitors click out
-- to visit the product's external website from the leaderboard, product page,
-- or sponsor rails.

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
