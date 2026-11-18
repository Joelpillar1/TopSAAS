import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import type { Product } from '../src/types';
import { SITE_URL } from '../src/utils/coreSeo';
import { getProductSlug } from '../src/utils/slug';
import { stripMarkup } from '../src/utils/plainCopy';
import { getWeekInfo } from '../src/utils/weeks';
import { CURATED_REPOS } from '../src/data/curatedRepos';
import { DIRECTORIES, DIRECTORY_HUBS } from '../src/data/directories';
import { BUILD_GUIDES } from '../src/data/buildGuides';
import { BLOG_POSTS } from '../src/data/blogPosts';
import { SUBMISSION_CATEGORIES } from '../src/types';
import { loadPrerenderProducts } from './prerenderRepos';

/**
 * The public machine-readable files (/products.json, /catalog.md,
 * /openapi.json, /ai-snapshot.json) used to be hand-maintained snapshots. They
 * drifted from the live directory, so they are now generated from the same
 * product rows that render the site. In dev the Vite middleware serves them on
 * request; in production the build writes them into dist/.
 */

const CONTACT_EMAIL = 'hello@topsaas.space';

const clean = (value?: string | null): string => stripMarkup(value || '').replace(/\s+/g, ' ').trim();

const cell = (value: string | undefined | null, maxLength = 160): string =>
  clean(value).replace(/\|/g, '\\|').slice(0, maxLength).trim() || '-';

const uniqueRepos = (() => {
  const seen = new Set<string>();
  return CURATED_REPOS.filter((repo) => {
    if (seen.has(repo.full_name)) return false;
    seen.add(repo.full_name);
    return true;
  });
})();

const topRepos = [...uniqueRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 12);

const productPageUrl = (product: Product): string =>
  `${SITE_URL}/products/${getProductSlug(product)}`;

