import { createClient } from '@supabase/supabase-js';

// Safe URL validator to prevent open-redirect vulnerabilities
function sanitizeTargetUrl(urlStr: string): URL | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  let trimmed = urlStr.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // CORS & method check
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // Extract params
  const rawUrl = (req.query?.url as string) || '';
  const slug = (req.query?.slug as string) || '';
  const productId = (req.query?.id as string) || (req.query?.productId as string) || '';
  const campaign = (req.query?.campaign as string) || 'topsaas_listing';
  const refTag = (req.query?.ref as string) || 'topsaas';

  let destinationUrl: URL | null = null;
  let resolvedProductId = productId;

  // 1. Direct URL provided
  if (rawUrl) {
    destinationUrl = sanitizeTargetUrl(rawUrl);
  }

  // 2. Slug or ID provided without direct URL - fetch from Supabase
  if (!destinationUrl && (slug || productId)) {
    const targetIdentifier = slug || productId;
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      '';
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      '';

    if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const altId = targetIdentifier.startsWith('prod-')
          ? targetIdentifier.replace(/^prod-/, '')
          : `prod-${targetIdentifier}`;

        const { data } = await supabase
          .from('products')
          .select('id, url, name')
          .or(`id.eq.${targetIdentifier},id.eq.${altId},name.ilike.${targetIdentifier}`)
          .maybeSingle();

        if (data?.url) {
          destinationUrl = sanitizeTargetUrl(data.url);
          if (data.id) resolvedProductId = data.id;
        }
      } catch (err) {
        console.error('Error resolving product in /r:', err);
      }
    }
  }

  // Fallback to homepage if no valid destination could be found
  if (!destinationUrl) {
    res.setHeader('Location', 'https://www.topsaas.space/');
    res.statusCode = 302;
    return res.end();
  }

  // Ensure standard referral & UTM parameters
  if (!destinationUrl.searchParams.has('ref')) {
    destinationUrl.searchParams.set('ref', refTag);
  }
  if (!destinationUrl.searchParams.has('utm_source')) {
    destinationUrl.searchParams.set('utm_source', 'topsaas');
  }
  if (!destinationUrl.searchParams.has('utm_medium')) {
    destinationUrl.searchParams.set('utm_medium', 'directory');
  }
  if (!destinationUrl.searchParams.has('utm_campaign')) {
    destinationUrl.searchParams.set('utm_campaign', campaign);
  }

  // Non-blocking background click count increment in Supabase
  if (resolvedProductId) {
    try {
      const supabaseUrl =
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        '';
      const supabaseKey =
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        '';

      if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
        const supabase = createClient(supabaseUrl, supabaseKey);
        supabase
          .rpc('increment_product_clicks', { p_product_id: resolvedProductId })
          .then(
            () => {},
            () => {}
          );
      }
    } catch {
      // Non-blocking — never delay redirect
    }
  }

  // Send Product-Hunt style HTTP 302 Redirect
  res.setHeader('Location', destinationUrl.toString());
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.statusCode = 302;
  return res.end();
}

