import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Layers, Code2, Triangle, Star } from 'lucide-react';
import { Category, Product } from '../types';
import { RepoCategory } from '../data/curatedRepos';
import {
  DIRECTORY_CATEGORIES,
  SAAS_IDEA_CATEGORIES,
  getDirectoryCategoryPreviews,
  getIdeaCategoryPreviews,
} from '../data/categoriesData';
import { ProductLogo } from './ProductLogo';
import { VerifiedBadge } from './VerifiedBadge';
import { getProductSlug } from '../utils/slug';
import { getWebsiteFavicon } from '../utils/logo';
import { formatStars } from '../utils/github';
import { applyPageSeo } from '../utils/pageSeo';
import { playSound } from '../utils/sound';
import { navigateTo } from '../utils/nav';

interface CategoriesPageProps {
  products?: Product[];
  soundEnabled?: boolean;
  onSelectCategory?: (category: Category) => void;
  onSelectIdeaCategory?: (category: RepoCategory) => void;
}

const CATEGORIES_FAQS = [
  {
    q: 'What is included in TopSAAS Directory Categories?',
    a: `TopSAAS organizes launched SaaS products, AI tools, and indie software across ${DIRECTORY_CATEGORIES.length} directory categories—including AI Tools, Developer Tools, Productivity, SaaS & Indie, Marketing & SEO, and Finance & Fintech. Clicking any category opens the live directory filtered to that niche.`,
  },
  {
    q: 'What are Open Source SaaS Idea Categories?',
    a: `Open Source SaaS Idea Categories group 3,800+ curated GitHub repositories across ${SAAS_IDEA_CATEGORIES.length} technical verticals such as SaaS Starters, Auth & Identity, Databases, AI & ML, DevOps & Infra, and Payments & Billing so founders can inspect star counts, health scores, and self-hosting options.`,
  },
  {
    q: 'How do I browse products or repositories in a specific category?',
    a: 'Click any product, repository, or "See all" category link on this page to jump straight to the listing or filtered catalog.',
  },
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  products = [],
  soundEnabled = true,
  onSelectCategory,
  onSelectIdeaCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'directory' | 'ideas'>('all');

  useEffect(() => {
    const siteUrl = 'https://www.topsaas.space';
    return applyPageSeo({
      title: 'SaaS Directory & Open Source Idea Categories | TopSAAS',
      description:
        'Explore 28 SaaS product directory categories and 23 open-source SaaS idea categories on TopSAAS. Jump directly to curated tools, verified launches, and clonable starter codebases.',
      canonical: `${siteUrl}/categories`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `${siteUrl}/categories#webpage`,
            url: `${siteUrl}/categories`,
            name: 'SaaS Directory & Open Source Idea Categories | TopSAAS',
            description:
              'Explore curated SaaS products and open-source SaaS starter codebases organized by category.',
            isPartOf: { '@id': `${siteUrl}/#website` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
              { '@type': 'ListItem', position: 2, name: 'Categories', item: `${siteUrl}/categories` },
            ],
          },
          {
            '@type': 'ItemList',
            name: 'SaaS Directory Categories',
            numberOfItems: DIRECTORY_CATEGORIES.length,
            itemListElement: DIRECTORY_CATEGORIES.map((cat, idx) => ({
              '@type': 'ListItem',
              position: idx + 1,
              name: cat,
              url: `${siteUrl}/?category=${encodeURIComponent(cat)}`,
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
              url: `${siteUrl}/ideas?category=${encodeURIComponent(cat)}`,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: CATEGORIES_FAQS.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
              },
            })),
          },
        ],
      },
    });
  }, []);

  const directoryPreviews = useMemo(() => getDirectoryCategoryPreviews(products), [products]);
  const ideaPreviews = useMemo(() => getIdeaCategoryPreviews(), []);

  const handleDirectoryCategoryClick = (category: Category) => {
    playSound('click', soundEnabled);
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      navigateTo(`/?category=${encodeURIComponent(category)}`);
    }
  };

  const handleIdeaCategoryClick = (category: RepoCategory) => {
    playSound('click', soundEnabled);
    if (onSelectIdeaCategory) {
      onSelectIdeaCategory(category);
    } else {
      navigateTo(`/ideas?category=${encodeURIComponent(category)}`);
    }
  };

  const filteredDirectory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = directoryPreviews.filter((item) => item.totalCount > 0 || q.length > 0);
    if (!q) return list;
    return list.filter(
      (item) =>
        item.category.toLowerCase().includes(q) ||
        item.topProducts.some((p) => p.name.toLowerCase().includes(q))
    );
  }, [directoryPreviews, searchQuery]);

  const emptyDirectoryCategories = useMemo(() => {
    if (searchQuery.trim()) return [];
    return directoryPreviews.filter((item) => item.totalCount === 0);
  }, [directoryPreviews, searchQuery]);

  const filteredIdeas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ideaPreviews;
    return ideaPreviews.filter(
      (item) =>
        item.category.toLowerCase().includes(q) ||
        item.topRepos.some((r) => r.name.toLowerCase().includes(q))
    );
  }, [ideaPreviews, searchQuery]);

  const showDirectory = activeTab === 'all' || activeTab === 'directory';
  const showIdeas = activeTab === 'all' || activeTab === 'ideas';
  const totalResults =
    (showDirectory ? filteredDirectory.length : 0) + (showIdeas ? filteredIdeas.length : 0);

  return (
    <div className="w-full font-sans pt-4 sm:pt-6 pb-8 space-y-8">
      {/* ── Page Header / Hero ── */}
      <header className="space-y-3 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-950">
          SaaS Directory &amp; Open Source Idea Categories
        </h1>
        <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed mx-auto">
          Discover launched SaaS products and clonable open-source starter codebases by niche. Preview the top tools in each category or jump straight to the full list.
        </p>

        {/* Interactive Search Bar */}
        <div className="pt-2">
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter categories or tools (e.g. AI Tools, SaaS Starters)..."
              aria-label="Filter directory and open-source SaaS idea categories"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200/80 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Section Filter Tabs */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {[
            { key: 'all', label: 'All Categories' },
            { key: 'directory', label: 'Directory Categories' },
            { key: 'ideas', label: 'Open Source SaaS Ideas' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setActiveTab(tab.key as 'all' | 'directory' | 'ideas');
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-neutral-950 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-950'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ── Empty State when Search Matches Nothing ── */}
      {totalResults === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50 p-10 text-center space-y-3">
          <Search className="h-7 w-7 text-neutral-400 mx-auto" />
          <h3 className="text-base font-bold text-neutral-900">No categories found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No directory or open-source idea categories matched &ldquo;{searchQuery}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="btn-secondary px-4 py-2 text-xs font-bold rounded-xl border border-neutral-200 shadow-2xs cursor-pointer"
          >
            Reset Search
          </button>
        </div>
      )}

      {/* ── Directory Categories Section (2-col preview grid) ── */}
      {showDirectory && filteredDirectory.length > 0 && (
        <section aria-labelledby="directory-categories-heading" className="space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-neutral-500" />
              <h2 id="directory-categories-heading" className="text-xs font-bold tracking-wider text-neutral-900 uppercase">
                Directory Categories
              </h2>
            </div>
            <span className="text-neutral-400 text-xs font-medium">
              {DIRECTORY_CATEGORIES.length} categories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {filteredDirectory.map((group) => (
              <div key={group.category} className="flex flex-col justify-between space-y-2">
                <div>
                  {/* Category Header */}
                  <div className="flex items-baseline justify-between border-b border-neutral-200/90 pb-2">
                    <a
                      href={`/?category=${encodeURIComponent(group.category)}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        handleDirectoryCategoryClick(group.category);
                      }}
                      className="text-base sm:text-lg font-bold text-neutral-950 hover:text-blue-600 transition-colors truncate"
                    >
                      {group.category}
                    </a>
                    <span className="text-xs text-neutral-400 font-medium tabular-nums shrink-0 ml-2">
                      {group.totalCount} {group.totalCount === 1 ? 'listing' : 'listings'}
                    </span>
                  </div>

                  {/* Top 4 Products in Category */}
                  <div className="divide-y divide-neutral-100">
                    {group.topProducts.length === 0 ? (
                      <p className="py-4 text-xs text-neutral-400">
                        No launches in this category yet.
                      </p>
                    ) : (
                      group.topProducts.map((product) => {
                        const slug = getProductSlug(product);
                        const href = `/products/${encodeURIComponent(slug || product.id)}`;
                        return (
                          <a
                            key={product.id}
                            href={href}
                            onClick={(e) => {
                              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                              e.preventDefault();
                              playSound('click', soundEnabled);
                              navigateTo(href);
                            }}
                            className="group flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50/80 -mx-2 px-2 rounded-xl transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ProductLogo
                                src={product.logoUrl || getWebsiteFavicon(product.url, 48)}
                                alt={product.name}
                                width={36}
                                height={36}
                                containerClassName="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200/80 bg-white"
                                className="h-full w-full object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[13px] font-bold text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                                    {product.name}
                                  </span>
                                  {product.verified && <VerifiedBadge size="xs" />}
                                </div>
                                <p className="text-[11.5px] text-neutral-500 truncate leading-snug">
                                  {product.tagline}
                                </p>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 text-xs font-mono-num font-medium text-neutral-500 shrink-0 tabular-nums">
                              <Triangle className="h-2.5 w-2.5 text-neutral-400" />
                              {product.upvotes ?? 0}
                            </span>
                          </a>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Footer "See all X -> Best Category tools" */}
                <div className="pt-2 border-t border-neutral-100">
                  <a
                    href={`/?category=${encodeURIComponent(group.category)}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      handleDirectoryCategoryClick(group.category);
                    }}
                    className="group inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 transition-colors"
                  >
                    <span>
                      See all {group.totalCount} &rarr;
                    </span>
                    <span className="font-normal text-neutral-400 group-hover:text-neutral-600">
                      Best {group.category} tools
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Compact links for categories without listings yet so all 28 remain crawlable */}
          {emptyDirectoryCategories.length > 0 && (
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-[11px] font-semibold text-neutral-400 mb-2">
                More Directory Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {emptyDirectoryCategories.map((item) => (
                  <a
                    key={item.category}
                    href={`/?category=${encodeURIComponent(item.category)}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      handleDirectoryCategoryClick(item.category);
                    }}
                    className="rounded-lg border border-neutral-200 bg-neutral-50/70 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-950 transition-colors"
                  >
                    {item.category}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Open Source SaaS Idea Categories Section (2-col preview grid) ── */}
      {showIdeas && filteredIdeas.length > 0 && (
        <section aria-labelledby="idea-categories-heading" className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-neutral-500" />
              <h2 id="idea-categories-heading" className="text-xs font-bold tracking-wider text-neutral-900 uppercase">
                Open Source SaaS Idea Categories
              </h2>
            </div>
            <span className="text-neutral-400 text-xs font-medium">
              {SAAS_IDEA_CATEGORIES.length} categories
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {filteredIdeas.map((group) => (
              <div key={group.category} className="flex flex-col justify-between space-y-2">
                <div>
                  {/* Category Header */}
                  <div className="flex items-baseline justify-between border-b border-neutral-200/90 pb-2">
                    <a
                      href={`/ideas?category=${encodeURIComponent(group.category)}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                        e.preventDefault();
                        handleIdeaCategoryClick(group.category);
                      }}
                      className="text-base sm:text-lg font-bold text-neutral-950 hover:text-blue-600 transition-colors truncate"
                    >
                      {group.category}
                    </a>
                    <span className="text-xs text-neutral-400 font-medium tabular-nums shrink-0 ml-2">
                      {group.totalCount} {group.totalCount === 1 ? 'repo' : 'repos'}
                    </span>
                  </div>

                  {/* Top 4 Repos in Category */}
                  <div className="divide-y divide-neutral-100">
                    {group.topRepos.map((repo) => {
                      const repoHref = `/repo/${repo.full_name}`;
                      return (
                        <a
                          key={repo.id}
                          href={repoHref}
                          onClick={(e) => {
                            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                            e.preventDefault();
                            playSound('click', soundEnabled);
                            navigateTo(repoHref);
                          }}
                          className="group flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50/80 -mx-2 px-2 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={repo.owner.avatar_url}
                              alt={repo.name}
                              loading="lazy"
                              className="h-9 w-9 shrink-0 rounded-xl object-cover border border-neutral-200/80 bg-neutral-50"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-[13px] font-bold text-neutral-900 group-hover:text-blue-600 transition-colors truncate block">
                                {repo.name}
                              </span>
                              <p className="text-[11.5px] text-neutral-500 truncate leading-snug">
                                {repo.description}
                              </p>
                            </div>
                          </div>

                          <span className="inline-flex items-center gap-1 text-xs font-mono-num font-medium text-neutral-500 shrink-0 tabular-nums">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                            {formatStars(repo.stargazers_count)}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Footer "See all X -> Best Category repos" */}
                <div className="pt-2 border-t border-neutral-100">
                  <a
                    href={`/ideas?category=${encodeURIComponent(group.category)}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                      e.preventDefault();
                      handleIdeaCategoryClick(group.category);
                    }}
                    className="group inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 transition-colors"
                  >
                    <span>
                      See all {group.totalCount} &rarr;
                    </span>
                    <span className="font-normal text-neutral-400 group-hover:text-neutral-600">
                      Best {group.category} repos
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AEO / GEO Frequently Asked Questions ── */}
      <section aria-labelledby="categories-faq-heading" className="pt-4 border-t border-neutral-100 space-y-3">
        <h2 id="categories-faq-heading" className="text-xs font-bold tracking-wider text-neutral-900 uppercase">
          About TopSAAS Categories
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {CATEGORIES_FAQS.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3.5 space-y-1">
              <h3 className="text-xs font-bold text-neutral-900">{faq.q}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
