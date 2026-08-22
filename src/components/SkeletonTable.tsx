import React from 'react';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

export const SkeletonTable: React.FC = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-100/90 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
              <th className="py-3 pl-4 pr-2 w-14 text-center">Spot</th>
              <th className="py-3 px-4">Website / Product</th>
              <th className="py-3 px-4 text-center hidden md:table-cell">Category</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">Visits</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 pr-4 pl-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {Array.from({ length: 9 }).map((_, i) => (
              <tr key={`skeleton-row-${i}`} className={i < 3 ? 'bg-neutral-50/50' : ''}>
                {/* Spot */}
                <td className="py-3.5 pl-4 pr-2 text-center align-middle">
                  <Shimmer className="h-7 w-7 mx-auto rounded-lg" />
                </td>
                {/* Website / Product */}
                <td className="py-3.5 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <Shimmer className="h-10 w-10 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Shimmer className="h-4 w-32 rounded" />
                      <Shimmer className="h-3 w-48 rounded" />
                    </div>
                  </div>
                </td>
                {/* Category */}
                <td className="py-3.5 px-4 text-center hidden md:table-cell align-middle">
                  <Shimmer className="h-5 w-20 mx-auto rounded-md" />
                </td>
                {/* Visits */}
                <td className="py-3.5 px-4 text-center hidden sm:table-cell align-middle">
                  <Shimmer className="h-4 w-12 mx-auto rounded" />
                </td>
                {/* Score */}
                <td className="py-3.5 px-4 text-center align-middle">
                  <Shimmer className="h-4 w-14 mx-auto rounded" />
                </td>
                {/* Action */}
                <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                  <Shimmer className="h-7 w-7 ml-auto rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
