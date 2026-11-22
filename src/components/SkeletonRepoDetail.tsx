import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

/**
 * Mirrors the first screen of RepoDetailPage: back link, repo header
 * (avatar, name, badges, stats) and the tab bar. Shown while the repo
 * detail chunk downloads, so the route never flashes a blank column.
 */
export const SkeletonRepoDetail: React.FC = () => (
  <div
    className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 space-y-8 flex-1"
    aria-busy="true"
    aria-label="Loading repository"
  >
    {/* Back link */}
    <div className="flex items-center justify-between gap-3">
      <Shimmer className="h-4 w-28 rounded" />
      <Shimmer className="h-7 w-20 rounded-lg" />
    </div>

    {/* Repo header */}
    <div className="space-y-4">
      <div className="flex items-start gap-3 sm:gap-4">
        <Shimmer className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-2">
          <Shimmer className="h-6 w-40 rounded" />
          <Shimmer className="h-3 w-56 max-w-full rounded" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Shimmer className="h-5 w-24 rounded-md" />
        <Shimmer className="h-5 w-16 rounded-md" />
        <Shimmer className="h-5 w-28 rounded-md" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="h-4 w-24 rounded" />
        <Shimmer className="h-4 w-28 rounded" />
      </div>
    </div>

    {/* Tab bar */}
    <div className="border-b border-neutral-200 -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div className="flex items-center gap-6 sm:gap-8 py-3.5">
        <Shimmer className="h-4 w-20 rounded" />
        <Shimmer className="h-4 w-24 rounded" />
        <Shimmer className="h-4 w-20 rounded" />
        <Shimmer className="h-4 w-16 rounded" />
        <Shimmer className="hidden sm:block h-4 w-24 rounded" />
      </div>
    </div>

    {/* Content panels */}
    <div className="space-y-6">
      <div className="space-y-2">
        <Shimmer className="h-5 w-48 rounded" />
        <div className="rounded-xl border border-neutral-200/90 bg-white p-5 sm:p-6 space-y-3">
          <Shimmer className="h-4 w-full rounded" />
          <Shimmer className="h-4 w-11/12 rounded" />
          <Shimmer className="h-4 w-4/5 rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={`repo-detail-skeleton-panel-${i}`}
            className="rounded-xl border border-neutral-200/90 bg-white p-5 sm:p-6 space-y-3"
          >
            <Shimmer className="h-4 w-32 rounded" />
            <Shimmer className="h-3 w-full rounded" />
            <Shimmer className="h-3 w-11/12 rounded" />
            <Shimmer className="h-3 w-4/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  </div>
);
