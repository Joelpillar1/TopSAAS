import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { CURATED_REPOS } from '../src/data/curatedRepos';
import type { CuratedRepo, RepoCategory } from '../src/data/curatedRepos';
import { HANDPICKED_REPOS, type HandpickedRepoDossier } from '../src/data/handpickedRepos';
import { firstSentences, plainCopy, stripMarkup } from '../src/utils/plainCopy';import {
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
import {
  BENTO_PDF_META,
  BENTO_TOOLS,
  BENTO_PDF_ARCHITECTURE,
  BENTO_BLUEPRINTS,
  BENTO_FAQS,
  BENTO_INTERNAL_LINKS,
  BENTO_EXTERNAL_RESOURCES,
} from '../src/data/bentoPdfDeepDive';
import { LEGAL_EFFECTIVE, PRIVACY_SECTIONS, TERMS_SECTIONS, type LegalSection } from '../src/data/legalContent';
import { getProductSlug } from '../src/utils/slug';
import { productFaqs } from '../src/utils/productFaqs';
import {
  blogPostSeo,
  blogSeo,
  guidesSeo,
  guideSeo,
  homeSeo,
  ideasSeo,
  mrrSeo,
  pricingSeo,
  privacySeo,
  productSeo,
  submitSeo,
  termsSeo,
  trendingSeo,
} from '../src/utils/coreSeo';
import { SUBMISSION_CATEGORIES, type Product } from '../src/types';
import { SAAS_IDEA_CATEGORIES } from '../src/data/categoriesData';

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

/** The handpicked foundations have their own section on /ideas. */
const handpickedNames = new Set(
  HANDPICKED_REPOS.map((dossier) => dossier.repoFullName.toLowerCase())
);
/** Dossier copy keyed by repo, so repo pages can ship the editorial too. */
const dossierByRepo = new Map(
  HANDPICKED_REPOS.map((dossier) => [dossier.repoFullName.toLowerCase(), dossier] as const)
);
const handpickedRepos = uniqueRepos.filter((repo) =>
  handpickedNames.has(repo.full_name.toLowerCase())
);
const directoryRepos = uniqueRepos.filter(
  (repo) => !handpickedNames.has(repo.full_name.toLowerCase())
);

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

const formatInlineMarkdown = (text: string): string =>
  escapeHtml(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const targetAttr = isExternal ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${href}" style="${linkStyle}"${targetAttr}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/** Static footer for crawlers and no-JS visitors; React renders the full footer. */
const staticFooter = `
        <footer style="margin-top:2.5rem;border-top:1px solid #e5e5e5;padding-top:1.25rem;${mutedStyle}">
          <p style="margin:0 0 .5rem">TopSAAS is a curated directory of modern SaaS products, AI tools and open-source projects.</p>
          <nav aria-label="Footer">
            <a href="/" style="${linkStyle}">Directory</a> ·
            <a href="/product-directory" style="${linkStyle}">Product Directory</a> ·
            <a href="/ideas" style="${linkStyle}">SaaS Ideas</a> ·
            <a href="/opensource/bentopdf" style="${linkStyle}">BentoPDF Teardown</a> ·
            <a href="/trending" style="${linkStyle}">Trending</a> ·
            <a href="/guides" style="${linkStyle}">Build Guides</a> ·
            <a href="/blog" style="${linkStyle}">Blog</a> ·
            <a href="/mrr-calculator" style="${linkStyle}">MRR Calculator</a> ·
            <a href="/submit" style="${linkStyle}">Submit</a> ·
            <a href="/pricing" style="${linkStyle}">Pricing</a> ·
            <a href="/privacy" style="${linkStyle}">Privacy</a> ·
            <a href="/terms" style="${linkStyle}">Terms</a>
          </nav>
          <nav aria-label="Machine-readable files" style="margin-top:.85rem">
            <span style="display:block;font-weight:600;color:#404040;margin-bottom:.35rem">Machine-readable files</span>
            <a href="/llms.txt" style="${linkStyle}">llms.txt</a> ·
            <a href="/llms-full.txt" style="${linkStyle}">llms-full.txt</a> ·
            <a href="/ai.txt" style="${linkStyle}">ai.txt</a> ·
            <a href="/ai-snapshot.json" style="${linkStyle}">ai-snapshot.json</a> ·
            <a href="/catalog.md" style="${linkStyle}">catalog.md</a> ·
            <a href="/openapi.json" style="${linkStyle}">openapi.json</a> ·
            <a href="/products.json" style="${linkStyle}">products.json</a> ·
            <a href="/robots.txt" style="${linkStyle}">robots.txt</a>
          </nav>
        </footer>`;

/** Dossier prose: blank lines become paragraphs, single newlines become breaks. */
const proseHtml = (text: string): string =>
  text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(
      (part) =>
        `<p style="margin:0 0 1rem">${formatInlineMarkdown(part).replace(/\n/g, '<br />')}</p>`
    )
    .join('');

const listHtml = (items: readonly string[]): string =>
  items.length === 0
    ? ''
    : `<ul style="margin:0 0 1rem;padding-left:1.25rem">\n${items
        .map((item) => `            <li>${formatInlineMarkdown(item)}</li>`)
        .join('\n')}\n          </ul>`;

/** Handpicked repos carry operator-grade dossiers; emit them for crawlers too. */
const buildDossierBody = (dossier: HandpickedRepoDossier): string => {
  const name = escapeHtml(dossier.repoName);
  const replaces =
    dossier.replaces.allReplaces && dossier.replaces.allReplaces.length
      ? dossier.replaces.allReplaces
      : [dossier.replaces.name];

  const ideasHtml = dossier.ideas
    .map((idea) => {
      const additions = Array.isArray(idea.youWouldNeedToAdd)
        ? idea.youWouldNeedToAdd
        : [idea.youWouldNeedToAdd];
      return `            <h3 style="font-size:1rem;margin:1.5rem 0 .5rem">${escapeHtml(idea.title)}</h3>
            <p style="margin:0 0 .5rem"><strong>Who pays:</strong> ${formatInlineMarkdown(idea.customer)}</p>
            <p style="margin:0 0 .5rem"><strong>How to charge:</strong> ${formatInlineMarkdown(idea.howToCharge)}</p>
            <p style="margin:0 0 .25rem"><strong>What you would add:</strong></p>
            ${listHtml(additions)}`;
    })
    .join('\n');

  const alternativesHtml = dossier.commercialAlternatives
    .map(
      (alt) =>
        `            <li><strong>${escapeHtml(alt.name)}</strong>${
          alt.pricing ? ` (${escapeHtml(alt.pricing)})` : ''
        }: ${formatInlineMarkdown(alt.description)} ${formatInlineMarkdown(alt.whyReplace)}</li>`
    )
    .join('\n');

  const commands = [
    dossier.quickStart.clone,
    dossier.quickStart.install,
    dossier.quickStart.run,
  ].filter((command): command is string => Boolean(command));

  return `
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">What ${name} is</h2>
          ${proseHtml(dossier.summary)}
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">The problem it solves</h2>
          ${proseHtml(dossier.problemItSolves)}
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">How ${name} solves it</h2>
          ${proseHtml(dossier.solution)}
          ${
            dossier.whoItsFor.length
              ? `<h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Who it is for</h2>${listHtml(dossier.whoItsFor)}`
              : ''
          }
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Key features</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${dossier.features
  .map(
    (feature) =>
      `            <li><strong>${escapeHtml(feature.title)}</strong> ${formatInlineMarkdown(feature.description)}</li>`
  )
  .join('\n')}
          </ul>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">License at a glance</h2>
          <p style="margin:0 0 1rem"><strong>${escapeHtml(dossier.licenseSpdx)}</strong>: ${formatInlineMarkdown(dossier.licenseMeaning)}</p>
          ${
            dossier.licenseWarning
              ? `<p style="margin:0 0 1rem"><strong>Careful:</strong> ${formatInlineMarkdown(dossier.licenseWarning)}</p>`
              : ''
          }
          ${
            dossier.caveats.length
              ? `<h3 style="font-size:1rem;margin:1.5rem 0 .5rem">Caveats before you build</h3>${listHtml(dossier.caveats)}`
              : ''
          }
          ${
            dossier.ideas.length
              ? `<h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">SaaS ideas you could build on ${name}</h2>\n${ideasHtml}`
              : ''
          }
          ${
            dossier.commercialAlternatives.length
              ? `<h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Commercial tools it replaces</h2>\n          <ul style="margin:0 0 1rem;padding-left:1.25rem">\n${alternativesHtml}\n          </ul>`
              : ''
          }
          ${
            dossier.goodFitIf.length
              ? `<h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Good fit if</h2>${listHtml(dossier.goodFitIf)}`
              : ''
          }
          ${
            dossier.skipIf.length
              ? `<h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Skip it if</h2>${listHtml(dossier.skipIf)}`
              : ''
          }
          ${
            commands.length
              ? `<h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Quick start</h2>\n          <pre style="margin:0 0 1rem;padding:.75rem 1rem;background:#f5f5f5;border:1px solid #e5e5e5;border-radius:.5rem;overflow-x:auto;font-size:.8125rem"><code>${escapeHtml(commands.join('\n'))}</code></pre>`
              : ''
          }
          ${
            dossier.quickStart.notes
              ? `<p style="margin:0 0 1rem">${formatInlineMarkdown(dossier.quickStart.notes)}</p>`
              : ''
          }
          <h3 style="font-size:1rem;margin:1.5rem 0 .5rem">Replaces</h3>
          ${listHtml(replaces)}
`;
};

const buildRepoBody = (repo: CuratedRepo): string => {
  const dossier = dossierByRepo.get(repo.full_name.toLowerCase());
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
          ${dossier ? buildDossierBody(dossier) : ''}
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
            ${dossier ? `<li>Last verified: ${escapeHtml(dossier.lastVerified)}</li>` : ''}
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
        '@type': ['Product', 'SoftwareSourceCode'],
        name: repo.name,
        description: plainCopy(repo.description || `${repo.full_name} on GitHub`),
        url: canonical,
        codeRepository: repo.html_url,
        author: { '@type': 'Organization', name: repo.owner.login },
        brand: { '@type': 'Brand', name: repo.owner.login },
        keywords: repo.category,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
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
  const total = directoryRepos.length;
  const categories = (() => {
    const grouped = new Map<RepoCategory, CuratedRepo[]>();
    for (const repo of directoryRepos) {
      const bucket = grouped.get(repo.category);
      if (bucket) bucket.push(repo);
      else grouped.set(repo.category, [repo]);
    }
    for (const bucket of grouped.values()) {
      bucket.sort((a, b) => b.stargazers_count - a.stargazers_count);
    }
    return [...grouped.entries()];
  })();
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
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Handpicked open source foundations (${handpickedRepos.length})</h2>
          <p style="margin:0 0 .75rem">These foundations have a full commercial dossier: SaaS ideas, license analysis, and launch guidance.</p>
          <ul style="margin:0;padding-left:1.25rem">
${handpickedRepos
  .map(
    (r) =>
      `            <li><a href="/repo/${escapeHtml(r.full_name)}" style="${linkStyle}">${escapeHtml(r.name)}</a></li>`
  )
  .join('\n')}
          </ul>
          <h2 style="font-size:1.125rem;margin:1.75rem 0 .5rem">Open source projects by category</h2>
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
  /** if true, render the body bare instead of as prerendered markup that JS hides (for the 404 page) */
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

  // Ship the body as real markup so every parser, not just JavaScript-capable
  // browsers, can read the text and follow the links. A tiny inline script in
  // the template adds `html.js` before first paint and hides this block, so
  // visitors never see the prerendered copy while React swaps in.
  const bodyContent = page.staticOnly ? page.body : `<div id="seo-prerender">${page.body}</div>`;
  html = html.replace('<div id="root"></div>', `<div id="root">${bodyContent}</div>`);
  return html;
};

const writePage = (distDir: string, segments: string[], html: string): void => {
  const dir = path.join(distDir, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
};

/* ── sitemaps ── */

type SitemapEntry = {
  loc: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
};

type SitemapSection = 'pages' | 'repos' | 'products' | 'directories' | 'guides' | 'blog';

const SITEMAP_SECTIONS: SitemapSection[] = [
  'pages',
  'repos',
  'products',
  'directories',
  'guides',
  'blog',
];

/**
 * Writes a real sitemap index at /sitemap.xml plus one child sitemap per
 * section. Entries are built from the same data arrays that generate the
 * pages, so the sitemap can never drift from what the build actually wrote.
 */
const writeSitemaps = (
  distDir: string,
  sections: Record<SitemapSection, SitemapEntry[]>,
  lastmod: string
): void => {
  const sitemapDir = path.join(distDir, 'sitemap');
  fs.mkdirSync(sitemapDir, { recursive: true });

  for (const section of SITEMAP_SECTIONS) {
    const entries = sections[section];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
    fs.writeFileSync(path.join(sitemapDir, `${section}.xml`), xml, 'utf8');
  }

  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${SITEMAP_SECTIONS.map(
  (section) => `  <sitemap>
    <loc>${SITE_URL}/sitemap/${section}.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`
).join('\n')}
</sitemapindex>
`;
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), index, 'utf8');
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
      `            <dt style="font-weight:600;margin:.75rem 0 .25rem">${escapeHtml(faq.q)}</dt>\n            <dd style="margin:0 0 .5rem">${formatInlineMarkdown(faq.a)}</dd>`
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

