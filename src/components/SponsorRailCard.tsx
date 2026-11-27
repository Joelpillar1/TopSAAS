import React, { useEffect, useState } from 'react';
import { Trophy, Megaphone, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { openOutboundUrl } from '../utils/referral';
import { getDeterministicBrandColor, extractDominantLogoColor } from '../utils/brandColor';
import { getWebsiteFavicon } from '../utils/logo';
import { CardShimmer } from './CardShimmer';

/**
 * Quadruple forward-pointing chevrons with continuous traveling pulse animation.
 * The animated light travels sequentially across the 4 arrows.
 */
export const QuadChevrons: React.FC<{ className?: string }> = ({ className = 'h-3.5 xl:h-4 w-auto' }) => (
  <svg
    viewBox="0 0 54 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`group-hover:translate-x-1 transition-transform duration-200 shrink-0 ${className}`}
    aria-hidden="true"
  >
    <path
      d="M4 3.5L12 11L4 18.5"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-chevron-1"
    />
    <path
      d="M16 3.5L24 11L16 18.5"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-chevron-2"
    />
    <path
      d="M28 3.5L36 11L28 18.5"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-chevron-3"
    />
    <path
      d="M40 3.5L48 11L40 18.5"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-chevron-4"
    />
  </svg>
);

export interface SponsorRailCardProps {
  product?: Product;
  soundEnabled: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
  /** When true, forces the TopSAAS house sponsor card */
  isHouseTopSaas?: boolean;
  /** Custom title for open slots */
  slotTitle?: string;
  /** Custom description for open slots */
  slotDescription?: string;
  /** Custom CTA button label */
  ctaLabel?: string;
  /** When provided, intercepts card click (e.g. to open details modal) */
  onCardClick?: () => void;
  /**
   * Renders the title/subtext at a larger size. Used in the fixed-height SaaS
   * Ideas rail, where the card box is locked but the type was unreadably small.
   */
  largeText?: boolean;
}

/** Convert hex color to rgba with given alpha */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(37, 99, 235, ${alpha})`;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, white)`;
}

