import React, { useEffect, useMemo } from 'react';
import { BookOpen, Clock, ArrowUpRight, Rocket } from 'lucide-react';
import { BUILD_GUIDES } from '../data/buildGuides';
import { CURATED_REPOS } from '../data/curatedRepos';
import { getHealth } from '../utils/repoHealth';
import { HealthScore } from './HealthScore';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import { formatStars } from '../utils/github';

interface GuidesListPageProps {
  soundEnabled: boolean;
}

export const GuidesListPage: React.FC<GuidesListPageProps> = ({ soundEnabled }) => {
  // Repo facts shown on each guide card (avatar, stars, health).
  const repoFacts = useMemo(
    () =>
      BUILD_GUIDES.map((g) => ({
        guide: g,
        repo: CURATED_REPOS.find((r) => r.full_name === g.repoFullName) ?? null,
        health: getHealth(g.repoFullName),
      })),
    []
  );

  useEffect(() => {
    return applyPageSeo({
      title: 'Build Guides — Ship real products on open-source projects | TopSAAS',
      description:
        'Original step-by-step walkthroughs: launch an admin dashboard with refine, automate ops with n8n, and start a full-stack SaaS with create-t3-app. Every guide links its repo.',
      canonical: '/guides',
      jsonLdId: 'guides-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'TopSAAS Build Guides',
        itemListElement: BUILD_GUIDES.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: g.title,
          url: `https://www.topsaas.space/guides/${g.slug}`,
        })),
      },
    });
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 pt-6 pb-16 space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint-500/15 text-mint-600">
            <BookOpen className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-black text-neutral-950 sm:text-xl">
            Build Guides
          </h1>
        </div>
        <p className="text-sm font-medium text-neutral-500 max-w-3xl">
          Original walkthroughs that take one curated project and ship something real on top of it:
          copy-paste commands, production checklists, and the decisions in between.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repoFacts.map(({ guide, repo, health }) => (
          <div
            key={guide.slug}
            className="flex flex-col rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-neutral-300 hover:shadow-[0_4px_20px_-6px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-center gap-2 text-[10px] font-black  text-mint-600">
              <Rocket className="h-3.5 w-3.5" />
              {guide.difficulty}
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-500 normal-case tracking-normal font-bold">
                {guide.timeEstimate}
              </span>
            </div>

            <h2 className="mt-3 text-base font-black leading-snug text-neutral-950">{guide.title}</h2>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{guide.tagline}</p>

            {/* Base repo facts */}
            <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-3.5">
              {repo && (
                <span className="h-7 w-7 shrink-0 overflow-hidden rounded border border-neutral-200 bg-white">
                  <img src={repo.owner.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </span>
              )}
              <span className="truncate text-xs font-bold text-neutral-600">{guide.repoFullName}</span>
              {repo && (
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-neutral-500">
                  <span className="font-mono-num">{formatStars(repo.stargazers_count)}</span> ★
                </span>
              )}
              {health && <HealthScore score={health.score} band={health.band} />}
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                navigateTo(`/guides/${guide.slug}`);
              }}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs font-black text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950 cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              Read the guide
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-neutral-600 max-w-3xl">
        Every guide links its foundation project's detail page, where you will find the health
        score, license, stack breakdown, and similar projects. Guides are written from the same
        curated data that powers the catalog.
      </p>
    </div>
  );
};
