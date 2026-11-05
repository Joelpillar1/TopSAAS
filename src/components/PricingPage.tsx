import React, { useState } from 'react';
import { Check, X, Zap, ArrowLeft, ShieldCheck, ChevronDown, ChevronUp, Award, Star } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { BorderBeam } from './BorderBeam';
import { SponsorShowcaseSection } from './SponsorShowcaseSection';
import { playSound } from '../utils/sound';

interface PricingPageProps {
  onOpenSubmit: (plan?: 'free' | 'free_relaunch' | 'lifetime' | 'monthly_pro') => void;
  onOpenSponsor?: (tier?: '1mo' | '3mo' | '1yr') => void;
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
  { feature: 'Weekly Relaunch (active rounds)', free: '+$5 toggle',     lifetime: 'Included (Every Week)',      pro: 'Included (Every Week)' },
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
  onOpenSponsor,
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
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-12 space-y-10 sm:space-y-12 flex-1">
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
            Listing Plans
          </h1>
          <p className="text-sm text-neutral-500 max-w-xl">
            Submit your SaaS for free, or pay to skip the queue, get a verified badge, and a permanent dofollow backlink.
          </p>
        </div>

        {/* ── Pricing cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Free */}
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-neutral-500">Free</p>
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
                  : 'Standard queue submission. Good for testing if your product resonates.'}
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
                Click analytics
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
                    <span className="text-neutral-500">No weekly relaunch (1 launch round)</span>
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

          {/* Lifetime */}
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-bold text-emerald-600">Lifetime</p>
                <Award className="h-3 w-3 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-neutral-950">$99</span>
                <span className="text-xs text-neutral-500 font-medium">one-time</span>
              </div>
              <p className="text-xs text-neutral-500 pt-1">Pay once, keep all benefits permanently. Best for bootstrappers who want lasting SEO value.</p>
            </div>

            <ul className="space-y-2.5 text-xs text-neutral-700 flex-1">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                Everything in Free
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                <span className="font-semibold text-neutral-900">Auto Weekly Relaunch included</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                Live within 24 hours
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                Permanent dofollow backlink
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0 mt-0.5" />
                <span className="flex items-center gap-1">
                  Verified badge <VerifiedBadge className="h-3.5 w-3.5" />
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                Included in /llms.txt
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
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

            <a
              href="https://whop.com/topsaas/one-time-fe/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="w-full text-center rounded-xl border border-neutral-300 bg-neutral-100 py-2.5 text-xs font-bold text-neutral-900 hover:border-neutral-400 hover:bg-neutral-200 transition-all cursor-pointer block"
            >
              Get One-Time Feature Pass
            </a>
          </div>

          {/* Pro Growth — highlighted with BorderBeam wrapper (SponsorTile pattern) */}
          <BorderBeam size="md" colorVariant="colorful" strength={0.85} className="rounded-2xl flex flex-col">
            <div className="flex flex-col rounded-2xl border border-neutral-200 bg-neutral-100 p-6 space-y-6 h-full">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-bold text-mint-700">Pro Growth</p>
                    <Zap className="h-3 w-3 text-mint-600" />
                  </div>
                  <span className="rounded-md bg-white border border-mint-500/40 px-1.5 py-0.5 text-[10px] font-bold text-mint-700">
                    Recommended
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-neutral-950">$49</span>
                  <span className="text-xs text-neutral-500 font-medium">/mo per product</span>
                </div>
                <p className="text-xs text-neutral-600 pt-1">Active distribution channel. Keeps your product visible month after month without extra effort.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-neutral-700 flex-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Everything in Lifetime
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  <span className="font-semibold text-neutral-900">Auto Weekly Relaunch included</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Pinned Top 3 in your category
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Monthly newsletter re-blast
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  &quot;vs Competitor&quot; comparison pages
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  Dedicated editorial review post
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-mint-600 shrink-0" />
                  3-month downgrade protection
                </li>
              </ul>

              <a
                href="https://whop.com/topsaas/per-product-pass/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('click', soundEnabled)}
                className="w-full text-center rounded-xl bg-mint-500 py-2.5 text-xs font-black text-white hover:bg-mint-400 transition-all cursor-pointer shadow-md shadow-mint-500/20 block"
              >
                Get $49/mo Per-Product Pass
              </a>
            </div>
          </BorderBeam>
        </div>

        {/* ── What each plan includes (collapsible dropdown) ── */}
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
                <h2 className="text-sm font-bold text-neutral-950">What each plan includes</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                  Feature Comparison
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {isIncludesOpen
                  ? 'Every row is a specific feature, not a marketing category.'
                  : 'Click to expand detailed side-by-side feature comparison table.'}
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
                    <th className="p-4 text-center font-semibold text-neutral-700">Lifetime</th>
                    <th className="p-4 text-center font-semibold text-mint-600 bg-mint-500/5 border-x border-mint-500/15">Pro</th>
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
                      <td className="p-4 text-center text-neutral-700">
                        {typeof row.lifetime === 'boolean'
                          ? row.lifetime
                            ? <Check className="h-3.5 w-3.5 text-mint-600 mx-auto" />
                            : <X className="h-3.5 w-3.5 text-neutral-700 mx-auto" />
                          : row.lifetime === 'Included (Every Week)'
                            ? <span className="inline-flex items-center gap-1 font-bold text-xs text-neutral-900"><Check className="h-3.5 w-3.5 text-mint-600 shrink-0" /> Every Week</span>
                            : row.lifetime}
                      </td>
                      <td className="p-4 text-center text-mint-600 font-medium bg-mint-500/5 border-x border-mint-500/15">
                        {typeof row.pro === 'boolean'
                          ? row.pro
                            ? <Check className="h-3.5 w-3.5 text-mint-600 mx-auto" />
                            : <X className="h-3.5 w-3.5 text-neutral-700 mx-auto" />
                          : row.pro === 'Included (Every Week)'
                            ? <span className="inline-flex items-center gap-1 font-bold text-xs text-mint-700"><Check className="h-3.5 w-3.5 text-mint-600 shrink-0" /> Every Week</span>
                            : row.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Homepage & Directory Sponsorship (Showcase Layout) ── */}
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
              <h2 className="text-sm font-bold text-neutral-950">About the verified badge</h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">Paid listings only</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-600">
            <div className="space-y-1">
              <p className="font-semibold text-neutral-900">On the directory</p>
              <p>A mint rosette appears next to your listing card, distinguishing it from unverified submissions.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-neutral-900">On your website</p>
              <p>Embed a dynamic SVG badge that links back to your live TopSAAS listing. Works on any site or landing page.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-neutral-900">What it means</p>
              <p>It means your listing has been manually reviewed, your URL is live, and you have an active paid plan.</p>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-950">Common questions</h2>
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
