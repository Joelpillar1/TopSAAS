import React from 'react';
import { Crown, ShieldCheck, Share2, ExternalLink, ChevronUp } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';

interface ProductCardProps {
  product: Product;
  rank: number;
  soundEnabled: boolean;
  showVerified?: boolean;
  onShareProduct: (product: Product) => void;
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
  onShareProduct,
  onTrackClick,
  onOpenDetail,
  onUpvote,
  upvoted = false,
}) => {
  // Card border treatment: rank 1–3 get a bold editorial stroke
  const cardHighlightClass = (() => {
    if (rank === 1) return 'border-2 border-mint-500/60 shadow-xs';
    if (rank === 2) return 'border-2 border-neutral-600 shadow-xs';
    if (rank === 3) return 'border-2 border-neutral-700 shadow-xs';
    return 'border border-neutral-800 hover:border-neutral-600';
  })();

  const handleVisit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click', soundEnabled);
    onTrackClick(product.id, product.url);
    window.open(product.url, '_blank', 'noopener,noreferrer');
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShareProduct(product);
  };

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
    rank === 1 ? (
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-mint-500 text-[#0b0f14] shadow-2xs"
        title="#1 in the directory"
      >
        <Crown className="h-3.5 w-3.5 fill-[#0b0f14] stroke-[#0b0f14]" />
      </div>
    ) : rank === 2 ? (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-700 text-white text-[11px] font-black font-mono-num shadow-2xs">
        #2
      </div>
    ) : rank === 3 ? (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-800 text-white text-[11px] font-black font-mono-num shadow-2xs">
        #3
      </div>
    ) : (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center font-mono-num text-xs font-semibold text-neutral-600 group-hover:text-white transition-colors">
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
          containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] shadow-2xs group-hover:border-neutral-600 transition-all relative"
          iconClassName="h-4 w-4 text-neutral-500 shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white truncate text-sm">
              {product.name}
            </span>
            {showVerified && product.verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-mint-500 shrink-0" title="Verified listing" />
            )}
            {product.isUserOwned && (
              <span className="rounded-full border border-neutral-300 px-1.5 py-px text-[8px] font-black uppercase tracking-wider text-neutral-500">
                Yours
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-500 font-medium line-clamp-1">
            {product.tagline}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-neutral-800">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {onUpvote && (
            <button
              type="button"
              onClick={handleUpvote}
              title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
              className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer active:scale-95 ${
                upvoted
                  ? 'border-mint-500 bg-mint-500 text-[#0b0f14]'
                  : 'border-neutral-700 bg-transparent text-neutral-300 hover:border-neutral-500 hover:text-white'
              }`}
            >
              <ChevronUp className="h-3 w-3" />
              <span className="font-mono-num">{product.upvotes ?? 0}</span>
            </button>
          )}
          <span className="truncate rounded-md bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400">
            {product.category}
          </span>
          <span className="shrink-0 text-[10px] text-neutral-600 font-mono-num">
            {product.clicks.toLocaleString()} visits
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-800 bg-transparent text-neutral-500 hover:text-white hover:border-neutral-600 cursor-pointer transition-colors"
            title="Share profile"
          >
            <Share2 className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleVisit}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-700 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-mint-500 hover:text-[#0b0f14]"
            title={`Visit ${product.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}`}
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </div>
    </>
  );

  const sharedClass = `group flex flex-col justify-between rounded-xl border bg-[#2a2a2a] p-3.5 transition-all cursor-pointer h-full w-full hover:bg-[#333333] ${cardHighlightClass}`;

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
