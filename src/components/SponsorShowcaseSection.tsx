import React from 'react';
import { Check, ArrowUpRight, Clock } from 'lucide-react';
import { playSound } from '../utils/sound';
import { WHOP_LINKS } from '../utils/whop';
import { appendTrackkitParams } from '../utils/trackkit';

interface SponsorShowcaseSectionProps {
  onOpenSponsor?: (tier?: '1wk' | '1mo') => void;
  soundEnabled: boolean;
  activeSponsorCount?: number;
}

export const SponsorShowcaseSection: React.FC<SponsorShowcaseSectionProps> = ({
  onOpenSponsor,
  soundEnabled,
  activeSponsorCount = 0,
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
        <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
          Spotlight on TopSAAS Sidebars &amp; Mobile
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          Take over 24/7 sticky desktop side rails and mobile hero sponsor cards across every page to capture continuous founder traffic.
        </p>
      </div>

      {/* Availability Bar (5 Sponsor Slots) */}
      {(() => {
        const totalSponsorSlots = 5;
        const openSponsorSlots = Math.max(0, totalSponsorSlots - activeSponsorCount);
        return (
          <div className="max-w-3xl mx-auto mb-6 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span>Availability</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/90 bg-white px-4 py-2.5 shadow-2xs">
              <span className="text-xs sm:text-sm font-medium text-neutral-700">
                Slots open right now
              </span>
              <span
                className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-bold font-mono-num ${
                  openSponsorSlots > 0
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {openSponsorSlots}/{totalSponsorSlots} open
              </span>
            </div>
          </div>
        );
      })()}

      {/* ── 2 Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
        {/* CARD 1: 1-Week Sponsor ($10) */}
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-neutral-950 tracking-tight">1-Week Sponsor</h3>
              <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                40% OFF · 7 Days
              </span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 min-h-9">
              Fast 7-day launch sprint on sticky desktop side rails and mobile hero sponsor cards.
            </p>

            <div className="flex items-baseline gap-2 mt-4 mb-5">
              <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                $10
              </span>
              <span className="text-base font-bold text-neutral-400 line-through font-sans">
                $17
              </span>
              <span className="text-xs text-neutral-500 font-medium font-sans">/week</span>
            </div>

            <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-700 font-medium mb-6">
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>1 of 5 sponsor slots (desktop sidebars &amp; mobile)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>24/7 Homepage &amp; Product Page presence</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>Direct High-Authority DoFollow backlink</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span>Golden Verified Sponsor partner badge</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleSelectTier('1wk')}
            className="mt-auto w-full rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-900 py-3 px-4 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
          >
            <span>Choose 1-Week Sponsor</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
          </button>
        </div>

        {/* CARD 2: 1-Month Sponsor ($29) — Highlighted */}
        <div className="rounded-2xl border border-blue-600 bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-white p-5 sm:p-6 shadow-xl shadow-blue-500/10 ring-2 ring-blue-600 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-neutral-950 tracking-tight">1-Month Sponsor</h3>
              <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                40% OFF
              </span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed mt-1.5 min-h-9">
              Full 30 days of high-frequency sticky brand visibility across all visitor sessions.
            </p>

            <div className="flex items-baseline gap-2 mt-4 mb-5">
              <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                $29
              </span>
              <span className="text-base font-bold text-neutral-400 line-through font-sans">
                $49
              </span>
              <span className="text-xs text-neutral-500 font-medium font-sans">/month · $7.25/wk</span>
            </div>

            <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-700 font-medium mb-6">
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>30 Days Exposure:</strong> 1 of 5 desktop &amp; mobile slots</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>24/7 Placement:</strong> Desktop rails + mobile hero card</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>Sidebar Partner Distinction</strong> across the directory</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </div>
                <span><strong>Save 28%</strong> compared to the weekly rate</span>
              </li>
            </ul>
          </div>

          <a
            href={appendTrackkitParams(WHOP_LINKS.sponsor1mo)}
            target="_blank"
            rel="noopener"
            data-ml-goal="pricing_cta"
            data-ml-goal-plan="sponsor_1mo"
            onClick={() => playSound('click', soundEnabled)}
            className="mt-auto btn-primary w-full py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-between"
          >
            <span>Choose 1-Month Sponsor</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
