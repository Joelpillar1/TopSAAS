import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock,
  Code2,
  Copy,
  Folder,
  GitFork,
  Github,
  BookOpen,
  Languages,
  Link2,
  Scale,
  Server,
  Share2,
  Star,
  Tag,
} from 'lucide-react';
import { CURATED_REPOS, CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { formatStars } from '../utils/github';
import { plainCopy } from '../utils/plainCopy';
import { computeHealth } from '../utils/repoHealth';
import { REPO_HEALTH, REPO_HEALTH_GENERATED_AT } from '../data/repoHealth';
import { getGuideForRepo } from '../data/buildGuides';
import { navigateTo } from '../utils/nav';
import { HealthScore, healthExplain } from './HealthScore';
import { timeAgo } from './ProductRow';
import { BorderBeam } from './BorderBeam';
import { playSound } from '../utils/sound';

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
  repo: CuratedRepo;
  soundEnabled: boolean;
  onBack: () => void;
  onSelectRepo: (repo: CuratedRepo) => void;
  /** Opens the featured-spot flow (sign-in or reserve modal), like the homepage promo. */
  onOpenFeatured?: () => void;
}

/* ───────────────────────── live-data cache ───────────────────────── */

const META_TTL = 30 * 60 * 1000; // 30 minutes
const META_STORE = 'topsaas_repo_meta_v2';
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
} catch {}

const getCachedMeta = (key: string): RepoLiveMeta | null => metaCache.get(key)?.m ?? null;

const setCachedMeta = (key: string, m: RepoLiveMeta) => {
  metaCache.set(key, { t: Date.now(), m });
  try {
    sessionStorage.setItem(META_STORE, JSON.stringify(Object.fromEntries(metaCache)));
  } catch {}
};

/** GitHub GET that resolves to null on rate-limit / network failure (never throws). */
const ghJson = <T,>(url: string): Promise<T | null> =>
  fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    .then((r) => (r.ok ? (r.json() as Promise<T>) : null))
    .catch(() => null);

/* ───────────────────────── editorial building blocks ───────────────────────── */

/** What each category is *for*, as a phrase that reads "…when you're {phrase}." */
const CATEGORY_USE: Partial<Record<RepoCategory, string>> = {
  'SaaS Starters': 'shipping an MVP without rebuilding auth, billing and deploys',
  'Auth & Identity': 'adding sign-in, accounts and permissions',
  Databases: 'choosing the data layer your product runs on',
  'AI & ML': 'wiring model-powered features into a real product',
  'DevOps & Infra': 'running and shipping software reliably',
  'UI Components': 'assembling a polished interface quickly',
  'CMS & Content': 'letting editors publish without a deploy',
  'Payments & Billing': 'charging customers without building a payment stack',
  Analytics: 'understanding what users actually do',
  'Email & Communication': 'sending transactional and lifecycle messages',
  Deployment: 'putting apps online in minutes',
  Mobile: 'shipping to phones and tablets',
  'API & Backend': 'structuring the server side of a product',
  Monitoring: 'knowing when something breaks before your users do',
  'Forms & Surveys': 'collecting input from users',
  Search: 'making content findable instantly',
  'File Storage': 'handling uploads and files at scale',
  'Design & UI': 'keeping the product visually consistent',
  Productivity: 'organizing work and teams',
  Utilities: 'solving the small plumbing problems every SaaS hits',
  'Privacy & Security': 'keeping user data locked down',
  Education: 'learning a stack by reading real code',
  Lists: 'finding proven tools worth switching to',
};

/** Noun phrase for the category: "a working {noun}". */
const CATEGORY_NOUN: Partial<Record<RepoCategory, string>> = {
  'SaaS Starters': 'SaaS starter kit',
  'Auth & Identity': 'authentication toolkit',
  Databases: 'database layer',
  'AI & ML': 'AI building block',
  'DevOps & Infra': 'DevOps tool',
  'UI Components': 'UI component library',
  'CMS & Content': 'content management setup',
  'Payments & Billing': 'payments & billing toolkit',
  Analytics: 'analytics tool',
  'Email & Communication': 'email & messaging tool',
  Deployment: 'deployment tool',
  Mobile: 'mobile app foundation',
  'API & Backend': 'API & backend toolkit',
  Monitoring: 'monitoring tool',
  'Forms & Surveys': 'forms & surveys tool',
  Search: 'search setup',
  'File Storage': 'file storage layer',
  'Design & UI': 'design system',
  Productivity: 'productivity tool',
  Utilities: 'developer utility',
  'Privacy & Security': 'privacy & security tool',
  Education: 'learning resource',
  Lists: 'curated collection',
};

/**
 * Topic → capability line, as [topic key, title, continuation].
 * Reads as "**Title** continuation." Matched exactly first, then by substring.
 */
