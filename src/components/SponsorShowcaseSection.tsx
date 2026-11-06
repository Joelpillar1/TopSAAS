import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { playSound } from '../utils/sound';

interface SponsorShowcaseSectionProps {
  onOpenSponsor?: (tier?: '1wk' | '1mo') => void;
  soundEnabled: boolean;
}

export const SponsorShowcaseSection: React.FC<SponsorShowcaseSectionProps> = ({
  onOpenSponsor,
  soundEnabled,
}) => {
  const handleSelectTier = (tier: '1wk' | '1mo') => {
    playSound('click', soundEnabled);
    if (onOpenSponsor) {
      onOpenSponsor(tier);
    }
  };

  return (
    <div className="w-full rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-sm font-sans">
      {/* ── Section Header ── */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50/80 px-3.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs">
          <span>Sidebar Rails</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-3">
          Spotlight on TopSAAS Sidebars
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          Take over 24/7 sticky desktop side rails across the Homepage and Product Details pages to capture continuous founder traffic.
        </p>
      </div>

      {/* ── 2 Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
        {/* ══════════════════════════════════════════════════════════
            CARD 1: 1-Week Sponsor ($10)
           ══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col">
          {/* Top Pod */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]">
            <div>
              <div className="h-7 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">1-Week Sponsor</h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  7 Days
                </span>
              </div>
              <p className="h-10 text-xs text-neutral-500 leading-relaxed mt-1 mb-2 line-clamp-2">
                Fast 7-day launch sprint on sticky side rails across high-traffic desktop views.
              </p>

              <div className="h-10 flex items-baseline gap-1.5 my-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                  $10.00
                </span>
                <span className="text-xs text-neutral-500 font-medium font-sans">/Week</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectTier('1wk')}
              className="btn-secondary w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <span>Get 1-Week Sponsor</span>
              <ArrowRight className="h-3 w-3 opacity-60" />
            </button>
          </div>

          {/* Feature Checklist Below Pod */}
          <div className="px-2 pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3.5">
              INCLUDED IN 1-WEEK SPONSOR
            </p>
            <ul className="space-y-3.5 text-xs sm:text-[13px] text-neutral-700 font-medium pt-1">
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>Visible on every page in the right sidebar</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>24/7 Homepage & Product Page presence</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>Direct High-Authority DoFollow backlink</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>⭐️ Verified Sponsor partner badge</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CARD 2: 1-Month Sponsor ($29) - Highlighted
           ══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col">
          {/* Top Pod (Elevated) */}
          <div className="rounded-2xl border border-neutral-300/80 bg-white p-6 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 flex flex-col justify-between min-h-[220px] relative">
            <div>
              <div className="h-7 flex items-center justify-between">
                <h3 className="text-lg font-bold text-neutral-900 tracking-tight">1-Month Sponsor</h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                  Save 28%
                </span>
              </div>
              <p className="h-10 text-xs text-neutral-500 leading-relaxed mt-1 mb-2 line-clamp-2">
                Full 30 days of high-frequency sticky brand visibility across all visitor sessions.
              </p>

              <div className="h-10 flex items-baseline gap-1.5 my-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                  $29.00
                </span>
                <span className="text-xs text-neutral-500 font-medium font-sans">/Month · $7.25/wk</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectTier('1mo')}
              className="btn-primary w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"
            >
              <span>Get 1-Month Sponsor</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Feature Checklist Below Pod */}
          <div className="px-2 pt-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3.5">
              EVERYTHING IN 1-WEEK, PLUS:
            </p>
            <ul className="space-y-3.5 text-xs sm:text-[13px] text-neutral-700 font-medium pt-1">
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>30 Days Continuous Rails:</strong> Visible on every page in right sidebar</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>Large sponsored banner</strong> in the weekly launch feed</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>Sidebar Partner Distinction:</strong> Stand out clearly across the directory</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>Save 28%:</strong> Best sustained value compared to weekly rate</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
