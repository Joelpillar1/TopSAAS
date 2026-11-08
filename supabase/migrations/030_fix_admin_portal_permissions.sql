-- Fix submissions policies so the admin portal (/accept) can view, approve, and manage submissions
drop policy if exists "Approved submissions are public" on public.submissions;
drop policy if exists "Owners can read their own submissions" on public.submissions;
drop policy if exists "Admins can read all submissions" on public.submissions;
drop policy if exists "Submissions are viewable by everyone" on public.submissions;

create policy "Submissions are viewable by everyone"
  on public.submissions for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated users can submit" on public.submissions;
drop policy if exists "Anonymous can submit" on public.submissions;
drop policy if exists "Anyone can submit" on public.submissions;

create policy "Anyone can submit"
  on public.submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Admins can update any submission" on public.submissions;
drop policy if exists "Owners can update their pending submission" on public.submissions;
drop policy if exists "Owners can update their own pending submissions" on public.submissions;
drop policy if exists "Anyone can update submissions" on public.submissions;

create policy "Anyone can update submissions"
  on public.submissions for update
  to anon, authenticated
  using (true);

drop policy if exists "Admins can delete any submission" on public.submissions;
drop policy if exists "Owners can delete their pending submission" on public.submissions;
drop policy if exists "Owners can withdraw their own pending submissions" on public.submissions;
drop policy if exists "Anyone can delete submissions" on public.submissions;

create policy "Anyone can delete submissions"
  on public.submissions for delete
  to anon, authenticated
  using (true);

-- Fix products policies so admin approvals and sync work seamlessly
drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;
drop policy if exists "Anyone can insert products" on public.products;
drop policy if exists "Anyone can update products" on public.products;
drop policy if exists "Anyone can delete products" on public.products;

create policy "Anyone can insert products"
  on public.products for insert
  to anon, authenticated
  with check (true);

create policy "Anyone can update products"
  on public.products for update
  to anon, authenticated
  using (true);

create policy "Anyone can delete products"
  on public.products for delete
  to anon, authenticated
  using (true);

