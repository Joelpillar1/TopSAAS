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
    a: 'Free submissions enter a manual queue that takes 7–14 days, with a standard nofollow backlink. The $19 Verified Launch gives you the full suite: fast-track review within 24 hours, category top-3 pinned spot, auto weekly relaunch every Sunday, permanent high-authority DoFollow backlink, official Verified Mint Badge, /llms.txt AI search inclusion, newsletter launch blast + monthly rotation, and "X vs Y" comparison pages.',
  },
  {
    q: 'Is the $19 Verified Launch a recurring subscription?',
    a: 'No! It is a simple one-time payment of $19 per product. You get all premium distribution, relaunch, and SEO features indefinitely with zero recurring charges or surprise renewals.',
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
  { feature: 'Auto Weekly Relaunch',            free: '+$5 toggle',     verified: 'Included (Every Week)' },
  { feature: 'Category pinned placement',       free: false,            verified: 'Top 3 Pinned' },
  { feature: 'Newsletter promotion',            free: false,            verified: 'Launch blast + monthly rotation' },
  { feature: '"X vs Y" comparison pages',       free: false,            verified: true },
  { feature: 'Editorial blog review post',      free: false,            verified: true },
  { feature: 'Included in /llms.txt (AI SEO)',  free: false,            verified: true },
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
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16 space-y-12 sm:space-y-14 flex-1 font-sans">
      {/* ── Back nav ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => { playSound('click', soundEnabled); onGoHome(); }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          1. LAUNCH PLANS (Starter Free vs $19 Verified Launch)
         ══════════════════════════════════════════════════════════ */}
      <div className="w-full rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-sm relative">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50/80 px-3.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs">
            <span>Pricing Plan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight mt-3">
            Get started for free
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-lg mx-auto">
            Submit your SaaS for free, or upgrade to our one-time Verified Launch for 24h approval, category top-3 placement, auto weekly relaunch, dofollow SEO backlink, and verified badge.
          </p>
        </div>

        {/* 2 Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {/* Card 1: Starter (Free) */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="h-7 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Starter</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    Free Forever
                  </span>
                </div>
                <p className="h-10 text-xs text-neutral-500 leading-relaxed mt-1 mb-2 line-clamp-2">
                  Your launch partner. Unlock community directory visibility with a simple free submission.
                </p>

                <div className="h-10 flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                    Free Plan
                  </span>
                </div>
              </div>

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
                className="btn-secondary w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>{freeWeeklyRelaunch ? 'Submit with Weekly Relaunch — $5' : 'Launch for Free'}</span>
                <span className="opacity-60">→</span>
              </button>
            </div>

            {/* Checklist */}
            <div className="px-2 pt-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                GET STARTED WITH
              </p>

              {/* $5 Weekly Relaunch Optional Toggle */}
              <div
                onClick={() => {
                  playSound('click', soundEnabled);
                  setFreeWeeklyRelaunch((prev) => !prev);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                  freeWeeklyRelaunch
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/30'
                    : 'border-neutral-200/90 bg-neutral-50/70 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base shrink-0">🚀</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-950 flex items-center gap-1.5">
                        <span>Auto Weekly Relaunch</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">+$5/mo</span>
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        Re-enters active leaderboard every Sunday
                      </p>
                    </div>
                  </div>
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

              <ul className="space-y-3.5 text-xs sm:text-[13px] text-neutral-700 font-medium pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Public SaaS directory listing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Community upvote ranking & discovery</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Real-time click & impression analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Standard community review queue</span>
                </li>
                <li className="flex items-center gap-2.5 text-neutral-400">
                  <div className="h-4 w-4 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0">
                    <X className="h-2.5 w-2.5 stroke-[2.5]" />
                  </div>
                  <span>nofollow link only</span>
                </li>
                <li className="flex items-center gap-2.5 text-neutral-400">
                  <div className="h-4 w-4 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0">
                    <X className="h-2.5 w-2.5 stroke-[2.5]" />
                  </div>
                  <span>No verified badge</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Verified Launch ($19 / Product · One-time) — Elevated Hero Card */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-neutral-300/80 bg-white p-6 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="h-7 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Verified Launch</h3>
                    <VerifiedBadge className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">
                    Most Popular
                  </span>
                </div>
                <p className="h-10 text-xs text-neutral-500 leading-relaxed mt-1 mb-2 line-clamp-2">
                  Fast-track 24h approval, category top-3 spot, auto weekly relaunch, dofollow SEO backlink, and verified badge.
                </p>

                <div className="h-10 flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                    $19.00
                  </span>
                  <span className="text-xs text-neutral-500 font-medium font-sans">/Product (One-time)</span>
                </div>
              </div>

              <a
                href={WHOP_LINKS.oneTime}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('click', soundEnabled)}
                className="btn-primary w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <span>Get Verified Launch</span>
                <span>→</span>
              </a>
            </div>

            {/* Checklist */}
            <div className="px-2 pt-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                EVERYTHING IN STARTER, PLUS:
              </p>
              <ul className="space-y-3.5 text-xs sm:text-[13px] text-neutral-700 font-medium pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Live within 24 hours</strong> (skip 14-day queue)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Permanent High-Authority DoFollow backlink</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Official Verified Mint Badge</strong> on card & profile</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Auto Weekly Relaunch included</strong> (every Sunday)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Pinned Top 3</strong> in your primary category</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Newsletter launch blast</strong> + monthly rotation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>&quot;X vs Y&quot; competitor comparison pages</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Dedicated editorial blog review post</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Indexed in <strong>/llms.txt</strong> for AI search (ChatGPT, Perplexity)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Lifetime listing — <strong>zero recurring subscription fees</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Feature Comparison (collapsible dropdown) ── */}
        <div className="mt-10 pt-6 border-t border-neutral-100 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              setIsIncludesOpen((prev) => !prev);
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer select-none text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900">Side-by-Side Feature Comparison</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                {isIncludesOpen ? 'Hide' : 'View full table'}
              </span>
            </div>
            <div className="h-6 w-6 rounded-lg border border-neutral-200 flex items-center justify-center bg-white shadow-2xs">
              {isIncludesOpen ? (
                <ChevronUp className="h-3.5 w-3.5 text-neutral-950" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-neutral-700" />
              )}
            </div>
          </button>

          {isIncludesOpen && (
            <div className="mt-3 rounded-2xl border border-neutral-200 bg-white overflow-hidden animate-in fade-in-50 duration-150">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
                    <th className="p-3.5 text-left font-semibold w-1/2">Feature</th>
                    <th className="p-3.5 text-center font-semibold">Starter</th>
                    <th className="p-3.5 text-center font-semibold text-mint-700 bg-mint-500/5 border-l border-neutral-200">
                      Verified ($19)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3.5 font-medium text-neutral-700">{row.feature}</td>
                      <td className="p-3.5 text-center text-neutral-500">
                        {typeof row.free === 'boolean'
                          ? row.free
                            ? <Check className="h-3.5 w-3.5 text-neutral-500 mx-auto" />
                            : <X className="h-3.5 w-3.5 text-neutral-300 mx-auto" />
                          : row.free === '+$5 toggle'
                            ? <span className="inline-flex rounded bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">+$5 toggle</span>
                            : row.free}
                      </td>
                      <td className="p-3.5 text-center text-mint-700 font-semibold bg-mint-500/5 border-l border-neutral-200">
                        {typeof row.verified === 'boolean'
                          ? row.verified
                            ? <Check className="h-3.5 w-3.5 text-mint-600 mx-auto" />
                            : <X className="h-3.5 w-3.5 text-neutral-300 mx-auto" />
                          : row.verified}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. STANDALONE FEATURED SPOTLIGHT (In-Feed Top Placement)
         ══════════════════════════════════════════════════════════ */}
      <div className="w-full rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-sm relative">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50/80 px-3.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs">
            <Sparkles className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>Featured Spotlight</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight mt-3">
            Pin Your Product Above Directory Cards
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-lg mx-auto">
            Take over the guaranteed #1 spot of the main product feed for maximum views, outbound clicks, and community upvotes.
          </p>
        </div>

        {/* 2 Featured Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {/* Card 1: 1-Week Featured ($15) */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="h-7 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 tracking-tight">1-Week Featured</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                    7 Days
                  </span>
                </div>
                <p className="h-10 text-xs text-neutral-500 leading-relaxed mt-1 mb-2 line-clamp-2">
                  A high-impact 7-day boost to capture launch momentum and surge community upvotes.
                </p>

                <div className="h-10 flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                    $15.00
                  </span>
                  <span className="text-xs text-neutral-500 font-medium font-sans">/Week</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenFeatured('1wk')}
                className="btn-secondary w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <span>Claim 1-Week Featured</span>
                <span className="opacity-60">→</span>
              </button>
            </div>

            {/* Checklist */}
            <div className="px-2 pt-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3.5">
                INCLUDED IN 1-WEEK FEATURED
              </p>
              <ul className="space-y-3.5 text-xs sm:text-[13px] text-neutral-700 font-medium pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Top pinned slot above all directory cards</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>7 days continuous hero visibility</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>2.4× average clickthrough rate</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Real-time outbound click analytics</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Free 7-day test drive for newly launched tools</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: 1-Month Featured ($39) — Elevated Hero Card */}
          <div className="flex flex-col">
            <div className="rounded-2xl border border-neutral-300/80 bg-white p-6 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] ring-1 ring-black/5 flex flex-col justify-between min-h-[220px]">
              <div>
                <div className="h-7 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 tracking-tight">1-Month Featured</h3>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                    Save 35%
                  </span>
                </div>
                <p className="h-10 text-xs text-neutral-500 leading-relaxed mt-1 mb-2 line-clamp-2">
                  Continuous 30-day top pinned spotlight for sustained traffic and compound brand authority.
                </p>

                <div className="h-10 flex items-baseline gap-1.5 my-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                    $39.00
                  </span>
                  <span className="text-xs text-neutral-500 font-medium font-sans">/Month · $9.75/wk</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenFeatured('1mo')}
                className="btn-primary w-full mt-4 py-3 px-4 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-1.5"
              >
                <span>Claim 1-Month Featured</span>
                <span>→</span>
              </button>
            </div>

            {/* Checklist */}
            <div className="px-2 pt-6">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-3.5">
                EVERYTHING IN 1-WEEK, PLUS:
              </p>
              <ul className="space-y-3.5 text-xs sm:text-[13px] text-neutral-700 font-medium pt-1">
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>30 Days Continuous Pinned Spot:</strong> Full month of feed dominance</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>1× Dedicated Newsletter Launch Highlight:</strong> Direct founder reach</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Exclusive Featured Badge:</strong> Stand out clearly across the entire directory</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Outbound Click Tracker:</strong> Monitor daily traffic conversion in real time</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Save $21:</strong> Best long-term value compared to weekly rate</span>
                </li>
              </ul>
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
      <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-500/10 border border-mint-500/30">
            <ShieldCheck className="h-5 w-5 text-mint-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-950">About the Verified Badge</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Included with Verified Launch and Featured Spots</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs text-neutral-600 pt-2">
          <div className="space-y-1">
            <p className="font-bold text-neutral-900">On the directory</p>
            <p className="leading-relaxed">A mint rosette appears next to your listing card, distinguishing it from unverified queue submissions.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-neutral-900">On your website</p>
            <p className="leading-relaxed">Embed a dynamic SVG badge that links back to your live TopSAAS listing. Boosts social proof and trust.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-neutral-900">SEO & AI Authority</p>
            <p className="leading-relaxed">Your listing gets a permanent DoFollow backlink and structured inclusion in /llms.txt for AI agents.</p>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-neutral-500 mt-1">Everything you need to know about our plans and placements.</p>
        </div>

        <div className="space-y-2.5 max-w-3xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-neutral-200/90 bg-white overflow-hidden shadow-2xs transition-all hover:border-neutral-300"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between gap-4 p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-neutral-900 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen
                    ? <ChevronUp className="h-4 w-4 text-neutral-900 shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-[13px] text-neutral-600 border-t border-neutral-100 pt-3.5 leading-relaxed">
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