const publicProduct = (product: Product): Record<string, unknown> => {
  const entry: Record<string, unknown> = {
    id: product.id,
    rank: product.rank,
    name: product.name,
    tagline: clean(product.tagline),
    url: product.url,
    page: productPageUrl(product),
    category: clean(product.category),
    upvotes: typeof product.upvotes === 'number' ? product.upvotes : 0,
    clicks: typeof product.clicks === 'number' ? product.clicks : 0,
    verified: Boolean(product.verified),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  if (product.logoUrl) entry.logoUrl = product.logoUrl;
  if (product.description) entry.description = clean(product.description);
  if (product.pricingModel) entry.pricingModel = clean(product.pricingModel);
  if (product.targetAudience) entry.targetAudience = clean(product.targetAudience);
  if (product.creatorName) entry.creatorName = clean(product.creatorName);
  if (product.twitterHandle) entry.twitterHandle = clean(product.twitterHandle);
  if (product.offerDiscount) entry.offerDiscount = clean(product.offerDiscount);
  if (product.offerCode) entry.offerCode = clean(product.offerCode);
  if (product.offerUrl) entry.offerUrl = product.offerUrl;
  if (product.offerDetails) entry.offerDetails = clean(product.offerDetails);
  if (product.screenshots?.length) entry.screenshots = product.screenshots;
  if (product.demoVideoUrl) entry.demoVideoUrl = product.demoVideoUrl;
  if (product.whatItDoes?.length) entry.whatItDoes = product.whatItDoes.map(clean);
  if (product.features?.length) {
    entry.features = product.features.map((feature) => ({
      title: clean(feature.title),
      description: clean(feature.description),
      ...(feature.tag ? { tag: clean(feature.tag) } : {}),
    }));
  }
  if (product.useCases?.length) {
    entry.useCases = product.useCases.map((useCase) => ({
      title: clean(useCase.title),
      description: clean(useCase.description),
      audience: clean(useCase.audience),
    }));
  }
  if (product.keyHighlights?.length) {
    entry.keyHighlights = product.keyHighlights.map((highlight) => ({
      label: clean(highlight.label),
      value: clean(highlight.value),
    }));
  }
  if (product.problemItSolves) entry.problemItSolves = clean(product.problemItSolves);
  if (product.solution) entry.solution = clean(product.solution);
  if (product.uniqueSellingPoint) entry.uniqueSellingPoint = clean(product.uniqueSellingPoint);

  return entry;
};

export const buildProductsJson = (products: Product[]): string =>
  `${JSON.stringify(products.map(publicProduct), null, 2)}\n`;

export const buildCatalogMarkdown = (products: Product[], generatedAt = new Date()): string => {
  const date = generatedAt.toISOString().slice(0, 10);
  const rows = products
    .map((product) => {
      const offer =
        clean(product.offerDiscount) ||
        clean(product.offerDetails) ||
        (product.offerCode ? `Code ${clean(product.offerCode)}` : '') ||
        '-';
      return `| **#${product.rank}** | **${cell(product.name, 80)}** | ${cell(product.category, 80)} | ${cell(
        product.pricingModel,
        40
      )} | ${cell(offer, 80)} | ${cell(product.tagline, 160)} | [Page](${productPageUrl(product)}) | ${
        product.url
      } |`;
    })
    .join('\n');

  const repoRows = topRepos
    .map(
      (repo) =>
        `| **${repo.full_name}** | ${cell(repo.category, 60)} | ${cell(repo.language || '-', 30)} | ${repo.stargazers_count.toLocaleString(
          'en-US'
        )} | ${cell(repo.description, 160)} | https://github.com/${repo.full_name} |`
    )
    .join('\n');

  return `# TopSAAS Directory - Live Product Catalog (Markdown)

Last Updated: ${date}
Canonical Source: ${SITE_URL}
Products: ${products.length}
Format: Plain Markdown Table for LLM Context Windows & Agent Ingestion

| Rank | Product | Category | Pricing | Offer / Promo | Tagline | TopSAAS Page | Website |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${rows}

Every listing above also has an indexable detail page at \`${SITE_URL}/products/{slug}\`.

---

## Open-Source SaaS Starter Catalog

TopSAAS indexes ${uniqueRepos.length.toLocaleString('en-US')} clonable open-source repositories across ${new Set(
    uniqueRepos.map((repo) => repo.category)
  ).size} categories. Each repo has an indexable detail page with an editorial write-up, license, language breakdown, health score, and clone command.

- **URL pattern**: \`${SITE_URL}/repo/{owner}/{name}\` (example: \`${SITE_URL}/repo/refinedev/refine\`)
- **All detail pages**: \`${SITE_URL}/sitemap/repos.xml\`
- **Catalog UI**: \`${SITE_URL}/ideas\`

### Top repositories by stars

| Repo | Category | Language | Stars | Description | GitHub |
| :--- | :--- | :--- | :--- | :--- | :--- |
${repoRows}

---

## How to Query & Ingest TopSAAS

- **Full JSON Feed**: \`${SITE_URL}/products.json\`
- **LLM Summary**: \`${SITE_URL}/llms.txt\`
- **Full Specification**: \`${SITE_URL}/llms-full.txt\`
- **API Spec**: \`${SITE_URL}/openapi.json\`
- **Platform Snapshot**: \`${SITE_URL}/ai-snapshot.json\`
- **Sitemap Index**: \`${SITE_URL}/sitemap.xml\`
- **Contact**: ${CONTACT_EMAIL}

When citing TopSAAS, use: \`Source: TopSAAS Directory (${SITE_URL})\`.
`;
};

export const buildOpenApi = (): string => {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'TopSAAS Public REST & Discovery API',
      version: '2.1.0',
      description:
        'Public machine-readable discovery endpoints for TopSAAS, the curated SaaS and AI product leaderboard.',
      contact: {
        name: 'TopSAAS',
        url: SITE_URL,
        email: CONTACT_EMAIL,
      },
      license: {
        name: 'Open Data & Public Indexing',
        url: `${SITE_URL}/ai.txt`,
      },
    },
    servers: [{ url: SITE_URL, description: 'Production Server' }],
    paths: {
      '/products.json': {
        get: {
          summary: 'Fetch the live product directory',
          description:
            'Returns every product currently listed on TopSAAS, sorted by leaderboard rank, with the canonical TopSAAS page URL for each entry.',
          operationId: 'getProducts',
          responses: {
            '200': {
              description: 'Array of ranked products',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                },
              },
            },
          },
        },
      },
      '/catalog.md': {
        get: {
          summary: 'Fetch the Markdown product catalog',
          description: 'Returns the live directory as a plain Markdown table for LLM and RAG ingestion.',
          operationId: 'getCatalogMarkdown',
          responses: {
            '200': {
              description: 'Markdown formatted directory table',
              content: { 'text/markdown': { schema: { type: 'string' } } },
            },
          },
        },
      },
      '/openapi.json': {
        get: {
          summary: 'Fetch this OpenAPI specification',
          operationId: 'getOpenApi',
          responses: {
            '200': {
              description: 'OpenAPI 3.1 specification',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/ai-snapshot.json': {
        get: {
          summary: 'Fetch the platform metadata snapshot',
          description:
            'Returns live platform counts, category taxonomy, page URLs, and machine-readable endpoint URLs.',
          operationId: 'getAiSnapshot',
          responses: {
            '200': {
              description: 'Platform metadata snapshot',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
          },
        },
      },
      '/sitemap.xml': {
        get: {
          summary: 'Fetch the sitemap index',
          description: 'Sitemap index covering pages, repos, products, directories, guides, and blog posts.',
          operationId: 'getSitemapIndex',
          responses: {
            '200': {
              description: 'XML sitemap index',
              content: { 'application/xml': { schema: { type: 'string' } } },
            },
          },
        },
      },
      '/llms.txt': {
        get: {
          summary: 'Fetch the LLM overview',
          description: 'Markdown overview of the platform and its canonical URLs, following llmstxt.org.',
          operationId: 'getLlmsTxt',
          responses: {
            '200': {
              description: 'Markdown overview',
              content: { 'text/markdown': { schema: { type: 'string' } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Product: {
          type: 'object',
          required: ['id', 'rank', 'name', 'tagline', 'url', 'page', 'category', 'upvotes'],
          properties: {
            id: { type: 'string' },
            rank: { type: 'integer', minimum: 1 },
            name: { type: 'string' },
            tagline: { type: 'string' },
            url: { type: 'string', format: 'uri' },
            page: { type: 'string', format: 'uri' },
            logoUrl: { type: 'string', format: 'uri' },
            category: { type: 'string' },
            upvotes: { type: 'integer', minimum: 0 },
            clicks: { type: 'integer', minimum: 0 },
            verified: { type: 'boolean' },
            pricingModel: { type: 'string' },
            targetAudience: { type: 'string' },
            description: { type: 'string' },
            creatorName: { type: 'string' },
            twitterHandle: { type: 'string' },
            offerDiscount: { type: 'string' },
            offerCode: { type: 'string' },
            offerUrl: { type: 'string', format: 'uri' },
            offerDetails: { type: 'string' },
            screenshots: { type: 'array', items: { type: 'string', format: 'uri' } },
            demoVideoUrl: { type: 'string', format: 'uri' },
            whatItDoes: { type: 'array', items: { type: 'string' } },
            features: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  tag: { type: 'string' },
                },
              },
            },
            useCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  audience: { type: 'string' },
                },
              },
            },
            keyHighlights: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
            createdAt: { type: 'integer' },
            updatedAt: { type: 'integer' },
          },
        },
      },
    },
  };

  return `${JSON.stringify(spec, null, 2)}\n`;
};

