import { REPO_HEALTH, RepoHealthSignals } from '../data/repoHealth';

// TopSAAS Repo Health Score — a transparent 0-100 composite. Weights:
//   Activity 40  (days since last push: <=7d full marks, decaying to 0 at 2y)
//   Popularity 25 (log-scaled stars, 30k stars = full marks)
//   Engagement 15 (forks/stars ratio — community that actually clones & builds)
//   Issue load 10 (open issues vs stars — lower is healthier)
//   Hygiene 10   (recognized license + meaningful topics)
// Archived repos are capped at 30. Grades: A >=85, B >=70, C >=55, D >=40, else E.
// The same function scores both the static snapshot (cards) and live GitHub
// metadata (detail page), so the number is always computed the same way.

export type HealthBand = 'A' | 'B' | 'C' | 'D' | 'E';

export interface HealthResult {
  score: number;
  band: HealthBand;
  parts: {
    activity: number;
    popularity: number;
    engagement: number;
    issues: number;
    hygiene: number;
  };
}

const DAY = 86_400_000;

export function computeHealth(s: RepoHealthSignals, now: number = Date.now()): HealthResult {
  const daysSincePush = Math.max(0, (now - Date.parse(s.pushedAt)) / DAY);
  const activity =
    daysSincePush <= 7 ? 40
    : daysSincePush <= 30 ? 34
    : daysSincePush <= 90 ? 27
    : daysSincePush <= 180 ? 20
    : daysSincePush <= 365 ? 10
    : daysSincePush <= 730 ? 4
    : 0;

  const popularity = Math.min(25, Math.round((25 * Math.log10(s.stars + 1)) / Math.log10(30_001)));

  const forkRatio = s.forks / Math.max(s.stars, 1);
  const engagement =
    forkRatio >= 0.08 ? 15
    : forkRatio >= 0.04 ? 11
    : forkRatio >= 0.02 ? 7
    : forkRatio >= 0.01 ? 4
    : s.stars > 0 ? 1
    : 0;

  const issueRatio = s.openIssues / Math.max(s.stars, 1);
  const issues =
    s.stars < 50 ? 5
    : issueRatio <= 0.02 ? 10
    : issueRatio <= 0.05 ? 8
    : issueRatio <= 0.1 ? 5
    : issueRatio <= 0.25 ? 2
    : 0;

  const hasLicense =
    !!s.license && s.license !== 'other' && s.license !== 'NOASSERTION';
  const hygiene = (hasLicense ? 7 : 0) + (s.topics >= 3 ? 3 : 0);

  const parts = { activity, popularity, engagement, issues, hygiene };
  let score = activity + popularity + engagement + issues + hygiene;
  if (s.archived) score = Math.min(score, 30);
  score = Math.max(0, Math.min(100, score));

  const band: HealthBand = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E';
  return { score, band, parts };
}

/** Snapshot health from the generated dataset; null when the repo isn't in it. */
export function getHealth(fullName: string): HealthResult | null {
  const signals = REPO_HEALTH[fullName];
  return signals ? computeHealth(signals) : null;
}

export function getSignals(fullName: string): RepoHealthSignals | null {
  return REPO_HEALTH[fullName] ?? null;
}
