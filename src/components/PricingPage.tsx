import React, { useState } from 'react';
import { Check, X, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp, Award, Sparkles } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { BorderBeam } from './BorderBeam';
import { SponsorShowcaseSection } from './SponsorShowcaseSection';
import { playSound } from '../utils/sound';
import { WHOP_LINKS } from '../utils/whop';

interface PricingPageProps {
  onOpenSubmit: (plan?: 'free' | 'free_relaunch' | 'verified_launch' | 'lifetime' | 'monthly_pro') => void;
  onOpenSponsor?: (tier?: '1wk' | '1mo') => void;
  onOpenFeaturedSpot?: (tier?: '1wk' | '1mo') => void;
  onGoHome: () => void;
  soundEnabled: boolean;
}

const faqs = [
  {
    q: 'What is the difference between Free and the $19 Verified Launch?',
    a: 'Free submissions enter a manual queue that takes 7–14 days, with a standard nofollow backlink. The $19 Verified Launch fast-tracks your review within 24 hours, gives you a permanent high-authority DoFollow backlink, the official Verified Mint Badge, and inclusion in our /llms.txt for AI search engines like ChatGPT and Perplexity.',
  },
  {
    q: 'Is the $19 Verified Launch a recurring subscription?',
    a: 'No! It is a simple one-time payment of $19 per product. You keep your listing, verified badge, and permanent dofollow SEO backlink indefinitely with zero recurring charges or surprise renewals.',
  },
  {
    q: 'What is the difference between Featured Spot and Sidebar Sponsor?',
    a: 'Featured Spot ($15/week or $39/month) pins your product card directly at the top of the main product feed above normal listings for maximum clicks while visitors browse and upvote. Sidebar Sponsor ($10/week or $29/month) places your product on the 24/7 sticky side rails across the Homepage and Product Details pages for sustained peripheral awareness.',
  },
  {
    q: 'What is a DoFollow backlink?',
    a: 'Free listings receive a nofollow link. Paid plans receive a permanent dofollow link, passing search engine authority from TopSAAS to your website to help your domain rank higher in Google over time.',
  },
  {
    q: 'How does the llms.txt / AI ingestion work?',
    a: 'Verified listings are indexed in our /llms.txt file with structured JSON metadata. When AI tools like Perplexity, ChatGPT, or Claude crawl TopSAAS for software recommendations, your product is directly readable by their agents.',
  },
  {
    q: 'What is the verified badge?',
    a: 'Verified listings receive a mint rosette badge on the TopSAAS directory card and details page. You also get embeddable SVG code to display your verified TopSAAS status on your landing page.',
  },
];

const comparisonRows: Array<{
  feature: string;
  free: boolean | string;
  verified: boolean | string;
}> = [
  { feature: 'Public directory listing',        free: true,              verified: true },
  { feature: 'Review & approval queue',         free: '7–14 days',      verified: 'Under 24 hours' },
  { feature: 'SEO backlink type',               free: 'nofollow',       verified: 'dofollow (permanent)' },
  { feature: 'Verified badge (directory card)', free: false,            verified: true },
  { feature: 'Embeddable badge (your site)',    free: false,            verified: true },
  { feature: 'Included in /llms.txt (AI SEO)',  free: false,            verified: true },
  { feature: 'Newsletter launch blast (1×)',    free: false,            verified: true },
  { feature: 'Weekly Relaunch eligibility',     free: '+$5 toggle',     verified: 'Included' },
  { feature: 'Live click & traffic analytics',  free: true,             verified: true },
  { feature: 'Pricing model',                   free: '$0 Forever',     verified: '$19 One-Time (Lifetime)' },
];