const TOPIC_CAPABILITIES: [string, string, string][] = [
  ['self-hosted', 'Self-hosting', 'runs on your own infrastructure: data, limits and cost stay under your control'],
  ['selfhosting', 'Self-hosting', 'runs on your own infrastructure: data, limits and cost stay under your control'],
  ['docker-compose', 'Docker Compose', 'spins up the whole stack from a single file'],
  ['docker', 'Docker support', 'makes setup one command instead of an afternoon'],
  ['kubernetes', 'Kubernetes', 'fits a scale-out production setup without rework'],
  ['react', 'React frontend', 'matches the component model your team already knows'],
  ['nextjs', 'Next.js', 'gives you routing and server rendering out of the box'],
  ['vue', 'Vue frontend', 'keeps the UI approachable and quick to extend'],
  ['svelte', 'Svelte frontend', 'keeps the bundle small and the updates fast'],
  ['typescript', 'TypeScript', 'keeps refactors safe as the codebase grows'],
  ['javascript', 'JavaScript', 'runs anywhere Node runs, with no build tooling to fight'],
  ['graphql', 'GraphQL API', 'lets clients ask for exactly the data they need'],
  ['rest-api', 'REST API', 'means any stack can call it without a special client'],
  ['rest', 'REST API', 'means any stack can call it without a special client'],
  ['api', 'Public API', 'lets you automate it from your own tools'],
  ['webhooks', 'Webhooks', 'keep the rest of your stack in sync'],
  ['webhook', 'Webhooks', 'keep the rest of your stack in sync'],
  ['authentication', 'Sign-in', 'is handled in the box, so you never bolt on an auth provider'],
  ['auth', 'Sign-in', 'is handled in the box, so you never bolt on an auth provider'],
  ['oauth', 'OAuth', 'covers third-party sign-in and integrations'],
  ['sso', 'Single sign-on', 'works with the identity provider your team already has'],
  ['jwt', 'JWT sessions', 'stay stateless, so the app scales without sticky servers'],
  ['admin-ui', 'Admin dashboard', 'covers day-to-day operations without you building one'],
  ['admin', 'Admin dashboard', 'covers day-to-day operations without you building one'],
  ['crud', 'CRUD flows', 'are already wired up, so you start from working code'],
  ['ai', 'AI features', 'live in the core workflow instead of being bolted on'],
  ['llm', 'LLM support', 'is designed for large-language-model workloads end to end'],
  ['rag', 'RAG pipeline', 'answers from your own content instead of a generic model'],
  ['vector', 'Vector search', 'matches by meaning, not just exact keywords'],
  ['agent', 'Agent-ready', 'gives AI agents a real surface to act through, not just a demo'],
  ['analytics', 'Usage analytics', 'come built in: no second tool to buy'],
  ['dashboard', 'Dashboards', 'surface the numbers your team will actually open'],
  ['charts', 'Charts', 'make the important metrics visible out of the box'],
  ['chart', 'Charts', 'make the important metrics visible out of the box'],
  ['payments', 'Billing', 'covers the primitives you would otherwise build from scratch'],
  ['stripe', 'Stripe', 'handles subscriptions and one-off charges'],
  ['billing', 'Subscriptions & invoices', 'are managed for you, including failed-payment retries'],
  ['email', 'Transactional email', 'sends from inside the app, no third service required'],
  ['newsletter', 'Newsletter tooling', 'covers signup and delivery workflows'],
  ['smtp', 'SMTP support', 'talks to whatever mail server you already run'],
  ['cms', 'Content management', 'lets editors publish without touching a deploy'],
  ['markdown', 'Markdown', 'is a first-class format, from docs to comments'],
  ['mobile', 'Mobile support', 'keeps the experience solid on phones and tablets'],
  ['pwa', 'Installable PWA', 'runs from the home screen like a native app'],
  ['realtime', 'Realtime updates', 'reach every connected client instantly'],
  ['websocket', 'Websockets', 'keep clients in sync without constant polling'],
  ['cli', 'CLI', 'makes everything scriptable from the terminal'],
  ['sdk', 'SDK', 'lets you drop it into your app in minutes'],
  ['plugins', 'Plugins', 'add features without forcing a fork'],
  ['plugin', 'Plugins', 'add features without forcing a fork'],
  ['extension', 'Extensions', 'add features while keeping upstream clean'],
  ['automation', 'Automation', 'handles the repetitive work on triggers instead of by hand'],
  ['workflow', 'Workflows', 'make your process auditable and rerunnable'],
  ['scheduler', 'Scheduling', 'runs jobs for you without extra infrastructure'],
  ['cron', 'Cron jobs', 'run natively, with no scheduler to operate'],
  ['privacy', 'Privacy by design', 'means user data stays under your control'],
  ['gdpr', 'GDPR-ready', 'covers consent, export and deletion from day one'],
  ['postgres', 'PostgreSQL', 'stores data relationally with real durability guarantees'],
  ['postgresql', 'PostgreSQL', 'stores data relationally with real durability guarantees'],
  ['mysql', 'MySQL', 'uses the setup most hosts already provide'],
  ['mongodb', 'MongoDB', 'fits flexible, document-shaped data'],
  ['redis', 'Redis', 'handles caching and hot-path reads'],
  ['sqlite', 'SQLite', 'gives you zero-config local storage'],
  ['search', 'Search', 'is built in rather than left as an exercise'],
  ['i18n', 'Internationalization', 'ships multilingual support from the first release'],
  ['tailwind', 'Tailwind CSS', 'makes retheming a config change instead of a rewrite'],
  ['monitoring', 'Monitoring', 'surfaces regressions before your users do'],
  ['testing', 'Tests', 'are wired into the workflow from day one'],
  ['export', 'Data export', 'leaves in open formats: no lock-in on the way out'],
  ['import', 'Imports', 'bring data over from the tools you are leaving behind'],
];

