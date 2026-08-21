import React from 'react';
import { Crown, ShieldCheck, Share2, ArrowUp, ArrowDown, ExternalLink, ThumbsUp } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';

interface ProductCardProps {
  product: Product;
  rank: number;
  soundEnabled: boolean;
  onViewDetails: (product: Product) => void;
  onShareProduct: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onUpvote?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  rank,
  soundEnabled,
  onViewDetails,
  onShareProduct,
  onTrackClick,
  onUpvote,
}) => {
  const prevRank = product.previousRank ?? rank;
  const rankDiff = prevRank - rank;

  // Progressive highlight fading from #1 down to others
  const cardHighlightClass = (() => {
    if (rank === 1) return 'border-2 border-black bg-white shadow-xs';
    if (rank === 2) return 'border border-neutral-800 bg-white shadow-2xs';
    if (rank === 3) return 'border border-neutral-600 bg-white shadow-2xs';
    if (rank === 4) return 'border border-neutral-400 bg-white';
    if (rank === 5) return 'border border-neutral-300 bg-white';
    if (product.isUserOwned) return 'border-neutral-400 bg-white';
    return 'border-neutral-200 bg-white';
  })();

  return (
    <div
      id={`mobile-product-card-${product.id}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a')) return;
        playSound('click', soundEnabled);
        onViewDetails(product);
      }}
      className={`group cursor-pointer rounded-xl border p-3 transition-all flex flex-col justify-between h-full w-full hover:border-black hover:shadow-xs ${cardHighlightClass}`}
    >
      <div>
        {/* Top row: Rank badge + Favicon + Name & Domain + Share */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Rank Badge */}
            {rank === 1 ? (
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-black text-white font-black shadow-2xs"
                title="#1 on the page"
              >
                <Crown className="h-3 w-3 fill-white stroke-white" />
              </div>
            ) : rank === 2 ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white font-black text-[11px] font-mono-num shadow-2xs">
                #2
              </div>
            ) : rank === 3 ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-700 text-white font-extrabold text-[11px] font-mono-num shadow-2xs">
                #3
              </div>
            ) : rank === 4 ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-300 text-black font-bold text-[11px] font-mono-num">
                #4
              </div>
            ) : rank === 5 ? (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-200 text-neutral-800 font-bold text-[11px] font-mono-num">
                #5
              </div>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-neutral-500 font-semibold font-mono-num text-[11px] border border-neutral-200">
                #{rank}
              </div>
            )}

            {/* Favicon / Avatar */}
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white shadow-2xs cursor-pointer hover:border-black transition-colors"
            >
              {product.logoUrl ? (
                <img
                  src={product.logoUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-bold text-[10px] text-black">{product.name[0]}</span>
              )}
            </button>

            {/* Name */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onViewDetails(product)}
                  className="font-bold text-black text-left hover:underline truncate text-xs sm:text-sm cursor-pointer"
                >
                  {product.name}
                </button>
                {product.verified && (
                  <ShieldCheck className="h-3 w-3 text-black shrink-0" />
                )}
                {product.isUserOwned && (
                  <span className="rounded bg-black px-1 py-0.2 text-[8px] font-black text-white">
                    YOU
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Share & Rank Delta */}
          <div className="flex items-center gap-1 shrink-0">
            {rankDiff > 0 ? (
              <span className="flex items-center text-[10px] font-bold text-neutral-800 font-mono-num">
                <ArrowUp className="h-2.5 w-2.5" />+{rankDiff}
              </span>
            ) : rankDiff < 0 ? (
              <span className="flex items-center text-[10px] font-bold text-neutral-500 font-mono-num">
                <ArrowDown className="h-2.5 w-2.5" />{rankDiff}
              </span>
            ) : null}

            <button
              type="button"
              onClick={() => onShareProduct(product)}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-400 hover:text-black hover:bg-neutral-50 cursor-pointer transition-colors"
              title="Share"
            >
              <Share2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Tagline */}
        <p className="mt-1.5 text-xs text-neutral-500 font-medium line-clamp-1">
          {product.tagline}
        </p>
      </div>

      {/* Footer Info & Free Action Buttons */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600">
            {product.category}
          </span>
          <span className="text-[11px] text-neutral-400 font-mono-num">
            {product.clicks.toLocaleString()} visits
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onUpvote && (
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onUpvote(product);
              }}
              title="Upvote website (Free)"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-bold text-black hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs min-h-[28px]"
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="font-mono-num">{product.upvotes ?? 0}</span>
            </button>
          )}

          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick(product.id, product.url)}
            title="Visit Website"
            className="inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold active:scale-95 transition-all shadow-2xs bg-black text-white hover:bg-neutral-800 cursor-pointer min-h-[28px]"
          >
            <span>Visit</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
