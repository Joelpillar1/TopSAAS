// ---------------------------------------------------------------------------
// Serverless Function: /api/autofill-submission
// Scrapes website metadata and uses OpenAI (gpt-4o-mini) to autofill
// the TopSAAS product submission form.
// ---------------------------------------------------------------------------

const ALLOWED_CATEGORIES = [
  'AI Tools',
  'Developer Tools',
  'Productivity',
  'Design & UI',
  'SaaS & Indie',
  'Social Media & Community',
  'X / Twitter Tools',
  'LinkedIn Tools',
  'YouTube & Video',
  'Discord & Telegram',
  'Instagram & TikTok',
  'Marketing & SEO',
  'Analytics & Data',
  'Finance & Fintech',
  'E-commerce',
  'Security & Privacy',
  'Communication & Social',
  'Sales & CRM',
  'No-Code & Low-Code',
  'Education & Learning',
  'Cloud & DevOps',
  'Content & Media',
  'Automation & Workflows',
  'Open Source',
  'Crypto & Web3',
  'HR & Hiring',
  'Customer Support',
  'Health & Wellness',
] as const;

const ALLOWED_PRICING = ['Free', 'Freemium', 'Paid', 'Open Source'] as const;

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
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

export interface ScrapedPageInfo {
  url: string;
  title: string;
  description: string;
  headings: string[];
  cleanText: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  socials: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    discord?: string;
    youtube?: string;
    productHunt?: string;
  };
}

export function extractPageInfo(html: string, baseUrl: string): ScrapedPageInfo {
  const info: ScrapedPageInfo = {
    url: baseUrl,
    title: '',
    description: '',
    headings: [],
    cleanText: '',
    socials: {},
  };

  // 1. Title
  const ogTitleMatch =
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  info.title = (ogTitleMatch?.[1] || titleTagMatch?.[1] || '').trim();

  // 2. Description
  const ogDescMatch =
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const twitterDescMatch =
    html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:description["']/i);
  info.description = (ogDescMatch?.[1] || metaDescMatch?.[1] || twitterDescMatch?.[1] || '').trim();

  // 3. OpenGraph Image & Favicon
  const ogImgMatch =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogImgMatch?.[1]) {
    try {
      info.ogImageUrl = new URL(ogImgMatch[1], baseUrl).href;
    } catch {
      info.ogImageUrl = ogImgMatch[1];
    }
  }

  const iconMatch =
    html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i) ||
    html.match(/<link[^>]*rel=["']apple-touch-icon(?:-precomposed)?["'][^>]*href=["']([^"']+)["']/i);
  if (iconMatch?.[1]) {
    try {
      info.faviconUrl = new URL(iconMatch[1], baseUrl).href;
    } catch {
      info.faviconUrl = iconMatch[1];
    }
  }

  // 4. Headings (h1, h2, h3)
  const headingMatches = html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  const collectedHeadings: string[] = [];
  for (const m of headingMatches) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text && text.length > 2 && text.length < 150) {
      collectedHeadings.push(text);
      if (collectedHeadings.length >= 10) break;
    }
  }
  info.headings = collectedHeadings;

  // 5. Clean text content
  let text = html;
  // Remove scripts, styles, svg, noscript, nav, footer, iframes
  text = text.replace(/<(script|style|svg|noscript|iframe|nav|footer)[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // Strip comments
  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  // Strip all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Unescape common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  info.cleanText = text.slice(0, 7000);

  // 6. Social link extraction
  const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);
  for (const m of hrefMatches) {
    const href = m[1].trim();

    // Twitter / X
    if (
      !info.socials.twitter &&
      /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,30})/i.test(href) &&
      !/(?:intent|share|home|explore|search|tos|privacy|hashtag)/i.test(href)
    ) {
      info.socials.twitter = href;
    }

    // GitHub
    if (
      !info.socials.github &&
      /github\.com\/([a-zA-Z0-9_-]+)(?:\/[a-zA-Z0-9_.-]+)?/i.test(href) &&
      !/(?:sponsors|pricing|about|contact|features|join|topics|trending)/i.test(href)
    ) {
      info.socials.github = href;
    }

    // LinkedIn
    if (
      !info.socials.linkedin &&
      /linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/i.test(href) &&
      !/(?:shareArticle|sharing)/i.test(href)
    ) {
      info.socials.linkedin = href;
    }

    // Discord
    if (
      !info.socials.discord &&
      /(?:discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+)/i.test(href)
    ) {
      info.socials.discord = href;
    }

    // YouTube
    if (
      !info.socials.youtube &&
      /youtube\.com\/(?:@|channel\/|c\/)([a-zA-Z0-9_.-]+)/i.test(href)
    ) {
      info.socials.youtube = href;
    }

    // Product Hunt
    if (
      !info.socials.productHunt &&
      /producthunt\.com\/products\/([a-zA-Z0-9_-]+)/i.test(href)
    ) {
      info.socials.productHunt = href;
    }
  }

  return info;
}

