import React, { useState, useEffect } from 'react';
import { Check, X, ShieldCheck, ChevronDown, ChevronUp, Award, Clock, ArrowUpRight } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { BorderBeam } from './BorderBeam';
import { SponsorShowcaseSection } from './SponsorShowcaseSection';
import { playSound } from '../utils/sound';
import { WHOP_LINKS } from '../utils/whop';
import { appendTrackkitParams } from '../utils/trackkit';
import { applyPageSeo } from '../utils/pageSeo';
import { pricingSeo } from '../utils/coreSeo';
import { PRICING_FAQS } from '../data/corePageContent';
import { fetchAiCrawlTelemetry, DEFAULT_AI_CRAWL_TELEMETRY } from '../utils/aiCrawlStats';
import chatgptPng from '../assets/llms/chatgpt.png';
import claudePng from '../assets/llms/claude.png';
import geminiPng from '../assets/llms/gemini.png';
import perplexityPng from '../assets/llms/perplexity.png';

interface PricingPageProps {
  onOpenSubmit: (plan?: 'free' | 'free_relaunch' | 'verified_launch' | 'lifetime' | 'monthly_pro') => void;
  onOpenSponsor?: (tier?: '1wk' | '1mo') => void;
  onOpenFeaturedSpot?: (tier?: '1wk' | '1mo') => void;
  onGoHome: () => void;
  soundEnabled: boolean;
  activeFeaturedCount?: number;
  activeSponsorCount?: number;
}

const faqs = PRICING_FAQS;

const comparisonRows: Array<{
  feature: string;
  free: boolean | string;
  verified: boolean | string;
}> = [
    { feature: 'Public directory listing', free: true, verified: true },
    { feature: 'Review & approval queue', free: '7–14 days', verified: 'Under 24 hours' },
    { feature: 'SEO backlink type', free: 'nofollow', verified: 'dofollow (permanent)' },
    { feature: 'Verified badge (directory card)', free: false, verified: true },
    { feature: 'Embeddable badge (your site)', free: false, verified: true },
    { feature: 'Auto Weekly Relaunch', free: '+$5/week toggle', verified: '+$5/week optional' },
    { feature: 'Category pinned placement', free: false, verified: 'Top 3 Pinned (7 Days)' },
    { feature: '1,000+ word story on /blog', free: false, verified: 'Included' },
    { feature: 'Included in /llms.txt (AI SEO)', free: false, verified: 'ChatGPT, Perplexity & more' },
    { feature: 'Pricing model', free: '$0 Forever', verified: '$9 One-Time (Lifetime)' },
  ];

