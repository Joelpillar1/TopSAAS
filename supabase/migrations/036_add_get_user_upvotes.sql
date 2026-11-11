-- Re-add the get_user_upvotes() RPC.
-- The function was defined in migration 004 but never applied to the hosted
-- project, so clients could not tell which products the signed-in user had
-- already upvoted and the highlight was lost after a reload.

create or replace function public.get_user_upvotes()
returns setof text
language sql
security definer
as $$
  select product_id from public.upvotes where user_id = auth.uid();
$$;

grant execute on function public.get_user_upvotes() to authenticated, service_role;
