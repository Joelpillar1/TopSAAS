import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { CURATED_REPOS } from '../src/data/curatedRepos';
import type { CuratedRepo, RepoCategory } from '../src/data/curatedRepos';
import { plainCopy } from '../src/utils/plainCopy';
import {
  SITE_URL,
  buildRepoEditorial,
  detectSelfHosted,
  repoCanonicalUrl,
  repoSeoDescription,
  repoSeoTitle,
} from '../src/utils/repoSeo';
import {
  DIRECTORIES,
  DIRECTORY_HUBS,
  DIRECTORY_KIND_LABELS,
  DIRECTORY_LINK_LABELS,
  DIRECTORY_PRICE_LABELS,
  getDirectoryStats,
  getRelatedDirectories,
  type DirectoryEntry,
  type DirectoryHub,
} from '../src/data/directories';
import {
  DIRECTORY_FAQS,
  directoryDetailJsonLd,
  directoryDetailSeo,
  directoryFaqs,
  directoryListJsonLd,
  directoryListSeo,
} from '../src/utils/directorySeo';
import { BUILD_GUIDES, type BuildGuide } from '../src/data/buildGuides';
import {
  MRR_FAQS,
  MRR_HOW_TO_STEPS,
  MRR_KEY_TAKEAWAYS,
  PRICING_FAQS,
  SUBMIT_STEPS,
} from '../src/data/corePageContent';
import { INITIAL_PRODUCTS } from '../src/data/initialProducts';
import { BLOG_POSTS, type BlogPost } from '../src/data/blogPosts';
import { LEGAL_EFFECTIVE, PRIVACY_SECTIONS, TERMS_SECTIONS, type LegalSection } from '../src/data/legalContent';
import { getProductSlug } from '../src/utils/slug';
import {
  blogPostSeo,
  blogSeo,
  guidesSeo,
  guideSeo,
  homeSeo,
  mrrSeo,
  pricingSeo,
  privacySeo,
  productSeo,
  submitSeo,
  termsSeo,
  trendingSeo,
} from '../src/utils/coreSeo';
import type { Product } from '../src/types';

/**
 * Static prerender for repo pages, the /ideas index, and the product directory.
 *
 * The app is a client-rendered SPA, so every /repo/:owner/:name and
 * /product-directory/:slug request used to receive the homepage shell: homepage
 * title, homepage canonical, no H1. Search crawlers that do not execute JS
 * treated thousands of URLs as duplicates of "/". This build step writes a real
 * HTML file per page with a unique title, description, H1, self-canonical, OG
 * tags, structured data and crawlable internal links. React still boots on top
 * and replaces the static markup, so the interactive page is unchanged.
 */

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeJson = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, '\\u003c');

/** Curated data can list the same repo twice; one page per URL is enough. */
const uniqueRepos: CuratedRepo[] = (() => {
  const seen = new Set<string>();
  const out: CuratedRepo[] = [];
  for (const repo of CURATED_REPOS) {
    if (seen.has(repo.full_name)) continue;
    seen.add(repo.full_name);
    out.push(repo);
  }
  return out;
})();

const reposByCategory = new Map<RepoCategory, CuratedRepo[]>();
for (const repo of uniqueRepos) {
  const bucket = reposByCategory.get(repo.category);
  if (bucket) bucket.push(repo);
  else reposByCategory.set(repo.category, [repo]);
}
for (const bucket of reposByCategory.values()) {
  bucket.sort((a, b) => b.stargazers_count - a.stargazers_count);
}

const topRepos = [...uniqueRepos].sort((a, b) => b.stargazers_count - a.stargazers_count);

const relatedRepos = (repo: CuratedRepo): CuratedRepo[] => {
  const peers = reposByCategory.get(repo.category) ?? [];
  const picked = peers.filter((r) => r.full_name !== repo.full_name).slice(0, 4);
  const seen = new Set(picked.map((r) => r.full_name));
  for (const candidate of topRepos) {
    if (picked.length >= 4) break;
    if (candidate.full_name === repo.full_name || seen.has(candidate.full_name)) continue;
    seen.add(candidate.full_name);
    picked.push(candidate);
  }
  return picked;
};

const pageStyle =
  "max-width:52rem;margin:0 auto;padding:2rem 1.25rem 3rem;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;color:#171717;line-height:1.65;";
const linkStyle = 'color:#047857;text-decoration:underline;';
const mutedStyle = 'color:#737373;font-size:.875rem;';

/** Static footer for crawlers and no-JS visitors; React renders the full footer. */
const staticFooter = `
        <footer style="margin-top:2.5rem;border-top:1px solid #e5e5e5;padding-top:1.25rem;${mutedStyle}">
          <p style="margin:0 0 .5rem">TopSAAS is a curated directory of modern SaaS products, AI tools and open-source projects.</p>
          <nav aria-label="Footer">
            <a href="/" style="${linkStyle}">Directory</a> ·
            <a href="/product-directory" style="${linkStyle}">Product Directory</a> ·
            <a href="/ideas" style="${linkStyle}">SaaS Ideas</a> ·
            <a href="/trending" style="${linkStyle}">Trending</a> ·
            <a href="/guides" style="${linkStyle}">Build Guides</a> ·
            <a href="/blog" style="${linkStyle}">Blog</a> ·
            <a href="/mrr-calculator" style="${linkStyle}">MRR Calculator</a> ·
            <a href="/submit" style="${linkStyle}">Submit</a> ·
            <a href="/pricing" style="${linkStyle}">Pricing</a> ·
            <a href="/privacy" style="${linkStyle}">Privacy</a> ·
            <a href="/terms" style="${linkStyle}">Terms</a>
          </nav>
        </footer>`;

const buildRepoBody = (repo: CuratedRepo): string => {
  const peers = reposByCategory.get(repo.category) ?? [];
  const rank = Math.max(1, peers.findIndex((r) => r.full_name === repo.full_name) + 1);
  const selfHosted = detectSelfHosted([], repo.description);
  const editorial = buildRepoEditorial(
    repo,
    {},
    {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      rank,
      peerCount: peers.length,
      selfHosted,
    }
  );

  const tagline = plainCopy(repo.description || '');
  const related = relatedRepos(repo);

  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <a href="/ideas" style="${linkStyle}">SaaS Ideas</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(repo.name)}</span>
        </nav>
        <main>
          <h1 style="font-size:2rem;line-height:1.15;margin:0 0 .25rem;letter-spacing:-.02em">${escapeHtml(repo.name)}</h1>
          <p style="${mutedStyle}margin:0 0 1rem">${escapeHtml(repo.full_name)}</p>
          ${tagline ? `<p style="font-size:1.0625rem;font-weight:500;margin:0 0 1.25rem">${escapeHtml(tagline)}</p>` : ''}
          <p style="margin:0 0 1rem">${escapeHtml(editorial.lead)}</p>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Why teams pick ${escapeHtml(repo.name)}</h2>
          <p style="margin:0 0 1rem">${escapeHtml(editorial.core)}</p>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${editorial.capabilities
  .map((c) => `            <li><strong>${escapeHtml(c.title)}</strong> ${escapeHtml(c.body)}</li>`)
  .join('\n')}
          </ul>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Key facts</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
            <li>Category: <a href="/ideas" style="${linkStyle}">${escapeHtml(repo.category)}</a></li>
            <li>Owner: ${escapeHtml(repo.owner.login)}</li>
            <li>Stars: ${repo.stargazers_count.toLocaleString('en-US')}</li>
            <li>Forks: ${repo.forks_count.toLocaleString('en-US')}</li>
            ${repo.language ? `<li>Main language: ${escapeHtml(repo.language)}</li>` : ''}
            <li>Repository: <a href="${escapeHtml(repo.html_url)}" rel="noopener" style="${linkStyle}">github.com/${escapeHtml(repo.full_name)}</a></li>
          </ul>
          <p style="margin:0 0 1rem">${escapeHtml(editorial.closing)}</p>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Related ${escapeHtml(repo.category)} projects</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${related
  .map(
    (r) =>
      `            <li><a href="/repo/${escapeHtml(r.full_name)}" style="${linkStyle}">${escapeHtml(r.name)}</a>: ${escapeHtml(plainCopy(r.description || ''))}</li>`
  )
  .join('\n')}
          </ul>
          <p style="margin:1.5rem 0 0">Browse the full <a href="/ideas" style="${linkStyle}">open-source SaaS ideas</a> list, or explore <a href="/product-directory" style="${linkStyle}">the product directory</a> for launched SaaS tools.</p>
        </main>
