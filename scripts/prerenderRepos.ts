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

/**
 * Static prerender for repo detail pages and the /ideas index.
 *
 * The app is a client-rendered SPA, so every /repo/:owner/:name request used to
 * receive the homepage shell: homepage title, homepage canonical, no H1. Search
 * crawlers that do not execute JS treated all 3,821 repo URLs as duplicates of
 * "/". This build step writes a real HTML file per repo (and one for /ideas)
 * with a unique title, description, H1, self-canonical, OG tags, structured
 * data and crawlable internal links. React still boots on top and replaces the
 * static markup, so the interactive page is unchanged.
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
  'max-width:52rem;margin:0 auto;padding:2rem 1.25rem 3rem;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#171717;line-height:1.65;';
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

interface PageHead {
  title: string;
  description: string;
  canonical: string;
  body: string;
  jsonLd?: string;
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

  const ldBlock = page.jsonLd
    ? `<script type="application/ld+json" id="repo-jsonld">${page.jsonLd}</script>`
    : '';
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ldBlock);

  html = html.replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
  return html;
};

const writePage = (distDir: string, segments: string[], html: string): void => {
  const dir = path.join(distDir, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
};

export function repoPrerenderPlugin(): Plugin {
  return {
    name: 'topsaas-repo-prerender',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const templatePath = path.join(distDir, 'index.html');
      if (!fs.existsSync(templatePath)) return;

      const template = fs.readFileSync(templatePath, 'utf8');

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
        })
      );

      console.log(`[repo-prerender] wrote ${uniqueRepos.length} repo pages and /ideas`);
    },
  };
}
