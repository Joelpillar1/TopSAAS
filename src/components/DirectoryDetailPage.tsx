import React, { useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  DollarSign,
  Globe2,
  Layers,
  Link2,
  ListChecks,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import {
  DIRECTORY_HUBS,
  DIRECTORY_KIND_LABELS,
  DIRECTORY_LINK_LABELS,
  DIRECTORY_PRICE_LABELS,
  DirectoryLink,
  DirectoryPrice,
  getDirectoryBySlug,
  getRelatedDirectories,
} from '../data/directories';

interface DirectoryDetailPageProps {
  slug: string | null;
  soundEnabled: boolean;
  onOpenSubmit: () => void;
}

const PRICE_STYLES: Record<DirectoryPrice, string> = {
  free: 'border-mint-200 bg-mint-50 text-mint-700',
  freemium: 'border-amber-200 bg-amber-50 text-amber-700',
  paid: 'border-neutral-200 bg-neutral-100 text-neutral-700',
};

const LINK_STYLES: Record<DirectoryLink, string> = {
  dofollow: 'border-mint-200 bg-mint-50 text-mint-700',
  nofollow: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  conditional: 'border-amber-200 bg-amber-50 text-amber-700',
  unknown: 'border-neutral-200 bg-white text-neutral-500',
};

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${className}`}>
    {children}
  </span>
);

const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-black tracking-tight text-neutral-950 sm:text-2xl ${className}`}>{children}</h2>
);

