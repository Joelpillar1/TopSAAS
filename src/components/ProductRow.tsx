import React from 'react';
import { ArrowUpRight, ShieldCheck, ChevronUp, Crown, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';

interface ProductRowProps {
  product: Product;
  rank: number;
  soundEnabled: boolean;
  showVerified?: boolean;
  /** Comment count shown in the row meta */
  commentCount?: number;
  onOpen: (product: Product) => void;
  /** When provided the row shows an upvote control */
  onUpvote?: (product: Product) => void;
  upvoted?: boolean;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  rank,
  soundEnabled,
  showVerified = false,
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

  const upvoteCount = product.upvotes ?? 0;

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
      className={`group relative flex w-full items-center gap-3.5 bg-white p-3.5 text-left transition-all cursor-pointer sm:gap-4 sm:px-4 rounded-2xl border ${
        isWinner
          ? 'border-mint-400/60 shadow-[0_1px_2px_rgba(16,24,40,0.05),0_12px_28px_-20px_rgba(71,180,110,0.35)] hover:border-mint-400 hover:bg-mint-50/30'
          : 'border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50/70 hover:shadow-[0_6px_24px_-16px_rgba(16,24,40,0.18)]'
      }`}
    >
      {/* Rank chip */}
      {isWinner ? (
        <div className="absolute -left-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-mint-500 text-white shadow-2xs">
          <Crown className="h-3 w-3 fill-white stroke-white" />
        </div>
      ) : null}

      {/* Icon tile — like the tool cards */}
      <div className="relative shrink-0">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-neutral-100 bg-neutral-50 shadow-2xs transition-colors group-hover:border-neutral-200 sm:h-14 sm:w-14">
          <ProductLogo
            src={product.logoUrl}
            alt={product.name}
            containerClassName="flex h-full w-full items-center justify-center bg-transparent relative"
            iconClassName="h-5 w-5 text-neutral-400 shrink-0"
          />
        </div>
        {/* Rank label under the tile for non-winners */}
        {!isWinner && (
          <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-neutral-200 bg-white px-1.5 font-mono-num text-[9px] font-black text-neutral-400 shadow-2xs group-hover:text-neutral-700 transition-colors">
            #{rank}
          </span>
        )}
      </div>

      {/* Copy — title + description */}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-neutral-950 sm:text-base group-hover:text-black transition-colors">
            {product.name}
          </h3>
          {showVerified && product.verified && (
            <ShieldCheck className="h-4 w-4 shrink-0 text-mint-600" title="Verified listing" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-relaxed text-neutral-500 sm:text-[13px] sm:max-w-2xl">
          {product.tagline}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] font-semibold text-neutral-400">
          <span>{timeAgo(product.createdAt)}</span>
          <span className="rounded-md bg-neutral-100 px-1.5 py-px font-bold text-neutral-500">
            {product.category}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span className="font-mono-num">{commentCount ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Actions: upvote + open */}
      <div className="flex shrink-0 flex-col items-end gap-2 self-center sm:gap-2.5">
        {onUpvote && (
          <button
            type="button"
            onClick={handleUpvote}
            title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
              upvoted
                ? 'border-mint-500 bg-mint-500 text-white shadow-[0_4px_12px_-6px_rgba(71,180,110,0.6)]'
                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
            }`}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            <span className="font-mono-num">{upvoteCount}</span>
          </button>
        )}

        {isWinner ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-950 px-2.5 py-1.5 text-[11px] font-bold text-white transition-colors group-hover:bg-neutral-800">
            Winner
            <ArrowUpRight className="h-3 w-3" />
          </span>
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-all group-hover:border-neutral-950 group-hover:bg-neutral-950 group-hover:text-white cursor-pointer">
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
};
