import React from 'react';
import { ChevronLeft } from 'lucide-react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

export const SkeletonProductPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-neutral-50/40 text-neutral-900 flex flex-col font-sans pb-12 sm:pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-neutral-100">
        <div className="mx-auto w-full max-w-7xl px-3.5 py-2.5 sm:px-6 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-bold text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Shimmer className="h-3 w-16 rounded" />
            <span className="text-neutral-300">/</span>
            <Shimmer className="h-3 w-20 rounded" />
            <span className="text-neutral-300">/</span>
            <Shimmer className="h-3 w-28 rounded" />
          </div>
        </div>
      </div>

      {/* Main Page Content - Side-by-Side 2-Column Grid */}
      <main className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Product Details */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6 min-w-0">
            {/* Header Hero Section */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-7 shadow-xs space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
                {/* Logo and titles */}
                <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
                  <Shimmer className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl" />
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Shimmer className="h-7 w-44 sm:w-56 rounded-lg" />
                      <Shimmer className="h-5 w-20 rounded-full" />
                    </div>
                    <Shimmer className="h-4 w-3/4 rounded" />
                    <div className="flex items-center gap-2 pt-1">
                      <Shimmer className="h-3.5 w-24 rounded" />
                      <Shimmer className="h-3.5 w-16 rounded" />
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Shimmer className="h-10 w-28 rounded-xl" />
                  <Shimmer className="h-10 w-24 rounded-xl" />
                  <Shimmer className="h-10 w-10 rounded-xl" />
                </div>
              </div>

              {/* Tagline / elevator pitch banner */}
              <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 space-y-2">
                <Shimmer className="h-4 w-full rounded" />
                <Shimmer className="h-4 w-4/5 rounded" />
              </div>
            </div>

            {/* Media Gallery / Screenshot Placeholder */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <Shimmer className="h-4 w-36 rounded" />
                <Shimmer className="h-3 w-20 rounded" />
              </div>
              <Shimmer className="w-full aspect-video rounded-xl sm:rounded-2xl" />
              <div className="flex items-center gap-2">
                <Shimmer className="h-14 w-24 rounded-lg shrink-0" />
                <Shimmer className="h-14 w-24 rounded-lg shrink-0" />
                <Shimmer className="h-14 w-24 rounded-lg shrink-0" />
              </div>
            </div>

            {/* Problem & Solution Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-6 w-6 rounded-lg shrink-0" />
                  <Shimmer className="h-4 w-32 rounded" />
                </div>
                <div className="space-y-2 pt-1">
                  <Shimmer className="h-3 w-full rounded" />
                  <Shimmer className="h-3 w-5/6 rounded" />
                  <Shimmer className="h-3 w-4/5 rounded" />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Shimmer className="h-6 w-6 rounded-lg shrink-0" />
                  <Shimmer className="h-4 w-32 rounded" />
                </div>
                <div className="space-y-2 pt-1">
                  <Shimmer className="h-3 w-full rounded" />
                  <Shimmer className="h-3 w-5/6 rounded" />
                  <Shimmer className="h-3 w-3/4 rounded" />
                </div>
              </div>
            </div>

            {/* Discussion / Comments Section */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <Shimmer className="h-5 w-28 rounded" />
                <Shimmer className="h-4 w-16 rounded" />
              </div>
              <Shimmer className="h-20 w-full rounded-xl" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-neutral-100">
                    <Shimmer className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Shimmer className="h-3.5 w-24 rounded" />
                        <Shimmer className="h-3 w-16 rounded" />
                      </div>
                      <Shimmer className="h-3 w-full rounded" />
                      <Shimmer className="h-3 w-2/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Metadata */}
          <div className="lg:col-span-4 space-y-5">
            {/* Rank & Stats Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
              <Shimmer className="h-4 w-28 rounded" />
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50/80">
                <div className="space-y-1">
                  <Shimmer className="h-3 w-14 rounded" />
                  <Shimmer className="h-6 w-12 rounded" />
                </div>
                <div className="space-y-1 text-right">
                  <Shimmer className="h-3 w-14 rounded ml-auto" />
                  <Shimmer className="h-6 w-16 rounded ml-auto" />
                </div>
              </div>
            </div>

            {/* Maker / Founder Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
              <Shimmer className="h-4 w-20 rounded" />
              <div className="flex items-center gap-3 pt-1">
                <Shimmer className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Shimmer className="h-3.5 w-28 rounded" />
                  <Shimmer className="h-3 w-20 rounded" />
                </div>
              </div>
            </div>

            {/* Embed Badge Promotion Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
              <Shimmer className="h-4 w-28 rounded" />
              <Shimmer className="h-12 w-full rounded-xl" />
              <Shimmer className="h-8 w-full rounded-lg" />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

