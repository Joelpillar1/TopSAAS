import React, { useRef, useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { BorderBeam } from './BorderBeam';
import { CardShimmer } from './CardShimmer';
import { ProductLogo } from './ProductLogo';
import { VerifiedBadge } from './VerifiedBadge';
import { openOutboundUrl } from '../utils/referral';

import { SponsorRailCard } from './SponsorRailCard';
import { SaaSIdeasMobileSponsor, MobileSponsorSlotDef } from './SaaSIdeasMobileSponsor';
import { LastWeekTopThreeCard, DirectoryPromoRailCard } from './RightRailCards';

export const DIRECTORY_MOBILE_SLOTS: MobileSponsorSlotDef[] = [
  { id: 'dir-1', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' },
  { id: 'dir-2', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' },
  { id: 'dir-3', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' },
  { id: 'dir-4', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' },
  { id: 'dir-5', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' },
  { id: 'dir-6', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' },
];

interface HeroSponsorRailsProps {
  sponsors?: Product[];
  lastWeeksTop3?: Product[];
  lastWeekLabel?: string;
  soundEnabled: boolean;
  isLoading?: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
  onNavigateToDirectory?: () => void;
  children: React.ReactNode; // The HomeHero and leaderboard components in the center
  footer?: React.ReactNode;
  enabled?: boolean;
}

interface OpenAdCardProps {
  soundEnabled: boolean;
  onOpenModal?: () => void;
}

const LEFT_SLOTS = [
  { id: 'left-1', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.', duration: 'Claim spot' },
  { id: 'left-2', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.', duration: 'Claim spot' },
  { id: 'left-3', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.', duration: 'Claim spot' },
  { id: 'left-4', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.', duration: 'Claim spot' },
  { id: 'left-5', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.', duration: 'Claim spot' },
  { id: 'left-6', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.', duration: 'Claim spot' },
];

/** Skeleton loader for ad cards matching the exact dimensions and spacing */
export const SkeletonAdCard: React.FC = () => (
  <div className="flex-1 min-h-0 flex w-full flex-col justify-between rounded-xl xl:rounded-2xl border border-neutral-200/80 bg-white p-2.5 xl:p-3 text-left shadow-2xs overflow-hidden">
    <div className="flex items-center gap-2">
      <div
        className="h-6 w-6 xl:h-7 xl:w-7 shrink-0 rounded-lg animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
      <div
        className="h-3 w-24 xl:w-28 rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
    </div>

    <div className="mt-1 space-y-1">
      <div
        className="h-2 w-full rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
      <div
        className="h-2 w-3/4 rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
    </div>

    <div className="mt-1 flex items-center justify-between">
      <div
        className="h-4 w-16 rounded-md animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
        style={{ animation: 'shimmer 1.5s infinite linear' }}
      />
      <div
        className="h-2.5 w-12 rounded animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]"
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
  return (
    <SponsorRailCard
      product={product}
      soundEnabled={soundEnabled}
      onTrackClick={onTrackClick}
      onOpenProduct={onOpenProduct}
    />
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
      className="group relative flex-1 min-h-0 flex w-full flex-col items-center justify-center rounded-xl xl:rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-white/70 p-2 xl:p-2.5 text-center transition-all duration-200 hover:bg-neutral-50/80 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 select-none shadow-2xs"
    >
      <div className="flex flex-col items-center justify-center space-y-0.5">
        <Megaphone className="h-4 w-4 xl:h-4.5 xl:w-4.5 text-neutral-600 group-hover:text-neutral-900 stroke-[1.8] group-hover:scale-110 transition-transform" />
        <h4 className="text-[11px] xl:text-xs font-bold text-neutral-800 group-hover:text-neutral-950 tracking-tight leading-tight">
          Advertise your product
        </h4>
        <p className="text-[9.5px] xl:text-[10px] font-medium text-neutral-400 group-hover:text-neutral-600 leading-tight line-clamp-1">
          Your product on a Sponsor card, for 30 days.
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
            width={18}
            height={18}
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
  lastWeeksTop3 = [],
  lastWeekLabel,
  soundEnabled,
  isLoading = false,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
  onNavigateToDirectory,
  children,
  footer,
  enabled = true,
}) => {
  if (!enabled) {
    return (
      <div className="relative w-full">
        <div className="flex flex-col items-center justify-center pt-1">
          <div className="flex-1 w-full max-w-2xl xl:max-w-[760px] 2xl:max-w-[860px] mx-auto min-w-0 flex flex-col gap-4 pb-16 lg:pb-6">
            {children}
            {footer}
          </div>
        </div>
      </div>
    );
  }

  // Filter active sponsors that have not expired
  const activeSponsors = (sponsors || []).filter(
    (p) => p.isSponsored && (p.sponsorExpiresAt ? p.sponsorExpiresAt > Date.now() : true)
  );

  const leftSponsors = activeSponsors;

  const heroBannerRef = useRef<HTMLDivElement | null>(null);
  const [isStickySponsorVisible, setIsStickySponsorVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroBannerRef.current) return;
      const rect = heroBannerRef.current.getBoundingClientRect();
      setIsStickySponsorVisible(rect.bottom < 52);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative w-full">
      {/* Mobile Floating Sticky Sponsor under Top Nav when scrolled down */}
      {isStickySponsorVisible && (
        <div className="fixed top-[62px] left-3.5 right-3.5 sm:left-6 sm:right-6 z-30 lg:hidden pointer-events-none flex justify-center animate-fadeIn">
          <div className="pointer-events-auto w-full max-w-xl">
            <SaaSIdeasMobileSponsor
              slots={DIRECTORY_MOBILE_SLOTS}
              sponsors={activeSponsors}
              soundEnabled={soundEnabled}
              onTrackClick={onTrackClick}
              onOpenProduct={onOpenProduct}
              onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
              isFloating
            />
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row items-center xl:items-start justify-between gap-4 xl:gap-6 2xl:gap-8 w-full">
        {/* Left Side Rail (Desktop - stays static in viewport while page scrolls, like SaaS Ideas) */}
        <aside
          aria-label="Sponsors"
          className="hidden xl:flex flex-col w-[280px] 2xl:w-[320px] shrink-0 sticky top-[58px] sm:top-[60px] h-[calc(100vh-4.25rem)] max-h-[calc(100vh-4.25rem)] self-start py-0.5 overflow-hidden"
        >
          <div className="w-full h-full rounded-2xl xl:rounded-3xl border border-neutral-200/90 bg-white p-2.5 xl:p-3 shadow-xs flex flex-col justify-between overflow-hidden">
            {/* Header: ─── SPONSORED ─── */}
            <div className="relative flex items-center justify-center my-0.5 shrink-0">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <span className="relative bg-white px-2.5 py-0.5 rounded-full border border-neutral-300 text-[10px] font-bold text-neutral-500 uppercase tracking-wider select-none">
                SPONSORED
              </span>
            </div>

            {/* 5 Cards fitting evenly into viewport without scrolling */}
            <div className="flex flex-col justify-between flex-1 gap-1.5 xl:gap-2 my-1 overflow-hidden min-h-0">
              {LEFT_SLOTS.slice(0, 5).map((slot, index) => {
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
                    className="rounded-2xl flex-1 min-h-0 flex flex-col"
                  >
                    {card}
                  </BorderBeam>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Center Hero + Directory List + Footer */}
        <div className="flex-1 w-full max-w-2xl xl:max-w-[760px] 2xl:max-w-[860px] mx-auto min-w-0 flex flex-col gap-4 pb-16 lg:pb-6">
          {/* Mobile-only Rotating Sponsor Banner at the top (Page Load) */}
          <div ref={heroBannerRef} className="w-full mb-0 lg:hidden px-2 sm:px-3">
            <SaaSIdeasMobileSponsor
              slots={DIRECTORY_MOBILE_SLOTS}
              sponsors={activeSponsors}
              soundEnabled={soundEnabled}
              onTrackClick={onTrackClick}
              onOpenProduct={onOpenProduct}
              onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
            />
          </div>

          {children}

          {footer}
        </div>

        {/* Right Side Rail (Desktop - Last Week's Top 3 + Backlinks Directory Guide) */}
        <aside
          aria-label="Community highlights and backlinks guide"
          className="hidden xl:flex flex-col gap-3 w-[280px] 2xl:w-[320px] shrink-0 sticky top-[58px] sm:top-[60px] self-start py-0.5"
        >
          <LastWeekTopThreeCard
            products={lastWeeksTop3}
            lastWeekLabel={lastWeekLabel}
            soundEnabled={soundEnabled}
            onOpenProduct={onOpenProduct}
            isLoading={isLoading}
          />
          <DirectoryPromoRailCard
            soundEnabled={soundEnabled}
            onNavigateToDirectory={onNavigateToDirectory}
          />
        </aside>
      </div>
    </div>
  );
};
