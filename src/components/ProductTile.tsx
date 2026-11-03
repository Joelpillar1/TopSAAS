import React from 'react';
import { ChevronUp, MessageCircle } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { RankMedal } from './RankMedal';

interface ProductTileProps {
  product: Product;
  rank: number;
  soundEnabled: boolean;
  verified?: boolean;
  commentCount?: number;
  onOpen: (product: Product) => void;
  onUpvote?: (product: Product) => void;
  upvoted?: boolean;
}

export const ProductTile: React.FC<ProductTileProps> = ({
  product,
  rank,
  soundEnabled,
  verified = false,
  commentCount,
  onOpen,
  onUpvote,
  upvoted = false,
}) => {
  const isWinner = rank === 1;

  const handleOpen = () => {
    playSound('click', soundEnabled);
    onOpen(product);
  };

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpvote?.(product);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={`group relative flex flex-col bg-white p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60 rounded-xl border ${
        isWinner
          ? 'border-mint-500/40 hover:border-mint-500 hover:bg-neutral-100 shadow-2xs hover:shadow-md'
          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-100 shadow-2xs hover:shadow-md'
      }`}
    >
      {/* Icon + rank */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 transition-all duration-200 group-hover:border-neutral-300 group-hover:scale-105 group-hover:shadow-xs">
          <ProductLogo
            src={product.logoUrl}
            alt={product.name}
            containerClassName="flex h-full w-full items-center justify-center bg-transparent relative"
            iconClassName="h-4.5 w-4.5 text-neutral-500 shrink-0 group-hover:text-neutral-700 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {rank === 1 || rank === 2 || rank === 3 ? (
            <RankMedal rank={rank as 1 | 2 | 3} className="h-6 w-6" />
          ) : (
            <span className="font-mono-num text-[11px] font-bold text-neutral-400 group-hover:text-neutral-600 transition-colors">
              #{rank}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-neutral-950 group-hover:text-mint-600 transition-colors duration-200">
        <span className="truncate">{product.name}</span>
        {verified && <VerifiedBadge className="h-3.5 w-3.5 shrink-0" title="Verified Startup" />}
        {product.offerDiscount && (
          <span className="rounded bg-mint-50 border border-mint-200 px-1.5 py-px text-[9px] font-black text-mint-700 shrink-0">
            {product.offerDiscount}
          </span>
        )}
      </h3>

      {/* Description */}
      <p className="mt-1 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-600 group-hover:text-neutral-800 line-clamp-2 transition-colors duration-200">
        {product.tagline}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 group-hover:border-neutral-300 pt-3 transition-colors">
        {/* Left: Category tag + Comment count (always fully visible) */}
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-1">
          {product.category && (
            <span
              className="truncate rounded-md bg-neutral-100 border border-neutral-200 group-hover:border-neutral-300 group-hover:text-neutral-950 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600 min-w-0 max-w-[110px] sm:max-w-[140px] transition-colors duration-200"
              title={product.category}
            >
              {product.category}
            </span>
          )}
          <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-neutral-500">
            <MessageCircle className="h-3 w-3 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
            <span className="font-mono-num">{commentCount ?? 0}</span>
          </span>
        </div>

        {/* Right: Upvote button */}
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
    </div>
  );
};
