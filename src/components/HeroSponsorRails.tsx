import React from 'react';
import { Megaphone } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { BorderBeam } from './BorderBeam';

interface HeroSponsorRailsProps {
  sponsors?: Product[];
  soundEnabled: boolean;
  isLoading?: boolean;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
  children: React.ReactNode; // The HomeHero and leaderboard components in the center
}

interface OpenAdCardProps {
  title?: string;
  subtitle?: string;
  duration?: string;
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
    {/* Top row skeleton: icon + title */}
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

    {/* Subtitle / description lines */}
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

    {/* Bottom row skeleton */}
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

const OpenAdCard: React.FC<OpenAdCardProps> = ({
  title = 'Ad spot open',
  subtitle = 'Put your product at top of TopSAAS',
  duration = 'Free 7 days',
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
      className="group relative flex w-full flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-3.5 xl:p-4 text-left shadow-2xs transition-all duration-200 hover:border-blue-300 hover:shadow-xs cursor-pointer overflow-hidden min-h-[112px] xl:min-h-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {/* Subtle ambient pastel corner glow matching reference */}
      <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-br from-pink-300/20 via-purple-300/10 to-transparent blur-xl" />

      {/* Top row: Megaphone icon on left, Title */}
      <div className="relative flex items-center gap-2 min-w-0">
        <div className="flex h-7 w-7 xl:h-8 xl:w-8 shrink-0 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-blue-600 shadow-2xs transition-transform group-hover:scale-105">
          <Megaphone className="h-3.5 w-3.5" />
        </div>
        <h4 className="truncate text-xs xl:text-[13px] font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
          {title}
        </h4>
      </div>

      {/* Subtitle text */}
      <p className="relative mt-2 text-[11px] xl:text-[11.5px] font-medium text-neutral-500 line-clamp-2 leading-relaxed">
        {subtitle}
      </p>

      {/* Bottom row: Free 7 days (No stars) */}
      <div className="relative mt-2 flex items-center justify-between text-[10.5px] xl:text-[11px] font-bold">
        <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10.5px] xl:text-[11px] font-bold text-emerald-700">
          {duration}
        </span>
        <span className="text-[10.5px] font-semibold text-blue-600 opacity-80 group-hover:opacity-100 group-hover:underline transition-opacity">
          Place ad →
        </span>
      </div>
    </div>
  );
};

export const HeroSponsorRails: React.FC<HeroSponsorRailsProps> = ({
  soundEnabled,
  isLoading = false,
  onOpenFeaturedSpotModal,
  children,
}) => {
  return (
    <div className="relative w-full">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 xl:gap-8 pt-1">
        {/* Left Side Rail (Desktop - 6 sticky ad spots that stay in place) */}
        <div className="hidden lg:flex flex-col gap-2 w-[215px] xl:w-[245px] shrink-0 sticky top-16 self-start">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonAdCard key={`left-skeleton-${i}`} />)
            : LEFT_SLOTS.map((slot, index) => {
                const card = (
                  <OpenAdCard
                    key={slot.id}
                    title={slot.title}
                    subtitle={slot.subtitle}
                    duration={slot.duration}
                    soundEnabled={soundEnabled}
                    onOpenModal={onOpenFeaturedSpotModal}
                  />
                );
                if (index !== 0) return card;
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
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonAdCard key={`right-skeleton-${i}`} />)
            : RIGHT_SLOTS.map((slot, index) => {
                const card = (
                  <OpenAdCard
                    key={slot.id}
                    title={slot.title}
                    subtitle={slot.subtitle}
                    duration={slot.duration}
                    soundEnabled={soundEnabled}
                    onOpenModal={onOpenFeaturedSpotModal}
                  />
                );
                if (index !== 0) return card;
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

