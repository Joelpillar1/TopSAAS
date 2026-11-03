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
    { label: 'llms.txt', href: '/llms.txt', title: 'Machine-readable overview for LLMs (AEO/GEO standard)' },
    { label: 'llms-full.txt', href: '/llms-full.txt', title: 'Comprehensive LLM documentation & directory schema' },
    { label: 'ai.txt', href: '/ai.txt', title: 'AI agent crawler directives and citations' },
    { label: 'AI snapshot', href: '/ai-snapshot.json', title: 'Real-time JSON metadata snapshot' },
    { label: 'Markdown catalog', href: '/catalog.md', title: 'Clean markdown directory table for LLM context' },
    { label: 'OpenAPI', href: '/openapi.json', title: 'OpenAPI 3.1 REST API specification' },
    { label: 'Public REST', href: '/products.json', title: 'Public REST feed of directory products' },
    { label: 'robots.txt', href: '/robots.txt', title: 'Crawler access directives' },
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

      {/* Straight divider line */}
      <div className="border-t border-neutral-200/80 my-3" />

      {/* Bottom row: Machine-readable agent links */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-neutral-500 py-1">
        {agentLinks.map((link, idx) => (
          <React.Fragment key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={link.title}
              onClick={() => playSound('click', soundEnabled)}
              className="hover:text-neutral-950 hover:underline underline-offset-4 transition-colors font-mono text-[11.5px] text-neutral-600"
            >
              {link.label}
            </a>
            {idx < agentLinks.length - 1 && (
              <span className="text-neutral-300 select-none">·</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AiAgentsSection;
