import React from 'react';
import { Megaphone } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { BorderBeam } from './BorderBeam';
import { ProductLogo } from './ProductLogo';
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
  { id: 'left-1', title: 'Ad spot open', subtitle: 'Put your product at top of TopSAAS', duration: 'Free 7 days' },
  { id: 'left-2', title: 'Side rail ad spot', subtitle: 'Prime sidebar placement for founders', duration: 'Free 7 days' },
  { id: 'left-3', title: 'Promote your SaaS', subtitle: 'Reach 50k+ active SaaS builders', duration: 'Free 7 days' },
  { id: 'left-4', title: 'Advertise your startup', subtitle: 'Get targeted founder & creator visits', duration: 'Free 7 days' },
  { id: 'left-5', title: 'Verified sponsor slot', subtitle: 'Claim this verified sponsor slot', duration: 'Free 7 days' },
  { id: 'left-6', title: 'Partner sponsor spot', subtitle: 'Boost your launch & signups', duration: 'Free 7 days' },
];

const RIGHT_SLOTS = [
  { id: 'right-1', title: 'Ad spot open', subtitle: 'Put your product at top of TopSAAS', duration: 'Free 7 days' },
  { id: 'right-2', title: 'Place your startup ad', subtitle: 'Discovered by thousands of builders', duration: 'Free 7 days' },
  { id: 'right-3', title: 'Promote your product', subtitle: 'Guaranteed directory visibility', duration: 'Free 7 days' },
  { id: 'right-4', title: 'Sponsored ad slot', subtitle: 'Permanent placement beside trending', duration: 'Free 7 days' },
  { id: 'right-5', title: 'Early founder spotlight', subtitle: 'Early-stage founder visibility', duration: 'Free 7 days' },
  { id: 'right-6', title: 'Boost your SaaS visibility', subtitle: 'Drive high-intent traffic to your tool', duration: 'Free 7 days' },
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
        <span className="text-[10.5px] xl:text-[11px] font-medium text-neutral-400">
          Sponsored
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
          Open Spot <span className="text-emerald-600 font-semibold">(7 days Free)</span>
        </p>
      </div>
    </div>
  );
};

const MobileActiveSponsorCard: React.FC<{
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
        campaign: 'mobile_hero_sponsor_rail',
        onTrackClick,
      });
    } else {
      onOpenProduct?.(product);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      className="group relative flex w-[230px] sm:w-[250px] shrink-0 flex-col justify-between rounded-2xl border border-blue-100/90 bg-gradient-to-br from-white via-white to-blue-50/40 p-3 text-left shadow-2xs transition-all hover:border-blue-300 hover:shadow-xs cursor-pointer select-none"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <ProductLogo
          src={product.logoUrl}
          alt={product.name}
          containerClassName="h-7 w-7 rounded-xl border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center group-hover:scale-105 transition-transform"
          iconClassName="h-3.5 w-3.5 text-neutral-700 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-xs font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h4>
          <span className="text-[10px] text-neutral-400 font-medium truncate block">
            {product.category || 'SaaS'}
          </span>
        </div>
        <span className="shrink-0 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
          Sponsored
        </span>
      </div>

      <p className="mt-1.5 text-[11px] font-medium text-neutral-500 line-clamp-1 leading-snug">
        {product.tagline}
      </p>

      <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold text-neutral-400 border-t border-neutral-100 pt-1">
        <span>Partner Spot</span>
        <span className="text-blue-600 group-hover:underline">Visit →</span>
      </div>
    </div>
  );
};

