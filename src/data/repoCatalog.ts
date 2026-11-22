import { CURATED_REPOS, CuratedRepo } from './curatedRepos';
import { HANDPICKED_REPOS } from './handpickedRepos';

/**
 * The handpicked foundations are featured in their own section on /ideas, so
 * they are excluded from the main directory list to avoid duplicate cards.
 */
export const HANDPICKED_FULL_NAMES = new Set(
  HANDPICKED_REPOS.map((dossier) => dossier.repoFullName.toLowerCase())
);

/** One entry per GitHub repository, keeping the first curated occurrence. */
export const UNIQUE_REPOS: CuratedRepo[] = (() => {
  const seen = new Set<string>();
  const out: CuratedRepo[] = [];
  for (const repo of CURATED_REPOS) {
    const key = repo.full_name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(repo);
  }
  return out;
})();

export const HANDPICKED_REPOS_LIST: CuratedRepo[] = UNIQUE_REPOS.filter((repo) =>
  HANDPICKED_FULL_NAMES.has(repo.full_name.toLowerCase())
);

/** Repos shown in the "Open Source Projects" directory. */
export const DIRECTORY_REPOS: CuratedRepo[] = UNIQUE_REPOS.filter(
  (repo) => !HANDPICKED_FULL_NAMES.has(repo.full_name.toLowerCase())
);
