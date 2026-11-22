import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { CuratedRepo } from '../data/curatedRepos';
import { REPO_HEALTH } from '../data/repoHealth';
import { plainCopy } from '../utils/plainCopy';
import { playSound } from '../utils/sound';
import { getWebsiteFavicon } from '../utils/logo';
import { getLicenseSafety } from '../utils/licenseSafety';
import { cn } from '@/lib/utils';

interface RepoCardProps {
  repo: CuratedRepo;
  onOpen?: (repo: CuratedRepo) => void;
  soundEnabled: boolean;
  className?: string;
  /** Curated license override, used when health data is missing. */
  license?: string | null;
}

const BOOKMARKS_STORAGE_KEY = 'topsaas_bookmarked_repos';

let repoDetailChunk: Promise<unknown> | null = null;

/** Download the repo detail chunk ahead of a click so the route opens instantly. */
export function prefetchRepoDetail(): Promise<unknown> {
  if (!repoDetailChunk) repoDetailChunk = import('./RepoDetailPage');
  return repoDetailChunk;
}

export function getSavedRepos(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSavedRepo(fullName: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const current = getSavedRepos();
    const idx = current.indexOf(fullName);
    let next: string[];
    let bookmarked: boolean;
    if (idx >= 0) {
      next = current.filter((x) => x !== fullName);
      bookmarked = false;
    } else {
      next = [...current, fullName];
      bookmarked = true;
    }
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('topsaas_bookmarks_updated'));
    return bookmarked;
  } catch {
    return false;
  }
}

// Curated mapping of well-known open-source repos to their commercial/popular targets
const KNOWN_ALTERNATIVES: Record<string, { target: string; domain: string }> = {
  'ggerganov/llama.cpp': { target: 'OpenAI API', domain: 'openai.com' },
  'rustdesk/rustdesk': { target: 'TeamViewer', domain: 'teamviewer.com' },
  'TradingAgents': { target: 'LSEG Workspace', domain: 'lseg.com' },
  'browser-use/browser-use': { target: 'Skyvern', domain: 'skyvern.com' },
  'supabase/supabase': { target: 'Firebase', domain: 'firebase.google.com' },
  'documenso/documenso': { target: 'DocuSign', domain: 'docusign.com' },
  'OpenSignLabs/OpenSign': { target: 'DocuSign', domain: 'docusign.com' },
  'docmost/docmost': { target: 'Confluence & Notion', domain: 'notion.so' },
  'opf/openproject': { target: 'Jira', domain: 'atlassian.com' },
  'baserow/baserow': { target: 'Airtable', domain: 'airtable.com' },
  'nocodb/nocodb': { target: 'Airtable', domain: 'airtable.com' },
  'matomo-org/matomo': { target: 'Google Analytics', domain: 'analytics.google.com' },
  'windmill-labs/windmill': { target: 'Retool & Temporal', domain: 'retool.com' },
  'calcom/cal.diy': { target: 'Calendly', domain: 'calendly.com' },
  'plausible/analytics': { target: 'Google Analytics', domain: 'analytics.google.com' },
  'umami-software/umami': { target: 'Google Analytics', domain: 'analytics.google.com' },
  'posthog/posthog': { target: 'Mixpanel & Amplitude', domain: 'mixpanel.com' },
  'chatwoot/chatwoot': { target: 'Intercom & Zendesk', domain: 'intercom.com' },
  'twentyhq/twenty': { target: 'Salesforce & HubSpot', domain: 'salesforce.com' },
  'appwrite/appwrite': { target: 'Firebase', domain: 'firebase.google.com' },
  'directus/directus': { target: 'Contentful', domain: 'contentful.com' },
  'strapi/strapi': { target: 'Contentful', domain: 'contentful.com' },
  'ghost/ghost': { target: 'Substack & Medium', domain: 'substack.com' },
  'infisical/infisical': { target: 'HashiCorp Vault', domain: 'hashicorp.com' },
  'n8n-io/n8n': { target: 'Zapier & Make', domain: 'zapier.com' },
  'activepieces/activepieces': { target: 'Zapier', domain: 'zapier.com' },
  'formbricks/formbricks': { target: 'Typeform', domain: 'typeform.com' },
  'novuhq/novu': { target: 'Courier', domain: 'courier.com' },
  'anti-work/shortest': { target: 'Playwright', domain: 'playwright.dev' },
  'excalidraw/excalidraw': { target: 'Miro', domain: 'miro.com' },
  'affine-design/affine': { target: 'Notion & Miro', domain: 'notion.so' },
  'hoppscotch/hoppscotch': { target: 'Postman', domain: 'postman.com' },
  'usebruno/bruno': { target: 'Postman', domain: 'postman.com' },
  'coollabsio/coolify': { target: 'Heroku & Vercel', domain: 'vercel.com' },
  'cryptpad/cryptpad': { target: 'Google Docs', domain: 'docs.google.com' },
  'jgraph/drawio': { target: 'Lucidchart & Visio', domain: 'lucidchart.com' },
  'LibreOffice/core': { target: 'Microsoft Office', domain: 'microsoft.com' },
  'penpot/penpot': { target: 'Figma', domain: 'figma.com' },
  'typebot-io/typebot': { target: 'Typeform', domain: 'typeform.com' },
  'glitchtip/glitchtip': { target: 'Sentry', domain: 'sentry.io' },
  'meilisearch/meilisearch': { target: 'Algolia', domain: 'algolia.com' },
  'typesense/typesense': { target: 'Algolia', domain: 'algolia.com' },
  'keycloak/keycloak': { target: 'Auth0 & Okta', domain: 'auth0.com' },
  'ory/kratos': { target: 'Auth0', domain: 'auth0.com' },
  'supertokens/supertokens-core': { target: 'Auth0', domain: 'auth0.com' },
  'minio/minio': { target: 'AWS S3', domain: 'aws.amazon.com' },
  'grafana/grafana': { target: 'Datadog', domain: 'datadoghq.com' },
  'uptimekuma/uptime-kuma': { target: 'Better Uptime & Pingdom', domain: 'betterstack.com' },
  'louislam/uptime-kuma': { target: 'Better Uptime', domain: 'betterstack.com' },
  'shadcn-ui/ui': { target: 'Tailwind UI', domain: 'tailwindui.com' },
  'tailwindlabs/tailwindcss': { target: 'Bootstrap', domain: 'getbootstrap.com' },
  'redis/redis': { target: 'Memcached', domain: 'memcached.org' },
  'ClickHouse/ClickHouse': { target: 'Snowflake & BigQuery', domain: 'snowflake.com' },
  'duckdb/duckdb': { target: 'SQLite', domain: 'sqlite.org' },
};

