import React, { useState } from 'react';
import { Check, X, Zap, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { BorderBeam } from './BorderBeam';
import { playSound } from '../utils/sound';

interface PricingPageProps {
  onOpenSubmit: (plan?: 'free' | 'lifetime' | 'monthly_pro') => void;
  onGoHome: () => void;
  soundEnabled: boolean;
}

const faqs = [
  {
    q: 'What does "skip the queue" mean?',
    a: 'Free submissions enter a manual review queue that typically takes 7–14 days. Paid submissions are reviewed and go live within 24 hours. That\'s the only difference in timing.',
  },
  {
    q: 'What is a DoFollow backlink?',
    a: 'Free listings get a nofollow link — search engines ignore it. Paid plans get a dofollow link, meaning Google\'s crawlers follow it and pass domain authority to your site. This helps your own pages rank better over time.',
  },
  {
    q: 'How does the llms.txt / AI ingestion work?',
    a: 'Paid listings are included in our /llms.txt file with structured metadata. When AI tools like Perplexity or ChatGPT crawl TopSAAS to answer queries about software, they read that file. Free listings may be scraped eventually, but are not guaranteed inclusion.',
  },
  {
    q: 'What is the verified badge?',
    a: 'Paid listings earn a mint rosette badge shown on the TopSAAS directory card and product page. You can also embed a dynamic version of it on your own website. The badge links back to your verified TopSAAS listing.',
  },
  {
    q: 'What happens if I cancel Pro after 3 months?',
    a: 'If you\'ve been on Pro Growth for at least 3 full months and cancel, your listing is automatically converted to a permanent Lifetime Pro listing. You keep the badge, dofollow backlink, and llms.txt inclusion indefinitely at no further cost.',
  },
  {
    q: 'Can I upgrade from Lifetime to Pro later?',
    a: 'Yes. You can switch to Pro Growth at any time from your founder profile. The $49/mo Pro plan difference will apply from the date you upgrade — no re-submission needed.',
  },
];

const comparisonRows: Array<{
  feature: string;
  free: boolean | string;
  lifetime: boolean | string;
  pro: boolean | string;
}> = [
  { feature: 'Public directory listing',        free: true,              lifetime: true,                         pro: true },
  { feature: 'Review / approval queue',         free: '7–14 days',      lifetime: 'Under 24 hours',             pro: 'Under 24 hours' },
  { feature: 'SEO backlink type',               free: 'nofollow',       lifetime: 'dofollow',                   pro: 'dofollow' },
  { feature: 'Verified badge (directory card)', free: false,            lifetime: true,                         pro: true },
  { feature: 'Embeddable badge (your site)',    free: false,            lifetime: true,                         pro: true },
  { feature: 'Included in /llms.txt',           free: false,            lifetime: true,                         pro: true },
  { feature: 'Newsletter launch blast (1×)',    free: false,            lifetime: true,                         pro: true },
  { feature: 'Category pinned placement',       free: false,            lifetime: false,                        pro: true },
  { feature: 'Monthly newsletter rotation',     free: false,            lifetime: false,                        pro: true },
  { feature: '"X vs Y" comparison pages',       free: false,            lifetime: false,                        pro: true },
  { feature: 'Editorial blog review',           free: false,            lifetime: false,                        pro: true },
  { feature: 'Downgrade protection',            free: false,            lifetime: false,                        pro: '3-month lock-in' },
];

export const PricingPage: React.FC<PricingPageProps> = ({
  onOpenSubmit,
  onGoHome,
  soundEnabled,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    playSound('click', soundEnabled);
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-12 space-y-10 sm:space-y-12 flex-1">
      {/* ── Back nav ── */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { playSound('click', soundEnabled); onGoHome(); }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-[#2a2a2a] px-3 py-1.5 text-xs font-bold text-neutral-300 hover:border-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Directory
          </button>
        </div>

        {/* ── Page header ── */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Listing Plans
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl">
            Submit your SaaS for free, or pay to skip the queue, get a verified badge, and a permanent dofollow backlink.
          </p>
        </div>

        {/* ── Pricing cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$0</span>
                <span className="text-xs text-neutral-500 font-medium">forever</span>
              </div>
              <p className="text-xs text-neutral-400 pt-1">Standard queue submission. Good for testing if your product resonates.</p>
            </div>

            <ul className="space-y-2.5 text-xs text-neutral-400 flex-1">
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
                Click analytics
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
              onClick={() => { playSound('click', soundEnabled); onOpenSubmit('free'); }}
              className="w-full rounded-xl border border-neutral-700 bg-[#333333] py-2.5 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-all cursor-pointer"
            >
              Submit for Free
            </button>
          </div>

          {/* Lifetime */}
          <div className="flex flex-col rounded-2xl border border-neutral-700 bg-[#2a2a2a] p-6 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Lifetime</p>
                <Award className="h-3 w-3 text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white">$99</span>
                <span className="text-xs text-neutral-500 font-medium">one-time</span>
              </div>
              <p className="text-xs text-neutral-400 pt-1">Pay once, keep all benefits permanently. Best for bootstrappers who want lasting SEO value.</p>
            </div>

            <ul className="space-y-2.5 text-xs text-neutral-300 flex-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                Live within 24 hours
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                Permanent dofollow backlink
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-mint-400 shrink-0 mt-0.5" />
                <span className="flex items-center gap-1">
                  Verified badge <VerifiedBadge className="h-3.5 w-3.5" />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                Included in /llms.txt
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                1× newsletter launch blast
              </li>
              <li className="flex items-center gap-2 text-neutral-600">
                <X className="h-3.5 w-3.5 shrink-0" />
                No pinned placement
              </li>
              <li className="flex items-center gap-2 text-neutral-600">
                <X className="h-3.5 w-3.5 shrink-0" />
                No monthly rotation
              </li>
            </ul>

            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); onOpenSubmit('lifetime'); }}
              className="w-full rounded-xl border border-neutral-600 bg-[#333333] py-2.5 text-xs font-bold text-white hover:border-neutral-400 transition-all cursor-pointer"
            >
              Get Lifetime — $99
            </button>
          </div>

          {/* Pro Growth — highlighted with BorderBeam wrapper (SponsorTile pattern) */}
          <BorderBeam size="md" colorVariant="colorful" strength={0.85} className="rounded-2xl flex flex-col">
            <div className="flex flex-col rounded-2xl bg-[#1e2720] p-6 space-y-6 h-full">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-mint-400">Pro Growth</p>
                    <Zap className="h-3 w-3 text-mint-400" />
                  </div>
                  <span className="rounded-md bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.5 text-[10px] font-bold text-mint-300 uppercase tracking-wide">
                    Recommended
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">$49</span>
                  <span className="text-xs text-neutral-400 font-medium">/mo per product</span>
                </div>
                <p className="text-xs text-neutral-400 pt-1">Active distribution channel. Keeps your product visible month after month without extra effort.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-200 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                  Everything in Lifetime
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                  Pinned Top 3 in your category
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                  Monthly newsletter re-blast
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                  &quot;vs Competitor&quot; comparison pages
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                  Dedicated editorial review post
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                  3-month downgrade protection
                </li>
              </ul>

              <button
                type="button"
                onClick={() => { playSound('click', soundEnabled); onOpenSubmit('monthly_pro'); }}
                className="w-full rounded-xl bg-mint-500 py-2.5 text-xs font-black text-[#0b0f14] hover:bg-mint-400 transition-all cursor-pointer shadow-md shadow-mint-500/20"
              >
                Start Pro — $49/mo
              </button>
            </div>
          </BorderBeam>
        </div>

        {/* ── What you actually get ── */}
        <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] divide-y divide-neutral-800 overflow-hidden">
          <div className="px-5 py-4">
            <h2 className="text-sm font-bold text-white">What each plan includes</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Every row is a specific feature, not a marketing category.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-neutral-800 bg-[#252525] text-neutral-400">
                  <th className="p-4 text-left font-semibold w-1/2">Feature</th>
                  <th className="p-4 text-center font-semibold">Free</th>
                  <th className="p-4 text-center font-semibold text-neutral-300">Lifetime</th>
                  <th className="p-4 text-center font-semibold text-mint-400 bg-mint-500/5 border-x border-mint-500/15">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="p-4 font-medium text-neutral-300">{row.feature}</td>
                    <td className="p-4 text-center text-neutral-500">
                      {typeof row.free === 'boolean'
                        ? row.free
                          ? <Check className="h-3.5 w-3.5 text-neutral-400 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-neutral-700 mx-auto" />
                        : row.free}
                    </td>
                    <td className="p-4 text-center text-neutral-300">
                      {typeof row.lifetime === 'boolean'
                        ? row.lifetime
                          ? <Check className="h-3.5 w-3.5 text-mint-400 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-neutral-700 mx-auto" />
                        : row.lifetime}
                    </td>
                    <td className="p-4 text-center text-mint-300 font-medium bg-mint-500/5 border-x border-mint-500/15">
                      {typeof row.pro === 'boolean'
                        ? row.pro
                          ? <Check className="h-3.5 w-3.5 text-mint-400 mx-auto" />
                          : <X className="h-3.5 w-3.5 text-neutral-700 mx-auto" />
                        : row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── What the verified badge means ── */}
        <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-500/10 border border-mint-500/30">
              <ShieldCheck className="h-4.5 w-4.5 text-mint-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">About the verified badge</h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">Paid listings only</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-400">
            <div className="space-y-1">
              <p className="font-semibold text-neutral-200">On the directory</p>
              <p>A mint rosette appears next to your listing card, distinguishing it from unverified submissions.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-neutral-200">On your website</p>
              <p>Embed a dynamic SVG badge that links back to your live TopSAAS listing. Works on any site or landing page.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-neutral-200">What it means</p>
              <p>It means your listing has been manually reviewed, your URL is live, and you have an active paid plan.</p>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white">Common questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-neutral-800 bg-[#2a2a2a] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-xs font-semibold text-neutral-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    {isOpen
                      ? <ChevronUp className="h-3.5 w-3.5 text-mint-400 shrink-0" />
                      : <ChevronDown className="h-3.5 w-3.5 text-neutral-600 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-neutral-400 border-t border-neutral-800 pt-3 leading-relaxed">
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
