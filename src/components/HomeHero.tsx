import React, { useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/grid-pattern';

interface HomeHeroProps {
  totalProducts: number;
  totalCategories: number;
  totalVisits: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenSubmit: () => void;
  soundEnabled: boolean;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  totalProducts,
  totalCategories,
  totalVisits,
  searchQuery,
  onSearchChange,
  onOpenSubmit,
  soundEnabled,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Ctrl/Cmd + K focuses the directory search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <section className="relative overflow-hidden px-1 pt-6 sm:pt-10" aria-label="Find the best SaaS">
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
          'fill-neutral-800/60 stroke-neutral-800/50',
        )}
      />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Headline */}
        <h1 className="text-3xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
          <span className="whitespace-nowrap">Find the best SaaS.</span>
          <br />
          <span className="text-neutral-500">Or get yours found.</span>
        </h1>

        <p className="mt-4 text-sm font-medium text-neutral-400">
          Search a product or click a card to open its page.
        </p>

        {/* Search */}
        <div className="relative mt-7 w-full max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for a SaaS tool (e.g., 'invoice', 'community'…)"
            aria-label="Search the directory"
            className="w-full rounded-xl border border-neutral-700 bg-[#343434] py-3 pl-11 pr-20 text-sm font-medium text-neutral-100 placeholder-neutral-500 shadow-2xs outline-none transition-all focus:border-mint-500/70 focus:ring-4 focus:ring-mint-500/10"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] font-bold text-neutral-400 sm:flex">
            <Command className="h-2.5 w-2.5" />
            K
          </span>
        </div>

        {/* Live strip */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[11px] font-semibold text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
            <span className="font-bold text-neutral-300 font-mono-num">{totalProducts}</span> products live
          </span>
          <span className="text-neutral-700">·</span>
          <span>
            <span className="font-bold text-neutral-300 font-mono-num">{totalCategories}</span> categories
          </span>
          <span className="text-neutral-700">·</span>
          <span>
            <span className="font-bold text-neutral-300 font-mono-num">{totalVisits}</span> visits tracked
          </span>
        </div>
      </div>
    </section>
  );
};