interface AlternativeResult {
  target: string;
  domain?: string;
  logoUrl?: string;
}

export function getRepoAlternativeInfo(repo: CuratedRepo): AlternativeResult | null {
  const direct = KNOWN_ALTERNATIVES[repo.full_name] || KNOWN_ALTERNATIVES[repo.name];
  if (direct) {
    return {
      target: direct.target,
      domain: direct.domain,
      logoUrl: getWebsiteFavicon(direct.domain, 32),
    };
  }

  // Regex extract from description e.g. "Alternative to X" or "X alternative"
  const desc = repo.description || '';
  const match1 = desc.match(/(?:open[- ]source\s+)?alternative to\s+([A-Z0-9][A-Za-z0-9\s&+\-.]+?)(?:[\.,;]|\s+and\s+|$)/i);
  if (match1 && match1[1] && match1[1].trim().length < 30) {
    const target = match1[1].trim();
    return { target };
  }

  const match2 = desc.match(/(?:free\s+&?\s*|best\s+)?([A-Z0-9][A-Za-z0-9\s&+\-.]+?)\s+alternative/i);
  if (match2 && match2[1] && match2[1].trim().length < 30) {
    const target = match2[1].trim();
    return { target };
  }

  return null;
}

export function isRepoNew(repo: CuratedRepo): boolean {
  const signals = REPO_HEALTH[repo.full_name];
  if (signals?.createdAt) {
    const createdTime = new Date(signals.createdAt).getTime();
    // Projects created within the last ~18 months
    if (Date.now() - createdTime < 540 * 24 * 60 * 60 * 1000) {
      return true;
    }
  }
  // Fallback heuristic for newly curated repo entries
  return repo.id >= 3800;
}

export const RepoCard: React.FC<RepoCardProps> = ({
  repo,
  onOpen,
  soundEnabled,
  className = '',
  license,
}) => {
  const [imgError, setImgError] = useState<boolean>(false);

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    playSound('click', soundEnabled);
    if (onOpen) {
      onOpen(repo);
    } else {
      window.location.href = `/repo/${repo.full_name}`;
    }
  };

  const signals = REPO_HEALTH[repo.full_name];
  // Never assume a license: if we do not know it, say so instead of claiming MIT.
  const rawLicense = license || signals?.license || null;
  const safety = getLicenseSafety(rawLicense);
  const isNew = isRepoNew(repo);

  return (
    <a
      href={`/repo/${repo.full_name}`}
      onClick={handleCardClick}
      onMouseEnter={() => { void prefetchRepoDetail(); }}
      onFocus={() => { void prefetchRepoDetail(); }}
      onTouchStart={() => { void prefetchRepoDetail(); }}
      className={cn(
        'group relative flex w-full flex-col justify-between rounded-2xl border border-neutral-200/90 bg-neutral-100 p-3.5 sm:p-4 text-left shadow-2xs transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-200/60 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer overflow-hidden min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        className
      )}
    >
      <div>
        {/* Top Row: Square Logo + Title & Subtitle */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border border-neutral-200 bg-neutral-100 shrink-0 overflow-hidden relative flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs">
            <img
              src={imgError ? `https://ui-avatars.com/api/?name=${encodeURIComponent(repo.name)}&background=f3f4f6&color=111827&bold=true` : repo.owner.avatar_url}
              alt={repo.name}
              width={40}
              height={40}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* Title + NEW badge */}
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="truncate text-sm sm:text-[15px] font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
                {repo.name}
              </h3>
              {isNew && (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200">
                  NEW
                </span>
              )}
            </div>

            {/* Subtitle: Category */}
            <div className="mt-0.5 flex items-center text-[11px] font-medium text-neutral-500 truncate">
              <span className="truncate">
                {repo.category}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Description paragraph */}
        {repo.description && (
          <p className="mt-2.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed font-normal">
            {plainCopy(repo.description)}
          </p>
        )}
      </div>

      {/* Bottom Row: Stars (Left) + License (Right) (Matches Image 3) */}
      <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
        {/* Star count with star icon */}
        <div className="inline-flex items-center gap-1 text-neutral-600">
          <Star className="h-3 w-3 text-neutral-400 group-hover:text-amber-500 group-hover:fill-amber-400 transition-colors" />
          <span className="font-mono-num font-semibold text-neutral-800">
            {repo.stargazers_count.toLocaleString()}
          </span>
        </div>

        {/* License with Safety dot */}
        <div className="inline-flex items-center gap-1.5 text-neutral-500" title={safety.plainExplanation}>
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${safety.colorClasses.dotBg}`} />
          <span className="font-medium text-neutral-700 truncate max-w-[120px]">
            {safety.shortLabel}
          </span>
        </div>
      </div>
    </a>
  );
};
