import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import {
  WeekInfo,
  formatWeekDateRange,
  getWeeksRange,
  getWeekInfo,
} from '../utils/weeks';
import { playSound } from '../utils/sound';

interface WeeklyLaunchViewProps {
  /** The currently selected week (null = All Time) */
  selectedWeek: WeekInfo | null;
  /** Callback when user selects a week (or null for all time) */
  onSelectWeek: (week: WeekInfo | null) => void;
  soundEnabled: boolean;
  /** Number of products visible in the selected week */
  launchCount?: number;
  className?: string;
}

export const WeeklyLaunchView: React.FC<WeeklyLaunchViewProps> = ({
  selectedWeek,
  onSelectWeek,
  soundEnabled,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const currentWeek = getWeekInfo(Date.now());
  // All past & current launch weeks in reverse chronological order (newest first)
  const weeks = getWeeksRange(1, currentWeek.weekNumber).slice().reverse();

  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const activeLabel = selectedWeek
    ? selectedWeek.key === currentWeek.key
      ? `This Week · ${formatWeekDateRange(selectedWeek, '–')}`
      : `${selectedWeek.label} · ${formatWeekDateRange(selectedWeek, '–')}`
    : 'All Time';

  return (
    <div ref={dropdownRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => {
          playSound('click', soundEnabled);
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 transition-all shadow-2xs cursor-pointer"
      >
        <Calendar className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
        <span className="max-w-[160px] sm:max-w-none truncate">{activeLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Filter launches by week"
          className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-60 max-h-72 overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-900/10 z-30 animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedWeek === null}
            onClick={() => {
              playSound('click', soundEnabled);
              onSelectWeek(null);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition-colors cursor-pointer ${
              selectedWeek === null
                ? 'bg-neutral-950 text-white'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span>All Time</span>
            {selectedWeek === null && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>

          <div className="my-1 border-t border-neutral-100" />

          {weeks.map((week) => {
            const isSelected = selectedWeek?.key === week.key;
            const isCurrent = week.key === currentWeek.key;
            const dateRange = formatWeekDateRange(week, '–');

            return (
              <button
                key={week.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  playSound('click', soundEnabled);
                  onSelectWeek(week);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-950 text-white font-bold'
                    : 'text-neutral-700 hover:bg-neutral-100 font-semibold'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  {isCurrent && (
                    <span
                      className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-mint-400' : 'bg-mint-500'
                      }`}
                    />
                  )}
                  <span className="truncate">
                    {isCurrent ? 'This Week' : week.label} · {dateRange}
                  </span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
