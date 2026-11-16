import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ProductRow } from './ProductRow';
import { SkeletonRows } from './SkeletonCard';
import { playSound } from '../utils/sound';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Collect distinct categories present in this section's products
  const sectionCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) {
        p.category.split(',').forEach((c) => {
          const trimmed = c.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products by the selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter((p) =>
      p.category ? p.category.toLowerCase().includes(selectedCategory.toLowerCase()) : false
    );
  }, [products, selectedCategory]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'All') return products.length;
    return products.filter((p) =>
      p.category ? p.category.toLowerCase().includes(cat.toLowerCase()) : false
    ).length;
  };

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="w-full rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-xs"
    >
      <div className="mb-4 pb-3 border-b border-neutral-100">
        <h2
          id={`${id}-heading`}
          className="text-base font-extrabold tracking-tight text-neutral-950 sm:text-lg"
        >
          {title}
        </h2>
        <p className="text-xs font-medium text-neutral-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Category filter chips for better sorting within this period */}
      {products.length > 0 && sectionCategories.length > 0 && (
        <div
          className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none min-w-0"
          role="navigation"
          aria-label={`${title} categories`}
        >
          {['All', ...sectionCategories].map((cat) => {
            const count = getCategoryCount(cat);
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setSelectedCategory(cat);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                  active
                    ? 'border-mint-500/60 bg-mint-500/15 text-mint-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950'
                }`}
              >
                <span className="whitespace-nowrap">{cat}</span>
                <span
                  className={`rounded-md px-1.5 py-px text-[9px] font-black font-mono-num ${
                    active ? 'bg-mint-500/20 text-mint-700' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <SkeletonRows count={3} />
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-8 text-center">
          <p className="text-xs font-semibold text-neutral-500">
            {selectedCategory === 'All'
              ? emptyMessage
              : `No launches found in "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product, index) => (
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
