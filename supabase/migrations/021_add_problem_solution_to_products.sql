-- Add problem_it_solves, solution, unique_selling_point, what_it_does, features, use_cases to products table
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

alter table public.products
  add column if not exists problem_it_solves text,
  add column if not exists solution text,
  add column if not exists unique_selling_point text,
  add column if not exists what_it_does jsonb,
  add column if not exists features jsonb,
  add column if not exists use_cases jsonb;

comment on column public.products.problem_it_solves is 'The core pain point or problem the product addresses';
comment on column public.products.solution is 'How the product solves the core problem';
comment on column public.products.unique_selling_point is 'What differentiates this product from alternatives';
