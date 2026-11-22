import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Command,
  X,
  TrendingUp,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { DIRECTORY_REPOS, UNIQUE_REPOS } from '../data/repoCatalog';
import { FEATURED_SIDEBAR_OPPORTUNITIES } from '../data/saasOpportunities';
import { SaaSOpportunityCard } from './SaaSOpportunityCard';
import { IdeasSponsorCard, IDEAS_SPONSOR_SLOTS } from './IdeasSponsorCard';
import { SaaSIdeasMobileSponsor } from './SaaSIdeasMobileSponsor';
import { navigateTo } from '../utils/nav';
import { applyPageSeo } from '../utils/pageSeo';
import { ideasSeo } from '../utils/coreSeo';
import { formatStars } from '../utils/github';
import { Product } from '../types';
import { HeroClaimBanner } from './HeroClaimBanner';
import { BorderBeam } from './BorderBeam';
import { playSound } from '../utils/sound';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/grid-pattern';
import { RepoCard } from './RepoCard';
import { HandpickedLaunchpadsSection } from './HandpickedLaunchpadsSection';

interface SaaSIdeasProps {
  soundEnabled: boolean;
  sponsors?: Product[];
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
  'All',
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

const REPOS_PER_PAGE = 100;

// Compact total-star count for the hero strip (e.g. 6.2M)
const formatTotalStars = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return formatStars(n);
};

