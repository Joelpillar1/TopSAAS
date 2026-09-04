import React, { useState, useEffect, useRef } from 'react';
import { Star, GitFork, ExternalLink, Code2, Trophy, Filter, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon, Search, Command, X } from 'lucide-react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { formatStars } from '../utils/github';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { HeroClaimBanner } from './HeroClaimBanner';
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
  upvotedIds?: Set<string>;
}

const CATEGORIES: RepoCategory[] = [
  'All', 'SaaS Starters', 'Auth & Identity', 'Databases', 'AI & ML',
  'DevOps & Infra', 'UI Components', 'CMS & Content', 'Analytics',
  'Email & Communication', 'Deployment', 'Mobile', 'API & Backend',
  'Monitoring', 'Forms & Surveys', 'Search', 'File Storage', 'Design & UI',
];

const REPOS_PER_PAGE = 20;

// Compact total-star count for the hero strip (e.g. 6.2M)
const formatTotalStars = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return formatStars(n);
};

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-[length:200%_100%] rounded ${className}`}
  />
);

const RepoSkeletonCard: React.FC = () => (
  <div className="flex flex-col bg-[#2a2a2a] p-5 h-full">
    <div className="flex items-start justify-between">
      <Shimmer className="h-11 w-11 rounded-lg shrink-0" />
      <Shimmer className="h-3.5 w-3.5 rounded" />
    </div>
    <div className="mt-4 space-y-1.5">
      <Shimmer className="h-4 w-28 rounded" />
      <Shimmer className="h-3 w-16 rounded" />
    </div>
    <div className="space-y-1.5 my-1 flex-1">
      <Shimmer className="h-3 w-full rounded" />
      <Shimmer className="h-3 w-4/5 rounded" />
    </div>
    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-neutral-800">
      <div className="flex items-center gap-2.5">
        <Shimmer className="h-3.5 w-12 rounded" />
        <Shimmer className="h-3.5 w-10 rounded" />
      </div>
      <Shimmer className="h-4 w-14 rounded-md" />
    </div>
  </div>
);

const RepoSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-800 animate-pulse">
    <td className="px-3 py-3">
      <div className="flex items-center gap-2.5">
        <Shimmer className="h-7 w-7 rounded-lg shrink-0" />
        <div className="space-y-1">
          <Shimmer className="h-3.5 w-24 rounded" />
          <Shimmer className="h-2.5 w-14 rounded" />
        </div>
      </div>
    </td>
    <td className="px-3 py-3 hidden md:table-cell">
      <Shimmer className="h-3 w-48 rounded" />
    </td>
    <td className="px-3 py-3 text-right">
      <Shimmer className="h-3.5 w-12 rounded ml-auto" />
    </td>
    <td className="px-3 py-3 text-right hidden sm:table-cell">
      <Shimmer className="h-3.5 w-8 rounded ml-auto" />
    </td>
    <td className="px-3 py-3 hidden lg:table-cell">
      <Shimmer className="h-4 w-16 rounded" />
    </td>
    <td className="px-3 py-3 text-right">
      <Shimmer className="h-6 w-14 rounded-lg ml-auto" />
    </td>
  </tr>
);

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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const gridColumns = useGridColumns();

  // On initial mount / reload, show skeleton shimmer briefly
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

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
    setIsLoading(true);
    setSelectedCategory(cat);
    setCurrentPage(1);
    setTimeout(() => {
      setIsLoading(false);
    }, 180);
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
            'fill-neutral-800/60 stroke-neutral-800/50',
          )}
        />
        <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
          <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
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
              aria-label="Search SaaS ideas"
              className="w-full rounded-xl border border-neutral-700 bg-[#343434] py-3 pl-11 pr-20 text-sm font-medium text-neutral-100 placeholder-neutral-500 shadow-2xs outline-none transition-all focus:border-mint-500/70 focus:ring-4 focus:ring-mint-500/10"
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
                className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            ) : (
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 sm:flex">
                <Command className="h-2.5 w-2.5" />
                K
              </span>
            )}
          </div>

          {/* Live strip */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[11px] font-semibold text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
              <span className="font-bold text-neutral-300 font-mono-num">{CURATED_REPOS.length}</span> repos
            </span>
            <span className="text-neutral-700">·</span>
            <span>
              <span className="font-bold text-neutral-300 font-mono-num">{CATEGORIES.length - 1}</span> categories
            </span>
            <span className="text-neutral-700">·</span>
            <span>
              <span className="font-bold text-neutral-300 font-mono-num">{formatTotalStars(totalStars)}</span> stars
            </span>
          </div>
        </div>
      </section>

      {/* Featured Spot Section (Matches Homepage Exactly) */}
      {featuredProductId && featuredProduct ? (
        <section className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-mint-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-mint-300 ring-1 ring-inset ring-mint-500/40">
              <Star className="h-2.5 w-2.5 fill-mint-300" />
              Featured
            </span>
            <span className="text-[10px] font-semibold text-neutral-500">30-day spotlight · hand-selected by TopSAAS</span>
          </div>
          <HeroClaimBanner
            topProduct={featuredProduct}
            soundEnabled={soundEnabled}
            onTrackClick={onTrackClick}
          />
        </section>
      ) : featuredProductId === '' ? (
        /* Empty state: admin cleared featured, show nothing */
        null
      ) : (
        /* Default state: no featured assigned yet, show upsell */
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onOpenFeaturedSpotModal?.();
          }}
          className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-neutral-700 bg-[#2a2a2a] px-4 py-3.5 sm:px-5 text-left transition-all hover:border-mint-500/50 hover:bg-[#333333] cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 group-hover:bg-mint-500 group-hover:text-[#0b0f14] transition-colors">
              <Star className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-300 group-hover:text-white transition-colors">
                The featured spot is open
              </p>
              <p className="text-[11px] text-neutral-500 font-medium truncate">
                Put your product at the top of TopSAAS for 30 days.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-lg border border-neutral-700 bg-[#343434] px-3 py-1.5 text-[11px] font-bold text-white group-hover:border-mint-500 group-hover:text-mint-200 shadow-2xs">
            Reserve spot
          </span>
        </button>
      )}

      {/* Top 3 Featured Products */}
      {!productsLoaded && topProducts.length === 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-mint-500/15 text-mint-300">
              <Trophy className="h-3 w-3 fill-mint-300 stroke-mint-300" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              Top 3 on TopSAAS
            </h2>
            <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-300">
              curated ranking
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 animate-pulse flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-neutral-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 rounded bg-neutral-800" />
                    <div className="h-3 w-44 rounded bg-neutral-800" />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-800 pt-3">
                  <div className="h-3.5 w-16 rounded bg-neutral-800" />
                  <div className="h-6 w-14 rounded-full bg-neutral-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : topProducts.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-mint-500/15 text-mint-300">
              <Trophy className="h-3 w-3 fill-mint-300 stroke-mint-300" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              Top 3 on TopSAAS
            </h2>
            <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-300">
              curated ranking
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {topProducts.slice(0, 3).map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                rank={product.rank ?? index + 1}
                soundEnabled={soundEnabled}
                showVerified={(product.rank ?? index + 1) <= 5}
                commentCount={commentCounts?.[product.id] ?? 0}
                onShareProduct={onShareProduct}
                onTrackClick={onTrackClick}
                onOpenDetail={onOpenDetail}
                onUpvote={onUpvote}
                upvoted={!!upvotedIds?.has(product.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Divider */}
      {(topProducts.length > 0 || !productsLoaded) && (
        <div className="flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-neutral-800" />
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Open Source Ideas</span>
          <div className="h-px flex-1 bg-neutral-800" />
        </div>
      )}

      {/* Category Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Filter Section with Pinned 'All' */}
        <div className="flex items-center min-w-0 flex-1 overflow-hidden">
          {/* Pinned 'All' Button (Stays fixed / does not move) */}
          <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-neutral-800 mr-1.5">
            <Filter className="h-3 w-3 text-neutral-400 shrink-0" />
            <button
              type="button"
              onClick={() => handleCategoryChange('All')}
              className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-mint-500/15 text-mint-200 ring-1 ring-inset ring-mint-500/40'
                  : 'bg-[#343434] text-neutral-400 hover:bg-[#3a3a3a] hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Horizontally Scrollable Categories (These move/scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 flex-1 scrollbar-none">
            {CATEGORIES.filter((cat) => cat !== 'All').map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-mint-500/15 text-mint-200 ring-1 ring-inset ring-mint-500/40'
                    : 'bg-[#343434] text-neutral-400 hover:bg-[#3a3a3a] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* View Layout Switcher (Cards vs Table) */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-[#2a2a2a] p-1 rounded-xl border border-neutral-800 shadow-2xs">
          <button
            type="button"
            onClick={() => handleLayoutChange('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'cards'
                ? 'bg-[#3a3a3a] text-white shadow-2xs'
                : 'text-neutral-400 hover:text-white'
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
                ? 'bg-[#3a3a3a] text-white shadow-2xs'
                : 'text-neutral-400 hover:text-white'
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
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-mint-500/15 text-mint-300">
              <Code2 className="h-3 w-3" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-white">
              Open Source SaaS Ideas
            </h2>
            <span className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-300">
              {filteredRepos.length} repos
            </span>
          </div>
          <span className="text-[11px] text-neutral-500 font-medium hidden sm:block">
            Useful for devs, founders & solo builders
          </span>
        </div>

        {/* Loading State: Skeleton Loaders */}
        {isLoading ? (
          viewLayout === 'cards' ? (
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: gridColumns * 2 }).map((_, i) => (
                <RepoSkeletonCard key={i} />
              ))}
              {Array.from({ length: (gridColumns - ((gridColumns * 2) % gridColumns)) % gridColumns }).map((_, i) => (
                <GridFillerCell key={`skeleton-filler-${i}`} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#2a2a2a] shadow-xs transition-all">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-[#343434] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      <th className="py-3 px-3.5">Repository</th>
                      <th className="py-3 px-3.5 hidden md:table-cell">Description</th>
                      <th className="py-3 px-3.5 text-right">Stars</th>
                      <th className="py-3 px-3.5 text-right hidden sm:table-cell">Forks</th>
                      <th className="py-3 px-3.5 hidden lg:table-cell">Language</th>
                      <th className="py-3 pr-4 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <RepoSkeletonRow key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : filteredRepos.length === 0 ? (
          /* Empty search state */
          <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-12 text-center">
            <Code2 className="mx-auto h-8 w-8 text-neutral-700 mb-3" />
            <h3 className="text-base font-bold text-white">No repos match your search.</h3>
            <p className="text-xs font-medium text-neutral-500 mt-1">
              Try a different keyword or clear the search.
            </p>
          </div>
        ) : viewLayout === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
            {Array.from({ length: gridFillerCount }).map((_, i) => (
              <GridFillerCell key={`grid-filler-${i}`} />
            ))}
          </div>
        ) : (
          /* Table List View (Styled matching Startup LeaderboardTable) */
          <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#2a2a2a] shadow-xs transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#343434] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-3.5">Repository</th>
                    <th className="py-3 px-3.5 hidden md:table-cell">Description</th>
                    <th className="py-3 px-3.5 text-right">Stars</th>
                    <th className="py-3 px-3.5 text-right hidden sm:table-cell">Forks</th>
                    <th className="py-3 px-3.5 hidden lg:table-cell">Language</th>
                    <th className="py-3 pr-4 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {paginatedRepos.map((repo, idx) => {
                    const isTopThree = currentPage === 1 && idx < 3;
                    const rowHighlightClass = (() => {
                      if (currentPage === 1) {
                        if (idx === 0) return 'bg-[#333333] font-medium hover:bg-[#333333]';
                        if (idx === 1) return 'bg-[#303030] hover:bg-[#303030]';
                        if (idx === 2) return 'bg-[#2d2d2d] hover:bg-[#2d2d2d]';
                      }
                      return 'hover:bg-[#333333]';
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
                          if (target.closest('button')) return;
                          playSound('click', soundEnabled);
                          window.open(repo.html_url, '_blank', 'noopener,noreferrer');
                        }}
                        className={`group transition-colors cursor-pointer relative ${rowHighlightClass}`}
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
                              className="h-7 w-7 rounded-lg object-cover shrink-0 border border-neutral-800 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
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
                            {repo.description || '—'}
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
                              <span className="rounded-md bg-neutral-800 border border-neutral-700 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300">
                                {repo.language}
                              </span>
                            )}
                            <span className="rounded-md bg-neutral-800/60 border border-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
                              {repo.category}
                            </span>
                          </div>
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
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs font-bold text-white hover:bg-mint-500 hover:text-[#0b0f14] hover:border-mint-500 transition-all shadow-2xs"
                          >
                            <span>View</span>
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 bg-[#343434] text-neutral-400 transition-all hover:bg-[#3a3a3a] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                  className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-mint-500 text-[#0b0f14] shadow-2xs'
                      : 'border border-neutral-700 bg-[#343434] text-neutral-400 hover:bg-[#3a3a3a] hover:border-neutral-500'
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 bg-[#343434] text-neutral-400 transition-all hover:bg-[#3a3a3a] hover:border-neutral-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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

const RepoCard: React.FC<{ repo: CuratedRepo }> = ({ repo }) => {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col bg-[#2a2a2a] p-5 text-left transition-colors cursor-pointer hover:bg-[#333333] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60"
    >
      {/* Icon + external link */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] transition-colors group-hover:border-neutral-700">
          <img
            src={repo.owner.avatar_url}
            alt={repo.owner.login}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-neutral-600 opacity-0 group-hover:opacity-100 group-hover:text-white transition-opacity" />
      </div>

      {/* Title + owner */}
      <h3 className="mt-4 truncate text-[15px] font-bold tracking-tight text-white group-hover:underline">
        {repo.name}
      </h3>
      <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500">
        {repo.owner.login}
      </p>

      {/* Description */}
      {repo.description && (
        <p className="mt-1.5 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-400 line-clamp-2">
          {repo.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-800 pt-3">
        <div className="flex items-center gap-2.5 text-[11px] text-neutral-400">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
            <span className="font-bold font-mono-num">{formatStars(repo.stargazers_count)}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="h-3 w-3 text-neutral-500" />
            <span className="font-mono-num">{repo.forks_count}</span>
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5">
          {repo.language && (
            <span className="shrink-0 rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-300">
              {repo.language}
            </span>
          )}
          <span className="shrink-0 truncate rounded-md bg-neutral-800/60 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
            {repo.category}
          </span>
        </div>
      </div>
    </a>
  );
};
