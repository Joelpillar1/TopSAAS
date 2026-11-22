import React from 'react';
import { GridFillerCell, useGridColumns } from './GridFiller';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

/** Mirrors RepoCard — avatar, repo name, alternative/category subtitle, bookmark button, description, footer stats */
const SkeletonRepoCard: React.FC = () => (
  <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-neutral-100 p-3.5 sm:p-4 shadow-2xs min-h-[140px]">
    <div>
      <div className="flex items-start gap-3 min-w-0">
        <Shimmer className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <Shimmer className="h-4 w-28 rounded" />
            <Shimmer className="h-3.5 w-8 rounded" />
          </div>
          <Shimmer className="h-3 w-24 rounded" />
        </div>
      </div>
      <div className="mt-2.5 space-y-1.5">
        <Shimmer className="h-3 w-full rounded" />
        <Shimmer className="h-3 w-4/5 rounded" />
      </div>
    </div>
    <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between">
      <Shimmer className="h-3.5 w-16 rounded" />
      <Shimmer className="h-3.5 w-14 rounded" />
    </div>
  </div>
);

/** Mirrors SaaSOpportunityCard */
const SkeletonOpportunityCard: React.FC = () => (
  <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-gradient-to-r from-neutral-100 via-neutral-50 to-white p-3.5 xl:p-4 shadow-2xs">
    <div>
      <div className="flex items-center gap-3">
        <Shimmer className="h-9 w-9 rounded-xl shrink-0" />
        <Shimmer className="h-4 w-32 rounded" />
      </div>
      <div className="mt-2.5 space-y-1.5">
        <Shimmer className="h-3 w-full rounded" />
        <Shimmer className="h-3 w-4/5 rounded" />
      </div>
    </div>
    <div className="mt-3.5">
      <Shimmer className="h-9 w-full rounded-xl" />
    </div>
  </div>
);

/** Mirrors the SaaSIdeas page structure (left rail, hero, featured spot, filters, repo grid/table, right rail) */
export const SkeletonSaaSIdeas: React.FC = () => {
  const cols = useGridColumns();
  const cardCount = cols * 2;
  const fillerCount = (cols - (cardCount % cols)) % cols;

  const isTableLayout = (() => {
    try {
      return localStorage.getItem('topsaas_saas_ideas_layout') === 'table';
    } catch {
      return false;
    }
  })();

  return (
    <div className="relative w-full font-sans space-y-6" aria-busy="true" aria-label="Loading SaaS Ideas">
      {/* Center Main Stream */}
      <div className="w-full min-w-0 max-w-full space-y-6">

          {/* Hero section */}
          <section className="relative overflow-hidden px-1 pt-1 sm:pt-3">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <Shimmer className="h-8 sm:h-11 w-64 sm:w-96 rounded-xl" />
              <Shimmer className="mt-2 h-8 sm:h-11 w-56 sm:w-80 rounded-xl" />
              <Shimmer className="mt-4 h-4 w-60 rounded" />
              <Shimmer className="mt-7 h-11 w-full max-w-xl rounded-xl" />
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <Shimmer className="h-3.5 w-14 rounded" />
                <Shimmer className="h-3.5 w-20 rounded" />
                <Shimmer className="h-3.5 w-14 rounded" />
                <Shimmer className="h-3.5 w-16 rounded" />
                <Shimmer className="h-3.5 w-20 rounded" />
              </div>
            </div>
          </section>

          {/* Featured spot banner */}
          <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3.5 sm:px-5 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Shimmer className="h-9 w-9 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Shimmer className="h-3.5 w-40 rounded" />
                <Shimmer className="h-3 w-72 max-w-full rounded" />
              </div>
            </div>
            <Shimmer className="h-7 w-24 shrink-0 rounded-lg" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-1">
            <div className="h-px flex-1 bg-neutral-200" />
            <Shimmer className="h-3 w-28 rounded" />
            <div className="h-px flex-1 bg-neutral-200" />
          </div>

          {/* Main Repos Directory Frame */}
          <div className="w-full rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            {/* Header row: title + subtitle */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-5 w-40 rounded" />
                  <Shimmer className="h-4 w-14 rounded-md" />
                </div>
                <Shimmer className="h-3 w-56 rounded" />
              </div>
            </div>

            {/* Category filters & view toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                <Shimmer className="h-6 w-12 shrink-0 rounded-lg" />
                <Shimmer className="h-6 w-24 shrink-0 rounded-lg" />
                <Shimmer className="h-6 w-24 shrink-0 rounded-lg" />
                <Shimmer className="h-6 w-20 shrink-0 rounded-lg" />
                <Shimmer className="h-6 w-18 shrink-0 rounded-lg" />
                <Shimmer className="h-6 w-24 shrink-0 rounded-lg hidden sm:block" />
                <Shimmer className="h-6 w-22 shrink-0 rounded-lg hidden md:block" />
              </div>
              <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs">
                <Shimmer className="h-7 w-16 rounded-lg" />
                <Shimmer className="h-7 w-16 rounded-lg" />
              </div>
            </div>

            {isTableLayout ? (
              <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50/50">
                        <th className="py-2.5 pl-4 pr-3">
                          <Shimmer className="h-3 w-16 rounded" />
                        </th>
                        <th className="py-2.5 px-3.5 hidden md:table-cell">
                          <Shimmer className="h-3 w-20 rounded" />
                        </th>
                        <th className="py-2.5 px-3.5 text-right">
                          <Shimmer className="h-3 w-10 ml-auto rounded" />
                        </th>
                        <th className="py-2.5 px-3.5 text-right hidden sm:table-cell">
                          <Shimmer className="h-3 w-10 ml-auto rounded" />
                        </th>
                        <th className="py-2.5 px-3.5 hidden lg:table-cell">
                          <Shimmer className="h-3 w-14 rounded" />
                        </th>
                        <th className="py-2.5 px-3.5 text-right hidden md:table-cell">
                          <Shimmer className="h-3 w-10 ml-auto rounded" />
                        </th>
                        <th className="py-2.5 pr-4 pl-2 text-right">
                          <Shimmer className="h-3 w-12 ml-auto rounded" />
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <tr key={`skeleton-table-row-${i}`}>
                          <td className="py-3 pl-4 pr-3">
                            <div className="flex items-center gap-2.5">
                              <Shimmer className="h-8 w-8 rounded-lg shrink-0" />
                              <div className="space-y-1">
                                <Shimmer className="h-3.5 w-28 rounded" />
                                <Shimmer className="h-2.5 w-16 rounded" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3.5 hidden md:table-cell">
                            <Shimmer className="h-3 w-48 rounded" />
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <Shimmer className="h-3 w-10 ml-auto rounded" />
                          </td>
                          <td className="py-3 px-3.5 text-right hidden sm:table-cell">
                            <Shimmer className="h-3 w-8 ml-auto rounded" />
                          </td>
                          <td className="py-3 px-3.5 hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Shimmer className="h-5 w-16 rounded-md" />
                              <Shimmer className="h-5 w-20 rounded-md" />
                            </div>
                          </td>
                          <td className="py-3 px-3.5 text-right hidden md:table-cell">
                            <Shimmer className="h-5 w-10 ml-auto rounded-md" />
                          </td>
                          <td className="py-3 pr-4 pl-2 text-right">
                            <Shimmer className="h-7 w-16 ml-auto rounded-lg" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: cardCount }).map((_, i) => (
                  <SkeletonRepoCard key={`skeleton-repo-card-${i}`} />
                ))}
              </div>
            )}
          </div>

        </div>
        {/* end Center Main Stream */}
    </div>
  );
};
