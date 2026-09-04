import React from 'react';
import { GridFillerCell, useGridColumns } from './GridFiller';

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-800 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s infinite linear' }}
  />
);

/** Mirrors ProductTile — logo, rank, title, tagline, footer */
export const SkeletonTile: React.FC = () => (
  <div className="flex flex-col bg-[#2a2a2a] p-5 h-full">
    <div className="flex items-start justify-between">
      <Shimmer className="h-11 w-11 rounded-lg shrink-0" />
      <Shimmer className="h-3 w-6 rounded" />
    </div>
    <Shimmer className="mt-4 h-4 w-28 rounded" />
    <div className="mt-1 flex-1 space-y-1.5">
      <Shimmer className="h-3 w-full rounded" />
      <Shimmer className="h-3 w-4/5 rounded" />
    </div>
    <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
      <Shimmer className="h-3 w-16 rounded" />
      <Shimmer className="h-6 w-14 rounded-full" />
    </div>
  </div>
);

/** Bento grid skeleton — same grid classes and filler cells as the live directory */
export const SkeletonGrid: React.FC<{ count?: number }> = ({ count }) => {
  const cols = useGridColumns();
  const tileCount = count ?? cols * 2;
  const fillerCount = (cols - (tileCount % cols)) % cols;

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: tileCount }).map((_, i) => (
        <SkeletonTile key={`skeleton-tile-${i}`} />
      ))}
      {Array.from({ length: fillerCount }).map((_, i) => (
        <GridFillerCell key={`skeleton-filler-${i}`} />
      ))}
    </div>
  );
};

/** @deprecated Use SkeletonTile — kept for any legacy imports */
export const SkeletonCard = SkeletonTile;