export const DirectoryDetailPage: React.FC<DirectoryDetailPageProps> = ({
  slug,
  soundEnabled,
  onOpenSubmit,
}) => {
  const directory = getDirectoryBySlug(slug);
  const related = useMemo(() => (directory ? getRelatedDirectories(directory) : []), [directory]);

  const faqs = useMemo(() => {
    if (!directory) return [];
    const priceAnswer =
      directory.price === 'free'
        ? `Yes. ${directory.name} does not charge for a listing.`
        : directory.price === 'freemium'
          ? `${directory.name} has a free basic listing. Faster review, featured placement, or extra promotion may cost money.`
          : `${directory.name} charges for a listing. Check the current price on its submission page before you start.`;
    const linkAnswer =
      directory.link === 'dofollow'
        ? `Yes. ${directory.name} gives a dofollow link, so the listing can pass SEO value to your site.`
        : directory.link === 'nofollow'
          ? `No. ${directory.name} gives a nofollow link. It can still send visitors and referrals, but search engines do not count it toward your rankings.`
          : directory.link === 'conditional'
            ? `It depends. ${directory.name} uses conditional links, so the link type can change with the plan or placement you choose.`
            : `It varies. ${directory.name} does not publish a consistent link type, so check the live listing after approval.`;
    return [
      { q: `Is ${directory.name} free?`, a: priceAnswer },
      { q: `Does ${directory.name} give a dofollow link?`, a: linkAnswer },
      {
        q: `What is ${directory.name}'s Domain Rating?`,
        a: `${directory.name} has an Ahrefs Domain Rating of ${directory.dr}. DR changes over time, so re-check it before you pay for a placement.`,
      },
      {
        q: `How do I submit to ${directory.name}?`,
        a: `${directory.steps[0]} ${directory.steps[1]} ${directory.steps[2]}`,
      },
      {
        q: `How long does ${directory.name} take to approve a listing?`,
        a: `${directory.approvalTime}. Review times vary with queue size and how complete your submission is.`,
      },
    ];
  }, [directory]);

  useEffect(() => {
    if (!directory) {
      return applyPageSeo({
        title: 'Directory not found | TopSAAS',
        description: 'This directory page could not be found. Browse the full list of product directories on TopSAAS.',
        canonical: '/directories',
      });
    }
    const url = `/directories/${directory.slug}`;
    return applyPageSeo({
      title: `How to Submit to ${directory.name} (2026) | TopSAAS`,
      description: `${directory.name}: Ahrefs DR ${directory.dr}, ${DIRECTORY_PRICE_LABELS[directory.price].toLowerCase()} listing, ${DIRECTORY_LINK_LABELS[directory.link].toLowerCase()} link. Step-by-step submission guide and requirements.`.slice(0, 157),
      canonical: url,
      jsonLdId: 'directory-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'HowTo',
            name: `How to submit to ${directory.name}`,
            description: directory.description,
            totalTime: 'PT15M',
            step: directory.steps.map((step, index) => ({
              '@type': 'HowToStep',
              position: index + 1,
              name: `Step ${index + 1}`,
              text: step,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.topsaas.space/' },
              { '@type': 'ListItem', position: 2, name: 'Directories', item: 'https://www.topsaas.space/directories' },
              { '@type': 'ListItem', position: 3, name: directory.name, item: `https://www.topsaas.space${url}` },
            ],
          },
        ],
      },
    });
  }, [directory, faqs]);

  if (!directory) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
          <Globe2 className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-black tracking-tight text-neutral-950">Directory not found</h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-500">
          That directory page does not exist or has been renamed. Browse the full ranked list instead.
        </p>
        <a
          href="/directories"
          onClick={(event) => {
            event.preventDefault();
            navigateTo('/directories');
          }}
          className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white hover:bg-neutral-800"
        >
          Back to all directories
          <ArrowRight className="h-4 w-4" />
        </a>
      </main>
    );
  }

  const kindHub = DIRECTORY_HUBS.find(
    (hub) => hub.slug === directory.kind || (directory.kind === 'launch' && hub.slug === 'launch-platforms')
  );
  const stats = [
    { label: 'Domain Rating', value: directory.dr, icon: TrendingUp },
    { label: 'Price', value: DIRECTORY_PRICE_LABELS[directory.price], icon: DollarSign },
    { label: 'Link type', value: DIRECTORY_LINK_LABELS[directory.link], icon: Link2 },
    { label: 'Type', value: DIRECTORY_KIND_LABELS[directory.kind], icon: Layers },
  ];

  return (
    <main className="bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-neutral-500">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              navigateTo('/');
            }}
            className="hover:text-neutral-900"
          >
            Home
          </a>
          <span className="text-neutral-300">/</span>
          <a
            href="/directories"
            onClick={(event) => {
              event.preventDefault();
              navigateTo('/directories');
            }}
            className="hover:text-neutral-900"
          >
            Directories
          </a>
          <span className="text-neutral-300">/</span>
          <span className="text-neutral-900">{directory.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-mint-200 bg-mint-50 text-mint-700">{DIRECTORY_KIND_LABELS[directory.kind]}</Badge>
              <Badge className={PRICE_STYLES[directory.price]}>{DIRECTORY_PRICE_LABELS[directory.price]}</Badge>
              <Badge className={LINK_STYLES[directory.link]}>{DIRECTORY_LINK_LABELS[directory.link]}</Badge>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">
              How to submit to {directory.name}
            </h1>
            <p className="mt-2 text-base font-medium leading-relaxed text-neutral-600">{directory.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-neutral-500">
              <a
                href={directory.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('click', soundEnabled)}
                className="inline-flex items-center gap-1 text-neutral-700 hover:text-mint-700"
              >
                <Globe2 className="h-3.5 w-3.5" />
                {directory.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                <ArrowUpRight className="h-3 w-3" />
              </a>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                Last checked {directory.lastChecked}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {directory.approvalTime}
              </span>
            </div>
          </div>

          <div className="w-full shrink-0 rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs lg:w-64">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Domain Rating</span>
              <span className="text-3xl font-black font-mono-num text-neutral-950">{directory.dr}</span>
            </div>
            <a
              href={directory.submitUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-800"
            >
              Open {directory.name}
              <ArrowUpRight className="h-4 w-4" />
            </a>
            <p className="mt-2 text-center text-[10px] font-medium text-neutral-400">Submission link, opens in a new tab</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-neutral-200 bg-white px-3 py-3 shadow-2xs">
              <Icon className="h-4 w-4 text-neutral-400" />
              <div className="mt-1.5 text-sm font-black text-neutral-950">{value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="border-y border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
              <ListChecks className="h-4 w-4" />
            </span>
            <SectionTitle>Submit your product, step by step</SectionTitle>
          </div>
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {directory.steps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="mt-3 text-sm font-medium leading-relaxed text-neutral-700">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-mint-200 bg-mint-50 px-4 py-3 text-xs font-semibold leading-relaxed text-mint-800">
            Tip: use the same listing kit everywhere. A consistent name, tagline, logo, and screenshots makes approvals
            faster and keeps your product recognizable across directories.
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <SectionTitle>What you need</SectionTitle>
          </div>
          <ul className="mt-4 space-y-2.5">
            {directory.requirements.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-medium text-neutral-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <SectionTitle>Before you submit</SectionTitle>
          </div>
          <ul className="mt-4 space-y-2.5 text-sm font-medium leading-relaxed text-neutral-600">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              Confirm the current price and link type on {directory.name} before you pay for anything.
            </li>
            <li className="flex items-start gap-2">
              <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              Use a live product URL with a clear landing page. Directories reject broken or placeholder sites.
            </li>
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              Watch your inbox for a verification email. Many listings stay pending until the address is confirmed.
            </li>
            <li className="flex items-start gap-2">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              Pick the closest category and use the same description you use on other directories.
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
          <SectionTitle>{directory.name} FAQ</SectionTitle>
          <div className="mt-5 space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-bold text-neutral-950 sm:text-base">{faq.q}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-neutral-500 sm:text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Similar */}
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <SectionTitle>Directories like {directory.name}</SectionTitle>
          <a
            href="/directories"
            onClick={(event) => {
              event.preventDefault();
              navigateTo('/directories');
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All directories
          </a>
        </div>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-2xs">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-3 py-3">Directory</th>
                <th scope="col" className="px-3 py-3 text-center">DR</th>
                <th scope="col" className="px-3 py-3">Price</th>
                <th scope="col" className="hidden px-3 py-3 sm:table-cell">Link</th>
                <th scope="col" className="px-3 py-3 text-right">Guide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {related.map((item) => (
                <tr key={item.slug} className="group hover:bg-neutral-50/70">
                  <td className="px-3 py-3">
                    <a
                      href={`/directories/${item.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        playSound('click', soundEnabled);
                        navigateTo(`/directories/${item.slug}`);
                      }}
                      className="font-bold text-neutral-950 group-hover:text-mint-700"
                    >
                      {item.name}
                    </a>
                    <span className="mt-0.5 block text-[11px] font-medium text-neutral-500">
                      {DIRECTORY_KIND_LABELS[item.kind]}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-black font-mono-num text-neutral-900">{item.dr}</td>
                  <td className="px-3 py-3">
                    <Badge className={PRICE_STYLES[item.price]}>{DIRECTORY_PRICE_LABELS[item.price]}</Badge>
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell">
                    <Badge className={LINK_STYLES[item.link]}>{DIRECTORY_LINK_LABELS[item.link]}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <a
                      href={`/directories/${item.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        playSound('click', soundEnabled);
                        navigateTo(`/directories/${item.slug}`);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-neutral-950"
                    >
                      Read
                      <ArrowRight className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hub links */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-8 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Browse by type</span>
          {DIRECTORY_HUBS.map((hub) => (
            <a
              key={hub.slug}
              href={`/directories/${hub.slug}`}
              onClick={(event) => {
                event.preventDefault();
                playSound('click', soundEnabled);
                navigateTo(`/directories/${hub.slug}`);
              }}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300"
            >
              {hub.label}
            </a>
          ))}
          {kindHub && (
            <span className="rounded-full border border-mint-200 bg-mint-50 px-3 py-1.5 text-xs font-bold text-mint-700">
              {kindHub.label}
            </span>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl bg-neutral-950 px-6 py-9 text-center sm:px-10 sm:py-12">
          <Rocket className="mx-auto h-6 w-6 text-mint-400" />
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
            List on TopSAAS before you pay for directories
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-relaxed text-neutral-300">
            A TopSAAS listing is free, crawlable, and ranked by real upvotes. Start with the directory that keeps
            working after launch day.
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onOpenSubmit();
              }}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-mint-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-mint-600 sm:w-auto"
            >
              Submit your SaaS free
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href={directory.submitUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              Go to {directory.name}
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};
