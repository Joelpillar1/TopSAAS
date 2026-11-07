import React, { useEffect, useMemo } from 'react';
import { BUILD_GUIDES } from '../data/buildGuides';
import { CURATED_REPOS } from '../data/curatedRepos';
import { getHealth } from '../utils/repoHealth';
import { HealthScore } from './HealthScore';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import { formatStars } from '../utils/github';
import { GridPattern } from '@/components/ui/grid-pattern';
import { cn } from '@/lib/utils';

const LAST_UPDATED = 'November 7, 2026';

const WHATS_INSIDE = [
  {
    title: 'Copy-paste commands',
    body: 'Every guide starts from an empty folder and gives you the exact commands, imports, and configuration needed to get a working project running.',
  },
  {
    title: 'Production checklist',
    body: 'Each walkthrough ends with a checklist for secrets, authentication, pagination, destructive actions, and error handling before you ship.',
  },
  {
    title: 'Customization notes',
    body: 'You get the decisions that matter after the tutorial: multi-tenancy, permissions, audit trails, styling, and how to adapt the stack to your product.',
  },
  {
    title: 'Repo health and license context',
    body: 'Every guide links its foundation project page, where you can check the license, stack, stars, forks, release information, and health score.',
  },
  {
    title: 'FAQ written as direct answers',
    body: 'Each guide answers the questions people ask before committing: cost, licensing, UI lock-in, time saved, and what you can change.',
  },
];

const CHOOSING_STEPS = [
  {
    title: 'Start with the product surface you need',
    body: 'Internal dashboards, operational automation, and full-stack SaaS starters are different jobs. Pick the guide that matches the surface you need to ship first.',
  },
  {
    title: 'Match the time you actually have',
    body: 'The n8n guide fits an afternoon. The refine and create-t3-app guides fit a weekend. Choose a scope you can finish so you end with a working result, not a half-cloned repo.',
  },
  {
    title: 'Check the foundation project first',
    body: 'Open the linked repo page and read the license, language, health score, and similar projects. The guide is only useful if the foundation fits your stack and risk tolerance.',
  },
  {
    title: 'Adapt after it runs',
    body: 'Get the default path working before you customize. Changing auth, data providers, or deployment targets mid-tutorial is the fastest way to lose an afternoon.',
  },
];

const FAQS = [
  {
    q: 'What are TopSAAS build guides?',
    a: 'TopSAAS build guides are original, step-by-step walkthroughs that take one curated open-source project and ship a working product on top of it. Each guide includes commands, production checks, customization notes, and a FAQ.',
  },
  {
    q: 'Are the build guides free?',
    a: 'Yes. Every build guide is free to read and does not require an account. The foundation projects have their own licenses, which are linked from each guide and repo page.',
  },
  {
    q: 'Do I need experience to follow a guide?',
    a: 'The guides are rated Beginner, Intermediate, or Advanced. You should be comfortable with a terminal, installing packages, and reading JavaScript or TypeScript. No prior experience with the specific framework is required.',
  },
  {
    q: 'Which guide should I start with?',
    a: 'Start with the surface you need. Choose refine for an internal admin dashboard, n8n for operational automation, or create-t3-app for a full-stack SaaS starter. If you are unsure, start with the shortest guide to learn the workflow.',
  },
  {
    q: 'Are the commands kept up to date?',
    a: 'Guides are written against the curated project snapshot and reviewed when the underlying project changes. Always check the foundation project documentation for breaking changes before starting a new production build.',
  },
  {
    q: 'Do I have to use the exact stack in the guide?',
    a: 'No. The guides show one working path, not the only path. The customization sections explain where to swap the UI library, data provider, database, auth provider, or deployment target.',
  },
  {
    q: 'Are the guides affiliated with the projects?',
    a: 'No. TopSAAS build guides are independent editorial walkthroughs. Each guide links to the official repository so you can verify the license, maintainers, and current documentation yourself.',
  },
  {
    q: 'Can I use the guides for commercial work?',
    a: 'Yes. You can follow a guide to build commercial software. The foundation project license still applies to the code you reuse, so read it before shipping. Some projects are MIT licensed, while others use different terms.',
  },
  {
    q: 'How long does each guide take?',
    a: 'Estimates range from an afternoon for the n8n automation guide to a weekend for the refine and create-t3-app guides. The estimates assume you are following the default path without major customization.',
  },
  {
    q: 'How do I suggest a new guide?',
    a: 'Use the submit page to send the project and the product you want to build. TopSAAS prioritizes guides for curated projects that are actively maintained and useful to founders.',
  },
];

const RELATED_PAGES = [
  {
    title: 'SaaS ideas',
    body: 'Browse the full open-source starter catalog with categories, search, and repo health scores.',
    route: '/ideas',
  },
  {
    title: 'Trending projects',
    body: 'See which open-source repositories are gaining momentum right now.',
    route: '/trending',
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
    label: 'refine repository',
    href: 'https://github.com/refinedev/refine',
  },
  {
    label: 'n8n repository',
    href: 'https://github.com/n8n-io/n8n',
  },
  {
    label: 'create-t3-app repository',
    href: 'https://github.com/t3-oss/create-t3-app',
  },
  {
    label: 'GitHub REST API documentation',
    href: 'https://docs.github.com/en/rest',
  },
  {
    label: 'Open Source Guides: starting a project',
    href: 'https://opensource.guide/',
  },
];

