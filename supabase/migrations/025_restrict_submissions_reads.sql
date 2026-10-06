-- ==============================================================================
-- Migration 025: Restrict who can READ submissions
-- ==============================================================================
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--
-- Problem: `submissions` shipped with a single read policy of `using (true)`
-- ("Submissions are viewable by everyone"), and `App.tsx` query-selects the whole
-- table on mount. That leaked every pending and rejected submission — including
-- `backer_email` — into every anonymous visitor's browser and localStorage.
--
-- New read model:
--   * approved submissions -> public (these ARE the live directory listings)
--   * pending / rejected   -> only the submitter, matched by auth user id OR by the
--                             verified email on their JWT (so submissions made
--                             before signing in are still claimable), plus admins
--                             and moderators who need the full moderation queue.
--
-- Write policies are intentionally left unchanged in this migration.

drop policy if exists "Submissions are viewable by everyone" on public.submissions;

-- 1. Public: approved listings only.
create policy "Approved submissions are public"
  on public.submissions for select
  to anon, authenticated
  using (status = 'approved');

-- 2. Owners: read their own submissions in any status (pending / approved / rejected).
create policy "Owners can read their own submissions"
  on public.submissions for select
  to authenticated
  using (
    submitted_by = auth.uid()
    or (
      backer_email is not null
      and lower(backer_email) = lower(auth.jwt() ->> 'email')
    )
  );

-- 3. Admins / moderators: full moderation queue visibility.
create policy "Admins can read all submissions"
  on public.submissions for select
  to authenticated
  using (public.is_admin());

-- Helpful for the owner-by-email branch above (022 already created this index,
-- kept here as an idempotent safety net for databases that predate it).
create index if not exists submissions_backer_email_idx
  on public.submissions (lower(backer_email));
