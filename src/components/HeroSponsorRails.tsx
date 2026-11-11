import React from 'react';
import { Megaphone } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { BorderBeam } from './BorderBeam';
import { ProductLogo } from './ProductLogo';
import { VerifiedBadge } from './VerifiedBadge';
import { openOutboundUrl } from '../utils/referral';

interface HeroSponsorRailsProps {
  sponsors?: Product[];
  soundEnabled: boolean;
  isLoading?: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
  children: React.ReactNode; // The HomeHero and leaderboard components in the center
  enabled?: boolean;
}

interface OpenAdCardProps {
  soundEnabled: boolean;
  onOpenModal?: () => void;
}

const LEFT_SLOTS = [
  { id: 'left-1', title: 'Ad spot open', subtitle: 'Put your product at top of TopSAAS', duration: 'Claim spot' },
  { id: 'left-2', title: 'Side rail ad spot', subtitle: 'Prime sidebar placement for founders', duration: 'Claim spot' },
  { id: 'left-3', title: 'Promote your SaaS', subtitle: 'Reach 50k+ active SaaS builders', duration: 'Claim spot' },
  { id: 'left-4', title: 'Advertise your startup', subtitle: 'Get targeted founder & creator visits', duration: 'Claim spot' },
  { id: 'left-5', title: 'Verified sponsor slot', subtitle: 'Claim this verified sponsor slot', duration: 'Claim spot' },
  { id: 'left-6', title: 'Partner sponsor spot', subtitle: 'Boost your launch & signups', duration: 'Claim spot' },
];

const RIGHT_SLOTS = [
  { id: 'right-1', title: 'Ad spot open', subtitle: 'Put your product at top of TopSAAS', duration: 'Claim spot' },
  { id: 'right-2', title: 'Place your startup ad', subtitle: 'Discovered by thousands of builders', duration: 'Claim spot' },
  { id: 'right-3', title: 'Promote your product', subtitle: 'Guaranteed directory visibility', duration: 'Claim spot' },
  { id: 'right-4', title: 'Sponsored ad slot', subtitle: 'Permanent placement beside trending', duration: 'Claim spot' },
  { id: 'right-5', title: 'Early founder spotlight', subtitle: 'Early-stage founder visibility', duration: 'Claim spot' },
  { id: 'right-6', title: 'Boost your SaaS visibility', subtitle: 'Drive high-intent traffic to your tool', duration: 'Claim spot' },
];

/** Skeleton loader for ad cards matching the exact dimensions and spacing */
export const SkeletonAdCard: React.FC = () => (
  <div className="flex w-full flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-3.5 xl:p-4 text-left shadow-2xs overflow-hidden min-h-[112px] xl:min-h-[120px]">
    <div className="flex items-center gap-2">
      <div
        className="h-7 w-7 xl:h-8 xl:w-8 shrink-0 rounded-xl animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
      <div
        className="h-3.5 w-28 xl:w-32 rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
    </div>

    <div className="mt-2.5 space-y-1.5">
      <div
        className="h-2.5 w-full rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
      <div
        className="h-2.5 w-3/4 rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
    </div>

    <div className="mt-2.5 flex items-center justify-between">
      <div
        className="h-5 w-20 rounded-md animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
      <div
        className="h-3 w-14 rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
    </div>
  </div>
);

