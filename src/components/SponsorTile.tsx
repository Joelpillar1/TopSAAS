import React from 'react';
import { ExternalLink, Star, Flame, ChevronUp, MessageCircle } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
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
  onUpvote,
  upvoted = false,
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

  // ── Custom Featured Product State — same row layout as the product list ──
  if (product) {
    const logoSrc = product.logoUrl || getWebsiteFavicon(product.url);

    // "by Sal" — creator name only (no @handle or duplicate category)
    const handle = product.creatorXHandle || product.creatorUsername;
    const rawCreator = product.creatorName || (handle ? handle.replace(/^@/, '') : null);
    const byline = rawCreator ? `by ${rawCreator}` : null;

    // Categories: on mobile show only one category; on desktop show all
    const categories = product.category
      ? product.category.split(',').map((c) => c.trim()).filter(Boolean)
      : [];
    const primaryCategory = categories[0] || product.category;

    const handleVisit = (e: React.MouseEvent) => {
      e.stopPropagation();
      playSound('click', soundEnabled);
      if (product.url) {
        openOutboundUrl(product.url, {
          productId: product.id,
          productName: product.name,
          campaign: 'sponsor_tile',
          onTrackClick,
        });
      } else {
        handleClick();
      }
    };

    return (
      <BorderBeam size="md" colorVariant="colorful" strength={0.8} className="w-full rounded-2xl">
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
          className="group relative flex w-full items-center gap-3.5 rounded-2xl border border-neutral-300/80 bg-gradient-to-r from-neutral-200/65 via-neutral-100/35 to-white/95 p-4 text-left transition-all duration-200 ease-out cursor-pointer hover:border-neutral-400 hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
        >
          {/* Icon tile */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-colors group-hover:border-neutral-200 sm:h-14 sm:w-14 shadow-2xs">
            <ProductLogo
              src={logoSrc}
              alt={product.name}
              containerClassName="flex h-full w-full items-center justify-center bg-transparent relative"
              iconClassName="h-5 w-5 text-neutral-400 shrink-0"
            />
          </div>

          {/* Copy — name, byline, tagline, stats */}
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[15px] font-bold tracking-tight text-neutral-950 sm:text-base group-hover:text-black transition-colors">
                {product.name}
              </h3>
              {product.verified && <VerifiedBadge className="h-4 w-4 shrink-0" title="Verified Startup" />}
              {product.offerDiscount && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-black tracking-tight text-white shadow-xs shadow-orange-500/25 select-none">
                  <Flame className="h-2.5 w-2.5 fill-white stroke-white shrink-0" />
                  <span>{product.offerDiscount}</span>
                </span>
              )}
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-neutral-800 to-neutral-950 px-2 py-0.5 text-[10px] font-black tracking-tight text-white shadow-xs shadow-neutral-950/20 select-none hover:scale-105 transition-transform">
                <Star className="h-2.5 w-2.5 fill-neutral-300 text-neutral-300 shrink-0" />
                <span>Featured</span>
              </span>
            </div>
            <p className="mt-1 truncate text-[12.5px] font-medium leading-relaxed text-neutral-600 sm:text-[13px]">
              {product.tagline}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
              <span className="inline-flex items-center gap-1 font-medium text-neutral-400">
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="font-mono-num">0</span>
              </span>
              {byline && (
                <span className="truncate text-[11px] font-medium text-neutral-400 hidden sm:inline">
                  · {byline}
                </span>
              )}
              {/* Mobile view: only show one of the categories */}
              {primaryCategory && (
                <span className="inline-flex sm:hidden shrink-0 items-center rounded-full border border-neutral-200/80 bg-neutral-100/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 truncate max-w-[120px]">
                  {primaryCategory}
                </span>
              )}
              {/* Desktop view: show all categories */}
              {categories.length > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex shrink-0 items-center rounded-full border border-neutral-200/80 bg-neutral-100/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-600"
                    >
                      {cat}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* Actions: upvote · visit */}
          <div className="flex flex-col sm:flex-row shrink-0 items-center gap-1.5 sm:gap-2.5 self-center">
            {onUpvote ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpvote(product);
                }}
                title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
                className={`flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border py-1 sm:py-1.5 w-11 transition-all cursor-pointer active:scale-95 ${upvoted
                    ? 'border-mint-500 bg-mint-500 text-white shadow-2xs'
                    : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 shadow-2xs'
                  }`}
              >
                <ChevronUp className={`h-4 w-4 ${upvoted ? 'text-white' : 'text-neutral-900 fill-neutral-900'}`} />
                <span className="text-xs font-black font-mono-num leading-tight">{product.upvotes ?? 0}</span>
              </button>
            ) : (
              <div
                title="Upvotes"
                className="flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border border-neutral-200 bg-white py-1 sm:py-1.5 w-11 text-neutral-800 shadow-2xs shrink-0 select-none"
              >
                <ChevronUp className="h-4 w-4 text-neutral-900 fill-neutral-900" />
                <span className="text-xs font-black font-mono-num leading-tight">{product.upvotes ?? 0}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleVisit}
              title={`Visit ${product.name}`}
              className="inline-flex w-11 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-xl bg-neutral-950 text-white transition-all hover:bg-neutral-800 shrink-0 cursor-pointer shadow-2xs"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </BorderBeam>
    );
  }

  // ── Default "The featured spot is open" State — matching exact row height and shape of other cards ──
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
        {/* Icon tile — same h-12 w-12 sm:h-14 sm:w-14 rounded-2xl as ProductRow */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200/90 bg-blue-50/60 text-blue-600 transition-colors group-hover:border-blue-300 group-hover:bg-blue-100/70 sm:h-14 sm:w-14 shadow-2xs">
          <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400 text-amber-500 transition-transform group-hover:scale-110" />
        </div>

        {/* Copy — title, (7 days Free) in bracket, Featured badge, tagline */}
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
