// ---------------------------------------------------------------------------
// Vercel Serverless Function: /api/verify-badge
// Verifies presence of TopSAAS badge on any submitted domain.
// Supports:
// 1. Static HTML & SSR (Next.js, Webflow, WordPress, Astro, Shopify, HTML/CSS)
// 2. Client-side SPAs (Vite, CRA React, Vue) by inspecting linked JS app bundles
// 3. Follows redirects and sends realistic browser headers to prevent bot blocks
// ---------------------------------------------------------------------------

const BADGE_MARKERS: RegExp[] = [
  /topsaas/i,
  /top-saas/i,
  /top_saas/i,
  /top\s+saas/i,
  /\/badge/i,
  /badge\.(svg|png|webp|jpg|jpeg)/i,
  /featured\s*(on|at|by)?\s*topsaas/i,
  /Share(?:%20|\s+)Badge/i,
  /TopSAAS\s*Type/i,
];

function containsBadge(text: string): boolean {
  if (!text) return false;
  return BADGE_MARKERS.some((marker) => marker.test(text));
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host === '::1' || host.endsWith('.local') || host.endsWith('.internal')) return true;

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const a = Number(v4[1]);
    const b = Number(v4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Accept':
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/javascript,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Parse target URL from POST body or GET query
  let rawUrl = '';
  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    rawUrl = (body.url || '').trim();
  } else if (req.method === 'GET') {
    rawUrl = ((req.query?.url as string) || '').trim();
  }

  if (!rawUrl) {
    res.statusCode = 400;
    return res.json({ verified: false, fetched: false, reason: 'Missing url parameter' });
  }

  // Ensure protocol
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    res.statusCode = 400;
    return res.json({ verified: false, fetched: false, reason: 'Invalid URL format' });
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    res.statusCode = 400;
    return res.json({ verified: false, fetched: false, reason: 'Private or local IP not allowed' });
  }

  // 1. Fetch HTML of the site
  let html = '';
  let finalUrl = parsedUrl.href;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsedUrl.href, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    finalUrl = response.url || parsedUrl.href;

    if (!response.ok && response.status >= 500) {
      return res.json({
        verified: false,
        fetched: false,
        reason: `Target site returned server error: HTTP ${response.status}`,
      });
    }

    html = await response.text();
  } catch (err: any) {
    // If https failed, attempt http fallback once
    if (parsedUrl.protocol === 'https:') {
      try {
        const httpUrl = parsedUrl.href.replace(/^https:/, 'http:');
        const fallbackCtrl = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackCtrl.abort(), 8000);

        const httpResp = await fetch(httpUrl, {
          method: 'GET',
          headers: BROWSER_HEADERS,
          redirect: 'follow',
          signal: fallbackCtrl.signal,
        });
        clearTimeout(fallbackTimeout);
        html = await httpResp.text();
        finalUrl = httpResp.url || httpUrl;
      } catch {
        return res.json({
          verified: false,
          fetched: false,
          reason: `Could not reach ${parsedUrl.hostname}: ${err?.message || 'Network connection failed'}`,
        });
      }
    } else {
      return res.json({
        verified: false,
        fetched: false,
        reason: `Could not reach ${parsedUrl.hostname}: ${err?.message || 'Network connection failed'}`,
      });
    }
  }

  if (!html) {
    return res.json({
      verified: false,
      fetched: false,
      reason: 'Empty response received from target website',
    });
  }

  // 2. Direct Check: inspect HTML
  if (containsBadge(html)) {
    return res.json({
      verified: true,
      fetched: true,
      reason: 'TopSAAS badge detected in page HTML',
    });
  }

  // 3. Deep Scan: Client-rendered SPAs (Vite, React, Vue, Next.js client components)
  // Extract <script src="..."> references to check application bundles
  const scriptSrcs: string[] = [];
  const scriptRegex = /<script\b[^>]*\bsrc=["']([^"']+\.(?:js|mjs)(?:\?[^"']*)?)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null && scriptSrcs.length < 12) {
    const src = match[1];
    // Skip third-party trackers / CDNs that won't hold the app badge
    if (/googletagmanager|google-analytics|clarity|hotjar|intercom|segment|amplitude|stripe|sentry|facebook|twitter|adsbygoogle/i.test(src)) {
      continue;
    }
    scriptSrcs.push(src);
  }

  // Check the scripts
  for (const src of scriptSrcs) {
    try {
      const scriptUrl = new URL(src, finalUrl).href;
      const scriptCtrl = new AbortController();
      const scriptTimeout = setTimeout(() => scriptCtrl.abort(), 6000);

      const scriptResp = await fetch(scriptUrl, {
        method: 'GET',
        headers: BROWSER_HEADERS,
        signal: scriptCtrl.signal,
      });

      clearTimeout(scriptTimeout);

      if (scriptResp.ok) {
        const scriptCode = await scriptResp.text();
        if (containsBadge(scriptCode)) {
          return res.json({
            verified: true,
            fetched: true,
            reason: 'TopSAAS badge detected in client application bundle',
          });
        }
      }
    } catch {
      // Continue checking remaining scripts
    }
  }

  // Loaded the page, but no badge found in HTML or bundles
  return res.json({
    verified: false,
    fetched: true,
    reason: 'Page reached, but TopSAAS badge was not found in the HTML or application bundles',
  });
}
