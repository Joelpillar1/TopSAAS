import { supabase } from './supabase';

/**
 * Markers that prove the TopSAAS badge snippet is present in a page's HTML or scripts.
 */
const BADGE_MARKERS: RegExp[] = [
  /topsaas/i, // Any mention of topsaas (URL, alt, class, id, text, href)
  /top-saas/i,
  /top_saas/i,
  /top\s+saas/i,
  /\/badge/i, // /badge/, /badges/, /badge?style=
  /badge\.(svg|png|webp|jpg|jpeg)/i,
  /featured\s*(on|at|by)?\s*topsaas/i,
  /Share(?:%20|\s+)Badge/i,
  /TopSAAS\s*Type/i,
];

export function containsBadge(html: string): boolean {
  if (!html) return false;
  return BADGE_MARKERS.some((marker) => marker.test(html));
}

export interface BadgeCheckResult {
  verified: boolean;
  /** Whether the page was actually retrieved — separates "no badge" from "unreachable". */
  fetched: boolean;
  reason?: string;
}

/**
 * Primary check: call the Vercel serverless endpoint `/api/verify-badge`.
 * This runs on the server (no CORS, realistic Chrome browser headers, redirect following,
 * and deep-scans both raw HTML and client-rendered SPA bundles).
 * Falls back to live topsaas.space endpoint or Supabase Edge Function if needed.
 */
export async function verifyBadgeViaEdge(url: string): Promise<BadgeCheckResult> {
  // 1. Try local or same-origin /api/verify-badge
  const endpoints = ['/api/verify-badge'];

  // If in local dev (localhost/127.0.0.1), also add the live production endpoint as fallback
  if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/i.test(window.location.hostname)) {
    endpoints.push('https://topsaas.space/api/verify-badge');
  }

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.verified === 'boolean') {
          return {
            verified: data.verified,
            fetched: Boolean(data.fetched),
            reason: typeof data.reason === 'string' ? data.reason : undefined,
          };
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  // 2. Fallback to Supabase Edge Function if available
  try {
    const { data, error } = await supabase.functions.invoke('verify-badge', {
      body: { url },
    });

    if (!error && data && typeof data.verified === 'boolean') {
      return {
        verified: data.verified,
        fetched: Boolean(data.fetched),
        reason: typeof data.reason === 'string' ? data.reason : undefined,
      };
    }
  } catch {
    // Continue to fallback
  }

  return {
    verified: false,
    fetched: false,
    reason: 'We could not reach your website to check for the badge. Please ensure your site is online and publicly accessible.',
  };
}

/**
 * Fallback: best-effort browser fetch when serverless verification is unavailable.
 */
export async function fetchHtmlBestEffort(
  url: string
): Promise<{ html: string; fetched: boolean }> {
  try {
    const direct = await fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' });
    if (direct.ok) {
      const html = await direct.text();
      if (html) return { html, fetched: true };
    }
  } catch {
    // Cross-origin restriction expected — fall through to the proxies.
  }

  const encoded = encodeURIComponent(url);
  const proxies: { url: string; parse: 'json' | 'text' }[] = [
    { url: `https://api.allorigins.win/get?url=${encoded}`, parse: 'json' },
    { url: `https://api.allorigins.win/raw?url=${encoded}`, parse: 'text' },
    { url: `https://corsproxy.io/?url=${encoded}`, parse: 'text' },
    { url: `https://api.codetabs.com/v1/proxy?quest=${encoded}`, parse: 'text' },
  ];

  for (const proxy of proxies) {
    try {
      const res = await fetch(proxy.url);
      if (!res.ok) continue;

      let html = '';
      if (proxy.parse === 'json') {
        const data = await res.json().catch(() => null);
        html = typeof data?.contents === 'string' ? data.contents : '';
      } else {
        html = await res.text();
      }

      if (html) return { html, fetched: true };
    } catch {
      // Try next proxy
    }
  }

  return { html: '', fetched: false };
}
