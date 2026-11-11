import React from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { getWebsiteFavicon } from '../utils/logo';
import { openOutboundUrl } from '../utils/referral';
import { GridPattern } from './ui/grid-pattern';

interface SponsorTileProps {
  soundEnabled: boolean;
  product?: Product | null;
  onOpenFeaturedSpotModal: () => void;
  onOpenProduct?: (product: Product) => void;
  onTrackClick?: (productId: string, url: string) => void;
  onUpvote?: (product: Product) => void;
  upvoted?: boolean;
}

export const SponsorTile: React.FC<SponsorTileProps> = ({
  soundEnabled,
  product,
  onOpenFeaturedSpotModal,
  onOpenProduct,
  onTrackClick,
}) => {
  const handleClick = () => {
    playSound('click', soundEnabled);
    if (product) {
      if (product.url) {
        openOutboundUrl(product.url, {
          productId: product.id,
          productName: product.name,
          campaign: 'sponsor_tile',
          onTrackClick,
        });
      } else if (onOpenProduct) {
        onOpenProduct(product);
      }
    } else {
      onOpenFeaturedSpotModal();
    }
  };

  // ── Featured Product Spotlight ──
  if (product) {
    const logoSrc = product.logoUrl || getWebsiteFavicon(product.url);

    return (
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
        className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-neutral-300/80 bg-gradient-to-b from-neutral-100/90 via-neutral-50/50 to-neutral-100/80 p-4 sm:p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:border-neutral-400 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
      >
        {/* Subtle Background Grid */}
        <GridPattern
          width={20}
          height={20}
          x={-1}
          y={-1}
          className="stroke-neutral-900/[0.04] fill-none group-hover:stroke-neutral-900/[0.06] transition-colors duration-300"
        />

        {/* Right Ambient Watermark of Product Logo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -bottom-6 h-36 w-36 select-none opacity-[0.08] transition-all duration-300 group-hover:opacity-[0.14] group-hover:scale-105"
        >
          <ProductLogo
            src={logoSrc}
            alt=""
            containerClassName="h-full w-full flex items-center justify-center grayscale"
            iconClassName="h-full w-full text-neutral-900"
          />
        </div>

        {/* Top Kicker Row: "topsaas featured ↗" (no T box frame, arrow in front) */}
        <div className="relative z-10 flex items-center justify-between mb-3 select-none">
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 group-hover:text-neutral-800 transition-colors">
            <span>topsaas featured</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-800 transition-colors" />
          </div>
        </div>

        {/* Main Row: Logo (edge-to-edge rounded-2xl, no black padding) + Name & Tagline */}
        <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
          {/* Logo container matching exact app border radius without inner black padding */}
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-2xs transition-transform duration-200 group-hover:scale-105">
            <ProductLogo
              src={logoSrc}
              alt={product.name}
              className="h-full w-full object-cover rounded-2xl"
              containerClassName="flex h-full w-full items-center justify-center bg-transparent relative rounded-2xl overflow-hidden"
              iconClassName="h-6 w-6 text-neutral-400 shrink-0"
            />
          </div>

          {/* Name & Tagline */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] sm:text-base font-bold tracking-tight text-neutral-950 group-hover:text-blue-600 transition-colors">
              {product.name}
            </h3>
            <p className="mt-0.5 truncate text-[12.5px] sm:text-[13px] font-normal text-neutral-600 group-hover:text-neutral-700 transition-colors">
              {product.tagline}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Open Spotlight Slot ──
  return (
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
      className="group relative flex w-full flex-col overflow-hidden rounded-2xl border border-dashed border-neutral-300/90 bg-gradient-to-b from-neutral-100/90 via-neutral-50/50 to-neutral-100/80 p-4 sm:p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:border-neutral-400 hover:shadow-[0_8px_26px_rgba(0,0,0,0.05)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 shadow-2xs"
    >
      {/* Subtle Background Grid */}
      <GridPattern
        width={20}
        height={20}
        x={-1}
        y={-1}
        className="stroke-neutral-900/[0.04] fill-none group-hover:stroke-neutral-900/[0.06] transition-colors duration-300"
      />

      {/* Top Kicker Row */}
      <div className="relative z-10 flex items-center justify-between mb-3 select-none">
        <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-neutral-500 group-hover:text-neutral-800 transition-colors">
          <span>topsaas featured spot</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-neutral-800 transition-colors" />
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:bg-neutral-800 transition-all cursor-pointer active:scale-95"
        >
          Reserve spot
        </button>
      </div>

      {/* Main Row */}
      <div className="relative z-10 flex items-center gap-3.5 sm:gap-4 min-w-0">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-neutral-800 shadow-2xs transition-transform duration-200 group-hover:scale-105">
          <Star className="h-6 w-6 fill-amber-400 text-amber-500" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] sm:text-base font-bold tracking-tight text-neutral-950 group-hover:text-blue-600 transition-colors">
            The featured spot is open
          </h3>
          <p className="mt-0.5 truncate text-[12.5px] sm:text-[13px] font-normal text-neutral-600">
            Put your product at the top of TopSAAS · Seen by every builder who visits
          </p>
        </div>
      </div>
    </div>
  );
};
