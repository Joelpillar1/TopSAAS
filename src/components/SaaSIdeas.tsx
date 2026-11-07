import React, { useState, useEffect, useRef } from 'react';
import { Star, GitFork, ExternalLink, ArrowRight, Code2, Filter, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon, Search, Command, X, TrendingUp, BookOpen } from 'lucide-react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { HealthScore } from './HealthScore';
import { getHealth } from '../utils/repoHealth';
import { plainCopy } from '../utils/plainCopy';
import { navigateTo } from '../utils/nav';
import { formatStars } from '../utils/github';
import { Product } from '../types';
import { HeroClaimBanner } from './HeroClaimBanner';
import { BorderBeam } from './BorderBeam';
import { playSound } from '../utils/sound';
import { GridFillerCell, useGridColumns } from './GridFiller';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/grid-pattern';

interface SaaSIdeasProps {
  soundEnabled: boolean;
  topProducts: Product[];
  productsLoaded?: boolean;
  featuredProductId?: string | null;
  featuredProduct: Product | null;
  commentCounts?: Record<string, number>;
  onOpenFeaturedSpotModal?: () => void;
  onClaimFeatured?: () => void;
  onShareProduct: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onUpvote: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
  onOpenRepo?: (repo: CuratedRepo) => void;
  upvotedIds?: Set<string>;
}

const CATEGORIES: RepoCategory[] = [
  'All', 'SaaS Starters', 'Auth & Identity', 'Databases', 'AI & ML',
  'DevOps & Infra', 'UI Components', 'CMS & Content', 'Payments & Billing', 'Analytics',
  'Email & Communication', 'Deployment', 'Mobile', 'API & Backend',
  'Monitoring', 'Forms & Surveys', 'Search', 'File Storage', 'Design & UI',
  'Productivity', 'Utilities', 'Privacy & Security', 'Education', 'Lists',
];

const REPOS_PER_PAGE = 20;

// Compact total-star count for the hero strip (e.g. 6.2M)
const formatTotalStars = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return formatStars(n);
};

