import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  DollarSign,
  Filter,
  Globe2,
  Layers,
  Link2,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import { GridPattern } from './ui/grid-pattern';
import {
  DIRECTORIES,
  DIRECTORY_HUBS,
  DIRECTORY_KIND_LABELS,
  DIRECTORY_LINK_LABELS,
  DIRECTORY_PRICE_LABELS,
  DirectoryEntry,
  DirectoryKind,
  DirectoryLink,
  DirectoryPrice,
  getDirectoryHub,
  getDirectoryStats,
} from '../data/directories';

interface DirectoriesListPageProps {
  soundEnabled: boolean;
  onOpenSubmit: () => void;
  hubSlug?: string | null;
}

type SortKey = 'dr' | 'name' | 'price';

const LAST_UPDATED = 'November 12, 2026';

const FAQS = [
  {
    q: 'What is a product directory?',
    a: 'A product directory is a website that lists software by category, use case, or launch date. A listing gives your SaaS a permanent profile, a backlink, and a place for buyers to discover it.',
  },
  {
    q: 'Are these directories free?',
    a: 'Many are. The table shows free, freemium, and paid listings separately. Freemium means a basic listing is free and faster review or featured placement costs money. Paid means the directory charges for a listing.',
  },
  {
    q: 'What is Domain Rating?',
    a: 'Domain Rating is Ahrefs\' 0 to 100 score for the strength of a website\'s backlink profile. A link from a higher DR site usually carries more SEO value, especially when the link is dofollow.',
  },
  {
    q: 'What is the difference between dofollow and nofollow?',
    a: 'A dofollow link passes ranking value to your site. A nofollow link can still send visitors and referrals, but search engines do not count it toward your rankings. Conditional means the link type depends on the plan or placement.',
  },
  {
    q: 'How many directories should I submit to?',
    a: 'Start with the free, high DR directories that fit your product, then add niche directories where your buyers already look. Ten to twenty well-matched listings usually beat a hundred irrelevant ones.',
  },
  {
    q: 'How often is this list updated?',
    a: 'The list is reviewed regularly. Domain Ratings, prices, and link types can change, so check the directory\'s own submission page before you pay for a placement. The last review date is shown on every page.',
  },
  {
    q: 'How do I submit my SaaS to TopSAAS?',
    a: 'Use the submit page to add your product to the TopSAAS directory. Submission is free, takes about 30 seconds with AI prefill, and gives you a crawlable product page plus a shot at the weekly leaderboard.',
  },
];

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

const KIND_STYLES: Record<DirectoryKind, string> = {
  saas: 'border-sky-200 bg-sky-50 text-sky-700',
  startup: 'border-violet-200 bg-violet-50 text-violet-700',
  ai: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
  launch: 'border-orange-200 bg-orange-50 text-orange-700',
};

const priceRank: Record<DirectoryPrice, number> = { free: 0, freemium: 1, paid: 2 };

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>
    {children}
  </span>
);

