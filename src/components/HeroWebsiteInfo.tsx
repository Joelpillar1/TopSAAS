import React from 'react';
import { Search, Plus, X, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { Category } from '../types';
import { playSound } from '../utils/sound';

interface HeroWebsiteInfoProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: Category;
  onSelectCategory: (category: Category) => void;
  onOpenSubmit: () => void;
  onOpenHowItWorks?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  totalWebsites: number;
}

const CATEGORIES: Category[] = [
  'All',
  'AI Tools',
  'Developer Tools',
  'Productivity',
  'Design & UI',
  'SaaS & Indie',
  'Crypto & Web3',
];

export const HeroWebsiteInfo: React.FC<HeroWebsiteInfoProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  onOpenSubmit,
  onOpenHowItWorks,
  soundEnabled,
  onToggleSound,
  totalWebsites,
}) => {
  return (
    <div id="website-hero-info" className="w-full pt-6 sm:pt-10 pb-4 text-center">
      {/* Brand Name */}
      <div className="mb-3">
        <span
          onClick={() => {
            playSound('click', soundEnabled);
            onSearchChange('');
            onSelectCategory('All');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500 font-mono-num cursor-pointer hover:text-black transition-colors"
        >
          TOPSAAS
        </span>
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-black max-w-2xl mx-auto px-4 leading-[1.15]">
        The curated index of exceptional websites & tools
      </h1>

      {/* Subtitle */}
      <p className="mt-2 text-xs sm:text-sm text-neutral-600 max-w-xl mx-auto px-4 leading-relaxed font-medium">
        Discover and explore the internet&apos;s top software, indie products, and web tools.
        Free, open, and community ranked.
      </p>

      {/* Search Input Box */}
      <div className="mt-5 max-w-lg mx-auto px-4">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="hero-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search websites, tools, "AI", "Design"...'
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-black placeholder:text-neutral-400 shadow-2xs focus:border-black focus:outline-hidden focus:ring-1 focus:ring-black transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onSearchChange('');
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-black cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Submit Action Button */}
      <div className="mt-3 flex items-center justify-center gap-2 px-4 max-w-lg mx-auto">
        <button
          id="hero-add-website-btn"
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onOpenSubmit();
          }}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-neutral-900 active:scale-[0.99] transition-all cursor-pointer min-h-[42px]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Submit website</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap px-4 max-w-3xl mx-auto">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                playSound('hover', soundEnabled);
                onSelectCategory(cat);
              }}
              className={`rounded-full px-3 py-1 text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-black text-white border-black shadow-2xs'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400 hover:text-black'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Minor meta bar: count, sound toggle, how it works */}
      <div className="mt-3.5 flex items-center justify-center gap-4 text-[11px] text-neutral-500 font-medium">
        <div className="flex items-center gap-1">
          <span className="font-bold text-black font-mono-num">{totalWebsites}</span>
          <span>websites listed</span>
        </div>
        <span>•</span>
        <button
          type="button"
          onClick={onToggleSound}
          className="inline-flex items-center gap-1 hover:text-black transition-colors cursor-pointer"
          title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
        >
          {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          <span>{soundEnabled ? 'Audio on' : 'Audio off'}</span>
        </button>
        {onOpenHowItWorks && (
          <>
            <span>•</span>
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="inline-flex items-center gap-1 hover:text-black underline cursor-pointer"
            >
              <HelpCircle className="h-3 w-3" />
              <span>How it works</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