const ActiveSponsorCard: React.FC<{
  product: Product;
  soundEnabled: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
}> = ({ product, soundEnabled, onTrackClick, onOpenProduct }) => {
  const handleClick = () => {
    playSound('click', soundEnabled);
    if (product.url) {
      openOutboundUrl(product.url, {
        productId: product.id,
        productName: product.name,
        campaign: 'hero_sponsor_rail',
        onTrackClick,
      });
    } else {
      onOpenProduct?.(product);
    }
  };

  const isTrial = product.sponsorTier === 'trial';
  const daysLeft = product.sponsorExpiresAt
    ? Math.max(1, Math.ceil((product.sponsorExpiresAt - Date.now()) / (86400 * 1000)))
    : null;

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
      className="group relative flex w-full flex-col justify-between rounded-2xl border border-blue-100/90 bg-gradient-to-br from-white via-white to-blue-50/50 p-3.5 xl:p-4 text-left shadow-2xs transition-all duration-200 hover:border-blue-300 hover:shadow-xs cursor-pointer overflow-hidden min-h-[112px] xl:min-h-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* Subtle ambient corner glow */}
      <div className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/12 via-indigo-400/8 to-transparent blur-xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-center gap-2.5 min-w-0">
        <ProductLogo
          src={product.logoUrl}
          alt={product.name}
          containerClassName="h-8 w-8 xl:h-9 xl:w-9 rounded-xl border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center transition-transform group-hover:scale-105"
          iconClassName="h-4 w-4 text-neutral-700 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs xl:text-[13px] font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h4>
          <span className="text-[10px] text-neutral-400 font-medium truncate block">
            {product.category}
          </span>
        </div>
      </div>

      <p className="relative mt-2 text-[11px] xl:text-[11.5px] font-medium text-neutral-500 line-clamp-2 leading-relaxed">
        {product.tagline}
      </p>

      <div className="relative mt-2 flex items-center justify-between text-[10.5px] xl:text-[11px] font-bold">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] xl:text-[11px] font-medium text-neutral-400">
          <VerifiedBadge variant="gold" className="h-3.5 w-3.5 shrink-0" />
          <span>Sponsored</span>
        </span>
        <span className="text-[10.5px] font-semibold text-neutral-600 opacity-80 group-hover:opacity-100 group-hover:underline transition-opacity">
          Visit →
        </span>
      </div>
    </div>
  );
};

const OpenAdCard: React.FC<OpenAdCardProps> = ({
  soundEnabled,
  onOpenModal,
}) => {
  const handleClick = () => {
    playSound('click', soundEnabled);
    onOpenModal?.();
  };

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
      className="group relative flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-white/70 p-4 text-center transition-all duration-200 hover:bg-neutral-50/80 cursor-pointer overflow-hidden min-h-[112px] xl:min-h-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 select-none shadow-2xs"
    >
      <div className="flex flex-col items-center justify-center space-y-1">
        <Megaphone className="h-5 w-5 text-neutral-600 group-hover:text-neutral-900 stroke-[1.8] group-hover:scale-110 transition-transform" />
        <h4 className="text-xs xl:text-sm font-bold text-neutral-800 group-hover:text-neutral-950 tracking-tight leading-tight">
          Advertise
        </h4>
        <p className="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-600 leading-tight">
          Open Spot
        </p>
      </div>
    </div>
  );
};

interface TickerItem {
  id: string;
  type: 'sponsor' | 'cta';
  product?: Product;
  title?: string;
  badge?: string;
}

