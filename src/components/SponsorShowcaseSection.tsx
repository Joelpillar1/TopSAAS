import React from 'react';
import { Check, Star } from 'lucide-react';
import { playSound } from '../utils/sound';

interface SponsorShowcaseSectionProps {
  onOpenSponsor?: (tier?: '1mo' | '3mo' | '1yr') => void;
  soundEnabled: boolean;
}

export const SponsorShowcaseSection: React.FC<SponsorShowcaseSectionProps> = ({
  onOpenSponsor,
  soundEnabled,
}) => {
  const handleSelectTier = (tier: '1mo' | '3mo' | '1yr') => {
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
          Spotlight Your Product on TopSAAS
        </h2>
        <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
          Take over 24/7 sticky hero rails, pin at top of category, and drive founder traffic.
        </p>
      </div>

      {/* ── Outer glowing frame ── */}
      <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-b from-[#eef2ff]/90 via-[#f5f7ff]/70 to-[#e4e9fc]/90 p-3 sm:p-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_30px_-6px_rgba(99,102,241,0.1)]">
        {/* ── 3 Month Cards Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* ══════════════════════════════════════════════════════════
              CARD 1: 1 Month ($29)
             ══════════════════════════════════════════════════════════ */}
          <div className="rounded-xl bg-white p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              {/* Top Price Panel (replaces illustration) */}
              <div className="rounded-xl bg-gradient-to-b from-neutral-50 to-slate-50/80 p-4 mb-4 border border-neutral-200/60 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600">
                    1-Month Sponsor
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700 shadow-2xs">
                    30 Days
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                    $29
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">/ month</span>
                </div>

                <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                  Flexible 30-day spotlight to test traffic & conversion
                </p>
              </div>

              {/* Everything Included */}
              <div className="space-y-2.5 pt-1 mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Everything Included</p>
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Hero Side Rails:</strong> 24/7 sticky spot next to top directory listings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Category Pinned Top:</strong> Priority visibility when visitors filter by your category</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>⭐️ Verified Sponsor Badge:</strong> Official spotlight tag on rails & listing</span>
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
              onClick={() => handleSelectTier('1mo')}
              className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3"
            >
              Get 1 Month — $29
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════
              CARD 2: 3 Months ($69) - Most Popular
             ══════════════════════════════════════════════════════════ */}
          <div className="rounded-xl bg-white p-5 border-2 border-blue-500/80 shadow-md flex flex-col justify-between relative hover:shadow-lg transition-all">
            {/* Most popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center rounded-full bg-blue-600 text-white px-3 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-xs">
                Most Popular
              </span>
            </div>

            <div>
              {/* Top Price Panel (replaces illustration) */}
              <div className="rounded-xl bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-blue-50/70 p-4 mb-4 border border-blue-200/80 shadow-2xs mt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">
                    3-Month Sponsor
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Save 20%
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                    $69
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">total · <span className="text-blue-700 font-bold">$23/mo</span></span>
                </div>

                <p className="text-[11px] text-blue-800/80 mt-1 font-medium">
                  Continuous 90-day growth campaign · Save $18
                </p>
              </div>

              {/* Everything Included */}
              <div className="space-y-2.5 pt-1 mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">Everything Included</p>
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>90 Days Continuous Rails:</strong> 24/7 persistent homepage & category placement</span>
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
              onClick={() => handleSelectTier('3mo')}
              className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3"
            >
              Get 3 Months — $69
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════
              CARD 3: 12 Months ($199) - Best Value
             ══════════════════════════════════════════════════════════ */}
          <div className="rounded-xl bg-white p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              {/* Top Price Panel (replaces illustration) */}
              <div className="rounded-xl bg-gradient-to-b from-purple-50/70 via-fuchsia-50/30 to-purple-50/70 p-4 mb-4 border border-purple-200/80 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-purple-800">
                    12-Month Partner
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Save 43%
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 my-1">
                  <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                    $199
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">total · <span className="text-purple-700 font-bold">$16.50/mo</span></span>
                </div>

                <p className="text-[11px] text-purple-800/80 mt-1 font-medium">
                  Full-year premier sponsorship & authority · Save $149
                </p>
              </div>

              {/* Everything Included */}
              <div className="space-y-2.5 pt-1 mb-4">
                <p className="text-[10px] font-black uppercase tracking-wider text-purple-600">Everything Included</p>
                <ul className="space-y-2.5 text-xs text-neutral-700">
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>365 Days Premier Visibility:</strong> Permanent top spot on homepage hero rails</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>4× Quarterly Blasts:</strong> Newsletter launch feature to our founder audience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Permanent DoFollow Backlink:</strong> High-authority SEO domain link that lasts forever</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Product of the Day Spotlight:</strong> Priority spotlight day with maximum exposure</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tactile App Button */}
            <button
              type="button"
              onClick={() => handleSelectTier('1yr')}
              className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3"
            >
              Get 12 Months — $199
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
