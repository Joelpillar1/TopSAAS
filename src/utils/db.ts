import { supabase } from './supabase';
import { Product, Category, Comment } from '../types';

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
  screenshots: (row.screenshots as string[]) || undefined,
  demoVideoUrl: (row.demo_video_url as string) || undefined,
  twitterHandle: (row.twitter_handle as string) || undefined,
  socials: (row.socials as Product['socials']) || undefined,
  creatorName: (row.creator_name as string) || undefined,
  creatorUsername: (row.creator_username as string) || undefined,
  creatorXHandle: (row.creator_x_handle as string) || undefined,
  creatorAvatar: (row.creator_avatar as string) || undefined,
  creatorRole: (row.creator_role as string) || undefined,
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
  screenshots: p.screenshots || null,
  demo_video_url: p.demoVideoUrl || null,
  twitter_handle: p.twitterHandle || null,
  socials: p.socials || null,
  creator_name: p.creatorName || null,
  creator_username: p.creatorUsername || null,
  creator_x_handle: p.creatorXHandle || null,
  creator_avatar: p.creatorAvatar || null,
  creator_role: p.creatorRole || null,
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

/**
 * Whether the remote `products` table has the `screenshots` column yet.
 * Probed once so the app keeps working until the 013 migration is applied.
 */
