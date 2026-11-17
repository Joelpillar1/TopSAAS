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

  return (
    <div className="w-full border-t border-neutral-200 pt-6 mt-8 mb-4">
      {/* Ask AI query buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
    </div>
  );
};

export default AiAgentsSection;