export const SaaSIdeas: React.FC<SaaSIdeasProps> = ({
  soundEnabled,
  sponsors = [],
  topProducts: _topProducts,
  productsLoaded: _productsLoaded = true,
  featuredProductId,
  featuredProduct,
  commentCounts: _commentCounts = {},
  onOpenFeaturedSpotModal,
  onClaimFeatured: _onClaimFeatured,
  onShareProduct: _onShareProduct,
  onTrackClick,
  onUpvote: _onUpvote,
  onOpenDetail,
  onOpenRepo,
  upvotedIds: _upvotedIds,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RepoCategory>('All');
  const [currentPage, setCurrentPage] = useState(1);

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
  const heroBannerRef = useRef<HTMLDivElement | null>(null);
  const [isStickySponsorVisible, setIsStickySponsorVisible] = useState(false);

  // Show sticky sponsor under top nav when user scrolls past the hero banner on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (!heroBannerRef.current) return;
      const rect = heroBannerRef.current.getBoundingClientRect();
      setIsStickySponsorVisible(rect.bottom < 52);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
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

  // Direct loads already carry this route's head from the prerenderer, but
  // in-app navigation does not. Apply the same copy here so the title,
  // description and canonical never keep the previous page's values.
  useEffect(() => applyPageSeo(ideasSeo(DIRECTORY_REPOS.length)), []);

  const filteredRepos = (() => {
    const q = searchQuery.trim().toLowerCase();
    let list =
      selectedCategory === 'All' || q
        ? DIRECTORY_REPOS
        : DIRECTORY_REPOS.filter((r) => r.category === selectedCategory);
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

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    playSound('click', soundEnabled);
    setCurrentPage(1);
    const target = document.getElementById('repos-directory-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalStars = UNIQUE_REPOS.reduce((s, r) => s + r.stargazers_count, 0);

  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE);
  const paginatedRepos = filteredRepos.slice(
    (currentPage - 1) * REPOS_PER_PAGE,
    currentPage * REPOS_PER_PAGE
  );

  const handleCategoryChange = (cat: RepoCategory) => {
    playSound('click', soundEnabled);
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    playSound('click', soundEnabled);
    setCurrentPage(page);
    const target = document.getElementById('repos-directory-section');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const activeSponsors = (sponsors || []).filter(
    (p) => p.isSponsored && (p.sponsorExpiresAt ? p.sponsorExpiresAt > Date.now() : true)
  );

  const handleOpenRepoByFullName = (fullName: string) => {
    const match = UNIQUE_REPOS.find((r) => r.full_name.toLowerCase() === fullName.toLowerCase());
    if (match && onOpenRepo) {
      onOpenRepo(match);
    } else {
      window.location.href = `/repo/${fullName}`;
    }
  };

  return (
    <div className="relative w-full font-sans space-y-6">
      {/* Mobile Floating Sticky Sponsor under Top Nav when scrolled down */}
      {isStickySponsorVisible && (
        <div className="fixed top-[62px] left-3.5 right-3.5 sm:left-6 sm:right-6 z-30 xl:hidden pointer-events-none flex justify-center animate-fadeIn">
          <div className="pointer-events-auto w-full max-w-xl">
            <SaaSIdeasMobileSponsor
              slots={IDEAS_SPONSOR_SLOTS.slice(0, 5)}
              sponsors={sponsors}
              soundEnabled={soundEnabled}
              onTrackClick={onTrackClick}
              onOpenProduct={onOpenDetail}
              onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
              isFloating
            />
          </div>
        </div>
      )}

      {/* Hero: brand statement + search */}
      <section className="relative overflow-hidden px-1 pt-6 sm:pt-10" aria-label="Find the best SaaS idea">
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
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
              {/* Mobile-only Rotating Sponsor Banner (above "Don't Start From Zero.") */}
              <div ref={heroBannerRef} className="w-full mb-3.5 xl:hidden px-2">
                <SaaSIdeasMobileSponsor
                  slots={IDEAS_SPONSOR_SLOTS.slice(0, 5)}
                  sponsors={sponsors}
                  soundEnabled={soundEnabled}
                  onTrackClick={onTrackClick}
                  onOpenProduct={onOpenDetail}
                  onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
                />
              </div>

              {/* Badge */}
              <div className="mb-3.5 inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white/95 px-3.5 py-1.5 shadow-2xs backdrop-blur-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-mint-500"></span>
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-neutral-700 tracking-tight">
                  Don’t Start From Zero.
                </span>
              </div>

              {/* Main Hero Headline */}
              <h1 className="text-3xl font-black leading-[1.12] tracking-tight text-neutral-950 sm:text-5xl">
                <span className="block">Launch Your SaaS</span>
                <span className="block sm:whitespace-nowrap shimmer-text-ai">On Open Source.</span>
              </h1>

              <p className="mt-3.5 text-sm font-medium text-neutral-500 max-w-xl">
                Curated open-source codebases with proven market demand. Search a repo or click any card to inspect the blueprint.
              </p>

              {/* Search */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative mt-7 w-full max-w-xl"
              >
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchSubmit(e);
                    }
                  }}
                  placeholder="Search for an open-source codebase (e.g., 'nextjs', 'auth', 'notion'…)"
                  aria-label="Search open source projects"
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-28 sm:pr-32 text-sm font-medium text-neutral-900 placeholder-neutral-400 shadow-2xs outline-none transition-all focus:border-neutral-400 focus:ring-4 focus:ring-neutral-200/50"
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery.trim() ? (
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setSearchQuery('');
                        setCurrentPage(1);
                        searchInputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <span className="pointer-events-none hidden items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500 sm:flex mr-1">
                      <Command className="h-2.5 w-2.5" />
                      K
                    </span>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer shrink-0"
                    aria-label="Search codebases"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </form>

              {/* Live strip */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[11px] font-semibold text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
                  <span className="font-bold text-neutral-500 font-mono-num">{UNIQUE_REPOS.length}</span> repos
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

          {/* Mobile & Tablet Projects (< xl) */}
          <section className="xl:hidden w-full space-y-4 pt-1" aria-label="Curated project ideas">
            {/* Mobile Top Picks Track */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-neutral-900">Top Pick For You</span>
                  <span className="text-[11px] text-neutral-500 font-medium hidden xs:inline">— Curated ideas</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">Swipe cards →</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2.5 pt-1 px-1 no-scrollbar scrollbar-none snap-x">
                {FEATURED_SIDEBAR_OPPORTUNITIES.map((opp) => (
                  <div key={opp.id} className="w-[275px] sm:w-[310px] shrink-0 snap-start">
                    <SaaSOpportunityCard
                      opportunity={opp}
                      soundEnabled={soundEnabled}
                      onOpenRepo={handleOpenRepoByFullName}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Handpicked Curated SaaS Launchpads */}
          <HandpickedLaunchpadsSection soundEnabled={soundEnabled} onOpenRepo={onOpenRepo} />

          {/* Divider */}
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-neutral-200" />
            <span className="text-[10px] font-bold text-neutral-500">Open source projects</span>
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* ── Main Repos Directory Frame (Matches Homepage Directory Listing Frame) ── */}
          <section
            id="repos-directory-section"
            className="w-full rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4"
          >
            {/* Header row: title + subtitle */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold tracking-tight text-neutral-950 sm:text-lg">
                    {searchQuery.trim() ? `Search results for "${searchQuery.trim()}"` : 'Open Source Projects'}
                  </h2>
                  <span className="rounded-md bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-700">
                    {filteredRepos.length} {filteredRepos.length === 1 ? 'repo' : 'repos'}
                  </span>
                </div>
                <p className="text-xs font-medium text-neutral-500 mt-0.5">
                  {searchQuery.trim()
                    ? `Showing codebases matching "${searchQuery.trim()}"`
                    : 'Useful for devs, founders & solo builders · Curated foundation codebases'}
                </p>
              </div>

              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Category Filters & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Category Filter Section with Pinned 'All' */}
              <div className="flex items-center min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center gap-1.5 shrink-0 pr-2 border-r border-neutral-200 mr-1.5">
                  <Filter className="h-3 w-3 text-neutral-400 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('All')}
                    className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${selectedCategory === 'All'
                      ? 'bg-mint-500/15 text-mint-700 ring-1 ring-inset ring-mint-500/40'
                      : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'
                      }`}
                  >
                    All
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5 flex-1 no-scrollbar scrollbar-none">
                  {CATEGORIES.filter((cat) => cat !== 'All').map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 active:scale-95 ${selectedCategory === cat
                        ? 'bg-mint-500/15 text-mint-700 ring-1 ring-inset ring-mint-500/40'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Project cards */}
            {filteredRepos.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-12 text-center">
                <Code2 className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
                <h3 className="text-base font-bold text-neutral-950">No repos match your search.</h3>
                <p className="text-xs font-medium text-neutral-500 mt-1">
                  Try a different keyword or clear the search query.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setSearchQuery('');
                    setCurrentPage(1);
                    searchInputRef.current?.focus();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {paginatedRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onOpen={onOpenRepo} soundEnabled={soundEnabled} />
                ))}
              </div>
            )}

            {/* Pagination inside the frame */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-3 border-t border-neutral-100">
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
                      className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${currentPage === page
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
          </section>
    </div>
  );
};
