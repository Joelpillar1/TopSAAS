import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

/**
 * autofill-submission
 * -------------------
 * Supabase Edge Function to scrape website metadata and use OpenAI (gpt-4o-mini)
 * to autofill the TopSAAS product submission form.
 *
 * Security:
 * The OpenAI API key is protected server-side inside Supabase:
 * 1. Supabase Edge Function Secret (Deno.env.get("OPENAI_API_KEY")), OR
 * 2. Supabase `app_secrets` table (protected with RLS, read via SUPABASE_SERVICE_ROLE_KEY).
 *
 * The client never receives or transmits the API key.
 *
 * POST { url: string }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-openai-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_CATEGORIES = [
  "AI Tools",
  "Developer Tools",
  "Productivity",
  "Design & UI",
  "SaaS & Indie",
  "Social Media & Community",
  "X / Twitter Tools",
  "LinkedIn Tools",
  "YouTube & Video",
  "Discord & Telegram",
  "Instagram & TikTok",
  "Marketing & SEO",
  "Analytics & Data",
  "Finance & Fintech",
  "E-commerce",
  "Security & Privacy",
  "Communication & Social",
  "Sales & CRM",
  "No-Code & Low-Code",
  "Education & Learning",
  "Cloud & DevOps",
  "Content & Media",
  "Automation & Workflows",
  "Open Source",
  "Crypto & Web3",
  "HR & Hiring",
  "Customer Support",
  "Health & Wellness",
];

const ALLOWED_PRICING = ["Free", "Freemium", "Paid", "Open Source"];

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

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  let body: { url?: string; apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  let rawUrl = (body.url || "").trim();

  // 1. Retrieve the OpenAI API key securely from Supabase Edge Secrets or database
  let effectiveApiKey = Deno.env.get("OPENAI_API_KEY") || "";

  if (!effectiveApiKey) {
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data } = await supabase
          .from("app_secrets")
          .select("value")
          .eq("key", "openai_api_key")
          .maybeSingle();

        if (data?.value && data.value.trim().length > 0) {
          effectiveApiKey = data.value.trim();
        }
      }
    } catch (dbErr) {
      console.error("Could not fetch openai_api_key from Supabase app_secrets table:", dbErr);
    }
  }

  if (!rawUrl) {
    return jsonResponse({ ok: false, error: "Missing website URL" }, 400);
  }

  if (!effectiveApiKey) {
    return jsonResponse({
      ok: false,
      code: "NO_API_KEY",
      error: "OpenAI API key is not configured in Supabase. Please set OPENAI_API_KEY in your Supabase Edge Function Secrets (via Dashboard > Edge Functions > Secrets) or add it to the app_secrets table in your Supabase database.",
    }, 200);
  }

  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return jsonResponse({ ok: false, error: "Invalid URL format" }, 400);
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    return jsonResponse({ ok: false, error: "Target host not allowed" }, 400);
  }

  // 1. Fetch website HTML
  let html = "";
  let finalUrl = parsedUrl.href;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(parsedUrl.href, {
      method: "GET",
      headers: BROWSER_HEADERS,
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    finalUrl = response.url || parsedUrl.href;
    html = await response.text();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Connection timed out";
    return jsonResponse({ ok: false, error: `Could not reach target website: ${msg}` }, 200);
  }

  // 2. Extract metadata
  const ogTitleMatch =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = (ogTitleMatch?.[1] || titleTagMatch?.[1] || "").trim();

  const ogDescMatch =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = (ogDescMatch?.[1] || metaDescMatch?.[1] || "").trim();

  // Favicon
  let faviconUrl = "";
  const iconMatch =
    html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);
  if (iconMatch?.[1]) {
    try {
      faviconUrl = new URL(iconMatch[1], finalUrl).href;
    } catch {
      faviconUrl = iconMatch[1];
    }
  }

  // Headings
  const headingMatches = html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  const headings: string[] = [];
  for (const m of headingMatches) {
    const text = m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (text && text.length > 2 && text.length < 150) {
      headings.push(text);
      if (headings.length >= 10) break;
    }
  }

  // Clean body text
  let text = html.replace(/<(script|style|svg|noscript|iframe|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const cleanText = text.slice(0, 7000);

  // Socials
  const socials: Record<string, string> = {};
  const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);
  for (const m of hrefMatches) {
    const href = m[1].trim();
    if (!socials.twitter && /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,30})/i.test(href) && !/(?:intent|share|home|tos)/i.test(href)) {
      socials.twitter = href;
    }
    if (!socials.github && /github\.com\/([a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_.-]+)?/i.test(href) && !/(?:sponsors|pricing|about)/i.test(href)) {
      socials.github = href;
    }
    if (!socials.linkedin && /linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i.test(href) && !/(?:shareArticle)/i.test(href)) {
      socials.linkedin = href;
    }
    if (!socials.discord && /(?:discord\.gg\/|discord\.com\/invite\/)/i.test(href)) {
      socials.discord = href;
    }
    if (!socials.youtube && /youtube\.com\/(?:@|channel\/|c\/)/i.test(href)) {
      socials.youtube = href;
    }
  }

  // 3. Call OpenAI
  const prompt = `You are an expert product marketing analyst for TopSAAS (https://topsaas.org).
Extract and generate structured product details for this website.

Website URL: ${finalUrl}
Detected Title: ${title}
Detected Description: ${description}
Headings: ${headings.join(" | ")}
Extracted Social Links: ${JSON.stringify(socials)}

Page Content:
${cleanText}

Allowed categories (pick 1 as primary "category", and 1 to 3 best matches for "categories"):
${JSON.stringify(ALLOWED_CATEGORIES)}

Allowed pricingModel (must be exactly one of):
${JSON.stringify(ALLOWED_PRICING)}

Output strict JSON with this exact structure:
{
  "name": "Clean product name (max 60 chars)",
  "tagline": "Crisp one-sentence value proposition (max 80 chars, no name repetition)",
  "description": "Structured overview using HTML (<p>, <strong>, <ul>, <li>, max 1500 chars)",
  "category": "One category from allowed categories",
  "categories": ["1 to 3 categories from allowed categories"],
  "pricingModel": "Free" | "Freemium" | "Paid" | "Open Source",
  "targetAudience": "Who this product is built for",
  "problemItSolves": "Core problem it solves",
  "solution": "How it solves the problem",
  "uniqueSellingPoint": "Differentiator vs competitors",
  "twitter": "X/Twitter link or handle if found, else empty",
  "github": "GitHub repo or org link if found, else empty",
  "linkedin": "LinkedIn URL if found, else empty",
  "discord": "Discord invite link if found, else empty",
  "youtube": "YouTube channel link if found, else empty"
}`;

  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${effectiveApiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You output valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return jsonResponse({ ok: false, error: `OpenAI API error: ${errText}` }, 500);
    }

    const aiData = await aiRes.json();
    const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || "{}");

    const cleanName = String(parsed.name || title || "").slice(0, 60).trim();
    const cleanTagline = String(parsed.tagline || description || "").slice(0, 80).trim();
    const cleanDescription = String(parsed.description || "").slice(0, 2000).trim();

    const matchedCategory =
      ALLOWED_CATEGORIES.find((c) => c.toLowerCase() === String(parsed.category || "").toLowerCase()) ||
      "AI Tools";

    let categoriesList: string[] = Array.isArray(parsed.categories) ? parsed.categories : [];
    categoriesList = categoriesList
      .map((c: string) => ALLOWED_CATEGORIES.find((ac) => ac.toLowerCase() === String(c).toLowerCase()))
      .filter((c): c is string => Boolean(c))
      .slice(0, 3);
    if (categoriesList.length === 0) categoriesList = [matchedCategory];

    const matchedPricing =
      ALLOWED_PRICING.find((p) => p.toLowerCase() === String(parsed.pricingModel || "").toLowerCase()) ||
      "Freemium";

    return jsonResponse({
      ok: true,
      data: {
        name: cleanName,
        tagline: cleanTagline,
        description: cleanDescription,
        category: matchedCategory,
        categories: categoriesList,
        pricingModel: matchedPricing,
        targetAudience: String(parsed.targetAudience || "").trim(),
        problemItSolves: String(parsed.problemItSolves || "").trim(),
        solution: String(parsed.solution || "").trim(),
        uniqueSellingPoint: String(parsed.uniqueSellingPoint || "").trim(),
        twitter: parsed.twitter || socials.twitter || "",
        github: parsed.github || socials.github || "",
        linkedin: parsed.linkedin || socials.linkedin || "",
        discord: parsed.discord || socials.discord || "",
        youtube: parsed.youtube || socials.youtube || "",
        faviconUrl,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "OpenAI extraction failed";
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});

