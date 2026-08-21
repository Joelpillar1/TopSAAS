import React from 'react';
import { DollarSign, Flame, MousePointerClick, Trophy } from 'lucide-react';
import { Category, Product, SortOption } from '../types';
import { playSound } from '../utils/sound';

interface StatsBarProps {
  products: Product[];
  totalBattles: number;
  activeCategory: Category;
  onSelectCategory: (cat: Category) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  soundEnabled: boolean;
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

export const StatsBar: React.FC<StatsBarProps> = ({
  products,
  totalBattles,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortOption,
  onSortChange,
  soundEnabled,
}) => {
  const totalVolume = products.reduce((acc, p) => acc + p.totalBid, 0);
  const totalClicks = products.reduce((acc, p) => acc + p.clicks, 0);

  return (
    <div id="stats-and-filters" className="space-y-3.5">
      {/* Category Pills & Search Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  playSound('hover', soundEnabled);
                  onSelectCategory(cat);
                }}
                className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm ${
                  isActive
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono-num ${
                    isActive ? 'bg-stone-700 text-stone-200' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-52">
            <input
              type="text"
              placeholder="Search websites..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 shadow-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={sortOption}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 focus:border-amber-400 focus:outline-none shadow-sm transition-all cursor-pointer"
          >
            <option value="rank">Sort: Spot (#1 First)</option>
            <option value="clicks">Sort: Most Visits</option>
            <option value="recent">Sort: Recent Bids</option>
            <option value="climb">Sort: Biggest Climbers</option>
          </select>
        </div>
      </div>
    </div>
  );
};
