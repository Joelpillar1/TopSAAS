interface WebsiteMetadata {
  title: string;
  description: string;
  favicon: string;
}

/**
 * Fetches metadata (title, description, favicon) from a website URL.
 * Uses allorigins CORS proxy to bypass browser restrictions.
 */
export async function fetchWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  const result: WebsiteMetadata = { title: '', description: '', favicon: '' };

  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Fetch page HTML via CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`;
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });

    if (!response.ok) return result;

    const html = await response.text();

    // Extract title from <title> or og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    result.title = (ogTitleMatch?.[1] || titleTagMatch?.[1] || '').trim();

    // Extract description from og:description or meta description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);

    result.description = (ogDescMatch?.[1] || metaDescMatch?.[1] || '').trim();

    // Extract favicon
    const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
      || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i);

    if (faviconMatch?.[1]) {
      try {
        result.favicon = new URL(faviconMatch[1], normalizedUrl).href;
      } catch {
        result.favicon = faviconMatch[1];
      }
    }
  } catch {
    // Silently fail — metadata fetch is best-effort
  }

  return result;
}
