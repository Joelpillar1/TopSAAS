import { WebsiteSubmission } from '../types';

export const INITIAL_SUBMISSIONS: WebsiteSubmission[] = [
  {
    id: 'sub-sample-1',
    name: 'Midjourney',
    tagline: 'Generative artificial intelligence program and service generating images from natural language descriptions',
    url: 'https://midjourney.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=midjourney.com&sz=128',
    twitterHandle: '@midjourney',
    category: 'AI Tools',
    backerName: 'David Holz',
    status: 'under_review',
    submittedAt: Date.now() - 1000 * 60 * 25, // 25 mins ago
  },
  {
    id: 'sub-sample-2',
    name: 'Ollama',
    tagline: 'Get up and running with large language models locally on macOS, Linux, and Windows',
    url: 'https://ollama.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=ollama.com&sz=128',
    twitterHandle: '@ollama',
    category: 'Developer Tools',
    backerName: 'Jeffrey Morgan',
    status: 'under_review',
    submittedAt: Date.now() - 1000 * 60 * 75, // 1h 15m ago
  },
  {
    id: 'sub-sample-3',
    name: 'Resend',
    tagline: 'Email for developers. The best way to reach humans instead of the spam folder.',
    url: 'https://resend.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=resend.com&sz=128',
    twitterHandle: '@resend',
    category: 'Developer Tools',
    backerName: 'Zeno Rocha',
    status: 'under_review',
    submittedAt: Date.now() - 1000 * 60 * 180, // 3h ago
  },
];