const MobileOpenAdCard: React.FC<{
  title?: string;
  subtitle?: string;
  soundEnabled: boolean;
  onOpenModal?: () => void;
}> = ({
  title = 'Advertise',
  subtitle = 'Open Sponsor Spot',
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
      className="group relative flex w-[230px] sm:w-[250px] shrink-0 items-center gap-2.5 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-400 bg-white/80 p-3 text-left transition-all hover:bg-neutral-50 cursor-pointer select-none shadow-2xs"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 group-hover:text-neutral-950 group-hover:scale-105 transition-transform">
        <Megaphone className="h-3.5 w-3.5 stroke-[2]" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h4>
        <p className="text-[10px] font-medium text-neutral-400 truncate">
          {subtitle} <span className="text-emerald-600 font-semibold">(7d Free)</span>
        </p>
      </div>
      <span className="shrink-0 text-[10px] font-bold text-blue-600 group-hover:underline">
        Claim →
      </span>
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

  // Mobile infinite scrolling lists:
  // Top row (Above hero): left/even sponsors + open claim slots
  // Bottom row (Below directory): right/odd sponsors + open claim slots
  const row1Base: React.ReactNode[] = [];
  const row2Base: React.ReactNode[] = [];

  if (activeSponsors.length === 0) {
    LEFT_SLOTS.slice(0, 4).forEach((slot) => {
      row1Base.push(
        <MobileOpenAdCard
          key={`m-top-${slot.id}`}
          title={slot.title}
          subtitle={slot.subtitle}
          soundEnabled={soundEnabled}
          onOpenModal={onOpenFeaturedSpotModal}
        />
      );
    });
    RIGHT_SLOTS.slice(0, 4).forEach((slot) => {
      row2Base.push(
        <MobileOpenAdCard
          key={`m-bot-${slot.id}`}
          title={slot.title}
          subtitle={slot.subtitle}
          soundEnabled={soundEnabled}
          onOpenModal={onOpenFeaturedSpotModal}
        />
      );
    });
  } else {
    activeSponsors.forEach((sp, i) => {
      const card = (
        <MobileActiveSponsorCard
          key={`m-sp-${sp.id}-${i}`}
          product={sp}
          soundEnabled={soundEnabled}
          onTrackClick={onTrackClick}
          onOpenProduct={onOpenProduct}
        />
      );
      if (activeSponsors.length === 1) {
        row1Base.push(card);
        row2Base.push(card);
      } else if (i % 2 === 0) {
        row1Base.push(card);
      } else {
        row2Base.push(card);
      }
    });

    row1Base.push(
      <MobileOpenAdCard
        key="m-claim-top"
        title="Promote Your Startup"
        subtitle="Claim open sponsor slot"
        soundEnabled={soundEnabled}
        onOpenModal={onOpenFeaturedSpotModal}
      />
    );
    row2Base.push(
      <MobileOpenAdCard
        key="m-claim-bot"
        title="Advertise Here"
        subtitle="7-day free trial"
        soundEnabled={soundEnabled}
        onOpenModal={onOpenFeaturedSpotModal}
      />
    );
  }

  // Ensure enough items so that translateX(-50%) has a seamless, smooth infinite loop
  const repeatCount1 = Math.max(2, Math.ceil(6 / Math.max(1, row1Base.length)));
  const repeatCount2 = Math.max(2, Math.ceil(6 / Math.max(1, row2Base.length)));

  const row1Items = Array.from({ length: repeatCount1 }, () => row1Base).flat();
  const row2Items = Array.from({ length: repeatCount2 }, () => row2Base).flat();

  return (
    <div className="relative w-full">
      {/* ── MOBILE: Infinite Scrolling Sponsors ABOVE Hero ── */}
      <div className="block lg:hidden w-full mb-4">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Featured Sponsors</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onOpenFeaturedSpotModal?.();
            }}
            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Advertise +
          </button>
        </div>

        <div className="relative w-full overflow-hidden py-1">
          {/* Subtle edge fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-10 bg-gradient-to-r from-neutral-50/90 via-neutral-50/50 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-10 bg-gradient-to-l from-neutral-50/90 via-neutral-50/50 to-transparent z-10" />

          <div className="animate-marquee-infinite flex items-center gap-2.5 w-max">
            {row1Items.map((item, idx) => (
              <React.Fragment key={`top-m-${idx}`}>{item}</React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 xl:gap-8 pt-1">
        {/* Left Side Rail (Desktop - 6 sticky ad spots that stay in place) */}
        <div className="hidden lg:flex flex-col gap-2 w-[215px] xl:w-[245px] shrink-0 sticky top-16 self-start">
          {LEFT_SLOTS.map((slot, index) => {
            const sponsoredItem = leftSponsors[index];
            const card = sponsoredItem ? (
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
            const card = sponsoredItem ? (
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

      {/* ── MOBILE: Infinite Scrolling Sponsors BELOW Directory ── */}
      <div className="block lg:hidden w-full mt-6 pt-2">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sponsored Showcase</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onOpenFeaturedSpotModal?.();
            }}
            className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Claim Spot (Free 7d) →
          </button>
        </div>

        <div className="relative w-full overflow-hidden py-1">
          {/* Subtle edge fade masks */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-10 bg-gradient-to-r from-neutral-50/90 via-neutral-50/50 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 sm:w-10 bg-gradient-to-l from-neutral-50/90 via-neutral-50/50 to-transparent z-10" />

          <div className="animate-marquee-reverse flex items-center gap-2.5 w-max">
            {row2Items.map((item, idx) => (
              <React.Fragment key={`bot-m-${idx}`}>{item}</React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