export const PricingPage: React.FC<PricingPageProps> = ({
  onOpenSubmit,
  onOpenSponsor,
  onOpenFeaturedSpot,
  onGoHome,
  soundEnabled,
  activeFeaturedCount = 0,
  activeSponsorCount = 0,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [freeWeeklyRelaunch, setFreeWeeklyRelaunch] = useState(false);
  const [isIncludesOpen, setIsIncludesOpen] = useState(false);
  const [telemetry, setTelemetry] = useState(DEFAULT_AI_CRAWL_TELEMETRY);
  const DISCOVERY_TARGETS = ['Search Engine', 'LLMs', 'Humans'] as const;
  const [discoveryIdx, setDiscoveryIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDiscoveryIdx((prev) => (prev + 1) % DISCOVERY_TARGETS.length);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchAiCrawlTelemetry().then((res) => {
      if (mounted && res) setTelemetry(res);
    }).catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return applyPageSeo({
      ...pricingSeo(),
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'TopSAAS Verified Launch',
        description: 'Permanent verified directory listing, high-authority dofollow backlink, verified badge, top 3 category placement (7 Days), and /llms.txt AI search inclusion.',
        offers: {
          '@type': 'Offer',
          price: '9',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
      jsonLdId: 'pricing-jsonld',
    });
  }, []);

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
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-4 sm:pt-6 pb-12 sm:pb-16 space-y-12 sm:space-y-14 flex-1 font-sans">
      {/* ── Pricing Hero Trust & Weekly AI Crawl Banner ── */}
      {(() => {
        const weeklyCrawlLabel = telemetry.weeklyAiCrawls?.value
          || (() => {
            const c = (telemetry.metrics.totalRequests.count || 4000) * 7;
            return c >= 1000 ? `${(c / 1000).toFixed(c % 1000 === 0 ? 0 : 1)}k` : c.toLocaleString();
          })();
        const monthlyVisitsLabel = telemetry.monthlyVisits?.value || '15k+';
        return (
          <div className="w-full rounded-3xl border border-neutral-200/90 bg-white overflow-hidden shadow-xs">
            <div className="relative px-4 sm:px-8 py-8 sm:py-10 text-center bg-gradient-to-b from-blue-50/70 via-slate-50/40 to-white">
              {/* Subtle dot pattern */}
              <div
                className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"
                aria-hidden="true"
              />

              {/* Floating AI Crawler Logos */}
              <div className="pointer-events-none hidden sm:flex items-center justify-center h-11 w-11 rounded-2xl bg-white border border-neutral-200/90 shadow-md absolute left-8 top-6 -rotate-6 p-2">
                <img src={chatgptPng} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="pointer-events-none hidden sm:flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-neutral-200/90 shadow-md absolute left-20 bottom-6 rotate-6 p-1.5">
                <img src={claudePng} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="pointer-events-none hidden sm:flex items-center justify-center h-11 w-11 rounded-2xl bg-white border border-neutral-200/90 shadow-md absolute right-8 top-6 rotate-6 p-2">
                <img src={geminiPng} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="pointer-events-none hidden sm:flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-neutral-200/90 shadow-md absolute right-20 bottom-6 -rotate-6 p-1.5">
                <img src={perplexityPng} alt="" className="h-full w-full object-contain" />
              </div>

              <div className="relative z-10 max-w-xl mx-auto space-y-2.5">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3.5 py-1 text-xs font-semibold text-neutral-700 shadow-2xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Get Discovered by{' '}
                    <strong className="font-bold text-neutral-950 transition-opacity duration-200">
                      {DISCOVERY_TARGETS[discoveryIdx]}
                    </strong>
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
                  Launch where founders &amp; AI look
                </h2>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                  Get indexed across AI search engines, earn permanent SEO authority, and reach active SaaS buyers.
                </p>
              </div>
            </div>

            {/* Bottom Weekly AI Crawl Analytics Strip */}
            <div className="border-t border-neutral-200/80 bg-white px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-neutral-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <strong className="font-bold text-neutral-950 font-mono-num">{weeklyCrawlLabel}</strong>
                  <span>AI crawls this week</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Verified by Cloudflare</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════
          1. LAUNCH PLANS (Starter Free vs $5 Verified Launch)
         ══════════════════════════════════════════════════════════ */}
      <div className="w-full rounded-3xl border border-neutral-200/80 bg-white p-6 sm:p-10 shadow-sm relative">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
            Get started for free
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-lg mx-auto">
            Submit your SaaS for free, or upgrade to our one-time Verified Launch for 24h approval, category top-3 placement, auto weekly relaunch, dofollow SEO backlink, and verified badge.
          </p>
        </div>

        {/* 2 Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {/* Card 1: Starter (Free) */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-neutral-950 tracking-tight">Starter</h3>
                <span className="shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  Free Forever
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 min-h-9">
                Your launch partner. Unlock community directory visibility with a simple free submission.
              </p>

              <div className="flex items-baseline gap-1.5 mt-4 mb-5">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                  $0
                </span>
                <span className="text-xs text-neutral-500 font-medium font-sans">/forever</span>
              </div>

              {/* $5 Weekly Relaunch Optional Toggle */}
              <div
                onClick={() => {
                  playSound('click', soundEnabled);
                  setFreeWeeklyRelaunch((prev) => !prev);
                }}
                className={`mb-5 p-3 rounded-xl border transition-all cursor-pointer select-none ${freeWeeklyRelaunch
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/30'
                    : 'border-neutral-200/90 bg-neutral-50/70 hover:border-neutral-300'
                  }`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">🚀</span>
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-bold text-neutral-950 flex items-center gap-1.5">
                        <span>Auto Weekly Relaunch</span>
                        <span className="text-[9.5px] font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">+$5/wk</span>
                      </p>
                      <p className="text-[10.5px] text-neutral-500 truncate">
                        Re-enters leaderboard every Sunday
                      </p>
                    </div>
                  </div>
                  <span
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${freeWeeklyRelaunch ? 'bg-blue-600' : 'bg-neutral-300'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${freeWeeklyRelaunch ? 'translate-x-4' : 'translate-x-0'
                        }`}
                    />
                  </span>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-700 font-medium mb-6">
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Public SaaS directory listing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Community upvote ranking &amp; discovery</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Dedicated product profile page</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Standard community review queue</span>
                </li>
                <li className="flex items-center gap-2.5 text-neutral-400">
                  <div className="h-4.5 w-4.5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0">
                    <X className="h-2.5 w-2.5 stroke-[2.5]" />
                  </div>
                  <span>nofollow link only</span>
                </li>
                <li className="flex items-center gap-2.5 text-neutral-400">
                  <div className="h-4.5 w-4.5 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center shrink-0">
                    <X className="h-2.5 w-2.5 stroke-[2.5]" />
                  </div>
                  <span>No verified badge</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              data-ml-goal="pricing_cta"
              data-ml-goal-plan="free"
              onClick={() => {
                playSound('click', soundEnabled);
                try {
                  if (freeWeeklyRelaunch) {
                    localStorage.setItem('topsaas_submit_auto_relaunch', 'true');
                  } else {
                    localStorage.removeItem('topsaas_submit_auto_relaunch');
                  }
                } catch { }
                onOpenSubmit(freeWeeklyRelaunch ? 'free_relaunch' : 'free');
              }}
              className="mt-auto w-full rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-900 py-3 px-4 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
            >
              <span>{freeWeeklyRelaunch ? 'Submit with Relaunch — $5' : 'Launch for Free'}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
            </button>
          </div>

          {/* Card 2: Verified Launch ($9 / Product · One-time) — Highlighted */}
          <div className="rounded-2xl border border-blue-600 bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-white p-5 sm:p-6 shadow-xl shadow-blue-500/10 ring-2 ring-blue-600 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-lg font-bold text-neutral-950 tracking-tight whitespace-nowrap">Verified Launch</h3>
                  <VerifiedBadge className="h-4 w-4 shrink-0" />
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200/80">
                  Most Popular
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed mt-1.5 min-h-9">
                Fast-track 24h approval, category top-3 spot (7 days), dofollow SEO backlink, and verified badge.
              </p>

              <div className="flex items-baseline gap-2 mt-4 mb-5">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                  $9
                </span>
                <span className="text-base font-bold text-neutral-400 line-through font-sans">
                  $15
                </span>
                <span className="text-xs text-neutral-500 font-medium font-sans">/one-time</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-700 font-medium mb-6">
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Live within 24 hours</strong> (skip 14-day queue)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Permanent High-Authority DoFollow</strong> backlink</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Official Verified Mint Badge</strong> on card &amp; profile</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Pinned Top 3</strong> in primary category (7 Days)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>1,000+ word story on /blog</strong> &amp; /llms.txt indexing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Lifetime listing — <strong>zero recurring fees</strong></span>
                </li>
              </ul>
            </div>

            <a
              href={appendTrackkitParams(WHOP_LINKS.oneTime)}
              target="_blank"
              rel="noopener"
              data-ml-goal="pricing_cta"
              data-ml-goal-plan="verified_launch"
              onClick={() => playSound('click', soundEnabled)}
              className="mt-auto btn-primary w-full py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-between"
            >
              <span>Get Verified Launch</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
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
                      Verified ($5)
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-950 tracking-tight">
            Pin Your Product Above Directory Cards
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 max-w-lg mx-auto">
            Take over the guaranteed #1 spot of the main product feed for maximum visibility, founder reach, and community upvotes.
          </p>
        </div>

        {/* Availability Bar (2 Featured Slots) */}
        {(() => {
          const totalFeaturedSlots = 2;
          const openFeaturedSlots = Math.max(0, totalFeaturedSlots - activeFeaturedCount);
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
                    openFeaturedSlots > 0
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                  }`}
                >
                  {openFeaturedSlots}/{totalFeaturedSlots} open
                </span>
              </div>
            </div>
          );
        })()}

        {/* 2 Featured Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch">
          {/* Card 1: 1-Week Featured ($15) */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-neutral-950 tracking-tight">1-Week Featured</h3>
                <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  40% OFF · 7 Days
                </span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 min-h-9">
                A high-impact 7-day boost to capture launch momentum and surge community upvotes.
              </p>

              <div className="flex items-baseline gap-2 mt-4 mb-5">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                  $15
                </span>
                <span className="text-base font-bold text-neutral-400 line-through font-sans">
                  $25
                </span>
                <span className="text-xs text-neutral-500 font-medium font-sans">/week</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-700 font-medium mb-6">
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Top pinned slot above all directory cards (2 slots)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>7 days continuous hero visibility</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>High-visibility prominent badge &amp; card highlight</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Direct outbound referral link to your website</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>Instant activation upon checkout</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              data-ml-goal="pricing_cta"
              data-ml-goal-plan="featured_1wk"
              onClick={() => handleOpenFeatured('1wk')}
              className="mt-auto w-full rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-900 py-3 px-4 text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
            >
              <span>Choose 1-Week Featured</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500" />
            </button>
          </div>

          {/* Card 2: 1-Month Featured ($39) — Highlighted */}
          <div className="rounded-2xl border border-blue-600 bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-white p-5 sm:p-6 shadow-xl shadow-blue-500/10 ring-2 ring-blue-600 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-neutral-950 tracking-tight">1-Month Featured</h3>
                <span className="shrink-0 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  40% OFF
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed mt-1.5 min-h-9">
                Continuous 30-day top pinned spotlight for sustained traffic and compound brand authority.
              </p>

              <div className="flex items-baseline gap-2 mt-4 mb-5">
                <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">
                  $39
                </span>
                <span className="text-base font-bold text-neutral-400 line-through font-sans">
                  $65
                </span>
                <span className="text-xs text-neutral-500 font-medium font-sans">/month · $9.75/wk</span>
              </div>

              <ul className="space-y-3 text-xs sm:text-[13px] text-neutral-700 font-medium mb-6">
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>30 Days Pinned Spot:</strong> 1 of 2 feed spotlight slots</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Category Spotlight:</strong> Top spot when filtering category</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Exclusive Featured Badge</strong> across the directory</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Priority Placement</strong> above all organic cards</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span><strong>Save $21</strong> compared to the weekly rate</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              data-ml-goal="pricing_cta"
              data-ml-goal-plan="featured_1mo"
              onClick={() => handleOpenFeatured('1mo')}
              className="mt-auto btn-primary w-full py-3 px-4 text-xs font-bold rounded-xl flex items-center justify-between"
            >
              <span>Choose 1-Month Featured</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. STANDALONE SIDEBAR SPONSORSHIP (2 Cards: $10/wk & $29/mo)
         ══════════════════════════════════════════════════════════ */}
      <SponsorShowcaseSection
        onOpenSponsor={onOpenSponsor}
        soundEnabled={soundEnabled}
        activeSponsorCount={activeSponsorCount}
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