export const DirectoriesListPage: React.FC<DirectoriesListPageProps> = ({
  soundEnabled,
  onOpenSubmit,
  hubSlug = null,
}) => {
  const hub = getDirectoryHub(hubSlug);
  const baseDirectories = useMemo(
    () => (hub ? DIRECTORIES.filter(hub.filter) : DIRECTORIES),
    [hub]
  );
  const stats = useMemo(() => getDirectoryStats(baseDirectories), [baseDirectories]);

  const [query, setQuery] = useState('');
  const [price, setPrice] = useState<'all' | DirectoryPrice>('all');
  const [link, setLink] = useState<'all' | DirectoryLink>('all');
  const [kind, setKind] = useState<'all' | DirectoryKind>('all');
  const [minDr, setMinDr] = useState<0 | 50 | 70 | 80>(0);
  const [sort, setSort] = useState<SortKey>('dr');

  useEffect(() => {
    setQuery('');
    setPrice('all');
    setLink('all');
    setKind('all');
    setMinDr(0);
    setSort('dr');
  }, [hubSlug]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = baseDirectories.filter((directory) => {
      if (price !== 'all' && directory.price !== price) return false;
      if (link !== 'all' && directory.link !== link) return false;
      if (kind !== 'all' && directory.kind !== kind) return false;
      if (directory.dr < minDr) return false;
      if (!q) return true;
      const haystack = `${directory.name} ${directory.description} ${DIRECTORY_KIND_LABELS[directory.kind]} ${directory.siteUrl}`.toLowerCase();
      return haystack.includes(q);
    });

    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price') {
        const diff = priceRank[a.price] - priceRank[b.price];
        return diff !== 0 ? diff : b.dr - a.dr;
      }
      return b.dr - a.dr;
    });
  }, [baseDirectories, query, price, link, kind, minDr, sort]);

  const hasFilters = query.trim() !== '' || price !== 'all' || link !== 'all' || kind !== 'all' || minDr !== 0;
  const resetFilters = () => {
    setQuery('');
    setPrice('all');
    setLink('all');
    setKind('all');
    setMinDr(0);
  };

  const title = hub ? hub.title : `${DIRECTORIES.length} Product Directories Ranked by DR (2026)`;
  const description = hub
    ? hub.description
    : `A ranked list of ${DIRECTORIES.length} SaaS directories and launch platforms, with Domain Rating, price, link type, and step-by-step submission pages.`;

  useEffect(() => {
    const url = hub ? `/product-directory/${hub.slug}` : '/product-directory';
    return applyPageSeo({
      title: `${title} | TopSAAS`,
      description: description.slice(0, 157),
      canonical: url,
      jsonLdId: 'directories-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            '@id': `https://www.topsaas.space${url}#webpage`,
            url: `https://www.topsaas.space${url}`,
            name: title,
            description,
            inLanguage: 'en',
            dateModified: '2026-11-12',
            isPartOf: {
              '@type': 'WebSite',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space/',
            },
            publisher: {
              '@type': 'Organization',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space/',
            },
          },
          {
            '@type': 'ItemList',
            name: title,
            numberOfItems: baseDirectories.length,
            itemListElement: baseDirectories.map((directory, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: directory.name,
              url: `https://www.topsaas.space/product-directory/${directory.slug}`,
              description: directory.description,
            })),
          },
          {
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: { '@type': 'Answer', text: faq.a },
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.topsaas.space/' },
              { '@type': 'ListItem', position: 2, name: 'Product Directory', item: 'https://www.topsaas.space/product-directory' },
              ...(hub
                ? [{ '@type': 'ListItem', position: 3, name: hub.label, item: `https://www.topsaas.space/product-directory/${hub.slug}` }]
                : []),
            ],
          },
        ],
      },
    });
  }, [hub, title, description, baseDirectories]);

  const openDirectory = (directory: DirectoryEntry) => {
    playSound('click', soundEnabled);
    navigateTo(`/product-directory/${directory.slug}`);
  };

  const trackOutbound = () => {
    playSound('click', soundEnabled);
  };

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
        <GridPattern width={48} height={48} className="opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mint-200 bg-mint-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-mint-700">
              <Rocket className="h-3.5 w-3.5" />
              Launch distribution
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-neutral-950 sm:text-5xl">
              {hub ? hub.title.replace(' (2026)', '') : `${DIRECTORIES.length} product directories`}
              <span className="block text-mint-600">ranked by Domain Rating</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm font-medium leading-relaxed text-neutral-600 sm:text-base">
              {description} Use the filters to find free, dofollow, and niche listings that fit your product.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenSubmit();
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-neutral-800 sm:w-auto"
              >
                Submit your SaaS to TopSAAS
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#all-directories"
                onClick={() => playSound('click', soundEnabled)}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-bold text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-neutral-50 sm:w-auto"
              >
                Browse the list
                <ChevronDown className="h-4 w-4" />
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Directories', value: stats.total, icon: Layers },
                { label: 'Free to list', value: stats.freeToStart, icon: DollarSign },
                { label: 'Dofollow', value: stats.dofollow, icon: Link2 },
                { label: 'Median DR', value: stats.medianDr, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center shadow-2xs">
                  <Icon className="mx-auto h-4 w-4 text-neutral-400" />
                  <div className="mt-1 text-xl font-black font-mono-num text-neutral-950">{value}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hub links */}
      <section className="border-b border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-4 sm:px-6">
          <a
            href="/product-directory"
            onClick={(event) => {
              event.preventDefault();
              playSound('click', soundEnabled);
              navigateTo('/product-directory');
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
              !hub ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
            }`}
          >
            All directories
          </a>
          {DIRECTORY_HUBS.map((item) => (
            <a
              key={item.slug}
              href={`/product-directory/${item.slug}`}
              onClick={(event) => {
                event.preventDefault();
                playSound('click', soundEnabled);
                navigateTo(`/product-directory/${item.slug}`);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                hub?.slug === item.slug
                  ? 'border-neutral-950 bg-neutral-950 text-white'
                  : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {/* Filters + list */}
      <section id="all-directories" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xs sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search directories, categories, or domains"
                aria-label="Search directories"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm font-medium text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-mint-400 focus:ring-2 focus:ring-mint-500/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
              <label className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600">
                <Filter className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <select
                  value={price}
                  onChange={(event) => setPrice(event.target.value as 'all' | DirectoryPrice)}
                  aria-label="Filter by price"
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                >
                  <option value="all">Any price</option>
                  <option value="free">Free</option>
                  <option value="freemium">Freemium</option>
                  <option value="paid">Paid</option>
                </select>
              </label>

              <label className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <select
                  value={link}
                  onChange={(event) => setLink(event.target.value as 'all' | DirectoryLink)}
                  aria-label="Filter by link type"
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                >
                  <option value="all">Any link</option>
                  <option value="dofollow">Dofollow</option>
                  <option value="nofollow">Nofollow</option>
                  <option value="conditional">Conditional</option>
                  <option value="unknown">Unknown</option>
                </select>
              </label>

              <label className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600">
                <Layers className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as 'all' | DirectoryKind)}
                  aria-label="Filter by directory type"
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                >
                  <option value="all">Any type</option>
                  <option value="saas">SaaS directory</option>
                  <option value="startup">Startup directory</option>
                  <option value="ai">AI directory</option>
                  <option value="launch">Launch platform</option>
                </select>
              </label>

              <label className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600">
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <select
                  value={minDr}
                  onChange={(event) => setMinDr(Number(event.target.value) as 0 | 50 | 70 | 80)}
                  aria-label="Filter by Domain Rating"
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                >
                  <option value={0}>Any DR</option>
                  <option value={50}>DR 50+</option>
                  <option value={70}>DR 70+</option>
                  <option value={80}>DR 80+</option>
                </select>
              </label>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-500">
              Showing <span className="font-bold text-neutral-900">{filtered.length}</span> of {baseDirectories.length} directories
            </p>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                >
                  Reset filters
                </button>
              )}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                Sort
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="Sort directories"
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-bold text-neutral-800 outline-none"
                >
                  <option value="dr">Domain Rating</option>
                  <option value="name">Name A to Z</option>
                  <option value="price">Price</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-2xs md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-3 py-3 text-center">#</th>
                <th scope="col" className="px-3 py-3">Directory</th>
                <th scope="col" className="px-3 py-3 text-center">DR</th>
                <th scope="col" className="px-3 py-3">Price</th>
                <th scope="col" className="px-3 py-3">Link</th>
                <th scope="col" className="px-3 py-3">Type</th>
                <th scope="col" className="px-3 py-3 text-right">Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((directory) => (
                <tr key={directory.slug} className="group transition-colors hover:bg-neutral-50/70">
                  <td className="px-3 py-3 text-center text-xs font-bold font-mono-num text-neutral-400">{directory.rank}</td>
                  <td className="max-w-xs px-3 py-3">
                    <a
                      href={`/product-directory/${directory.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        openDirectory(directory);
                      }}
                      className="block"
                    >
                      <span className="text-sm font-bold text-neutral-950 transition-colors group-hover:text-mint-700">
                        {directory.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium leading-relaxed text-neutral-500 line-clamp-1">
                        {directory.description}
                      </span>
                    </a>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="inline-flex h-8 min-w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-1.5 text-xs font-black font-mono-num text-neutral-900">
                      {directory.dr}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={PRICE_STYLES[directory.price]}>{DIRECTORY_PRICE_LABELS[directory.price]}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={LINK_STYLES[directory.link]}>{DIRECTORY_LINK_LABELS[directory.link]}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={KIND_STYLES[directory.kind]}>{DIRECTORY_KIND_LABELS[directory.kind]}</Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <a
                      href={directory.submitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={trackOutbound}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
                    >
                      Visit
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-bold text-neutral-900">No directories match those filters.</p>
              <p className="mt-1 text-xs text-neutral-500">Try a broader search or reset the filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 rounded-lg bg-neutral-950 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>

        {/* Mobile cards */}
        <div className="mt-4 space-y-3 md:hidden">
          {filtered.map((directory) => (
            <article key={directory.slug} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <a
                  href={`/product-directory/${directory.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openDirectory(directory);
                  }}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono-num text-neutral-400">#{directory.rank}</span>
                    <h3 className="truncate text-sm font-bold text-neutral-950">{directory.name}</h3>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-neutral-500">
                    {directory.description}
                  </p>
                </a>
                <span className="inline-flex h-9 min-w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white px-1.5 text-sm font-black font-mono-num text-neutral-900">
                  {directory.dr}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge className={PRICE_STYLES[directory.price]}>{DIRECTORY_PRICE_LABELS[directory.price]}</Badge>
                <Badge className={LINK_STYLES[directory.link]}>{DIRECTORY_LINK_LABELS[directory.link]}</Badge>
                <Badge className={KIND_STYLES[directory.kind]}>{DIRECTORY_KIND_LABELS[directory.kind]}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={`/product-directory/${directory.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openDirectory(directory);
                  }}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                >
                  Submission guide
                </a>
                <a
                  href={directory.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackOutbound}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1 rounded-xl bg-neutral-950 px-3 text-xs font-bold text-white hover:bg-neutral-800"
                >
                  Submit
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-10 text-center">
              <p className="text-sm font-bold text-neutral-900">No directories match those filters.</p>
              <p className="mt-1 text-xs text-neutral-500">Try a broader search or reset the filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 rounded-lg bg-neutral-950 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* How to use */}
      <section className="border-y border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">How to use this list</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
              A directory listing is only useful when it reaches the right buyer. Work through the list in this order.
            </p>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              {
                title: 'Filter for fit first',
                body: 'Use the price, link, and type filters to find directories that accept your product. A niche AI directory can outperform a general SaaS directory with a higher DR.',
                icon: Filter,
              },
              {
                title: 'Prepare one listing kit',
                body: 'Use the same name, tagline, description, logo, and screenshots everywhere. Consistency makes approvals faster and keeps your brand recognizable across directories.',
                icon: Sparkles,
              },
              {
                title: 'Track what goes live',
                body: 'Open the submission guide for each directory, follow the steps, and record the date and status. Revisit listings that need verification or a follow-up email.',
                icon: ShieldCheck,
              },
            ].map(({ title: cardTitle, body, icon: Icon }) => (
              <div key={cardTitle} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-50 text-mint-700">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-neutral-950">{cardTitle}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-neutral-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="text-2xl font-black tracking-tight text-neutral-950">How we rank these directories</h2>
        <div className="mt-4 space-y-3 text-sm font-medium leading-relaxed text-neutral-600">
          <p>
            The list is sorted by <strong className="text-neutral-900">Ahrefs Domain Rating</strong>, the 0 to 100
            score for the strength of a site&apos;s backlink profile. DR is a useful shortcut, but it is not the only
            signal. A lower DR directory that your buyers actually read can send better traffic than a high DR site
            that nobody visits.
          </p>
          <p>
            Price and link type come from each directory&apos;s public submission page and can change without notice.
            The last review date is <strong className="text-neutral-900">{LAST_UPDATED}</strong>. Always confirm the
            current terms on the directory before you pay for a placement.
          </p>
          <p>
            We do not accept payment for a position in this list. Directory names and Domain Ratings are shown for
            research, and every link goes to the directory&apos;s own site.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-neutral-200 bg-neutral-50/60">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="text-2xl font-black tracking-tight text-neutral-950">Directory submission FAQ</h2>
          <div className="mt-5 space-y-4">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                <h3 className="text-sm font-bold text-neutral-950 sm:text-base">{faq.q}</h3>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-neutral-500 sm:text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <h2 className="text-2xl font-black tracking-tight text-neutral-950">Keep building</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'SaaS ideas', body: 'Browse open-source starter projects with health scores.', href: '/ideas' },
            { title: 'Build guides', body: 'Ship a real product on a curated open-source repo.', href: '/guides' },
            { title: 'MRR calculator', body: 'Model monthly recurring revenue and ARR.', href: '/mrr-calculator' },
            { title: 'Submit your SaaS', body: 'Get a free listing on the TopSAAS directory.', href: '/submit' },
          ].map((item) => (
            <a
              key={item.title}
              href={item.href}
              onClick={(event) => {
                event.preventDefault();
                playSound('click', soundEnabled);
                if (item.href === '/submit') {
                  onOpenSubmit();
                } else {
                  navigateTo(item.href);
                }
              }}
              className="group rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex items-center justify-between gap-2 text-sm font-bold text-neutral-950">
                {item.title}
                <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
              <span className="mt-1 block text-xs font-medium leading-relaxed text-neutral-500">{item.body}</span>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-neutral-950 px-6 py-10 text-center sm:px-10 sm:py-14">
          <GridPattern width={44} height={44} className="opacity-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Start with the directory that sends buyers</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-300">
              Submit your SaaS to TopSAAS for free. You get a crawlable product page, a spot in the weekly
              leaderboard, and a listing that real founders and buyers can upvote.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenSubmit();
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-mint-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-mint-600 sm:w-auto"
              >
                Submit your SaaS
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="/product-directory"
                onClick={(event) => {
                  event.preventDefault();
                  playSound('click', soundEnabled);
                  navigateTo('/product-directory');
                }}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Compare all directories
                <Globe2 className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-neutral-400">
              <CalendarDays className="h-3 w-3" />
              Last reviewed {LAST_UPDATED}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