${staticFooter}
      </div>
    `;
};

const buildRepoJsonLd = (repo: CuratedRepo): string => {
  const canonical = repoCanonicalUrl(repo.full_name);
  return escapeJson({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'TopSAAS',
        url: `${SITE_URL}/`,
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'TopSAAS',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo/TopSAAS%20-%20blue.png`,
      },
      {
        '@type': 'SoftwareSourceCode',
        name: repo.name,
        description: plainCopy(repo.description || `${repo.full_name} on GitHub`),
        url: canonical,
        codeRepository: repo.html_url,
        author: { '@type': 'Organization', name: repo.owner.login },
        keywords: repo.category,
        ...(repo.language ? { programmingLanguage: repo.language } : {}),
        interactionStatistic: {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: repo.stargazers_count,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Directory', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'SaaS Ideas', item: `${SITE_URL}/ideas` },
          { '@type': 'ListItem', position: 3, name: repo.name, item: canonical },
        ],
      },
    ],
  });
};

const buildIdeasBody = (): string => {
  const total = uniqueRepos.length;
  const categories = [...reposByCategory.entries()];
  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>SaaS Ideas</span>
        </nav>
        <main>
          <h1 style="font-size:2rem;line-height:1.15;margin:0 0 .5rem;letter-spacing:-.02em">SaaS Ideas: ${total.toLocaleString('en-US')} open-source projects to build on</h1>
          <p style="margin:0 0 1rem">Every project below is a repository you can clone today: SaaS starters, auth, billing, analytics, AI plumbing and the rest of the stack a modern product needs. Each entry links to a detail page with stars, forks, language, related projects and notes on what it is good for.</p>
          <p style="margin:0 0 1.5rem">Prefer finished products? Browse <a href="/product-directory" style="${linkStyle}">the product directory</a> instead.</p>
${categories
  .map(
    ([category, repos]) => `          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">${escapeHtml(category)} (${repos.length.toLocaleString('en-US')})</h2>
          <ul style="margin:0;padding-left:1.25rem">
${repos
  .map(
    (r) =>
      `            <li><a href="/repo/${escapeHtml(r.full_name)}" style="${linkStyle}">${escapeHtml(r.name)}</a></li>`
  )
  .join('\n')}
          </ul>`
  )
  .join('\n')}
        </main>
${staticFooter}
      </div>
    `;
};

/* ───────────────────────── product directory ───────────────────────── */

const directoryHubLinks = (current: DirectoryHub | null): string =>
  `<p style="margin:0 0 1rem">${DIRECTORY_HUBS.map((hub) =>
    hub.slug === current?.slug
      ? `<span style="font-weight:600">${escapeHtml(hub.label)}</span>`
      : `<a href="/product-directory/${hub.slug}" style="${linkStyle}">${escapeHtml(hub.label)}</a>`
  ).join(' · ')}</p>`;

const directoryRow = (entry: DirectoryEntry): string =>
  `            <li><a href="/product-directory/${escapeHtml(entry.slug)}" style="${linkStyle}">${escapeHtml(entry.name)}</a>: ${escapeHtml(plainCopy(entry.description))} (DR ${entry.dr}, ${escapeHtml(DIRECTORY_PRICE_LABELS[entry.price].toLowerCase())}, ${escapeHtml(DIRECTORY_LINK_LABELS[entry.link].toLowerCase())}, ${escapeHtml(DIRECTORY_KIND_LABELS[entry.kind].toLowerCase())})</li>`;

const buildDirectoryListBody = (hub: DirectoryHub | null): string => {
  const directories = hub ? DIRECTORIES.filter(hub.filter) : DIRECTORIES;
  const stats = getDirectoryStats(directories);
  const heading = hub ? hub.title.replace(' (2026)', '') : `${DIRECTORIES.length} product directories`;
  const intro = hub
    ? `${hub.description} We track ${directories.length} directories in this group, with Domain Rating, price, link type and submission steps for each one.`
    : `A ranked list of ${DIRECTORIES.length} SaaS directories and launch platforms. Each entry shows Ahrefs Domain Rating, price, link type and a step-by-step submission guide, so you can decide where a listing is worth your time.`;

  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/product-directory" style="${linkStyle}">Product Directory</a>
          ${hub ? `<span aria-hidden="true">/</span><span>${escapeHtml(hub.label)}</span>` : ''}
        </nav>
        <main>
          <h1 style="font-size:2rem;line-height:1.15;margin:0 0 .5rem;letter-spacing:-.02em">${escapeHtml(heading)} ranked by Domain Rating</h1>
          <p style="margin:0 0 1rem">${escapeHtml(intro)}</p>
          <p style="margin:0 0 1rem">${stats.total.toLocaleString('en-US')} directories, ${stats.free} free, ${stats.freeToStart} free to start, ${stats.dofollow} dofollow, median DR ${stats.medianDr}. Last reviewed November 12, 2026.</p>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Browse by type</h2>
          ${directoryHubLinks(hub)}
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">All ${directories.length.toLocaleString('en-US')} directories</h2>
          <ul style="margin:0;padding-left:1.25rem">
${directories.map(directoryRow).join('\n')}
          </ul>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Directory submission FAQ</h2>
          <dl style="margin:0">
${DIRECTORY_FAQS.map(
  (faq) =>
    `            <dt style="font-weight:600;margin:.75rem 0 .25rem">${escapeHtml(faq.q)}</dt>\n            <dd style="margin:0 0 .5rem">${escapeHtml(faq.a)}</dd>`
).join('\n')}
          </dl>
        </main>
${staticFooter}
      </div>
    `;
};

const buildDirectoryDetailBody = (entry: DirectoryEntry): string => {
  const related = getRelatedDirectories(entry, 6);
  const faqs = directoryFaqs(entry);
  const kindHub = DIRECTORY_HUBS.find(
    (hub) => hub.slug === entry.kind || (entry.kind === 'launch' && hub.slug === 'launch-platforms')
  );
  const siteLabel = entry.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Home</a>
          <span aria-hidden="true">/</span>
          <a href="/product-directory" style="${linkStyle}">Product Directory</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(entry.name)}</span>
        </nav>
        <main>
          <h1 style="font-size:2rem;line-height:1.15;margin:0 0 .5rem;letter-spacing:-.02em">How to submit to ${escapeHtml(entry.name)}</h1>
          <p style="margin:0 0 1rem">${escapeHtml(plainCopy(entry.description))}</p>
          <p style="margin:0 0 1rem">${escapeHtml(DIRECTORY_KIND_LABELS[entry.kind])} directory with an Ahrefs Domain Rating of ${entry.dr}. Listing cost: ${escapeHtml(DIRECTORY_PRICE_LABELS[entry.price].toLowerCase())}. Link type: ${escapeHtml(DIRECTORY_LINK_LABELS[entry.link].toLowerCase())}. Approval: ${escapeHtml(entry.approvalTime.toLowerCase())}. Last checked ${escapeHtml(entry.lastChecked)}.</p>
          <p style="margin:0 0 1rem">Website: <a href="${escapeHtml(entry.siteUrl)}" rel="noopener" style="${linkStyle}">${escapeHtml(siteLabel)}</a> · Submission page: <a href="${escapeHtml(entry.submitUrl)}" rel="noopener" style="${linkStyle}">open ${escapeHtml(entry.name)}</a></p>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Submit your product, step by step</h2>
          <ol style="margin:0 0 1rem;padding-left:1.25rem">
