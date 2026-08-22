-- Anti-Cheat: Secure Game Scoring RPC function
-- Allows UNLIMITED high scores while blocking scripts that submit fake/instant scores

create or replace function public.submit_verified_game_score(
  p_product_id text,
  p_score int,
  p_duration_ms int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_max_physics_score int;
  v_new_score int;
begin
  -- 1. Score must be positive
  if p_score <= 0 then
    return jsonb_build_object('success', false, 'error', 'Score must be greater than zero');
  end if;

  -- 2. Duration must be at least 1 second
  if p_duration_ms < 1000 then
    return jsonb_build_object('success', false, 'error', 'Invalid game duration');
  end if;

  -- 3. Time-to-Score Physics Velocity Check:
  -- The TopSAAS runner gives ~10 to 15 points per second at maximum speed.
  -- We allow a generous physical velocity limit of 25 points per second to prevent false positives.
  -- Example: 
  --   A 10-minute run (600,000 ms) can legitimately submit any score up to 15,000+ pts!
  --   A script trying to submit 10,000 pts in 3 seconds is blocked immediately.
  v_max_physics_score := ((p_duration_ms::numeric / 1000.0) * 25.0)::int;

  if p_score > v_max_physics_score then
    return jsonb_build_object(
      'success', false, 
      'error', 'Score exceeds physical velocity limit for elapsed time'
    );
  end if;

  -- 4. Safely increment product's dino_score with no upper limit
  update public.products
  set 
    dino_score = coalesce(dino_score, 0) + p_score,
    updated_at = extract(epoch from now()) * 1000
  where id = p_product_id
  returning dino_score into v_new_score;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Product not found');
  end if;

  return jsonb_build_object(
    'success', true, 
    'score_added', p_score, 
    'new_total_score', v_new_score
  );
end;
$$;
