// Refreshes live GitHub signals for every curated repo in one pass:
//   - stargazers_count / forks_count in src/data/curatedRepos.ts
//   - src/data/repoHealth.ts (via scripts/gen-repo-health.mjs)
//
// Uses the REST /repos/{owner}/{repo} endpoint (one request per repo) instead of
// the owner-search pass, so an authenticated run fits comfortably inside the
// 5,000 req/hour primary limit.
//
// Run: GITHUB_TOKEN=ghp_... node scripts/refresh-repo-data.mjs
// Progress is cached in .freebuff/repo-refresh-cache.json — safe to re-run/resume.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOKEN = process.env.GITHUB_TOKEN || '';
if (!TOKEN) {
  console.error('GITHUB_TOKEN is required — the unauthenticated limit (60 req/hour) cannot cover ~3,830 repos.');
  process.exit(1);
}

const CURATED = join(root, 'src', 'data', 'curatedRepos.ts');
const REFRESH_CACHE = join(root, '.freebuff', 'repo-refresh-cache.json');
const HEALTH_CACHE = join(root, '.freebuff', 'repo-health-cache.json');
const CONCURRENCY = 8;
const REUSE_MS = 6 * 60 * 60 * 1000; // reuse partial progress for 6h
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const src = readFileSync(CURATED, 'utf8');
const fullNameRe = /^\s*repo\(\s*'(?:\\.|[^'])*'\s*,\s*'((?:\\.|[^'])*)'/gm;
const unique = [...new Set([...src.matchAll(fullNameRe)].map((m) => m[1]))];
log(`curated: ${unique.length} unique repos`);

mkdirSync(join(root, '.freebuff'), { recursive: true });
let refreshCache = {};
if (existsSync(REFRESH_CACHE)) {
  try {
    refreshCache = JSON.parse(readFileSync(REFRESH_CACHE, 'utf8'));
    for (const [fn, data] of Object.entries(refreshCache)) {
      if (!data?.at || Date.now() - data.at > REUSE_MS) delete refreshCache[fn];
    }
    log(`resuming with ${Object.keys(refreshCache).length} cached lookups`);
  } catch {}
}
const saveRefreshCache = () => writeFileSync(REFRESH_CACHE, JSON.stringify(refreshCache));

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'topsaas-refresh' };
headers.Authorization = `Bearer ${TOKEN}`;

const pick = (i) => ({
  at: Date.now(),
  full_name: i.full_name,
  pushed_at: i.pushed_at,
  created_at: i.created_at,
  stars: i.stargazers_count ?? 0,
  forks: i.forks_count ?? 0,
  open_issues: i.open_issues_count ?? 0,
  license: i.license?.spdx_id ?? null,
  archived: !!i.archived,
  topics: Array.isArray(i.topics) ? i.topics.length : 0,
});

const missing = new Map();
const renamed = [];
let networkRequests = 0;

async function fetchRepo(fullName) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    let res;
    try {
      res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
    } catch (err) {
      log(`network error for ${fullName}: ${err.message}`);
      await sleep(3000 * attempt);
      continue;
    }
    networkRequests++;
    if (res.status === 200) {
      const json = await res.json();
      if (json.full_name && json.full_name.toLowerCase() !== fullName.toLowerCase()) {
        renamed.push(`${fullName} → ${json.full_name}`);
      }
      return pick(json);
    }
    if (res.status === 404 || res.status === 410 || res.status === 451) {
      missing.set(fullName, res.status);
      return null;
    }
    if (res.status === 403 || res.status === 429) {
      const retryAfter = Number(res.headers.get('retry-after') || 0) * 1000;
      const reset = Number(res.headers.get('x-ratelimit-reset') || 0) * 1000;
      const wait =
        retryAfter ||
        (res.headers.get('x-ratelimit-remaining') === '0'
          ? Math.max(2000, reset - Date.now() + 3000)
          : 30_000);
      log(`rate-limited (HTTP ${res.status}), waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    log(`HTTP ${res.status} for ${fullName}, retrying`);
    await sleep(2000 * attempt);
  }
  missing.set(fullName, 'retries exhausted');
  return null;
}

const queue = unique.filter((fn) => !refreshCache[fn]);
if (queue.length < unique.length) log(`skipping ${unique.length - queue.length} already cached`);
let cursor = 0;
let done = 0;
let sinceSave = 0;

async function worker() {
  while (cursor < queue.length) {
    const fn = queue[cursor++];
    const data = await fetchRepo(fn);
    if (data) refreshCache[fn] = data;
    done++;
    sinceSave++;
    if (sinceSave >= 100) {
      sinceSave = 0;
      saveRefreshCache();
    }
    if (done % 250 === 0 || done === queue.length) {
      log(`${done}/${queue.length} fetched (${networkRequests} requests, ${missing.size} unavailable)`);
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
saveRefreshCache();

const fetched = unique.filter((fn) => refreshCache[fn]);
log(`fetched ${fetched.length}/${unique.length}`);
if (fetched.length < unique.length * 0.9) {
  console.error(
    `Only ${fetched.length}/${unique.length} repos could be fetched — refusing to publish a partial refresh.`,
  );
  process.exit(1);
}

// ── 1. Update star/fork counts in curatedRepos.ts ─────────────────────────
const repoLineRe =
  /^(\s*repo\(\s*'(?:\\.|[^'])*'\s*,\s*'((?:\\.|[^'])*)'\s*,\s*'(?:\\.|[^'])*'\s*,\s*'(?:\\.|[^'])*'\s*,\s*)(\d+)(\s*,\s*)(\d+)(\s*,)/gm;
let touched = 0;
let nextSrc = src.replace(repoLineRe, (match, pre, fn, stars, sep1, forks, sep2) => {
  const data = refreshCache[fn];
  if (!data) return match;
  touched++;
  if (String(data.stars) === stars && String(data.forks) === forks) return match;
  return `${pre}${data.stars}${sep1}${data.forks}${sep2}`;
});
const refreshedComment = `// Star and fork counts refreshed from the GitHub API on ${new Date().toISOString().slice(0, 10)}`;
nextSrc = nextSrc
  .replace(/^\/\/ All star\/fork counts verified against GitHub on .*$/m, refreshedComment)
  .replace(/^\/\/ Star and fork counts refreshed from the GitHub API on \d{4}-\d{2}-\d{2}$/m, refreshedComment);
writeFileSync(CURATED, nextSrc);
log(`curatedRepos.ts: updated star/fork counts on ${touched} rows`);

// ── 2. Update the raw health-signal cache, then regenerate repoHealth.ts ──
// .freebuff/ is gitignored, so seed from the committed snapshot first. This keeps
// repos that now 404 upstream (and are therefore never re-fetched) in the output.
const healthOut = join(root, 'src', 'data', 'repoHealth.ts');
const generatedLineRe =
  /^  "((?:[^"\\]|\\.)*)": \{ pushedAt: ("(?:[^"\\]|\\.)*"|null), createdAt: ("(?:[^"\\]|\\.)*"|null), stars: (\d+), forks: (\d+), openIssues: (\d+), license: ("(?:[^"\\]|\\.)*"|null), archived: (true|false), topics: (\d+) \},?$/gm;
let healthCache = {};
if (existsSync(healthOut)) {
  for (const m of readFileSync(healthOut, 'utf8').matchAll(generatedLineRe)) {
    const str = (v) => (v === 'null' ? null : JSON.parse(v));
    healthCache[JSON.parse(`"${m[1]}"`)] = {
      pushed_at: str(m[2]),
      created_at: str(m[3]),
      stars: Number(m[4]),
      forks: Number(m[5]),
      open_issues: Number(m[6]),
      license: str(m[7]),
      archived: m[8] === 'true',
      topics: Number(m[9]),
    };
  }
  log(`seeded ${Object.keys(healthCache).length} repos from committed repoHealth.ts`);
}
if (existsSync(HEALTH_CACHE)) {
  try {
    healthCache = { ...healthCache, ...JSON.parse(readFileSync(HEALTH_CACHE, 'utf8')) };
  } catch {}
}
let licenseChanges = 0;
let archivedCount = 0;
for (const fn of fetched) {
  const data = refreshCache[fn];
  const prev = healthCache[fn];
  if (prev && prev.license !== data.license) licenseChanges++;
  if (data.archived) archivedCount++;
  healthCache[fn] = {
    pushed_at: data.pushed_at,
    created_at: data.created_at,
    stars: data.stars,
    forks: data.forks,
    open_issues: data.open_issues,
    license: data.license,
    archived: data.archived,
    topics: data.topics,
  };
}
writeFileSync(HEALTH_CACHE, JSON.stringify(healthCache));
log(`health cache: ${Object.keys(healthCache).length} repos (${licenseChanges} license changes, ${archivedCount} archived)`);

execFileSync(process.execPath, [join(root, 'scripts', 'gen-repo-health.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, GITHUB_TOKEN: TOKEN },
});

// ── 3. Report ─────────────────────────────────────────────────────────────
if (renamed.length) {
  log(`${renamed.length} renamed upstream (kept existing slugs):`);
  for (const r of renamed.slice(0, 20)) log(`  ${r}`);
}
if (missing.size) {
  log(`${missing.size} repos could not be refreshed (kept previous data):`);
  for (const [fn, reason] of [...missing.entries()].slice(0, 20)) log(`  ${fn}: ${reason}`);
}
log('done');
