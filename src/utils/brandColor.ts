/**
 * Brand Color Extractor & Palette Resolver
 * Extracts dominant vibrant colors from company logos via Canvas,
 * with deterministic fallback to a curated SaaS brand palette.
 */

// In-memory cache to avoid re-extracting for the same logo URL
const colorCache = new Map<string, string>();

// Curated high-contrast SaaS brand colors suitable for white text & header banners
export const SAAS_BRAND_PALETTE = [
  '#2563eb', // Royal Blue (TopSAAS primary)
  '#5c67f2', // Indigo / Purple (BentoPDF)
  '#4f46e5', // Deep Indigo
  '#7c3aed', // Electric Violet
  '#059669', // Emerald Green
  '#0891b2', // Teal / Cyan
  '#0284c7', // Sky Blue
  '#ea580c', // Tangerine / Orange
  '#e11d48', // Rose / Crimson
  '#9333ea', // Vibrant Purple
  '#0d9488', // Deep Teal
  '#d97706', // Amber Gold
];

// Well-known product brand color mappings
const KNOWN_BRAND_COLORS: Record<string, string> = {
  topsaas: '#2563eb',
  bentopdf: '#5c67f2',
  supabase: '#3ecf8e',
  stripe: '#635bff',
  tailwind: '#06b6d4',
  nextjs: '#111827',
  github: '#24292f',
  google: '#4285f4',
  clerk: '#6c47ff',
  resend: '#18181b',
  posthog: '#f54e00',
  polar: '#0062ff',
  dodo: '#8b5cf6',
  whop: '#ff6243',
};

/**
 * Deterministically pick a brand color for a company based on its name or domain.
 */
export function getDeterministicBrandColor(nameOrDomain?: string): string {
  if (!nameOrDomain) return '#2563eb';
  const clean = nameOrDomain.toLowerCase().replace(/[^a-z0-9]/g, '');

  for (const [key, color] of Object.entries(KNOWN_BRAND_COLORS)) {
    if (clean.includes(key)) return color;
  }

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % SAAS_BRAND_PALETTE.length;
  return SAAS_BRAND_PALETTE[index];
}

/**
 * Dynamically extract the dominant vibrant color from an image URL using an HTML5 Canvas.
 * Resolves to null if no saturated color is found or image cannot be loaded.
 */
export async function extractDominantLogoColor(logoUrl?: string): Promise<string | null> {
  if (!logoUrl || typeof window === 'undefined') return null;

  if (colorCache.has(logoUrl)) {
    return colorCache.get(logoUrl)!;
  }

  const analyzeImage = (img: HTMLImageElement): string | null => {
    try {
      const canvas = document.createElement('canvas');
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;

      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let bestColor: string | null = null;
      let bestScore = -1;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Ignore transparent pixels
        if (a < 128) continue;

        // Calculate HSL lightness and saturation
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;
        const lightness = (max + min) / 2 / 255;

        // Skip near-black, near-white, or neutral greys
        if (lightness < 0.10 || lightness > 0.92) continue;
        if (delta < 20) continue; // very low saturation

        const saturation = delta / (1 - Math.abs(2 * lightness - 1)) / 255;
        if (saturation < 0.15) continue;

        // Score favoring vivid, medium-lightness colors suitable for headers/buttons with white text
        const saturationScore = saturation * 2.2;
        const lightnessPenalty = Math.abs(lightness - 0.48); // ideal lightness ~48%
        const score = saturationScore - lightnessPenalty;

        if (score > bestScore) {
          bestScore = score;
          // Ensure color is dark enough for white text
          let targetR = r;
          let targetG = g;
          let targetB = b;
          if (lightness > 0.65) {
            const factor = 0.55 / lightness;
            targetR = Math.round(r * factor);
            targetG = Math.round(g * factor);
            targetB = Math.round(b * factor);
          }
          bestColor = `#${((1 << 24) + (targetR << 16) + (targetG << 8) + targetB).toString(16).slice(1)}`;
        }
      }

      return bestColor;
    } catch {
      return null;
    }
  };

  const tryLoadAndExtract = (src: string): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        const timer = setTimeout(() => {
          resolve(null);
        }, 3000);

        img.onload = () => {
          clearTimeout(timer);
          const color = analyzeImage(img);
          resolve(color);
        };

        img.onerror = () => {
          clearTimeout(timer);
          resolve(null);
        };

        img.src = src;
      } catch {
        resolve(null);
      }
    });
  };

  // Build candidate URLs: for remote URLs without CORS (e.g. google s2 favicons), weserv ensures CORS access
  const candidates: string[] = [];
  if (logoUrl.startsWith('data:') || logoUrl.startsWith('blob:')) {
    candidates.push(logoUrl);
  } else {
    // 1. Try via CORS proxy so canvas getImageData is never blocked by cross-origin taint
    candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(logoUrl)}&w=64&h=64`);

    // 2. If it's a domain or contains a domain query param, also try icon.horse (which has native CORS enabled)
    try {
      let domain = '';
      if (logoUrl.includes('google.com/s2/favicons')) {
        const match = logoUrl.match(/[?&]domain=([^&]+)/);
        if (match && match[1]) domain = match[1];
      } else if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        domain = new URL(logoUrl).hostname;
      }
      if (domain && domain.includes('.')) {
        candidates.push(`https://icon.horse/icon/${domain}`);
      }
    } catch {}

    // 3. Direct url as fallback
    candidates.push(logoUrl);
  }

  for (const src of candidates) {
    const extracted = await tryLoadAndExtract(src);
    if (extracted) {
      colorCache.set(logoUrl, extracted);
      return extracted;
    }
  }

  return null;
}
