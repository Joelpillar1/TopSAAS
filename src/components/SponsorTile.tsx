import React from 'react';
import { ArrowUpRight, Crown, Star, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { getWebsiteFavicon } from '../utils/logo';

import { BorderBeam } from './BorderBeam';

interface SponsorTileProps {
  soundEnabled: boolean;
  product?: Product | null;
  onOpenFeaturedSpotModal: () => void;
  onOpenProduct?: (product: Product) => void;
}

export const SponsorTile: React.FC<SponsorTileProps> = ({
  soundEnabled,
  product,
  onOpenFeaturedSpotModal,
  onOpenProduct,
}) => {
  const handleClick = () => {
    playSound('click', soundEnabled);
    if (product && onOpenProduct) {
      onOpenProduct(product);
    } else {
      onOpenFeaturedSpotModal();
    }
  };

  // ── Custom Featured Product State ──
  if (product) {
    const logoSrc = product.logoUrl || getWebsiteFavicon(product.url);
    return (
      <BorderBeam size="md" colorVariant="colorful" strength={0.7} className="h-full rounded-xl">
        <div
          role="button"
          tabIndex={0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          className="group relative flex flex-col h-full bg-[#2a2a2a] p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:bg-[#383838] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded-xl"
        >
          {/* Icon + sponsor badge */}
          <div className="flex items-start justify-between">
            <ProductLogo
              src={logoSrc}
              alt={product.name}
              containerClassName="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xs group-hover:border-amber-500/80 group-hover:scale-105 transition-all"
              iconClassName="h-5 w-5 text-neutral-400 group-hover:text-amber-400 shrink-0"
            />
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-500/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 shadow-xs">
                <Star className="h-2.5 w-2.5 fill-amber-300" />
                Featured
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors duration-200">
            <span className="truncate">{product.name}</span>
            {product.verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
          </h3>

          {/* Description */}
          <p className="mt-1 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-400 group-hover:text-neutral-200 line-clamp-2 transition-colors duration-200">
            {product.tagline}
          </p>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 group-hover:border-neutral-700/80 pt-3 transition-colors">
            <div className="flex items-center gap-2 text-[10.5px] font-semibold text-neutral-500 group-hover:text-neutral-300 transition-colors">
              <span className="truncate max-w-[120px]">{product.category}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 transition-colors group-hover:text-amber-300">
              <span>View Spotlight</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-amber-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
        </div>
      </BorderBeam>
    );
  }

  // ── Default "Reserve Spot" State ──
  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.7} className="h-full rounded-xl">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        className="group relative flex flex-col h-full bg-[#2a2a2a] p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:bg-[#383838] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60 rounded-xl"
      >
        {/* Icon + sponsor badge */}
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] transition-all duration-200 group-hover:border-amber-500/80 group-hover:bg-[#2a2416] group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Crown className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#343434] border border-neutral-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300 group-hover:border-amber-500/60 group-hover:bg-amber-500/20 group-hover:text-amber-300 transition-all duration-200">
              Sponsor
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors duration-200">
          <span className="truncate">Your SaaS Here</span>
        </h3>

        {/* Description */}
        <p className="mt-1 flex-1 text-[12px] font-medium leading-relaxed text-neutral-400 group-hover:text-neutral-200 line-clamp-2 transition-colors duration-200">
          Feature your tool at the top with prime placement and verified visibility.
        </p>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 group-hover:border-neutral-700/80 pt-3 transition-colors">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold text-neutral-500 group-hover:text-neutral-300 transition-colors">
            <span>Featured Spot</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-300 transition-colors group-hover:text-amber-300">
            <span>Get Featured</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-all duration-200 group-hover:text-amber-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </div>
      </div>
    </BorderBeam>
  );
};
