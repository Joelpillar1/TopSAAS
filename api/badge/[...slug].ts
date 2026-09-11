import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

type VercelRequest = IncomingMessage & {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VercelResponse = ServerResponse & {
  status: (code: number) => VercelResponse;
  send: (body: unknown) => VercelResponse;
};

// ---------------------------------------------------------------------------
// Inline badge-SVG generation (no React / Vite dependencies)
// ---------------------------------------------------------------------------

type BadgeStyle = 'featured' | 'classic' | 'rank';
type BadgeTheme = 'light' | 'dark';

interface BadgeOptions {
  style?: BadgeStyle;
  theme?: BadgeTheme;
}

interface ProductStub {
  id: string;
  name: string;
  tagline: string;
  url: string;
  category: string;
  rank: number;
  upvotes: number;
  clicks: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Standalone SVG badge generator — copy of src/utils/badgeSvg.ts so the API
 * route has zero client-side dependencies.
 */
function generateBadgeSvg(product: ProductStub, options: BadgeOptions = {}): string {
  const { style = 'featured', theme = 'light' } = options;
  const rank = product.rank || 1;
  const isDark = theme === 'dark';

  const width = 250;
  const height = 54;
  const rx = 14;

  const bgColor = isDark ? '#161616' : '#ffffff';
  const borderColor = isDark ? '#333338' : '#e2e8f0';
  const brandTextColor = isDark ? '#ffffff' : '#161616';

  const mint500 = '#66cc88';
  const mint400 = '#79d79f';
  const mint600 = '#47b46e';
  const mint700 = '#369359';

  const mintPrimary = isDark ? mint500 : mint600;
  const mintRingColor = isDark ? mint400 : mint500;
  const mintGradStart = isDark ? '#79d79f' : '#66cc88';
  const mintGradEnd = isDark ? '#47b46e' : '#369359';
  const mintLightBg = isDark ? 'rgba(102, 204, 136, 0.16)' : '#effbf3';
  const shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(15, 23, 42, 0.06)';

  let subtitle = 'FEATURED ON';
  const subtextColor = isDark ? mint400 : mint700;
  if (style === 'rank') subtitle = `RANKED #${rank} ON`;

  let rightContent = '';

  if (style === 'rank') {
    rightContent = `
      <g transform="translate(198, 10)">
        <rect width="38" height="34" rx="8" fill="${mintLightBg}" stroke="${mintPrimary}" stroke-width="1.5" />
        <path d="M 13 18 L 19 12.5 L 25 18" fill="none" stroke="${mintPrimary}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <text x="19" y="30" fill="${mintPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10" font-weight="900" text-anchor="middle">#${rank}</text>
      </g>`;
  } else if (style === 'featured') {
    rightContent = `
      <g transform="translate(202, 10)">
        <rect width="34" height="34" rx="8" fill="${mintLightBg}" stroke="${mintPrimary}" stroke-width="1.5" />
        <path d="M 12 20.5 L 17 14.5 L 22 20.5" fill="none" stroke="${mintPrimary}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      </g>`;
  }

  const textX = 58;
  const brandFontSize = style === 'classic' ? '21' : '20';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Featured on TopSAAS">
  <defs>
    <filter id="badge-shadow-${style}-${theme}" x="-5%" y="-10%" width="110%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${shadowColor}" />
    </filter>
    <linearGradient id="mint-grad-${style}-${theme}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${mintGradStart}" />
      <stop offset="100%" stop-color="${mintGradEnd}" />
    </linearGradient>
  </defs>
  <rect x="0.75" y="0.75" width="${width - 1.5}" height="${height - 1.5}" rx="${rx}" fill="${bgColor}" stroke="${borderColor}" stroke-width="1.5" filter="url(#badge-shadow-${style}-${theme})" />
  <g transform="translate(13, 9)">
    <circle cx="18" cy="18" r="17.25" fill="none" stroke="${mintRingColor}" stroke-width="1.5" />
    <circle cx="18" cy="18" r="14.5" fill="url(#mint-grad-${style}-${theme})" />
    <g transform="translate(10, 10) scale(0.67)">
      <path d="M 6 9 H 4.5 C 3.1 9 2 7.9 2 6.5 C 2 5.1 3.1 4 4.5 4 H 6" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 18 9 H 19.5 C 20.9 9 22 7.9 22 6.5 C 22 5.1 20.9 4 19.5 4 H 18" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 4 22 H 20" stroke="#161616" stroke-width="2.4" stroke-linecap="round" />
      <path d="M 10 14.66 V 17 C 10 17.55 9.53 17.98 9.03 18.21 C 7.85 18.75 7 20.24 7 22" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 14 14.66 V 17 C 14 17.55 14.47 17.98 14.97 18.21 C 16.15 18.75 17 20.24 17 22" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 18 2 H 6 V 9 C 6 12.3 8.7 15 12 15 C 15.3 15 18 12.3 18 9 V 2 Z" fill="#161616" stroke="#161616" stroke-width="1.6" stroke-linejoin="round" />
      <circle cx="12" cy="7" r="1.5" fill="${mintGradStart}" />
    </g>
  </g>
  <g transform="translate(${textX}, 0)">
    <text x="0" y="21" fill="${subtextColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="8.5" font-weight="800" letter-spacing="1.8px">${subtitle}</text>
    <text x="0" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${brandFontSize}" font-weight="900" letter-spacing="-0.6px">
      <tspan fill="${brandTextColor}">Top</tspan><tspan fill="${mintPrimary}">SAAS</tspan>
    </text>
  </g>
  ${rightContent}
</svg>`.trim();
}

// ---------------------------------------------------------------------------
// Vercel Serverless Handler
// ---------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — allow any website to embed the badge image
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract product id from the path: /badge/<id> or /api/badge/<id>
  // slug = ['<id>'] from [...slug]
  const slug = (req.query.slug as string[] | string) || [];
  const parts = Array.isArray(slug) ? slug : slug.split('/');
  const productId = decodeURIComponent(parts.filter(Boolean).join('/'));

  if (!productId) {
    return res.status(400).setHeader('Content-Type', 'image/svg+xml').send(
      generateBadgeSvg(
        { id: 'unknown', name: 'TopSAAS', tagline: '', url: 'https://topsaas.space', category: '', rank: 1, upvotes: 0, clicks: 0, createdAt: Date.now(), updatedAt: Date.now() },
        { style: 'featured', theme: 'light' }
      )
    );
  }

  // Parse query params
  const style = ((req.query.style as string) || 'featured') as BadgeStyle;
  const theme = ((req.query.theme as string) || 'light') as BadgeTheme;

  // Try to fetch product data from Supabase for accurate rank
  let product: ProductStub = {
    id: productId,
    name: 'TopSAAS Product',
    tagline: 'Discover top SaaS tools',
    url: 'https://topsaas.space',
    category: 'Developer Tools',
    rank: 1,
    upvotes: 0,
    clicks: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const altId = productId.startsWith('prod-') ? productId.replace(/^prod-/, '') : `prod-${productId}`;

      const { data } = await supabase
        .from('products')
        .select('id, name, tagline, url, category, rank, upvotes, clicks, created_at, updated_at')
        .or(`id.eq.${productId},id.eq.${altId}`)
        .single();

      if (data) {
        product = {
          id: data.id,
          name: data.name || 'TopSAAS Product',
          tagline: data.tagline || '',
          url: data.url || 'https://topsaas.space',
          category: data.category || 'Developer Tools',
          rank: data.rank || 1,
          upvotes: data.upvotes || 0,
          clicks: data.clicks || 0,
          createdAt: data.created_at || Date.now(),
          updatedAt: data.updated_at || Date.now(),
        };
      }
    } catch {
      // Fall through with default product — badge still renders
    }
  }

  const svg = generateBadgeSvg(product, { style, theme });

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  return res.status(200).send(svg);
}