export const PricingPage: React.FC<PricingPageProps> = ({
  onOpenSubmit,
  onOpenSponsor,
  onOpenFeaturedSpot,
  onGoHome,
  soundEnabled,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [freeWeeklyRelaunch, setFreeWeeklyRelaunch] = useState(false);
  const [isIncludesOpen, setIsIncludesOpen] = useState(false);

  const toggleFaq = (index: number) => {
    playSound('click', soundEnabled);
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleOpenFeatured = (tier: '1wk' | '1mo' = '1wk') => {
    playSound('click', soundEnabled);
    if (onOpenFeaturedSpot) {
      onOpenFeaturedSpot(tier);
    } else if (onOpenSponsor) {
      onOpenSponsor(tier);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-12 space-y-10 sm:space-y-12 flex-1 font-sans">
      {/* ── Back nav ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { playSound('click', soundEnabled); onGoHome(); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </button>
      </div>

      {/* ── Page header ── */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 tracking-tight">
          Transparent, Founder-Friendly Pricing
        </h1>
        <p className="text-sm text-neutral-500 max-w-xl">
          Submit your product for free, fast-track your launch for $19 one-time, or spotlight your app in our top placements.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. LISTING PLANS (2 Cards: Free vs $19 Verified Launch)
         ══════════════════════════════════════════════════════════ */}
      <div>
        <div className="mb-4">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Product Submissions</p>
          <h2 className="text-lg font-black text-neutral-950">Choose Your Launch Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">

          {/* 1. Free */}
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 shadow-xs">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Standard Launch</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-neutral-950">
                  {freeWeeklyRelaunch ? '$5' : '$0'}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  {freeWeeklyRelaunch ? '/month' : 'forever free'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 pt-1">
                {freeWeeklyRelaunch
                  ? 'Standard submission with Auto Weekly Relaunch into every new weekly round.'
                  : 'Standard queue submission. Perfect for testing if your product resonates.'}
              </p>
            </div>

            {/* $5 Weekly Relaunch Toggle */}
            <div
              onClick={() => {
                playSound('click', soundEnabled);
                setFreeWeeklyRelaunch((prev) => !prev);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                freeWeeklyRelaunch
                  ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/30'
                  : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">🚀</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-950 flex items-center gap-1.5">
                      <span>Weekly Relaunch</span>
                      <span className="text-[10px] font-black px-1.5 py-px rounded bg-blue-100 text-blue-700">+$5</span>
                    </p>
                    <p className="text-[10.5px] text-neutral-500 truncate mt-0.5">
                      Relaunches into active week every Sunday
                    </p>
                  </div>
                </div>
                {/* Switch track */}
                <span
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                    freeWeeklyRelaunch ? 'bg-blue-600' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      freeWeeklyRelaunch ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-neutral-600 flex-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                Public directory listing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                Community upvote ranking
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                Click & impression analytics
              </li>
              <li className="flex items-center gap-2">
                {freeWeeklyRelaunch ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-semibold text-neutral-900">Auto Weekly Relaunch active</span>
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                    <span className="text-neutral-500">1 launch round (no auto relaunch)</span>
                  </>
                )}
              </li>
              <li className="flex items-center gap-2 text-neutral-600">
                <X className="h-3.5 w-3.5 shrink-0" />
                7–14 day review queue
              </li>
              <li className="flex items-center gap-2 text-neutral-600">
                <X className="h-3.5 w-3.5 shrink-0" />
                nofollow link only
              </li>
              <li className="flex items-center gap-2 text-neutral-600">
                <X className="h-3.5 w-3.5 shrink-0" />
                No verified badge
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                try {
                  if (freeWeeklyRelaunch) {
                    localStorage.setItem('topsaas_submit_auto_relaunch', 'true');
                  } else {
                    localStorage.removeItem('topsaas_submit_auto_relaunch');
                  }
                } catch {}
                onOpenSubmit(freeWeeklyRelaunch ? 'free_relaunch' : 'free');
              }}
              className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                freeWeeklyRelaunch
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'
                  : 'border border-neutral-200 bg-neutral-100 text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              {freeWeeklyRelaunch ? 'Submit with Weekly Relaunch — $5' : 'Submit for Free'}
            </button>
          </div>

          {/* 2. Verified Launch ($19 / Product · One-time) — Highlighted with BorderBeam */}
          <BorderBeam size="md" colorVariant="colorful" strength={0.85} className="rounded-2xl flex flex-col">
            <div className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-6 h-full shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold text-mint-700 uppercase tracking-wider">Verified Launch</p>
                    <Award className="h-3 w-3 text-mint-600" />
                  </div>
                  <span className="rounded-md bg-white border border-mint-500/40 px-2 py-0.5 text-[10px] font-bold text-mint-700 shadow-2xs">
                    Most Popular
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-neutral-950">$19</span>
                  <span className="text-xs text-neutral-500 font-medium">one-time / product</span>
                </div>
                <p className="text-xs text-neutral-600 pt-1">
                  Fast-track 24h approval, permanent dofollow SEO backlink, and the official verified badge. No recurring fees.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-700 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  <strong>Live within 24 hours</strong> (skip 14-day queue)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  <strong>Permanent DoFollow backlink</strong> for domain SEO authority
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0 mt-0.5" />
                  <span className="flex items-center gap-1 font-semibold text-neutral-900">
                    Verified badge <VerifiedBadge className="h-3.5 w-3.5" />
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Included in <strong>/llms.txt</strong> for AI search crawlers
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Embeddable dynamic badge for your landing page
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  1× Newsletter launch mention to active subscribers
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Lifetime listing — <strong>no subscription or recurring fees</strong>
                </li>
              </ul>

              <a
                href={WHOP_LINKS.oneTime}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('click', soundEnabled)}
                className="w-full text-center rounded-xl bg-mint-500 py-2.5 text-xs font-black text-white hover:bg-mint-400 transition-all cursor-pointer shadow-md shadow-mint-500/20 block"
              >
                Get Verified Launch — $19
              </a>
            </div>
          </BorderBeam>

        </div>
      </div>

      {/* ── Feature Comparison (collapsible dropdown) ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all shadow-2xs">
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            setIsIncludesOpen((prev) => !prev);
          }}
          className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50/80 transition-colors cursor-pointer select-none"
        >
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-950">Detailed Launch Comparison</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                Side by Side
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {isIncludesOpen
                ? 'Every row represents a specific capability.'
                : 'Click to expand the side-by-side feature comparison table.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs font-bold text-neutral-600">
            <span className="hidden sm:inline">{isIncludesOpen ? 'Hide comparison' : 'Compare plans'}</span>
            <div className="h-7 w-7 rounded-lg border border-neutral-200 flex items-center justify-center bg-neutral-50">
              {isIncludesOpen ? (
                <ChevronUp className="h-4 w-4 text-neutral-950" />
              ) : (
                <ChevronDown className="h-4 w-4 text-neutral-700" />
              )}
            </div>
          </div>
        </button>

        {isIncludesOpen && (
          <div className="border-t border-neutral-200 overflow-x-auto animate-in fade-in-50 duration-150">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-100 text-neutral-500">
                  <th className="p-4 text-left font-semibold w-1/2">Feature</th>
                  <th className="p-4 text-center font-semibold">Free</th>
                  <th className="p-4 text-center font-semibold text-mint-700 bg-mint-500/5 border-x border-mint-500/15">Verified Launch ($19)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/60">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                    <td className="p-4 font-medium text-neutral-700">{row.feature}</td>
                    <td className="p-4 text-center text-neutral-500">
                      {typeof row.free === 'boolean'
                        ? row.free
                          ? <Check className="h-3.5 w-3.5 text-neutral-500 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-neutral-400 mx-auto" />
                        : row.free === '+$5 toggle'
                          ? <span className="inline-flex rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">+$5 toggle</span>
                          : row.free}
                    </td>
                    <td className="p-4 text-center text-mint-700 font-semibold bg-mint-500/5 border-x border-mint-500/15">
                      {typeof row.verified === 'boolean'
                        ? row.verified
                          ? <Check className="h-3.5 w-3.5 text-mint-600 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-neutral-400 mx-auto" />
                        : row.verified}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. STANDALONE FEATURED SPOTLIGHT (In-Feed Top Placement)
         ══════════════════════════════════════════════════════════ */}
      <div className="w-full bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
            <Sparkles className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>Featured Spotlight</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
            Pin Your Product Above the Directory Cards
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Placed directly in the top spot of the main product feed for maximum views, clicks, and community upvotes.
          </p>
        </div>

        {/* Glowing frame */}
        <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/60 via-amber-50/30 to-orange-50/50 p-4 sm:p-5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_8px_30px_-6px_rgba(245,158,11,0.08)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">

            {/* Featured Card 1: 1 Week ($15) */}
            <div className="rounded-xl bg-white p-5 sm:p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="rounded-xl bg-gradient-to-b from-neutral-50 to-amber-50/40 p-4 mb-4 border border-neutral-200/60 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700">
                      1-Week Featured Spot
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-700 shadow-2xs">
                      7 Days
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                      $15
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">/ week</span>
                  </div>

                  <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                    Pinned directly above standard product cards for 7 days
                  </p>
                </div>

                <div className="space-y-2.5 pt-1 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Everything Included</p>
                  <ul className="space-y-2.5 text-xs text-neutral-700">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Pinned Top Feed Position:</strong> Pinned right at the top of the product cards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Highest CTR on TopSAAS:</strong> Maximizes direct outbound visits & upvotes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Category Top Spot:</strong> Priority visibility when visitors filter categories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Free 7-Day Test Drive:</strong> Free trial available for newly launched tools</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenFeatured('1wk')}
                className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3 cursor-pointer"
              >
                Claim 1-Week Featured — $15
              </button>
            </div>

            {/* Featured Card 2: 1 Month ($39) */}
            <div className="rounded-xl bg-white p-5 sm:p-6 border-2 border-amber-400 shadow-md flex flex-col justify-between relative hover:shadow-lg transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="inline-flex items-center rounded-full bg-amber-500 text-white px-3 py-0.5 text-[10px] font-black tracking-wider uppercase shadow-xs">
                  Best Value · Save 35%
                </span>
              </div>

              <div>
                <div className="rounded-xl bg-gradient-to-b from-amber-50/70 via-orange-50/30 to-amber-50/70 p-4 mb-4 border border-amber-200/80 shadow-2xs mt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                      1-Month Featured Spot
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Save 35%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-950 font-mono-num tracking-tight">
                      $39
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">/ month · <span className="text-amber-800 font-bold">$9.75/wk</span></span>
                  </div>

                  <p className="text-[11px] text-amber-900/80 mt-1 font-medium">
                    Continuous 30-day top pinned spotlight · Save $21 vs weekly
                  </p>
                </div>

                <div className="space-y-2.5 pt-1 mb-4">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Everything Included</p>
                  <ul className="space-y-2.5 text-xs text-neutral-700">
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>30 Days Continuous Pinned Spot:</strong> Uninterrupted in-feed top visibility</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>1× Dedicated Newsletter Launch Highlight:</strong> Direct founder reach</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Exclusive Featured Badge:</strong> Stand out clearly across the entire directory</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span><strong>Outbound Click Tracker:</strong> Monitor daily traffic conversion in real time</span>
                    </li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenFeatured('1mo')}
                className="w-full btn-primary bg-amber-500 hover:bg-amber-400 py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs mt-3 cursor-pointer"
              >
                Claim 1-Month Featured — $39
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. STANDALONE SIDEBAR SPONSORSHIP (2 Cards: $10/wk & $29/mo)
         ══════════════════════════════════════════════════════════ */}
      <SponsorShowcaseSection
        onOpenSponsor={onOpenSponsor}
        soundEnabled={soundEnabled}
      />

      {/* ── What the verified badge means ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-500/10 border border-mint-500/30">
            <ShieldCheck className="h-4.5 w-4.5 text-mint-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-neutral-950">About the Verified Badge</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">Included with Verified Launch and Featured Spots</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
          <div className="space-y-1">
            <p className="font-semibold text-neutral-900">On the directory</p>
            <p>A mint rosette appears next to your listing card, distinguishing it from unverified queue submissions.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-neutral-900">On your website</p>
            <p>Embed a dynamic SVG badge that links back to your live TopSAAS listing. Boosts social proof and trust.</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-neutral-900">SEO & AI Authority</p>
            <p>Your listing gets a permanent DoFollow backlink and structured inclusion in /llms.txt for AI agents.</p>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-neutral-950">Common Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left text-xs font-semibold text-neutral-900 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen
                    ? <ChevronUp className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                    : <ChevronDown className="h-3.5 w-3.5 text-neutral-600 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-neutral-600 border-t border-neutral-200 pt-3 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </main>
  );
};
