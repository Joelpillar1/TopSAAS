-- Migration 039: Create email_logs table for Resend delivery tracking and deduplication

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique,
  email_type text not null,
  recipient text not null,
  subject text not null,
  resend_email_id text,
  status text not null default 'pending',
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_logs_recipient on public.email_logs (lower(recipient));
create index if not exists idx_email_logs_type_created on public.email_logs (email_type, created_at desc);

alter table public.email_logs enable row level security;

-- Only admins and service role can read email logs
drop policy if exists "Admins can read email_logs" on public.email_logs;
create policy "Admins can read email_logs"
  on public.email_logs for select
  using (
    auth.role() = 'authenticated' and
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

