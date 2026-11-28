import type { Product } from '../types';
import type { BuildGuide } from '../data/buildGuides';
import type { BlogPost } from '../data/blogPosts';
import { getProductSlug } from './slug';
import { stripMarkup } from './plainCopy';

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
    'TopSAAS - Curated Directory of Modern SaaS & AI Tools',
    'Discover modern SaaS products and AI tools on a community-ranked directory. Verified launches, weekly spotlights, and open-source starters.',
    `${SITE_URL}/`
  );

export const trendingSeo = (): SeoCopy =>
  copy(
    'Trending Open Source Repos: Fastest-Growing | TopSAAS',
    'See which open-source projects are trending now. Ranked by star velocity and recent GitHub activity across 23 categories, with health scores and repo details.',
    `${SITE_URL}/trending`
  );

export const ideasSeo = (total: number): SeoCopy => {
  const count = total.toLocaleString('en-US');
  return copy(
    `SaaS Ideas: ${count} open-source projects to build on | TopSAAS`,
    `Browse ${count} curated open-source repositories for building SaaS: starters, auth, billing, analytics, AI and infrastructure.`,
    `${SITE_URL}/ideas`
  );
};

export const guidesSeo = (): SeoCopy =>
  copy(
    'Build Guides: Ship Real SaaS on Open Source | TopSAAS',
    'Step-by-step build guides for refine, n8n, and create-t3-app. Copy-paste commands, production checklists, repo health scores, and a clear path to launch.',
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
    'SaaS MRR Calculator: Free Recurring Revenue Tool | TopSAAS',
    'Calculate SaaS MRR and ARR instantly from revenue per customer and paying customers. Includes formulas, worked examples, annual plans, and an FAQ.',
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
    'Explore TopSAAS launch plans: free submission or the $9 Verified Launch with a dofollow backlink, verified badge, and AI search inclusion.',
    `${SITE_URL}/pricing`
  );

export const productSeo = (product: Product): SeoCopy => {
  const tagline = stripMarkup(product.tagline || '');
  const description = stripMarkup(
    product.description || product.tagline || `${product.name} is a modern SaaS tool listed on TopSAAS.`
  )
    .slice(0, 160)
    .trim();

  const brand = ' | TopSAAS';
  const maxLen = 60;
  let title = `${product.name}${brand}`;
  const budget = maxLen - title.length;
  if (budget >= 10 && tagline) {
    const trimmed = tagline.slice(0, budget - 3).replace(/\s+\S*$/, '').trim();
    if (trimmed) {
      title = `${product.name} - ${trimmed}${brand}`;
    }
  } else if (budget >= 18 && !tagline) {
    title = `${product.name} - SaaS Tool${brand}`;
  }
  if (title.length > maxLen) {
    const labelBudget = Math.max(10, maxLen - brand.length);
    title = `${product.name.slice(0, labelBudget).trim()}${brand}`;
  }

  return copy(title, description, `${SITE_URL}/products/${getProductSlug(product)}`);
};

export const blogSeo = (): SeoCopy =>
  copy(
    'SaaS Launch Playbooks, High-DR Backlinks & Growth Tactics | TopSAAS',
    'Actionable, data-backed playbooks for solo founders and engineering teams: launch mechanics, verified directory distribution, open-source boilerplates, and scaling to $10k+ MRR.',
    `${SITE_URL}/blog`
  );

export const blogPostSeo = (post: BlogPost): SeoCopy =>
  copy(
    post.seoTitle || `${post.title} | TopSAAS Blog`,
    post.tagline.slice(0, 158),
    `${SITE_URL}/blog/${post.slug}`
  );

export const privacySeo = (): SeoCopy =>
  copy(
    'Privacy Policy: How TopSAAS Handles Your Data',
    'How TopSAAS collects, uses, stores, and protects your data, including account, submission, payment, and local storage information, plus your deletion rights.',
    `${SITE_URL}/privacy`
  );

export const termsSeo = (): SeoCopy =>
  copy(
    'Terms of Service: Rules for Using TopSAAS',
    'The rules for using TopSAAS: directory submission guidelines, fair play and anti-cheat policy, featured spot terms, intellectual property, and liability.',
    `${SITE_URL}/terms`
  );
