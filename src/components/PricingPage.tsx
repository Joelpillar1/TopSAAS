import React, { useState } from 'react';
import { Check, X, Zap, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp, Award, Star, Sparkles } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { BorderBeam } from './BorderBeam';
import { SponsorShowcaseSection } from './SponsorShowcaseSection';
import { playSound } from '../utils/sound';

interface PricingPageProps {
  onOpenSubmit: (plan?: 'free' | 'free_relaunch' | 'verified_launch' | 'lifetime' | 'monthly_pro') => void;
  onOpenSponsor?: (tier?: '1wk' | '1mo' | '3mo' | '1yr') => void;
  onOpenFeaturedSpot?: () => void;
  onGoHome: () => void;
  soundEnabled: boolean;
}

const faqs = [
  {
    q: 'What is the difference between Free and the $19 Verified Launch?',
    a: 'Free submissions enter a manual review queue that takes 7–14 days, with a standard nofollow backlink. The $19 Verified Launch fast-tracks your review within 24 hours, gives you a permanent high-authority DoFollow backlink, the official Verified Mint Badge, and inclusion in our /llms.txt for AI search engines like ChatGPT and Perplexity.',
  },
  {
    q: 'Is the $19 Verified Launch a recurring subscription?',
    a: 'No! It is a simple one-time payment of $19 per product. You keep your listing, verified badge, and permanent dofollow SEO backlink indefinitely with zero recurring charges or surprise renewals.',
  },
  {
    q: 'What is the difference between Featured Spot and Sponsored Partner?',
    a: 'Featured Spot ($15/week or $39/month) pins your product card at the very top of the main product feed directly above normal listings for maximum clicks while users browse and upvote. Sponsored Partner ($10/week or $29/month) places your product on the 24/7 sticky sidebar rails across the Homepage and Product Details pages for sustained brand awareness.',
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
  featured: boolean | string;
}> = [
  { feature: 'Public directory listing',        free: true,              verified: true,                         featured: true },
  { feature: 'Review & approval queue',         free: '7–14 days',      verified: 'Under 24 hours',             featured: 'Under 24 hours' },
  { feature: 'SEO backlink type',               free: 'nofollow',       verified: 'dofollow',                   featured: 'dofollow' },
  { feature: 'Verified badge (directory card)', free: false,            verified: true,                         featured: true },
  { feature: 'Embeddable badge (your site)',    free: false,            verified: true,                         featured: true },
  { feature: 'Included in /llms.txt (AI SEO)',  free: false,            verified: true,                         featured: true },
  { feature: 'Newsletter launch blast (1×)',    free: false,            verified: true,                         featured: true },
  { feature: 'Pinned Top of Product Feed',      free: false,            verified: false,                        featured: 'Pinned Top Spot' },
  { feature: 'Category pinned placement',       free: false,            verified: false,                        featured: true },
  { feature: 'Weekly Relaunch eligibility',     free: '+$5 toggle',     verified: 'Included',                   featured: 'Included' },
  { feature: 'Live click & traffic analytics',  free: true,             verified: true,                         featured: true },
  { feature: 'Payment model',                   free: '$0 Forever',     verified: '$19 One-Time',               featured: 'From $15 / week' },
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

      {/* ── Pricing cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* 1. Free */}
        <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
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
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 space-y-6 h-full">
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
                <strong>Permanent DoFollow backlink</strong> for SEO
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
                Lifetime listing — no subscription or recurring fee
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onOpenSubmit('verified_launch');
              }}
              className="w-full text-center rounded-xl bg-mint-500 py-2.5 text-xs font-black text-white hover:bg-mint-400 transition-all cursor-pointer shadow-md shadow-mint-500/20 block"
            >
              Get Verified Launch — $19
            </button>
          </div>
        </BorderBeam>

        {/* 3. Featured Spot (In-Feed Top Spot: $15/wk or $39/mo) */}
        <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Featured Spot</p>
                <Sparkles className="h-3 w-3 text-blue-600" />
              </div>
              <span className="rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                Highest CTR
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-neutral-950">$15</span>
              <span className="text-xs text-neutral-500 font-medium">/ week · or $39/mo</span>
            </div>
            <p className="text-xs text-neutral-500 pt-1">
              Pinned directly in the top spot of the main product cards feed above regular listings for maximum views and votes.
            </p>
          </div>

          <ul className="space-y-2.5 text-xs text-neutral-700 flex-1">
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <strong>Pinned top spot in product feed</strong>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              Highest click-through rate across directory
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              Priority category pinned placement
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              Exclusive Featured badge on product card
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              Real-time impressions & outbound click analytics
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              7-day free trial available for new products
            </li>
          </ul>

          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              if (onOpenFeaturedSpot) {
                onOpenFeaturedSpot();
              } else if (onOpenSponsor) {
                onOpenSponsor('1wk');
              }
            }}
            className="w-full text-center rounded-xl border border-neutral-300 bg-neutral-100 py-2.5 text-xs font-bold text-neutral-900 hover:border-neutral-400 hover:bg-neutral-200 transition-all cursor-pointer block"
          >
            Claim Featured Spot — From $15
          </button>
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
              <h2 className="text-sm font-bold text-neutral-950">Detailed Feature Comparison</h2>
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
                  <th className="p-4 text-center font-semibold text-mint-700 bg-mint-500/5 border-x border-mint-500/15">Verified ($19)</th>
                  <th className="p-4 text-center font-semibold text-blue-700">Featured Spot</th>
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
                    <td className="p-4 text-center text-blue-700 font-medium">
                      {typeof row.featured === 'boolean'
                        ? row.featured
                          ? <Check className="h-3.5 w-3.5 text-blue-600 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-neutral-400 mx-auto" />
                        : row.featured}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Homepage & Directory Sponsorship (Showcase Layout with $10/wk & $29/mo) ── */}
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
