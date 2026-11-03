// Swaps the document head for a client-side route and returns a restore
// function (call it from a useEffect cleanup so navigating away never leaks
// stale tags). Mirrors the pattern used by RepoDetailPage.
export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  /** JSON-LD object serialized into a <script> with the given id */
  jsonLd?: unknown;
  jsonLdId?: string;
}

export function applyPageSeo(seo: PageSeo): () => void {
  const SITE = 'https://www.topsaas.space';
  const canonical = seo.canonical.startsWith('http')
    ? seo.canonical
    : `${SITE}${seo.canonical.startsWith('/') ? '' : '/'}${seo.canonical}`;

  const prevTitle = document.title;
  document.title = seo.title;

  type Patch = { el: Element; attr: string; prev: string | null };
  const patches: Patch[] = [];
  const setHead = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector);
    if (!el) return;
    patches.push({ el, attr, prev: el.getAttribute(attr) });
    el.setAttribute(attr, value);
  };

  setHead('meta[name="description"]', 'content', seo.description);
  setHead('link[rel="canonical"]', 'href', canonical);
  setHead('meta[property="og:url"]', 'content', canonical);
  setHead('meta[property="og:title"]', 'content', seo.title);
  setHead('meta[property="og:description"]', 'content', seo.description);
  setHead('meta[name="twitter:url"]', 'content', canonical);
  setHead('meta[name="twitter:title"]', 'content', seo.title);
  setHead('meta[name="twitter:description"]', 'content', seo.description);

  let ldEl: HTMLScriptElement | null = null;
  if (seo.jsonLd !== undefined) {
    ldEl = document.createElement('script');
    ldEl.type = 'application/ld+json';
    ldEl.id = seo.jsonLdId || 'page-jsonld';
    ldEl.textContent = JSON.stringify(seo.jsonLd);
    document.head.appendChild(ldEl);
  }

  return () => {
    document.title = prevTitle;
    for (const p of patches) {
      if (p.prev === null) p.el.removeAttribute(p.attr);
      else p.el.setAttribute(p.attr, p.prev);
    }
    ldEl?.remove();
  };
}
