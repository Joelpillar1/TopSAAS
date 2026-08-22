import React, { useState, useEffect } from 'react';
import { Star, GitFork, ExternalLink, Code2, Trophy, Filter, ChevronLeft, ChevronRight, LayoutGrid, Table as TableIcon, Crown } from 'lucide-react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { formatStars } from '../utils/github';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { HeroClaimBanner } from './HeroClaimBanner';
import { BorderBeam } from './BorderBeam';
import { playSound } from '../utils/sound';

interface SaaSIdeasProps {
  soundEnabled: boolean;
  topProducts: Product[];
  featuredProductId?: string | null;
  featuredProduct: Product | null;
  onOpenFeaturedSpotModal?: () => void;
  onClaimFeatured?: () => void;
  onShareProduct: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onUpvote: (product: Product) => void;
}

const CATEGORIES: RepoCategory[] = [
  'All', 'SaaS Starters', 'Auth & Identity', 'Databases', 'AI & ML',
  'DevOps & Infra', 'UI Components', 'CMS & Content', 'Analytics',
  'Email & Communication', 'Deployment', 'Mobile', 'API & Backend',
  'Monitoring', 'Forms & Surveys', 'Search', 'File Storage', 'Design & UI',
];

const REPOS_PER_PAGE = 18;

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] rounded ${className}`}
  />
);

const RepoSkeletonCard: React.FC = () => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-2.5 h-full">
    <div className="flex items-start gap-2.5">
      <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Shimmer className="h-4 w-28 rounded" />
        <Shimmer className="h-3 w-16 rounded" />
      </div>
    </div>
    <div className="space-y-1.5 my-1">
      <Shimmer className="h-3 w-full rounded" />
      <Shimmer className="h-3 w-4/5 rounded" />
    </div>
    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-neutral-100">
      <Shimmer className="h-3.5 w-12 rounded" />
      <Shimmer className="h-3.5 w-10 rounded" />
      <Shimmer className="h-4 w-14 rounded-md ml-auto" />
    </div>
  </div>
);

const RepoSkeletonRow: React.FC = () => (
  <tr className="border-b border-neutral-100 animate-pulse">
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
  featuredProductId,
  featuredProduct,
  onOpenFeaturedSpotModal,
  onClaimFeatured,
  onShareProduct,
  onTrackClick,
  onUpvote,
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
  const [isLoading, setIsLoading] = useState(false);

  const filteredRepos = selectedCategory === 'All'
    ? CURATED_REPOS
    : CURATED_REPOS.filter((r) => r.category === selectedCategory);

  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE);
  const paginatedRepos = filteredRepos.slice(
    (currentPage - 1) * REPOS_PER_PAGE,
    currentPage * REPOS_PER_PAGE
  );

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
      {/* Featured Spot Section (Matches Homepage Exactly) */}
      {featuredProductId && featuredProduct ? (
        <BorderBeam
          duration={5}
          size={260}
          colorFrom="#ffaa40"
          colorMid="#9c40ff"
          colorTo="#00d2ff"
        >
          <HeroClaimBanner
            topProduct={featuredProduct}
            soundEnabled={soundEnabled}
            onTrackClick={onTrackClick}
          />
        </BorderBeam>
      ) : featuredProductId === '' ? (
        /* Empty state: admin cleared featured, show nothing */
        null
      ) : (
        /* Default state: no featured assigned yet, show bid placeholder */
        <BorderBeam
          duration={5}
          size={260}
          colorFrom="#ffaa40"
          colorMid="#9c40ff"
          colorTo="#00d2ff"
        >
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onOpenFeaturedSpotModal?.();
            }}
            className="w-full rounded-xl border-2 border-neutral-300 bg-white px-3 py-4 sm:px-4 sm:py-5 hover:bg-neutral-50 transition-all cursor-pointer text-left block"
          >
            <div className="flex items-center gap-2.5">
              <Crown className="h-4 w-4 text-neutral-300 shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-bold text-neutral-400">Featured spot</p>
                <span className="text-[10px] text-neutral-400">—</span>
                <p className="text-[11px] text-neutral-500 font-medium">Get featured for 30 days</p>
              </div>
            </div>
          </button>
        </BorderBeam>
      )}

      {/* Top 3 Featured Products */}
      {topProducts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-black text-white shadow-2xs">
              <Trophy className="h-3 w-3 fill-white stroke-white" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-black">
              Top 3 on TopSAAS
            </h2>
            <span className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-800">
              community ranked
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
                onShareProduct={onShareProduct}
                onTrackClick={onTrackClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      {topProducts.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Open Source Ideas</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>
      )}

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
              className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-black text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
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
                    ? 'bg-black text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* View Layout Switcher (Cards vs Table) */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-2xs">
          <button
            type="button"
            onClick={() => handleLayoutChange('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewLayout === 'cards'
                ? 'bg-white text-black shadow-2xs'
                : 'text-neutral-500 hover:text-black'
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
                ? 'bg-white text-black shadow-2xs'
                : 'text-neutral-500 hover:text-black'
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
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-black text-white shadow-2xs">
              <Code2 className="h-3 w-3" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-wider text-black">
              Open Source SaaS Ideas
            </h2>
            <span className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-800">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <RepoSkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-100/90 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
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
        ) : viewLayout === 'cards' ? (
          /* Cards View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {paginatedRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        ) : (
          /* Table List View (Styled matching Startup LeaderboardTable) */
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-100/90 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                    <th className="py-3 px-3.5">Repository</th>
                    <th className="py-3 px-3.5 hidden md:table-cell">Description</th>
                    <th className="py-3 px-3.5 text-right">Stars</th>
                    <th className="py-3 px-3.5 text-right hidden sm:table-cell">Forks</th>
                    <th className="py-3 px-3.5 hidden lg:table-cell">Language</th>
                    <th className="py-3 pr-4 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedRepos.map((repo, idx) => {
                    const isTopThree = currentPage === 1 && idx < 3;
                    const rowHighlightClass = (() => {
                      if (currentPage === 1) {
                        if (idx === 0) return 'bg-neutral-100/90 font-medium hover:bg-neutral-100';
                        if (idx === 1) return 'bg-neutral-100/60 hover:bg-neutral-100/80';
                        if (idx === 2) return 'bg-neutral-50/80 hover:bg-neutral-100/60';
                      }
                      return 'hover:bg-neutral-50/80';
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
                              className="h-7 w-7 rounded-lg object-cover shrink-0 border border-neutral-200 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                            <div className="min-w-0">
                              <a
                                href={repo.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-black hover:underline truncate block"
                              >
                                {repo.name}
                              </a>
                              <span className="text-[11px] text-neutral-400 block truncate">
                                {repo.owner.login}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3 px-3.5 hidden md:table-cell max-w-xs text-neutral-600">
                          <p className="line-clamp-1 text-xs">
                            {repo.description || '—'}
                          </p>
                        </td>

                        {/* Stars */}
                        <td className="py-3 px-3.5 text-right">
                          <div className="inline-flex items-center gap-1 font-bold text-black font-mono-num">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                            <span>{formatStars(repo.stargazers_count)}</span>
                          </div>
                        </td>

                        {/* Forks */}
                        <td className="py-3 px-3.5 text-right hidden sm:table-cell text-neutral-500 font-mono-num">
                          <div className="inline-flex items-center gap-1">
                            <GitFork className="h-3 w-3 text-neutral-400" />
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
                            <span className="rounded-md bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500">
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
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-black hover:bg-black hover:text-white hover:border-black transition-all shadow-2xs"
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
                    <span key={page} className="text-neutral-400 text-xs px-1">…</span>
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
                      ? 'bg-black text-white shadow-2xs'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <span className="text-[11px] text-neutral-400 font-medium ml-2 hidden sm:block">
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
      className="group rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400 hover:shadow-md cursor-pointer flex flex-col gap-2.5"
    >
      <div className="flex items-start gap-2.5">
        <img
          src={repo.owner.avatar_url}
          alt={repo.owner.login}
          className="h-8 w-8 rounded-lg object-cover shrink-0 border border-neutral-200"
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-black truncate group-hover:underline">
            {repo.name}
          </h3>
          <p className="text-[11px] text-neutral-500 truncate">
            {repo.owner.login}
          </p>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {repo.description && (
        <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
          {repo.description}
        </p>
      )}

      <div className="flex items-center gap-3 mt-auto pt-1 text-[11px] text-neutral-500">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
          <span className="font-bold font-mono-num">{formatStars(repo.stargazers_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitFork className="h-3 w-3" />
          <span className="font-mono-num">{repo.forks_count}</span>
        </div>
        {repo.language && (
          <span className="rounded-md bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-700">
            {repo.language}
          </span>
        )}
        <span className="rounded-md bg-neutral-50 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 ml-auto">
          {repo.category}
        </span>
      </div>
    </a>
  );
};
