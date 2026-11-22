// Fails when the committed repo-data snapshot is stale or incomplete.
//
// "Stale" means src/data/repoHealth.ts (or the curated star/fork counts) was
// last refreshed longer ago than MAX_AGE_DAYS (default 32 — monthly refresh plus
// a day of grace). "Incomplete" means a curated repo has no health signals,
// which normally means a new repo was added without re-running the refresh.
//
// Run: node scripts/check-repo-data-freshness.mjs
//      MAX_AGE_DAYS=32 node scripts/check-repo-data-freshness.mjs
// Used by .github/workflows/refresh-repo-data.yml as the loud staleness gate.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_AGE_DAYS = Number(process.env.MAX_AGE_DAYS || 32);
const DAY_MS = 24 * 60 * 60 * 1000;

const errors = [];
const fail = (message) => errors.push(message);
const note = (message) => console.log(message);

const healthSrc = readFileSync(join(root, 'src', 'data', 'repoHealth.ts'), 'utf8');
const curatedSrc = readFileSync(join(root, 'src', 'data', 'curatedRepos.ts'), 'utf8');

// ── Snapshot date ────────────────────────────────────────────────────────
const generatedMatch = /REPO_HEALTH_GENERATED_AT = "([^"]+)"/.exec(healthSrc);
if (!generatedMatch) {
  fail('REPO_HEALTH_GENERATED_AT is missing from src/data/repoHealth.ts');
} else {
  const generatedAt = new Date(generatedMatch[1]);
  if (Number.isNaN(generatedAt.getTime())) {
    fail(`REPO_HEALTH_GENERATED_AT is not a valid date: ${generatedMatch[1]}`);
  } else {
    const ageDays = (Date.now() - generatedAt.getTime()) / DAY_MS;
    if (ageDays > MAX_AGE_DAYS) {
      fail(
        `Repo data snapshot is ${Math.floor(ageDays)} days old (limit ${MAX_AGE_DAYS}); ` +
          `last generated ${generatedAt.toISOString()}.`,
      );
    } else if (ageDays < -1) {
      fail(`Repo data snapshot is dated in the future: ${generatedAt.toISOString()}`);
    } else {
      note(`snapshot: ${generatedAt.toISOString()} (${Math.floor(ageDays)} days old, limit ${MAX_AGE_DAYS})`);
    }
  }
}

// ── Curated counts date (must move with the snapshot) ────────────────────
const curatedMatch = /^\/\/ Star and fork counts refreshed from the GitHub API on (\d{4}-\d{2}-\d{2})$/m.exec(
  curatedSrc,
);
if (!curatedMatch) {
  fail('src/data/curatedRepos.ts has no "Star and fork counts refreshed..." date comment');
} else {
  const curatedDate = new Date(`${curatedMatch[1]}T00:00:00Z`);
  const ageDays = (Date.now() - curatedDate.getTime()) / DAY_MS;
  if (ageDays > MAX_AGE_DAYS + 1) {
    fail(
      `curatedRepos.ts star/fork counts are ${Math.floor(ageDays)} days old ` +
        `(refreshed ${curatedMatch[1]}, limit ${MAX_AGE_DAYS}).`,
    );
  }
}

// ── Coverage: every curated repo needs health signals ────────────────────
const nameRe = /^\s*repo\(\s*'(?:[^'\\]|\\.)*'\s*,\s*'((?:[^'\\]|\\.)*)'/gm;
const curated = new Set([...curatedSrc.matchAll(nameRe)].map((m) => m[1].replace(/\\(.)/g, '$1')));
const healthKeys = new Set();
for (const match of healthSrc.matchAll(/^  "((?:[^"\\]|\\.)*)": \{/gm)) {
  healthKeys.add(JSON.parse(`"${match[1]}"`));
}
const missing = [...curated].filter((fn) => !healthKeys.has(fn));
if (missing.length) {
  fail(
    `${missing.length} curated repo(s) have no health snapshot` +
      (missing.length <= 10 ? `: ${missing.join(', ')}` : ''),
  );
  note(`coverage: ${curated.size - missing.length}/${curated.size}`);
} else {
  note(`coverage: ${curated.size}/${curated.size} curated repos`);
}

// ── Result ───────────────────────────────────────────────────────────────
if (errors.length) {
  for (const message of errors) {
    console.error(process.env.GITHUB_ACTIONS ? `::error::${message}` : `ERROR: ${message}`);
  }
  console.error('\nRepo data needs a refresh. Run:');
  console.error('  GITHUB_TOKEN=<token> npm run refresh:repo-data');
  process.exit(1);
}
note('repo data is fresh');