interface Capability {
  title: string;
  body: string;
}

interface Editorial {
  lead: string;
  core: string;
  capabilities: Capability[];
  closing: string;
}

const ensurePeriod = (s: string): string => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Pull the strongest capability lines out of the repo's live topics. */
const capabilitiesFromTopics = (topics: string[]): Capability[] => {
  const lower = topics.map((t) => t.toLowerCase().trim());
  const out: Capability[] = [];
  const usedIdx = new Set<number>();

  const collect = (mode: 'exact' | 'substring') => {
    for (const [key, title, body] of TOPIC_CAPABILITIES) {
      if (out.length >= 6) return;
      if (out.some((c) => c.title === title)) continue;
      const idx = lower.findIndex((t, i) => {
        if (usedIdx.has(i)) return false;
        return mode === 'exact' ? t === key : t.includes(key) || key.includes(t);
      });
      if (idx >= 0) {
        usedIdx.add(idx);
        out.push({ title, body });
      }
    }
  };

  collect('exact');
  collect('substring');
  return out;
};

/**
 * Repo blurbs come from curated data or the live GitHub API, so they can carry
 * emoji and em-dashes. Page copy stays plain: no emoji, no em-dashes — the
 * shared sanitizer lives in ../utils/plainCopy so every surface matches.
 */

/**
 * The page's own write-up of the repo: editorial prose built from curated data
 * plus live GitHub signals. Never the README pasted back at the reader.
 */
const buildEditorial = (
  repo: CuratedRepo,
  live: RepoLiveMeta | null,
  ctx: { stars: number; forks: number; rank: number; peerCount: number; selfHosted: boolean }
): Editorial => {
  const usePhrase =
    CATEGORY_USE[repo.category] ?? 'building the next version of your product';
  const noun = CATEGORY_NOUN[repo.category] ?? 'open-source project';
  const desc = ensurePeriod(plainCopy(repo.description) || `${repo.full_name} on GitHub.`);
  const licenseBit = live?.license ? `, released under the ${live.license} license` : '';

  const lead =
    `${desc} ` +
    `In our ${repo.category} collection it ranks #${ctx.rank} of ${ctx.peerCount} by stars` +
    `${repo.language ? `, and most of the code is ${repo.language}` : ''}` +
    `${licenseBit}. Maintained in the open by ${repo.owner.login}.`;

  let core: string;
  if (ctx.selfHosted) {
    core =
      `The core idea is ownership. ${repo.name} runs on your own hardware or cloud account, ` +
      `so the data, the limits and the cost all stay yours: no per-seat bill, no vendor lock-in, ` +
      `and no waiting on someone else's roadmap when you need a change.`;
  } else if (repo.category === 'SaaS Starters') {
    core =
      `The core idea is leverage: fork a codebase that already handles the boring half of a SaaS, ` +
      `such as auth, storage, deployments, and spend your time on the product itself instead of ` +
      `rebuilding plumbing you have built before.`;
  } else if (repo.category === 'AI & ML') {
    core =
      `The core idea is putting models to work. ${repo.name} provides the plumbing around AI: ` +
      `data flow, inference, and guardrails, so you can ship model-powered features without standing ` +
      `up a research team first.`;
  } else {
    core =
      `The core idea is momentum. Instead of building ${noun} from a blank repository, you fork ` +
      `${repo.name} and keep what fits: every file in there exists because someone needed it in ` +
      `production, which is exactly what makes it a fast, low-risk place to start.`;
  }

  const capabilities: Capability[] = live ? capabilitiesFromTopics(live.topics) : [];
  if (capabilities.length < 3) {
    const fillers: Capability[] = [
      {
        title: 'Community-backed',
        body: `${ctx.stars.toLocaleString()} stars and ${ctx.forks.toLocaleString()} forks: real production use, active issues and answers when you get stuck`,
      },
      ...(repo.language
        ? [
            {
              title: `${repo.language} codebase`,
              body: `the bulk of the project is ${repo.language}, so contributors can plug in without a stack switch`,
            },
          ]
        : []),
      {
        title: 'Vetted on TopSAAS',
        body: `hand-picked for our ${repo.category} set and verified against GitHub on October 5, 2026`,
      },
    ];
    for (const f of fillers) {
      if (capabilities.length >= 3) break;
      capabilities.push(f);
    }
  }

  const closingTail = ctx.selfHosted
    ? 'and because it is self-hostable, the data and the limits stay yours'
    : live?.license
      ? `and the ${live.license} license means you can build on it freely`
      : 'and its community keeps it maintained';

  const closing =
    `${repo.name} fits naturally into a stack when you're ${usePhrase}. ` +
    `The numbers back it up: ${ctx.stars.toLocaleString()} stars and ${ctx.forks.toLocaleString()} forks, ${closingTail}.`;

  return { lead, core, capabilities, closing };
};

