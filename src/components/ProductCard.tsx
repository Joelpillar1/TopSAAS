import React from 'react';
import { ChevronUp, MessageCircle } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { RankMedal } from './RankMedal';

interface ProductCardProps {
  product: Product;
  rank: number;
  soundEnabled: boolean;
  showVerified?: boolean;
  commentCount?: number;
  onShareProduct?: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  /** When provided, the whole card opens the in-app product profile instead of navigating away. */
  onOpenDetail?: (product: Product) => void;
  onUpvote?: (product: Product) => void;
  upvoted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rank,
  soundEnabled,
  showVerified = false,
  commentCount = 0,
  onShareProduct,
  onTrackClick,
  onOpenDetail,
  onUpvote,
  upvoted = false,
}) => {
  const cardHighlightClass = 'border border-neutral-200 hover:border-neutral-300';

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpvote?.(product);
  };

  const openDetail = () => {
    playSound('click', soundEnabled);
    onOpenDetail?.(product);
  };

  const rankBadge =
    rank === 1 || rank === 2 || rank === 3 ? (
      <RankMedal rank={rank as 1 | 2 | 3} className="h-7 w-7" />
    ) : (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center font-mono-num text-xs font-semibold text-neutral-400 group-hover:text-neutral-700 transition-colors">
        {rank}
      </div>
    );

  const cardBody = (
    <>
      {/* Top row: rank + logo + name */}
      <div className="flex items-center gap-2.5 min-w-0">
        {rankBadge}

        <ProductLogo
          src={product.logoUrl}
          alt={product.name}
          containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 shadow-2xs group-hover:border-neutral-300 group-hover:scale-105 transition-all duration-200 relative"
          iconClassName="h-4 w-4 text-neutral-500 shrink-0 group-hover:text-neutral-700 transition-colors"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-950 group-hover:text-mint-600 transition-colors truncate text-sm">
              {product.name}
            </span>
            {showVerified && product.verified && (
              <VerifiedBadge className="h-3.5 w-3.5 shrink-0" title="Verified Startup" />
            )}
            {product.offerDiscount && (
              <span className="rounded bg-mint-50 border border-mint-200 px-1.5 py-px text-[9px] font-black text-mint-700 shrink-0">
                {product.offerDiscount}
              </span>
            )}
            {product.isUserOwned && (
              <span className="rounded-full border border-neutral-300 px-1.5 py-px text-[9px] font-bold text-neutral-600">
                Yours
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-600 group-hover:text-neutral-800 font-medium line-clamp-1 transition-colors">
            {product.tagline}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-neutral-200 group-hover:border-neutral-300 transition-colors">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
          {product.category && (
            <span
              className="truncate rounded-md bg-neutral-100 border border-neutral-200 group-hover:border-neutral-300 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 min-w-0 max-w-[110px] sm:max-w-[140px] transition-colors"
              title={product.category}
            >
              {product.category}
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-neutral-500">
            <MessageCircle className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            <span className="font-mono-num">{commentCount ?? 0}</span>
          </span>
        </div>

        {onUpvote && (
          <button
            type="button"
            onClick={handleUpvote}
            title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
            className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
              upvoted
                ? 'border-mint-500 bg-mint-500 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:border-mint-500/60 hover:text-mint-600 hover:bg-mint-50'
            }`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span className="font-mono-num">{product.upvotes ?? 0}</span>
          </button>
        )}
      </div>
    </>
  );

  const sharedClass = `group flex flex-col justify-between rounded-xl border bg-white p-3.5 transition-all duration-300 ease-out cursor-pointer h-full w-full hover:bg-neutral-100 hover:border-neutral-300 hover:shadow-md hover:-translate-y-0.5 ${cardHighlightClass}`;

  if (onOpenDetail) {
    return (
      <div
        id={`mobile-product-card-${product.id}`}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('a')) return;
          openDetail();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetail();
          }
        }}
        className={sharedClass}
      >
        {cardBody}
      </div>
    );
  }

  return (
    <a
      id={`mobile-product-card-${product.id}`}
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button')) return;
        playSound('click', soundEnabled);
        onTrackClick(product.id, product.url);
      }}
      className={sharedClass}
    >
      {cardBody}
    </a>
  );
};
