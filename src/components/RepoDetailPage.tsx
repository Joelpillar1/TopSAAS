import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  GitFork,
  Github,
  BookOpen,
  Link2,
  Scale,
  Server,
  Share2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Star,
  Tag,
  CheckCircle2,
  XCircle,
  Terminal,
  Sparkles,
  DollarSign,
  Layers,
  Code2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  Rocket,
  Zap,
} from 'lucide-react';
import { CURATED_REPOS, CuratedRepo } from '../data/curatedRepos';
import { Product } from '../types';
import { RepoCard, getRepoAlternativeInfo } from './RepoCard';
import { formatStars } from '../utils/github';
import { getDeterministicBrandColor } from '../utils/brandColor';
import { plainCopy } from '../utils/plainCopy';
import {
  buildRepoEditorial,
  detectSelfHosted,
  repoCanonicalUrl,
  repoSeoDescription,
  repoSeoTitle,
} from '../utils/repoSeo';
import { computeHealth } from '../utils/repoHealth';
import { REPO_HEALTH, REPO_HEALTH_GENERATED_AT } from '../data/repoHealth';
import { getGuideForRepo } from '../data/buildGuides';
import { navigateTo } from '../utils/nav';
import { HealthScore, healthExplain } from './HealthScore';
import { timeAgo } from './ProductRow';
import { playSound } from '../utils/sound';
import { getHandpickedDossier, HandpickedRepoDossier } from '../data/handpickedRepos';
import { getLicenseSafety } from '../utils/licenseSafety';
import { getWebsiteFavicon } from '../utils/logo';
import { getIdeaBlueprint, StartupIdeaBlueprint } from '../data/ideaBlueprints';

/** Metadata pulled live from the GitHub API (rate-limited, cached, optional). */
interface RepoLiveMeta {
  description: string | null;
  topics: string[];
  license: string | null;
  openIssues: number | null;
  watchers: number | null;
  pushedAt: string | null;
  createdAt: string | null;
  homepage: string | null;
  defaultBranch: string | null;
  archived: boolean;
  visibility: string | null;
  stars: number | null;
  forks: number | null;
  version: string | null;
  versionDate: string | null;
  languages: Record<string, number>;
}

interface RepoDetailPageProps {
  repo?: CuratedRepo;
  repoId?: string;
  soundEnabled: boolean;
  onBack: () => void;
  onSelectRepo: (repo: CuratedRepo) => void;
  onOpenFeatured?: () => void;
  sponsors?: Product[];
  allProducts?: Product[];
  onSelectProduct?: (product: Product) => void;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenFeaturedSpotModal?: () => void;
}

export type RepoDetailTab = 'overview' | 'ideas' | 'tech' | 'license' | 'alternatives' | 'guide';

/* ───────────────────────── live-data cache ───────────────────────── */

const META_TTL = 30 * 60 * 1000; // 30 minutes
const META_STORE = 'topsaas_repo_meta_v4';
type CacheEntry = { t: number; m: RepoLiveMeta };
const metaCache = new Map<string, CacheEntry>();

try {
  const raw = sessionStorage.getItem(META_STORE);
  if (raw) {
    const parsed = JSON.parse(raw) as Record<string, CacheEntry>;
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v.t === 'number' && Date.now() - v.t < META_TTL) metaCache.set(k, v);
    }
  }
} catch { }

const getCachedMeta = (key: string): RepoLiveMeta | null => metaCache.get(key)?.m ?? null;

const setCachedMeta = (key: string, m: RepoLiveMeta) => {
  metaCache.set(key, { t: Date.now(), m });
  try {
    sessionStorage.setItem(META_STORE, JSON.stringify(Object.fromEntries(metaCache)));
  } catch { }
};

/** GitHub GET that resolves to null on rate-limit / network failure (never throws). */
const ghJson = <T,>(url: string): Promise<T | null> =>
  fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
    .catch(() => null);

/* ───────────────────────── misc helpers ───────────────────────── */

const languageBreakdown = (languages: Record<string, number>) => {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total <= 0) return [];
  return entries.slice(0, 6).map(([name, bytes]) => ({
    name,
    bytes,
    percent: Math.max(1, Math.round((bytes / total) * 100)),
  }));
};

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Java: '#b07219',
  'Jupyter Notebook': '#da5b0b',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Shell: '#89e051',
};

const languageColor = (name: string): string => LANGUAGE_COLORS[name] ?? '#71717a';

const formatIntoParagraphs = (text: string): string[] => {
  if (!text) return [];
  const parts = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) {
    return parts;
  }
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (sentences && sentences.length >= 3) {
    const midpoint = Math.ceil(sentences.length / 2);
    const p1 = sentences.slice(0, midpoint).join(' ').trim();
    const p2 = sentences.slice(midpoint).join(' ').trim();
    if (p1 && p2) return [p1, p2];
  }
  return [text];
};

/* ───────────────────────── page ───────────────────────── */

const REPO_ALIASES: Record<string, string> = {
  'tradecatlabs/vibe-coding-cn': '2025Emma/vibe-coding-cn',
  'zoicware/removewindowsai': 'usefam1/RemoveWindowsAI',
};

