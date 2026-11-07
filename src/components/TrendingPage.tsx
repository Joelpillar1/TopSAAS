import React, { useEffect, useMemo, useState } from 'react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { REPO_HEALTH, REPO_HEALTH_GENERATED_AT, RepoHealthSignals } from '../data/repoHealth';
import { computeHealth, HealthResult } from '../utils/repoHealth';
import { HealthScore } from './HealthScore';
import { formatStars } from '../utils/github';
import { plainCopy } from '../utils/plainCopy';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import { GridPattern } from '@/components/ui/grid-pattern';
import { cn } from '@/lib/utils';

const DAY = 86_400_000;
const TREND_WINDOW_DAYS = 90;
const MAX_ROWS = 60;
const LAST_UPDATED = 'November 7, 2026';

interface TrendRow {
  repo: CuratedRepo;
  signals: RepoHealthSignals;
  health: HealthResult;
  trend: number;
  daysAgoPush: number;
  daysAgoCreated: number;
}

const relativeDays = (days: number): string => {
  if (days < 1) return 'today';
  if (days < 7) return `${Math.round(days)}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;
  if (days < 365) return `${Math.round(days / 30)}mo ago`;
  return `${Math.round(days / 365)}y ago`;
};

const RECENCY_WEIGHTS = [
  { window: '7 days or less', weight: '1.00' },
  { window: '8 to 14 days', weight: '0.85' },
  { window: '15 to 30 days', weight: '0.70' },
  { window: '31 to 60 days', weight: '0.55' },
  { window: '61 to 90 days', weight: '0.40' },
];

const VIEW_COMPARISON = [
  {
    view: 'Trending',
    scope: 'Projects that pushed code in the last 90 days',
    order: 'Trend score, highest first',
  },
  {
    view: 'Newest',
    scope: 'Every curated project in the catalog',
    order: 'Creation date, newest first',
  },
  {
    view: 'All-time popularity',
    scope: 'Every curated project in the catalog',
    order: 'Total GitHub stars, highest first',
  },
];

const EVALUATION_STEPS = [
  {
    title: 'Check the last push date',
    body: 'A project that shipped this week is more useful than one that last changed eight months ago. The trending view only includes projects with a push inside the 90-day window.',
  },
  {
    title: 'Compare stars with repository age',
    body: 'A 30,000-star project that is eight years old grows slowly in percentage terms. A 3,000-star project that is one year old is moving faster. Star velocity normalizes the two.',
  },
  {
    title: 'Read the health score',
    body: 'The 0-100 health score blends activity, popularity, engagement, issue load, and open-source hygiene. A high trend score with a low health score is a warning sign.',
  },
  {
    title: 'Open the repo detail page',
    body: 'Each project page carries the license, primary language, release information, self-hosting verdict, and similar projects, so you can judge fit before cloning.',
  },
  {
    title: 'Look for a build guide',
    body: 'Some projects have a step-by-step TopSAAS build guide that turns the repository into a working product. Start there if you want a faster path to something real.',
  },
];

const FAQS = [
  {
    q: 'What does trending mean on TopSAAS?',
    a: 'Trending means an open-source project pushed code in the last 90 days and ranks highly on star velocity weighted by how recently it was updated. It is a measure of current momentum, not lifetime popularity.',
  },
  {
    q: 'How is the trending score calculated?',
    a: 'The score is log10((stars divided by repository age in years) + 1) multiplied by a recency weight. Repository age is floored at 0.25 years so very new projects do not divide by zero or dominate unfairly.',
  },
  {
    q: 'Why is there a 90-day cutoff?',
    a: 'The cutoff keeps the page focused on projects that are actively maintained. A project with no pushes in 90 days may still be useful, but it is not trending right now.',
  },
  {
    q: 'What is star velocity?',
    a: 'Star velocity is total stars divided by repository age in years. It estimates how quickly a project attracts attention per year of existence, which makes projects of different ages comparable.',
  },
  {
    q: 'Why weight the score by recency?',
    a: 'A project that pushed yesterday is more likely to be actively developed than one that pushed 80 days ago. The recency weight reduces the score as the last push gets older, without removing the project from the 90-day window.',
  },
  {
    q: 'What is the difference between trending, newest, and all-time popularity?',
    a: 'Trending ranks recently active projects by momentum. Newest lists every curated project by creation date. All-time popularity ranks by total GitHub stars. Each view answers a different question.',
  },
  {
    q: 'How is the health score different from the trend score?',
    a: 'The trend score measures momentum. The health score measures project condition on a 0-100 scale using activity, popularity, engagement, issue load, and open-source hygiene. They can disagree, and that is useful signal.',
  },
  {
    q: 'How often is the data refreshed?',
    a: 'GitHub signals are refreshed on a regular schedule and the exact date is printed on this page and on every project page. Star and fork counts are a snapshot, not a live feed.',
  },
  {
    q: 'Why is a famous project missing from the trending list?',
    a: 'It may not have pushed code inside the 90-day window, or it may be outside the selected category. Switch to Newest or browse the full catalog to see every curated project.',
  },
  {
    q: 'Does star count alone decide the ranking?',
    a: 'No. Stars feed star velocity, but repository age and recency of the last push also change the score. A smaller, newer, actively maintained project can outrank a larger dormant one.',
  },
  {
    q: 'Can I submit my open-source project?',
    a: 'Yes. TopSAAS accepts open-source and SaaS submissions. Use the submit page to add your project for editorial review and potential inclusion in the catalog and trending views.',
  },
  {
    q: 'How should I use this list?',
    a: 'Use it to find actively maintained projects worth evaluating, then open the repo detail page for license, stack, health, and alternatives. Trending is a discovery signal, not a guarantee of quality or security.',
  },
];

const RELATED_PAGES = [
  {
    title: 'SaaS ideas',
    body: 'Browse the full open-source starter catalog with categories, search, and repo health scores.',
    route: '/ideas',
  },
  {
    title: 'Build guides',
    body: 'Step-by-step walkthroughs that ship a real product on one curated repository.',
    route: '/guides',
  },
  {
    title: 'SaaS directory',
    body: 'See the product leaderboard ranked by community upvotes and comments.',
    route: '/',
  },
  {
    title: 'MRR calculator',
    body: 'Calculate monthly recurring revenue and ARR for the product you are building.',
    route: '/mrr-calculator',
  },
  {
    title: 'Pricing',
    body: 'Compare launch and featured placement options for your product.',
    route: '/pricing',
  },
  {
    title: 'Submit your project',
    body: 'Add your SaaS or open-source project for editorial review and discovery.',
    route: '/submit',
  },
];

const SOURCES = [
  {
    label: 'GitHub REST API documentation',
    href: 'https://docs.github.com/en/rest',
  },
  {
    label: 'Open Source Guides: starting an open source project',
    href: 'https://opensource.guide/starting-a-project/',
  },
  {
    label: 'GitHub Octoverse: open-source activity research',
    href: 'https://octoverse.github.com/',
  },
];

const DirectAnswer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-r-xl border-l-2 border-mint-500 bg-neutral-50 px-4 py-3 text-sm font-medium leading-relaxed text-neutral-700">
    {children}
  </p>
);

interface TrendingPageProps {
  soundEnabled: boolean;
  onOpenRepo: (repo: CuratedRepo) => void;
}

export const TrendingPage: React.FC<TrendingPageProps> = ({ soundEnabled, onOpenRepo }) => {
  const [mode, setMode] = useState<'trending' | 'newest'>('trending');
  const [category, setCategory] = useState<RepoCategory | 'All'>('All');

  // One joined pass: curated repo + generated GitHub signals + computed score.
  const rows = useMemo<TrendRow[]>(() => {
    const now = Date.now();
    const joined: TrendRow[] = [];
    for (const repo of CURATED_REPOS) {
      const signals = REPO_HEALTH[repo.full_name];
      if (!signals) continue;
      const ageDays = Math.max(1, (now - Date.parse(signals.createdAt)) / DAY);
      const daysAgoPush = (now - Date.parse(signals.pushedAt)) / DAY;
      const daysAgoCreated = (now - Date.parse(signals.createdAt)) / DAY;
      // Star velocity: lifetime stars scaled to a per-year rate, so a 5-year-old
      // giant does not outrank a project that caught fire last month.
      const velocity = signals.stars / Math.max(ageDays / 365, 0.25);
      const recencyWeight =
        daysAgoPush <= 7 ? 1 : daysAgoPush <= 14 ? 0.85 : daysAgoPush <= 30 ? 0.7 : daysAgoPush <= 60 ? 0.55 : 0.4;
      joined.push({
        repo,
        signals,
        health: computeHealth(signals, now),
        trend: Math.log10(velocity + 1) * recencyWeight,
        daysAgoPush,
        daysAgoCreated,
      });
    }
    return joined;
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of CURATED_REPOS) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const trendingRows = useMemo(
    () => rows.filter((r) => r.daysAgoPush <= TREND_WINDOW_DAYS).sort((a, b) => b.trend - a.trend),
    [rows]
  );

  const filteredRows = useMemo(
    () => (category === 'All' ? rows : rows.filter((r) => r.repo.category === category)),
    [rows, category]
  );

  const visible = useMemo(() => {
    const sorted =
      mode === 'trending'
        ? filteredRows.filter((r) => r.daysAgoPush <= TREND_WINDOW_DAYS).sort((a, b) => b.trend - a.trend)
        : [...filteredRows].sort((a, b) => a.daysAgoCreated - b.daysAgoCreated);
    return sorted.slice(0, MAX_ROWS);
  }, [filteredRows, mode]);

  const availableCount =
    mode === 'trending'
      ? filteredRows.filter((r) => r.daysAgoPush <= TREND_WINDOW_DAYS).length
      : filteredRows.length;

  const defaultTop = useMemo(() => trendingRows.slice(0, 10), [trendingRows]);

  // Per-route head swap so /trending is indexable with its own title/OG/JSON-LD.
  useEffect(() => {
    return applyPageSeo({
      title: 'Trending Open Source Projects: Fastest-Growing Repos | TopSAAS',
      description:
        'See which open-source projects are trending now. Ranked by star velocity and recent GitHub activity across 23 categories, with health scores and repo details.',
      canonical: '/trending',
      jsonLdId: 'trending-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': 'https://www.topsaas.space/trending#webpage',
            url: 'https://www.topsaas.space/trending',
            name: 'Trending Open Source Projects',
            description:
              'Open-source projects ranked by star velocity and recent GitHub activity, with health scores and repo details.',
            inLanguage: 'en',
            dateModified: '2026-11-07',
            isPartOf: {
              '@type': 'WebSite',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space/',
            },
            about: {
              '@type': 'Thing',
              name: 'Open-source software trends',
            },
            publisher: {
              '@type': 'Organization',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space/',
            },
          },
          {
            '@type': 'ItemList',
            name: 'Trending open-source projects on TopSAAS',
            numberOfItems: defaultTop.length,
            itemListElement: defaultTop.map((r, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: r.repo.full_name,
              url: `https://www.topsaas.space/repo/${r.repo.full_name}`,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.topsaas.space/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Trending Open Source Projects',
                item: 'https://www.topsaas.space/trending',
              },
            ],
          },
        ],
      },
    });
  }, [defaultTop]);

  const signalDate = REPO_HEALTH_GENERATED_AT ? REPO_HEALTH_GENERATED_AT.slice(0, 10) : 'recently';

  return (
    <div className="mx-auto w-full max-w-6xl px-3.5 pb-16 pt-5 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-neutral-500">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
          }}
          className="transition-colors hover:text-neutral-950"
        >
          Home
        </a>
        <span className="px-1.5 text-neutral-300">/</span>
        <span aria-current="page" className="text-neutral-700">
          Trending
        </span>
      </nav>

      {/* Hero */}
      <section className="relative mt-4 overflow-hidden px-1 pt-4 sm:pt-8" aria-labelledby="trending-heading">
        <GridPattern
          width={32}
          height={32}
          x={-1}
          y={-1}
          strokeDasharray="3 3"
          squares={[
            [4, 4],
            [5, 1],
            [8, 2],
            [5, 3],
            [5, 5],
            [10, 10],
            [12, 15],
          ]}
          className={cn(
            '[mask-image:radial-gradient(560px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12',
            'fill-neutral-300/30 stroke-neutral-300/40'
          )}
        />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1
            id="trending-heading"
            className="text-3xl font-black leading-[1.1] tracking-tight text-neutral-950 sm:text-4xl"
          >
            Trending Open Source Projects
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">
            See which repositories are gaining momentum right now. Ranked by star velocity weighted
            with how recently each project pushed code, refreshed from GitHub signals.
          </p>

          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-mint-500/30 bg-mint-500/[0.06] px-5 py-4 text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-mint-700">
              Quick answer
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-neutral-700">
              Trending ranks open-source projects that pushed code in the last 90 days by{' '}
              <strong className="font-black text-neutral-950">
                star velocity weighted by recency
              </strong>
              . A newer, actively maintained project can outrank a larger dormant one.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-neutral-500">
            <span>Last updated: {LAST_UPDATED}</span>
            <span className="text-neutral-300">·</span>
            <span>{rows.length.toLocaleString()} projects tracked</span>
            <span className="text-neutral-300">·</span>
            <span>Signals refreshed {signalDate}</span>
          </div>
        </div>
      </section>

      {/* Controls */}
      <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-3">
        <div className="inline-flex w-fit rounded-lg border border-neutral-200 bg-white p-1">
          {(
            [
              ['trending', 'Trending'],
              ['newest', 'Newest'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => {
                playSound('click', soundEnabled);
                setMode(key);
              }}
              className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                mode === key ? 'bg-neutral-950 text-white' : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-1.5"
          role="navigation"
          aria-label="Filter trending by category"
        >
          {(['All', ...categories.map(([c]) => c)] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={category === cat}
              onClick={() => {
                playSound('click', soundEnabled);
                setCategory(cat);
              }}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                category === cat
                  ? 'border-mint-500/60 bg-mint-500/15 text-mint-600'
                  : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="text-[11px] font-semibold text-neutral-400">
          Showing {visible.length} of {availableCount} {mode === 'trending' ? 'recently active' : 'curated'}{' '}
          projects
        </p>
      </div>

      {/* Ranked list */}
      <div className="mx-auto mt-4 max-w-5xl overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-neutral-500">
            No {mode === 'trending' ? 'recently active' : 'new'} projects in this category yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200/70">
            {visible.map((row, i) => (
              <li key={row.repo.full_name}>
                <a
                  href={`/repo/${row.repo.full_name}`}
                  onClick={(e) => {
                    e.preventDefault();
                    playSound('click', soundEnabled);
                    onOpenRepo(row.repo);
                  }}
                  className="group flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-neutral-50 sm:gap-4"
                >
                  <span className="w-7 shrink-0 text-center font-mono-num text-sm font-black text-neutral-600 group-hover:text-neutral-400">
                    {i + 1}
                  </span>
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                    <img
                      src={row.repo.owner.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-neutral-950 transition-colors group-hover:text-mint-600">
                        {row.repo.name}
                      </span>
                      <span className="hidden truncate text-[11px] text-neutral-500 sm:inline">
                        {row.repo.owner.login}
                      </span>
                      <HealthScore score={row.health.score} band={row.health.band} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-neutral-500">
                      {plainCopy(row.repo.description)}
                    </span>
                  </span>
                  <span className="hidden shrink-0 items-center gap-3 text-[11px] font-semibold text-neutral-400 md:flex">
                    <span className="font-mono-num text-neutral-500">
                      {formatStars(row.signals.stars)} stars
                    </span>
                    <span className="font-mono-num">{formatStars(row.signals.forks)} forks</span>
                  </span>
                  <span className="hidden w-24 shrink-0 text-right text-[11px] font-semibold lg:block">
                    <span className={row.daysAgoPush <= 14 ? 'text-mint-600' : 'text-neutral-500'}>
                      {mode === 'trending' ? relativeDays(row.daysAgoPush) : relativeDays(row.daysAgoCreated)}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mx-auto mt-3 max-w-5xl text-[11px] leading-relaxed text-neutral-500">
        Trending only includes projects with a push inside the last {TREND_WINDOW_DAYS} days. Switch
        to Newest to see every curated project, or pick a category to narrow the list.
      </p>

      {/* Article */}
      <div className="mx-auto mt-12 max-w-3xl space-y-10">
        <section aria-labelledby="what-is-trending-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="what-is-trending-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            What counts as trending here
          </h2>
          <DirectAnswer>
            A project is trending when it pushed code in the last {TREND_WINDOW_DAYS} days and earns a
            high star velocity score adjusted for recency. Trending measures current momentum, not
            lifetime popularity.
          </DirectAnswer>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            GitHub stars are cumulative, so the largest repositories tend to sit at the top of any
            all-time list forever. That is useful for finding established tools, but it hides newer
            projects that are shipping quickly. The trending view fixes that by measuring stars per
            year of repository age, then discounting projects whose last push is getting old.
          </p>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            The result is a list that changes as maintainers ship. A project can enter the list after a
            strong month, and leave it when development slows or the 90-day window closes.
          </p>
        </section>

        <section aria-labelledby="trend-score-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="trend-score-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            How the trending score works
          </h2>
          <DirectAnswer>
            Trend score = log10((stars divided by repository age in years) + 1) multiplied by a
            recency weight. Repository age is floored at 0.25 years, and the recency weight falls as
            the last push gets older.
          </DirectAnswer>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-center">
            <p className="font-mono text-sm font-bold leading-relaxed text-neutral-950 sm:text-base">
              trend = log10((stars / max(age in years, 0.25)) + 1) x recency weight
            </p>
          </div>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            The logarithm dampens raw star counts, so a project with 200,000 stars does not automatically
            beat a fast-growing project with 20,000. The recency weight then rewards projects that
            pushed code recently.
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Last push
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Recency weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {RECENCY_WEIGHTS.map((row) => (
                  <tr key={row.window}>
                    <td className="px-4 py-2.5 font-semibold">{row.window}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-neutral-950">{row.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            The health score is separate. It uses activity, popularity, engagement, issue load, and
            open-source hygiene to produce a 0-100 grade. A project can trend strongly while carrying a
            weak health score, which usually means attention is outpacing maintenance.
          </p>
        </section>

        <section aria-labelledby="view-comparison-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="view-comparison-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Trending vs newest vs all-time popularity
          </h2>
          <DirectAnswer>
            Trending ranks recent momentum. Newest lists projects by creation date. All-time popularity
            ranks by total GitHub stars. Use each view for a different question.
          </DirectAnswer>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    View
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Scope
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {VIEW_COMPARISON.map((row) => (
                  <tr key={row.view}>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-neutral-950">{row.view}</td>
                    <td className="px-4 py-3 font-medium">{row.scope}</td>
                    <td className="px-4 py-3 font-medium">{row.order}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            If you want a project that is safe to adopt, start with all-time popularity and check
            maintenance. If you want to catch a project early, start with trending and read the health
            score before you commit.
          </p>
        </section>

        <section aria-labelledby="evaluate-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="evaluate-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            How to evaluate a trending project
          </h2>
          <DirectAnswer>
            Check the last push date, compare stars with repository age, read the health score, open
            the repo detail page, and look for a build guide before you clone.
          </DirectAnswer>
          <ol className="space-y-4">
            {EVALUATION_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-xs font-black text-neutral-700">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950">{step.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="categories-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="categories-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Categories covered
          </h2>
          <DirectAnswer>
            The catalog spans {categories.length} categories, from SaaS starters and auth to AI, DevOps,
            payments, analytics, and design. Use the category filters above to narrow the trending list.
          </DirectAnswer>
          <div className="flex flex-wrap gap-2">
            {categories.map(([name, count]) => (
              <span
                key={name}
                className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-600"
              >
                {name} <span className="font-mono-num text-neutral-400">{count}</span>
              </span>
            ))}
          </div>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            The same categories power the{' '}
            <a
              href="/ideas"
              onClick={(e) => {
                e.preventDefault();
                navigateTo('/ideas');
              }}
              className="font-bold text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 hover:decoration-neutral-950"
            >
              full SaaS ideas catalog
            </a>
            , where you can search every curated repository and compare health scores side by side.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="trending-faq-heading" className="mx-auto w-full max-w-2xl scroll-mt-24 pt-2">
          <h2
            id="trending-faq-heading"
            className="text-center text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Trending Projects FAQ
          </h2>

          <div className="mt-8 space-y-8">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <h3 className="text-base font-bold text-neutral-950 sm:text-lg">{faq.q}</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="trending-sources-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="trending-sources-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Sources and methodology
          </h2>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            Repository metadata comes from the GitHub REST API and is stored as a curated snapshot.
            Star velocity, recency weights, and health scores are calculated by TopSAAS using the
            formulas on this page.
          </p>
          <ul className="space-y-2.5">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 hover:decoration-neutral-950"
                >
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              Cite this page
            </p>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-neutral-600">
              TopSAAS. &ldquo;Trending Open Source Projects.&rdquo;
              https://www.topsaas.space/trending. Last updated {LAST_UPDATED}. GitHub signals refreshed{' '}
              {signalDate}.
            </p>
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-neutral-500">
            Trending is a discovery signal, not a security audit or a quality guarantee. Review the
            license and source code before adopting any project.
          </p>
        </section>
      </div>

      {/* Related pages */}
      <section aria-labelledby="related-pages-heading" className="mx-auto mt-14 max-w-5xl">
        <h2
          id="related-pages-heading"
          className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
        >
          Keep exploring on TopSAAS
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-neutral-600">
          Trending shows what is moving now. These pages help you go deeper on the project, the build,
          and the business behind it.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED_PAGES.map((page) => (
            <a
              key={page.route}
              href={page.route}
              onClick={(e) => {
                e.preventDefault();
                playSound('click', soundEnabled);
                navigateTo(page.route);
              }}
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-300 hover:bg-neutral-50/70"
            >
              <span className="text-sm font-black text-neutral-950">{page.title}</span>
              <span className="mt-2 text-xs font-medium leading-relaxed text-neutral-600">
                {page.body}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-3 rounded-2xl border border-mint-500/30 bg-mint-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-neutral-950">Building something worth trending?</h2>
          <p className="mt-0.5 text-xs font-medium text-neutral-600">
            Submit your SaaS or open-source project to TopSAAS and get it in front of founders,
            builders, and early adopters.
          </p>
        </div>
        <a
          href="/submit"
          onClick={(e) => {
            e.preventDefault();
            playSound('click', soundEnabled);
            navigateTo('/submit');
          }}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-neutral-800"
        >
          Submit your project
        </a>
      </div>
    </div>
  );
};
