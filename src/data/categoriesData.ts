import { Category, Product, SUBMISSION_CATEGORIES } from '../types';
import { CuratedRepo, RepoCategory } from './curatedRepos';
import { DIRECTORY_REPOS } from './repoCatalog';

export const DIRECTORY_CATEGORIES: Category[] = SUBMISSION_CATEGORIES;

export const SAAS_IDEA_CATEGORIES: Exclude<RepoCategory, 'All'>[] = [
  'SaaS Starters',
  'Auth & Identity',
  'Databases',
  'AI & ML',
  'DevOps & Infra',
  'UI Components',
  'CMS & Content',
  'Payments & Billing',
  'Analytics',
  'Email & Communication',
  'Deployment',
  'Mobile',
  'API & Backend',
  'Monitoring',
  'Forms & Surveys',
  'Search',
  'File Storage',
  'Design & UI',
  'Productivity',
  'Utilities',
  'Privacy & Security',
  'Education',
  'Lists',
];

export interface DirectoryCategoryPreview {
  category: Category;
  totalCount: number;
  topProducts: Product[];
}

export interface IdeaCategoryPreview {
  category: Exclude<RepoCategory, 'All'>;
  totalCount: number;
  topRepos: CuratedRepo[];
}

/**
 * Groups directory products by category, returning total count and top 4 products sorted by upvotes.
 */
export function getDirectoryCategoryPreviews(products: Product[] = []): DirectoryCategoryPreview[] {
  return DIRECTORY_CATEGORIES.map((category) => {
    const target = category.toLowerCase();
    const matching = products.filter((p) => {
      if (!p.category) return false;
      if (p.category === category) return true;
      return p.category
        .split(',')
        .map((c) => c.trim().toLowerCase())
        .includes(target);
    });
    const sorted = [...matching].sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
    return {
      category,
      totalCount: matching.length,
      topProducts: sorted.slice(0, 4),
    };
  }).sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Groups DIRECTORY_REPOS by RepoCategory, returning total count and top 4 repos sorted by stars.
 */
export function getIdeaCategoryPreviews(): IdeaCategoryPreview[] {
  return SAAS_IDEA_CATEGORIES.map((category) => {
    const matching = DIRECTORY_REPOS.filter((r) => r.category === category);
    const sorted = [...matching].sort((a, b) => b.stargazers_count - a.stargazers_count);
    return {
      category,
      totalCount: matching.length,
      topRepos: sorted.slice(0, 4),
    };
  }).sort((a, b) => b.totalCount - a.totalCount);
}

/**
 * Calculates live product counts per Directory category.
 */
export function getDirectoryCategoryCounts(products: Product[] = []): Record<string, number> {
  const counts: Record<string, number> = {};

  products.forEach((p) => {
    if (!p.category) return;
    const parts = p.category.split(',').map((c) => c.trim().toLowerCase());
    parts.forEach((cat) => {
      counts[cat] = (counts[cat] || 0) + 1;
    });
  });

  return counts;
}

/**
 * Calculates live repo counts per Open Source SaaS Idea category.
 */
export function getIdeaCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  DIRECTORY_REPOS.forEach((repo) => {
    const key = repo.category.toLowerCase();
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}
