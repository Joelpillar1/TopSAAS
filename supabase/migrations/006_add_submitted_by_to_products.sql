-- Add submitted_by to products to track who submitted each product
-- Run in Supabase SQL Editor

alter table public.products add column if not exists submitted_by uuid references auth.users(id);

-- Reset all is_user_owned to false (was incorrectly set to true for all products)
update public.products set is_user_owned = false;