const DirectAnswer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-r-xl border-l-2 border-mint-500 bg-neutral-50 px-4 py-3 text-sm font-medium leading-relaxed text-neutral-700">
    {children}
  </p>
);

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

  const totals = useMemo(() => {
    const steps = BUILD_GUIDES.reduce((sum, g) => sum + g.steps.length, 0);
    const faqs = BUILD_GUIDES.reduce((sum, g) => sum + g.faq.length, 0);
    const repos = new Set(BUILD_GUIDES.map((g) => g.repoFullName)).size;
    return { steps, faqs, repos };
  }, []);

  useEffect(() => {
    return applyPageSeo({
      title: 'Build Guides: Ship Real SaaS on Open-Source Projects | TopSAAS',
      description:
        'Original step-by-step build guides for refine, n8n, and create-t3-app. Copy-paste commands, production checklists, repo health scores, and a clear path to launch.',
      canonical: '/guides',
      jsonLdId: 'guides-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': 'https://www.topsaas.space/guides#webpage',
            url: 'https://www.topsaas.space/guides',
            name: 'TopSAAS Build Guides',
            description:
              'Original step-by-step build guides that ship a real product on a curated open-source project.',
            inLanguage: 'en',
            dateModified: '2026-11-07',
            isPartOf: {
              '@type': 'WebSite',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space/',
            },
            about: {
              '@type': 'Thing',
              name: 'Open-source SaaS build tutorials',
            },
            publisher: {
              '@type': 'Organization',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space/',
            },
          },
          {
            '@type': 'ItemList',
            name: 'TopSAAS Build Guides',
            numberOfItems: BUILD_GUIDES.length,
            itemListElement: BUILD_GUIDES.map((g, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: g.title,
              url: `https://www.topsaas.space/guides/${g.slug}`,
              description: g.tagline,
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
                name: 'Build Guides',
                item: 'https://www.topsaas.space/guides',
              },
            ],
          },
        ],
      },
    });
  }, []);

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
          Build Guides
        </span>
      </nav>

      {/* Hero */}
      <section className="relative mt-4 overflow-hidden px-1 pt-4 sm:pt-8" aria-labelledby="guides-heading">
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
            id="guides-heading"
            className="text-3xl font-black leading-[1.1] tracking-tight text-neutral-950 sm:text-4xl"
          >
            Build Guides
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">
            Original walkthroughs that take one curated open-source project and ship something real
            on top of it: copy-paste commands, production checklists, and the decisions in between.
          </p>

          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-mint-500/30 bg-mint-500/[0.06] px-5 py-4 text-left">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-mint-700">
              Quick answer
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-neutral-700">
              A TopSAAS build guide is a{' '}
              <strong className="font-black text-neutral-950">
                free, step-by-step tutorial that ships a working product on a curated repository
              </strong>
              . Each guide includes commands, a production checklist, customization notes, and a
              repo health score.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-neutral-500">
            <span>Last updated: {LAST_UPDATED}</span>
            <span className="text-neutral-300">·</span>
            <span>{BUILD_GUIDES.length} guides</span>
            <span className="text-neutral-300">·</span>
            <span>{totals.steps} steps</span>
            <span className="text-neutral-300">·</span>
            <span>{totals.faqs} guide FAQs</span>
          </div>
        </div>
      </section>

      {/* Guide cards */}
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {repoFacts.map(({ guide, repo, health }) => (
          <a
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            onClick={(e) => {
              e.preventDefault();
              playSound('click', soundEnabled);
              navigateTo(`/guides/${guide.slug}`);
            }}
            className="group flex flex-col rounded-xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-300 hover:shadow-[0_4px_20px_-6px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-mint-600">
              <span>{guide.difficulty}</span>
              <span className="text-neutral-300">·</span>
              <span className="font-bold normal-case tracking-normal text-neutral-500">
                {guide.timeEstimate}
              </span>
            </div>

            <h2 className="mt-3 text-base font-black leading-snug text-neutral-950 transition-colors group-hover:text-mint-700">
              {guide.title}
            </h2>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-neutral-600">{guide.tagline}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {guide.stack.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600"
                >
                  {item}
                </span>
              ))}
            </div>

            {/* Base repo facts */}
            <div className="mt-4 flex items-center gap-2 border-t border-neutral-200 pt-3.5">
              {repo && (
                <span className="h-7 w-7 shrink-0 overflow-hidden rounded border border-neutral-200 bg-white">
                  <img
                    src={repo.owner.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </span>
              )}
              <span className="truncate text-xs font-bold text-neutral-600">{guide.repoFullName}</span>
              {repo && (
                <span className="ml-auto shrink-0 text-[11px] font-semibold text-neutral-500">
                  <span className="font-mono-num">{formatStars(repo.stargazers_count)}</span> stars
                </span>
              )}
              {health && <HealthScore score={health.score} band={health.band} />}
            </div>

            <span className="mt-3 flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 px-3.5 py-2 text-xs font-black text-neutral-700 transition-colors group-hover:border-neutral-300 group-hover:text-neutral-950">
              Read the guide
            </span>
          </a>
        ))}
      </div>

      <p className="mx-auto mt-3 max-w-5xl text-[11px] leading-relaxed text-neutral-500">
        Every guide links its foundation project's detail page, where you will find the health score,
        license, stack breakdown, and similar projects. Guides are written from the same curated data
        that powers the catalog.
      </p>

      {/* Article */}
      <div className="mx-auto mt-12 max-w-3xl space-y-10">
        <section aria-labelledby="what-are-guides-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="what-are-guides-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            What these build guides are
          </h2>
          <DirectAnswer>
            TopSAAS build guides are independent, step-by-step tutorials that take one curated
            open-source project and ship a working product on top of it. They are free, command-first,
            and written for founders and developers who want a result rather than a feature tour.
          </DirectAnswer>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            Most tutorials explain what a framework can do. These guides start from an empty folder and
            end with something you can run, deploy, and show to a user. Each one follows the same
            structure: scaffold the project, wire the data, handle authentication, build the main
            screen, add production safeguards, and deploy.
          </p>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            The guides are opinionated about the path but not about the stack. Where a choice matters,
            the customization section explains how to swap the UI library, data provider, database,
            auth provider, or host without rewriting the whole project.
          </p>
        </section>

        <section aria-labelledby="choose-guide-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="choose-guide-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Choose a guide
          </h2>
          <DirectAnswer>
            Pick the guide that matches the product surface you need first: an internal dashboard, an
            automation workflow, or a full-stack SaaS starter. Then check the time estimate and the
            foundation project before you start.
          </DirectAnswer>
          <div className="overflow-x-auto rounded-xl border border-neutral-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Guide
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Difficulty
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Time
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Foundation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {BUILD_GUIDES.map((guide) => (
                  <tr key={guide.slug}>
                    <td className="px-4 py-3 font-bold text-neutral-950">
                      <a
                        href={`/guides/${guide.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigateTo(`/guides/${guide.slug}`);
                        }}
                        className="underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-mint-700 hover:decoration-mint-500"
                      >
                        {guide.title}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{guide.difficulty}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{guide.timeEstimate}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] font-semibold">
                      {guide.repoFullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ol className="space-y-4">
            {CHOOSING_STEPS.map((step, index) => (
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

        <section aria-labelledby="inside-guide-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="inside-guide-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            What every guide includes
          </h2>
          <DirectAnswer>
            Every guide includes copy-paste commands, a production checklist, customization notes, a
            link to the foundation repo page, and a FAQ written as direct answers.
          </DirectAnswer>
          <div className="grid gap-3 sm:grid-cols-2">
            {WHATS_INSIDE.map((item) => (
              <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-4">
                <h3 className="text-sm font-bold text-neutral-950">{item.title}</h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-written-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="how-written-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            How the guides are written
          </h2>
          <DirectAnswer>
            Guides are written against the curated repository snapshot, tested as a default path, and
            linked to the foundation project so you can verify the license, maintainers, and current
            documentation before shipping.
          </DirectAnswer>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            TopSAAS does not republish project documentation. Each guide is an independent editorial
            walkthrough built around a real product outcome. Commands are kept short enough to copy,
            and the production checklist covers the failure modes that tutorials usually skip:
            secrets in the client bundle, missing auth checks, unbounded table queries, and blank
            screens on 401 or 403 responses.
          </p>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            Repository metadata and health scores come from the same curated snapshot used across the
            directory. Star and fork counts are a snapshot, not a live feed. Always check the official
            repository for the current release before starting a new production build.
          </p>
        </section>

        {/* FAQ */}
        <section id="faq" aria-labelledby="guides-faq-heading" className="mx-auto w-full max-w-2xl scroll-mt-24 pt-2">
          <h2
            id="guides-faq-heading"
            className="text-center text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Build Guides FAQ
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

        <section aria-labelledby="guides-sources-heading" className="scroll-mt-24 space-y-4">
          <h2
            id="guides-sources-heading"
            className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
          >
            Sources and further reading
          </h2>
          <p className="text-sm font-medium leading-relaxed text-neutral-600">
            Each guide is built on an open-source project. These links go to the official repositories
            and to the GitHub documentation used for repository metadata.
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
              TopSAAS. &ldquo;Build Guides.&rdquo; https://www.topsaas.space/guides. Last updated{' '}
              {LAST_UPDATED}.
            </p>
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-neutral-500">
            Build guides are educational walkthroughs, not security audits or legal advice. Review the
            license and source code of every project before using it in production.
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
          Guides help you ship. These pages help you choose the project, understand the market, and
          launch what you build.
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
          <h2 className="text-sm font-black text-neutral-950">Want a guide for your project?</h2>
          <p className="mt-0.5 text-xs font-medium text-neutral-600">
            Submit your SaaS or open-source project to TopSAAS. We prioritize guides for actively
            maintained projects that help founders ship.
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
