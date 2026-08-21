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
  totalBid: (row.total_bid as number) || 0,
  clicks: (row.clicks as number) || 0,
  createdAt: row.created_at as number,
  updatedAt: row.updated_at as number,
  isUserOwned: (row.is_user_owned as boolean) || false,
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
  total_bid: p.totalBid ?? 0,
  clicks: p.clicks ?? 0,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  is_user_owned: p.isUserOwned || false,
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
  await supabase.from('products').upsert(
    products.map(toDbProduct),
    { onConflict: 'id' }
  );
}

/** Delete a product from Supabase */
export async function deleteProduct(productId: string): Promise<void> {
  await supabase.from('products').delete().eq('id', productId);
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
