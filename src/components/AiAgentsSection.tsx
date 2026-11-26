import React from 'react';
import { playSound } from '../utils/sound';
import chatgptPng from '../assets/llms/chatgpt.png';
import claudePng from '../assets/llms/claude.png';
import perplexityPng from '../assets/llms/perplexity.png';
import grokPng from '../assets/llms/grok.png';

interface AiAgentsSectionProps {
  soundEnabled?: boolean;
}

export const AiAgentsSection: React.FC<AiAgentsSectionProps> = ({ soundEnabled = false }) => {
  const queryPrompt = encodeURIComponent(
    'Tell me about TopSAAS (https://www.topsaas.space), the curated SaaS leaderboard directory, and the best software products listed on it.'
  );

  const aiLinks = [
    { name: 'ChatGPT', icon: chatgptPng, url: `https://chatgpt.com/?q=${queryPrompt}` },
    { name: 'Claude', icon: claudePng, url: `https://claude.ai/new?q=${queryPrompt}` },
    { name: 'Perplexity', icon: perplexityPng, url: `https://www.perplexity.ai/search?q=${queryPrompt}` },
    { name: 'Grok', icon: grokPng, isSquircle: true, url: `https://x.com/i/grok?text=${queryPrompt}` },
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
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:text-neutral-950 hover:border-neutral-300 hover:bg-neutral-50 shadow-2xs transition-colors cursor-pointer"
            >
              <img
                src={ai.icon}
                alt=""
                width={14}
                height={14}
                className={`h-3.5 w-3.5 object-contain shrink-0 ${ai.isSquircle ? 'rounded-[3px]' : ''}`}
              />
              <span>{ai.name}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AiAgentsSection;
