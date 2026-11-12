-- Add scheduled launch week and date columns to submissions and products
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS scheduled_launch_week INTEGER,
  ADD COLUMN IF NOT EXISTS scheduled_launch_date BIGINT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS scheduled_launch_week INTEGER,
  ADD COLUMN IF NOT EXISTS scheduled_launch_date BIGINT;

