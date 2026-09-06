import React from 'react';
import { playSound } from '../utils/sound';

interface AiAgentsSectionProps {
  soundEnabled?: boolean;
}

export const AiAgentsSection: React.FC<AiAgentsSectionProps> = ({ soundEnabled = false }) => {
  const queryPrompt = encodeURIComponent(
    'Tell me about TopSAAS (https://topsaas.com), the curated SaaS leaderboard directory, and the best software products listed on it.'
  );

  const aiLinks = [
    { name: 'ChatGPT', url: `https://chatgpt.com/?q=${queryPrompt}` },
    { name: 'Claude', url: `https://claude.ai/new?q=${queryPrompt}` },
    { name: 'Perplexity', url: `https://www.perplexity.ai/search?q=${queryPrompt}` },
    { name: 'Grok', url: `https://x.com/i/grok?text=${queryPrompt}` },
  ];

  const agentLinks = [
    { label: 'llms.txt', href: '/llms.txt', title: 'Machine-readable overview for LLMs' },
    { label: 'llms-full.txt', href: '/llms-full.txt', title: 'Complete LLM documentation & schemas' },
    { label: 'ai.txt', href: '/ai.txt', title: 'AI agent directives and permissions' },
    { label: 'AI snapshot', href: '/ai-snapshot.json', title: 'Real-time JSON snapshot of directory state' },
    { label: 'Markdown catalog', href: '/catalog.md', title: 'Clean markdown directory table for LLM context' },
    { label: 'API catalog', href: '/api-catalog.json', title: 'JSON catalog of public API endpoints' },
    { label: 'OpenAPI', href: '/openapi.json', title: 'OpenAPI 3.1 REST specification' },
    { label: 'Public REST', href: '/products.json', title: 'Public REST feed of directory products' },
    { label: 'CLI', href: '/cli.md', title: 'Terminal and curl commands for agents' },
    { label: 'auth.md', href: '/auth.md', title: 'Authentication and security architecture' },
    { label: 'sitemap.xml', href: '/sitemap.xml', title: 'XML search sitemap' },
  ];

  return (
    <div className="w-full border-t border-neutral-800 pt-6 mt-8 mb-4">
      {/* Top row: Ask AI query buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Ask AI About TopSAAS
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {aiLinks.map((ai) => (
            <a
              key={ai.name}
              href={ai.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="inline-flex items-center px-3 py-1 rounded-lg border border-neutral-700 bg-neutral-800/60 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-500 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {ai.name}
            </a>
          ))}
        </div>
      </div>

      {/* Straight divider line */}
      <div className="border-t border-neutral-800/80 my-3" />

      {/* Bottom row: Machine-readable agent links */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-neutral-400 py-1">
        {agentLinks.map((link, idx) => (
          <React.Fragment key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.title}
              onClick={() => playSound('click', soundEnabled)}
              className="hover:text-white hover:underline underline-offset-4 transition-colors font-mono text-[11.5px] text-neutral-400"
            >
              {link.label}
            </a>
            {idx < agentLinks.length - 1 && (
              <span className="text-neutral-600 select-none">·</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AiAgentsSection;
