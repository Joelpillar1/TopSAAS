import React, { useState } from 'react';
import { Star, GitFork, ExternalLink, Code2, Trophy, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { formatStars } from '../utils/github';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { BorderBeam } from './BorderBeam';

interface SaaSIdeasProps {
  soundEnabled: boolean;
  topProducts: Product[];
  onViewProduct: (product: Product) => void;
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

export const SaaSIdeas: React.FC<SaaSIdeasProps> = ({
  soundEnabled,
  topProducts,
  onViewProduct,
  onShareProduct,
  onTrackClick,
  onUpvote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RepoCategory>('All');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRepos = selectedCategory === 'All'
    ? CURATED_REPOS
    : CURATED_REPOS.filter((r) => r.category === selectedCategory);

  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE);
  const paginatedRepos = filteredRepos.slice(
    (currentPage - 1) * REPOS_PER_PAGE,
    currentPage * REPOS_PER_PAGE
  );

  // Reset to page 1 when category changes
  const handleCategoryChange = (cat: RepoCategory) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
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
              <BorderBeam key={product.id} duration={5 + index}>
                <ProductCard
                  product={product}
                  rank={product.rank ?? index + 1}
                  soundEnabled={soundEnabled}
                  onViewDetails={onViewProduct}
                  onShareProduct={onShareProduct}
                  onTrackClick={onTrackClick}
                  onUpvote={onUpvote}
                />
              </BorderBeam>
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

      {/* Category Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        <Filter className="h-3 w-3 text-neutral-400 shrink-0" />
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-black text-white shadow-2xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-black'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Repos Grid */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {paginatedRepos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-all hover:bg-neutral-50 hover:border-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current, and neighbors
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
                  onClick={() => setCurrentPage(page)}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
          <Star className="h-3 w-3 text-amber-500" />
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
