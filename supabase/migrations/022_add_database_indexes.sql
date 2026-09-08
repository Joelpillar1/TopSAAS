-- ============================================================
-- Migration 022: Database Indexes for TopSAAS
-- Run in Supabase SQL Editor:
--   https://supabase.com/dashboard/project/_/sql/new
-- ============================================================
-- Every index below is created with IF NOT EXISTS so this
-- script is safe to re-run multiple times.
-- ============================================================


-- ┌─────────────────────────────────────────┐
-- │  SUBMISSIONS TABLE                       │
-- │  Key queries:                            │
-- │  - .order('submitted_at', desc)          │
-- │  - .eq('submitted_by', user.id)          │
-- │  - .eq('backer_email', user.email)       │
-- │  - filter by status (under_review, etc.) │
-- └─────────────────────────────────────────┘

-- Fast chronological listing (main admin + global load)
create index if not exists submissions_submitted_at_desc_idx
  on public.submissions (submitted_at desc);

-- Fast owner lookup by auth user ID
create index if not exists submissions_submitted_by_idx
  on public.submissions (submitted_by)
  where submitted_by is not null;

-- Fast lookup by backer email (profile page queries)
create index if not exists submissions_backer_email_idx
  on public.submissions (lower(backer_email))
  where backer_email is not null;

-- Fast status filtering (admin queue, pending count)
create index if not exists submissions_status_idx
  on public.submissions (status);

-- Combined: owner + status (profile "Pending Approval" section)
create index if not exists submissions_submitted_by_status_idx
  on public.submissions (submitted_by, status)
  where submitted_by is not null;

-- URL uniqueness check (dedup on launch)
create index if not exists submissions_url_lower_idx
  on public.submissions (lower(url));


-- ┌─────────────────────────────────────────┐
-- │  PRODUCTS TABLE                          │
-- │  Key queries:                            │
-- │  - .order('rank', asc)                   │
-- │  - .eq('submitted_by', user.id)          │
-- │  - filter by category                    │
-- │  - sort by upvotes, created_at           │
-- └─────────────────────────────────────────┘

-- Primary directory listing (rank order)
create index if not exists products_rank_asc_idx
  on public.products (rank asc);

-- Owner lookup (profile page)
create index if not exists products_submitted_by_idx
  on public.products (submitted_by)
  where submitted_by is not null;

-- Category filtering (directory tabs)
create index if not exists products_category_idx
  on public.products (category);

-- Category + rank combined (category tab sorted listing)
create index if not exists products_category_rank_idx
  on public.products (category, rank asc);

-- Upvote count sorting (trending / leaderboard)
create index if not exists products_upvotes_desc_idx
  on public.products (upvotes desc);

-- Created_at for newest-first queries
create index if not exists products_created_at_desc_idx
  on public.products (created_at desc);

-- URL dedup check
create index if not exists products_url_lower_idx
  on public.products (lower(url));

-- Verified products (badge display)
create index if not exists products_verified_idx
  on public.products (verified)
  where verified = true;


-- ┌─────────────────────────────────────────┐
-- │  UPVOTES TABLE                           │
-- │  Key queries:                            │
-- │  - get_user_upvotes() — uid lookup       │
-- │  - toggle_upvote() — uid + product_id   │
-- │  - count by product_id                   │
-- └─────────────────────────────────────────┘

-- The UNIQUE constraint already creates a btree index on
-- (user_id, product_id). We add the reverse for product counts.
create index if not exists upvotes_product_id_idx
  on public.upvotes (product_id);

-- Fast per-user upvote retrieval
create index if not exists upvotes_user_id_idx
  on public.upvotes (user_id);


-- ┌─────────────────────────────────────────┐
-- │  COMMENTS TABLE                          │
-- │  Key queries:                            │
-- │  - .eq('product_id', id)                 │
-- │  - .order('created_at', asc/desc)        │
-- └─────────────────────────────────────────┘

-- Comments already has a (product_id, created_at) index from
-- migration 012. Drop and recreate with desc order for newest-first.
drop index if exists comments_product_id_idx;

create index if not exists comments_product_id_created_at_idx
  on public.comments (product_id, created_at desc);


-- ┌─────────────────────────────────────────┐
-- │  PROFILES TABLE                          │
-- │  Key queries:                            │
-- │  - .eq('id', user.id)  (PK — covered)   │
-- │  - .eq('email', user.email)              │
-- │  - .eq('role', 'admin')                  │
-- └─────────────────────────────────────────┘

-- Email lookup (auth helpers)
create index if not exists profiles_email_lower_idx
  on public.profiles (lower(email))
  where email is not null;

-- Role-based admin check
create index if not exists profiles_role_idx
  on public.profiles (role)
  where role in ('admin', 'moderator');

-- Recency (dashboard, analytics)
create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);


-- ┌─────────────────────────────────────────┐
-- │  STATISTICS VIEW (optional)              │
-- │  Useful for Supabase dashboard & logs.   │
-- └─────────────────────────────────────────┘

comment on index submissions_submitted_at_desc_idx   is 'Chronological submission feed';
comment on index submissions_submitted_by_idx         is 'Per-user submission lookup';
comment on index submissions_backer_email_idx         is 'Email-based submission lookup';
comment on index submissions_status_idx               is 'Status filter (admin queue)';
comment on index submissions_submitted_by_status_idx  is 'User profile: pending submissions';
comment on index submissions_url_lower_idx            is 'Dedup check on launch';
comment on index products_rank_asc_idx                is 'Directory rank-ordered listing';
comment on index products_submitted_by_idx            is 'User profile: live products';
comment on index products_category_idx                is 'Category tab filter';
comment on index products_category_rank_idx           is 'Category tab sorted listing';
comment on index products_upvotes_desc_idx            is 'Leaderboard / trending sort';
comment on index products_created_at_desc_idx         is 'Newest products sort';
comment on index products_url_lower_idx               is 'URL dedup check';
comment on index products_verified_idx                is 'Verified badge filter';
comment on index upvotes_product_id_idx               is 'Upvote count per product';
comment on index upvotes_user_id_idx                  is 'User upvote history';
comment on index comments_product_id_created_at_idx   is 'Product comment thread';
comment on index profiles_email_lower_idx             is 'Email-based profile lookup';
comment on index profiles_role_idx                    is 'Admin role check';
