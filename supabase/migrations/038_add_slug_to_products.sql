-- Migration 038: Add slug column and indexes for products and submissions

-- 1. Add slug column to products if not exists
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Populate slug from clean product name for existing rows
UPDATE public.products
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Trim leading and trailing hyphens from slug
UPDATE public.products
SET slug = trim(both '-' from slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- 3. Add slug column to submissions if not exists
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 4. Populate slug from clean submission name for existing rows
UPDATE public.submissions
SET slug = lower(regexp_replace(trim(name), '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

UPDATE public.submissions
SET slug = trim(both '-' from slug)
WHERE slug LIKE '-%' OR slug LIKE '%-';

-- 5. Create index for high-speed slug and case-insensitive name resolution
CREATE INDEX IF NOT EXISTS products_slug_idx ON public.products (slug);
CREATE INDEX IF NOT EXISTS submissions_slug_idx ON public.submissions (slug);
CREATE INDEX IF NOT EXISTS products_name_lower_idx ON public.products (lower(name));
CREATE INDEX IF NOT EXISTS submissions_name_lower_idx ON public.submissions (lower(name));

