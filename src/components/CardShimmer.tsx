import React from 'react';
import { cn } from '@/lib/utils';

interface CardShimmerProps {
  delay?: 1 | 2 | 3 | 'sponsor' | number;
  className?: string;
}

export const CardShimmer: React.FC<CardShimmerProps> = ({ className }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]',
        className
      )}
    >
      <div className="card-shimmer-beam" />
    </div>
  );
};