${entry.steps.map((step) => `            <li style="margin-bottom:.5rem">${escapeHtml(plainCopy(step))}</li>`).join('\n')}
          </ol>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">What you need</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${entry.requirements.map((item) => `            <li>${escapeHtml(plainCopy(item))}</li>`).join('\n')}
          </ul>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Before you submit</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
            <li>Confirm the current price and link type on ${escapeHtml(entry.name)} before you pay for anything.</li>
            <li>Use a live product URL with a clear landing page. Directories reject broken or placeholder sites.</li>
            <li>Watch your inbox for a verification email. Many listings stay pending until the address is confirmed.</li>
            <li>Pick the closest category and use the same description you use on other directories.</li>
          </ul>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">${escapeHtml(entry.name)} FAQ</h2>
          <dl style="margin:0">
${faqs.map(
  (faq) =>
    `            <dt style="font-weight:600;margin:.75rem 0 .25rem">${escapeHtml(faq.q)}</dt>\n            <dd style="margin:0 0 .5rem">${escapeHtml(faq.a)}</dd>`
).join('\n')}
          </dl>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Directories like ${escapeHtml(entry.name)}</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${related
  .map(
    (item) =>
      `            <li><a href="/product-directory/${escapeHtml(item.slug)}" style="${linkStyle}">${escapeHtml(item.name)}</a>: ${escapeHtml(plainCopy(item.description))} (DR ${item.dr})</li>`
  )
  .join('\n')}
          </ul>
          <p style="margin:1.5rem 0 0">More <a href="/product-directory" style="${linkStyle}">product directories ranked by Domain Rating</a>${
            kindHub
              ? `, including <a href="/product-directory/${kindHub.slug}" style="${linkStyle}">${escapeHtml(kindHub.label.toLowerCase())}</a>`
              : ''
          }.</p>
        </main>
${staticFooter}
      </div>
    `;
};

interface PageHead {
  title: string;
  description: string;
  canonical: string;
  body: string;
  jsonLd?: string;
  /** id attribute for the JSON-LD script so applyPageSeo can replace it */
  jsonLdId?: string;
  /** override the template robots directive (e.g. noindex on the 404 page) */
  robots?: string;
  /** drop the template JSON-LD instead of keeping it */
  dropJsonLd?: boolean;
  /** if true, don't wrap body in <noscript> (for pure static pages like 404) */
  staticOnly?: boolean;
}

const renderPage = (template: string, page: PageHead): string => {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = html.replace(
    /<meta name="description" content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${description}" />`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${page.canonical}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${page.canonical}" />`
  );
  html = html.replace(
    /<meta property="og:title" content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${description}" />`
  );
  html = html.replace(
    /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:url" content="${page.canonical}" />`
  );
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${description}" />`
  );

  if (page.robots) {
    html = html.replace(
      /<meta name="robots" content="[^"]*"\s*\/?>/,
      `<meta name="robots" content="${page.robots}" />`
    );
  }

  if (page.jsonLd) {
    const idAttr = page.jsonLdId ? ` id="${page.jsonLdId}"` : '';
    const ldBlock = `<script type="application/ld+json"${idAttr}>${page.jsonLd}</script>`;
    html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/, ldBlock);
  } else if (page.dropJsonLd) {
    html = html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/, '');
  }

  const bodyContent = page.staticOnly ? page.body : `<noscript>${page.body}</noscript>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  return html;
};

const writePage = (distDir: string, segments: string[], html: string): void => {
  const dir = path.join(distDir, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
};

/* ───────────────────────── core SPA pages ───────────────────────── */

const h1Style = 'font-size:2rem;line-height:1.15;margin:0 0 .5rem;letter-spacing:-.02em';
const h2Style = 'font-size:1.125rem;margin:1.75rem 0 .5rem';

const siteJsonLd = () => [
  {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'TopSAAS',
    url: `${SITE_URL}/`,
  },
  {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'TopSAAS',
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo/TopSAAS%20-%20blue.png`,
    sameAs: [
      'https://x.com/topsaas_space',
      'https://github.com/Joelpillar1/TopSAAS',
    ],
  },
];

const breadcrumbJsonLd = (trail: Array<[string, string]>) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, item], index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name,
    item,
  })),
});

const faqJsonLd = (faqs: Array<{ q: string; a: string }>) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
});

const faqList = (faqs: Array<{ q: string; a: string }>): string =>
  `<dl style="margin:0">
${faqs
  .map(
    (faq) =>
      `            <dt style="font-weight:600;margin:.75rem 0 .25rem">${escapeHtml(faq.q)}</dt>\n            <dd style="margin:0 0 .5rem">${escapeHtml(faq.a)}</dd>`
  )
  .join('\n')}
          </dl>`;

/* ── products ── */

const mapRowToProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  rank: (row.rank as number) || 0,
  name: row.name as string,
  tagline: (row.tagline as string) || '',
  url: (row.url as string) || '',
  logoUrl: (row.logo_url as string) || undefined,
  category: ((row.category as string) || 'SaaS & Indie') as Product['category'],
  upvotes: (row.upvotes as number) || 0,
  clicks: (row.clicks as number) || 0,
  description: (row.description as string) || undefined,
  pricingModel: ((row.pricing_model as string) || undefined) as Product['pricingModel'],
  verified: Boolean(row.verified),
  creatorName: (row.creator_name as string) || undefined,
  createdAt: (row.created_at as number) || 0,
  updatedAt: (row.updated_at as number) || 0,
});

/** One page per slug. The live table has a duplicate "topsaas" row; keep the best rank. */
const dedupeProducts = (products: Product[]): Product[] => {
  const bySlug = new Map<string, Product>();
  for (const product of [...products].sort((a, b) => a.rank - b.rank)) {
    const slug = getProductSlug(product);
    if (!slug || bySlug.has(slug)) continue;
    bySlug.set(slug, product);
  }
  return [...bySlug.values()].sort((a, b) => a.rank - b.rank);
};

const loadPrerenderProducts = async (): Promise<Product[]> => {
  const fallback = dedupeProducts(INITIAL_PRODUCTS);
  const url =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';
  const key =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!url || !key) return fallback;

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/products?select=*&order=rank.asc`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(rows) || rows.length === 0) return fallback;
    return dedupeProducts(rows.map(mapRowToProduct));
  } catch (error) {
    console.warn(
      `[seo-prerender] live product fetch failed, using INITIAL_PRODUCTS: ${(error as Error).message}`
    );
    return fallback;
  }
};

const productDescription = (product: Product): string =>
  (product.description || product.tagline || `${product.name} is a modern SaaS tool listed on TopSAAS.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

