import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

export const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 flex flex-col justify-between h-full w-full">
      <div>
        {/* Top row: rank + favicon + name + share */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Shimmer className="h-6 w-6 shrink-0 rounded-md" />
            <Shimmer className="h-6 w-6 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <Shimmer className="h-4 w-24 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Shimmer className="h-6 w-6 rounded-md" />
          </div>
        </div>
        {/* Tagline */}
        <Shimmer className="mt-1.5 h-3 w-full rounded" />
      </div>
      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-4 w-14 rounded" />
          <Shimmer className="h-3 w-12 rounded" />
        </div>
        <div className="flex items-center gap-1.5">
          <Shimmer className="h-7 w-12 rounded-lg" />
          <Shimmer className="h-7 w-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
};