export const SaaSIdeas: React.FC<SaaSIdeasProps> = ({
  soundEnabled,
  topProducts,
  productsLoaded = true,
  featuredProductId,
  featuredProduct,
  commentCounts = {},
  onOpenFeaturedSpotModal,
  onClaimFeatured,
  onShareProduct,
  onTrackClick,
  onUpvote,
  onOpenDetail,
  onOpenRepo,
  upvotedIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RepoCategory>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem('topsaas_saas_ideas_layout');
      return saved === 'table' ? 'table' : 'cards';
    } catch {
      return 'cards';
    }
  });
  // Seed the search from ?q= deep links (the SearchAction target in the
  // homepage JSON-LD), so engine site-search results land pre-filtered.
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') ?? '';
    } catch {
      return '';
    }
  });
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const gridColumns = useGridColumns();

  // Ctrl/Cmd + K focuses the ideas search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filteredRepos = (() => {
    let list = selectedCategory === 'All'
      ? CURATED_REPOS
      : CURATED_REPOS.filter((r) => r.category === selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.owner.login.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.language ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  })();

  const totalStars = CURATED_REPOS.reduce((s, r) => s + r.stargazers_count, 0);

  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE);
  const paginatedRepos = filteredRepos.slice(
    (currentPage - 1) * REPOS_PER_PAGE,
    currentPage * REPOS_PER_PAGE
  );

  // Striped cells that complete the last row of the bento grid
  const gridFillerCount = (gridColumns - (paginatedRepos.length % gridColumns)) % gridColumns;

  const handleCategoryChange = (cat: RepoCategory) => {
    playSound('click', soundEnabled);
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleLayoutChange = (layout: 'cards' | 'table') => {
    playSound('click', soundEnabled);
    setViewLayout(layout);
    try {
      localStorage.setItem('topsaas_saas_ideas_layout', layout);
    } catch {}
  };

  const handlePageChange = (page: number) => {
    playSound('click', soundEnabled);
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── Hero: brand statement + search ── */}
      <section className="relative overflow-hidden px-1 pt-6 sm:pt-10" aria-label="Find the best SaaS idea">
        {/* Background: subtle grid pattern matching Directory Hero */}
        <GridPattern
          width={32}
          height={32}
          x={-1}
          y={-1}
          strokeDasharray="3 3"
          squares={[
            [4, 4],
            [5, 1],
            [8, 2],
            [5, 3],
            [5, 5],
            [10, 10],
            [12, 15],
          ]}
          className={cn(
            '[mask-image:radial-gradient(560px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12',
            'fill-neutral-300/30 stroke-neutral-300/40',
          )}
        />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl">
            <span className="whitespace-nowrap">Find your SaaS idea.</span>
            <br />
            <span className="whitespace-nowrap text-neutral-500">Or build one that wins.</span>
          </h1>

          <p className="mt-4 text-sm font-medium text-neutral-400">
            Search a repo or click a card to open it.
          </p>

          {/* Search */}
          <div className="relative mt-7 w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search for a SaaS starter (e.g., 'nextjs', 'auth'…)"
              aria-label="Search open source projects"
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-20 text-sm font-medium text-neutral-900 placeholder-neutral-400 shadow-2xs outline-none transition-all focus:border-mint-500 focus:ring-4 focus:ring-mint-500/10"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-neutral-200 bg-neutral-800 text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 sm:flex">
                <Command className="h-2.5 w-2.5" />
                K
              </span>
            )}
          </div>

          {/* Live strip */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[11px] font-semibold text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              <span className="font-bold text-neutral-500 font-mono-num">{CURATED_REPOS.length}</span> repos
            </span>
            <span className="text-neutral-700">·</span>
            <span>
              <span className="font-bold text-neutral-500 font-mono-num">{CATEGORIES.length - 1}</span> categories
            </span>
            <span className="text-neutral-700">·</span>
            <span>
              <span className="font-bold text-neutral-500 font-mono-num">{formatTotalStars(totalStars)}</span> stars
            </span>
            <span className="text-neutral-700">·</span>
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                navigateTo('/trending');
              }}
              className="inline-flex items-center gap-1 font-bold text-mint-600 hover:text-mint-700 transition-colors cursor-pointer"
            >
              <TrendingUp className="h-3 w-3" />
              Trending
            </button>
            <span className="text-neutral-700">·</span>
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                navigateTo('/guides');
              }}
              className="inline-flex items-center gap-1 font-bold text-mint-600 hover:text-mint-700 transition-colors cursor-pointer"
            >
              <BookOpen className="h-3 w-3" />
              Build guides
            </button>
          </div>
        </div>
      </section>

      {/* Featured Spot Section (Matches Homepage: Custom product / Empty / Default reserve spot placeholder) */}
      {(() => {
        const isDefault = featuredProductId === null || featuredProductId === 'default';
        const isEmpty = featuredProductId === '' || featuredProductId === 'empty';
        const isCustomWebsite = !isDefault && !isEmpty && !!featuredProduct;

        if (isCustomWebsite && featuredProduct) {
          return (
            <section className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-mint-500/15 px-1.5 py-0.5 text-[9px] font-bold text-mint-600 ring-1 ring-inset ring-mint-500/40">
                  <Star className="h-2.5 w-2.5 fill-mint-300" />
                  Featured
                </span>
              </div>
              <HeroClaimBanner
                topProduct={featuredProduct}
                soundEnabled={soundEnabled}
                onTrackClick={onTrackClick}
              />
            </section>
          );
        }

        if (isEmpty) {
          /* Empty state: admin cleared featured, show nothing */
          return null;
        }

        /* Default state: no featured assigned yet, show default reserve spot placeholder with BorderBeam */
        return (
          <BorderBeam size="md" colorVariant="colorful" strength={0.85} className="w-full rounded-2xl">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onOpenFeaturedSpotModal?.();
              }}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 sm:px-5 text-left transition-all hover:border-neutral-300 hover:bg-neutral-50/80 cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50/60 text-blue-600 border border-neutral-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 transition-colors">
                    The featured spot is open <span className="text-emerald-600 font-semibold text-[11px]">(7 days Free)</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium truncate">
                    Put your product at the top of TopSAAS · Seen by every builder who visits
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-[11px] font-bold text-neutral-700 group-hover:border-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Reserve spot
              </span>
            </button>
          </BorderBeam>
        );
      })()}

      {/* Divider */}
      <div className="flex items-center gap-3 px-1">
        <div className="h-px flex-1 bg-neutral-200" />
        <span className="text-[10px] font-bold text-neutral-500">Open source projects</span>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* Category Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Section with Pinned 'All' */}
        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
          {/* Pinned 'All' Button (Stays fixed / does not move) */}
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-neutral-200 mr-1.5">
            <Filter className="h-3 w-3 text-neutral-400 shrink-0" />
            <button
              type="button"
              onClick={() => handleCategoryChange('All')}
              className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                selectedCategory === 'All'
                  ? 'bg-mint-500/15 text-mint-700 ring-1 ring-inset ring-mint-500/40'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'
              }`}
            >
              All
            </button>
          </div>

          {/* Horizontally Scrollable Categories (These move/scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 flex-1 scrollbar-none">
            {CATEGORIES.filter((cat) => cat !== 'All').map((cat) => (                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${
                      selectedCategory === cat
                        ? 'bg-mint-500/15 text-mint-700 ring-1 ring-inset ring-mint-500/40'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'
                    }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* View Layout Switcher (Cards vs Table) */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
          <button
            type="button"
            onClick={() => handleLayoutChange('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'cards'
                ? 'bg-mint-500 text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-950'
            }`}
            title="Card View"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            type="button"
            onClick={() => handleLayoutChange('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'table'
                ? 'bg-mint-500 text-white shadow-2xs'
                : 'text-neutral-500 hover:text-neutral-950'
            }`}
            title="Table View"
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>
      </div>

      {/* Main Repos Content */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-mint-500/15 text-mint-600">
              <Code2 className="h-3 w-3" />
            </div>
            <h2 className="text-xs font-bold text-neutral-950">
              Open Source Projects
            </h2>
            <span className="rounded-md bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-700">
              {filteredRepos.length} repos
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium hidden sm:block">
            Useful for devs, founders & solo builders
          </span>
        </div>

        {filteredRepos.length === 0 ? (
          /* Empty search state */
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center">
            <Code2 className="mx-auto h-8 w-8 text-neutral-700 mb-3" />
            <h3 className="text-base font-bold text-neutral-950">No repos match your search.</h3>
            <p className="text-xs font-medium text-neutral-500 mt-1">
              Try a different keyword or clear the search.
            </p>
          </div>
        ) : viewLayout === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} onOpen={onOpenRepo} soundEnabled={soundEnabled} />
            ))}
            {Array.from({ length: gridFillerCount }).map((_, i) => (
              <GridFillerCell key={`grid-filler-${i}`} />
            ))}
          </div>
        ) : (
          /* Table List View (Styled matching Startup LeaderboardTable) */
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-100 text-[11px] font-bold text-neutral-500">
                    <th className="py-3 px-3.5">Repository</th>
                    <th className="py-3 px-3.5 hidden md:table-cell">Description</th>
                    <th className="py-3 px-3.5 text-right">Stars</th>
                    <th className="py-3 px-3.5 text-right hidden sm:table-cell">Forks</th>
                    <th className="py-3 px-3.5 hidden lg:table-cell">Language</th>
                    <th className="py-3 px-3.5 text-right hidden md:table-cell">Health</th>
                    <th className="py-3 pr-4 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {paginatedRepos.map((repo, idx) => {
                    const isTopThree = currentPage === 1 && idx < 3;
                    const rowHighlightClass = (() => {
                      if (currentPage === 1) {
                        if (idx === 0) return 'bg-gray-50 font-medium hover:bg-gray-100';
                        if (idx === 1) return 'bg-gray-50 hover:bg-gray-100';
                        if (idx === 2) return 'bg-gray-50 hover:bg-gray-100';
                      }
                      return 'hover:bg-gray-50';
                    })();

                    const beamGradientStyle: React.CSSProperties = isTopThree
                      ? {
                          backgroundImage:
                            'linear-gradient(180deg, #ffaa40 0%, #9c40ff 50%, #00d2ff 100%)',
                        }
                      : {};

                    return (
                      <tr
                        key={repo.id}
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          if (target.closest('button, a')) return;
                          playSound('click', soundEnabled);
                          onOpenRepo?.(repo);
                        }}
                        className={`group transition-all duration-300 ease-out cursor-pointer relative hover:translate-x-0.5 ${rowHighlightClass}`}
                      >
                        {/* Repo Name & Owner with top 3 gradient accent */}
                        <td className="py-3 px-3.5 relative">
                          {isTopThree && (
                            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={beamGradientStyle} />
                          )}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={repo.owner.avatar_url}
                              alt={repo.owner.login}
                              className="h-7 w-7 rounded-lg object-cover shrink-0 border border-neutral-200 shadow-2xs transition-all duration-200 group-hover:border-neutral-600 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <a
                                href={`/repo/${repo.full_name}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  playSound('click', soundEnabled);
                                  onOpenRepo?.(repo);
                                }}
                                className="font-bold text-white hover:underline truncate block"
                              >
                                {repo.name}
                              </a>
                              <span className="text-[11px] text-neutral-500 block truncate">
                                {repo.owner.login}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-3.5 hidden md:table-cell max-w-xs text-neutral-400">
                          <p className="line-clamp-1 text-xs">
                            {plainCopy(repo.description) || 'No description yet'}
                          </p>
                        </td>

                        {/* Stars */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="inline-flex items-center gap-1 font-bold text-white font-mono-num">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                            <span>{formatStars(repo.stargazers_count)}</span>
                          </div>
                        </td>

                        {/* Forks */}
                        <td className="py-3 px-3.5 text-right hidden sm:table-cell text-neutral-400 font-mono-num">
                          <div className="inline-flex items-center gap-1">
                            <GitFork className="h-3 w-3 text-neutral-600" />
                            <span>{repo.forks_count}</span>
                          </div>
                        </td>

                        {/* Language & Category */}
                        <td className="py-3 px-3.5 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5">
                            {repo.language && (
                              <span className="rounded-md bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
                                {repo.language}
                              </span>
                            )}
                            <span className="rounded-md bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
                              {repo.category}
                            </span>
                          </div>
                        </td>

                        {/* Health */}
                        <td className="py-3 px-3.5 text-right hidden md:table-cell">
                          {(() => {
                            const h = getHealth(repo.full_name);
                            return h ? <HealthScore score={h.score} band={h.band} /> : <span className="text-neutral-600">-</span>;
                          })()}
                        </td>

                        {/* Action Button */}
                        <td className="py-3 pr-4 pl-2 text-right">
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound('click', soundEnabled);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-neutral-700 hover:bg-mint-500 hover:text-white hover:border-mint-500 transition-all duration-200 active:scale-95"
                          >
                            <span>GitHub</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-all duration-200 hover:border-neutral-300 hover:text-neutral-900 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isFirst = page === 1;
              const isLast = page === totalPages;
              const isNearCurrent = Math.abs(page - currentPage) <= 1;
              if (!isFirst && !isLast && !isNearCurrent) {
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="text-neutral-600 text-xs px-1">…</span>
                  );
                }
                return null;
              }
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                    currentPage === page
                      ? 'bg-mint-500 text-white shadow-2xs'
                      : 'border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-all duration-200 hover:border-neutral-300 hover:text-neutral-900 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="text-[11px] text-neutral-500 font-medium ml-2 hidden sm:block">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const RepoCard: React.FC<{
  repo: CuratedRepo;
  onOpen?: (repo: CuratedRepo) => void;
  soundEnabled: boolean;
}> = ({ repo, onOpen, soundEnabled }) => {
  return (
    <a
      href={`/repo/${repo.full_name}`}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        playSound('click', soundEnabled);
        onOpen?.(repo);
      }}
      className="group relative flex flex-col bg-white p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-[0_4px_20px_-4px_rgba(25,25,24,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60"
    >
      {/* Icon + external link */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-200 group-hover:border-neutral-500 group-hover:scale-105 group-hover:shadow-md">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 text-neutral-500 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:border-neutral-300 group-hover:bg-neutral-900 group-hover:text-white group-hover:scale-105">
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      {/* Title + owner */}
      <h3 className="mt-4 truncate text-[15px] font-bold tracking-tight text-neutral-950 group-hover:text-mint-600 transition-colors">
        {repo.name}
      </h3>
      <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500 group-hover:text-neutral-700 transition-colors">
        {repo.owner.login}
      </p>

      {/* Description */}
      {repo.description && (
        <p className="mt-1.5 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-600 group-hover:text-neutral-800 line-clamp-2 transition-colors">
          {plainCopy(repo.description)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 group-hover:border-neutral-200 pt-3 transition-colors">
        <div className="flex items-center gap-2.5 text-[11px] text-neutral-400">
          {(() => {
            const h = getHealth(repo.full_name);
            return h ? <HealthScore score={h.score} band={h.band} /> : null;
          })()}
          <span className="inline-flex items-center gap-1 group-hover:text-amber-300 transition-colors">
            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
            <span className="font-bold font-mono-num text-neutral-900">{formatStars(repo.stargazers_count)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3 w-3 text-neutral-500 group-hover:text-neutral-700 transition-colors" />
            <span className="font-mono-num">{repo.forks_count}</span>
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          {repo.language && (
            <span className="shrink-0 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10.5px] font-semibold text-neutral-800 transition-colors">
              {repo.language}
            </span>
          )}
        </div>
      </div>
    </a>
  );
};
