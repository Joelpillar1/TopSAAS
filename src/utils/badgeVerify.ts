import { supabase } from './supabase';

/**
 * Markers that prove the TopSAAS badge snippet is present in a page's HTML.
 * Kept deliberately domain-agnostic: the directory is served from topsaas.space,
 * and the badge can also be shown on previews, so matching only `topsaas.org`
 * (the previous behaviour) silently failed for real listings.
 */
const BADGE_MARKERS: RegExp[] = [
  /\/badge\//i, // <img src="https://…/badge/<id>?style=…">
  /badge\?style=/i,
  /featured\s+on\s+topsaas/i, // anchor text / img alt
  /topsaas\.(space|org|com)/i, // any link back to the directory
];

export function containsBadge(html: string): boolean {
  return BADGE_MARKERS.some((marker) => marker.test(html));
}

export interface BadgeCheckResult {
  verified: boolean;
  /** Whether the page was actually retrieved — separates "no badge" from "unreachable". */
  fetched: boolean;
  reason?: string;
}

/**
 * Primary check: ask the `verify-badge` Edge Function to fetch the page
 * server-side. No CORS, a real user agent, and no third-party rate limits.
 * If the function is not deployed yet this fails gracefully so the caller can
 * fall back to the browser path.
 */
export async function verifyBadgeViaEdge(url: string): Promise<BadgeCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke('verify-badge', {
      body: { url },
    });

    if (error) return { verified: false, fetched: false, reason: error.message };
    if (!data || typeof data.verified !== 'boolean') {
      return { verified: false, fetched: false, reason: 'Unexpected verifier response' };
    }

    return {
      verified: data.verified,
      fetched: Boolean(data.fetched),
      reason: typeof data.reason === 'string' ? data.reason : undefined,
    };
  } catch (err) {
    return {
      verified: false,
      fetched: false,
      reason: err instanceof Error ? err.message : 'Network error',
    };
  }
}

/**
 * Fallback: best-effort browser fetch. The direct attempt only succeeds for sites
 * that send permissive CORS headers, so we then try public proxies that work
 * without an API key.
 *
 * Note the response shapes differ: AllOrigins `/get` wraps the page in JSON,
 * everything else returns the raw HTML body. The previous implementation assumed
 * JSON for every proxy, which meant the raw-text proxies always threw.
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
      // Try the next proxy.
    }
  }

  return { html: '', fetched: false };
}
