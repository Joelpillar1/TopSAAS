import React from 'react';
import { getHandpickedDossier, HANDPICKED_REPOS } from '../data/handpickedRepos';
import { CURATED_REPOS, CuratedRepo } from '../data/curatedRepos';
import { RepoCard } from './RepoCard';

interface HandpickedLaunchpadsSectionProps {
  soundEnabled: boolean;
  onOpenRepo?: (repo: CuratedRepo) => void;
}

export const HandpickedLaunchpadsSection: React.FC<HandpickedLaunchpadsSectionProps> = ({
  soundEnabled,
  onOpenRepo,
}) => {
  if (HANDPICKED_REPOS.length === 0) return null;

  const repos: CuratedRepo[] = HANDPICKED_REPOS.map((dossier) => {
    const existing = CURATED_REPOS.find(
      (r) => r.full_name.toLowerCase() === dossier.repoFullName.toLowerCase()
    );
    if (existing) {
      if (dossier.logoUrl) {
        return {
          ...existing,
          owner: {
            ...existing.owner,
            avatar_url: dossier.logoUrl,
          },
        };
      }
      return existing;
    }

    const [ownerLogin, repoName] = dossier.repoFullName.split('/');
    return {
      id: 990000 + Math.abs(dossier.repoFullName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)),
      name: dossier.repoName || repoName,
      full_name: dossier.repoFullName,
      description: dossier.summary,
      html_url: `https://github.com/${dossier.repoFullName}`,
      stargazers_count: 0,
      forks_count: 0,
      language: 'TypeScript',
      category: 'SaaS Starters',
      owner: {
        login: ownerLogin,
        avatar_url: dossier.logoUrl || `https://github.com/${ownerLogin}.png`,
      },
    };
  });

  return (
    <section
      id="handpicked-launchpads-section"
      className="w-full rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header row: title + subtitle matching Open Source Projects */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-neutral-950 sm:text-lg">
            Handpicked Open Source Foundations
          </h2>
          <p className="text-xs font-medium text-neutral-500 mt-0.5">
            Curated open-source foundations with commercial license guidance &amp; SaaS blueprints
          </p>
        </div>
      </div>

      {/* Cards Grid: same structure & layout as Open Source Projects */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
        {repos.map((repo) => (
          <RepoCard
            key={repo.full_name}
            repo={repo}
            onOpen={onOpenRepo}
            soundEnabled={soundEnabled}
            license={getHandpickedDossier(repo.full_name)?.licenseSpdx}
          />
        ))}
      </div>
    </section>
  );
};