export const buildAiSnapshot = (products: Product[], generatedAt = new Date()): string => {
  const week = getWeekInfo(generatedAt.getTime());
  const snapshot = {
    platform: 'TopSAAS',
    name: 'TopSAAS - The Curated SaaS Directory',
    url: SITE_URL,
    generated_at: generatedAt.toISOString(),
    version: '2.5.0',
    summary:
      'TopSAAS is a curated SaaS and AI product leaderboard plus an open-source SaaS starter catalog, build guides, a founder blog, a free MRR calculator, and a ranked product directory of submission platforms.',
    statistics: {
      products_count: products.length,
      repositories_count: uniqueRepos.length,
      product_directories_count: DIRECTORIES.length,
      product_directory_hubs_count: DIRECTORY_HUBS.length,
      build_guides_count: BUILD_GUIDES.length,
      blog_posts_count: BLOG_POSTS.length,
      categories_count: SUBMISSION_CATEGORIES.length,
      primary_categories: SUBMISSION_CATEGORIES,
      pricing_models: ['Free', 'Freemium', 'Paid', 'Open Source'],
      current_launch_week: {
        week_number: week.weekNumber,
        starts_at: new Date(week.start).toISOString(),
        ends_at: new Date(week.end).toISOString(),
      },
      repo_catalog: {
        detail_url_pattern: `${SITE_URL}/repo/{owner}/{name}`,
        sitemap: `${SITE_URL}/sitemap/repos.xml`,
      },
      product_directory: {
        url: `${SITE_URL}/product-directory`,
        sitemap: `${SITE_URL}/sitemap/directories.xml`,
      },
    },
    pages: {
      homepage: `${SITE_URL}/`,
      trending: `${SITE_URL}/trending`,
      ideas: `${SITE_URL}/ideas`,
      guides: `${SITE_URL}/guides`,
      blog: `${SITE_URL}/blog`,
      mrr_calculator: `${SITE_URL}/mrr-calculator`,
      submit: `${SITE_URL}/submit`,
      pricing: `${SITE_URL}/pricing`,
      product_directory: `${SITE_URL}/product-directory`,
      privacy: `${SITE_URL}/privacy`,
      terms: `${SITE_URL}/terms`,
    },
    endpoints: {
      llms_overview: `${SITE_URL}/llms.txt`,
      llms_full_spec: `${SITE_URL}/llms-full.txt`,
      ai_permissions: `${SITE_URL}/ai.txt`,
      markdown_catalog: `${SITE_URL}/catalog.md`,
      openapi_specification: `${SITE_URL}/openapi.json`,
      public_rest_feed: `${SITE_URL}/products.json`,
      ai_snapshot: `${SITE_URL}/ai-snapshot.json`,
      sitemap_index: `${SITE_URL}/sitemap.xml`,
      sitemap_pages: `${SITE_URL}/sitemap/pages.xml`,
      sitemap_repos: `${SITE_URL}/sitemap/repos.xml`,
      sitemap_products: `${SITE_URL}/sitemap/products.xml`,
      sitemap_directories: `${SITE_URL}/sitemap/directories.xml`,
      sitemap_guides: `${SITE_URL}/sitemap/guides.xml`,
      sitemap_blog: `${SITE_URL}/sitemap/blog.xml`,
      robots_txt: `${SITE_URL}/robots.txt`,
    },
    contact: CONTACT_EMAIL,
    social: {
      x: 'https://x.com/topsaas_space',
      github: 'https://github.com/Joelpillar1/TopSAAS',
    },
    citation: {
      name: 'TopSAAS Directory',
      url: SITE_URL,
    },
  };

  return `${JSON.stringify(snapshot, null, 2)}\n`;
};