export const loadPrerenderProducts = async (): Promise<Product[]> => {
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

const productIntro = (product: Product): string =>
  firstSentences(
    stripMarkup(product.description || '') ||
      stripMarkup(product.tagline || '') ||
      `${product.name} is a modern SaaS tool listed on TopSAAS.`,
    480
  );

const buildProductBody = (product: Product, siblings: Product[]): string => {
  const slug = getProductSlug(product);
  const related = siblings.filter((p) => getProductSlug(p) !== slug).slice(0, 6);
  const faqs = productFaqs(product);
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
          <p style="margin:0 0 1rem">${escapeHtml(productIntro(product))}</p>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
${facts.map((fact) => `            <li>${fact}</li>`).join('\n')}
          </ul>
          <p style="margin:0 0 1rem">Website: <a href="${escapeHtml(product.url)}" rel="noopener" style="${linkStyle}">${escapeHtml(product.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a></p>
          <h2 style="${h2Style}">Frequently asked questions about ${escapeHtml(product.name)}</h2>
${faqList(faqs)}
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
    '@type': ['Product', 'SoftwareApplication'],
    name: product.name,
    description:
      stripMarkup(product.description || '') ||
      stripMarkup(product.tagline || '') ||
      `Discover ${product.name} on TopSAAS`,
    url: product.url,
    applicationCategory: product.category || 'BusinessApplication',
    operatingSystem: 'All',
    brand: {
      '@type': 'Brand',
      name: product.name,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      category: product.pricingModel || 'Freemium',
      availability: 'https://schema.org/InStock',
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
      faqJsonLd(productFaqs(product)),
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
    a: 'Yes. A standard listing is free forever and goes through manual review in 7 to 14 days. The optional $9 Verified Launch (40% off from $15) adds a 24-hour review, a permanent dofollow backlink, a verified badge, category placement, and /llms.txt AI search inclusion.',
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
    a: 'Submit the product, then choose the free listing or the $9 Verified Launch. Featured Spot and Sidebar Sponsor placements are available for additional weekly or monthly visibility.',
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
          <p style="margin:0 0 1rem">Submissions are free and take about 30 seconds. The $9 Verified Launch (40% off from $15) adds a permanent dofollow backlink, a verified badge, and a fast-track review. <a href="/submit" style="${linkStyle}">Submit your product</a> or compare <a href="/pricing" style="${linkStyle}">launch plans</a>.</p>
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
        '@type': ['Article', 'TechArticle'],
        headline: guide.title,
        description: guide.tagline,
        url: `${SITE_URL}/guides/${guide.slug}`,
        inLanguage: 'en',
        author: {
          '@type': 'Organization',
          name: 'TopSAAS',
          url: `${SITE_URL}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TopSAAS',
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/logo/TopSAAS%20-%20blue.png`,
        },
        mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
      },
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
          <p style="margin:0 0 1rem">Two ways to list a product on TopSAAS, plus optional visibility upgrades. Submitting is always free; the Verified Launch is a one-time $9 payment (40% off from $15), not a subscription.</p>
          <h2 style="${h2Style}">Plans</h2>
          <ul style="margin:0 0 1rem;padding-left:1.25rem">
            <li><strong>Free listing ($0 forever).</strong> Manual review in 7–14 days, standard nofollow backlink, permanent public listing.</li>
            <li><strong>Verified Launch ($9 one-time, 40% off from $15).</strong> Review within 24 hours, permanent dofollow backlink, verified badge, category top-3 placement for 7 days, a 1,000+ word story on /blog, and /llms.txt AI search inclusion.</li>
            <li><strong>Featured Spot ($15/week, normally $25, or $39/month, normally $65 — 40% off; 2 slots).</strong> Pins your card at the top of the main product feed.</li>
            <li><strong>Sidebar &amp; Mobile Sponsor ($10/week, normally $17, or $29/month, normally $49 — 40% off; 5 slots).</strong> Places your product on the sticky desktop side rails and mobile hero sponsor card across every page.</li>
          </ul>
          <p style="margin:0 0 1rem">The $9 Verified Launch is a one-time payment per product. There are no recurring fees for the listing, badge, or dofollow backlink.</p>
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
          price: '9',
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

/* ── open source bentopdf teardown ── */

const buildOpenSourceBentoPdfBody = (): string => `
      <div style="${pageStyle}">
        <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
          <a href="/" style="${linkStyle}">Directory</a>
          <span aria-hidden="true">/</span>
          <a href="/ideas" style="${linkStyle}">SaaS Ideas</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">BentoPDF</span>
        </nav>
        <main>
          <header style="margin-bottom:2rem">
            <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;flex-wrap:wrap">
              <a href="${BENTO_PDF_META.githubUrl}" target="_blank" rel="noopener noreferrer" style="background:#f5f5f5;border:1px solid #e5e5e5;padding:.2rem .5rem;border-radius:.375rem;font-size:.75rem;font-weight:600;color:#171717;text-decoration:none">alam00000/bentopdf ↗</a>
              <a href="${BENTO_PDF_META.licenseUrl}" target="_blank" rel="noopener noreferrer" style="background:#f5f5f5;border:1px solid #e5e5e5;padding:.2rem .5rem;border-radius:.375rem;font-size:.75rem;font-weight:600;color:#171717;text-decoration:none">${escapeHtml(BENTO_PDF_META.license)} License ↗</a>
              <a href="${BENTO_PDF_META.officialWebsite}" target="_blank" rel="noopener noreferrer" style="background:#ecfdf5;border:1px solid #a7f3d0;padding:.2rem .5rem;border-radius:.375rem;font-size:.75rem;font-weight:600;color:#047857;text-decoration:none">bentopdf.com Live ↗</a>
            </div>
            <h1 style="${h1Style}">BentoPDF: Codebase Architecture &amp; 51 Client-Side WASM Tools Reference</h1>
            <p style="margin:0 0 1rem;font-size:1.0625rem;color:#404040">
              A comprehensive technical teardown of BentoPDF. Learn how 51 PDF manipulation and OCR tools execute entirely inside browser memory using WebAssembly with zero file uploads, zero server compute, and automatic GDPR/HIPAA compliance.
            </p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;margin:1.5rem 0">
              <div style="border:1px solid #e5e5e5;border-radius:.5rem;padding:.75rem;background:#fafafa">
                <div style="${mutedStyle}">Total Tools</div>
                <div style="font-size:1.25rem;font-weight:700;margin-top:.25rem">51 Tools</div>
                <div style="${mutedStyle}">5 Categories</div>
              </div>
              <div style="border:1px solid #e5e5e5;border-radius:.5rem;padding:.75rem;background:#fafafa">
                <div style="${mutedStyle}">Server Compute</div>
                <div style="font-size:1.25rem;font-weight:700;margin-top:.25rem">Zero Backend</div>
                <div style="${mutedStyle}">Client-side execution</div>
              </div>
              <div style="border:1px solid #e5e5e5;border-radius:.5rem;padding:.75rem;background:#fafafa">
                <div style="${mutedStyle}">Data Retention</div>
                <div style="font-size:1.25rem;font-weight:700;margin-top:.25rem">0 Bytes Stored</div>
                <div style="${mutedStyle}">Privacy by design</div>
              </div>
              <div style="border:1px solid #e5e5e5;border-radius:.5rem;padding:.75rem;background:#fafafa">
                <div style="${mutedStyle}">Core Engine</div>
                <div style="font-size:1.25rem;font-weight:700;margin-top:.25rem"><a href="${BENTO_PDF_META.wasmUrl}" target="_blank" rel="noopener noreferrer" style="color:#0a0a0a;text-decoration:none">WebAssembly</a></div>
                <div style="${mutedStyle}"><a href="${BENTO_PDF_META.mupdfUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">MuPDF</a> &amp; <a href="${BENTO_PDF_META.tesseractUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">Tesseract.js</a></div>
              </div>
            </div>
          </header>

          <section style="margin-bottom:2.5rem">
            <h2 style="${h2Style}">Local WebAssembly Execution Model</h2>
            <p style="margin:0 0 1rem">
              Unlike cloud services that require users to upload documents to external compute clusters, BentoPDF compiles C/C++ rendering libraries to <a href="${BENTO_PDF_META.wasmUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">WebAssembly</a>. The browser sandboxes memory, and worker threads process PDF objects on local hardware without sending bytes across the network.
            </p>
            <h3 style="font-size:1rem;margin:1.25rem 0 .5rem">Architecture Pillars</h3>
            <ul style="margin:0 0 1rem;padding-left:1.25rem">
${BENTO_PDF_ARCHITECTURE.corePillars
  .map(
    (pillar) =>
      `              <li><strong>${escapeHtml(pillar.title)}:</strong> ${escapeHtml(pillar.description)}</li>`
  )
  .join('\n')}
            </ul>

            <h3 style="font-size:1rem;margin:1.25rem 0 .5rem">Self-Hosting via Docker</h3>
            <pre style="background:#f5f5f5;padding:.75rem 1rem;border:1px solid #e5e5e5;border-radius:.5rem;overflow-x:auto;margin:0 0 .75rem"><code>docker run -d -p 8080:80 ghcr.io/alam00000/bentopdf-simple</code></pre>
            <p style="margin:0 0 1rem"><a href="${BENTO_PDF_META.dockerPackageUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">View bentopdf-simple package on GitHub Container Registry (GHCR) &rarr;</a></p>
          </section>

          <section style="margin-bottom:2.5rem">
            <h2 style="${h2Style}">The 51 BentoPDF Tools Breakdown</h2>
            <p style="margin:0 0 1rem">
              Each tool operates client-side without document persistence. Below is the full dictionary explaining what each tool does in plain English, its technical implementation under the hood, and practical real-world use cases.
            </p>
            <div style="display:flex;flex-direction:column;gap:1.25rem;margin-top:1rem">
${BENTO_TOOLS.map(
  (tool) => `              <article id="tool-${escapeHtml(tool.slug)}" style="border:1px solid #e5e5e5;border-radius:.75rem;padding:1.25rem;background:#fff">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
                  <div style="display:flex;align-items:center;gap:.5rem">
                    <span style="background:#f5f5f5;font-family:monospace;font-weight:700;padding:.2rem .4rem;border-radius:.25rem;font-size:.8125rem">#${tool.id}</span>
                    <h3 style="font-size:1.125rem;font-weight:700;margin:0">${escapeHtml(tool.name)}</h3>
                    <span style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;font-size:.75rem;font-weight:600;padding:.15rem .4rem;border-radius:.25rem">${escapeHtml(tool.category)}</span>
                  </div>
                  <span style="${mutedStyle};font-size:.75rem">${escapeHtml(tool.badge)}</span>
                </div>
                <p style="margin:0 0 .75rem;font-weight:500;color:#262626">${escapeHtml(tool.tagline)}</p>
                <div style="display:grid;grid-template-columns:1fr;gap:.75rem;background:#fafafa;padding:1rem;border-radius:.5rem;border:1px solid #f0f0f0">
                  <div>
                    <span style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#737373;display:block;margin-bottom:.25rem">Plain English</span>
                    <p style="margin:0;font-size:.875rem;color:#404040">${escapeHtml(tool.plainEnglish)}</p>
                  </div>
                  <div>
                    <span style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#737373;display:block;margin-bottom:.25rem">Under the Hood Architecture</span>
                    <p style="margin:0;font-size:.8125rem;font-family:monospace;color:#262626">${escapeHtml(tool.underTheHood)}</p>
                  </div>
                  <div>
                    <span style="font-size:.75rem;font-weight:700;text-transform:uppercase;color:#737373;display:block;margin-bottom:.25rem">Practical Real-World Use Case</span>
                    <p style="margin:0;font-size:.875rem;color:#404040">${escapeHtml(tool.realWorldUse)}</p>
                  </div>
                </div>
              </article>`
).join('\n')}
            </div>
          </section>

          <section style="margin-bottom:2.5rem">
            <h2 style="${h2Style}">Curated SaaS Blueprints Built on BentoPDF</h2>
            <p style="margin:0 0 1rem">
              Turn generic open-source PDF utilities into specialized, high-retention vertical B2B micro-SaaS products.
            </p>
            <div style="display:flex;flex-direction:column;gap:1.5rem;margin-top:1rem">
${BENTO_BLUEPRINTS.map(
  (idea) => `              <article style="border:1px solid #e5e5e5;border-radius:.75rem;padding:1.5rem;background:#fff">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem">
                  <div>
                    <h3 style="font-size:1.25rem;font-weight:700;margin:0">${escapeHtml(idea.name)}</h3>
                    <span style="${mutedStyle}">${escapeHtml(idea.niche)}</span>
                  </div>
                  <span style="background:#0a0a0a;color:#fff;font-weight:700;font-size:.8125rem;padding:.25rem .6rem;border-radius:.375rem">${escapeHtml(idea.pricing)}</span>
                </div>
                <p style="margin:0 0 1rem;font-size:.9375rem;color:#404040">${escapeHtml(idea.tagline)}</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.75rem;margin-bottom:1rem">
                  <div style="border:1px solid #f0f0f0;background:#fafafa;padding:.5rem .75rem;border-radius:.375rem">
                    <span style="${mutedStyle};font-size:.75rem">Target MRR</span>
                    <div style="font-weight:700;font-size:.9375rem">${escapeHtml(idea.targetMrr)}</div>
                  </div>
                  <div style="border:1px solid #f0f0f0;background:#fafafa;padding:.5rem .75rem;border-radius:.375rem">
                    <span style="${mutedStyle};font-size:.75rem">Breakeven Volume</span>
                    <div style="font-weight:700;font-size:.9375rem">${escapeHtml(idea.customersNeeded)}</div>
                  </div>
                  <div style="border:1px solid #f0f0f0;background:#fafafa;padding:.5rem .75rem;border-radius:.375rem">
                    <span style="${mutedStyle};font-size:.75rem">Estimated MVP</span>
                    <div style="font-weight:700;font-size:.9375rem">${escapeHtml(idea.timeToMvp)}</div>
                  </div>
                </div>
                <div style="font-size:.875rem;color:#404040;line-height:1.6">
                  <p style="margin:0 0 .5rem"><strong>Target Customer:</strong> ${escapeHtml(idea.market.target)} (${escapeHtml(idea.customer.title)})</p>
                  <p style="margin:0 0 .5rem"><strong>Core Pain:</strong> ${escapeHtml(idea.problem.corePain)}</p>
                  <p style="margin:0 0 .5rem"><strong>Product Solution:</strong> ${escapeHtml(idea.product.summary)}</p>
                  <p style="margin:0 0 .5rem"><strong>Search Demand:</strong> ${escapeHtml(idea.searchDemand.totalSearches)}</p>
                  <p style="margin:0"><strong>Financial Modeler:</strong> Simulate unit economics in the <a href="/mrr-calculator" style="${linkStyle}">TopSAAS MRR Calculator &rarr;</a></p>
                </div>
              </article>`
).join('\n')}
            </div>
          </section>

          <section style="margin-bottom:2.5rem">
            <h2 style="${h2Style}">Frequently Asked Questions</h2>
            ${faqList(BENTO_FAQS.map((f) => ({ q: f.question, a: f.answer })))}
          </section>

          <section style="margin-bottom:2.5rem;border-top:1px solid #e5e5e5;padding-top:1.5rem">
            <h2 style="${h2Style}">Related Ecosystem &amp; Authoritative References</h2>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem;margin-top:1rem">
              <div style="border:1px solid #e5e5e5;border-radius:.75rem;padding:1.25rem;background:#fff">
                <h3 style="font-size:1.0625rem;font-weight:700;margin:0 0 .75rem">TopSAAS Platform Hubs (Internal Links)</h3>
                <ul style="margin:0;padding-left:1.25rem;line-height:1.75;font-size:.875rem;color:#404040">
                  <li><a href="/ideas" style="${linkStyle}">SaaS Ideas Catalog</a> — 50+ curated open-source monetization blueprints.</li>
                  <li><a href="/mrr-calculator" style="${linkStyle}">MRR &amp; Pricing Calculator</a> — Model ARPU, customer volume, and breakeven.</li>
                  <li><a href="/product-directory" style="${linkStyle}">Product Directory</a> — Directory of live tools and micro-SaaS products.</li>
                  <li><a href="/trending" style="${linkStyle}">Trending Software</a> — This week's top software launches and votes.</li>
                  <li><a href="/guides" style="${linkStyle}">Founder Build Guides</a> — Engineering playbooks for launching profitable apps.</li>
                  <li><a href="/submit" style="${linkStyle}">Submit Your Product</a> — Verified review and permanent dofollow backlink.</li>
                  <li><a href="/pricing" style="${linkStyle}">Sponsorship &amp; Featured Spots</a> — Homepage banner and sidebar placements.</li>
                </ul>
              </div>
              <div style="border:1px solid #e5e5e5;border-radius:.75rem;padding:1.25rem;background:#fff">
                <h3 style="font-size:1.0625rem;font-weight:700;margin:0 0 .75rem">Authoritative References (External Links)</h3>
                <ul style="margin:0;padding-left:1.25rem;line-height:1.75;font-size:.875rem;color:#404040">
                  <li><a href="${BENTO_PDF_META.githubUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">alam00000/bentopdf GitHub</a> — Official source repository and WASM modules.</li>
                  <li><a href="${BENTO_PDF_META.officialWebsite}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">BentoPDF Web Application</a> — Official live web deployment.</li>
                  <li><a href="${BENTO_PDF_META.dockerPackageUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">bentopdf-simple on GHCR</a> — Standalone Docker image.</li>
                  <li><a href="${BENTO_PDF_META.mupdfUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">MuPDF by Artifex</a> — Ultralight C/C++ PDF engine.</li>
                  <li><a href="${BENTO_PDF_META.tesseractUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">Tesseract.js OCR</a> — Neural client-side OCR engine.</li>
                  <li><a href="${BENTO_PDF_META.pdfLibUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">pdf-lib Library</a> — TypeScript PDF mutation and creation.</li>
                  <li><a href="${BENTO_PDF_META.pdfJsUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">Mozilla PDF.js</a> — HTML5 browser document parsing standard.</li>
                  <li><a href="${BENTO_PDF_META.licenseUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">GNU AGPL-3.0 License</a> — Open source terms and obligations.</li>
                  <li><a href="${BENTO_PDF_META.wasmUrl}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">W3C WebAssembly Standard</a> — High-speed client sandboxing.</li>
                </ul>
              </div>
            </div>
          </section>

          <p style="margin:1.5rem 0 0"><a href="/ideas" style="${linkStyle}">← Back to SaaS Ideas Catalog</a></p>
        </main>
${staticFooter}
      </div>
    `;

const buildOpenSourceBentoPdfJsonLd = (): string =>
  escapeJson({
    '@context': 'https://schema.org',
    '@graph': [
      ...siteJsonLd(),
      {
        '@type': ['Article', 'TechArticle'],
        '@id': `${SITE_URL}/opensource/bentopdf#article`,
        headline: 'BentoPDF: Codebase Architecture & 51 Client-Side WASM Tools Reference',
        description:
          'Comprehensive technical breakdown of BentoPDF. Explore 51 client-side WebAssembly PDF tools running in browser RAM with zero server uploads, plus SaaS commercial blueprints.',
        url: `${SITE_URL}/opensource/bentopdf`,
        inLanguage: 'en',
        about: {
          '@type': 'SoftwareApplication',
          name: 'BentoPDF',
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any (WebAssembly Browser-Based)',
          softwareVersion: '1.0',
          codeRepository: 'https://github.com/alam00000/bentopdf',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
        significantLink: [
          ...BENTO_INTERNAL_LINKS.map((l) => `${SITE_URL}${l.url}`),
          ...BENTO_EXTERNAL_RESOURCES.map((l) => l.url),
        ],
        author: {
          '@type': 'Organization',
          name: 'TopSAAS Research',
          url: `${SITE_URL}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TopSAAS',
          url: `${SITE_URL}/`,
          logo: `${SITE_URL}/logo/TopSAAS%20-%20blue.png`,
        },
      },
      faqJsonLd(BENTO_FAQS.map((f) => ({ q: f.question, a: f.answer }))),
      breadcrumbJsonLd([
        ['Directory', `${SITE_URL}/`],
        ['SaaS Ideas', `${SITE_URL}/ideas`],
        ['Open Source', `${SITE_URL}/ideas`],
        ['BentoPDF', `${SITE_URL}/opensource/bentopdf`],
      ]),
    ],
  });

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
${post.intro.map((paragraph) => `<p style="margin:0 0 1rem">${formatInlineMarkdown(paragraph)}</p>`).join('\n')}
${post.sections
  .map(
    (section) => `          <h2 style="${h2Style}">${escapeHtml(section.title)}</h2>
${section.paragraphs.map((paragraph) => `<p style="margin:0 0 1rem">${formatInlineMarkdown(paragraph)}</p>`).join('\n')}
${(section.subsections || [])
  .map(
    (sub) => `          <h3 style="font-size:1rem;margin:1.25rem 0 .5rem">${escapeHtml(sub.title)}</h3>
${sub.paragraphs.map((paragraph) => `<p style="margin:0 0 1rem">${formatInlineMarkdown(paragraph)}</p>`).join('\n')}`
  )
  .join('\n')}
${section.table ? `<table style="border-collapse:collapse;margin:0 0 1rem;width:100%"><thead><tr>${section.table.headers.map((h) => `<th style="border:1px solid #e5e5e5;padding:.5rem;text-align:left">${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #e5e5e5;padding:.5rem">${formatInlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}
${section.checklist ? `<ul style="margin:0 0 1rem;padding-left:1.25rem">${section.checklist.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</ul>` : ''}
${section.proTip ? `<p style="margin:0 0 1rem"><strong>Pro tip:</strong> ${formatInlineMarkdown(section.proTip)}</p>` : ''}
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
        '@type': ['Article', 'BlogPosting'],
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

      const total = directoryRepos.length.toLocaleString('en-US');
      const ideasCopy = ideasSeo(directoryRepos.length);
      writePage(
        distDir,
        ['ideas'],
        renderPage(template, {
          title: ideasCopy.title,
          description: ideasCopy.description,
          canonical: ideasCopy.canonical,
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
                numberOfItems: directoryRepos.length,
                itemListElement: directoryRepos.slice(0, 100).map((repo, index) => ({
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

      // ── open source bentopdf teardown ──
      writePage(
        distDir,
        ['opensource', 'bentopdf'],
        renderPage(template, {
          title: 'BentoPDF: Codebase Architecture & 51 Client-Side WASM Tools Reference | TopSAAS',
          description:
            'Comprehensive technical breakdown of BentoPDF. Explore 51 client-side WebAssembly PDF tools running in browser RAM with zero server uploads, plus SaaS commercial blueprints.',
          canonical: `${SITE_URL}/opensource/bentopdf`,
          body: buildOpenSourceBentoPdfBody(),
          jsonLd: buildOpenSourceBentoPdfJsonLd(),
          jsonLdId: 'opensource-bentopdf-jsonld',
        })
      );

      // ── categories directory ──
      const categoriesFaqs = [
        {
          q: 'What is included in TopSAAS Directory Categories?',
          a: `TopSAAS organizes launched SaaS products, AI tools, and indie software across ${SUBMISSION_CATEGORIES.length} directory categories—including AI Tools, Developer Tools, Productivity, SaaS & Indie, Marketing & SEO, and Finance & Fintech. Clicking any category opens the live directory filtered to that niche.`,
        },
        {
          q: 'What are Open Source SaaS Idea Categories?',
          a: `Open Source SaaS Idea Categories group ${uniqueRepos.length.toLocaleString('en-US')}+ curated GitHub repositories across ${SAAS_IDEA_CATEGORIES.length} technical verticals such as SaaS Starters, Auth & Identity, Databases, AI & ML, DevOps & Infra, and Payments & Billing so founders can inspect star counts, health scores, and self-hosting options.`,
        },
        {
          q: 'How do I browse products or repositories in a specific category?',
          a: 'Click any category row on this page to jump straight to the filtered product directory or open-source SaaS ideas catalog with all matching listings and starter codebases.',
        },
      ];

      const ideaCategoryCounts: Record<string, number> = {};
      for (const repo of uniqueRepos) {
        const key = repo.category.toLowerCase();
        ideaCategoryCounts[key] = (ideaCategoryCounts[key] || 0) + 1;
      }

      const categoriesBody = `
        <div style="${pageStyle}">
          <nav aria-label="Breadcrumb" style="${mutedStyle}margin-bottom:1.25rem">
            <a href="/" style="${linkStyle}">Home</a>
            <span aria-hidden="true">/</span>
            <span>Categories</span>
          </nav>
          <main>
            <h1 style="${h1Style}">SaaS Directory &amp; Open Source Idea Categories</h1>
            <p style="margin:0 0 1.25rem">Discover launched SaaS products and clonable open-source starter codebases by niche. Pick any directory or open-source idea category to browse every matching tool and repository.</p>
            <h2 style="${h2Style}">Directory Categories (${SUBMISSION_CATEGORIES.length})</h2>
            <ul style="margin:0 0 1.5rem;padding-left:1.25rem">
${SUBMISSION_CATEGORIES.map(
  (cat) =>
    `              <li><a href="/?category=${encodeURIComponent(cat)}" style="${linkStyle}">${escapeHtml(cat)}</a></li>`
).join('\n')}
            </ul>
            <h2 style="${h2Style}">Open Source SaaS Idea Categories (${SAAS_IDEA_CATEGORIES.length})</h2>
            <ul style="margin:0 0 1.5rem;padding-left:1.25rem">
${SAAS_IDEA_CATEGORIES.map(
  (cat) =>
    `              <li><a href="/ideas?category=${encodeURIComponent(cat)}" style="${linkStyle}">${escapeHtml(cat)}</a> (${ideaCategoryCounts[cat.toLowerCase()] || 0} repos)</li>`
).join('\n')}
            </ul>
            <h2 style="${h2Style}">About TopSAAS Categories</h2>
            <dl style="margin:0">
${categoriesFaqs
  .map(
    (faq) =>
      `              <dt style="font-weight:700;margin-top:0.75rem">${escapeHtml(faq.q)}</dt>\n              <dd style="margin:0.25rem 0 0">${escapeHtml(faq.a)}</dd>`
  )
  .join('\n')}
            </dl>
          </main>
${staticFooter}
        </div>
      `;

      const categoriesJsonLd = escapeJson({
        '@context': 'https://schema.org',
        '@graph': [
          ...siteJsonLd(),
          {
            '@type': 'CollectionPage',
            '@id': `${SITE_URL}/categories#webpage`,
            url: `${SITE_URL}/categories`,
            name: 'SaaS Directory & Open Source Idea Categories | TopSAAS',
            description:
              'Explore 28 SaaS product directory categories and 23 open-source SaaS idea categories on TopSAAS.',
            isPartOf: { '@id': `${SITE_URL}/#website` },
          },
          breadcrumbJsonLd([
            ['Home', `${SITE_URL}/`],
            ['Categories', `${SITE_URL}/categories`],
          ]),
          {
            '@type': 'ItemList',
            name: 'SaaS Directory Categories',
            numberOfItems: SUBMISSION_CATEGORIES.length,
            itemListElement: SUBMISSION_CATEGORIES.map((cat, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: cat,
              url: `${SITE_URL}/?category=${encodeURIComponent(cat)}`,
            })),
          },
          {
            '@type': 'ItemList',
            name: 'Open Source SaaS Idea Categories',
            numberOfItems: SAAS_IDEA_CATEGORIES.length,
            itemListElement: SAAS_IDEA_CATEGORIES.map((cat, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: cat,
              url: `${SITE_URL}/ideas?category=${encodeURIComponent(cat)}`,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: categoriesFaqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          },
        ],
      });

      writePage(
        distDir,
        ['categories'],
        renderPage(template, {
          title: 'SaaS Directory & Open Source Idea Categories | TopSAAS',
          description:
            'Explore 28 SaaS product directory categories and 23 open-source SaaS idea categories on TopSAAS. Jump directly to curated tools, verified launches, and clonable starter codebases.',
          canonical: `${SITE_URL}/categories`,
          body: categoriesBody,
          jsonLd: categoriesJsonLd,
          jsonLdId: 'categories-jsonld',
        })
      );

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

      // ── sitemap index plus complete child sitemaps ──
      const sitemapLastmod = new Date().toISOString();
      const corePages: SitemapEntry[] = [
        { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
        { loc: `${SITE_URL}/categories`, changefreq: 'weekly', priority: '0.9' },
        { loc: `${SITE_URL}/ideas`, changefreq: 'daily', priority: '0.9' },
        { loc: `${SITE_URL}/trending`, changefreq: 'daily', priority: '0.9' },
        { loc: `${SITE_URL}/product-directory`, changefreq: 'weekly', priority: '0.9' },
        { loc: `${SITE_URL}/guides`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.8' },
        { loc: `${SITE_URL}/mrr-calculator`, changefreq: 'monthly', priority: '0.7' },
        { loc: `${SITE_URL}/opensource/bentopdf`, changefreq: 'weekly', priority: '0.9' },
        { loc: `${SITE_URL}/submit`, changefreq: 'monthly', priority: '0.7' },
        { loc: `${SITE_URL}/pricing`, changefreq: 'monthly', priority: '0.7' },
        { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3' },
        { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.3' },
      ];

      const directoryPages: SitemapEntry[] = [
        { loc: `${SITE_URL}/product-directory`, changefreq: 'weekly', priority: '0.9' },
        ...DIRECTORY_HUBS.map((hub) => ({
          loc: `${SITE_URL}/product-directory/${hub.slug}`,
          changefreq: 'weekly' as const,
          priority: '0.8',
        })),
        ...DIRECTORIES.map((entry) => ({
          loc: `${SITE_URL}/product-directory/${entry.slug}`,
          changefreq: 'monthly' as const,
          priority: '0.6',
        })),
      ];

      writeSitemaps(
        distDir,
        {
          pages: corePages,
          repos: uniqueRepos.map((repo) => ({
            loc: repoCanonicalUrl(repo.full_name),
            changefreq: 'weekly' as const,
            priority: '0.6',
          })),
          products: products.map((product) => ({
            loc: `${SITE_URL}/products/${getProductSlug(product)}`,
            changefreq: 'weekly' as const,
            priority: '0.7',
          })),
          directories: directoryPages,
          guides: [
            { loc: `${SITE_URL}/guides`, changefreq: 'weekly', priority: '0.8' },
            ...BUILD_GUIDES.map((guide) => ({
              loc: `${SITE_URL}/guides/${guide.slug}`,
              changefreq: 'monthly' as const,
              priority: '0.7',
            })),
          ],
          blog: [
            { loc: `${SITE_URL}/blog`, changefreq: 'weekly', priority: '0.8' },
            ...BLOG_POSTS.map((post) => ({
              loc: `${SITE_URL}/blog/${post.slug}`,
              changefreq: 'monthly' as const,
              priority: '0.7',
            })),
          ],
        },
        sitemapLastmod
      );

      console.log(
        `[seo-prerender] wrote ${uniqueRepos.length} repo pages, ${DIRECTORIES.length} directory pages, ${DIRECTORY_HUBS.length} directory hubs, ${products.length} product pages, 3 guides, ${BLOG_POSTS.length} blog posts, 2 legal pages, 9 core pages and /ideas`
      );
    },
  };
}
