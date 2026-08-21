import { useState, useEffect } from 'react';

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface UseGitHubReposResult {
  repos: GitHubRepo[];
  loading: boolean;
  error: string | null;
}

const CURATED_QUERIES = [
  'saas open source',
  'boilerplate saas template',
  'open source alternative',
  'starter kit saas',
  'indie hacker project',
];

export function useGitHubRepos(): UseGitHubReposResult {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRepos() {
      setLoading(true);
      setError(null);

      try {
        // Pick a random query each time for variety
        const query = CURATED_QUERIES[Math.floor(Math.random() * CURATED_QUERIES.length)];
        const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=12`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

        const data = await res.json();
        if (!cancelled) {
          setRepos(data.items || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to fetch repos');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRepos();
    return () => { cancelled = true; };
  }, []);

  return { repos, loading, error };
}

export function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
