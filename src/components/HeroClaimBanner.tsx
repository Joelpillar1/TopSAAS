import React from 'react';
import { Crown, ExternalLink, ArrowRight, ShieldCheck, ThumbsUp } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';

interface HeroClaimBannerProps {
  topProduct?: Product;
  soundEnabled: boolean;
  onViewDetails: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onUpvote?: (product: Product) => void;
}

export const HeroClaimBanner: React.FC<HeroClaimBannerProps> = ({
  topProduct,
  soundEnabled,
  onViewDetails,
  onTrackClick,
  onUpvote,
}) => {
  if (!topProduct) return null;

  return (
    <div
      id="hero-claim-banner"
      className="relative overflow-hidden rounded-xl border-2 border-black bg-white px-3 py-2.5 sm:px-4 sm:py-2.5 shadow-xs transition-all"
    >
      <div className="flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-center md:justify-between">
        {/* Left: #1 Featured Website Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Rank 1 Crown Badge */}
          <div className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-black px-2 py-1 text-[10px] font-black text-white">
            <Crown className="h-3 w-3 fill-white text-white" />
            <span className="font-mono-num leading-none">#1 FEATURED</span>
          </div>

          {/* Favicon / Avatar */}
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onViewDetails(topProduct);
            }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs hover:border-black transition-all cursor-pointer"
          >
            {topProduct.logoUrl ? (
              <img
                src={topProduct.logoUrl}
                alt={topProduct.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-xs font-black text-black">{topProduct.name[0]}</span>
            )}
          </button>

          {/* Name & Tagline */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onViewDetails(topProduct);
                }}
                className="text-xs sm:text-sm font-black tracking-tight text-black truncate hover:underline text-left cursor-pointer"
              >
                {topProduct.name}
              </button>
              {topProduct.verified && (
                <ShieldCheck className="h-3 w-3 text-black shrink-0" title="Verified Website" />
              )}
              <span className="text-[11px] text-neutral-400 hidden sm:inline truncate">
                — {topProduct.tagline}
              </span>
            </div>
            <p className="text-[11px] font-medium text-neutral-500 line-clamp-1 sm:hidden">
              {topProduct.tagline}
            </p>
          </div>

          {/* Category Tag */}
          <div className="hidden lg:flex items-center gap-1 text-xs text-neutral-600 shrink-0 font-medium pl-1">
            <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
              {topProduct.category}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onUpvote && (
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onUpvote(topProduct);
              }}
              title="Upvote this website"
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-bold text-black hover:border-black hover:bg-neutral-50 transition-all shadow-2xs cursor-pointer"
            >
              <ThumbsUp className="h-3 w-3" />
              <span className="font-mono-num">{topProduct.upvotes ?? 0}</span>
            </button>
          )}

          <a
            href={topProduct.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTrackClick(topProduct.id, topProduct.url)}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-bold text-black hover:border-black hover:bg-neutral-50 transition-all shadow-2xs"
          >
            <span>Visit</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onViewDetails(topProduct);
            }}
            className="inline-flex items-center justify-center gap-1 rounded-lg bg-black px-3 py-1.5 text-xs font-black text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all border border-black cursor-pointer"
          >
            <span>View Details</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