export async function processAutofillWithOpenAI(
  pageInfo: ScrapedPageInfo,
  apiKey: string
) {
  const prompt = `You are an expert product marketing analyst and copywriter for TopSAAS (https://topsaas.org), the curated directory of premier SaaS tools, startups, and dev projects.

Your goal is to extract and generate rich, high-converting product listing details from the provided website content.

Website URL: ${pageInfo.url}
Detected Title: ${pageInfo.title}
Detected Description: ${pageInfo.description}
Headings: ${pageInfo.headings.join(' | ')}
Extracted Social Links: ${JSON.stringify(pageInfo.socials)}

Page Content:
${pageInfo.cleanText}

Allowed categories (pick 1 as primary "category", and 1 to 3 best matches for "categories"):
${JSON.stringify(ALLOWED_CATEGORIES)}

Allowed pricingModel (must be exactly one of):
["Free", "Freemium", "Paid", "Open Source"]

Instructions:
1. "name": The clean, official brand or product name (strictly max 60 characters). Do NOT include taglines, domain extensions, or separators like " - The Best Tool".
2. "tagline": A crisp, punchy one-sentence value proposition (strictly max 80 characters). Do not repeat the product name.
3. "description": A structured, compelling overview (max 1500 chars). Use clean HTML formatting: <p> for paragraphs, <strong> for emphasis, and <ul><li> for key features or bullet points. Avoid markdown syntax.
4. "category": Pick the single most accurate category from the allowed list.
5. "categories": Return an array of 1 to 3 categories from the allowed list.
6. "pricingModel": Pick the most likely model ("Free", "Freemium", "Paid", or "Open Source") based on pricing hints (e.g. pricing page, free tier, GitHub repo, open source mentions).
7. "targetAudience": Who is this built for? (e.g. "Software engineers, tech leads, and DevOps teams").
8. "problemItSolves": The core pain point or bottleneck users face before using this.
9. "solution": How this product uniquely solves that problem.
10. "uniqueSellingPoint": The standout advantage or differentiator versus competitors.
11. "twitter": Return the X/Twitter profile link or handle if found or detected, else "".
12. "github": Return the GitHub repo or org link if found or open source, else "".
13. "linkedin": Return the LinkedIn URL if found, else "".
14. "discord": Return the Discord invite link if found, else "".
15. "youtube": Return the YouTube channel link if found, else "".

Return ONLY a valid JSON object matching these fields.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are an accurate, expert SaaS product analyst that outputs valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errMessage = `OpenAI API returned error ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.error?.message) {
        errMessage = parsed.error.message;
      }
    } catch {
      // Keep default error
    }
    throw new Error(errMessage);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Empty response from OpenAI');
  }

  const parsed = JSON.parse(rawContent);

  // Validate and sanitize
  const cleanName = String(parsed.name || pageInfo.title || '').slice(0, 60).trim();
  const cleanTagline = String(parsed.tagline || pageInfo.description || '').slice(0, 80).trim();
  const cleanDescription = String(parsed.description || '').slice(0, 2000).trim();

  // Validate categories
  const rawCategory = String(parsed.category || '');
  const matchedCategory =
    ALLOWED_CATEGORIES.find((c) => c.toLowerCase() === rawCategory.toLowerCase()) ||
    'AI Tools';

  type CategoryItem = (typeof ALLOWED_CATEGORIES)[number];
  let categoriesList: CategoryItem[] = [];
  if (Array.isArray(parsed.categories)) {
    for (const c of parsed.categories) {
      const match = ALLOWED_CATEGORIES.find((ac) => ac.toLowerCase() === String(c).toLowerCase());
      if (match && !categoriesList.includes(match)) {
        categoriesList.push(match);
      }
      if (categoriesList.length >= 3) break;
    }
  }

  if (categoriesList.length === 0) {
    categoriesList = [matchedCategory];
  }

  // Validate pricing model
  const rawPricing = String(parsed.pricingModel || '');
  const matchedPricing =
    ALLOWED_PRICING.find((p) => p.toLowerCase() === rawPricing.toLowerCase()) || 'Freemium';

  return {
    name: cleanName,
    tagline: cleanTagline,
    description: cleanDescription,
    category: matchedCategory,
    categories: categoriesList,
    pricingModel: matchedPricing,
    targetAudience: String(parsed.targetAudience || '').trim(),
    problemItSolves: String(parsed.problemItSolves || '').trim(),
    solution: String(parsed.solution || '').trim(),
    uniqueSellingPoint: String(parsed.uniqueSellingPoint || '').trim(),
    twitter: parsed.twitter || pageInfo.socials.twitter || '',
    github: parsed.github || pageInfo.socials.github || '',
    linkedin: parsed.linkedin || pageInfo.socials.linkedin || '',
    discord: parsed.discord || pageInfo.socials.discord || '',
    youtube: parsed.youtube || pageInfo.socials.youtube || '',
    productHunt: pageInfo.socials.productHunt || '',
    faviconUrl: pageInfo.faviconUrl,
    ogImageUrl: pageInfo.ogImageUrl,
  };
}

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-openai-key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.json({ ok: false, error: 'Method Not Allowed' });
  }

  // Parse input
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  let rawUrl = (body.url || '').trim();

  if (!rawUrl) {
    res.statusCode = 400;
    return res.json({ ok: false, error: 'Missing website URL' });
  }

  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    res.statusCode = 400;
    return res.json({ ok: false, error: 'Invalid URL format' });
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    res.statusCode = 400;
    return res.json({ ok: false, error: 'Private or local IP not allowed' });
  }

  let effectiveApiKey = process.env.OPENAI_API_KEY || '';

  // If not in process.env, check Supabase database app_secrets table securely
  if (!effectiveApiKey) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data } = await supabase
          .from('app_secrets')
          .select('value')
          .eq('key', 'openai_api_key')
          .maybeSingle();

        if (data?.value && data.value.trim().length > 0) {
          effectiveApiKey = data.value.trim();
        }
      } catch (err) {
        console.error('Failed to query Supabase app_secrets:', err);
      }
    }
  }

  if (!effectiveApiKey) {
    res.statusCode = 200;
    return res.json({
      ok: false,
      code: 'NO_API_KEY',
      error:
        'OpenAI API key is not configured in Supabase. Please set OPENAI_API_KEY in Supabase Edge Secrets or in the app_secrets table.',
    });
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
        ok: false,
        error: `Target website returned server error: HTTP ${response.status}`,
      });
    }

    html = await response.text();
  } catch (err: any) {
    return res.json({
      ok: false,
      error: `Could not reach target website: ${err?.message || 'Connection timed out'}`,
    });
  }

  // 2. Extract page metadata
  const pageInfo = extractPageInfo(html, finalUrl);

  // 3. Process with OpenAI
  try {
    const result = await processAutofillWithOpenAI(pageInfo, effectiveApiKey);
    return res.json({
      ok: true,
      data: result,
    });
  } catch (err: any) {
    res.statusCode = 500;
    return res.json({
      ok: false,
      error: `OpenAI auto-fill failed: ${err?.message || 'Unknown error'}`,
    });
  }
}