export const RepoDetailPage: React.FC<RepoDetailPageProps> = ({
  repo: propRepo,
  repoId,
  soundEnabled,
  onBack,
  onSelectRepo,
}) => {
  const normalizedRepoId = repoId
    ? (REPO_ALIASES[repoId.toLowerCase()] || repoId)
    : null;

  const repo =
    propRepo ||
    (normalizedRepoId
      ? CURATED_REPOS.find((r) => r.full_name.toLowerCase() === normalizedRepoId.toLowerCase())
      : null);

  useEffect(() => {
    if (repo && repoId && repo.full_name.toLowerCase() !== repoId.toLowerCase()) {
      try {
        window.history.replaceState({}, repo.name, `/repo/${repo.full_name}`);
      } catch { }
    }
  }, [repo, repoId]);

  if (!repo) {
    return (
      <div className="min-h-[60vh] bg-white text-neutral-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <h2 className="text-base font-semibold text-neutral-900">Repository not found</h2>
          <p className="text-xs text-neutral-500">
            This repository may have been moved or removed from the directory.
          </p>
          <button
            onClick={onBack}
            className="mt-2 rounded-lg bg-white border border-neutral-300 text-neutral-900 px-3.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-neutral-50"
          >
            Back to SaaS Ideas
          </button>
        </div>
      </div>
    );
  }

  const ownerLogin =
    repo.owner?.login || (repo.full_name ? repo.full_name.split('/')[0] : 'maintainer');
  const ownerAvatar = repo.owner?.avatar_url || `https://github.com/${ownerLogin}.png`;
  const [live, setLive] = useState<RepoLiveMeta | null>(() => getCachedMeta(repo.full_name));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RepoDetailTab>('overview');
  const [expandedIdeas, setExpandedIdeas] = useState<Record<string, boolean>>(() => ({ '0': true }));

  const tabsRef = useRef<HTMLDivElement>(null);
  const prevTabRef = useRef<RepoDetailTab>(activeTab);

  /**
   * Find the element that actually scrolls the page content.
   *
   * On desktop the repo page lives inside the center column, which has
   * xl:overflow-y-auto, so the document itself does not scroll. On smaller
   * screens the document scrolls instead. Always target the real container.
   */
  const getScrollParent = (element: HTMLElement | null): HTMLElement | null => {
    let scroller = element?.parentElement ?? null;
    while (scroller) {
      const style = window.getComputedStyle(scroller);
      const scrollable = /(auto|scroll)/.test(style.overflowY);
      if (scrollable && scroller.scrollHeight > scroller.clientHeight + 1) return scroller;
      scroller = scroller.parentElement;
    }
    return null;
  };

  /**
   * Jump the document to a position without the global smooth scrolling
   * (html.scroll-smooth), which would otherwise turn the jump into a slow
   * drift that looks like the tab resumed halfway down.
   */
  const jumpWindowTo = (top: number) => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    try {
      window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
    } catch {
      window.scrollTo(0, Math.max(0, top));
    } finally {
      if (previousBehavior) root.style.scrollBehavior = previousBehavior;
      else root.style.removeProperty('scroll-behavior');
    }
  };

  /**
   * Put the newly selected tab back at the top of the visible area.
   * The tab bar is sticky, so measure against a zero-height marker that sits
   * just above it in normal flow.
   */
  const scrollTabsToTop = () => {
    const anchor = tabsRef.current;
    if (!anchor) return;

    const scroller = getScrollParent(anchor);
    if (scroller) {
      const delta = anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      const next = Math.max(0, scroller.scrollTop + delta);
      try {
        scroller.scrollTo({ top: next, behavior: 'instant' });
      } catch {
        scroller.scrollTop = next;
      }
      return;
    }

    jumpWindowTo(anchor.getBoundingClientRect().top + window.scrollY);
  };

  // A different repo (remounted through key={repoRouteId}) always starts at the
  // very top of the page.
  useLayoutEffect(() => {
    const scroller = getScrollParent(tabsRef.current);
    if (scroller) {
      scroller.scrollTop = 0;
    }
    jumpWindowTo(0);
  }, [repo.full_name]);

  // Secondary scroll-to-top after paint to ensure lazy-loaded chunks or mobile window
  // start at the beginning of the page.
  useEffect(() => {
    jumpWindowTo(0);
    const scroller = getScrollParent(tabsRef.current);
    if (scroller) {
      scroller.scrollTop = 0;
    }
  }, [repo.full_name]);

  // Only scroll tabs to top if the user manually switched tabs AND was scrolled below the tabs
  useLayoutEffect(() => {
    if (prevTabRef.current === activeTab) {
      return;
    }
    prevTabRef.current = activeTab;

    // Check if the user is already scrolled past the tabs
    const anchor = tabsRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      if (rect.top < 60) {
        scrollTabsToTop();
      }
    }
  }, [activeTab]);

  const toggleIdea = (idOrIndex: string) => {
    setExpandedIdeas((prev) => ({
      ...prev,
      [idOrIndex]: !prev[idOrIndex],
    }));
  };

  // Handpicked SaaS dossier (if curated)
  const dossier: HandpickedRepoDossier | undefined = getHandpickedDossier(repo.full_name);

  // Alternative detection (replaces X)
  const altInfo = dossier?.replaces
    ? {
      target: dossier.replaces.name,
      allReplaces: dossier.replaces.allReplaces,
      domain: dossier.replaces.domain,
      pricing: dossier.replaces.pricing,
    }
    : getRepoAlternativeInfo(repo);

  // Curated peer repos in the same category
  const peers = CURATED_REPOS.filter((r) => r.category === repo.category);
  const peerRank =
    peers
      .slice()
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .findIndex((r) => r.full_name === repo.full_name) + 1;

  // Self-hosted heuristic
  const selfHosted = detectSelfHosted(live?.topics ?? [], live?.description || repo.description);

  // Static fallback editorial write-up
  const editorial = buildRepoEditorial(
    repo,
    { topics: live?.topics, license: live?.license || dossier?.licenseSpdx || null },
    {
      stars: live?.stars ?? repo.stargazers_count,
      forks: live?.forks ?? repo.forks_count,
      rank: peerRank > 0 ? peerRank : 1,
      peerCount: peers.length,
      selfHosted,
    }
  );

  // Background fetch live GitHub API metadata
  useEffect(() => {
    let cancelled = false;

    ghJson<Record<string, unknown>>(`https://api.github.com/repos/${repo.full_name}`)
      .then((core) => {
        if (cancelled || !core || !core.full_name) return;
        const license = core.license as { spdx_id?: string } | undefined;
        const base: RepoLiveMeta = {
          description: typeof core.description === 'string' ? core.description : null,
          topics: Array.isArray(core.topics) ? (core.topics as string[]) : [],
          license:
            license?.spdx_id && license.spdx_id !== 'NOASSERTION' ? license.spdx_id : null,
          openIssues:
            typeof core.open_issues_count === 'number' ? core.open_issues_count : null,
          watchers:
            typeof core.subscribers_count === 'number' ? core.subscribers_count : null,
          pushedAt: typeof core.pushed_at === 'string' ? core.pushed_at : null,
          createdAt: typeof core.created_at === 'string' ? core.created_at : null,
          homepage:
            typeof core.homepage === 'string' && core.homepage ? core.homepage : null,
          defaultBranch:
            typeof core.default_branch === 'string' ? core.default_branch : null,
          archived: Boolean(core.archived),
          visibility: typeof core.visibility === 'string' ? core.visibility : null,
          stars: typeof core.stargazers_count === 'number' ? core.stargazers_count : null,
          forks: typeof core.forks_count === 'number' ? core.forks_count : null,
          version: null,
          versionDate: null,
          languages: {},
        };
        if (!cancelled) setLive(base);

        Promise.allSettled([
          ghJson<Record<string, number>>(
            `https://api.github.com/repos/${repo.full_name}/languages`
          ),
          ghJson<Record<string, unknown>>(
            `https://api.github.com/repos/${repo.full_name}/releases/latest`
          ),
        ]).then(([langRes, relRes]) => {
          if (cancelled) return;
          const rel = relRes.status === 'fulfilled' ? relRes.value : null;
          const merged: RepoLiveMeta = {
            ...base,
            languages:
              langRes.status === 'fulfilled' && langRes.value ? langRes.value : {},
            version:
              rel && typeof rel.tag_name === 'string' && rel.tag_name ? rel.tag_name : null,
            versionDate:
              rel && typeof rel.published_at === 'string' ? rel.published_at : null,
          };
          setLive(merged);
          setCachedMeta(repo.full_name, merged);
        });
      })
      .catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [repo.full_name]);

  const description = plainCopy(live?.description || repo.description);
  const stars = live?.stars ?? repo.stargazers_count;
  const forks = live?.forks ?? repo.forks_count;
  const cloneUrl = `https://github.com/${repo.full_name}.git`;
  const pageUrl = repoCanonicalUrl(repo.full_name);
  const topics = live?.topics && live.topics.length > 0 ? live.topics : null;
  const breakdown = languageBreakdown(live?.languages ?? {});

  // Health score calculation
  const healthSignals =
    live && live.pushedAt && live.createdAt
      ? {
        pushedAt: live.pushedAt,
        createdAt: live.createdAt,
        stars,
        forks,
        openIssues: live.openIssues ?? 0,
        license: live.license,
        archived: live.archived,
        topics: live.topics.length,
      }
      : REPO_HEALTH[repo.full_name] ?? null;
  const health = healthSignals ? computeHealth(healthSignals) : null;

  // License Safety determination. Curated dossiers know about non-SPDX terms
  // that the GitHub API reports as NOASSERTION, so prefer the dossier value.
  const rawLicense = dossier?.licenseSpdx || live?.license || healthSignals?.license || null;
  const safety = getLicenseSafety(rawLicense, { isOpenCore: dossier?.isOpenCore });

  // Activity timestamps
  const releaseTag = live?.version || null;
  const lastCommit = live?.pushedAt || healthSignals?.pushedAt || null;
  const buildGuide = getGuideForRepo(repo.full_name);

  // Navigation Tabs matching screenshot structure
  const TABS: Array<{ id: RepoDetailTab; label: string; badge?: number | string }> = [
    { id: 'overview', label: 'Overview' },
    ...(dossier && dossier.buildable !== false && dossier.ideas.length > 0
      ? [{ id: 'ideas' as const, label: 'SaaS Ideas', badge: dossier.ideas.length }]
      : []),
    { id: 'tech', label: 'Tech stack' },
    { id: 'license', label: 'License' },
    ...(dossier?.commercialAlternatives && dossier.commercialAlternatives.length > 0
      ? [{ id: 'alternatives' as const, label: 'Alternatives' }]
      : []),
    ...(buildGuide ? [{ id: 'guide' as const, label: 'Guide' }] : []),
  ];

  // SEO document title & JSON-LD
  useEffect(() => {
    const title = repoSeoTitle(repo);
    const desc = repoSeoDescription(repo);
    const prevTitle = document.title;
    document.title = title;

    const patches: Array<{ el: Element; attr: string; prev: string | null }> = [];
    const setMeta = (sel: string, attr: string, val: string) => {
      let el = document.querySelector(sel);
      if (!el) {
        el = document.createElement('meta');
        if (sel.startsWith('meta[name=')) {
          const m = sel.match(/name="([^"]+)"/);
          if (m) el.setAttribute('name', m[1]);
        } else if (sel.startsWith('meta[property=')) {
          const m = sel.match(/property="([^"]+)"/);
          if (m) el.setAttribute('property', m[1]);
        }
        document.head.appendChild(el);
        patches.push({ el, attr, prev: null });
      } else {
        patches.push({ el, attr, prev: el.getAttribute(attr) });
      }
      el.setAttribute(attr, val);
    };

    const setLink = (rel: string, val: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
        patches.push({ el, attr: 'href', prev: null });
      } else {
        patches.push({ el, attr: 'href', prev: el.getAttribute('href') });
      }
      el.setAttribute('href', val);
    };

    setMeta('meta[name="description"]', 'content', desc);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    setLink('canonical', pageUrl);
    setMeta('meta[name="twitter:url"]', 'content', pageUrl);
    setMeta('meta[property="og:type"]', 'content', 'article');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', desc);

    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': ['Product', 'SoftwareSourceCode'],
      name: repo.name,
      description,
      codeRepository: repo.html_url,
      url: pageUrl,
      author: {
        '@type': 'Organization',
        name: ownerLogin,
      },
      brand: {
        '@type': 'Brand',
        name: ownerLogin,
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    };
    if (repo.language) ld.programmingLanguage = repo.language;
    if (rawLicense) ld.license = rawLicense;
    const ldEl = document.createElement('script');
    ldEl.type = 'application/ld+json';
    ldEl.id = 'repo-jsonld';
    ldEl.textContent = JSON.stringify(ld);
    document.head.appendChild(ldEl);

    return () => {
      document.title = prevTitle;
      for (const p of patches) {
        if (p.prev === null) p.el.removeAttribute(p.attr);
        else p.el.setAttribute(p.attr, p.prev);
      }
      ldEl.remove();
    };
  }, [repo.name, repo.full_name, repo.html_url, ownerLogin, repo.language, repo.category, description, rawLicense]);

  const copyText = (key: string, text: string) => {
    playSound('click', soundEnabled);
    try {
      navigator.clipboard.writeText(text);
    } catch { }
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 2000);
  };

  // Similar repos
  const relatedRepos = (() => {
    const byStars = (a: CuratedRepo, b: CuratedRepo) => b.stargazers_count - a.stargazers_count;
    const sameCategory = peers.filter((r) => r.full_name !== repo.full_name).slice(0, 3);
    const picked = new Set(sameCategory.map((r) => r.full_name));
    const filler = CURATED_REPOS.filter(
      (r) => r.full_name !== repo.full_name && !picked.has(r.full_name)
    ).sort(byStars);
    return [...sameCategory, ...filler].slice(0, 3);
  })();

  // Detailed overview & alternatives fields (curated or dynamic fallback)
  const problemItSolves =
    dossier?.problemItSolves ||
    (altInfo
      ? `Proprietary products in ${repo.category} (such as ${altInfo.target}) charge high monthly subscriptions, enforce rigid feature gates, and retain total control over your customer data. For founders, building on proprietary stacks introduces platform risk and compresses software profit margins.`
      : `Building solutions in ${repo.category} from scratch consumes weeks of engineering on commodity infrastructure rather than unique product value.`);

  const solution =
    dossier?.solution ||
    editorial.lead;

  const whoItsForList =
    dossier?.whoItsFor && dossier.whoItsFor.length > 0
      ? dossier.whoItsFor
      : [
          `Founders & solo developers building modern applications in ${repo.category}`,
          `Agencies delivering custom software solutions without ongoing per-seat client license fees`,
          `Engineering teams utilizing ${repo.language || 'modern web stacks'} who prioritize codebase sovereignty`,
          `Privacy-focused businesses and organizations requiring full control over data residency`,
        ];

  const featuresList =
    dossier?.features && dossier.features.length > 0
      ? dossier.features
      : editorial.capabilities.map((c) => ({
          title: c.title,
          description: c.body,
        }));

  const commercialAlternativesList =
    dossier?.commercialAlternatives && dossier.commercialAlternatives.length > 0
      ? dossier.commercialAlternatives
      : altInfo
      ? [
          {
            name: altInfo.target,
            domain: altInfo.domain || '',
            pricing:
              'pricing' in altInfo && altInfo.pricing
                ? String(altInfo.pricing)
                : 'Commercial proprietary subscription',
            description: `The standard commercial proprietary solution in ${repo.category}.`,
            whyReplace: `Requires ongoing subscription licensing fees and restricts codebase modification.`,
          },
        ]
      : [];

  // License-aware commercial rights. Never promise a right the license does
  // not grant, especially for copyleft and source-available projects.
  type CommercialRightState = 'yes' | 'conditional' | 'no';
  const hasRecognizedLicense = Boolean(rawLicense);
  const commercialRights: Array<{
    icon: typeof DollarSign;
    title: string;
    state: CommercialRightState;
    body: string;
  }> = (() => {
    if (!hasRecognizedLicense) {
      const body =
        'No recognized license was detected for this repository. Without an explicit license, default copyright applies and you cannot legally host, modify, or resell this code until the author grants permission.';
      return [
        { icon: DollarSign, title: 'Sell as Hosted SaaS', state: 'no' as const, body },
        { icon: Code2, title: 'Codebase Modifications', state: 'no' as const, body },
        { icon: Tag, title: 'White-Labeling & Rebranding', state: 'no' as const, body },
      ];
    }

    if (safety.tier === 'restricted') {
      return [
        {
          icon: DollarSign,
          title: 'Sell as Hosted SaaS',
          state: 'no' as const,
          body: 'Source-available terms (SSPL, BUSL, Elastic or similar) restrict offering this software as a hosted or managed service. Do not launch a paid cloud version without written permission or a commercial agreement.',
        },
        {
          icon: Code2,
          title: 'Codebase Modifications',
          state: 'conditional' as const,
          body: 'The source is visible, but commercial use and modification can be limited by the license. Read the exact terms before changing or distributing the code.',
        },
        {
          icon: Tag,
          title: 'White-Labeling & Rebranding',
          state: 'no' as const,
          body: 'Rebranding and resale are not granted by source-available licenses. Treat the product name, brand, and code as the vendor’s property.',
        },
      ];
    }

    if (safety.tier === 'conditional') {
      const hosted = safety.isAgpl
        ? 'Hosting is allowed, but AGPL-3.0 requires you to offer the complete modified source to everyone who uses your hosted service. Plan for that disclosure before launch.'
        : dossier?.isOpenCore
        ? 'The open-source core can be hosted commercially, but enterprise folders or editions may carry separate terms. Check the repository LICENSE and any /ee or commercial license before charging.'
        : safety.isCopyleft
        ? 'Hosting is allowed. If you distribute modified builds, you must share the source under the same copyleft license; MPL and LGPL only cover the files you changed.'
        : 'The license allows commercial hosting, but custom terms may apply. Confirm the exact grant in the LICENSE file before charging customers.';
      return [
        { icon: DollarSign, title: 'Sell as Hosted SaaS', state: 'conditional' as const, body: hosted },
        {
          icon: Code2,
          title: 'Codebase Modifications',
          state: 'conditional' as const,
          body: safety.isAgpl
            ? 'Modifications are allowed, but if you host the modified software you must publish the complete corresponding source under AGPL-3.0.'
            : safety.isCopyleft
            ? 'You can modify the code, but distributed changes must stay under the same license. Keep proprietary logic in separate services where the license permits it.'
            : 'Modifications are allowed under the core license, but separately licensed or enterprise components may not be modifiable.',
        },
        {
          icon: Tag,
          title: 'White-Labeling & Rebranding',
          state: 'conditional' as const,
          body: 'Rebranding is generally allowed if you keep the original copyright notices and publish source when the copyleft license requires it. Do not imply endorsement by the original project.',
        },
      ];
    }

    return [
      {
        icon: DollarSign,
        title: 'Sell as Hosted SaaS',
        state: 'yes' as const,
        body: 'You can charge subscription fees to host this software or package it as a cloud product without paying royalties to the author.',
      },
      {
        icon: Code2,
        title: 'Codebase Modifications',
        state: 'yes' as const,
        body: 'Closed-source modifications are allowed. You can add proprietary features, UI changes, and custom database schemas privately.',
      },
      {
        icon: Tag,
        title: 'White-Labeling & Rebranding',
        state: 'yes' as const,
        body: 'You can rebrand the dashboard with your own logo, color palette, and custom domain. Preserve the original copyright notice in repo headers.',
      },
    ];
  })();

  const rightStateStyles: Record<
    CommercialRightState,
    { icon: typeof CheckCircle2; label: string; className: string }
  > = {
    yes: { icon: CheckCircle2, label: 'Allowed', className: 'text-emerald-600' },
    conditional: { icon: AlertTriangle, label: 'Conditions apply', className: 'text-amber-600' },
    no: { icon: XCircle, label: 'Not allowed', className: 'text-rose-600' },
  };

  return (
    <div className="w-full bg-white text-neutral-900 flex flex-col font-sans">
      {/* Main Single-Column Document Container */}
      <main className="mx-auto w-full max-w-4xl px-4 pt-3 sm:pt-5 pb-8 sm:px-6 space-y-6 flex-1">
        {/* Unified Breadcrumb + Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap min-w-0">
            <a
              href="/"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                playSound('click', soundEnabled);
                navigateTo('/');
              }}
              className="hover:text-neutral-950 transition-colors cursor-pointer"
            >
              Home
            </a>
            <span className="text-neutral-300 select-none">/</span>
            <a
              href="/ideas"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                playSound('click', soundEnabled);
                onBack();
              }}
              className="hover:text-neutral-950 transition-colors cursor-pointer"
            >
              SaaS Ideas
            </a>
            <span className="text-neutral-300 select-none">/</span>
            <span className="font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[320px]">
              {repo.name}
            </span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => copyText('page', pageUrl)}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {copiedKey === 'page' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Share2 className="h-3.5 w-3.5 text-neutral-400" />
              )}
              <span>{copiedKey === 'page' ? 'Copied' : 'Share'}</span>
            </button>

            <a
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
        {/* Header Section */}
        <header className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
              <img
                src={ownerAvatar}
                alt={ownerLogin}
                width={56}
                height={56}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                  {repo.name}
                </h1>
                {dossier?.reviewed && (
                  <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200">
                    Curated Dossier
                  </span>
                )}
                {live?.archived && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                {repo.full_name}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-base text-neutral-700 leading-relaxed max-w-3xl">
            {description}
          </p>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {altInfo && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-neutral-800 font-medium">
                {altInfo.domain && (
                  <img
                    src={getWebsiteFavicon(altInfo.domain, 16)}
                    alt=""
                    className="h-3.5 w-3.5 rounded shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
                <span>
                  Replaces <strong className="font-semibold text-neutral-950">{altInfo.target}</strong>
                </span>
              </span>
            )}

            <span className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 font-medium">
              {repo.category}
            </span>

            {repo.language && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 font-medium">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: languageColor(repo.language) }}
                />
                {repo.language}
              </span>
            )}

            {selfHosted && (
              <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 font-medium">
                <Server className="h-3 w-3 text-neutral-400" />
                Self-hostable
              </span>
            )}

            {live?.homepage && (
              <a
                href={live.homepage}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('click', soundEnabled)}
                className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 transition-colors font-medium"
              >
                <Link2 className="h-3 w-3 text-neutral-400" />
                <span>{live.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
              </a>
            )}
          </div>
        </header>

        {/* Trust Data Strip */}
        <section className="rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-3 sm:p-4 text-xs text-neutral-600 shadow-2xs">
          {/* Mobile Layout (sm:hidden): Clean structured cards */}
          <div className="sm:hidden space-y-2.5">
            {/* Row 1: Stars & Forks in clean stat tiles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-2xs">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-950 font-mono-num leading-tight">
                    {stars.toLocaleString()}
                  </div>
                  <div className="text-[10.5px] font-medium text-neutral-400">stars</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white p-2.5 shadow-2xs">
                <GitFork className="h-4 w-4 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-neutral-950 font-mono-num leading-tight">
                    {forks.toLocaleString()}
                  </div>
                  <div className="text-[10.5px] font-medium text-neutral-400">forks</div>
                </div>
              </div>
            </div>

            {/* Row 2: License & Health in a divided box */}
            <div className="rounded-xl border border-neutral-200/80 bg-white divide-y divide-neutral-100 overflow-hidden shadow-2xs text-xs">
              {/* License Row */}
              <div className="p-2.5 flex items-center justify-between gap-2" title={safety.plainExplanation}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${safety.colorClasses.dotBg}`} />
                  <span className="font-semibold text-neutral-900 truncate text-[11.5px]">{safety.badgeLabel}</span>
                </div>
                <span className="font-mono text-[10px] font-medium text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
                  {safety.spdxId}
                </span>
              </div>

              {/* Health Row */}
              {health && (
                <div className="p-2.5 flex items-center justify-between gap-2">
                  <span className="text-neutral-500 font-medium text-[11.5px]">Repo Health</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-neutral-900 font-mono-num text-[11.5px]">{health.score}/100</span>
                    <span className="text-[10px] font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200/70 px-1.5 py-0.5 rounded">
                      Grade {health.band}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Activity */}
            {lastCommit && (
              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-0.5">
                <span>Pushed {timeAgo(new Date(lastCommit).getTime())}</span>
              </div>
            )}
          </div>

          {/* Desktop Layout (hidden sm:flex): Wide single-line strip */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-y-3 gap-x-6">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                <span className="font-semibold text-neutral-900 font-mono-num">
                  {stars.toLocaleString()}
                </span>
                <span className="text-neutral-400 text-[11px]">stars</span>
              </div>

              <div className="flex items-center gap-1.5">
                <GitFork className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-semibold text-neutral-900 font-mono-num">
                  {forks.toLocaleString()}
                </span>
                <span className="text-neutral-400 text-[11px]">forks</span>
              </div>

              <div className="flex items-center gap-1.5" title={safety.plainExplanation}>
                <span className={`h-1.5 w-1.5 rounded-full ${safety.colorClasses.dotBg}`} />
                <span className="font-medium text-neutral-800">{safety.badgeLabel}</span>
                <span className="text-neutral-400 font-mono text-[10px]">({safety.spdxId})</span>
              </div>

              {health && (
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-400">Health:</span>
                  <span className="font-semibold text-neutral-900 font-mono-num">
                    {health.score}/100
                  </span>
                  <span className="text-neutral-400 text-[11px]">(Grade {health.band})</span>
                </div>
              )}
            </div>

            {lastCommit && (
              <div className="flex items-center gap-4 text-[11px] text-neutral-400 ml-auto sm:ml-0">
                <span>Pushed {timeAgo(new Date(lastCommit).getTime())}</span>
              </div>
            )}
          </div>
        </section>

        {/* Zero-height marker used to measure the real top of the tab panel.
            The tab bar itself is sticky, so its own rect is pinned to the top
            once the user scrolls and cannot be used as the scroll anchor. */}
        <div ref={tabsRef} className="h-0" aria-hidden="true" />

        {/* ── Sub-Navigation Tabs (Clean App Theme - non-sticky on mobile for clean scrolling) ── */}
        <div className="relative xl:sticky xl:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-neutral-200 -mx-4 px-4 sm:-mx-6 sm:px-6">
          <nav className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar" aria-label="Sections">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setActiveTab(tab.id);
                  }}
                  className={`relative py-3.5 text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? 'font-bold text-neutral-950'
                      : 'font-medium text-neutral-500 hover:text-neutral-950'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                        active
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}

                  {/* Clean active indicator underline matching TopSAAS brand */}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-neutral-950 transition-opacity ${
                      active ? 'opacity-100' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Tab Content Views ── */}

        {/* TAB 1: OVERVIEW */}
        <div hidden={activeTab !== 'overview'} className="animate-fadeIn">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-10">
            {/* The Opportunity Overview (TL;DR) */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Opportunity Overview
              </h2>
              <p className="text-base text-neutral-800 leading-relaxed font-normal">
                {dossier ? dossier.summary : editorial.lead}
              </p>

              {/* Highlight prompt to SaaS Ideas */}
              {dossier && dossier.ideas.length > 0 && (
                <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div className="text-neutral-700">
                    <strong>Top opportunity:</strong> {dossier.ideas[0].title} ({dossier.ideas[0].howToCharge})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setActiveTab('ideas');
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline cursor-pointer shrink-0"
                  >
                    <span>Explore all {dossier.ideas.length} ideas</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </section>

            {/* Problem & Solution Breakdown (Vertical Stack, Unframed) */}
            <section className="space-y-8 pt-6 border-t border-neutral-100">
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-neutral-950 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span>The Problem It Solves</span>
                </h3>
                <div className="space-y-3">
                  {formatIntoParagraphs(problemItSolves).map((p, idx) => (
                    <p key={idx} className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-neutral-100">
                <h3 className="text-base sm:text-lg font-bold text-neutral-950 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>The Solution &amp; Opportunity</span>
                </h3>
                <div className="space-y-3">
                  {formatIntoParagraphs(solution).map((p, idx) => (
                    <p key={idx} className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            </section>

            {/* Who It's For Personas (Vertical List, Unframed) */}
            <section className="space-y-3 pt-6 border-t border-neutral-100">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                Who It's For
              </h2>
              <ul className="space-y-2.5">
                {whoItsForList.map((persona, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-neutral-700 leading-relaxed">
                    <span className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0 ring-4 ring-blue-50" />
                    <span>{persona}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Core Features (Vertical List, Unframed) */}
            {featuresList.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-neutral-100">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  Core Platform Features
                </h2>
                <ul className="space-y-4">
                  {featuresList.map((feat, i) => (
                    <li key={i} className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-neutral-950 flex items-baseline gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {String(i + 1).padStart(2, '0')}.
                        </span>
                        <span>{feat.title}</span>
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed pl-6">
                        {feat.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Founder Fit Evaluation (Vertical Stack, Unframed) */}
            {dossier && (
              <section className="space-y-6 pt-6 border-t border-neutral-100">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  Founder Fit Evaluation
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Good fit if</span>
                  </div>
                  <ul className="space-y-2.5">
                    {dossier.goodFitIf.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700 leading-relaxed">
                        <span className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0 ring-4 ring-blue-50" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-800">
                    <XCircle className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span>Skip if</span>
                  </div>
                  <ul className="space-y-2.5">
                    {dossier.skipIf.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700 leading-relaxed">
                        <span className="h-2 w-2 rounded-full bg-neutral-400 mt-2 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Developer Quick Start */}
            <section className="space-y-3 pt-6 border-t border-neutral-100">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  Quick Start
                </h2>
                <span className="text-xs sm:text-sm text-neutral-500">README instructions</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200/80">
                  <code className="truncate text-neutral-800 font-mono font-medium">
                    {dossier?.quickStart.clone || `git clone ${repo.html_url}.git`}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        'cmd-clone',
                        dossier?.quickStart.clone || `git clone ${repo.html_url}.git`
                      )
                    }
                    className="text-xs font-sans font-medium text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer shrink-0 px-2 py-0.5 rounded hover:bg-neutral-200/60"
                  >
                    {copiedKey === 'cmd-clone' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {dossier?.quickStart.install && (
                  <div className="flex items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200/80">
                    <code className="truncate text-neutral-800 font-mono font-medium">{dossier.quickStart.install}</code>
                    <button
                      type="button"
                      onClick={() => copyText('cmd-install', dossier.quickStart.install || '')}
                      className="text-xs font-sans font-medium text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer shrink-0 px-2 py-0.5 rounded hover:bg-neutral-200/60"
                    >
                      {copiedKey === 'cmd-install' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {dossier?.quickStart.run && (
                  <div className="flex items-center justify-between gap-3 bg-neutral-50 p-3 rounded-lg border border-neutral-200/80">
                    <code className="truncate text-neutral-800 font-mono font-medium">{dossier.quickStart.run}</code>
                    <button
                      type="button"
                      onClick={() => copyText('cmd-run', dossier.quickStart.run || '')}
                      className="text-xs font-sans font-medium text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer shrink-0 px-2 py-0.5 rounded hover:bg-neutral-200/60"
                    >
                      {copiedKey === 'cmd-run' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                )}

                {dossier?.quickStart.notes && (
                  <div className="text-xs font-sans text-neutral-500 pt-1">
                    Note: {dossier.quickStart.notes}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* TAB 2: SAAS IDEAS */}
        {dossier && (
          <div hidden={activeTab !== 'ideas'} className="space-y-6 animate-fadeIn">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-neutral-100 pb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  SaaS Opportunity Blueprints for {repo.name}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Battle-tested startup concepts you can build and monetize on top of this codebase. Evaluated with 20-year operator diligence.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-neutral-400 font-medium font-mono-num">
                  {dossier.ideas.length} blueprints
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const allExpanded = dossier.ideas.every((idea, i) => expandedIdeas[idea.id || String(i)]);
                    const next = !allExpanded;
                    const nextMap: Record<string, boolean> = {};
                    dossier.ideas.forEach((idea, i) => {
                      nextMap[idea.id || String(i)] = next;
                    });
                    setExpandedIdeas(nextMap);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer shadow-xs"
                >
                  {dossier.ideas.every((idea, i) => expandedIdeas[idea.id || String(i)]) ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List of Interactive Cards */}
            <div className="space-y-4">
              {dossier.ideas.map((idea, idx) => {
                const ideaKey = idea.id || String(idx);
                const isExpanded = !!expandedIdeas[ideaKey];
                const blueprint = getIdeaBlueprint(repo.full_name, ideaKey, idea);
                const ideaTintColor = getDeterministicBrandColor(idea.title || repo.name);

                return (
                  <div
                    key={ideaKey}
                    className="rounded-2xl border border-neutral-200/90 bg-white p-1 hover:border-neutral-300 transition-all shadow-2xs"
                  >
                    <div
                      className="rounded-xl overflow-hidden border border-black/[0.04]"
                      style={{ backgroundColor: `color-mix(in srgb, ${ideaTintColor} 7%, white)` }}
                    >
                    {/* Clickable Card Header */}
                    <div
                      onClick={() => {
                        playSound('click', soundEnabled);
                        toggleIdea(ideaKey);
                      }}
                      className="p-5 sm:p-6 cursor-pointer select-none transition-colors hover:bg-black/[0.02] flex flex-col gap-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-neutral-200 text-xs font-mono font-bold text-neutral-800 shadow-xs shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight leading-snug">
                            {idea.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                            {blueprint.summary}
                          </p>
                        </div>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-neutral-950 transition-colors shadow-xs">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {/* Price and ICP footer */}
                      {/* Mobile: Boxed card with separated rows */}
                      <div className="sm:hidden mt-3 rounded-xl border border-neutral-200/90 bg-white divide-y divide-neutral-200/70 overflow-hidden shadow-2xs">
                        <div className="p-3 text-left">
                          <span className="block text-[10.5px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                            PRICING
                          </span>
                          <span className="block text-xs font-semibold text-neutral-900 mt-1 leading-snug">
                            {idea.howToCharge}
                          </span>
                        </div>
                        <div className="p-3 text-left">
                          <span className="block text-[10.5px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
                            TARGET ICP
                          </span>
                          <span className="block text-xs font-semibold text-neutral-900 mt-1 leading-snug">
                            {idea.customer}
                          </span>
                        </div>
                      </div>

                      {/* Desktop (sm+): Clean horizontal lines */}
                      <div className="hidden sm:block space-y-2 pt-3 border-t border-neutral-200/60 text-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-500 shrink-0 leading-snug">Pricing:</span>
                          <span className="min-w-0 font-semibold text-neutral-900 leading-snug">
                            {idea.howToCharge}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="font-medium text-neutral-500 shrink-0 leading-snug">Target ICP:</span>
                          <span className="min-w-0 font-semibold text-neutral-900 leading-snug">
                            {idea.customer}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded 20-Year Startup Operator Blueprint */}
                    {isExpanded && (
                      <div className="border-t border-neutral-200/90 bg-white p-6 sm:p-8 space-y-7 animate-fadeIn">
                        {/* Section 1: Core Concept & Mechanics */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <Rocket className="h-4 w-4 text-neutral-700" />
                            <span>1. Core Business Concept &amp; Operational Mechanics</span>
                          </div>
                          <p className="text-sm text-neutral-800 leading-relaxed font-normal bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/70">
                            {blueprint.concept}
                          </p>
                        </div>

                        {/* Section 2: Unfair Advantage & Economic Moat */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            <span>2. The Unfair Advantage (Why Building on This Repo Wins)</span>
                          </div>
                          <p className="text-sm text-neutral-800 leading-relaxed font-normal bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/70">
                            {blueprint.unfairAdvantage}
                          </p>
                        </div>

                        {/* Section 3: Target ICP & Buyer Psychology */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <Target className="h-4 w-4 text-neutral-700" />
                            <span>3. Ideal Customer Profile (ICP) &amp; Buyer Psychology</span>
                          </div>
                          <p className="text-sm text-neutral-800 leading-relaxed font-normal bg-neutral-50/70 p-4 rounded-xl border border-neutral-200/70">
                            {blueprint.targetIcp}
                          </p>
                        </div>

                        {/* Section 4: Monetization Architecture & Path to $10k MRR */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            <span>4. Monetization Architecture &amp; Unit Economics</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {blueprint.monetization.tiers.map((tier, tIdx) => (
                              <div
                                key={tIdx}
                                className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-baseline justify-between gap-2">
                                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                    {tier.name}
                                  </span>
                                  <span className="text-sm font-bold text-neutral-950 font-mono-num">
                                    {tier.price}
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-600 leading-relaxed">
                                  {tier.description}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
                            <strong className="text-neutral-900 font-semibold">The Math to $10k MRR:</strong>{' '}
                            {blueprint.monetization.pathTomrr}
                          </div>
                        </div>

                        {/* Section 5: Go-To-Market (GTM) Distribution Playbook */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <Zap className="h-4 w-4 text-neutral-700" />
                            <span>5. Tactical Go-To-Market (GTM) Playbook</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 space-y-1.5 shadow-2xs">
                              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                                Stage 1: First 10 Customers (Zero Paid Ads)
                              </span>
                              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                                {blueprint.gtmPlaybook.firstTenUsers}
                              </p>
                            </div>

                            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-4 space-y-1.5 shadow-2xs">
                              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider block">
                                Stage 2: Repeatable Scale Channel (Days 15–90)
                              </span>
                              <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                                {blueprint.gtmPlaybook.scalingChannel}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Section 6: Technical Implementation Delta */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <Code2 className="h-4 w-4 text-neutral-700" />
                            <span>6. Technical Implementation Delta (What to Build)</span>
                          </div>

                          <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4 sm:p-5 space-y-2.5">
                            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                              Proprietary glue required on top of {repo.name}:
                            </div>
                            <ul className="space-y-2 text-sm text-neutral-700 leading-relaxed">
                              {blueprint.techStackDelta.map((delta, dIdx) => (
                                <li key={dIdx} className="flex items-start gap-2.5">
                                  <CheckCircle2 className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                                  <span>{delta}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Section 7: 20-Year Founder Advice & Pitfalls */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span>7. 20-Year Veteran Advice (Pitfalls to Avoid)</span>
                          </div>
                          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-4 sm:p-5 text-sm text-neutral-800 leading-relaxed font-normal">
                            {blueprint.founderPitfalls}
                          </div>
                        </div>

                        {/* Blueprint Footer Utility */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                          <span>Validated commercial opportunity blueprint for {repo.name}.</span>
                          <button
                            type="button"
                            onClick={() => {
                              const copyTextStr = `${blueprint.title}\n\nTarget ICP: ${blueprint.customer}\nPricing: ${blueprint.howToCharge}\n\nConcept:\n${blueprint.concept}\n\nUnfair Advantage:\n${blueprint.unfairAdvantage}\n\nGTM Playbook:\n${blueprint.gtmPlaybook.firstTenUsers}\n\nPitfalls to Avoid:\n${blueprint.founderPitfalls}`;
                              copyText(`blueprint-${ideaKey}`, copyTextStr);
                            }}
                            className="inline-flex items-center gap-1.5 font-medium text-neutral-700 hover:text-neutral-950 transition-colors cursor-pointer bg-white px-3 py-1 rounded-md border border-neutral-200 shadow-2xs"
                          >
                            {copiedKey === `blueprint-${ideaKey}` ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Copied Blueprint</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-neutral-400" />
                                <span>Copy Blueprint Notes</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              Note: Pricing models, revenue projections, and unit economics are tactical benchmarks derived from comparable B2B SaaS businesses, not financial guarantees. Always validate willingness to pay with direct customer interviews before building.
            </div>
          </div>
        )}

        {/* TAB 3: LICENSE */}
        <div hidden={activeTab !== 'license'} className="animate-fadeIn">
          <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-100 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  Commercial License &amp; SaaS Rights
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Plain-English commercial rules for founders and developers building on {repo.name}.
                </p>
              </div>
              <span className="font-mono text-xs text-neutral-500 font-medium shrink-0">
                SPDX: {safety.spdxId}
              </span>
            </div>

            {/* Header Status & Plain Explanation */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${safety.colorClasses.dotBg}`} />
                  <span className="text-base font-semibold text-neutral-950">
                    {safety.badgeLabel}
                  </span>
                  <span className="text-xs text-neutral-500 font-mono">
                    ({safety.spdxId})
                  </span>
                </div>

                <span className="text-xs font-medium text-neutral-700 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200/80">
                  {!hasRecognizedLicense
                    ? 'No recognized license'
                    : safety.tier === 'safe'
                    ? 'Permissive License'
                    : safety.tier === 'conditional'
                    ? 'Conditions apply'
                    : 'Source-available / Restricted'}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                  Commercial Rights &amp; Freedom
                </div>
                <p className="text-sm sm:text-base text-neutral-800 leading-relaxed font-normal">
                  {dossier?.licenseMeaning || safety.plainExplanation}
                </p>
              </div>
            </div>

            {/* Founder Commercial Rights (Vertical List, Unframed) */}
            <div className="space-y-4 pt-6 border-t border-neutral-100">
              <h3 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                Founder Commercial Rights
              </h3>
              <ul className="space-y-4">
                {commercialRights.map((right) => {
                  const RightIcon = right.icon;
                  const state = rightStateStyles[right.state];
                  const StateIcon = state.icon;
                  return (
                    <li key={right.title} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
                          <RightIcon className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>{right.title}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${state.className}`}>
                          <StateIcon className="h-3 w-3 shrink-0" />
                          {state.label}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 leading-relaxed pl-6">
                        {right.body}
                      </p>
                    </li>
                  );
                })}

                <li className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-bold text-neutral-950">
                    <Scale className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Trademark Boundaries</span>
                  </div>
                  <p className="text-sm text-neutral-600 leading-relaxed pl-6">
                    The software license covers the source code, but not project trademarks. Choose an original brand name rather than selling as official &quot;{repo.name}&quot;.
                  </p>
                </li>
              </ul>
            </div>

            {/* Commercial Diligence & Strategy Notes (Vertical List, Unframed) */}
            {((dossier?.caveats && dossier.caveats.length > 0) || dossier?.licenseWarning) && (
              <div className="space-y-3 pt-6 border-t border-neutral-100">
                <h3 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                  Commercial Diligence &amp; Strategy Notes
                </h3>
                {dossier?.caveats && dossier.caveats.length > 0 && (
                  <ul className="space-y-2.5 text-sm text-neutral-700 leading-relaxed">
                    {dossier.caveats.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0 ring-4 ring-blue-50" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {dossier?.licenseWarning && (
                  <p className="text-sm text-neutral-600 leading-relaxed pt-2">
                    {dossier.licenseWarning}
                  </p>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-400 pt-4 border-t border-neutral-100">
              Disclaimer: TopSAAS provides independent editorial analysis and does not offer legal advice. Always review the full license terms with legal counsel before building a business.
            </p>
          </div>
        </div>

        {/* TAB 4: TECH STACK */}
        <div hidden={activeTab !== 'tech'} className="space-y-6 animate-fadeIn">
            <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  Tech Stack &amp; Architecture
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Codebase composition and engineering foundation for {repo.name}.
                </p>
              </div>
              <span className="text-xs text-neutral-400 font-medium">Codebase composition</span>
            </div>

            <div className="rounded-xl border border-neutral-200/90 bg-white p-5 sm:p-6 space-y-6">
              {/* Language Breakdown */}
              {breakdown.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-950">
                    Language Breakdown
                  </h3>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                    {breakdown.map((l) => (
                      <span
                        key={l.name}
                        style={{ width: `${l.percent}%`, backgroundColor: languageColor(l.name) }}
                        title={`${l.name} ${l.percent}%`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs pt-1">
                    {breakdown.map((l) => (
                      <span key={l.name} className="inline-flex items-center gap-1.5 text-neutral-700 font-medium">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: languageColor(l.name) }}
                        />
                        <span>{l.name}</span>
                        <span className="text-neutral-400 font-mono-num">{l.percent}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Core Capabilities */}
              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <h3 className="text-sm font-semibold text-neutral-950">
                  Core Foundation Highlights
                </h3>
                <ul className="space-y-2.5 text-sm text-neutral-700 leading-relaxed">
                  {editorial.capabilities.map((c) => (
                    <li key={c.title} className="flex items-start gap-2.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-500 shrink-0 mt-2" />
                      <span>
                        <strong className="text-neutral-900 font-semibold">{c.title}:</strong> {c.body}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trade-offs to Consider */}
              {dossier && dossier.tradeoffs.length > 0 && (
                <div className="pt-4 border-t border-neutral-100 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-950">
                    Engineering Trade-offs &amp; Constraints
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-700 leading-relaxed">
                    {dossier.tradeoffs.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="font-mono text-neutral-400 text-xs shrink-0 mt-0.5">
                          {idx + 1}.
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

        {/* TAB 5: ALTERNATIVES */}
        {dossier && (
          <div hidden={activeTab !== 'alternatives'} className="space-y-8 animate-fadeIn">
            {/* Commercial SaaS Replaced (Rich Cards with Logos & Descriptions) */}
            {commercialAlternativesList.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                      Commercial Software Replaced
                    </h2>
                    <p className="text-sm text-neutral-500 mt-0.5">
                      Proprietary tools and paid SaaS platforms {repo.name} can replace.
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 font-medium font-mono-num">
                    {commercialAlternativesList.length} alternatives
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {commercialAlternativesList.map((alt) => {
                    const tintColor = getDeterministicBrandColor(alt.name || alt.domain);
                    return (
                    <div
                      key={alt.name}
                      className="rounded-2xl border border-neutral-200/90 bg-white p-1 shadow-2xs hover:border-neutral-300 transition-colors flex flex-col"
                    >
                      <div
                        className="flex-1 rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 border border-black/[0.04]"
                        style={{ backgroundColor: `color-mix(in srgb, ${tintColor} 8%, white)` }}
                      >
                        <div className="space-y-2">
                          <h3 className="text-base font-bold text-neutral-950 tracking-tight">
                            {alt.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-3">
                            {alt.description}
                          </p>
                        </div>

                        <div className="space-y-2.5 pt-3 border-t border-black/[0.06]">
                          <div className="flex items-center gap-2 min-w-0">
                            {alt.domain ? (
                              <a
                                href={alt.domain.startsWith('http://') || alt.domain.startsWith('https://') ? alt.domain : `https://${alt.domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950 truncate"
                                title={`Visit ${alt.name}`}
                              >
                                <span className="h-5 w-5 rounded border border-neutral-200/80 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                  <img
                                    src={getWebsiteFavicon(alt.domain, 32)}
                                    alt={alt.name}
                                    className="h-3.5 w-3.5 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                </span>
                                <span className="truncate font-medium">{alt.domain}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-neutral-500">Commercial SaaS</span>
                            )}
                          </div>

                          {alt.pricing && (
                            <div className="space-y-0.5 text-xs">
                              <div className="text-neutral-500 font-medium">Pricing benchmark:</div>
                              <div className="font-semibold text-emerald-700 leading-snug">
                                {alt.pricing}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed pt-1">
                  Deploying on {repo.name} eliminates recurring vendor per-seat fees, protects you from unexpected price hikes, and gives you total data sovereignty.
                </p>
              </section>
            )}
          </div>
        )}

        {/* TAB 6: GUIDE */}
        {buildGuide && (
          <div hidden={activeTab !== 'guide'} className="space-y-6 animate-fadeIn">
            <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  {buildGuide.title}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {buildGuide.tagline}
                </p>
              </div>
              <span className="text-xs text-neutral-400 font-medium font-mono-num">
                {buildGuide.timeEstimate}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200/90 bg-white p-5 sm:p-6 space-y-5">
              <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                {buildGuide.intro}
              </p>

              {/* Steps Overview */}
              {buildGuide.steps && buildGuide.steps.length > 0 && (
                <div className="pt-3 border-t border-neutral-100 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-950">
                    Implementation Roadmap ({buildGuide.steps.length} Steps)
                  </h3>
                  <div className="space-y-2">
                    {buildGuide.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200/70">
                        <span className="font-mono text-xs font-semibold text-neutral-500 shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}.
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-neutral-900">{step.title}</h4>
                          <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{step.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-neutral-500">
                  Step-by-step architecture breakdown, commands, and launch checklist.
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo(`/guides/${buildGuide.slug}`)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <span>Read full step-by-step guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Similar Open Source Projects (Shown on all tabs) */}
        {relatedRepos.length > 0 && (
          <section className="space-y-4 pt-10 border-t border-neutral-200/80 mt-12">
            <div className="flex items-baseline justify-between border-b border-neutral-100 pb-2">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-950">
                  Similar Open Source Projects in {repo.category}
                </h2>
                <p className="text-sm text-neutral-500 mt-0.5">
                  Curated open source alternatives and ecosystem peers.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedRepos.map((r) => (
                <RepoCard
                  key={r.full_name}
                  repo={r}
                  onOpen={onSelectRepo}
                  soundEnabled={soundEnabled}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