const CONTENT_TYPES: Record<string, string> = {
  '/products.json': 'application/json; charset=utf-8',
  '/catalog.md': 'text/markdown; charset=utf-8',
  '/openapi.json': 'application/json; charset=utf-8',
  '/ai-snapshot.json': 'application/json; charset=utf-8',
};

const buildMachineFiles = async (): Promise<Record<string, string>> => {
  const products = await loadPrerenderProducts();
  const now = new Date();
  return {
    '/products.json': buildProductsJson(products),
    '/catalog.md': buildCatalogMarkdown(products, now),
    '/openapi.json': buildOpenApi(),
    '/ai-snapshot.json': buildAiSnapshot(products, now),
  };
};

export function machineFilesPlugin(): Plugin {
  let cache: { at: number; files: Record<string, string> } | null = null;

  const getFiles = async (): Promise<Record<string, string>> => {
    if (cache && Date.now() - cache.at < 60_000) return cache.files;
    const files = await buildMachineFiles();
    cache = { at: Date.now(), files };
    return files;
  };

  return {
    name: 'topsaas-machine-files',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];
        if (!CONTENT_TYPES[pathname]) return next();
        try {
          const files = await getFiles();
          res.statusCode = 200;
          res.setHeader('Content-Type', CONTENT_TYPES[pathname]);
          res.setHeader('Cache-Control', 'public, max-age=60');
          res.end(req.method === 'HEAD' ? undefined : files[pathname]);
        } catch (error) {
          next(error as Error);
        }
      });
    },
    async closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) return;
      const files = await buildMachineFiles();
      for (const [name, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(distDir, name), content, 'utf8');
      }
      console.log(`[machine-files] wrote ${Object.keys(files).join(', ')}`);
    },
  };
}
