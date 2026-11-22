// Generates src/data/repoHealth.ts — raw GitHub signals (pushed/created dates,
// stars, forks, open issues, license, archived, topics) for every curated repo.
// The health score itself is computed at runtime by src/utils/repoHealth.ts so
// the formula has a single source of truth.
//
// Run: node scripts/gen-repo-health.mjs
// Set GITHUB_TOKEN for a faster run (higher search rate + direct-repo fallback).
// Progress is cached in .freebuff/repo-health-cache.json — safe to re-run/resume.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.GITHUB_TOKEN || '';
const CACHE = join(root, '.freebuff', 'repo-health-cache.json');
const OUT = join(root, 'src', 'data', 'repoHealth.ts');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

// ── 1. Curated repo list ──────────────────────────────────────────────────
const src = readFileSync(join(root, 'src', 'data', 'curatedRepos.ts'), 'utf8');
const re = /^\s*repo\(\s*'([^']+)',\s*'([^']+)'/gm;
const wanted = [...src.matchAll(re)].map((m) => m[2]);
const unique = [...new Set(wanted)];
const byOwner = new Map();
for (const fn of unique) {
  const [owner] = fn.split('/');
  if (!byOwner.has(owner)) byOwner.set(owner, []);
  byOwner.get(owner).push(fn);
}
log(`curated: ${unique.length} repos across ${byOwner.size} owners`);

// ── 2. Cache (resume support) ─────────────────────────────────────────────
mkdirSync(join(root, '.freebuff'), { recursive: true });
let cache = {};
if (existsSync(CACHE)) {
  try {
    cache = JSON.parse(readFileSync(CACHE, 'utf8'));
    log(`resuming with ${Object.keys(cache).length} cached repos`);
  } catch {}
}
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache));

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'topsaas-health-gen' };
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

const pick = (item) => ({
  pushed_at: item.pushed_at,
  created_at: item.created_at,
  stars: item.stargazers_count ?? 0,
  forks: item.forks_count ?? 0,
  open_issues: item.open_issues_count ?? 0,
  license: item.license?.spdx_id ?? null,
  archived: !!item.archived,
  topics: Array.isArray(item.topics) ? item.topics.length : 0,
});

async function searchOwner(owner) {
  const url = `https://api.github.com/search/repositories?q=user:${encodeURIComponent(owner)}&per_page=100&sort=stars&order=desc`;
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(url, { headers });
    if (res.status === 200) return res.json();
    if (res.status === 403 || res.status === 429) {
      const wait = res.headers.get('x-ratelimit-remaining') === '0'
        ? Math.max(1000, Number(res.headers.get('x-ratelimit-reset')) * 1000 - Date.now() + 2000)
        : 60000;
      log(`  rate-limited on ${owner}, waiting ${Math.round(wait / 1000)}s (attempt ${attempt})`);
      await sleep(wait);
      continue;
    }
    if (res.status === 422) {
      log(`  422 for ${owner} (owner not searchable) — skipping`);
      return null;
    }
    log(`  HTTP ${res.status} for ${owner}, retrying in 10s`);
    await sleep(10000);
  }
  return null;
}

async function coreRepo(fullName) {
  const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
  if (res.status === 200) return pick(await res.json());
  log(`  core fallback failed for ${fullName}: HTTP ${res.status}`);
  return null;
}

// ── 3. Owner pass (search API, paced) ─────────────────────────────────────
const pace = TOKEN ? 2100 : 6200;
let done = 0;
for (const [owner, fullNames] of byOwner) {
  if (fullNames.every((fn) => cache[fn])) {
    done += fullNames.length;
    continue;
  }
  const data = await searchOwner(owner);
  if (data && Array.isArray(data.items)) {
    for (const item of data.items) {
      if (fullNames.includes(item.full_name)) cache[item.full_name] = pick(item);
    }
  }
  for (const fn of fullNames) if (!cache[fn]) log(`  not found in owner scan: ${fn}`);
  done += fullNames.length;
  saveCache();
  log(`owner ${owner}: ${Object.keys(cache).length}/${unique.length} (${done}/${unique.length} scanned)`);
  await sleep(pace);
}

// ── 4. Straggler fallback via core API (separate, small budget) ───────────
const missing = unique.filter((fn) => !cache[fn]);
if (missing.length) {
  log(`core-API fallback for ${missing.length} stragglers`);
  for (const fn of missing) {
    const sig = await coreRepo(fn);
    if (sig) cache[fn] = sig;
    saveCache();
    await sleep(TOKEN ? 800 : 1400);
  }
}

// ── 5. Emit TypeScript ────────────────────────────────────────────────────
const found = unique.filter((fn) => cache[fn]).sort();
const generatedAt = new Date().toISOString();
const lines = found.map((fn) => {
  const s = cache[fn];
  const lic = s.license === null ? 'null' : JSON.stringify(s.license);
  return `  ${JSON.stringify(fn)}: { pushedAt: ${JSON.stringify(s.pushed_at)}, createdAt: ${JSON.stringify(s.created_at)}, stars: ${s.stars}, forks: ${s.forks}, openIssues: ${s.open_issues}, license: ${lic}, archived: ${s.archived ? 'true' : 'false'}, topics: ${s.topics} },`;
});
const out = `/* GENERATED FILE — do not edit by hand.
   Created by scripts/gen-repo-health.mjs on ${generatedAt}
   Re-run: node scripts/gen-repo-health.mjs   (set GITHUB_TOKEN for faster runs)
   Raw GitHub signals for curated repos. The health score is computed from
   these at runtime by src/utils/repoHealth.ts — formula lives in one place. */

export interface RepoHealthSignals {
  pushedAt: string;
  createdAt: string;
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  archived: boolean;
  topics: number;
}

export const REPO_HEALTH_GENERATED_AT = ${JSON.stringify(generatedAt)};

export const REPO_HEALTH: Record<string, RepoHealthSignals> = {
${lines.join('\n')}
};
`;
writeFileSync(OUT, out);
log(`wrote ${OUT} with ${found.length}/${unique.length} repos (${unique.length - found.length} missing)`);
if (found.length < unique.length) log('missing:', unique.filter((fn) => !cache[fn]).join(', '));
