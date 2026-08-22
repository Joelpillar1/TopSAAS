-- Add dino_score to products for game-based ranking
alter table public.products add column if not exists dino_score integer default 0;
