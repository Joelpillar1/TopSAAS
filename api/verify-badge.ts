// ---------------------------------------------------------------------------
// Vercel Serverless Function: /api/verify-badge
// Verifies presence of TopSAAS badge on any submitted domain.
// Supports:
// 1. Static HTML & SSR (Next.js, Webflow, WordPress, Astro, Shopify, HTML/CSS)
// 2. Client-side SPAs (Vite, CRA React, Vue) by inspecting linked JS app bundles & preloads
// 3. Follows redirects and sends realistic browser headers to prevent bot blocks
// 4. Multi-variant URL testing (apex domain, www, alternate landing paths)
// ---------------------------------------------------------------------------

const BADGE_MARKERS: RegExp[] = [
  /topsaas/i, // Any mention of topsaas (URL, alt, class, id, text, href)
  /top-saas/i,
  /top_saas/i,
  /top\s+saas/i,
  /top[^\w<]{0,10}saas/i, // handles SVG markup like Top</tspan><tspan>SAAS
  /\/badge/i, // /badge/, /badges/, /badge?style=
  /badge\.(svg|png|webp|jpg|jpeg)/i,
  /featured\s*(on|at|by)?\s*topsaas/i,
  /Share(?:%20|\s+)Badge/i,
  /TopSAAS\s*Type/i,
  /topsaas\.space/i,
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

async function fetchWithTimeout(url: string, timeoutMs = 9000): Promise<{ response?: Response; error?: Error }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { response };
  } catch (err: any) {
    clearTimeout(timer);
    return { error: err };
  }
}

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
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch {
        body = {};
      }
    }
    rawUrl = (body?.url || '').trim();
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

  // Build candidate URLs to check (handles subdomains like app.foo.com, missing www, and subpaths)
  const candidateUrls: string[] = [parsedUrl.href];

  // If URL has a path (e.g. https://myproduct.com/app or /login), also check the root landing page
  if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
    candidateUrls.push(parsedUrl.origin + '/');
  }

  // www <-> non-www variant
  const parts = parsedUrl.hostname.split('.');
  if (parsedUrl.hostname.startsWith('www.')) {
    const noWwwHost = parsedUrl.hostname.slice(4);
    candidateUrls.push(`https://${noWwwHost}${parsedUrl.pathname || '/'}`);
  } else if (parts.length === 2) {
    // apex domain like myproduct.com -> www.myproduct.com
    candidateUrls.push(`https://www.${parsedUrl.hostname}${parsedUrl.pathname || '/'}`);
  } else if (parts.length > 2 && parts[0] === 'app') {
    // app.myproduct.com -> myproduct.com
    const apexHost = parts.slice(1).join('.');
    candidateUrls.push(`https://${apexHost}/`);
    candidateUrls.push(`https://www.${apexHost}/`);
  }

  // Deduplicate candidates
  const uniqueUrls = Array.from(new Set(candidateUrls));

  let lastStatus = 0;
  let lastBlocked = false;
  let reachedAny = false;

  for (const targetUrl of uniqueUrls) {
    // 1. Fetch HTML of candidate URL
    let fetchRes = await fetchWithTimeout(targetUrl, 9000);

    // If HTTPS fails with network/SSL error, try HTTP fallback
    if (fetchRes.error && targetUrl.startsWith('https://')) {
      const httpFallback = targetUrl.replace(/^https:/, 'http:');
      const httpRes = await fetchWithTimeout(httpFallback, 6000);
      if (httpRes.response) {
        fetchRes = httpRes;
      }
    }

    if (!fetchRes.response) {
      continue;
    }

    const response = fetchRes.response;
    lastStatus = response.status;
    const finalUrl = response.url || targetUrl;

    // Check for bot protection / WAF blocks
    if (response.status === 401 || response.status === 403) {
      lastBlocked = true;
      continue;
    }

    if (!response.ok && response.status >= 500) {
      continue;
    }

    reachedAny = true;
    let html = '';
    try {
      html = await response.text();
    } catch {
      continue;
    }

    if (!html) continue;

    // 2. Direct Check: inspect HTML
    if (containsBadge(html)) {
      return res.json({
        verified: true,
        fetched: true,
        reason: 'TopSAAS badge detected in page HTML',
      });
    }

    // 3. Deep Scan: Client-rendered SPAs (Vite, React, Vue, Next.js client components)
    // Extract <script src="..."> and <link rel="modulepreload|preload" href="...">
    const scriptSrcs: string[] = [];
    const scriptRegex = /<(?:script\b[^>]*\bsrc|link\b[^>]*\b(?:rel=["'](?:modulepreload|preload)["'][^>]*\bhref|href=["'][^"']+\brel=["'](?:modulepreload|preload)["']))=["']([^"']+\.(?:js|mjs)(?:\?[^"']*)?)["'][^>]*>/gi;
    let match: RegExpExecArray | null;

    while ((match = scriptRegex.exec(html)) !== null && scriptSrcs.length < 25) {
      const src = match[1];
      // Skip common third-party trackers, analytics, fonts, CDNs
      if (
        /googletagmanager|google-analytics|clarity|hotjar|intercom|segment|amplitude|stripe|sentry|facebook|twitter|tiktok|crisp|hubspot|adsbygoogle|posthog|datadog|mixpanel/i.test(
          src
        )
      ) {
        continue;
      }
      scriptSrcs.push(src);
    }

    // Check bundle scripts in parallel batches
    for (const src of scriptSrcs) {
      try {
        const scriptUrl = new URL(src, finalUrl).href;
        const scriptRes = await fetchWithTimeout(scriptUrl, 5000);
        if (scriptRes.response && scriptRes.response.ok) {
          const scriptCode = await scriptRes.response.text();
          if (containsBadge(scriptCode)) {
            return res.json({
              verified: true,
              fetched: true,
              reason: 'TopSAAS badge detected in client application bundle',
            });
          }
        }
      } catch {
        // Continue checking
      }
    }
  }

  if (lastBlocked) {
    return res.json({
      verified: false,
      fetched: false,
      blocked: true,
      reason: `Automated scanner was blocked by target site (HTTP ${lastStatus}). Cloudflare or bot protection may be enabled. You can confirm badge placement manually below.`,
    });
  }

  if (!reachedAny) {
    return res.json({
      verified: false,
      fetched: false,
      reason: `Could not reach ${parsedUrl.hostname}. Please ensure your website is online and publicly accessible.`,
    });
  }

  // Loaded the page successfully, but no badge found in HTML or bundles
  return res.json({
    verified: false,
    fetched: true,
    reason: 'Page reached, but TopSAAS badge was not found in the HTML or application bundles',
  });
}
