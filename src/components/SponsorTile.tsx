import React from 'react';
import { Star } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { getWebsiteFavicon } from '../utils/logo';
import { BorderBeam } from './BorderBeam';
import { openOutboundUrl } from '../utils/referral';

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

  // ── Custom Featured Product State — clean, beautiful spotlight row ──
  if (product) {
    const logoSrc = product.logoUrl || getWebsiteFavicon(product.url);

    return (
      <BorderBeam size="md" colorVariant="colorful" strength={0.85} className="w-full rounded-2xl">
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
          className="group relative flex w-full items-center gap-3.5 sm:gap-4.5 rounded-2xl border border-neutral-200/90 bg-gradient-to-r from-neutral-50/70 via-white to-white p-3.5 sm:p-4 text-left transition-all duration-200 ease-out cursor-pointer hover:border-neutral-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
        >
          {/* Logo container */}
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-1 transition-all duration-200 group-hover:scale-105 group-hover:border-neutral-300 shadow-2xs">
            <ProductLogo
              src={logoSrc}
              alt={product.name}
              containerClassName="flex h-full w-full items-center justify-center bg-transparent relative"
              iconClassName="h-6 w-6 text-neutral-400 shrink-0"
            />
          </div>

          {/* Details — Name + Featured badge & Tagline */}
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] sm:text-base font-bold tracking-tight text-neutral-950 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-neutral-900 to-neutral-950 px-2 py-0.5 text-[10px] font-bold tracking-tight text-white shadow-2xs select-none">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>Featured</span>
              </span>
            </div>
            <p className="mt-1 text-[13px] sm:text-[13.5px] font-normal leading-relaxed text-neutral-600 line-clamp-1 sm:line-clamp-2">
              {product.tagline}
            </p>
          </div>
        </div>
      </BorderBeam>
    );
  }

  // ── Default "The featured spot is open" State — matching exact row height and shape ──
  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.85} className="w-full rounded-2xl">
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
        className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-neutral-200/90 bg-white p-4 text-left transition-all duration-200 ease-out cursor-pointer hover:border-neutral-300 hover:bg-neutral-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:gap-4 shadow-2xs"
      >
        {/* Icon tile */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/90 bg-blue-50/60 text-blue-600 transition-colors group-hover:border-blue-300 group-hover:bg-blue-100/70 sm:h-14 sm:w-14 shadow-2xs">
          <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400 text-amber-500 transition-transform group-hover:scale-110" />
        </div>

        {/* Copy — title, Featured badge, tagline */}
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-neutral-950 sm:text-base group-hover:text-blue-600 transition-colors">
              The featured spot is open
            </h3>
            <span className="inline-flex shrink-0 items-center rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 select-none">
              Featured
            </span>
          </div>
          <p className="mt-1 truncate text-[12.5px] font-medium leading-relaxed text-neutral-600 sm:text-[13px]">
            Put your product at the top of TopSAAS · Seen by every builder who visits
          </p>
        </div>

        {/* Action button - right aligned */}
        <div className="flex shrink-0 items-center self-center pl-1 sm:pl-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
          >
            Reserve spot
          </button>
        </div>
      </div>
    </BorderBeam>
  );
};
