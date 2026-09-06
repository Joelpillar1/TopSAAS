import React from 'react';
import { ShieldCheck, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { BorderBeam } from './BorderBeam';

interface HeroClaimBannerProps {
  topProduct?: Product;
  soundEnabled: boolean;
  onTrackClick: (productId: string, url: string) => void;
}

export const HeroClaimBanner: React.FC<HeroClaimBannerProps> = ({
  topProduct,
  soundEnabled,
  onTrackClick,
}) => {
  if (!topProduct) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playSound('click', soundEnabled);
    onTrackClick(topProduct.id, topProduct.url);
  };

  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.7} className="w-full rounded-xl">
      <a
        id="hero-claim-banner"
        href={topProduct.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-mint-500/40 bg-[#2a2a2a] px-3.5 py-3 sm:px-4 sm:py-3 shadow-xs hover:bg-[#333333] transition-all cursor-pointer text-left block w-full"
      >
      {/* Left: Featured Product Info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">

        {/* Favicon / Avatar */}
        <ProductLogo
          src={topProduct.logoUrl}
          alt={topProduct.name}
          containerClassName="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] shadow-2xs group-hover:border-neutral-600 transition-all relative"
          iconClassName="h-4 w-4 text-neutral-500 shrink-0"
        />

        {/* Name & Tagline */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-black tracking-tight text-white group-hover:underline">
              {topProduct.name}
            </span>
            {topProduct.verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-mint-500 shrink-0" title="Verified Website" />
            )}
            <span className="text-[11px] text-neutral-500 hidden sm:inline truncate max-w-md">
              — {topProduct.tagline}
            </span>
          </div>
          <p className="text-[11px] font-medium text-neutral-500 line-clamp-1 sm:hidden">
            {topProduct.tagline}
          </p>
        </div>
      </div>

      {/* Right: Category & Subtle External Link Icon */}
      <div className="flex items-center gap-2 shrink-0 pl-2">
        {topProduct.category && (
          <span className="hidden md:inline-block rounded-md border border-neutral-700 bg-neutral-800/60 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
            {topProduct.category}
          </span>
        )}
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-400 group-hover:bg-mint-500 group-hover:text-[#0b0f14] transition-all">
          <ExternalLink className="h-3.5 w-3.5" />
        </div>
      </div>
    </a>
    </BorderBeam>
  );
};
