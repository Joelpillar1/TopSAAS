import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, X, Zap } from 'lucide-react';
import { playSound } from '../utils/sound';

interface BlackFridayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimOffer: () => void;
  onSeePricing: () => void;
  soundEnabled: boolean;
}

// Target end of Cyber Monday (Nov 30, 2026 23:59:59 UTC)
export const SALE_END_TIMESTAMP = Date.UTC(2026, 10, 30, 23, 59, 59);

export function getOfferDeadline(): number {
  return SALE_END_TIMESTAMP;
}

export function getRemainingTime(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
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

export const BlackFridayModal: React.FC<BlackFridayModalProps> = ({
  isOpen,
  onClose,
  onClaimOffer,
  onSeePricing,
  soundEnabled,
}) => {
  const [targetMs] = useState<number>(() => getOfferDeadline());
  const [timeLeft, setTimeLeft] = useState(() => getRemainingTime(targetMs));

  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(getRemainingTime(targetMs));
    const timer = setInterval(() => {
      setTimeLeft(getRemainingTime(targetMs));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, targetMs]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={() => {
        playSound('click', soundEnabled);
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bf-modal-title"
    >
      <div
        className="relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-7 shadow-2xl shadow-neutral-950/15 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top ambient glow on white */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-blue-50/80 via-emerald-50/30 to-transparent"
          aria-hidden="true"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onClose();
          }}
          aria-label="Close offer modal"
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 space-y-5">
          {/* Eyebrow */}
          <div className="space-y-2 pr-8">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-orange-600">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>Black Friday · Ends 30 Nov</span>
            </div>

            <h2
              id="bf-modal-title"
              className="text-2xl sm:text-[28px] font-black tracking-tight text-neutral-950 leading-tight"
            >
              40% off Verified Launch
            </h2>

            <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed">
              Jump the free queue and launch any week, at 40% off the usual one-time price.
            </p>
          </div>

          {/* Price Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-black tracking-tight text-neutral-950 font-sans">
                  $9.00
                </span>
                <span className="text-lg font-bold text-neutral-400 line-through font-sans">
                  $15
                </span>
              </div>

              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-700">
                Save $6
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
              <Zap className="h-3.5 w-3.5 text-blue-600 fill-blue-600/20 shrink-0" />
              <span>Verified Launch · one-time</span>
            </div>
          </div>

          {/* Countdown Box */}
          <div className="relative flex items-center justify-between gap-2 rounded-2xl border border-neutral-200 bg-neutral-50/90 px-4 py-3">
            {/* Subtle ticket cutouts */}
            <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-r border-neutral-200 bg-white" />
            <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-l border-neutral-200 bg-white" />

            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
              Ends in
            </span>

            <div className="flex items-center gap-1.5 font-mono-num text-base sm:text-lg font-black text-neutral-950">
              <span>
                {timeLeft.hours}
                <span className="text-[11px] font-bold text-neutral-400 ml-0.5">h</span>
              </span>
              <span className="text-neutral-300">:</span>
              <span>
                {timeLeft.minutes}
                <span className="text-[11px] font-bold text-neutral-400 ml-0.5">m</span>
              </span>
              <span className="text-neutral-300">:</span>
              <span>
                {timeLeft.seconds}
                <span className="text-[11px] font-bold text-neutral-400 ml-0.5">s</span>
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>

          {/* 2x2 Perks */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs font-medium text-neutral-700">
            {[
              'Live within 24 hours',
              'Verified Mint Badge',
              'DoFollow backlink',
              'Any launch week',
            ].map((perk) => (
              <div key={perk} className="flex items-center gap-2 min-w-0">
                <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span className="truncate">{perk}</span>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onClaimOffer();
              }}
              className="btn-primary w-full rounded-2xl py-3.5 px-5 text-sm font-black flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Claim Verified Launch for $9</span>
              <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
            </button>

            {/* Footer links */}
            <div className="flex items-center justify-center gap-2.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onSeePricing();
                }}
                className="font-bold text-neutral-900 hover:text-blue-600 transition-colors cursor-pointer"
              >
                See pricing
              </button>
              <span className="text-neutral-300">·</span>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onClose();
                }}
                className="font-medium text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
