/**
 * Helper to get a high-quality, reliable favicon/logo for any website domain.
 */
export function getWebsiteFavicon(urlOrDomain: string, size: number = 128): string {
  if (!urlOrDomain) return '';
  try {
    let domain = urlOrDomain.trim();
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      const parsed = new URL(domain);
      domain = parsed.hostname;
    } else {
      // Remove paths/slashes if any
      domain = domain.split('/')[0];
    }
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${urlOrDomain}&sz=${size}`;
  }
}
