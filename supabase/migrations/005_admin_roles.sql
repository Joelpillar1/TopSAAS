-- Admin role management
-- Run in Supabase SQL Editor

-- Function to check if current user is admin or moderator
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$ language sql security definer stable;

-- Function to set a user's role (admin only)
create or replace function public.set_user_role(target_user_id uuid, new_role text)
returns void as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change user roles';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_user_id;
end;
$$ language plpgsql security definer;

-- Function to promote first user to admin (run once)
create or replace function public.promote_first_admin(target_email text)
returns void as $$
begin
  update public.profiles set role = 'admin', updated_at = now() where email = target_email;
  if not found then
    raise exception 'User with email % not found', target_email;
  end if;
end;
$$ language plpgsql security definer;
