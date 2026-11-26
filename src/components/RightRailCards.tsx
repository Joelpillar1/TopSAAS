import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { RankMedal } from './RankMedal';
import { VerifiedBadge } from './VerifiedBadge';
import { BorderBeam } from './BorderBeam';

export interface LastWeekTopThreeCardProps {
  products: Product[];
  lastWeekLabel?: string;
  soundEnabled: boolean;
  onOpenProduct?: (product: Product) => void;
  isLoading?: boolean;
}

export const LastWeekTopThreeCard: React.FC<LastWeekTopThreeCardProps> = ({
  products = [],
  lastWeekLabel,
  soundEnabled,
  onOpenProduct,
  isLoading = false,
}) => {
  const topThree = products.slice(0, 3);

  return (
    <div className="w-full rounded-2xl xl:rounded-3xl border border-neutral-200/90 bg-white p-3 xl:p-3.5 shadow-2xs hover:shadow-xs transition-shadow text-left select-none">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-5 w-5 xl:h-5.5 xl:w-5.5 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Trophy className="h-3 w-3 xl:h-3.5 xl:w-3.5 stroke-[2.4]" />
          </div>
          <h3 className="text-xs xl:text-[13px] font-black tracking-tight text-neutral-900 truncate">
            Last Week's Top 3
          </h3>
        </div>
        {lastWeekLabel && (
          <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-md shrink-0">
            {lastWeekLabel}
          </span>
        )}
      </div>

      {/* ── Products List ── */}
      <div className="mt-2 space-y-1">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 animate-pulse">
              <div className="h-4.5 w-4.5 rounded bg-neutral-200 shrink-0" />
              <div className="h-7 w-7 rounded-lg bg-neutral-200 shrink-0" />
              <div className="flex-1 space-y-1 min-w-0">
                <div className="h-3 w-20 rounded bg-neutral-200" />
                <div className="h-2 w-28 rounded bg-neutral-100" />
              </div>
            </div>
          ))
        ) : topThree.length === 0 ? (
          <p className="py-3 text-center text-xs text-neutral-400 font-medium">
            No launches recorded last week.
          </p>
        ) : (
          topThree.map((product, idx) => {
            const rankNum = (idx + 1) as 1 | 2 | 3;

            return (
              <div
                key={product.id || idx}
                role="button"
                tabIndex={0}
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenProduct?.(product);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playSound('click', soundEnabled);
                    onOpenProduct?.(product);
                  }
                }}
                className="group flex items-center gap-2 p-1.5 xl:p-2 rounded-xl hover:bg-neutral-50 border border-transparent hover:border-neutral-200/70 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {/* Standard Ranking Coin Medal */}
                <RankMedal
                  rank={rankNum}
                  className="h-6 w-6 xl:h-6.5 xl:w-6.5"
                  variant="coin"
                />

                {/* Product Logo */}
                <div className="h-7 w-7 xl:h-7.5 xl:w-7.5 shrink-0 rounded-lg overflow-hidden border border-neutral-200/80 bg-white p-0.5 shadow-2xs flex items-center justify-center">
                  {product.logoUrl ? (
                    <img
                      src={product.logoUrl}
                      alt={product.name}
                      width={28}
                      height={28}
                      className="h-full w-full object-contain rounded-md"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-[11px] font-black text-neutral-400">
                      {product.name?.slice(0, 1) || 'P'}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </p>
                    <span className="text-[10px] font-bold text-neutral-500 shrink-0">
                      ▲ {product.upvotes || 0}
                    </span>
                  </div>
                  <p className="truncate text-[10px] xl:text-[10.5px] text-neutral-400 font-medium leading-tight mt-0.5">
                    {product.tagline || product.category || 'Trending SaaS'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export interface DirectoryPromoRailCardProps {
  soundEnabled: boolean;
  onNavigateToDirectory?: () => void;
}

export const DirectoryPromoRailCard: React.FC<DirectoryPromoRailCardProps> = ({
  soundEnabled,
  onNavigateToDirectory,
}) => {
  const handleClick = () => {
    playSound('click', soundEnabled);
    if (onNavigateToDirectory) {
      onNavigateToDirectory();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/product-directory';
    }
  };

  const directoryLogos = [
    { name: 'Product Hunt', domain: 'producthunt.com' },
    { name: 'Crunchbase', domain: 'crunchbase.com' },
    { name: 'G2', domain: 'g2.com' },
    { name: 'BetaList', domain: 'betalist.com' },
    { name: 'AlternativeTo', domain: 'alternativeto.net' },
  ];

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
      className="group relative flex flex-col justify-between rounded-2xl xl:rounded-3xl border border-neutral-200/90 bg-white p-3.5 xl:p-4 text-left shadow-2xs hover:shadow-xs hover:border-neutral-300 transition-all cursor-pointer select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div>
        {/* ── Top Row: Trending / Backlink Badge ── */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
            Directory Hub
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-orange-600 ring-1 ring-inset ring-orange-200/80 shadow-2xs">
            <Flame className="h-2.5 w-2.5 fill-orange-500 text-orange-500" />
            HIGH-DR BACKLINKS
          </span>
        </div>

        {/* ── Main Heading ── */}
        <h4 className="mt-2 text-[13px] xl:text-[14.5px] font-black tracking-tight text-neutral-950 leading-snug group-hover:text-blue-600 transition-colors">
          Steal 100+ High-DR Backlinks
        </h4>

        {/* ── Description highlighting backlinks & high DR ── */}
        <p className="mt-1.5 text-[11px] xl:text-[11.5px] text-neutral-500 leading-relaxed font-normal">
          Hand-verified startup platforms and launch boards sorted by Domain Rating. Fast-track your search rankings with 50+ free do-follow profiles.
        </p>

        {/* ── Overlapping Directory Favicons ── */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex -space-x-1.5 overflow-hidden py-0.5">
            {directoryLogos.map((d) => (
              <img
                key={d.domain}
                src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=64`}
                alt={d.name}
                width={20}
                height={20}
                className="h-5 w-5 xl:h-5.5 xl:w-5.5 rounded-full border-2 border-white bg-white shadow-2xs object-contain p-0.5"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
          <span className="text-[10.5px] xl:text-[11px] font-bold text-neutral-500">
            100+ more
          </span>
        </div>
      </div>

      {/* ── Bottom Action Button ── */}
      <div className="mt-3.5 w-full flex items-center justify-center gap-1.5 rounded-xl bg-neutral-950 group-hover:bg-neutral-800 text-white py-2 xl:py-2.5 px-3 text-xs font-bold shadow-2xs transition-all group-hover:scale-[1.01]">
        <span>Explore Backlink Directory</span>
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </div>
  );
};

export interface LaunchProductRailCardProps {
  soundEnabled: boolean;
  onOpenSubmit?: () => void;
  onOpenPricing?: () => void;
}

/**
 * LaunchProductRailCard
 * --------------------
 * Sidebar card informing founders of what they receive as a premium verified user:
 * - 24h express approval, permanent dofollow backlink, verified badge,
 * - category top-3 placement, dedicated blog review, and AI search indexing.
 */
const OFFER_DEADLINE_KEY = 'topsaas_bf_offer_deadline_v1';
const OFFER_DURATION_MS = 72 * 60 * 60 * 1000;

function getOrCreateOfferDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + OFFER_DURATION_MS;
  try {
    const raw = localStorage.getItem(OFFER_DEADLINE_KEY);
    const parsed = raw ? Number(raw) : 0;
    if (Number.isFinite(parsed) && parsed > Date.now()) {
      return parsed;
    }
    const next = Date.now() + OFFER_DURATION_MS;
    localStorage.setItem(OFFER_DEADLINE_KEY, String(next));
    return next;
  } catch {
    return Date.now() + OFFER_DURATION_MS;
  }
}

function formatOfferCountdown(deadlineMs: number) {
  const diff = Math.max(0, deadlineMs - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

export const LaunchProductRailCard: React.FC<LaunchProductRailCardProps> = ({
  soundEnabled,
  onOpenSubmit,
}) => {
  const [deadlineMs, setDeadlineMs] = useState<number>(() => getOrCreateOfferDeadline());
  const [timeLeft, setTimeLeft] = useState(() => formatOfferCountdown(deadlineMs));

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() >= deadlineMs) {
        const next = getOrCreateOfferDeadline();
        setDeadlineMs(next);
        setTimeLeft(formatOfferCountdown(next));
      } else {
        setTimeLeft(formatOfferCountdown(deadlineMs));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [deadlineMs]);

  return (
    <BorderBeam
      size="md"
      colorVariant="colorful"
      strength={0.9}
      borderRadius={12}
      className="w-full rounded-2xl xl:rounded-3xl"
    >
      <div className="w-full rounded-2xl xl:rounded-3xl border border-blue-200/80 bg-gradient-to-b from-blue-50/75 via-white to-white p-3.5 xl:p-4 text-left shadow-md shadow-blue-500/10 select-none">
        {/* ── Eyebrow + Title ── */}
        <div className="flex items-center justify-between gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-orange-600">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
            Black Friday · 40% Off
          </span>
          <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
            Save $6
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <h3 className="text-sm xl:text-[15px] font-black tracking-tight text-neutral-950 truncate">
            Verified Launch
          </h3>
          <VerifiedBadge className="h-4 w-4 shrink-0" />
        </div>

        {/* ── Bold Price + Countdown Box ── */}
        <div className="mt-2.5 rounded-2xl border border-neutral-200/90 bg-white p-2.5 shadow-2xs space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl xl:text-[26px] leading-none font-black text-neutral-950 tracking-tight font-sans">$9</span>
              <span className="text-sm font-bold text-neutral-400 line-through font-sans">$15</span>
            </div>
            <span className="text-[10.5px] font-bold text-neutral-500 font-sans">One-time · Lifetime</span>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-neutral-950 px-2.5 py-1.5 text-[10.5px] text-white">
            <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-neutral-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ends in
            </span>
            <span className="font-mono-num font-black tracking-tight text-white">
              {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s
            </span>
          </div>
        </div>

        {/* ── Top 4 Concise Features ── */}
        <ul className="mt-3 space-y-2 text-[11.5px] text-neutral-800 font-medium">
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
            <span><strong>Live in 24h</strong> (skip 14d queue)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
            <span><strong>Permanent DoFollow</strong> backlink</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
            <span><strong>Pinned Top 3</strong> in category (7d)</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
            <span><strong>Verified Badge</strong> + /blog story</span>
          </li>
          <li className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </div>
            <span><strong>AI Search Indexing</strong> (/llms.txt)</span>
          </li>
        </ul>

        {/* ── Bold CTA Button ── */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            try {
              localStorage.setItem('topsaas_submit_plan', 'paid_19');
            } catch { }
            onOpenSubmit?.();
          }}
          className="btn-primary w-full mt-3.5 py-2.5 px-4 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <span>Claim 40% Off — $9</span>
          <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
        </button>
      </div>
    </BorderBeam>
  );
};