const TickerItemPill: React.FC<{
  item: TickerItem;
  soundEnabled: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
}> = ({ item, soundEnabled, onTrackClick, onOpenProduct, onOpenFeaturedSpotModal }) => {
  if (item.type === 'sponsor' && item.product) {
    const p = item.product;
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      playSound('click', soundEnabled);
      if (p.url) {
        openOutboundUrl(p.url, {
          productId: p.id,
          productName: p.name,
          campaign: 'mobile_ticker_sponsor',
          onTrackClick,
        });
      } else {
        onOpenProduct?.(p);
      }
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-[13px] font-semibold text-neutral-800 hover:text-black bg-white rounded-xl border border-neutral-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs transition-all shrink-0 group cursor-pointer"
      >
        {p.logoUrl ? (
          <img
            src={p.logoUrl}
            alt={p.name}
            className="h-4.5 w-4.5 rounded-lg object-contain shrink-0 border border-neutral-200/80 bg-white"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="text-sm">🔥</span>
        )}
        <span className="font-bold text-neutral-900 group-hover:underline">
          {p.name}
        </span>
        {p.tagline && (
          <span className="text-[11px] sm:text-xs text-neutral-500 font-normal max-w-[150px] truncate hidden xs:inline">
            — {p.tagline}
          </span>
        )}
      </button>
    );
  }

  // CTA item - Dashed barricade frame matching the ad card border radius (rounded-xl)
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click', soundEnabled);
    onOpenFeaturedSpotModal?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 h-9 sm:h-10 text-xs sm:text-[13px] font-bold text-neutral-800 hover:text-blue-600 bg-white/90 hover:bg-blue-50/50 rounded-xl border border-dashed border-neutral-300 hover:border-blue-400 transition-all shrink-0 cursor-pointer group shadow-2xs"
    >
      <span className="text-neutral-700 group-hover:text-blue-600 font-bold transition-colors">
        {item.badge || 'Claim spot'}
      </span>
    </button>
  );
};

function buildTickerItems(sponsors: Product[]): TickerItem[] {
  const active = (sponsors || []).filter(
    (p) => p.isSponsored && (p.sponsorExpiresAt ? p.sponsorExpiresAt > Date.now() : true)
  );

  const base: TickerItem[] = [];

  if (active.length > 0) {
    active.forEach((sp, i) => {
      base.push({ id: `sp-${sp.id}-${i}`, type: 'sponsor', product: sp });
    });
    base.push({ id: 'cta-1', type: 'cta', badge: 'Claim spot' });
    base.push({ id: 'cta-2', type: 'cta', badge: 'Claim spot' });
  } else {
    base.push({ id: 'cta-open-1', type: 'cta', badge: 'Claim spot' });
    base.push({ id: 'cta-open-2', type: 'cta', badge: 'Claim spot' });
    base.push({ id: 'cta-open-3', type: 'cta', badge: 'Claim spot' });
    base.push({ id: 'cta-open-4', type: 'cta', badge: 'Claim spot' });
  }

  // Repeat enough times for a seamless, continuous infinite loop
  const repeat = Math.max(3, Math.ceil(8 / Math.max(1, base.length)));
  return Array.from({ length: repeat }, () => base).flat();
}

/**
 * Upper infinite scrolling ticker for mobile (placed directly ABOVE the top nav bar)
 */
