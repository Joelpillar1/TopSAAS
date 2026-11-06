import React, { useRef, useState } from 'react';
import { Globe, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/grid-pattern';
import { playSound } from '../utils/sound';

interface HomeHeroProps {
  totalProducts: number;
  totalCategories: number;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onOpenSubmit: (initialUrl?: string) => void;
  soundEnabled: boolean;
  dealsCount?: number;
  stealsOnly?: boolean;
  onToggleSteals?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  totalCategories,
  onOpenSubmit,
  soundEnabled,
  dealsCount = 0,
  stealsOnly = false,
  onToggleSteals,
}) => {
  const [launchUrl, setLaunchUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmitLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = launchUrl.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    playSound('click', soundEnabled);
    onOpenSubmit(trimmed);
  };

  return (
    <section className="relative overflow-hidden px-1 pt-1 sm:pt-2 pb-1" aria-label="Find the best SaaS">
      {/* Background: subtle grid pattern */}
      <GridPattern
        width={32}
        height={32}
        x={-1}
        y={-1}
        strokeDasharray="3 3"
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
        ]}
        className={cn(
          '[mask-image:radial-gradient(560px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12',
          'fill-neutral-300/30 stroke-neutral-300/40',
        )}
      />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Headline */}
        <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-neutral-950 sm:text-5xl">
          <span className="whitespace-nowrap">Find the best SaaS.</span>
          <br />
          <span className="text-neutral-500">Or get yours found.</span>
        </h1>

        <p className="mt-3.5 text-xs sm:text-sm font-medium text-neutral-500 max-w-lg">
          Free to submit. Get discovered by thousands of founders & users on autopilot.
        </p>

        {/* Launch Now input and button */}
        <form
          onSubmit={handleSubmitLaunch}
          className="relative mt-5 w-full max-w-lg flex items-center rounded-2xl border border-neutral-300 bg-white p-1.5 shadow-xs transition-all focus-within:border-mint-500 focus-within:ring-4 focus-within:ring-mint-500/10 hover:border-neutral-400"
        >
          <div className="flex items-center pl-3 pr-2 text-neutral-400">
            <Globe className="h-4 w-4 shrink-0" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={launchUrl}
            onChange={(e) => setLaunchUrl(e.target.value)}
            placeholder="https://yourtool.com"
            aria-label="Your SaaS website URL"
            required
            className="w-full bg-transparent py-2.5 text-sm font-semibold text-neutral-900 placeholder-neutral-400 outline-none"
          />
          <button
            type="submit"
            className="shrink-0 btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl"
          >
            Launch Now
          </button>
        </form>

        {/* Combined micro-benefits and live stats on the same line */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] font-semibold text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="text-mint-600 font-bold">✓</span> AI prefill
          </span>
          <span className="text-neutral-300">·</span>
          <span className="flex items-center gap-1">
            <span className="text-mint-600 font-bold">✓</span> Takes 30 secs
          </span>
          <span className="text-neutral-300">·</span>
          <span className="flex items-center gap-1">
            <span className="text-mint-600 font-bold">✓</span> 100% Free
          </span>
          {dealsCount > 0 && onToggleSteals && (
            <>
              <span className="text-neutral-300">·</span>
              <button
                type="button"
                onClick={() => {
                  onToggleSteals();
                  const section = document.getElementById('leaderboard-section');
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                  stealsOnly ? 'text-amber-700 font-bold' : 'text-neutral-600 hover:text-amber-600'
                }`}
                title={stealsOnly ? 'Turn off Steals Only filter' : 'Show only tools with exclusive discounts'}
              >
                <Flame className={`h-3.5 w-3.5 ${stealsOnly ? 'text-amber-600 fill-amber-500/30 animate-pulse' : 'text-amber-500'}`} />
                <span className={`font-bold font-mono-num ${stealsOnly ? 'text-amber-800' : 'text-neutral-800'}`}>{dealsCount}</span>
                <span>{dealsCount === 1 ? 'steal' : 'steals'}</span>
                {stealsOnly && (
                  <span className="text-[9px] font-black text-amber-700 bg-amber-100/70 px-1 rounded">
                    active
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