const buildProductBody = (product: Product, siblings: Product[]): string => {
  const slug = getProductSlug(product);
  const related = siblings.filter((p) => getProductSlug(p) !== slug).slice(0, 6);
  const facts = [
    product.category ? `Category: ${escapeHtml(product.category)}` : '',
    product.pricingModel ? `Pricing: ${escapeHtml(product.pricingModel)}` : '',
    typeof product.upvotes === 'number' && product.upvotes > 0
      ? `Community upvotes: ${product.upvotes.toLocaleString('en-US')}`
      : '',
    product.rank ? `Leaderboard rank: #${product.rank}` : '',
    product.verified ? 'Verified listing' : '',
  ].filter(Boolean);

  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(product.name)}</span>
        </nav>
        <main>
          <h1 style="${h1Style}">${escapeHtml(product.name)}</h1>
          ${product.tagline ? `<p style="font-size:1.0625rem;font-weight:500;margin:0 0 1rem">${escapeHtml(product.tagline)}</p>` : ''}
          <p style="margin:0 0 1rem">${escapeHtml(productDescription(product))}</p>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${facts.map((fact) => `            <li>${fact}</li>`).join('\n')}
          </ul>
          <p style="margin:0 0 1rem">Website: <a href="${escapeHtml(product.url)}" rel="noopener" style="${linkStyle}">${escapeHtml(product.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></p>
          <h2 style="${h2Style}">More SaaS products on TopSAAS</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${related
  .map(
    (item) =>
      `            <li><a href="/products/${escapeHtml(getProductSlug(item))}" style="${linkStyle}">${escapeHtml(item.name)}</a>: ${escapeHtml(item.tagline || '')}</li>`
  )
  .join('\n')}
          </ul>
          <p style="margin:1.5rem 0 0">Browse <a href="/product-directory" style="${linkStyle}">product directories</a>, <a href="/ideas" style="${linkStyle}">open-source SaaS ideas</a>, or <a href="/submit" style="${linkStyle}">submit your own product</a>.</p>
        </main>
${staticFooter}
      </div>
    `;
};

const buildProductJsonLd = (product: Product): string => {
  const canonical = `${SITE_URL}/products/${getProductSlug(product)}`;
  const app: Record<string, unknown> = {
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description || product.tagline || `Discover ${product.name} on TopSAAS`,
    url: product.url,
    applicationCategory: product.category || 'BusinessApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: product.pricingModel || 'Freemium',
    },
  };
  if (product.logoUrl) app.image = product.logoUrl;
  if (typeof product.upvotes === 'number' && product.upvotes > 0) {
    app.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: Math.max(1, product.upvotes),
      bestRating: '5',
      worstRating: '1',
    };
  }
  return escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      app,
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        [product.name, canonical],
      ]),
    ],
  });
};

/* ── homepage ── */

const HOME_FAQS = [
  {
    q: 'What is TopSAAS?',
    a: 'TopSAAS is a curated directory and community leaderboard for modern SaaS products, AI tools, and open-source software starters. Listings are ranked by verified community upvotes rather than paid placement.',
  },
  {
    q: 'Is listing a product on TopSAAS free?',
    a: 'Yes. A standard listing is free forever and goes through manual review in 7 to 14 days. The optional $5 Verified Launch adds a 24-hour review, a permanent dofollow backlink, a verified badge, category placement, and /llms.txt AI search inclusion.',
  },
  {
    q: 'How are products ranked on the homepage?',
    a: 'The homepage leaderboard is ordered by real community upvotes for the current weekly cohort. Every verified upvote moves a product up the list, and sponsored placements are labelled separately.',
  },
  {
    q: 'What are the open-source SaaS ideas?',
    a: 'The /ideas catalog lists thousands of curated open-source repositories that can serve as the foundation for a SaaS product, grouped by category with stars, forks, license, health score, and a self-hosting verdict.',
  },
  {
    q: 'Does TopSAAS offer a free MRR calculator?',
    a: 'Yes. The /mrr-calculator page calculates monthly recurring revenue and annual run rate entirely in the browser from average revenue per customer and the number of paying customers.',
  },
  {
    q: 'How do I get my product featured?',
    a: 'Submit the product, then choose the free listing or the $5 Verified Launch. Featured Spot and Sidebar Sponsor placements are available for additional weekly or monthly visibility.',
  },
];

const buildHomeBody = (products: Product[]): string => {
  const starters = topRepos.slice(0, 20);
  return `
      <div style="${pageStyle}">
        <main>
          <h1 style="${h1Style}">Find the best SaaS. Or get yours found.</h1>
          <p style="margin:0 0 1rem">TopSAAS is a curated directory of modern SaaS products and AI tools. Every listing is ranked by real community upvotes, with verified launches, weekly spotlights, and an open-source starter catalog for builders.</p>
          <p style="margin:0 0 1rem">Browse <a href="/product-directory" style="${linkStyle}">the product directory</a>, explore <a href="/ideas" style="${linkStyle}">open-source SaaS ideas</a>, see <a href="/trending" style="${linkStyle}">trending projects</a>, read <a href="/guides" style="${linkStyle}">build guides</a>, or estimate revenue with the <a href="/mrr-calculator" style="${linkStyle}">MRR calculator</a>.</p>
          <h2 style="${h2Style}">Top SaaS products this week</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${products
  .map(
    (product) =>
      `            <li><a href="/products/${escapeHtml(getProductSlug(product))}" style="${linkStyle}">${escapeHtml(product.name)}</a>: ${escapeHtml(product.tagline || '')}${product.category ? ` (${escapeHtml(product.category)})` : ''}</li>`
  )
  .join('\n')}
          </ul>
          <h2 style="${h2Style}">Open-source SaaS starters to build on</h2>
          <p style="margin:0 0 1rem">The <a href="/ideas" style="${linkStyle}">SaaS Ideas catalog</a> turns open-source repositories into launchable products. Here are some of the most popular foundations:</p>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${starters
  .map(
    (repo) =>
      `            <li><a href="/repo/${escapeHtml(repo.full_name)}" style="${linkStyle}">${escapeHtml(repo.name)}</a>: ${escapeHtml(plainCopy(repo.description || ''))} (${repo.stargazers_count.toLocaleString('en-US')} stars, ${escapeHtml(repo.language || 'multi-language')})</li>`
  )
  .join('\n')}
          </ul>
          <h2 style="${h2Style}">Build guides</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${BUILD_GUIDES.map(
  (guide) =>
    `            <li><a href="/guides/${escapeHtml(guide.slug)}" style="${linkStyle}">${escapeHtml(guide.title)}</a>: ${escapeHtml(guide.tagline)}</li>`
).join('\n')}
          </ul>
          <h2 style="${h2Style}">Latest from the TopSAAS blog</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${BLOG_POSTS.map(
  (post) =>
    `            <li><a href="/blog/${escapeHtml(post.slug)}" style="${linkStyle}">${escapeHtml(post.title)}</a>: ${escapeHtml(post.tagline)}</li>`
).join('\n')}
          </ul>
          <h2 style="${h2Style}">Frequently asked questions</h2>
          ${faqList(HOME_FAQS)}
          <h2 style="${h2Style}">List your product</h2>
          <p style="margin:0 0 1rem">Submissions are free and take about 30 seconds. The $5 Verified Launch adds a permanent dofollow backlink, a verified badge, and a fast-track review. <a href="/submit" style="${linkStyle}">Submit your product</a> or compare <a href="/pricing" style="${linkStyle}">launch plans</a>.</p>
          <p style="margin:0 0 1rem">TopSAAS is operated independently. Read our <a href="/privacy" style="${linkStyle}">privacy policy</a> and <a href="/terms" style="${linkStyle}">terms of service</a>.</p>
        </main>
${staticFooter}
      </div>
    `;
};

const buildHomeJsonLd = (products: Product[]): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'TopSAAS',
        url: `${SITE_URL}/`,
        description:
          'The curated discovery engine and leaderboard for modern SaaS products, AI tools, and open-source software starters.',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'TopSAAS',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo/TopSAAS%20-%20blue.png`,
        sameAs: [
          'https://x.com/topsaas_space',
          'https://github.com/Joelpillar1/TopSAAS',
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: 'TopSAAS — Curated Directory of Modern SaaS & AI Tools',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        description:
          'Discover verified modern SaaS products, trending AI tools, and open-source starters with real-time community upvotes and transparent launch rankings.',
      },
      {
        '@type': 'ItemList',
        name: 'Top SaaS products this week',
        numberOfItems: products.length,
        itemListElement: products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: product.name,
          url: `${SITE_URL}/products/${getProductSlug(product)}`,
        })),
      },
      faqJsonLd(HOME_FAQS),
      {
        '@type': 'ItemList',
        name: 'TopSAAS build guides',
        numberOfItems: BUILD_GUIDES.length,
        itemListElement: BUILD_GUIDES.map((guide, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: guide.title,
          url: `${SITE_URL}/guides/${guide.slug}`,
        })),
      },
    ],
  });

/* ── trending ── */