let screenshotsColumnAvailablePromise: Promise<boolean> | null = null;
export function screenshotsColumnAvailable(): Promise<boolean> {
  if (!screenshotsColumnAvailablePromise) {
    screenshotsColumnAvailablePromise = (async () => {
      try {
        const { error } = await supabase.from('products').select('screenshots').limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return screenshotsColumnAvailablePromise;
}

/** Whether the remote `products` table has the socials / creator columns yet (needs migration 014) */
let socialsColumnsAvailablePromise: Promise<boolean> | null = null;
export function socialsColumnsAvailable(): Promise<boolean> {
  if (!socialsColumnsAvailablePromise) {
    socialsColumnsAvailablePromise = (async () => {
      try {
        const { error } = await supabase
          .from('products')
          .select('socials,creator_name,creator_username,creator_x_handle')
          .limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return socialsColumnsAvailablePromise;
}

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
    const [includeScreenshots, includeSocials] = await Promise.all([
      screenshotsColumnAvailable(),
      socialsColumnsAvailable(),
    ]);
    const rows: Record<string, unknown>[] = products.map((p) => {
      const row = { ...toDbProduct(p) } as Record<string, unknown>;
      if (!includeScreenshots) delete row.screenshots;
      if (!includeSocials) {
        delete row.socials;
        delete row.creator_name;
        delete row.creator_username;
        delete row.creator_x_handle;
      }
      return row;
    });
    await supabase.from('products').upsert(rows, { onConflict: 'id' });
  } catch {}
}

/** Insert a single product (payload respects whether screenshots are supported yet) */
export async function insertProductDirect(p: Product): Promise<void> {
  try {
    const [includeScreenshots, includeSocials] = await Promise.all([
      screenshotsColumnAvailable(),
      socialsColumnsAvailable(),
    ]);
    const row = { ...toDbProduct(p) } as Record<string, unknown>;
    if (!includeScreenshots) delete row.screenshots;
    if (!includeSocials) {
      delete row.socials;
      delete row.creator_name;
      delete row.creator_username;
      delete row.creator_x_handle;
    }
    await supabase.from('products').insert(row);
  } catch {}
}

/** Update an existing product in Supabase */
export async function updateProductDirect(p: Product): Promise<boolean> {
  try {
    const [includeScreenshots, includeSocials] = await Promise.all([
      screenshotsColumnAvailable(),
      socialsColumnsAvailable(),
    ]);
    const row = { ...toDbProduct(p) } as Record<string, unknown>;
    if (!includeScreenshots) delete row.screenshots;
    if (!includeSocials) {
      delete row.socials;
      delete row.creator_name;
      delete row.creator_username;
      delete row.creator_x_handle;
      delete row.creator_avatar;
      delete row.creator_role;
    }
    const { error } = await supabase.from('products').update(row).eq('id', p.id);
    return !error;
  } catch {
    return false;
  }
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

// ── Comments (with Caching & DB Sync) ──

const COMMENTS_CACHE_KEY = 'topsaas_comments_cache_v2';
const COMMENTS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache validity

let commentsMemoryCache: { timestamp: number; data: Comment[] } | null = null;

function getStoredCommentsCache(): { timestamp: number; data: Comment[] } | null {
  if (commentsMemoryCache) return commentsMemoryCache;
  try {
    const raw = localStorage.getItem(COMMENTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data)) {
      commentsMemoryCache = parsed;
      return parsed;
    }
  } catch {}
  return null;
}

function persistCommentsCache(comments: Comment[]): void {
  const cacheObj = { timestamp: Date.now(), data: comments };
  commentsMemoryCache = cacheObj;
  try {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cacheObj));
  } catch {}
}

/** Get currently cached comments synchronously without network roundtrip */
export function getCachedCommentsSync(): Comment[] {
  const cache = getStoredCommentsCache();
  return cache ? cache.data : [];
}

/** Load comments from cache if fresh, otherwise fetch from Supabase and update cache */
export async function fetchComments(forceFresh = false): Promise<Comment[]> {
  const cache = getStoredCommentsCache();
  const isFresh = cache && Date.now() - cache.timestamp < COMMENTS_CACHE_TTL_MS;

  if (!forceFresh && isFresh && cache.data.length > 0) {
    return cache.data;
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      // Fallback to cache if network fails
      return cache ? cache.data : [];
    }

    const mapped: Comment[] = data.map((row) => ({
      id: row.id as string,
      productId: row.product_id as string,
      userName: row.user_name as string,
      userEmail: (row.user_email as string) || undefined,
      userAvatar: (row.user_avatar as string) || undefined,
      content: row.content as string,
      createdAt: Number(row.created_at) || Date.now(),
    }));

    persistCommentsCache(mapped);
    return mapped;
  } catch {
    return cache ? cache.data : [];
  }
}

/** Post a comment; saves to Supabase and immediately updates local cache */
export async function addComment(input: {
  productId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  content: string;
}): Promise<Comment | null> {
  const now = Date.now();
  
  // Try inserting with user_avatar first
  let payload: Record<string, unknown> = {
    product_id: input.productId,
    user_name: input.userName,
    user_email: input.userEmail || null,
    user_avatar: input.userAvatar || null,
    content: input.content,
    created_at: now,
  };

  let { data, error } = await supabase
    .from('comments')
    .insert(payload)
    .select()
    .single();

  // If column doesn't exist yet in Supabase schema, fall back without user_avatar
  if (error && (error.message?.includes('user_avatar') || error.code === 'PGRST204')) {
    payload = {
      product_id: input.productId,
      user_name: input.userName,
      user_email: input.userEmail || null,
      content: input.content,
      created_at: now,
    };
    const retry = await supabase
      .from('comments')
      .insert(payload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  const savedComment: Comment = data
    ? {
        id: data.id as string,
        productId: data.product_id as string,
        userName: data.user_name as string,
        userEmail: (data.user_email as string) || undefined,
        userAvatar: (data.user_avatar as string) || input.userAvatar || undefined,
        content: data.content as string,
        createdAt: Number(data.created_at) || now,
      }
    : {
        id: `local-${now}-${Math.random().toString(36).slice(2, 7)}`,
        productId: input.productId,
        userName: input.userName,
        userEmail: input.userEmail,
        userAvatar: input.userAvatar,
        content: input.content,
        createdAt: now,
      };

  // Update memory and localStorage cache immediately
  const existing = getStoredCommentsCache()?.data || [];
  const updatedList = [...existing.filter((c) => c.id !== savedComment.id), savedComment];
  persistCommentsCache(updatedList);

  if (error && !data) {
    console.warn('Could not persist comment to Supabase, stored locally in cache', error);
  }

  return savedComment;
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
