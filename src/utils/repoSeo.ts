import type { CuratedRepo, RepoCategory } from '../data/curatedRepos';
import { CURATED_REPOS } from '../data/curatedRepos';
import { plainCopy } from './plainCopy';

export const SITE_URL = 'https://www.topsaas.space';

export interface RepoCapability {
  title: string;
  body: string;
}

export interface RepoEditorial {
  lead: string;
  core: string;
  capabilities: RepoCapability[];
  closing: string;
}

export interface RepoEditorialSignals {
  topics?: string[];
  license?: string | null;
}

export interface RepoEditorialContext {
  stars: number;
  forks: number;
  rank: number;
  peerCount: number;
  selfHosted: boolean;
}

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

const SELF_HOST_TERMS = new Set([
  'self-hosted',
  'selfhosted',
  'self-hosting',
  'self-hostable',
  'selfhost',
  'on-premise',
  'onpremise',
]);

export const detectSelfHosted = (topics: string[], description: string): boolean =>
  topics.some((t) => SELF_HOST_TERMS.has(t.toLowerCase().replace(/\s+/g, '-'))) ||
  /self[- ]host/i.test(description);

const ensurePeriod = (s: string): string => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);

/** Pull the strongest capability lines out of the repo's live topics. */
const capabilitiesFromTopics = (topics: string[]): RepoCapability[] => {
  const lower = topics.map((t) => t.toLowerCase().trim());
  const out: RepoCapability[] = [];
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
 * The page's own write-up of the repo: editorial prose built from curated data
 * plus live GitHub signals. Never the README pasted back at the reader.
 */
export const buildRepoEditorial = (
  repo: CuratedRepo,
  signals?: RepoEditorialSignals,
  ctx?: Partial<RepoEditorialContext>
): RepoEditorial => {
  const usePhrase =
    CATEGORY_USE[repo.category] ?? 'building the next version of your product';
  const noun = CATEGORY_NOUN[repo.category] ?? 'open-source project';
  const desc = ensurePeriod(plainCopy(repo.description) || `${repo.full_name} on GitHub.`);
  const licenseBit = signals?.license ? `, released under the ${signals.license} license` : '';

  const peers = CURATED_REPOS.filter((r) => r.category === repo.category);
  const byStars = (a: CuratedRepo, b: CuratedRepo) => b.stargazers_count - a.stargazers_count;
  const sortedPeers = [...peers].sort(byStars);
  const calculatedRank = sortedPeers.findIndex((r) => r.full_name === repo.full_name) + 1;
  const rank = ctx?.rank ?? (calculatedRank > 0 ? calculatedRank : 1);
  const peerCount = ctx?.peerCount ?? peers.length;
  const stars = ctx?.stars ?? repo.stargazers_count;
  const forks = ctx?.forks ?? repo.forks_count;
  const isSelfHosted = ctx?.selfHosted ?? false;

  const lead =
    `${desc} ` +
    `In our ${repo.category} collection it ranks #${rank} of ${peerCount} by stars` +
    `${repo.language ? `, and most of the code is ${repo.language}` : ''}` +
    `${licenseBit}. Maintained in the open by ${repo.owner.login}.`;

  let core: string;
  if (isSelfHosted) {
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

  const capabilities: RepoCapability[] = signals?.topics
    ? capabilitiesFromTopics(signals.topics)
    : [];
  if (capabilities.length < 3) {
    const fillers: RepoCapability[] = [
      {
        title: 'Community-backed',
        body: `${stars.toLocaleString()} stars and ${forks.toLocaleString()} forks: real production use, active issues and answers when you get stuck`,
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
        title: 'In the TopSAAS catalog',
        body: `curated for our ${repo.category} catalog alongside its license, activity and self-hosting signals`,
      },
    ];
    for (const f of fillers) {
      if (capabilities.length >= 3) break;
      capabilities.push(f);
    }
  }

  const closingTail = isSelfHosted
    ? 'and because it is self-hostable, the data and the limits stay yours'
    : signals?.license
      ? `and the ${signals.license} license means you can build on it freely`
      : 'and its community keeps it maintained';

  const closing =
    `${repo.name} fits naturally into a stack when you're ${usePhrase}. ` +
    `The numbers back it up: ${stars.toLocaleString()} stars and ${forks.toLocaleString()} forks, ${closingTail}.`;

  return { lead, core, capabilities, closing };
};

/* ───────────────────────── head metadata ───────────────────────── */

export const repoCanonicalUrl = (fullName: string): string => `${SITE_URL}/repo/${fullName}`;

const TRAILING_FILLER = /\b(?:and|or|with|for|the|a|an|to|of|in|on|by|from|your|you|that|which)$/i;

/** Drop dangling punctuation and filler words so clipped copy ends cleanly. */
const tidyTail = (text: string): string => {
  let out = text.trim().replace(/[\s,;:\-–—]+$/, '');
  for (let i = 0; i < 2; i++) {
    const next = out.replace(TRAILING_FILLER, '').replace(/[\s,;:\-–—]+$/, '');
    if (next === out) break;
    out = next;
  }
  return out;
};

const clip = (text: string, max: number): string => {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, Math.max(1, max - 1));
  const space = cut.lastIndexOf(' ');
  const head = space > max * 0.5 ? cut.slice(0, space) : cut;
  return `${tidyTail(head)}…`;
};

/** Repo names are not unique across owners (forks, rewrites, homonyms). */
const duplicateNames = (() => {
  const unique = new Map<string, string>();
  for (const repo of CURATED_REPOS) unique.set(repo.full_name, repo.name);
  const counts = new Map<string, number>();
  for (const name of unique.values()) counts.set(name, (counts.get(name) ?? 0) + 1);
  const dupes = new Set<string>();
  for (const [name, count] of counts) if (count > 1) dupes.add(name);
  return dupes;
})();

/** Unique, length-bounded title shared by the prerendered HTML and the SPA. */
export const repoSeoTitle = (repoOrName: CuratedRepo | string, category?: string, description?: string): string => {
  if (typeof repoOrName === 'string') {
    const brand = ' | TopSAAS';
    const label = repoOrName;
    const desc = tidyTail(plainCopy(description || '').replace(/[.!?]+$/, ''));
    if (!desc) return `${label}${brand}`;
    const budget = Math.max(24, 60 - label.length - 2 - brand.length);
    return `${label}: ${clip(desc, budget)}${brand}`;
  }
  const repo = repoOrName;
  const brand = ' | TopSAAS';
  const label = duplicateNames.has(repo.name) ? repo.full_name : repo.name;
  const desc = tidyTail(plainCopy(repo.description || '').replace(/[.!?]+$/, ''));
  if (!desc) return `${label}${brand}`;
  const budget = Math.max(24, 60 - label.length - 2 - brand.length);
  return `${label}: ${clip(desc, budget)}${brand}`;
};

/** Unique meta description around 150 to 158 characters. */
export const repoSeoDescription = (repoOrName: CuratedRepo | string, description?: string, category?: string): string => {
  if (typeof repoOrName === 'string') {
    const base = tidyTail(plainCopy(description || '').replace(/[.!?]+$/, ''));
    const cat = category ? `${category} ` : '';
    const owner = `Open source ${cat}project: ${repoOrName}.`;
    const fixed = `${owner}`;
    const budget = 158 - fixed.length - 2;
    const lead = budget < 40 ? '' : base.length <= budget ? `${base}. ` : `${clip(base, budget)} `;
    const out = `${lead}${fixed}`;
    return out.length <= 158 ? out : fixed;
  }
  const repo = repoOrName;
  const base = tidyTail(plainCopy(repo.description || '').replace(/[.!?]+$/, ''));
  const ownerLogin = repo.owner?.login || (repo.full_name ? repo.full_name.split('/')[0] : 'maintainers');
  const owner = `Open source ${repo.category || ''} project by ${ownerLogin}.`;
  const stats = `${(repo.stargazers_count || 0).toLocaleString('en-US')} stars and ${(repo.forks_count || 0).toLocaleString('en-US')} forks.`;
  const fixed = `${owner} ${stats}`;
  const budget = 158 - fixed.length - 2;
  const lead = budget < 40 ? '' : base.length <= budget ? `${base}. ` : `${clip(base, budget)} `;
  const out = `${lead}${fixed}`;
  return out.length <= 158 ? out : fixed;
};
