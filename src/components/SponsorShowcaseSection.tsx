import React from 'react';
import { Check, Star } from 'lucide-react';
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
    <div className="w-full bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs font-sans">
      {/* ── Concise header ── */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 mb-1">
          <Star className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />
          <span>Sponsorship Spotlight</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
          Spotlight Your Product on TopSAAS Sidebar
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Take over 24/7 sticky sidebar rails on the Homepage and Product Details pages to drive founder traffic.
        </p>
      </div>

      {/* ── Outer glowing frame ── */}
      <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-[#eef2ff]/90 via-[#f5f7ff]/70 to-[#e4e9fc]/90 p-4 sm:p-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_30px_-6px_rgba(99,102,241,0.1)]">
        {/* ── 2 Sponsor Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          
          {/* ══════════════════════════════════════════════════════════
              CARD 1: 1 Week ($10)
             ══════════════════════════════════════════════════════════ */}
          <div className="rounded-xl bg-white p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              {/* Top Price Panel */}
              <div className="rounded-xl bg-gradient-to-b from-neutral-50 to-slate-50/80 p-4 mb-4 border border-neutral-200/60 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                    1-Week Sponsor
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700 shadow-2xs">
                    7 Days
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                    $10
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">/ week</span>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                  Fast 7-day launch sprint on sticky side rails
                </p>
              </div>

              {/* Everything Included */}
              <div className="space-y-2.5 pt-1 mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Everything Included</p>
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>24/7 Sticky Sidebar Rails:</strong> Placed on Homepage and Product Details pages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Category Pinned Spotlight:</strong> Priority visibility when filtering your category</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>⭐️ Verified Sponsor Badge:</strong> Official spotlight distinction on partner cards</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Traffic Analytics:</strong> Real-time impression and outbound click tracker</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tactile App Button */}
            <button
              type="button"
              onClick={() => handleSelectTier('1wk')}
              className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3 cursor-pointer"
            >
              Get 1 Week — $10
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════
              CARD 2: 1 Month ($29) - Most Popular
             ══════════════════════════════════════════════════════════ */}
          <div className="rounded-xl bg-white p-5 sm:p-6 border-2 border-blue-500/80 shadow-md flex flex-col justify-between relative hover:shadow-lg transition-all">
            {/* Most popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-xs">
                Most Popular · Save 28%
              </span>
            </div>

            <div>
              {/* Top Price Panel */}
              <div className="rounded-xl bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-blue-50/70 p-4 mb-4 border border-blue-200/80 shadow-2xs mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">
                    1-Month Sponsor
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Save 28%
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                    $29
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">/ month · <span className="text-blue-700 font-bold">$7.25/wk</span></span>
                </div>

                <p className="text-[11px] text-blue-800/80 mt-1 font-medium">
                  Continuous 30-day visibility · Save $11 vs weekly
                </p>
              </div>

              {/* Everything Included */}
              <div className="space-y-2.5 pt-1 mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Everything Included</p>
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>30 Days Continuous Rails:</strong> 24/7 persistent presence on Homepage & Details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>1× Dedicated Newsletter Blast:</strong> Direct launch feature to 14,000+ builders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>⭐️ Sidebar Partner Tag:</strong> Prominent sponsored distinction directory-wide</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Priority Upvote Boost:</strong> Enhanced founder visibility in weekly rounds</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tactile App Button */}
            <button
              type="button"
              onClick={() => handleSelectTier('1mo')}
              className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3 cursor-pointer"
            >
              Get 1 Month — $29
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
