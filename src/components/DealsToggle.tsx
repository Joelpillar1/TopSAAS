import React from 'react';
import { Flame, Sparkles, Tag, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/sound';

interface DealsToggleProps {
  stealsOnly: boolean;
  onToggle: () => void;
  dealsCount: number;
  totalProductsCount: number;
  soundEnabled: boolean;
  className?: string;
}

export const DealsToggle: React.FC<DealsToggleProps> = ({
  stealsOnly,
  onToggle,
  dealsCount,
  totalProductsCount,
  soundEnabled,
  className = '',
}) => {
  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound('click', soundEnabled);

    // If activating, trigger a celebratory micro-burst of confetti
    if (!stealsOnly) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      try {
        confetti({
          particleCount: 28,
          spread: 55,
          origin: { x, y },
          colors: ['#2563eb', '#f59e0b', '#38bdf8', '#fbbf24', '#ffffff'],
          ticks: 140,
          gravity: 1.1,
          scalar: 0.85,
          disableForReducedMotion: true,
        });
      } catch {}
    }

    onToggle();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        stealsOnly
          ? 'border-amber-400/60 bg-amber-50/80 shadow-xs ring-1 ring-amber-300'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-100'
      } ${className}`}
    >
      <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        {/* Left info area */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
              stealsOnly
                ? 'border-amber-400/60 bg-amber-100 text-amber-700 shadow-xs'
                : 'border-neutral-200 bg-neutral-100 text-neutral-500'
            }`}
          >
            <Flame
              className={`h-5 w-5 transition-transform duration-300 ${
                stealsOnly ? 'scale-110 fill-amber-500/30 text-amber-600 animate-pulse' : 'text-neutral-400'
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black tracking-tight text-neutral-950 flex items-center gap-1.5">
                Steals Only
                {stealsOnly && (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                )}
              </span>

              {/* Deal count pill */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black font-mono-num transition-colors ${
                  stealsOnly
                    ? 'border border-amber-300 bg-amber-100 text-amber-800'
                    : 'border border-neutral-200 bg-neutral-100 text-neutral-600'
                }`}
              >
                <Tag className="h-2.5 w-2.5" />
                {dealsCount} {dealsCount === 1 ? 'deal' : 'deals'} available
              </span>

              {stealsOnly && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2 py-0.5 text-[9px] font-black tracking-wider text-amber-800">
                  Active
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs font-medium text-neutral-600 line-clamp-1">
              Show only tools with exclusive discounts{' '}
              <span className="text-neutral-800 font-semibold">(50% OFF, lifetime deals, promo codes)</span>
            </p>
          </div>
        </div>

        {/* Right switch control */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 border-t border-neutral-200 sm:border-0 sm:pt-0">
          <span className="text-[11px] font-bold text-neutral-500 sm:hidden">
            {stealsOnly ? 'Filtering discounted tools' : 'Show all tools'}
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={stealsOnly}
            aria-label="Toggle Steals Only deals filter"
            onClick={handleToggle}
            className={`group relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
              stealsOnly ? 'bg-mint-500' : 'bg-neutral-200 hover:bg-neutral-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition duration-300 ease-out flex items-center justify-center ${
                stealsOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {stealsOnly ? (
                <Check className="h-3.5 w-3.5 text-mint-700 stroke-[3]" />
              ) : (
                <Flame className="h-3 w-3 text-neutral-400" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
