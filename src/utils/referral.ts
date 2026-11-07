/**
 * Outbound Referral & Traffic Attribution Utilities
 *
 * Ensures all outbound visitor clicks from TopSAAS to founders' websites:
 * 1. Pass `ref=topsaas` and standard UTM tags for tracking in Google Analytics / Plausible / PostHog.
 * 2. Retain the browser HTTP `Referer: https://topsaas.space/` header by using `rel="noopener"` (not `noreferrer`).
 * 3. Persist click metrics to the Supabase database and emit Trackkit goals.
 */

import { incrementProductClicksDirect } from './db';

export interface OutboundOptions {
  campaign?: string; // 'directory' | 'featured' | 'sponsor_rail' | 'deal' | 'drawer'
  productId?: string;
  productName?: string;
  onTrackClick?: (productId: string, url: string) => void;
}

/**
 * Normalizes an external URL and appends `ref=topsaas` and standard directory UTM tags.
 */
export function formatOutboundUrl(
  rawUrl: string,
  options?: { campaign?: string; refTag?: string }
): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';

  let trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const url = new URL(trimmed);
    const campaign = options?.campaign || 'topsaas_listing';
    const refTag = options?.refTag || 'topsaas';

    // Set referral and UTM parameters if not already specified by founder
    if (!url.searchParams.has('ref')) {
      url.searchParams.set('ref', refTag);
    }
    if (!url.searchParams.has('utm_source')) {
      url.searchParams.set('utm_source', 'topsaas');
    }
    if (!url.searchParams.has('utm_medium')) {
      url.searchParams.set('utm_medium', 'directory');
    }
    if (!url.searchParams.has('utm_campaign')) {
      url.searchParams.set('utm_campaign', campaign);
    }

    return url.toString();
  } catch {
    // Fallback if URL constructor fails
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}ref=topsaas&utm_source=topsaas&utm_medium=directory`;
  }
}

/**
 * Tracks an outbound click: deduplicates by session, persists to Supabase, and triggers Trackkit goals.
 */
export function trackOutboundClick(
  productId: string,
  url: string,
  productName?: string,
  onTrackClick?: (productId: string, url: string) => void
): void {
  if (!productId) return;

  // 1. Notify parent handler if provided (for React state & live traffic feed updates)
  try {
    onTrackClick?.(productId, url);
  } catch {}

  // 2. Increment in Supabase database with session deduplication (1 count per session)
  const sessionKey = `topsaas_clicked_${productId}`;
  let alreadyClicked = false;
  try {
    if (typeof sessionStorage !== 'undefined') {
      alreadyClicked = Boolean(sessionStorage.getItem(sessionKey));
      if (!alreadyClicked) {
        sessionStorage.setItem(sessionKey, '1');
      }
    }
  } catch {}

  if (!alreadyClicked) {
    incrementProductClicksDirect(productId).catch(() => {});
  }

  // 3. Emit Trackkit goal
  try {
    window.trackkit?.('goal', 'outbound_click', {
      product_id: productId,
      product_name: productName || undefined,
      url: url,
    });
  } catch {}
}

/**
 * Formats an outbound URL, tracks the click, and opens the external site in a new tab.
 * Uses `noopener` (WITHOUT `noreferrer`) so the destination site receives `Referer: https://topsaas.space/`.
 */
export function openOutboundUrl(
  rawUrl: string,
  options?: OutboundOptions
): void {
  if (!rawUrl) return;

  const targetUrl = formatOutboundUrl(rawUrl, { campaign: options?.campaign });

  if (options?.productId) {
    trackOutboundClick(
      options.productId,
      rawUrl,
      options.productName,
      options.onTrackClick
    );
  }

  window.open(targetUrl, '_blank', 'noopener');
}
