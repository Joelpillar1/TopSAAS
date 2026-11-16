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
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  LayoutGrid,
  List as ListIcon,
  CheckCircle2,
} from 'lucide-react';
import { applyPageSeo } from '../utils/pageSeo';
import { DIRECTORY_FAQS, directoryListJsonLd, directoryListSeo } from '../utils/directorySeo';
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
type ViewMode = 'table' | 'cards';

const LAST_UPDATED = 'November 15, 2026';

const PRICE_STYLES: Record<DirectoryPrice, string> = {
  free: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  freemium: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  paid: 'border-neutral-200 bg-neutral-50 text-neutral-600',
};

const LINK_STYLES: Record<DirectoryLink, string> = {
  dofollow: 'border-mint-200 bg-mint-50 text-mint-700',
  nofollow: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  conditional: 'border-amber-200 bg-amber-50 text-amber-700',
  unknown: 'border-neutral-200 bg-white text-neutral-500',
};

const KIND_STYLES: Record<DirectoryKind, string> = {
  saas: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  startup: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  ai: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  launch: 'border-neutral-200 bg-neutral-50 text-neutral-600',
};

const priceRank: Record<DirectoryPrice, number> = { free: 0, freemium: 1, paid: 2 };

const Badge: React.FC<{ children: React.ReactNode; className: string }> = ({ children, className }) => (
  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>
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
  const [viewMode, setViewMode] = useState<ViewMode>('table');

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

  const hasFilters =
    query.trim() !== '' ||
    price !== 'all' ||
    link !== 'all' ||
    kind !== 'all' ||
    minDr !== 0;

  const resetFilters = () => {
    setQuery('');
    setPrice('all');
    setLink('all');
    setKind('all');
    setMinDr(0);
  };

  const { title, description, canonical } = directoryListSeo(hub);

  useEffect(() => {
    return applyPageSeo({
      title,
      description,
      canonical,
      jsonLd: directoryListJsonLd(hub, filtered),
      jsonLdId: 'directory-list-jsonld',
    });
  }, [title, description, canonical, hub, filtered]);

  const openDirectory = (directory: DirectoryEntry) => {
    playSound('click', soundEnabled);
    navigateTo(`/product-directory/${directory.slug}`);
  };

  const trackOutbound = () => {
    playSound('click', soundEnabled);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-b from-neutral-50 via-white to-white py-12 sm:py-16">
        <GridPattern className="opacity-35" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/40 p-1 pr-3.5 text-xs shadow-2xs">
                <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                  Directory
                </span>
                <span className="font-semibold text-neutral-800 text-[12px]">
                  Verified 2026 Launch Index
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-950">
                {hub ? hub.title : `${baseDirectories.length}+ Best Startup Launch Directories`}
              </h1>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                {hub
                  ? hub.description
                  : 'Curated list of verified launch directories, review platforms, and communities to submit your software for dofollow backlinks, initial traffic, and domain rating.'}
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                  Checked {LAST_UPDATED}
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-mint-600" />
                  Tested submission URLs
                </span>
              </div>
            </div>

            {/* Metric pill counter cards */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Total Directories', value: stats.total, icon: Globe2 },
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

      {/* Filters + List / Cards View */}
      <section id="all-directories" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-8 sm:px-6 sm:py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-2xs sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
              <label className="flex h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-600">
                <Filter className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <select
                  value={price}
                  onChange={(event) => setPrice(event.target.value as 'all' | DirectoryPrice)}
                  aria-label="Filter by price"
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
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
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
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
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
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
                  className="w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none cursor-pointer"
                >
                  <option value={0}>Any DR</option>
                  <option value={50}>DR 50+</option>
                  <option value={70}>DR 70+</option>
                  <option value={80}>DR 80+</option>
                </select>
              </label>
            </div>
          </div>

          {/* Subheader: Results count, reset filters, View mode toggle, Sort */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-500">
              Showing <span className="font-bold text-neutral-900">{filtered.length}</span> of {baseDirectories.length} directories
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 cursor-pointer"
                >
                  Reset filters
                </button>
              )}

              {/* View Switcher: List vs Cards (Desktop) */}
              <div className="hidden sm:flex items-center rounded-lg border border-neutral-200 bg-neutral-100 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setViewMode('table');
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-neutral-950 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Table view"
                >
                  <ListIcon className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setViewMode('cards');
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-white text-neutral-950 shadow-2xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Cards view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                Sort
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="Sort directories"
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-bold text-neutral-800 outline-none cursor-pointer"
                >
                  <option value="dr">Domain Rating</option>
                  <option value="name">Name A to Z</option>
                  <option value="price">Price</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* View Mode: Table (Desktop) */}
        {viewMode === 'table' && (
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-2xs md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                <tr>
                  <th scope="col" className="px-3 py-3 text-center">#</th>
                  <th scope="col" className="px-3 py-3">Directory</th>
                  <th scope="col" className="px-3 py-3 text-center">DR</th>
                  <th scope="col" className="px-3 py-3">Link</th>
                  <th scope="col" className="px-3 py-3">Price</th>
                  <th scope="col" className="px-3 py-3">Type</th>
                  <th scope="col" className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((directory) => (
                  <tr key={directory.slug} className="group transition-colors hover:bg-neutral-50/70">
                    <td className="px-3 py-3 text-center text-xs font-bold font-mono-num text-neutral-400">
                      {directory.rank}
                    </td>
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
                      <span className="inline-flex h-8 min-w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-1.5 text-xs font-black font-mono-num text-neutral-900 shadow-2xs">
                        {directory.dr}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={LINK_STYLES[directory.link]}>
                        {DIRECTORY_LINK_LABELS[directory.link]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={PRICE_STYLES[directory.price]}>
                        {DIRECTORY_PRICE_LABELS[directory.price]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={KIND_STYLES[directory.kind]}>
                        {DIRECTORY_KIND_LABELS[directory.kind]}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <a
                        href={directory.submitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={trackOutbound}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-bold text-neutral-800 transition-colors hover:border-neutral-400 hover:bg-neutral-50 shadow-2xs"
                      >
                        Submit
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
                  className="btn-primary mt-3 rounded-lg px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* View Mode: Cards (Desktop and Mobile) */}
        <div className={`mt-4 ${viewMode === 'cards' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3 md:hidden'}`}>
          {filtered.map((directory) => (
            <article key={directory.slug} className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-neutral-300 transition-all">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={`/product-directory/${directory.slug}`}
                    onClick={(event) => {
                      event.preventDefault();
                      openDirectory(directory);
                    }}
                    className="min-w-0 flex-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold font-mono-num text-neutral-400">#{directory.rank}</span>
                      <h3 className="truncate text-sm sm:text-base font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
                        {directory.name}
                      </h3>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-relaxed text-neutral-500">
                      {directory.description}
                    </p>
                  </a>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="inline-flex h-8 min-w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white px-1.5 text-xs font-black font-mono-num text-neutral-900 shadow-2xs">
                      DR {directory.dr}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge className={PRICE_STYLES[directory.price]}>{DIRECTORY_PRICE_LABELS[directory.price]}</Badge>
                  <Badge className={LINK_STYLES[directory.link]}>{DIRECTORY_LINK_LABELS[directory.link]}</Badge>
                  <Badge className={KIND_STYLES[directory.kind]}>{DIRECTORY_KIND_LABELS[directory.kind]}</Badge>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-100">
                <a
                  href={`/product-directory/${directory.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    openDirectory(directory);
                  }}
                  className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3 text-xs font-bold text-neutral-800 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Submission Guide
                </a>
                <a
                  href={directory.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackOutbound}
                  className="btn-primary inline-flex min-h-[36px] flex-1 items-center justify-center gap-1 rounded-xl px-3 text-xs font-bold text-white transition-colors cursor-pointer shadow-2xs"
                >
                  Submit
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-neutral-200 bg-white px-5 py-10 text-center">
              <p className="text-sm font-bold text-neutral-900">No directories match those filters.</p>
              <p className="mt-1 text-xs text-neutral-500">Try a broader search or reset the filters.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-primary mt-3 rounded-lg px-3 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section className="border-t border-neutral-200 bg-neutral-50/60 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-black text-neutral-950">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-neutral-500">
              Common questions about submitting software to curated product directories.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            {DIRECTORY_FAQS.map((faq) => (
              <div key={faq.q} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
                <h3 className="text-sm font-bold text-neutral-950">{faq.q}</h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-neutral-600 font-normal">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
