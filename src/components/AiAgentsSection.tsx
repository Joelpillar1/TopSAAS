import React from 'react';
import { playSound } from '../utils/sound';

interface AiAgentsSectionProps {
  soundEnabled?: boolean;
}

export const AiAgentsSection: React.FC<AiAgentsSectionProps> = ({ soundEnabled = false }) => {
  const queryPrompt = encodeURIComponent(
    'Tell me about TopSAAS (https://www.topsaas.space), the curated SaaS leaderboard directory, and the best software products listed on it.'
  );

  const aiLinks = [
    { name: 'ChatGPT', url: `https://chatgpt.com/?q=${queryPrompt}` },
    { name: 'Claude', url: `https://claude.ai/new?q=${queryPrompt}` },
    { name: 'Perplexity', url: `https://www.perplexity.ai/search?q=${queryPrompt}` },
    { name: 'Grok', url: `https://x.com/i/grok?text=${queryPrompt}` },
  ];

  const agentLinks = [
    {
      label: 'llms.txt',
      href: '/llms.txt',
      title: 'Machine-readable overview for LLMs (AEO/GEO standard)',
      description: 'LLM overview (AEO/GEO standard)',
    },
    {
      label: 'llms-full.txt',
      href: '/llms-full.txt',
      title: 'Comprehensive LLM documentation & directory schema',
      description: 'Full LLM documentation and schema',
    },
    {
      label: 'ai.txt',
      href: '/ai.txt',
      title: 'AI agent crawler directives and citations',
      description: 'AI crawler directives and citations',
    },
    {
      label: 'ai-snapshot.json',
      href: '/ai-snapshot.json',
      title: 'Real-time JSON metadata snapshot',
      description: 'Real-time JSON metadata snapshot',
    },
    {
      label: 'catalog.md',
      href: '/catalog.md',
      title: 'Clean markdown directory table for LLM context',
      description: 'Markdown directory table for LLM context',
    },
    {
      label: 'openapi.json',
      href: '/openapi.json',
      title: 'OpenAPI 3.1 REST API specification',
      description: 'OpenAPI 3.1 REST API specification',
    },
    {
      label: 'products.json',
      href: '/products.json',
      title: 'Public REST feed of directory products',
      description: 'Public REST feed of directory products',
    },
    {
      label: 'robots.txt',
      href: '/robots.txt',
      title: 'Crawler access directives',
      description: 'Crawler access directives',
    },
  ];

  return (
    <div className="w-full border-t border-neutral-200 pt-6 mt-8 mb-4">
      {/* Top row: Ask AI query buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <span className="text-xs font-bold text-neutral-500">
          Ask AI about TopSAAS
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {aiLinks.map((ai) => (
            <a
              key={ai.name}
              href={ai.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="inline-flex items-center px-3 py-1 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer"
            >
              {ai.name}
            </a>
          ))}
        </div>
      </div>

      {/* Machine-readable files: their own labelled category list */}
      <div className="border-t border-neutral-200/80 pt-5 mt-2">
        <h4 className="text-xs font-bold text-neutral-900">Machine-readable files</h4>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
          {agentLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={link.title}
                onClick={() => playSound('click', soundEnabled)}
                className="group block"
              >
                <span className="block font-mono text-[11.5px] text-neutral-700 group-hover:text-neutral-950 group-hover:underline underline-offset-4 transition-colors">
                  {link.label}
                </span>
                <span className="block text-[11px] leading-snug text-neutral-500">{link.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AiAgentsSection;