const buildTrendingBody = (): string => {
  const rows = topRepos.slice(0, 25);
  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <a href="/ideas" style="${linkStyle}">SaaS Ideas</a>
          <span aria-hidden="true">/</span>
          <span>Trending</span>
        </nav>
        <main>
          <h1 style="${h1Style}">Trending Open Source Projects</h1>
          <p style="margin:0 0 1rem">See which repositories are gaining momentum right now. Ranked by star velocity and recent GitHub activity across 23 categories, with health scores, license details, and a self-hosting verdict for each project.</p>
          <h2 style="${h2Style}">Fastest-growing open-source projects</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${rows
  .map(
    (repo) =>
      `            <li><a href="/repo/${escapeHtml(repo.full_name)}" style="${linkStyle}">${escapeHtml(repo.name)}</a>: ${escapeHtml(plainCopy(repo.description || ''))} (${repo.stargazers_count.toLocaleString('en-US')} stars, ${escapeHtml(repo.language || 'multi-language')})</li>`
  )
  .join('\n')}
          </ul>
          <p style="margin:1.5rem 0 0">Browse all ${uniqueRepos.length.toLocaleString('en-US')} projects on <a href="/ideas" style="${linkStyle}">SaaS Ideas</a>, or read the <a href="/guides" style="${linkStyle}">build guides</a> for a step-by-step path from clone to launch.</p>
        </main>
${staticFooter}
      </div>
    `;
};

const buildTrendingJsonLd = (): string => {
  const rows = topRepos.slice(0, 25);
  return escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/trending#webpage`,
        url: `${SITE_URL}/trending`,
        name: 'Trending Open Source Projects',
        description:
          'Open-source repositories ranked by star velocity and recent GitHub activity across 23 categories.',
      },
      {
        '@type': 'ItemList',
        name: 'Trending open-source projects',
        numberOfItems: rows.length,
        itemListElement: rows.map((repo, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: repo.name,
          url: repoCanonicalUrl(repo.full_name),
        })),
      },
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['SaaS Ideas', `${SITE_URL}/ideas`],
        ['Trending', `${SITE_URL}/trending`],
      ]),
    ],
  });
};

/* ── build guides ── */

const buildGuidesBody = (): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>Build Guides</span>
        </nav>
        <main>
          <h1 style="${h1Style}">Build Guides</h1>
          <p style="margin:0 0 1rem">Original walkthroughs that take one curated open-source project and ship something real on top of it. Every guide includes copy-paste commands, a production checklist, repo health scores, and the trade-offs we would weigh before launching.</p>
          <h2 style="${h2Style}">All build guides</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${BUILD_GUIDES.map(
  (guide) =>
    `            <li><a href="/guides/${escapeHtml(guide.slug)}" style="${linkStyle}">${escapeHtml(guide.title)}</a>: ${escapeHtml(guide.tagline)} (${escapeHtml(guide.difficulty)}, ${escapeHtml(guide.timeEstimate)})</li>`
).join('\n')}
          </ul>
          <p style="margin:1.5rem 0 0">Each guide starts from a repo in the <a href="/ideas" style="${linkStyle}">open-source SaaS catalog</a>. Prefer finished products? Browse <a href="/product-directory" style="${linkStyle}">the product directory</a>.</p>
        </main>
${staticFooter}
      </div>
    `;

const buildGuidesJsonLd = (): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/guides#webpage`,
        url: `${SITE_URL}/guides`,
        name: 'TopSAAS Build Guides',
        description:
          'Step-by-step guides for shipping real SaaS products on open-source projects.',
      },
      {
        '@type': 'ItemList',
        name: 'TopSAAS build guides',
        numberOfItems: BUILD_GUIDES.length,
        itemListElement: BUILD_GUIDES.map((guide, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: guide.title,
          url: `${SITE_URL}/guides/${guide.slug}`,
        })),
      },
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['Build Guides', `${SITE_URL}/guides`],
      ]),
    ],
  });

const buildGuideBody = (guide: BuildGuide): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <a href="/guides" style="${linkStyle}">Build Guides</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(guide.title)}</span>
        </nav>
        <main>
          <h1 style="${h1Style}">${escapeHtml(guide.title)}</h1>
          <p style="font-size:1.0625rem;font-weight:500;margin:0 0 1rem">${escapeHtml(guide.tagline)}</p>
          <p style="${mutedStyle}margin:0 0 1rem">Difficulty: ${escapeHtml(guide.difficulty)} · Time: ${escapeHtml(guide.timeEstimate)} · Stack: ${escapeHtml(guide.stack.join(', '))}</p>
          ${guide.intro
            .split(/\n{2,}/)
            .map((paragraph) => `<p style="margin:0 0 1rem">${escapeHtml(paragraph.replace(/\s+/g, ' ').trim())}</p>`)
            .join('\n          ')}
          <h2 style="${h2Style}">Step by step</h2>
          <ol style="margin:0 0 1rem;padding-left:1.25rem">
${guide.steps
  .map(
    (step) =>
      `            <li style="margin-bottom:.75rem"><strong>${escapeHtml(step.title)}</strong><br />${escapeHtml(step.body)}${
        step.code ? `<pre style="background:#f5f5f5;padding:.75rem;overflow-x:auto;margin:.5rem 0 0"><code>${escapeHtml(step.code)}</code></pre>` : ''
      }</li>`
  )
  .join('\n')}
          </ol>
          <h2 style="${h2Style}">Customize it</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${guide.customize.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
          <h2 style="${h2Style}">Production checklist</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${guide.checklist.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
          <h2 style="${h2Style}">FAQ</h2>
          ${faqList(guide.faq)}
          <p style="margin:1.5rem 0 0">Base project: <a href="/repo/${escapeHtml(guide.repoFullName)}" style="${linkStyle}">${escapeHtml(guide.repoFullName)}</a>. See all <a href="/guides" style="${linkStyle}">build guides</a>.</p>
        </main>
${staticFooter}
      </div>
    `;

const buildGuideJsonLd = (guide: BuildGuide): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'HowTo',
        name: guide.title,
        description: guide.tagline,
        totalTime: guide.totalTime,
        estimatedDifficulty: guide.difficulty,
        step: guide.steps.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.body,
        })),
      },
      faqJsonLd(guide.faq),
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['Build Guides', `${SITE_URL}/guides`],
        [guide.title, `${SITE_URL}/guides/${guide.slug}`],
      ]),
    ],
  });

/* ── mrr calculator ── */

const buildMrrBody = (): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>MRR Calculator</span>
        </nav>
        <main>
          <h1 style="${h1Style}">SaaS MRR Calculator</h1>
          <p style="margin:0 0 1rem">Work out monthly recurring revenue from average revenue per customer and the number of paying customers. Enter both numbers in the interactive calculator, then use the formulas and worked examples below to sanity-check the result.</p>
          <p style="margin:0 0 1rem">MRR = average revenue per customer × active paying customers. ARR is MRR × 12. ARPA is MRR divided by paying customers. Annual and quarterly plans are converted to a monthly equivalent before they are added.</p>
          <h2 style="${h2Style}">Key takeaways</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${MRR_KEY_TAKEAWAYS.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
          <h2 style="${h2Style}">How to calculate MRR</h2>
          <ol style="margin:0 0 1rem;padding-left:1.25rem">
${MRR_HOW_TO_STEPS.map((step) => `            <li style="margin-bottom:.5rem"><strong>${escapeHtml(step.title)}.</strong> ${escapeHtml(step.body)}</li>`).join('\n')}
          </ol>
          <h2 style="${h2Style}">MRR FAQ</h2>
          ${faqList(MRR_FAQS)}
          <p style="margin:1.5rem 0 0">Planning a launch? Compare <a href="/pricing" style="${linkStyle}">TopSAAS launch plans</a>, or browse <a href="/product-directory" style="${linkStyle}">product directories</a> and <a href="/ideas" style="${linkStyle}">open-source SaaS ideas</a>.</p>
        </main>
${staticFooter}
      </div>
    `;

const buildMrrJsonLd = (): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/mrr-calculator#webpage`,
        url: `${SITE_URL}/mrr-calculator`,
        name: 'SaaS MRR Calculator',
        description:
          'Free monthly recurring revenue calculator for SaaS businesses, with formulas, worked examples, annual plan conversion, and an MRR FAQ.',
        inLanguage: 'en',
      },
      faqJsonLd(MRR_FAQS),
      {
        '@type': 'HowTo',
        name: 'How to calculate SaaS MRR',
        description: 'Calculate monthly recurring revenue from active paying customers and average revenue per customer.',
        totalTime: 'PT5M',
        step: MRR_HOW_TO_STEPS.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.body,
        })),
      },
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['MRR Calculator', `${SITE_URL}/mrr-calculator`],
      ]),
    ],
  });

