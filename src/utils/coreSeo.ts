import type { Product } from '../types';
import type { BuildGuide } from '../data/buildGuides';
import type { BlogPost } from '../data/blogPosts';
import { getProductSlug } from './slug';

/**
 * Head metadata for the hand-built SPA routes. Both the React pages and the
 * build-time prerenderer read these, so the static HTML and the hydrated page
 * can never disagree about a title or canonical.
 */
export const SITE_URL = 'https://www.topsaas.space';

export interface SeoCopy {
  title: string;
  description: string;
  canonical: string;
}

const copy = (title: string, description: string, canonical: string): SeoCopy => ({
  title,
  description,
  canonical,
});

export const homeSeo = (): SeoCopy =>
  copy(
    'TopSAAS — The Curated Directory of Modern SaaS & AI Tools',
    'Discover, compare, and launch modern SaaS products and AI tools. Real-time community leaderboard, verified founder launches, weekly spotlights, and open-source starters.',
    `${SITE_URL}/`
  );

export const trendingSeo = (): SeoCopy =>
  copy(
    'Trending Open Source Projects: Fastest-Growing Repos | TopSAAS',
    'See which open-source projects are trending now. Ranked by star velocity and recent GitHub activity across 23 categories, with health scores and repo details.',
    `${SITE_URL}/trending`
  );

export const guidesSeo = (): SeoCopy =>
  copy(
    'Build Guides: Ship Real SaaS on Open-Source Projects | TopSAAS',
    'Original step-by-step build guides for refine, n8n, and create-t3-app. Copy-paste commands, production checklists, repo health scores, and a clear path to launch.',
    `${SITE_URL}/guides`
  );

export const guideSeo = (guide: BuildGuide): SeoCopy =>
  copy(
    `${guide.title} | TopSAAS Build Guide`,
    guide.tagline.slice(0, 157),
    `${SITE_URL}/guides/${guide.slug}`
  );

export const mrrSeo = (): SeoCopy =>
  copy(
    'SaaS MRR Calculator: Free Monthly Recurring Revenue Tool | TopSAAS',
    'Calculate SaaS MRR and ARR instantly from average revenue per customer and paying customers. Includes formulas, worked examples, annual plan conversion, and an MRR FAQ.',
    `${SITE_URL}/mrr-calculator`
  );

export const submitSeo = (): SeoCopy =>
  copy(
    'Submit & Launch Your Product | TopSAAS',
    'Launch your SaaS product or AI tool on TopSAAS. Instant AI auto-fill, verified community leaderboard, high-authority dofollow backlinks, and weekly spotlights.',
    `${SITE_URL}/submit`
  );

export const pricingSeo = (): SeoCopy =>
  copy(
    'Pricing & Launch Plans | TopSAAS',
    'Explore launch plans on TopSAAS. From free standard submissions to the $5 Verified Launch with permanent dofollow backlink, verified badge, and AI search inclusion.',
    `${SITE_URL}/pricing`
  );

export const productSeo = (product: Product): SeoCopy => {
  const tagline = (product.tagline || '').trim();
  const description = (product.description || product.tagline || `${product.name} is a modern SaaS tool listed on TopSAAS.`)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  return copy(
    tagline ? `${product.name} — ${tagline} | TopSAAS` : `${product.name} — Modern SaaS & AI Tool | TopSAAS`,
    description,
    `${SITE_URL}/products/${getProductSlug(product)}`
  );
};

export const blogSeo = (): SeoCopy =>
  copy(
    'TopSAAS Blog — SaaS Launch Guides, Growth Playbooks & SEO Tactics',
    'Actionable guides, launch checklists, high-DR directory strategies, and open-source stacks for bootstrapped SaaS founders and indie hackers.',
    `${SITE_URL}/blog`
  );

export const blogPostSeo = (post: BlogPost): SeoCopy =>
  copy(
    `${post.title} | TopSAAS Blog`,
    post.tagline.slice(0, 158),
    `${SITE_URL}/blog/${post.slug}`
  );
