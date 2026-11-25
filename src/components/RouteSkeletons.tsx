import React from 'react';

/** Skeleton matching CategoriesPage: centered hero + search + filter pills + 2-column category preview lists */
export const SkeletonCategories: React.FC = () => (
  <div className="w-full pt-4 sm:pt-6 pb-8 space-y-8 animate-pulse">
    <div className="space-y-3 text-center max-w-2xl mx-auto">
      <div className="h-8 sm:h-9 w-3/4 mx-auto rounded-xl bg-neutral-200/80" />
      <div className="h-4 w-5/6 mx-auto rounded-lg bg-neutral-100" />
      <div className="pt-2">
        <div className="h-10 w-full max-w-lg mx-auto rounded-xl bg-neutral-100 border border-neutral-200/70" />
      </div>
      <div className="flex items-center justify-center gap-2 pt-1">
        <div className="h-7 w-24 rounded-xl bg-neutral-200/70" />
        <div className="h-7 w-32 rounded-xl bg-neutral-100" />
        <div className="h-7 w-36 rounded-xl bg-neutral-100" />
      </div>
    </div>

    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
        <div className="h-4 w-36 rounded bg-neutral-200/70" />
        <div className="h-3 w-20 rounded bg-neutral-100" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        {[0, 1, 2, 3].map((col) => (
          <div key={col} className="space-y-2">
            <div className="flex items-baseline justify-between border-b border-neutral-200/90 pb-2">
              <div className="h-5 w-32 rounded bg-neutral-200/80" />
              <div className="h-3 w-16 rounded bg-neutral-100" />
            </div>
            <div className="divide-y divide-neutral-100">
              {[0, 1, 2, 3].map((row) => (
                <div key={row} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 shrink-0 rounded-xl bg-neutral-200/70" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="h-3.5 w-28 rounded bg-neutral-200/80" />
                      <div className="h-2.5 w-44 rounded bg-neutral-100" />
                    </div>
                  </div>
                  <div className="h-3.5 w-8 rounded bg-neutral-100 shrink-0" />
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-neutral-100">
              <div className="h-3.5 w-40 rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Skeleton matching BlogListPage: hero + search/categories + featured post + 2-column post cards */
export const SkeletonBlogList: React.FC = () => (
  <div className="w-full pt-4 sm:pt-6 pb-8 space-y-8 animate-pulse">
    <div className="space-y-3 text-center max-w-2xl mx-auto">
      <div className="h-6 w-28 mx-auto rounded-full bg-neutral-100" />
      <div className="h-8 sm:h-10 w-3/4 mx-auto rounded-xl bg-neutral-200/80" />
      <div className="h-4 w-5/6 mx-auto rounded-lg bg-neutral-100" />
      <div className="pt-2">
        <div className="h-10 w-full max-w-md mx-auto rounded-xl bg-neutral-100 border border-neutral-200/70" />
      </div>
      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-7 w-20 rounded-xl bg-neutral-100" />
        ))}
      </div>
    </div>

    {/* Featured post card */}
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-24 rounded-md bg-neutral-200/70" />
        <div className="h-4 w-20 rounded bg-neutral-100" />
      </div>
      <div className="h-7 w-4/5 rounded-lg bg-neutral-200/80" />
      <div className="space-y-2">
        <div className="h-3.5 w-full rounded bg-neutral-100" />
        <div className="h-3.5 w-5/6 rounded bg-neutral-100" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-neutral-200/70" />
          <div className="h-3.5 w-24 rounded bg-neutral-100" />
        </div>
        <div className="h-4 w-20 rounded bg-neutral-200/70" />
      </div>
    </div>

    {/* Post grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-neutral-200/80 bg-white p-5 space-y-3">
          <div className="h-5 w-24 rounded-md bg-neutral-100" />
          <div className="h-5 w-5/6 rounded bg-neutral-200/80" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-neutral-100" />
            <div className="h-3 w-4/5 rounded bg-neutral-100" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="h-3 w-20 rounded bg-neutral-100" />
            <div className="h-3 w-16 rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Skeleton matching BlogDetailPage / GuideDetailPage: breadcrumb + header + author + article body */
export const SkeletonArticleDetail: React.FC = () => (
  <div className="w-full pt-2 sm:pt-4 pb-8 space-y-6 animate-pulse">
    <div className="flex items-center gap-2">
      <div className="h-3.5 w-10 rounded bg-neutral-100" />
      <div className="h-3.5 w-10 rounded bg-neutral-100" />
      <div className="h-3.5 w-24 rounded bg-neutral-200/70" />
    </div>

    <div className="pb-6 border-b border-neutral-200/80 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-24 rounded-md bg-neutral-200/70" />
        <div className="h-4 w-24 rounded bg-neutral-100" />
        <div className="h-4 w-16 rounded bg-neutral-100" />
      </div>
      <div className="space-y-2">
        <div className="h-8 sm:h-9 w-11/12 rounded-xl bg-neutral-200/80" />
        <div className="h-8 sm:h-9 w-2/3 rounded-xl bg-neutral-200/80" />
      </div>
      <div className="h-4 w-5/6 rounded bg-neutral-100" />
      <div className="flex items-center gap-3 pt-2">
        <div className="h-9 w-9 rounded-full bg-neutral-200/70" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-neutral-200/70" />
          <div className="h-3 w-20 rounded bg-neutral-100" />
        </div>
      </div>
    </div>

    <div className="space-y-6 pt-2">
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-2.5">
          <div className="h-6 w-1/2 rounded-lg bg-neutral-200/70" />
          <div className="h-3.5 w-full rounded bg-neutral-100" />
          <div className="h-3.5 w-11/12 rounded bg-neutral-100" />
          <div className="h-3.5 w-4/5 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  </div>
);

/** Skeleton matching MrrCalculatorPage: hero + 2-col calculator inputs & results card + guide sections */
export const SkeletonMrrCalculator: React.FC = () => (
  <div className="w-full pt-4 sm:pt-6 pb-8 space-y-8 animate-pulse">
    <div className="space-y-3 text-center max-w-2xl mx-auto">
      <div className="h-6 w-36 mx-auto rounded-full bg-neutral-100" />
      <div className="h-8 sm:h-10 w-3/4 mx-auto rounded-xl bg-neutral-200/80" />
      <div className="h-4 w-5/6 mx-auto rounded-lg bg-neutral-100" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left: Inputs card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="h-5 w-40 rounded bg-neutral-200/80" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 rounded bg-neutral-100" />
          <div className="h-11 w-full rounded-xl bg-neutral-100 border border-neutral-200/60" />
        </div>
        <div className="space-y-2">
          <div className="h-3.5 w-36 rounded bg-neutral-100" />
          <div className="h-11 w-full rounded-xl bg-neutral-100 border border-neutral-200/60" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-8 w-20 rounded-xl bg-neutral-100" />
          <div className="h-8 w-20 rounded-xl bg-neutral-100" />
          <div className="h-8 w-20 rounded-xl bg-neutral-100" />
        </div>
      </div>

      {/* Right: Results card */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-100/80 p-5 sm:p-6 space-y-4">
        <div className="h-3.5 w-24 rounded bg-neutral-200/80" />
        <div className="h-11 w-44 rounded-xl bg-neutral-200/90" />
        <div className="h-3 w-20 rounded bg-neutral-200/60" />
        <div className="pt-5 border-t border-neutral-200 space-y-2">
          <div className="h-3.5 w-28 rounded bg-neutral-200/70" />
          <div className="h-7 w-36 rounded-lg bg-neutral-200/80" />
        </div>
      </div>
    </div>

    <div className="space-y-3 pt-2">
      <div className="h-6 w-56 rounded-lg bg-neutral-200/70" />
      <div className="h-3.5 w-full rounded bg-neutral-100" />
      <div className="h-3.5 w-5/6 rounded bg-neutral-100" />
    </div>
  </div>
);

/** Skeleton matching list/directory pages (Trending, GuidesList, DirectoriesList) */
export const SkeletonDirectoryList: React.FC = () => (
  <div className="w-full pt-4 sm:pt-6 pb-8 space-y-6 animate-pulse">
    <div className="space-y-3 text-center max-w-2xl mx-auto">
      <div className="h-8 sm:h-9 w-2/3 mx-auto rounded-xl bg-neutral-200/80" />
      <div className="h-4 w-4/5 mx-auto rounded-lg bg-neutral-100" />
      <div className="h-10 w-full max-w-lg mx-auto rounded-xl bg-neutral-100 border border-neutral-200/70" />
    </div>

    <div className="rounded-3xl border border-neutral-200/80 bg-white p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div className="h-5 w-40 rounded bg-neutral-200/80" />
        <div className="h-4 w-20 rounded bg-neutral-100" />
      </div>
      <div className="divide-y divide-neutral-100">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="flex items-center justify-between gap-3 py-3.5">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-neutral-200/70" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="h-4 w-36 rounded bg-neutral-200/80" />
                <div className="h-3 w-64 max-w-full rounded bg-neutral-100" />
              </div>
            </div>
            <div className="h-8 w-16 rounded-xl bg-neutral-100 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/** Skeleton matching ProfilePage: top bar + hero banner + overlapping avatar + 4 stats + underline tabs + 2-col overview */
export const SkeletonProfile: React.FC = () => (
  <div className="min-h-screen bg-white text-neutral-900 font-sans w-full animate-pulse">
    {/* Top bar */}
    <div className="border-b border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-neutral-200/70" />
          <div className="h-4 w-16 rounded bg-neutral-200/80" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-lg bg-neutral-100" />
          <div className="h-8 w-20 rounded-lg bg-neutral-100" />
        </div>
      </div>
    </div>

    <div className="mx-auto max-w-4xl px-3.5 sm:px-6 py-5 sm:py-7 space-y-6">
      {/* Hero card */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
        <div className="h-32 sm:h-40 bg-neutral-200/70" />
        <div className="px-4 pb-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-3 sm:gap-4">
              <div className="-mt-10 sm:-mt-12 h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-neutral-300/80 ring-4 ring-white" />
              <div className="space-y-2 pb-1">
                <div className="h-6 w-40 rounded-lg bg-neutral-200/80" />
                <div className="h-3.5 w-28 rounded bg-neutral-100" />
              </div>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <div className="h-9 w-32 rounded-xl bg-neutral-200/80" />
              <div className="h-9 w-9 rounded-xl bg-neutral-100" />
            </div>
          </div>
          <div className="mt-4 h-3.5 w-2/3 rounded bg-neutral-100" />
          <div className="mt-3 flex gap-4">
            <div className="h-3 w-24 rounded bg-neutral-100" />
            <div className="h-3 w-36 rounded bg-neutral-100" />
          </div>
        </div>
      </div>

      {/* 4 Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-200/80 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-neutral-100" />
              <div className="h-7 w-7 rounded-lg bg-neutral-100" />
            </div>
            <div className="h-6 w-14 rounded bg-neutral-200/80" />
            <div className="h-2.5 w-24 rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      {/* Underline tabs */}
      <div className="flex items-center gap-6 border-b border-neutral-200 pb-2.5">
        <div className="h-4 w-16 rounded bg-neutral-200/80" />
        <div className="h-4 w-20 rounded bg-neutral-100" />
        <div className="h-4 w-28 rounded bg-neutral-100" />
        <div className="h-4 w-14 rounded bg-neutral-100" />
      </div>

      {/* 2-col overview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 space-y-3">
            <div className="h-4 w-20 rounded bg-neutral-200/80" />
            <div className="h-3.5 w-full rounded bg-neutral-100" />
            <div className="h-3.5 w-4/5 rounded bg-neutral-100" />
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-neutral-200/80" />
            <div className="h-14 w-full rounded-xl bg-neutral-100" />
            <div className="h-14 w-full rounded-xl bg-neutral-100" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-neutral-200/80" />
            <div className="h-10 w-full rounded-xl bg-neutral-100" />
            <div className="h-10 w-full rounded-xl bg-neutral-100" />
          </div>
        </div>
      </div>
    </div>
  </div>
);
