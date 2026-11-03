import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Sparkles, Star, GitFork, ArrowUpRight } from 'lucide-react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { REPO_HEALTH, REPO_HEALTH_GENERATED_AT, RepoHealthSignals } from '../data/repoHealth';
import { computeHealth, HealthResult } from '../utils/repoHealth';
import { HealthScore } from './HealthScore';
import { formatStars } from '../utils/github';
import { plainCopy } from '../utils/plainCopy';
import { applyPageSeo } from '../utils/pageSeo';
import { playSound } from '../utils/sound';

const DAY = 86_400_000;

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
      // giant doesn't outrank a project that caught fire last month.
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

  const visible = useMemo(() => {
    const filtered = category === 'All' ? rows : rows.filter((r) => r.repo.category === category);
    const sorted =
      mode === 'trending'
        ? filtered.filter((r) => r.daysAgoPush <= 90).sort((a, b) => b.trend - a.trend)
        : [...filtered].sort((a, b) => a.daysAgoCreated - b.daysAgoCreated);
    return sorted.slice(0, 60);
  }, [rows, category, mode]);

  // Per-route head swap so /trending is indexable with its own title/OG/JSON-LD.
  useEffect(() => {
    const top = visible.slice(0, 10);
    return applyPageSeo({
      title: 'Trending Open Source Projects — TopSAAS',
      description:
        'Open-source projects ranked by recent activity and star velocity across 23 categories: see what builders are shipping on right now.',
      canonical: '/trending',
      jsonLdId: 'trending-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Trending Open Source Projects on TopSAAS',
        itemListElement: top.map((r, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: r.repo.full_name,
          url: `https://www.topsaas.space/repo/${r.repo.full_name}`,
        })),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signalDate = REPO_HEALTH_GENERATED_AT ? REPO_HEALTH_GENERATED_AT.slice(0, 10) : 'recently';

  return (
    <div className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 pt-6 pb-16 space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint-500/15 text-mint-600">
            <Flame className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-black text-neutral-950 sm:text-xl">
            Trending Projects
          </h1>
        </div>
        <p className="text-sm font-medium text-neutral-400 max-w-3xl">
          Projects that shipped in the last 90 days, ranked by star velocity weighted with how
          recently they last pushed. Refreshed from GitHub signals.
        </p>
      </div>

      {/* Tabs + category pills */}
      <div className="flex flex-col gap-3">
        <div className="inline-flex w-fit rounded-lg border border-neutral-200 bg-white p-1">
          {(
            [
              ['trending', 'Trending', Flame],
              ['newest', 'Newest', Sparkles],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setMode(key);
              }}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                mode === key ? 'bg-neutral-950 text-white' : 'text-neutral-500 hover:text-neutral-950'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="navigation" aria-label="Filter trending by category">
          {(['All', ...categories.map(([c]) => c)] as const).map((cat) => (
            <button
              key={cat}
              type="button"
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
      </div>

      {/* Ranked list */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {visible.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-neutral-500">
            No {mode === 'trending' ? 'recently active' : 'new'} projects in this category yet.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200/70">
            {visible.map((row, i) => (
              <li key={row.repo.full_name}>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onOpenRepo(row.repo);
                  }}
                  className="group flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-neutral-50 cursor-pointer sm:gap-4"
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
                      <span className="truncate text-sm font-bold text-neutral-950 group-hover:text-mint-600 transition-colors">
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
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      <span className="font-mono-num text-neutral-500">{formatStars(row.signals.stars)}</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitFork className="h-3.5 w-3.5 text-neutral-500" />
                      <span className="font-mono-num">{formatStars(row.signals.forks)}</span>
                    </span>
                  </span>
                  <span className="hidden w-24 shrink-0 text-right text-[11px] font-semibold lg:block">
                    <span className={row.daysAgoPush <= 14 ? 'text-mint-600' : 'text-neutral-500'}>
                      {mode === 'trending' ? relativeDays(row.daysAgoPush) : relativeDays(row.daysAgoCreated)}
                    </span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-neutral-600 transition-all group-hover:text-mint-600 group-hover:-translate-y-0.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Methodology — transparency doubles as GEO fodder */}
      <p className="text-[11px] leading-relaxed text-neutral-600 max-w-3xl">
        How this is ranked: Trending scores projects that pushed code in the last 90 days by star
        velocity (stars per year of age) weighted with recency of the last push; Newest lists
        projects by creation date. GitHub signals refreshed {signalDate}. Every project also carries
        a 0-100 health score (activity, popularity, engagement, issue load, open-source hygiene) —
        see any project page for its full breakdown.
      </p>
    </div>
  );
};
