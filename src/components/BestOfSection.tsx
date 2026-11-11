import React from 'react';
import { Product } from '../types';
import { ProductRow } from './ProductRow';
import { SkeletonRows } from './SkeletonCard';

interface BestOfSectionProps {
  id: string;
  title: string;
  subtitle: string;
  products: Product[];
  emptyMessage: string;
  soundEnabled: boolean;
  commentCounts: Record<string, number>;
  isLoading?: boolean;
  onOpenProduct: (product: Product) => void;
  onUpvote: (product: Product) => void;
  isUpvoted: (productId: string) => boolean;
}

/**
 * Homepage ranking list for a completed period, using the same row design as
 * the main directory. The top 3 rows get a light blue gradient background.
 */
export const BestOfSection: React.FC<BestOfSectionProps> = ({
  id,
  title,
  subtitle,
  products,
  emptyMessage,
  soundEnabled,
  commentCounts,
  isLoading = false,
  onOpenProduct,
  onUpvote,
  isUpvoted,
}) => {
  return (
    <section aria-labelledby={`${id}-heading`} className="w-full pt-3">
      <div className="mb-3">
        <h2
          id={`${id}-heading`}
          className="text-sm font-black tracking-tight text-neutral-950 sm:text-base"
        >
          {title}
        </h2>
        <p className="text-[11px] font-medium text-neutral-500">{subtitle}</p>
      </div>

      {isLoading ? (
        <SkeletonRows count={3} />
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center">
          <p className="text-xs font-semibold text-neutral-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => (
            <ProductRow
              key={product.id}
              product={product}
              rank={index + 1}
              blueGradient={index < 3}
              soundEnabled={soundEnabled}
              showVerified
              commentCount={commentCounts[product.id] ?? 0}
              onOpen={onOpenProduct}
              onUpvote={onUpvote}
              upvoted={isUpvoted(product.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
