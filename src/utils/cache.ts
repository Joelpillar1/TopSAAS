/**
 * High-performance client-side TTL caching layer for Supabase queries.
 * Combines an in-memory Map (0ms latency, zero deserialization cost)
 * with a persisted localStorage backup (survives refreshes & new tabs).
 *
 * This dramatically reduces Supabase egress by eliminating redundant network calls.
 */

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

const memoryStore = new Map<string, CacheEntry<unknown>>();

export const CACHE_TTL = {
  PRODUCTS: 5 * 60 * 1000,        // 5 minutes for directory products
  PRODUCT_DETAIL: 10 * 60 * 1000, // 10 minutes for single product full details
  SUBMISSIONS: 3 * 60 * 1000,     // 3 minutes for submissions queue
  SUBMISSION_DETAIL: 10 * 60 * 1000, // 10 minutes for single submission review
  UPVOTE_COUNTS: 2 * 60 * 1000,   // 2 minutes for upvote counts map
  SPONSORS: 5 * 60 * 1000,        // 5 minutes for active sponsors
  SPONSOR_RAILS: 10 * 60 * 1000,  // 10 minutes for sponsor rails toggle
  FEATURED: 5 * 60 * 1000,        // 5 minutes for featured product position
  COMMENTS: 5 * 60 * 1000,        // 5 minutes for comments
};

/**
 * Retrieve cached data if it exists and has not expired.
 * Pass ttlMs = Infinity to retrieve fallback data even if expired.
 */
export function getCached<T>(key: string, ttlMs: number): T | null {
  // 1. Fast in-memory check
  const mem = memoryStore.get(key) as CacheEntry<T> | undefined;
  if (mem && (ttlMs === Infinity || Date.now() - mem.timestamp < ttlMs)) {
    return mem.data;
  }

  // 2. LocalStorage backup
  try {
    const raw = localStorage.getItem(`cache_${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as CacheEntry<T>;
      if (parsed && typeof parsed.timestamp === 'number') {
        if (ttlMs === Infinity || Date.now() - parsed.timestamp < ttlMs) {
          memoryStore.set(key, parsed as CacheEntry<unknown>);
          return parsed.data;
        }
      }
    }
  } catch {
    // Ignore localStorage parse or access errors
  }

  return null;
}

/**
 * Store data in memory and localStorage with the current timestamp.
 */
export function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { timestamp: Date.now(), data };
  memoryStore.set(key, entry as CacheEntry<unknown>);
  try {
    localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
  } catch {
    // Quota exceeded fallback: ignore or keep in memory only
  }
}

/**
 * Invalidate all cache entries matching the given key prefix.
 * e.g. invalidateCache('products') invalidates 'products_list', 'product_123', etc.
 */
export function invalidateCache(keyPrefix: string): void {
  // Clear from memory
  for (const k of memoryStore.keys()) {
    if (k.startsWith(keyPrefix)) {
      memoryStore.delete(k);
    }
  }

  // Clear from localStorage
  try {
    const prefix = `cache_${keyPrefix}`;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
}
