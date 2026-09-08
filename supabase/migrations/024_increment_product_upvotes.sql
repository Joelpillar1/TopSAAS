-- Atomic function to increment or decrement product upvotes safely for guests/fallbacks
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
    -- Try alternate prefix
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