export const MobileTopSponsorTicker: React.FC<{
  sponsors?: Product[];
  soundEnabled: boolean;
  enabled?: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
}> = ({
  sponsors = [],
  soundEnabled,
  enabled = true,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
}) => {
  if (enabled === false) return null;
  const items = React.useMemo(() => buildTickerItems(sponsors), [sponsors]);

  return (
    <div className="block lg:hidden w-full bg-white/95 backdrop-blur-md border-b border-neutral-200/80 overflow-hidden relative select-none h-13 sm:h-14">
      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

      <div className="animate-marquee-infinite flex items-center h-full w-max gap-2.5 px-2">
        {items.map((item, idx) => (
          <TickerItemPill
            key={`top-${item.id}-${idx}`}
            item={item}
            soundEnabled={soundEnabled}
            onTrackClick={onTrackClick}
            onOpenProduct={onOpenProduct}
            onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Sticky bottom infinite scrolling ticker for mobile (fixed at bottom of screen)
 */
export const MobileBottomStickySponsorTicker: React.FC<{
  sponsors?: Product[];
  soundEnabled: boolean;
  enabled?: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
}> = ({
  sponsors = [],
  soundEnabled,
  enabled = true,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
}) => {
  if (enabled === false) return null;
  const items = React.useMemo(() => buildTickerItems(sponsors), [sponsors]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden w-full bg-white/95 backdrop-blur-md border-t border-neutral-200/90 shadow-xs overflow-hidden select-none h-13 sm:h-14">
      {/* Edge gradient fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

      <div className="animate-marquee-reverse flex items-center h-full w-max gap-2.5 px-2">
        {items.map((item, idx) => (
          <TickerItemPill
            key={`bot-${item.id}-${idx}`}
            item={item}
            soundEnabled={soundEnabled}
            onTrackClick={onTrackClick}
            onOpenProduct={onOpenProduct}
            onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
          />
        ))}
      </div>
    </div>
  );
};

export const HeroSponsorRails: React.FC<HeroSponsorRailsProps> = ({
  sponsors = [],
  soundEnabled,
  isLoading = false,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
  children,
  enabled = true,
}) => {
  if (!enabled) {
    return (
      <div className="relative w-full">
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="flex-1 w-full max-w-2xl xl:max-w-[760px] mx-auto min-w-0">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Filter active sponsors that have not expired
  const activeSponsors = (sponsors || []).filter(
    (p) => p.isSponsored && (p.sponsorExpiresAt ? p.sponsorExpiresAt > Date.now() : true)
  );

  const leftSponsors = activeSponsors.filter((_, i) => i % 2 === 0);
  const rightSponsors = activeSponsors.filter((_, i) => i % 2 === 1);

  return (
    <div className="relative w-full">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 xl:gap-8 pt-1">
        {/* Left Side Rail (Desktop - 6 sticky ad spots that stay in place) */}
        <div className="hidden lg:flex flex-col gap-2 w-[215px] xl:w-[245px] shrink-0 sticky top-16 self-start">
          {LEFT_SLOTS.map((slot, index) => {
            const sponsoredItem = leftSponsors[index];
            const card = isLoading ? (
              <SkeletonAdCard key={slot.id} />
            ) : sponsoredItem ? (
              <ActiveSponsorCard
                key={`active-left-${sponsoredItem.id}`}
                product={sponsoredItem}
                soundEnabled={soundEnabled}
                onTrackClick={onTrackClick}
                onOpenProduct={onOpenProduct}
              />
            ) : (
              <OpenAdCard
                key={slot.id}
                soundEnabled={soundEnabled}
                onOpenModal={onOpenFeaturedSpotModal}
              />
            );

            if (index !== 0 || !sponsoredItem) return card;
            return (
              <BorderBeam
                key={slot.id}
                size="md"
                colorVariant="colorful"
                strength={0.85}
                borderRadius={8}
                className="rounded-2xl"
              >
                {card}
              </BorderBeam>
            );
          })}
        </div>

        {/* Center Hero + Directory List */}
        <div className="flex-1 w-full max-w-2xl xl:max-w-[720px] mx-auto min-w-0">
          {children}
        </div>

        {/* Right Side Rail (Desktop - 6 sticky ad spots that stay in place) */}
        <div className="hidden lg:flex flex-col gap-2 w-[215px] xl:w-[245px] shrink-0 sticky top-16 self-start">
          {RIGHT_SLOTS.map((slot, index) => {
            const sponsoredItem = rightSponsors[index];
            const card = isLoading ? (
              <SkeletonAdCard key={slot.id} />
            ) : sponsoredItem ? (
              <ActiveSponsorCard
                key={`active-right-${sponsoredItem.id}`}
                product={sponsoredItem}
                soundEnabled={soundEnabled}
                onTrackClick={onTrackClick}
                onOpenProduct={onOpenProduct}
              />
            ) : (
              <OpenAdCard
                key={slot.id}
                soundEnabled={soundEnabled}
                onOpenModal={onOpenFeaturedSpotModal}
              />
            );

            if (index !== 0 || !sponsoredItem) return card;
            return (
              <BorderBeam
                key={slot.id}
                size="md"
                colorVariant="colorful"
                strength={0.85}
                borderRadius={8}
                className="rounded-2xl"
              >
                {card}
              </BorderBeam>
            );
          })}
        </div>
      </div>
    </div>
  );
};
