import React from 'react';
import { ArrowUpRight, ShieldCheck, ChevronUp, MessageCircle } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { timeAgo } from './ProductRow';

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
      className={`group relative flex flex-col bg-[#2a2a2a] p-5 text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60 ${
        isWinner
          ? 'bg-[#2f2f2f] hover:bg-[#373737]'
          : 'hover:bg-[#333333]'
      }`}
    >
      {/* Icon + rank */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] transition-colors group-hover:border-neutral-700">
          <ProductLogo
            src={product.logoUrl}
            alt={product.name}
            containerClassName="flex h-full w-full items-center justify-center bg-transparent relative"
            iconClassName="h-4.5 w-4.5 text-neutral-500 shrink-0"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono-num text-[11px] font-bold ${isWinner ? 'text-mint-300' : 'text-neutral-600'}`}>
            #{rank}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white">
        <span className="truncate">{product.name}</span>
        {verified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-mint-500" title="Verified listing" />}
      </h3>

      {/* Description */}
      <p className="mt-1 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-400 line-clamp-2">
        {product.tagline}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-800 pt-3">
        <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden text-[10.5px] font-semibold text-neutral-500">
          {product.category && (
            <span
              className="truncate rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-300 shrink-0 max-w-[110px] sm:max-w-[140px]"
              title={product.category}
            >
              {product.category}
            </span>
          )}
          <span className="shrink-0">{timeAgo(product.createdAt)}</span>
          <span className="inline-flex items-center gap-1 text-neutral-400 shrink-0">
            <MessageCircle className="h-3 w-3 text-neutral-500" />
            <span className="font-mono-num">{commentCount ?? 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onUpvote && (
            <button
              type="button"
              onClick={handleUpvote}
              title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 ${
                upvoted
                  ? 'border-mint-500 bg-mint-500 text-[#0b0f14]'
                  : 'border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-500 hover:text-white'
              }`}
            >
              <ChevronUp className="h-3 w-3" />
              <span className="font-mono-num">{product.upvotes ?? 0}</span>
            </button>
          )}
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-800 text-neutral-600 opacity-0 transition-all group-hover:opacity-100 group-hover:border-neutral-600 group-hover:text-white">
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </div>
  );
};
