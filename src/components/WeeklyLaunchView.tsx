import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekInfo, getWeeksWindow, getWeekInfo } from '../utils/weeks';
import { playSound } from '../utils/sound';

interface WeeklyLaunchViewProps {
  /** The currently selected week (null = All Time) */
  selectedWeek: WeekInfo | null;
  /** Callback when user selects a week (or null for all time) */
  onSelectWeek: (week: WeekInfo | null) => void;
  soundEnabled: boolean;
  className?: string;
}

export const WeeklyLaunchView: React.FC<WeeklyLaunchViewProps> = ({
  selectedWeek,
  onSelectWeek,
  soundEnabled,
  className = '',
}) => {
  // Center offset for the 7-week window (0 = current week at center)
  const [windowOffset, setWindowOffset] = useState<number>(0);

  // Current calendar week (e.g. Week 45 in 2026)
  const currentWeek = getWeekInfo(Date.now());

  // Generate 7 weeks around the windowOffset (3 before, center, 3 after)
  const weeks = getWeeksWindow(windowOffset, 3, 3);

  const handlePrev = () => {
    playSound('click', soundEnabled);
    setWindowOffset((prev) => prev - 1);
  };

  const handleNext = () => {
    playSound('click', soundEnabled);
    setWindowOffset((prev) => prev + 1);
  };

  const handleWeekClick = (week: WeekInfo) => {
    playSound('click', soundEnabled);
    // If user clicks the already active week, toggle to all time or keep active
    if (selectedWeek?.key === week.key) {
      onSelectWeek(null);
    } else {
      onSelectWeek(week);
    }
  };

  return (
    <div
      className={`relative w-full py-3 my-1 select-none ${className}`}
      aria-label="Weekly launches navigation"
    >
      <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-none px-1">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Previous weeks"
          title="Previous weeks"
          className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-900 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Horizontal Week Labels */}
        <div className="flex items-center gap-3 sm:gap-5 md:gap-6">
          {weeks.map((week) => {
            const isSelected = selectedWeek?.key === week.key;
            const isCurrentCalendarWeek = week.key === currentWeek.key;
            const isPast = week.end <= currentWeek.start;
            const isFuture = week.start > currentWeek.start && !isCurrentCalendarWeek;

            return (
              <button
                key={week.key}
                type="button"
                onClick={() => handleWeekClick(week)}
                title={
                  isSelected
                    ? `${week.label} (Active • Click to view all launches)`
                    : isCurrentCalendarWeek
                    ? `${week.label} (Current week)`
                    : week.label
                }
                className={`relative shrink-0 text-[13px] sm:text-sm transition-all cursor-pointer ${
                  isSelected
                    ? 'rounded-xl bg-[#0f172a] px-4 py-1.5 font-bold text-white shadow-xs'
                    : isFuture
                    ? 'font-medium text-[#94a3b8] hover:text-slate-600'
                    : isPast || isCurrentCalendarWeek
                    ? 'font-semibold text-neutral-700 hover:text-neutral-950'
                    : 'font-semibold text-neutral-600 hover:text-neutral-950'
                }`}
              >
                <span>{week.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Next weeks"
          title="Next weeks"
          className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-900 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
