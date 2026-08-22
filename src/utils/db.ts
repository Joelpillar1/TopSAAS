import { supabase } from './supabase';
import { Product, Category } from '../types';

// ── Products ──

/** Map a Supabase row to our Product type */
export const mapDbProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  rank: row.rank as number,
  previousRank: (row.previous_rank as number) || undefined,
  name: row.name as string,
  tagline: row.tagline as string,
  url: row.url as string,
  logoUrl: (row.logo_url as string) || undefined,
  twitterHandle: (row.twitter_handle as string) || undefined,
  category: row.category as Category,
  upvotes: (row.upvotes as number) || 0,
  dinoScore: (row.dino_score as number) || 0,
  totalBid: (row.total_bid as number) || 0,
  clicks: (row.clicks as number) || 0,
  createdAt: row.created_at as number,
  updatedAt: row.updated_at as number,
  isUserOwned: false,
  submittedBy: (row.submitted_by as string) || undefined,
  verified: (row.verified as boolean) || false,
  description: (row.description as string) || undefined,
  whatItDoes: (row.what_it_does as string[]) || undefined,
  features: (row.features as Product['features']) || undefined,
  useCases: (row.use_cases as Product['useCases']) || undefined,
  targetAudience: (row.target_audience as string) || undefined,
  pricingModel: (row.pricing_model as string) || undefined,
  keyHighlights: (row.key_highlights as Product['keyHighlights']) || undefined,
  bidHistory: (row.bid_history as Product['bidHistory']) || [],
});

/** Map a Product to Supabase insert/update format */
export const toDbProduct = (p: Product) => ({
  id: p.id,
  rank: p.rank,
  previous_rank: p.previousRank || null,
  name: p.name,
  tagline: p.tagline,
  url: p.url,
  logo_url: p.logoUrl || null,
  twitter_handle: p.twitterHandle || null,
  category: p.category,
  upvotes: p.upvotes ?? 0,
  dino_score: p.dinoScore ?? 0,
  total_bid: p.totalBid ?? 0,
  clicks: p.clicks ?? 0,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  is_user_owned: false,
  submitted_by: p.submittedBy || null,
  verified: p.verified || false,
  description: p.description || null,
  what_it_does: p.whatItDoes || null,
  features: p.features || null,
  use_cases: p.useCases || null,
  target_audience: p.targetAudience || null,
  pricing_model: p.pricingModel || null,
  key_highlights: p.keyHighlights || null,
  bid_history: p.bidHistory || [],
});

/** Load all products from Supabase */
export async function loadProducts(): Promise<Product[] | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('rank', { ascending: true });
  if (error || !data) return null;
  return data.map(mapDbProduct);
}

/** Save all products to Supabase (full replace) */
export async function saveAllProducts(products: Product[]): Promise<void> {
  if (products.length === 0) return;
  try {
    await supabase.from('products').upsert(
      products.map(toDbProduct),
      { onConflict: 'id' }
    );
  } catch {}
}

/** Delete a product from Supabase */
export async function deleteProduct(productId: string): Promise<void> {
  await supabase.from('products').delete().eq('id', productId);
}

// ── Game Scoring Anti-Cheat ──

/** Submit a verified game score to Supabase with real-time velocity validation (No maximum caps) */
export async function submitVerifiedGameScore(
  productId: string,
  score: number,
  durationMs: number
): Promise<{ success: boolean; score_added?: number; new_total_score?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('submit_verified_game_score', {
      p_product_id: productId,
      p_score: Math.floor(score),
      p_duration_ms: Math.floor(durationMs),
    });

    if (error || !data) {
      return { success: false, error: error?.message };
    }

    return data as { success: boolean; score_added?: number; new_total_score?: number; error?: string };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Network error' };
  }
}

// ── Upvotes ──

/** Toggle upvote via Supabase RPC (returns true if upvoted, false if un-upvoted) */
export async function toggleUpvote(productId: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('toggle_upvote', { p_product_id: productId });
  if (error) return null;
  return data as boolean;
}

/** Get current user's upvoted product IDs */
export async function getUserUpvotes(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_user_upvotes');
  if (error || !data) return new Set();
  return new Set(data as string[]);
}

// ── Admin ──

/** Check if current user is admin or moderator */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data as boolean;
}

// ── Debounced sync ──

let productsSyncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Debounced full sync of products to Supabase */
export function debouncedSyncProducts(products: Product[]): void {
  if (productsSyncTimeout) clearTimeout(productsSyncTimeout);
  productsSyncTimeout = setTimeout(() => {
    saveAllProducts(products).catch(() => {});
  }, 2000);
}

// ── Global Featured Spot Settings ──

export interface FeaturedProductConfig {
  productId: string | null;
  expiresAt: number | null;
}

/** Get global featured product from Supabase (with fallback to localStorage) */
export async function getGlobalFeaturedProduct(): Promise<FeaturedProductConfig> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['featured_product_id', 'featured_expires_at']);

    if (!error && data && data.length > 0) {
      const idRow = data.find((r) => r.key === 'featured_product_id');
      const expRow = data.find((r) => r.key === 'featured_expires_at');

      const productId = idRow?.value || null;
      const expiresAt = expRow?.value ? parseInt(expRow.value, 10) : null;

      // If expired, clear it
      if (expiresAt && expiresAt < Date.now()) {
        return { productId: null, expiresAt: null };
      }

      if (productId) {
        return { productId, expiresAt };
      }
    }
  } catch {}

  // Fallback to local storage
  try {
    const localId = localStorage.getItem('topsaas_featured_product');
    const localExp = localStorage.getItem('topsaas_featured_expiry');
    const exp = localExp ? parseInt(localExp, 10) : null;
    if (exp && exp < Date.now()) {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
      return { productId: null, expiresAt: null };
    }
    return { productId: localId || null, expiresAt: exp };
  } catch {
    return { productId: null, expiresAt: null };
  }
}

/** Set global featured product in Supabase and localStorage */
export async function setGlobalFeaturedProduct(
  productId: string | null,
  durationDays: number = 30
): Promise<void> {
  const expiresAt = productId ? Date.now() + durationDays * 86400000 : 0;

  // 1. Sync to local storage
  try {
    if (productId) {
      localStorage.setItem('topsaas_featured_product', productId);
      localStorage.setItem('topsaas_featured_expiry', expiresAt.toString());
    } else {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
    }
  } catch {}

  // 2. Sync to Supabase site_settings
  try {
    await supabase.from('site_settings').upsert([
      { key: 'featured_product_id', value: productId || '' },
      { key: 'featured_expires_at', value: expiresAt.toString() },
    ]);
  } catch {}
}