/* ── submit ── */

const buildSubmitBody = (): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>Submit</span>
        </nav>
        <main>
          <h1 style="${h1Style}">Submit your website</h1>
          <p style="margin:0 0 1rem">Launch your SaaS product or AI tool on TopSAAS. Free to submit, AI-assisted auto-fill, and a real community leaderboard ranked by verified upvotes.</p>
          <h2 style="${h2Style}">Four steps to launch</h2>
          <ol style="margin:0 0 1rem;padding-left:1.25rem">
${SUBMIT_STEPS.map((step) => `            <li style="margin-bottom:.5rem"><strong>${escapeHtml(step.title)}.</strong> ${escapeHtml(step.body)}</li>`).join('\n')}
          </ol>
          <h2 style="${h2Style}">What you get</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
            <li>A permanent public listing with your logo, screenshots, tagline, and category.</li>
            <li>A link to your website. Paid plans receive a permanent dofollow backlink.</li>
            <li>Community upvotes that move you up the weekly leaderboard.</li>
            <li>Optional Verified Launch: fast-track review, verified badge, category placement, and /llms.txt inclusion for AI search.</li>
          </ul>
          <p style="margin:1.5rem 0 0">Compare <a href="/pricing" style="${linkStyle}">launch plans</a> or browse <a href="/product-directory" style="${linkStyle}">product directories</a> for more places to list.</p>
        </main>
${staticFooter}
      </div>
    `;

const buildSubmitJsonLd = (): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/submit#webpage`,
        url: `${SITE_URL}/submit`,
        name: 'Submit Your SaaS — TopSAAS Launchpad',
        description:
          'Submit your software for verification, community upvoting, and featured promotion on TopSAAS.',
      },
      {
        '@type': 'HowTo',
        name: 'How to submit a product to TopSAAS',
        totalTime: 'PT5M',
        step: SUBMIT_STEPS.map((step, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: step.title,
          text: step.body,
        })),
      },
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['Submit', `${SITE_URL}/submit`],
      ]),
    ],
  });

/* ── pricing ── */

const buildPricingBody = (): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>Pricing</span>
        </nav>
        <main>
          <h1 style="${h1Style}">Pricing and launch plans</h1>
          <p style="margin:0 0 1rem">Two ways to list a product on TopSAAS, plus optional visibility upgrades. Submitting is always free; the Verified Launch is a one-time $5 payment, not a subscription.</p>
          <h2 style="${h2Style}">Plans</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
            <li><strong>Free listing ($0 forever).</strong> Manual review in 7–14 days, standard nofollow backlink, permanent public listing.</li>
            <li><strong>Verified Launch ($5 one-time).</strong> Review within 24 hours, permanent dofollow backlink, verified badge, category top-3 placement for 7 days, a 1,000+ word story on /blog, and /llms.txt AI search inclusion.</li>
            <li><strong>Featured Spot ($15/week or $39/month).</strong> Pins your card at the top of the main product feed.</li>
            <li><strong>Sidebar Sponsor ($10/week or $29/month).</strong> Places your product on the sticky side rails across the homepage and product pages.</li>
          </ul>
          <p style="margin:0 0 1rem">The $5 Verified Launch is a one-time payment per product. There are no recurring fees for the listing, badge, or dofollow backlink.</p>
          <h2 style="${h2Style}">Pricing FAQ</h2>
          ${faqList(PRICING_FAQS)}
          <p style="margin:1.5rem 0 0">Ready to list? <a href="/submit" style="${linkStyle}">Submit your product</a>.</p>
        </main>
${staticFooter}
      </div>
    `;

const buildPricingJsonLd = (): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'Product',
        name: 'TopSAAS Verified Launch',
        description:
          'Permanent verified directory listing, high-authority dofollow backlink, verified badge, top 3 category placement (7 Days), and /llms.txt AI search inclusion.',
        offers: {
          '@type': 'Offer',
          price: '5',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/pricing`,
        },
      },
      faqJsonLd(PRICING_FAQS),
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['Pricing', `${SITE_URL}/pricing`],
      ]),
    ],
  });

/* ── legal ── */

const buildLegalBody = (doc: 'privacy' | 'terms'): string => {
  const title = doc === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const sections = doc === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const otherDoc = doc === 'privacy' ? 'terms' : 'privacy';
  const otherLabel = doc === 'privacy' ? 'Terms of Service' : 'Privacy Policy';

  const renderSection = (section: LegalSection): string => `          <section style="margin:0 0 1.5rem">
            <h2 style="${h2Style}">${escapeHtml(section.heading)}</h2>
${(section.paragraphs || [])
  .map((paragraph) => `            <p style="margin:0 0 .75rem">${escapeHtml(paragraph)}</p>`)
  .join('\n')}
${(section.definitions || [])
  .map(
    (definition) =>
      `            <p style="margin:0 0 .5rem"><strong>${escapeHtml(definition.label)}</strong> ${escapeHtml(definition.body)}</p>`
  )
  .join('\n')}
${section.bullets ? `            <ul style="margin:0 0 .75rem;padding-left:1.25rem">\n${section.bullets.map((bullet) => `              <li>${escapeHtml(bullet)}</li>`).join('\n')}\n            </ul>` : ''}
${section.note ? `            <p style="margin:0 0 .75rem;padding:.75rem;background:#f5f5f5;border-left:3px solid #a3a3a3"><strong>${escapeHtml(section.note)}</strong></p>` : ''}
          </section>`;

  return `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(title)}</span>
        </nav>
        <main>
          <h1 style="${h1Style}">${escapeHtml(title)}</h1>
          <p style="${mutedStyle}margin:0 0 1.5rem">Official Terms &amp; Policies · Effective ${escapeHtml(LEGAL_EFFECTIVE)}</p>
${sections.map(renderSection).join('\n')}
          <p style="margin:1.5rem 0 0">Read the <a href="/${otherDoc}" style="${linkStyle}">${escapeHtml(otherLabel)}</a>, or go back to the <a href="/" style="${linkStyle}">TopSAAS directory</a>.</p>
        </main>
${staticFooter}
      </div>
    `;
};

const buildLegalJsonLd = (doc: 'privacy' | 'terms'): string => {
  const seo = doc === 'privacy' ? privacySeo() : termsSeo();
  const title = doc === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  return escapeJson({
    '@context': 'https://schema.org',
    '@graph': [
      ...siteJsonLd(),
      {
        '@type': 'WebPage',
        '@id': `${seo.canonical}#webpage`,
        url: seo.canonical,
        name: seo.title,
        description: seo.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
      },
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        [title, seo.canonical],
      ]),
    ],
  });
};

/* ── 404 ── */

const buildNotFoundBody = (): string => `
      <div style="${pageStyle}">
        <main>
          <h1 style="${h1Style}">Page not found</h1>
          <p style="margin:0 0 1rem">That URL does not match any page on TopSAAS. It may have been renamed, or the link may be mistyped.</p>
          <p style="margin:0 0 1rem">Try the <a href="/" style="${linkStyle}">homepage</a>, <a href="/product-directory" style="${linkStyle}">the product directory</a>, <a href="/ideas" style="${linkStyle}">open-source SaaS ideas</a>, <a href="/guides" style="${linkStyle}">build guides</a>, or the <a href="/mrr-calculator" style="${linkStyle}">MRR calculator</a>.</p>
        </main>
${staticFooter}
      </div>
    `;

