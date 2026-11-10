import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * verify-badge
 * ------------
 * Fetches a submitted website server-side and reports whether the TopSAAS badge
 * snippet is present in its HTML.
 *
 * Why this exists: the browser cannot read an arbitrary third-party page (CORS),
 * so the old client-only check leaned on free public proxies that are rate-limited
 * and frequently down. Fetching here removes the CORS problem entirely and lets us
 * send a normal browser User-Agent so bot-protected sites still answer.
 *
 * POST { url: string }
 *   -> { verified: boolean, fetched: boolean, reason?: string }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Any one of these in the page HTML proves the badge snippet was embedded. */
const BADGE_MARKERS = [
  /topsaas/i, // Any mention of topsaas (URL, alt, class, id, text, href)
  /top-saas/i,
  /top_saas/i,
  /top\s+saas/i,
  /top[^\w<]{0,10}saas/i,
  /\/badge/i, // /badge/, /badges/, /badge?style=
  /badge\.(svg|png|webp|jpg|jpeg)/i,
  /featured\s*(on|at|by)?\s*topsaas/i,
  /Share(?:%20|\s+)Badge/i,
  /TopSAAS\s*Type/i,
  /topsaas\.space/i,
];

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_CHARS = 600_000;

/** Refuse loopback / private / link-local targets so this cannot be used to scan a network. */
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host === "::1" || host.endsWith(".local") || host.endsWith(".internal")) return true;

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

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ verified: false, fetched: false, reason: "Method not allowed" }, 405);
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
      return jsonResponse({ verified: false, fetched: false, reason: "Missing url" }, 400);
    }

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return jsonResponse({ verified: false, fetched: false, reason: "Invalid url" }, 400);
    }

    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return jsonResponse({ verified: false, fetched: false, reason: "Unsupported protocol" }, 400);
    }

    if (isBlockedHost(target.hostname)) {
      return jsonResponse(
        { verified: false, fetched: false, reason: "URL host is not publicly reachable" },
        400
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(target.toString(), {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; TopSAASBadgeVerifier/1.0; +https://topsaas.space)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      return jsonResponse({ verified: false, fetched: false, reason: `HTTP ${res.status}` });
    }

    const html = (await res.text()).slice(0, MAX_HTML_CHARS);
    const verified = BADGE_MARKERS.some((marker) => marker.test(html));

    return jsonResponse({ verified, fetched: true });
  } catch (err) {
    const reason =
      err instanceof Error && err.name === "AbortError"
        ? "Website took too long to respond"
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return jsonResponse({ verified: false, fetched: false, reason });
  }
});