/* ───────────────────────── misc helpers ───────────────────────── */

const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return '–';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '–';
  }
};

/** "3 years" / "1 year 4 mo" / "8 months": repository age, reference-style. */
const formatAge = (iso: string | null | undefined): string => {
  if (!iso) return '–';
  const created = new Date(iso).getTime();
  if (!isFinite(created)) return '–';
  const days = Math.max(0, (Date.now() - created) / 86_400_000);
  if (days < 30) return `${Math.max(1, Math.floor(days))} day${days >= 2 ? 's' : ''}`;
  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years} year${years === 1 ? '' : 's'} ${rem} mo` : `${years} years`;
};

const SELF_HOST_TERMS = new Set([
  'self-hosted',
  'selfhosted',
  'self-hosting',
  'self-hostable',
  'selfhost',
  'on-premise',
  'onpremise',
]);

const detectSelfHosted = (topics: string[], description: string): boolean =>
  topics.some((t) => SELF_HOST_TERMS.has(t.toLowerCase().replace(/\s+/g, '-'))) ||
  /self[- ]host/i.test(description);

const languageBreakdown = (languages: Record<string, number>) => {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total <= 0) return [];
  return entries.slice(0, 8).map(([name, bytes]) => ({
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
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dart: '#00b4ab',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Shell: '#89e051',
  Bash: '#89e051',
  Dockerfile: '#384d54',
  HCL: '#844fba',
  Elixir: '#6e4a7e',
  Lua: '#000080',
  Zig: '#ec915c',
  Solidity: '#aa6746',
  Handlebars: '#f7931e',
  MDX: '#fcb32c',
};

const languageColor = (name: string): string => LANGUAGE_COLORS[name] ?? '#6b7280';

/* ───────────────────────── small building blocks ───────────────────────── */

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({
  icon,
  children,
}) => (
  <div className="flex items-center gap-2">
    <span className="flex h-5 w-5 items-center justify-center rounded bg-mint-500/15 text-mint-600">
      {icon}
    </span>
    <h2 className="text-xs font-bold text-neutral-950">{children}</h2>
  </div>
);

const StatRow: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({
  label,
  value,
  sub,
}) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <span className="text-[11px] font-semibold text-neutral-500 shrink-0">{label}</span>
    <span className="text-right min-w-0">
      <span className="block text-[13px] font-black text-neutral-950 font-mono-num truncate">{value}</span>
      {sub && <span className="block text-[10px] font-medium text-neutral-600">{sub}</span>}
    </span>
  </div>
);

/* ───────────────────────── page ───────────────────────── */

export const RepoDetailPage: React.FC<RepoDetailPageProps> = ({
  repo,
  soundEnabled,
  onBack,
  onSelectRepo,
  onOpenFeatured,
}) => {
  const [live, setLive] = useState<RepoLiveMeta | null>(() => getCachedMeta(repo.full_name));
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  // When the header CTA row scrolls out of view, mirror its actions (Visit on
  // GitHub, star count, Clone) inside the sticky bar next to Back and Share.
  const [stickyActions, setStickyActions] = useState(false);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setStickyActions(!entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Core repo data first (so the stats card fills quickly), then languages and
  // the latest release. Every failure (rate limit, offline) degrades silently
  // to the curated snapshot that is already on screen.
  useEffect(() => {
    let cancelled = false;
    const cached = getCachedMeta(repo.full_name);
    if (cached) {
      setLive(cached);
      return;
    }
    setLive(null);

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
      .catch(() => {
        /* network failure: curated snapshot stays on screen */
      });

    return () => {
      cancelled = true;
    };
  }, [repo.full_name]);

  const description = plainCopy(live?.description || repo.description);
  const topics = live?.topics?.length ? live.topics : null;
  const selfHosted = detectSelfHosted(live?.topics ?? [], live?.description || repo.description);
  const breakdown = live ? languageBreakdown(live.languages) : [];
  const stars = live?.stars ?? repo.stargazers_count;
  const forks = live?.forks ?? repo.forks_count;
  const cloneUrl = `${repo.html_url}.git`;
  const pageUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/repo/${repo.full_name}`
      : `/repo/${repo.full_name}`;
  const xShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${repo.name}: ${description || 'Open source project'}`
  )}&url=${encodeURIComponent(pageUrl)}`;

  // Rank within the category: real context the reference page also leans on.
  const peers = CURATED_REPOS.filter((r) => r.category === repo.category).sort(
    (a, b) => b.stargazers_count - a.stargazers_count
  );
  const rank = Math.max(1, peers.findIndex((r) => r.full_name === repo.full_name) + 1);

  const editorial = buildEditorial(repo, live, {
    stars,
    forks,
    rank,
    peerCount: peers.length,
    selfHosted,
  });

  // Reference-style SEO title: "Postiz: Open Source Alternative to …"
  // Also swaps canonical + OG/Twitter tags and injects per-repo JSON-LD so the
  // SPA ships full head metadata for crawlers and answer engines. All restored
  // on unmount so navigating away never leaks repo tags onto another route.
  useEffect(() => {
    const SITE = 'https://www.topsaas.space';
    const canonical = `${SITE}/repo/${repo.full_name}`;
    const shortDesc = (description || '').replace(/\s+/g, ' ').trim().slice(0, 110);
    const metaDesc = (description || '').replace(/\s+/g, ' ').trim().slice(0, 157);

    const prevTitle = document.title;
    document.title = shortDesc
      ? `${repo.name}: ${shortDesc} | TopSAAS`
      : `${repo.full_name} | TopSAAS`;

    type HeadPatch = { el: Element; attr: string; prev: string | null };
    const patches: HeadPatch[] = [];
    const setHead = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (!el) return;
      patches.push({ el, attr, prev: el.getAttribute(attr) });
      el.setAttribute(attr, value);
    };

    if (metaDesc) setHead('meta[name="description"]', 'content', metaDesc);
    setHead('link[rel="canonical"]', 'href', canonical);
    setHead('meta[property="og:url"]', 'content', canonical);
    setHead('meta[property="og:title"]', 'content', document.title);
    if (metaDesc) setHead('meta[property="og:description"]', 'content', metaDesc);
    setHead('meta[name="twitter:url"]', 'content', canonical);
    setHead('meta[name="twitter:title"]', 'content', document.title);
    if (metaDesc) setHead('meta[name="twitter:description"]', 'content', metaDesc);

    // SoftwareSourceCode structured data for the repo detail page.
    const ld: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: repo.name,
      description: description || `${repo.full_name} on GitHub`,
      url: canonical,
      codeRepository: repo.html_url,
      author: { '@type': 'Organization', name: repo.owner.login },
      keywords: repo.category,
      interactionStatistic: {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: stars,
      },
    };
    if (repo.language) ld.programmingLanguage = repo.language;
    if (live?.license) ld.license = live.license;
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
  }, [repo.name, repo.full_name, repo.html_url, repo.owner.login, repo.language, repo.category, description, stars, live?.license]);

  const copyText = (key: string, text: string) => {
    playSound('click', soundEnabled);
    try {
      navigator.clipboard.writeText(text);
    } catch {}
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((c) => (c === key ? null : c)), 2000);
  };

  // Same category first (highest starred), then general fill so the section is never empty
  const relatedRepos = (() => {
    const byStars = (a: CuratedRepo, b: CuratedRepo) => b.stargazers_count - a.stargazers_count;
    const sameCategory = peers.filter((r) => r.full_name !== repo.full_name).slice(0, 4);
    const picked = new Set(sameCategory.map((r) => r.full_name));
    const filler = CURATED_REPOS.filter(
      (r) => r.full_name !== repo.full_name && !picked.has(r.full_name)
    ).sort(byStars);
    return [...sameCategory, ...filler].slice(0, 4);
  })();

  // Health score: live GitHub signals when they have loaded, the generated
  // snapshot otherwise — either way scored by the same shared formula.
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
  const healthRow = {
    label: 'Health',
    value: health ? <HealthScore score={health.score} band={health.band} /> : '–',
    sub: health ? `${health.score}/100 · grade ${health.band}` : 'snapshot pending',
  };

  // Cross-link: the original build guide for this project, when we have one.
  const buildGuide = getGuideForRepo(repo.full_name);

  // Sidebar stat rows: live values when available, curated fallback otherwise.
  const sidebarRows: { label: string; value: React.ReactNode; sub?: string }[] = live
    ? [
        healthRow,
        {
          label: 'Last commit',
          value: live.pushedAt ? timeAgo(new Date(live.pushedAt).getTime()) : '–',
          sub: formatDate(live.pushedAt),
        },
        {
          label: 'Repository age',
          value: formatAge(live.createdAt),
          sub: live.createdAt ? `since ${new Date(live.createdAt).getFullYear()}` : undefined,
        },
        {
          label: 'Version',
          value: live.version || '–',
          sub: live.version ? formatDate(live.versionDate) : 'no release yet',
        },
        { label: 'License', value: live.license || '–' },
        { label: 'Self-hosted', value: selfHosted ? 'Yes' : 'No' },
        { label: 'Open issues', value: live.openIssues?.toLocaleString() ?? '–' },
      ]
    : [
        healthRow,
        { label: 'Language', value: repo.language || '–' },
        { label: 'Category', value: repo.category },
        { label: 'Self-hosted', value: selfHosted ? 'Yes' : '–' },
        { label: 'Visibility', value: 'Public' },
        { label: 'Verified', value: 'Oct 2026', sub: 'curated snapshot' },
      ];

  const compactStats = live
    ? [
        { label: 'Stars', value: formatStars(stars), icon: <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> },
        {
          label: 'Last commit',
          value: live.pushedAt ? timeAgo(new Date(live.pushedAt).getTime()) : '–',
          icon: <Clock className="h-3 w-3 text-neutral-500" />,
        },
        { label: 'License', value: live.license || '–', icon: <Scale className="h-3 w-3 text-neutral-500" /> },
        { label: 'Age', value: formatAge(live.createdAt), icon: <CalendarDays className="h-3 w-3 text-neutral-500" /> },
      ]
    : [
        { label: 'Stars', value: formatStars(stars), icon: <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> },
        { label: 'Forks', value: formatStars(forks), icon: <GitFork className="h-3 w-3 text-neutral-500" /> },
        { label: 'Language', value: repo.language || '–', icon: <Code2 className="h-3 w-3 text-neutral-500" /> },
        { label: 'Verified', value: 'Oct 2026', icon: <Check className="h-3 w-3 text-neutral-500" /> },
      ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans pb-12 sm:pb-16">
      {/* Sticky bar: back · live key stats · share · github */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onBack();
              }}
              className="inline-flex items-center gap-1.5 px-1 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {stickyActions && (
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playSound('click', soundEnabled)}
                  className="btn-primary px-2.5 py-1.5 text-[11px] font-bold shrink-0"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View on GitHub</span>
                  <span className="sm:hidden">GitHub</span>
                </a>
                <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100 px-2 py-1.5 text-[11px] font-bold text-neutral-800 font-mono-num shrink-0">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  {stars.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => copyText('cloneSticky', cloneUrl)}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-100 px-2 py-1.5 text-[11px] font-bold text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer shrink-0"
                  title="Copy clone URL"
                >
                  {copiedKey === 'cloneSticky' ? (
                    <Check className="h-3 w-3 text-mint-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">
                    {copiedKey === 'cloneSticky' ? 'Copied' : 'Clone'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => copyText('page', pageUrl)}
              className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 shadow-2xs active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px]"
              title="Copy link to this page"
            >
              {copiedKey === 'page' ? (
                <Check className="h-4 w-4 text-mint-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              <span className="hidden sm:inline sm:ml-1.5">
                {copiedKey === 'page' ? 'Copied' : 'Share'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main: editorial column + sticky stats sidebar */}
      <main className="mx-auto w-full max-w-6xl px-3.5 py-5 sm:px-6 sm:py-8 space-y-6 flex-1">
        {/* Row 1: editorial + sticky stats (wrapper bounds the sticky range) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 items-start">
        {/* ─────────── left: editorial ─────────── */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Header */}
          <header className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-neutral-200/70 bg-white shadow-2xs">
                <img
                  src={repo.owner.avatar_url}
                  alt={repo.owner.login}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-950">
                    {repo.name}
                  </h1>
                  {live?.archived && (
                    <span className="rounded bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      Archived
                    </span>
                  )}
                  {live && (
                    <span className="inline-flex items-center gap-1 rounded bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
                      live
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs font-semibold text-neutral-500 font-mono-num break-all">
                  {repo.full_name}
                </p>
              </div>
            </div>

            {/* Tagline: the one-liner, set large like the reference */}
            <p className="text-base sm:text-lg font-medium text-neutral-700 leading-relaxed max-w-3xl">
              {description}
            </p>

            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-mint-500/15 px-2 py-1 text-[11px] font-bold text-mint-600 ring-1 ring-inset ring-mint-500/40">
                {repo.category}
              </span>
              {repo.language && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-neutral-200 px-2 py-1 text-[11px] font-bold text-neutral-700">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: languageColor(repo.language) }}
                  />
                  {repo.language}
                </span>
              )}
              {selfHosted && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-white border border-neutral-200 px-2 py-1 text-[11px] font-bold text-neutral-700">
                  <Server className="h-3 w-3" />
                  Self-hosted
                </span>
              )}
              {live?.homepage && (
                <a
                  href={live.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => playSound('click', soundEnabled)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-white border border-neutral-200 px-2 py-1 text-[11px] font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors"
                >
                  <Link2 className="h-3 w-3" />
                  <span className="max-w-[220px] truncate">{live.homepage}</span>
                </a>
              )}
            </div>

            {/* CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-2">
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => playSound('click', soundEnabled)}
                className="btn-primary px-5 py-3 text-xs font-bold"
              >
                <span>Visit on GitHub</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-900">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span className="font-mono-num">{stars.toLocaleString()}</span>
                <span className="text-neutral-500">stars</span>
              </span>
              <button
                type="button"
                onClick={() => copyText('clone', cloneUrl)}
                className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-4 py-3 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer active:scale-95"
                title="Copy clone URL"
              >
                {copiedKey === 'clone' ? (
                  <Check className="h-3.5 w-3.5 text-mint-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span className="font-mono-num">{copiedKey === 'clone' ? 'Copied!' : 'Clone'}</span>
              </button>
            </div>

            {/* Compact stats: mobile/tablet (the sidebar owns them on lg) */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
              {compactStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-2 shadow-2xs"
                >
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
                    {s.icon}
                    <span className="truncate">{s.label}</span>
                  </div>
                  <div className="mt-0.5 text-sm font-black text-neutral-950 font-mono-num truncate">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </header>

          {/* Editorial write-up: our own reading of the project */}
          <article className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
            <p className="text-[15px] leading-7 text-neutral-700">{editorial.lead}</p>
            <p className="text-[15px] leading-7 text-neutral-700">{editorial.core}</p>

            <div className="space-y-3 pt-1">
              <h3 className="text-sm font-black text-neutral-950">Key capabilities</h3>
              <ul className="space-y-2.5">
                {editorial.capabilities.map((c) => (
                  <li
                    key={c.title}
                    className="relative pl-4 text-[14.5px] leading-6 text-neutral-700 before:absolute before:left-0 before:top-[0.6em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-mint-500/70"
                  >
                    <span className="font-bold text-neutral-950">{c.title}</span> {c.body}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-[15px] leading-7 text-neutral-700">{editorial.closing}</p>            </article>

            {/* Build guide cross-link: original walkthrough for this project */}
            {buildGuide && (
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  navigateTo(`/guides/${buildGuide.slug}`);
                }}
                className="group flex w-full items-center gap-3.5 rounded-lg border border-neutral-200 bg-white p-4 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50 cursor-pointer"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-mint-500/15 text-mint-600">
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold text-mint-600">
                    Build guide
                  </span>
                  <span className="block truncate text-sm font-bold text-neutral-950 group-hover:text-mint-700 transition-colors">
                    {buildGuide.title}
                  </span>
                  <span className="block truncate text-xs text-neutral-600">
                    {buildGuide.timeEstimate} · {buildGuide.difficulty}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-mint-600 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}

          {/* Categories & Tags */}
          <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="space-y-2">
              <SectionLabel>Categories</SectionLabel>
              <div>
                <span className="inline-flex rounded-md bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-xs font-bold text-neutral-800">
                  {repo.category}
                </span>
              </div>
            </div>
            {topics && (
              <div className="space-y-2 pt-1 border-t border-neutral-200/70">
                <SectionLabel>Tags</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <a
                      key={t}
                      href={`https://github.com/topics/${encodeURIComponent(t)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => playSound('click', soundEnabled)}
                      className="inline-flex items-center gap-1 rounded bg-white border border-neutral-200 px-2 py-1 text-[11px] font-semibold text-neutral-700 hover:border-mint-500/50 hover:text-mint-700 transition-colors"
                    >
                      <span className="text-neutral-600">#</span>
                      {t}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Built with */}
          <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
            <SectionLabel>Built with</SectionLabel>
            {breakdown.length > 0 ? (
              <>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-white border border-neutral-200">
                  {breakdown.map((l) => (
                    <span
                      key={l.name}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${l.percent}%`, backgroundColor: languageColor(l.name) }}
                      title={`${l.name} ${l.percent}%`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {breakdown.map((l) => (
                    <span
                      key={l.name}
                      className="inline-flex items-center gap-1.5 rounded bg-white border border-neutral-200 px-2 py-1 text-[11px] font-bold text-neutral-700"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: languageColor(l.name) }}
                      />
                      {l.name}
                      <span className="text-neutral-500 font-mono-num">{l.percent}%</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
                <Code2 className="h-4 w-4" />
                {repo.language
                  ? `Primary language: ${repo.language}`
                  : 'Language breakdown syncs live from GitHub.'}
              </div>
            )}
          </section>

          {/* Share row */}
          <section className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-5">
            <span className="text-[11px] font-bold text-neutral-500 mr-1">
              Share
            </span>
            <button
              type="button"
              onClick={() => copyText('page2', pageUrl)}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              {copiedKey === 'page2' ? (
                <Check className="h-3.5 w-3.5 text-mint-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedKey === 'page2' ? 'Link copied' : 'Copy link'}
            </button>
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              Post on X
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
            >
              LinkedIn
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </a>
          </section>
        </div>

        {/* ─────────── right: sticky stats sidebar ─────────── */}
        <aside className="lg:sticky lg:top-[68px] space-y-5 min-w-0">
          {/* Key stats card: the reference's top-right panel */}
          <div className="rounded-lg border border-neutral-200/60 bg-white p-5 shadow-xs">
            <div className="flex items-end justify-between gap-3 pb-3 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <span className="text-2xl font-black text-neutral-950 font-mono-num">
                    {stars.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">stars</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <GitFork className="h-3.5 w-3.5 text-neutral-500" />
                  <span className="text-base font-black text-neutral-950 font-mono-num">
                    {forks.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-500">forks</span>
              </div>
            </div>
            <div className="divide-y divide-neutral-200/70">
              {sidebarRows.map((row) => (
                <StatRow key={row.label} {...row} />
              ))}
              <div className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-[11px] font-semibold text-neutral-500 shrink-0">
                  Repository
                </span>
                <a
                  href={`https://github.com/${repo.owner.login}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-black text-mint-600 hover:text-mint-700 hover:underline truncate font-mono-num"
                >
                  {repo.full_name}
                </a>
              </div>
            </div>
            {!live && (
              <p className="mt-2 border-t border-neutral-200 pt-2.5 text-[10px] font-medium text-neutral-500">
                Live GitHub data (commit, version, license) syncs in when the API is reachable.
              </p>
            )}
            {health && (
              <details className="mt-2 border-t border-neutral-200 pt-2.5 text-[10px] text-neutral-500">
                <summary className="cursor-pointer font-semibold text-neutral-600 hover:text-neutral-900">
                  How the health score is computed
                </summary>
                <p className="mt-1.5 leading-relaxed">
                  {healthExplain}. Activity decays with days since the last push, and archived
                  projects cap at 30. Grade bands: A at 85+, B at 70+, C at 55+, D at 40+.
                  {' '}{REPO_HEALTH_GENERATED_AT && `Snapshot signals refreshed ${REPO_HEALTH_GENERATED_AT.slice(0, 10)}.`}
                </p>
              </details>
            )}
          </div>

          {/* Featured/promo card: BorderBeam in the repo card's shape, sized for the rail */}
          {onOpenFeatured && (
            <BorderBeam
              size="md"
              colorVariant="colorful"
              strength={0.7}
              borderRadius={4}
              className="w-full rounded-lg"
            >
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenFeatured();
                }}
                className="group flex w-full flex-col rounded-lg border border-neutral-200 bg-white p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:bg-neutral-100 hover:shadow-[0_4px_20px_-4px_rgba(25,25,24,0.08)]"
              >
                <span className="flex items-start justify-between gap-2.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-all duration-200 group-hover:border-neutral-500 group-hover:bg-mint-500 group-hover:text-white">
                    <Star className="h-4 w-4" />
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-mint-500/15 px-1.5 py-0.5 text-[9px] font-bold text-mint-600 ring-1 ring-inset ring-mint-500/40">
                    Featured
                  </span>
                </span>
                <span className="mt-4 block text-[15px] font-bold tracking-tight text-neutral-950 group-hover:text-mint-600 transition-colors">
                  The featured spot is open
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-neutral-500 group-hover:text-neutral-700 transition-colors">
                  Put your product at the top of TopSAAS
                </span>
                <span className="mt-1.5 block text-[12.5px] font-medium leading-relaxed text-neutral-600 group-hover:text-neutral-800 transition-colors">
                  Claim the featured spot for 30 days, seen by every builder who visits.
                </span>
                <span className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 group-hover:border-neutral-200 pt-3 transition-colors">
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                    <span className="font-bold text-neutral-900 font-mono-num">30 days</span>
                  </span>
                  <span className="shrink-0 btn-primary px-3 py-1.5 text-[11px] font-bold">
                    Reserve spot
                  </span>
                </span>
              </button>
            </BorderBeam>
          )}
        </aside>
        </div>

        {/* ─────────── Similar open source projects: full width, below ─────────── */}
        <section className="space-y-3">
          <SectionLabel>
            Similar open source projects
          </SectionLabel>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-neutral-200 bg-neutral-200 sm:grid-cols-2 lg:grid-cols-4">
            {relatedRepos.map((r) => (
              <button
                key={r.full_name}
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onSelectRepo(r);
                }}
                className="group flex flex-col bg-white p-5 text-left transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:bg-neutral-100 hover:shadow-[0_4px_20px_-4px_rgba(25,25,24,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-white transition-all duration-200 group-hover:border-neutral-500">
                    <img
                      src={r.owner.avatar_url}
                      alt={r.owner.login}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </span>
                  <span className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 text-neutral-500 opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:border-neutral-300 group-hover:bg-neutral-900 group-hover:text-white">
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
                <p className="mt-4 truncate text-[15px] font-bold tracking-tight text-neutral-950 group-hover:text-mint-600 transition-colors">
                  {r.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-medium text-neutral-500 group-hover:text-neutral-700 transition-colors">
                  {r.owner.login}
                </p>
                <p className="mt-1.5 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-600 group-hover:text-neutral-800 line-clamp-2 transition-colors">
                  {plainCopy(r.description || '')}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-neutral-200 group-hover:border-neutral-200 pt-3 transition-colors">
                  <div className="flex items-center gap-2.5 text-[11px] text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                      <span className="font-bold text-neutral-900 font-mono-num">
                        {formatStars(r.stargazers_count)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitFork className="h-3 w-3 text-neutral-500" />
                      <span className="font-mono-num">{r.forks_count}</span>
                    </span>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    {r.language && (
                      <span className="shrink-0 rounded border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                        {r.language}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