/* ── blog ── */

const buildBlogBody = (): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <span>Blog</span>
        </nav>
        <main>
          <h1 style="${h1Style}">TopSAAS Blog</h1>
          <p style="margin:0 0 1rem">Actionable guides, launch checklists, high-DR directory strategies, and open-source stacks for bootstrapped SaaS founders and indie hackers.</p>
          <h2 style="${h2Style}">Latest articles</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${BLOG_POSTS.map(
  (post) =>
    `            <li><a href="/blog/${escapeHtml(post.slug)}" style="${linkStyle}">${escapeHtml(post.title)}</a>: ${escapeHtml(post.tagline)} (${escapeHtml(post.category)}, ${escapeHtml(post.readTime)})</li>`
).join('\n')}
          </ul>
        </main>
${staticFooter}
      </div>
    `;

const buildBlogJsonLd = (): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/blog#webpage`,
        url: `${SITE_URL}/blog`,
        name: 'TopSAAS Blog',
        description:
          'SaaS launch guides, growth playbooks, and directory SEO tactics for bootstrapped founders.',
      },
      {
        '@type': 'ItemList',
        name: 'TopSAAS articles',
        numberOfItems: BLOG_POSTS.length,
        itemListElement: BLOG_POSTS.map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: post.title,
          url: `${SITE_URL}/blog/${post.slug}`,
        })),
      },
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['Blog', `${SITE_URL}/blog`],
      ]),
    ],
  });

const buildBlogPostBody = (post: BlogPost): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <a href="/blog" style="${linkStyle}">Blog</a>
          <span aria-hidden="true">/</span>
          <span>${escapeHtml(post.title)}</span>
        </nav>
        <main>
          <h1 style="${h1Style}">${escapeHtml(post.title)}</h1>
          <p style="font-size:1.0625rem;font-weight:500;margin:0 0 1rem">${escapeHtml(post.tagline)}</p>
          <p style="${mutedStyle}margin:0 0 1.5rem">${escapeHtml(post.author.name)} · ${escapeHtml(post.publishedAt)} · ${escapeHtml(post.readTime)} · ${escapeHtml(post.category)}</p>
          <p style="margin:0 0 1.5rem;padding:1rem;background:#f0fdf4;border-left:3px solid #10b981"><strong>Quick answer:</strong> ${escapeHtml(post.directAnswer)}</p>
          <h2 style="${h2Style}">Key takeaways</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${post.keyTakeaways.map((item) => `            <li>${escapeHtml(item)}</li>`).join('\n')}
          </ul>
