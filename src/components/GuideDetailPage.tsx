import React, { useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Github,
  HelpCircle,
  ListChecks,
  Terminal,
} from 'lucide-react';
import { getGuideBySlug } from '../data/buildGuides';
import { CURATED_REPOS, CuratedRepo } from '../data/curatedRepos';
import { getHealth } from '../utils/repoHealth';
import { HealthScore } from './HealthScore';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import { formatStars } from '../utils/github';
import { plainCopy } from '../utils/plainCopy';

interface GuideDetailPageProps {
  slug: string | null;
  soundEnabled: boolean;
  onOpenRepo: (repo: CuratedRepo) => void;
}

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <h2 className={`text-base font-black text-neutral-950 ${className}`}>{children}</h2>
);

export const GuideDetailPage: React.FC<GuideDetailPageProps> = ({
  slug,
  soundEnabled,
  onOpenRepo,
}) => {
  const guide = getGuideBySlug(slug);
  const repo = guide ? CURATED_REPOS.find((r) => r.full_name === guide.repoFullName) ?? null : null;
  const health = guide ? getHealth(guide.repoFullName) : null;

  // Related projects: same category as the guide's base repo, most starred first.
  const related = useMemo(() => {
    if (!repo) return [];
    return CURATED_REPOS.filter((r) => r.category === repo.category && r.full_name !== repo.full_name)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 4);
  }, [repo]);

  // Head swap + HowTo / FAQPage structured data (the AEO payload for guides).
  useEffect(() => {
    if (!guide) return;
    const howTo = {
      '@type': 'HowTo',
      name: guide.title,
      description: guide.tagline,
      totalTime: guide.totalTime,
      estimatedDifficulty: guide.difficulty,
      step: guide.steps.map((s, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: s.title,
        text: s.body,
      })),
    };
    const faq = {
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    return applyPageSeo({
      title: `${guide.title} | TopSAAS Build Guide`,
      description: guide.tagline.slice(0, 157),
      canonical: `/guides/${guide.slug}`,
      jsonLdId: 'guide-jsonld',
      jsonLd: { '@context': 'https://schema.org', '@graph': [howTo, faq] },
    });
  }, [guide]);

  if (!guide) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-16 pb-24 text-center space-y-4">
        <h1 className="text-xl font-black text-neutral-950">Guide not found</h1>
        <p className="text-sm text-neutral-500">
          That build guide does not exist (yet). The catalog keeps growing.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo('/guides')}
            className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-black text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            All build guides
          </button>
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-2 text-xs font-black text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            Browse projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-3.5 sm:px-6 pt-6 pb-16 space-y-6">
      {/* Back */}
      <button
        type="button"
        onClick={() => {
          playSound('click', soundEnabled);
          navigateTo('/guides');
        }}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All build guides
      </button>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-black  text-mint-600">
          <BookOpen className="h-3.5 w-3.5" />
          Build Guide
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-500">{guide.difficulty}</span>
          <span className="text-neutral-600">·</span>
          <span className="inline-flex items-center gap-1 text-neutral-500">
            <Clock className="h-3 w-3" />
            {guide.timeEstimate}
          </span>
        </div>
        <h1 className="text-2xl font-black leading-tight text-neutral-950 sm:text-3xl">{guide.title}</h1>
        <p className="text-sm leading-relaxed text-neutral-500 sm:text-[15px]">{guide.tagline}</p>

        {/* Base repo callout */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          {repo && (
            <span className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
              <img src={repo.owner.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black text-neutral-950">{guide.repoFullName}</span>
            <span className="block truncate text-xs text-neutral-500">
              {repo ? plainCopy(repo.description) : 'Foundation project for this guide'}
            </span>
          </span>
          {repo && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400">
              <span className="font-mono-num">{formatStars(repo.stargazers_count)}</span> ★
            </span>
          )}
          {health && <HealthScore score={health.score} band={health.band} />}
          <span className="flex gap-2">
            {repo && (
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenRepo(repo);
                }}
                className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-[11px] font-black text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950 cursor-pointer"
              >
                Project page
              </button>
            )}
            <a
              href={`https://github.com/${guide.repoFullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-[11px] font-black text-neutral-700 transition-colors hover:border-neutral-300 hover:text-neutral-950"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </span>
        </div>

        {/* Stack chips */}
        <div className="flex flex-wrap gap-1.5">
          {guide.stack.map((s) => (
            <span
              key={s}
              className="rounded border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600"
            >
              {s}
            </span>
          ))}
        </div>
      </header>

      {/* Intro */}
      <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
        {guide.intro.split('\n\n').map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-neutral-700">
            {p}
          </p>
        ))}
      </div>

      {/* Steps */}
      <section className="space-y-4">
        <SectionTitle>Steps</SectionTitle>
        <ol className="space-y-4">
          {guide.steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-neutral-200 bg-white p-5"
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-mint-500/15 font-mono-num text-xs font-black text-mint-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-2.5">
                  <h3 className="text-sm font-black text-neutral-950">{step.title}</h3>
                  {step.body.split('\n\n').map((p, j) => (
                    <p key={j} className="text-[13px] leading-relaxed text-neutral-600">
                      {p}
                    </p>
                  ))}
                  {step.code && (
                    <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3.5 text-xs leading-relaxed text-neutral-800">
                      <code>{step.code}</code>
                    </pre>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Customize + Checklist side by side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-mint-600" />
            Make it yours
          </SectionTitle>
          <ul className="space-y-2">
            {guide.customize.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px] leading-relaxed text-neutral-600">
                <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-600" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
          <SectionTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-mint-600" />
            Production checklist
          </SectionTitle>
          <ul className="space-y-2">
            {guide.checklist.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px] leading-relaxed text-neutral-600">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-600" />
                {c}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* FAQ */}
      <section className="space-y-3">
        <SectionTitle className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-mint-600" />
          FAQ
        </SectionTitle>
        <div className="space-y-2">
          {guide.faq.map((f) => (
            <details
              key={f.q}
              className="group rounded-xl border border-neutral-200 bg-white px-5 py-3.5"
            >
              <summary className="cursor-pointer list-none text-sm font-bold text-neutral-950 marker:hidden group-open:text-mint-700">
                {f.q}
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related projects */}
      {related.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>Related projects in {repo?.category}</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {related.map((r) => {
              const h = getHealth(r.full_name);
              return (
                <button
                  key={r.full_name}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onOpenRepo(r);
                  }}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3.5 text-left transition-all hover:border-neutral-200 hover:bg-neutral-100 cursor-pointer"
                >
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white">
                    <img src={r.owner.avatar_url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-neutral-950 group-hover:text-mint-600 transition-colors">
                      {r.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{plainCopy(r.description)}</span>
                  </span>
                  {h && <HealthScore score={h.score} band={h.band} />}
                  <span className="font-mono-num shrink-0 text-[11px] font-bold text-neutral-400">
                    {formatStars(r.stargazers_count)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Closing CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-xs">
        <p className="text-sm font-bold text-neutral-700">
          <CheckCircle2 className="mr-1.5 inline h-4 w-4 text-mint-600" />
          Finished? The full catalog has {CURATED_REPOS.length} more projects to build on.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('/')}
          className="rounded-lg bg-mint-500 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-mint-400 cursor-pointer"
        >
          Browse projects
        </button>
      </div>
    </div>
  );
};
