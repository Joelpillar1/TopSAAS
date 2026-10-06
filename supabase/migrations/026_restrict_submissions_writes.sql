-- ==============================================================================
-- Migration 026: Restrict who can WRITE submissions
-- ==============================================================================
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
--
-- Before this migration every write policy on `submissions` was effectively open:
--   * insert -> `with check (true)` for anon + authenticated, so anyone could
--               insert a row already marked `status = 'approved'` and skip the
--               moderation queue entirely;
--   * update -> `using (true)` for any authenticated user, so any signed-in
--               visitor could approve, reject, or edit ANY submission;
--   * delete -> `using (true)` for any authenticated user, so anyone could
--               remove a competitor's submission.
--
-- New model:
--   * insert : anyone may queue a submission, but only as `status = 'under_review'`
--              and only as themselves (submitted_by null or auth.uid()).
--   * update : admins/moderators may do anything; owners may edit their own row
--              ONLY while it is still `under_review`. The WITH CHECK keeps the row
--              in review, so an owner can never promote their own submission.
--   * delete : admins/moderators may remove anything; owners may withdraw their
--              own row while it is still `under_review`.
--   * claiming: attaching an account to submissions made before sign-in is a
--              narrow SECURITY DEFINER RPC that can only set submitted_by on
--              unowned rows matching the caller's verified email.

-- ── INSERT ────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users can submit" on public.submissions;
drop policy if exists "Anonymous can submit" on public.submissions;

-- Signed-in users queue their own submission for review.
create policy "Authenticated users can submit"
  on public.submissions for insert
  to authenticated
  with check (
    status = 'under_review'
    and (submitted_by is null or submitted_by = auth.uid())
  );

-- Visitors without an account can queue a submission too — always unowned.
create policy "Anonymous can submit"
  on public.submissions for insert
  to anon
  with check (
    status = 'under_review'
    and submitted_by is null
  );

-- ── UPDATE ────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users can update submissions" on public.submissions;

-- Admins and moderators: full moderation control (approve, reject, restore, edit).
create policy "Admins can update any submission"
  on public.submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Owners: edit their own submission while it is still under review. The WITH CHECK
-- pins status to 'under_review', so this policy can never be used to approve.
create policy "Owners can update their own pending submissions"
  on public.submissions for update
  to authenticated
  using (
    status = 'under_review'
    and (
      submitted_by = auth.uid()
      or (
        backer_email is not null
        and lower(backer_email) = lower(auth.jwt() ->> 'email')
      )
    )
  )
  with check (
    status = 'under_review'
    and (
      submitted_by = auth.uid()
      or (
        -- Let an email-verified owner edit a row that has not been claimed yet
        -- (sign-in claiming runs in the background and may not have landed).
        submitted_by is null
        and backer_email is not null
        and lower(backer_email) = lower(auth.jwt() ->> 'email')
      )
    )
  );

-- ── DELETE ────────────────────────────────────────────────────────────────────

drop policy if exists "Authenticated users can delete submissions" on public.submissions;

-- Admins and moderators: remove any submission.
create policy "Admins can delete any submission"
  on public.submissions for delete
  to authenticated
  using (public.is_admin());

-- Owners: withdraw their own submission while it is still under review.
create policy "Owners can withdraw their own pending submissions"
  on public.submissions for delete
  to authenticated
  using (
    status = 'under_review'
    and (
      submitted_by = auth.uid()
      or (
        backer_email is not null
        and lower(backer_email) = lower(auth.jwt() ->> 'email')
      )
    )
  );

-- ── CLAIMING (owners still need a status-agnostic way to attach their account) ──
-- Signing in must be able to link submissions made before the account existed,
-- including ones already approved or rejected. Doing that with a plain UPDATE
-- would force the owner update policy to allow non-'under_review' rows, which
-- would reopen self-approval. This narrow, email-verified RPC is the safe path.

create or replace function public.claim_submissions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_email text := lower(nullif(auth.jwt() ->> 'email', ''));
  v_count integer := 0;
begin
  if v_user is null or v_email is null then
    return 0;
  end if;

  update public.submissions
     set submitted_by = v_user
   where submitted_by is null
     and backer_email is not null
     and lower(backer_email) = v_email;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.claim_submissions() from public;
grant execute on function public.claim_submissions() to authenticated;