${post.intro.map((paragraph) => `<p style="margin:0 0 1rem">${escapeHtml(paragraph)}</p>`).join('\n')}
${post.sections
  .map(
    (section) => `          <h2 style="${h2Style}">${escapeHtml(section.title)}</h2>
${section.paragraphs.map((paragraph) => `<p style="margin:0 0 1rem">${escapeHtml(paragraph)}</p>`).join('\n')}
${(section.subsections || [])
  .map(
    (sub) => `          <h3 style="font-size:1rem;margin:1.25rem 0 .5rem">${escapeHtml(sub.title)}</h3>
${sub.paragraphs.map((paragraph) => `<p style="margin:0 0 1rem">${escapeHtml(paragraph)}</p>`).join('\n')}`
  )
  .join('\n')}
${section.table ? `<table style="border-collapse:collapse;margin:0 0 1rem;width:100%"><thead><tr>${section.table.headers.map((h) => `<th style="border:1px solid #e5e5e5;padding:.5rem;text-align:left">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #e5e5e5;padding:.5rem">${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
${section.checklist ? `<ul style="margin:0 0 1rem;padding-left:1.25rem">${section.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
${section.proTip ? `<p style="margin:0 0 1rem"><strong>Pro tip:</strong> ${escapeHtml(section.proTip)}</p>` : ''}
${section.codeSnippet ? `<pre style="background:#f5f5f5;padding:.75rem;overflow-x:auto;margin:0 0 1rem"><code>${escapeHtml(section.codeSnippet.code)}</code></pre>` : ''}
${section.quote ? `<blockquote style="margin:0 0 1rem;border-left:3px solid #d4d4d4;padding-left:1rem"><p style="margin:0">${escapeHtml(section.quote.text)}</p><footer style="${mutedStyle}">${escapeHtml(section.quote.author)}</footer></blockquote>` : ''}`
  )
  .join('\n')}
          <h2 style="${h2Style}">FAQ</h2>
          ${faqList(post.faq)}
          <h2 style="${h2Style}">Keep reading</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${post.relatedInternalLinks.map((link) => `            <li><a href="${escapeHtml(link.href)}" style="${linkStyle}">${escapeHtml(link.label)}</a></li>`).join('\n')}
          </ul>
          <p style="margin:1.5rem 0 0"><a href="/blog" style="${linkStyle}">All TopSAAS articles</a></p>
        </main>
${staticFooter}
      </div>
    `;

const buildBlogPostJsonLd = (post: BlogPost): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [...siteJsonLd(), 
      {
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.tagline,
        url: `${SITE_URL}/blog/${post.slug}`,
        datePublished: post.publishedAt,
        dateModified: post.updatedAt,
        articleSection: post.category,
        keywords: post.tags.join(', '),
        author: { '@type': 'Person', name: post.author.name },
        publisher: {
          '@type': 'Organization',
          name: 'TopSAAS',
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/logo/TopSAAS%20-%20blue.png`,
        },
        mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
      },
      faqJsonLd(post.faq),
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['Blog', `${SITE_URL}/blog`],
        [post.title, `${SITE_URL}/blog/${post.slug}`],
      ]),
    ],
  });

/* ───────────────────────── build hook ───────────────────────── */

export function repoPrerenderPlugin(): Plugin {
  return {
    name: 'topsaas-repo-prerender',
    apply: 'build',
    async closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const templatePath = path.join(distDir, 'index.html');
      if (!fs.existsSync(templatePath)) return;

      const template = fs.readFileSync(templatePath, 'utf8');
      const products = await loadPrerenderProducts();

      for (const repo of uniqueRepos) {
        writePage(
          distDir,
          ['repo', ...repo.full_name.split('/')],
          renderPage(template, {
            title: repoSeoTitle(repo),
            description: repoSeoDescription(repo),
            canonical: repoCanonicalUrl(repo.full_name),
            body: buildRepoBody(repo),
            jsonLd: buildRepoJsonLd(repo),
            jsonLdId: 'repo-jsonld',
          })
        );
      }

      const total = uniqueRepos.length.toLocaleString('en-US');
      writePage(
        distDir,
        ['ideas'],
        renderPage(template, {
          title: `SaaS Ideas: ${total} open-source projects to build on | TopSAAS`,
          description: `Browse ${total} curated open-source repositories for building SaaS: starters, auth, billing, analytics, AI and infrastructure.`,
          canonical: `${SITE_URL}/ideas`,
          body: buildIdeasBody(),
          jsonLd: escapeJson({
            '@context': 'https://schema.org',
            '@graph': [...siteJsonLd(), 
              {
                '@type': 'CollectionPage',
                '@id': `${SITE_URL}/ideas#webpage`,
                url: `${SITE_URL}/ideas`,
                name: 'SaaS Ideas: open-source projects to build on',
                description: `${total} curated open-source repositories for building SaaS.`,
              },
              {
                '@type': 'ItemList',
                name: 'Open-source SaaS starter projects',
                numberOfItems: uniqueRepos.length,
                itemListElement: uniqueRepos.slice(0, 100).map((repo, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  name: repo.name,
                  url: repoCanonicalUrl(repo.full_name),
                })),
              },
              breadcrumbJsonLd([
                ['Directory', `${SITE_URL}/`],
                ['SaaS Ideas', `${SITE_URL}/ideas`],
              ]),
            ],
          }),
          jsonLdId: 'ideas-jsonld',
        })
      );

      for (const entry of DIRECTORIES) {
        const seo = directoryDetailSeo(entry);
        writePage(
          distDir,
          ['product-directory', entry.slug],
          renderPage(template, {
            title: seo.title,
            description: seo.description,
            canonical: seo.canonical,
            body: buildDirectoryDetailBody(entry),
            jsonLd: escapeJson(directoryDetailJsonLd(entry, directoryFaqs(entry))),
            jsonLdId: 'directory-jsonld',
          })
        );
      }

      for (const hub of DIRECTORY_HUBS) {
        const seo = directoryListSeo(hub);
        writePage(
          distDir,
          ['product-directory', hub.slug],
          renderPage(template, {
            title: seo.title,
            description: seo.description,
            canonical: seo.canonical,
            body: buildDirectoryListBody(hub),
            jsonLd: escapeJson(directoryListJsonLd(hub, DIRECTORIES.filter(hub.filter))),
            jsonLdId: 'directory-list-jsonld',
          })
        );
      }

      const listSeo = directoryListSeo(null);
      writePage(
        distDir,
        ['product-directory'],
        renderPage(template, {
          title: listSeo.title,
          description: listSeo.description,
          canonical: listSeo.canonical,
          body: buildDirectoryListBody(null),
          jsonLd: escapeJson(directoryListJsonLd(null, DIRECTORIES)),
          jsonLdId: 'directory-list-jsonld',
        })
      );

      // ── product pages, one per unique slug, plus legacy aliases ──
      for (const product of products) {
        const seo = productSeo(product);
        const slug = getProductSlug(product);
        const html = renderPage(template, {
          title: seo.title,
          description: seo.description,
          canonical: seo.canonical,
          body: buildProductBody(product, products),
          jsonLd: buildProductJsonLd(product),
          jsonLdId: `product-jsonld-${product.id}`,
        });
        writePage(distDir, ['products', slug], html);
        const aliases = new Set([
          `product/${slug}`,
          `product/${product.id}`,
          `products/${product.id}`,
        ]);
        for (const alias of aliases) {
          if (alias === `products/${slug}`) continue;
          writePage(distDir, alias.split('/'), html);
        }
      }

      // ── product sitemap (real slugs, regenerated from live data) ──
      const productSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products
  .map(
    (product) => `  <url>
    <loc>${SITE_URL}/products/${getProductSlug(product)}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
      fs.mkdirSync(path.join(distDir, 'sitemap'), { recursive: true });
      fs.writeFileSync(path.join(distDir, 'sitemap', 'products.xml'), productSitemap, 'utf8');

      // ── core SPA pages ──
      const trending = trendingSeo();
      writePage(
        distDir,
        ['trending'],
        renderPage(template, {
          title: trending.title,
          description: trending.description,
          canonical: trending.canonical,
          body: buildTrendingBody(),
          jsonLd: buildTrendingJsonLd(),
          jsonLdId: 'trending-jsonld',
        })
      );

      const guides = guidesSeo();
      writePage(
        distDir,
        ['guides'],
        renderPage(template, {
          title: guides.title,
          description: guides.description,
          canonical: guides.canonical,
          body: buildGuidesBody(),
          jsonLd: buildGuidesJsonLd(),
          jsonLdId: 'guides-jsonld',
        })
      );

      for (const guide of BUILD_GUIDES) {
        const seo = guideSeo(guide);
        writePage(
          distDir,
          ['guides', guide.slug],
          renderPage(template, {
            title: seo.title,
            description: seo.description,
            canonical: seo.canonical,
            body: buildGuideBody(guide),
            jsonLd: buildGuideJsonLd(guide),
            jsonLdId: 'guide-jsonld',
          })
        );
      }

      const mrr = mrrSeo();
      writePage(
        distDir,
        ['mrr-calculator'],
        renderPage(template, {
          title: mrr.title,
          description: mrr.description,
          canonical: mrr.canonical,
          body: buildMrrBody(),
          jsonLd: buildMrrJsonLd(),
          jsonLdId: 'mrr-calculator-jsonld',
        })
      );

      const submit = submitSeo();
      writePage(
        distDir,
        ['submit'],
        renderPage(template, {
          title: submit.title,
          description: submit.description,
          canonical: submit.canonical,
          body: buildSubmitBody(),
          jsonLd: buildSubmitJsonLd(),
          jsonLdId: 'submit-jsonld',
        })
      );

      const pricing = pricingSeo();
      writePage(
        distDir,
        ['pricing'],
        renderPage(template, {
          title: pricing.title,
          description: pricing.description,
          canonical: pricing.canonical,
          body: buildPricingBody(),
          jsonLd: buildPricingJsonLd(),
          jsonLdId: 'pricing-jsonld',
        })
      );

      // ── legal pages, each with its own canonical ──
      const privacy = privacySeo();
      writePage(
        distDir,
        ['privacy'],
        renderPage(template, {
          title: privacy.title,
          description: privacy.description,
          canonical: privacy.canonical,
          body: buildLegalBody('privacy'),
          jsonLd: buildLegalJsonLd('privacy'),
          jsonLdId: 'privacy-jsonld',
        })
      );

      const terms = termsSeo();
      writePage(
        distDir,
        ['terms'],
        renderPage(template, {
          title: terms.title,
          description: terms.description,
          canonical: terms.canonical,
          body: buildLegalBody('terms'),
          jsonLd: buildLegalJsonLd('terms'),
          jsonLdId: 'terms-jsonld',
        })
      );

      // ── blog ──
      const blog = blogSeo();
      writePage(
        distDir,
        ['blog'],
        renderPage(template, {
          title: blog.title,
          description: blog.description,
          canonical: blog.canonical,
          body: buildBlogBody(),
          jsonLd: buildBlogJsonLd(),
          jsonLdId: 'blog-jsonld',
        })
      );

      for (const post of BLOG_POSTS) {
        const seo = blogPostSeo(post);
        writePage(
          distDir,
          ['blog', post.slug],
          renderPage(template, {
            title: seo.title,
            description: seo.description,
            canonical: seo.canonical,
            body: buildBlogPostBody(post),
            jsonLd: buildBlogPostJsonLd(post),
            jsonLdId: `blogpost-${post.slug}-jsonld`,
          })
        );
      }

      // The 404 page is served with a 404 status by vercel.json.
      const notFoundTitle = 'Page not found | TopSAAS';
      const notFoundHtml = renderPage(template, {
        title: notFoundTitle,
        description:
          'That URL does not match any page on TopSAAS. Browse the directory, product directory, build guides, or MRR calculator instead.',
        canonical: `${SITE_URL}/404`,
        body: buildNotFoundBody(),
        robots: 'noindex, follow',
        dropJsonLd: true,
        staticOnly: true,
      })
        // Keep the static 404 page: without the SPA bundle React would mount on
        // an unknown path and render the homepage in place of this message.
        .replace(/<link rel="modulepreload"[^>]*>\s*/g, '')
        .replace(/<script type="module"[^>]*><\/script>\s*/g, '');
      fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf8');

      // Homepage is written last from the saved template so it can carry real
      // markup without changing the shell used for every other page.
      const home = homeSeo();
      fs.writeFileSync(
        path.join(distDir, 'index.html'),
        renderPage(template, {
          title: home.title,
          description: home.description,
          canonical: home.canonical,
          body: buildHomeBody(products),
          jsonLd: buildHomeJsonLd(products),
          jsonLdId: 'home-jsonld',
        }),
        'utf8'
      );

      console.log(
        `[seo-prerender] wrote ${uniqueRepos.length} repo pages, ${DIRECTORIES.length} directory pages, ${DIRECTORY_HUBS.length} directory hubs, ${products.length} product pages, 3 guides, 5 blog posts, 2 legal pages, 9 core pages and /ideas`
      );
    },
  };
}
