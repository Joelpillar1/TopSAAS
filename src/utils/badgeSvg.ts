import { Product } from '../types';

export type BadgeStyle = 'featured' | 'classic' | 'rank';
export type BadgeTheme = 'light' | 'dark';
export type BadgeFormat = 'html' | 'markdown' | 'image_url';

interface BadgeOptions {
  style?: BadgeStyle;
  theme?: BadgeTheme;
  siteUrl?: string;
}

/**
 * Generate a standalone, pixel-crisp SVG badge for a product.
 * Supports 3 styles: 'featured' (with upvote button), 'classic' (clean DanielLaunches style), and 'rank' (leaderboard rank).
 * Dimensions: 250 x 54 px (standard 54px badge height).
 */
export function generateBadgeSvg(product: Product, options: BadgeOptions = {}): string {
  const { style = 'featured', theme = 'light' } = options;
  const rank = product.rank || 1;
  const isDark = theme === 'dark';

  const width = 250;
  const height = 54;
  const rx = 14;

  // App brand colors (mint + slate ink)
  const bgColor = isDark ? '#161616' : '#ffffff';
  const borderColor = isDark ? '#333338' : '#e2e8f0';
  const brandTextColor = isDark ? '#ffffff' : '#161616';
  
  // Brand mint shades
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

  // Subtitle text and color based on style
  let subtitle = 'FEATURED ON';
  const subtextColor = isDark ? mint400 : mint700;

  if (style === 'rank') {
    subtitle = `RANKED #${rank} ON`;
  }

  // Right-side dynamic visual block
  let rightContent = '';

  if (style === 'rank') {
    // VcodingList style: rounded button with rank & mint chevron
    rightContent = `
      <!-- Right: Rank Indicator Button -->
      <g transform="translate(198, 10)">
        <rect width="38" height="34" rx="8" fill="${mintLightBg}" stroke="${mintPrimary}" stroke-width="1.5" />
        <path d="M 13 18 L 19 12.5 L 25 18" fill="none" stroke="${mintPrimary}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
        <text x="19" y="30" fill="${mintPrimary}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10" font-weight="900" text-anchor="middle">#${rank}</text>
      </g>
    `;
  } else if (style === 'featured') {
    // VcodingList style: clean upvote square button with mint chevron
    rightContent = `
      <!-- Right: Upvote Chevron Button (VcodingList style) -->
      <g transform="translate(202, 10)">
        <rect width="34" height="34" rx="8" fill="${mintLightBg}" stroke="${mintPrimary}" stroke-width="1.5" />
        <path d="M 12 20.5 L 17 14.5 L 22 20.5" fill="none" stroke="${mintPrimary}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    `;
  } else {
    // style === 'classic' (DanielLaunches style):
    // Spacious, no right button, clean focus on logo and brand
    rightContent = '';
  }

  // Text positioning
  const textX = 58;
  const brandFontSize = style === 'classic' ? '21' : '20';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Featured on TopSAAS">
  <defs>
    <!-- Outer Card Subtle Shadow -->
    <filter id="badge-shadow-${style}-${theme}" x="-5%" y="-10%" width="110%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${shadowColor}" />
    </filter>

    <!-- Mint Gradient for Logo -->
    <linearGradient id="mint-grad-${style}-${theme}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${mintGradStart}" />
      <stop offset="100%" stop-color="${mintGradEnd}" />
    </linearGradient>
  </defs>

  <!-- Background Pill Container -->
  <rect x="0.75" y="0.75" width="${width - 1.5}" height="${height - 1.5}" rx="${rx}" fill="${bgColor}" stroke="${borderColor}" stroke-width="1.5" filter="url(#badge-shadow-${style}-${theme})" />

  <!-- Left: TopSAAS Emblem (DanielLaunches double-ring + Lucide Trophy) -->
  <g transform="translate(13, 9)">
    <!-- Outer accent ring -->
    <circle cx="18" cy="18" r="17.25" fill="none" stroke="${mintRingColor}" stroke-width="1.5" />
    <!-- Inner solid mint circle -->
    <circle cx="18" cy="18" r="14.5" fill="url(#mint-grad-${style}-${theme})" />
    
    <!-- TopSAAS Trophy Icon (Lucide trophy matching app Header) -->
    <g transform="translate(10, 10) scale(0.67)">
      <!-- Left Handle -->
      <path d="M 6 9 H 4.5 C 3.1 9 2 7.9 2 6.5 C 2 5.1 3.1 4 4.5 4 H 6" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Right Handle -->
      <path d="M 18 9 H 19.5 C 20.9 9 22 7.9 22 6.5 C 22 5.1 20.9 4 19.5 4 H 18" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Base Plate -->
      <path d="M 4 22 H 20" stroke="#161616" stroke-width="2.4" stroke-linecap="round" />
      <!-- Stem Pedestal -->
      <path d="M 10 14.66 V 17 C 10 17.55 9.53 17.98 9.03 18.21 C 7.85 18.75 7 20.24 7 22" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 14 14.66 V 17 C 14 17.55 14.47 17.98 14.97 18.21 C 16.15 18.75 17 20.24 17 22" fill="none" stroke="#161616" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
      <!-- Trophy Cup Body -->
      <path d="M 18 2 H 6 V 9 C 6 12.3 8.7 15 12 15 C 15.3 15 18 12.3 18 9 V 2 Z" fill="#161616" stroke="#161616" stroke-width="1.6" stroke-linejoin="round" />
      <!-- Mint Shine Highlight -->
      <circle cx="12" cy="7" r="1.5" fill="${mintGradStart}" />
    </g>
  </g>

  <!-- Middle: Text Block (FEATURED ON / TopSAAS) -->
  <g transform="translate(${textX}, 0)">
    <!-- Subtitle (FEATURED ON / FIND US ON / RANKED #1 ON) -->
    <text x="0" y="21" fill="${subtextColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="8.5" font-weight="800" letter-spacing="1.8px">${subtitle}</text>

    <!-- Brand Name (TopSAAS with mint accent) -->
    <text x="0" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="${brandFontSize}" font-weight="900" letter-spacing="-0.6px">
      <tspan fill="${brandTextColor}">Top</tspan><tspan fill="${mintPrimary}">SAAS</tspan>
    </text>
  </g>

  ${rightContent}
</svg>`.trim();
}

/**
 * Return an SVG as a data URI safe for direct inclusion in <img src="..." />
 */
export function generateBadgeDataUrl(product: Product, options: BadgeOptions = {}): string {
  const svg = generateBadgeSvg(product, options);
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml;utf8,${encoded}`;
}

/**
 * Get canonical public product URL on TopSAAS
 */
export function getProductTopSaasUrl(product: Product, baseOrigin?: string): string {
  const origin = baseOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://topsaas.org');
  return `${origin}/product/${encodeURIComponent(product.id)}`;
}

/**
 * Generate embed snippet for founders to copy-paste
 */
export function generateBadgeSnippet(
  product: Product,
  style: BadgeStyle,
  theme: BadgeTheme,
  format: BadgeFormat,
  baseOrigin?: string
): string {
  const productUrl = getProductTopSaasUrl(product, baseOrigin);
  const origin = baseOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://topsaas.org');
  const badgeImageUrl = `${origin}/badge/${encodeURIComponent(product.id)}?style=${style}&theme=${theme}`;
  const altText = `${product.name} - Featured on TopSAAS`;

  if (format === 'markdown') {
    return `[![${altText}](${badgeImageUrl})](${productUrl})`;
  }

  if (format === 'html') {
    return `<a href="${productUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeImageUrl}" alt="${altText}" width="250" height="54" />
</a>`;
  }

  // Raw Image / SVG URL
  return badgeImageUrl;
}