export const SponsorRailCard: React.FC<SponsorRailCardProps> = ({
  product,
  soundEnabled,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
  isHouseTopSaas = false,
  slotTitle,
  slotDescription,
  ctaLabel,
  onCardClick,
  largeText = false,
}) => {
  const isTopSaasHouse = isHouseTopSaas;
  const isOpenSpot = !isTopSaasHouse && !product;

  const name = isTopSaasHouse
    ? 'TopSAAS'
    : product?.name || slotTitle || 'Advertise your product';

  const description = isTopSaasHouse
    ? 'Get your startup discovered by early adopters and indexed by Google, Bing, AI search, and LLMs.'
    : product?.tagline || slotDescription || 'Your product on a Sponsor card across the site.';

  const ctaText = ctaLabel || (
    isTopSaasHouse
      ? 'Launch your Startup for FREE'
      : product
      ? 'Get Started'
      : 'Claim Spot'
  );

  // Determine initial color deterministically to prevent visual layout flicker
  const initialColor = isTopSaasHouse || isOpenSpot
    ? '#2563eb'
    : getDeterministicBrandColor(product?.name || product?.url);

  const [brandColor, setBrandColor] = useState<string>(initialColor);
  const [isHovered, setIsHovered] = useState(false);

  // Dynamically extract vibrant dominant color from the company logo if available
  useEffect(() => {
    if (isTopSaasHouse || isOpenSpot) {
      setBrandColor('#2563eb');
      return;
    }

    let isMounted = true;
    const defaultColor = getDeterministicBrandColor(product?.name || product?.url);
    setBrandColor(defaultColor);

    const targetLogo = product?.logoUrl || (product?.url ? getWebsiteFavicon(product.url) : '');
    if (targetLogo) {
      extractDominantLogoColor(targetLogo).then((extracted) => {
        if (isMounted && extracted) {
          setBrandColor(extracted);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [product?.id, product?.logoUrl, product?.name, product?.url, isTopSaasHouse, isOpenSpot]);

  const handleClick = () => {
    playSound('click', soundEnabled);

    if (onCardClick) {
      onCardClick();
      return;
    }

    if (isTopSaasHouse) {
      if (typeof window !== 'undefined') {
        window.location.href = '/submit';
      }
      return;
    }

    if (product?.url) {
      openOutboundUrl(product.url, {
        productId: product.id,
        productName: product.name,
        campaign: 'side_sponsor_rail',
        onTrackClick,
      });
    } else if (product) {
      onOpenProduct?.(product);
    } else {
      onOpenFeaturedSpotModal?.();
    }
  };

  const cardLogo = product?.logoUrl || (product?.url ? getWebsiteFavicon(product.url) : '');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`group relative flex-1 min-h-0 flex flex-col justify-between rounded-xl xl:rounded-2xl border ${
        isOpenSpot ? 'border-dashed' : 'border-solid'
      } text-left transition-all duration-200 cursor-pointer overflow-hidden select-none shadow-2xs hover:shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:-translate-y-0.5 ${
        largeText ? 'p-2 xl:p-2.5' : 'p-2.5 xl:p-3'
      }`}
      style={{
        background: `linear-gradient(to right, ${hexToRgba(brandColor, isHovered ? 0.22 : 0.14)} 0%, ${hexToRgba(brandColor, isHovered ? 0.07 : 0.035)} 55%, #ffffff 100%)`,
        borderColor: isHovered ? hexToRgba(brandColor, 0.40) : hexToRgba(brandColor, 0.24),
      }}
    >
      <CardShimmer delay="sponsor" />

      {/* ── Background Faint Watermark Graphic ── */}
      <div
        className="pointer-events-none absolute -right-2 -bottom-2 w-16 h-16 xl:w-20 xl:h-20 rotate-12 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6 flex items-center justify-center opacity-[0.08]"
        style={{ color: brandColor }}
        aria-hidden="true"
      >
        {isTopSaasHouse ? (
          <Trophy className="w-full h-full text-current" />
        ) : cardLogo ? (
          <img
            key={cardLogo}
            src={cardLogo}
            alt=""
            className="w-full h-full object-contain filter grayscale"
          />
        ) : (
          <Megaphone className="w-full h-full text-current" />
        )}
      </div>

      <div className="relative z-10 min-w-0">
        {/* ── Top Row: Logo / Icon + Name ── */}
        <div className="flex items-center gap-2 xl:gap-2.5 min-w-0">
          <div
            className="h-6.5 w-6.5 xl:h-7.5 xl:w-7.5 rounded-lg shrink-0 flex items-center justify-center text-white shadow-2xs overflow-hidden transition-transform duration-200 group-hover:scale-105"
            style={{ backgroundColor: brandColor }}
          >
            {isTopSaasHouse ? (
              <Trophy className="h-3.5 w-3.5 xl:h-4 xl:w-4 stroke-[2.2]" />
            ) : cardLogo ? (
              <img
                key={cardLogo}
                src={cardLogo}
                alt={name}
                width={30}
                height={30}
                className="h-full w-full object-contain p-0.5 bg-white"
              />
            ) : product ? (
              <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" />
            ) : (
              <Megaphone className="h-3.5 w-3.5 stroke-[2.2]" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`truncate font-black tracking-tight text-neutral-950 transition-colors group-hover:text-blue-600 ${
                largeText ? 'text-[15px] xl:text-[16.5px]' : 'text-[13px] xl:text-[14.5px]'
              }`}
            >
              {name}
            </h4>
          </div>
        </div>

        {/* ── Description / Tagline ── */}
        <p
          className={`text-neutral-500 leading-snug line-clamp-3 font-normal ${
            largeText ? 'mt-1 text-[12px] xl:text-[13.5px]' : 'mt-1 xl:mt-1.5 text-[11px] xl:text-[12px]'
          }`}
        >
          {description}
        </p>
      </div>

      {/* ── Bottom Call To Action (CTA) Button with Animated Traveling Chevrons ── */}
      <div
        className={`relative z-10 w-full rounded-lg px-2.5 xl:px-3 flex items-center justify-between text-white shadow-2xs transition-transform duration-200 group-hover:scale-[1.01] ${
          largeText ? 'mt-1 xl:mt-1.5 py-1' : 'mt-1.5 xl:mt-2 py-1 xl:py-1.5'
        }`}
        style={{ backgroundColor: brandColor }}
      >
        <span
          className={`font-bold tracking-tight truncate mr-2 ${
            largeText ? 'text-[11px] xl:text-[12px]' : 'text-[10px] xl:text-[11.5px]'
          }`}
        >
          {ctaText}
        </span>
        <QuadChevrons className="h-3.5 xl:h-4 w-auto" />
      </div>
    </div>
  );
};
