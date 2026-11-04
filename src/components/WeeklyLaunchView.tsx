import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekInfo, getWeeksRange, getWeekInfo } from '../utils/weeks';
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
  // Current calendar launch week (Week 1 at kickoff)
  const currentWeek = getWeekInfo(Date.now());

  // Starting week index to display 7 weeks (minimum 1)
  const [startWeek, setStartWeek] = useState<number>(1);

  // Generate 7 consecutive weeks starting at startWeek
  const weeks = getWeeksRange(startWeek, 7);

  const canGoPrev = startWeek > 1;
  const canGoNext = weeks[weeks.length - 1].weekNumber < currentWeek.weekNumber;

  const handlePrev = () => {
    if (!canGoPrev) return;
    playSound('click', soundEnabled);
    setStartWeek((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    if (!canGoNext) return;
    playSound('click', soundEnabled);
    setStartWeek((prev) => prev + 1);
  };

  const handleWeekClick = (week: WeekInfo) => {
    // Only previous weeks and present week can be selected; future weeks are disabled
    if (week.weekNumber > currentWeek.weekNumber) return;

    playSound('click', soundEnabled);
    // If user clicks the currently selected week, toggle back to show all launches
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
          disabled={!canGoPrev}
          aria-label="Previous weeks"
          title={canGoPrev ? 'Previous weeks' : 'Week 1 is the first launch round'}
          className={`flex h-7 w-7 shrink-0 items-center justify-center transition-all ${
            canGoPrev
              ? 'text-neutral-500 hover:text-neutral-900 active:scale-95 cursor-pointer'
              : 'text-neutral-300 opacity-40 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Horizontal Week Labels */}
        <div className="flex items-center gap-3 sm:gap-5 md:gap-6">
          {weeks.map((week) => {
            const isSelected = selectedWeek?.key === week.key;
            const isCurrentCalendarWeek = week.key === currentWeek.key;
            const isPast = week.weekNumber < currentWeek.weekNumber;
            const isFuture = week.weekNumber > currentWeek.weekNumber;

            return (
              <button
                key={week.key}
                type="button"
                onClick={() => !isFuture && handleWeekClick(week)}
                disabled={isFuture}
                title={
                  isFuture
                    ? `${week.label} (Upcoming round)`
                    : isSelected
                    ? `${week.label} (Active • Click to view all launches)`
                    : isCurrentCalendarWeek
                    ? `${week.label} (Current round)`
                    : week.label
                }
                className={`relative shrink-0 text-[13px] sm:text-sm transition-all ${
                  isFuture
                    ? 'font-medium text-neutral-300 opacity-40 cursor-not-allowed select-none'
                    : isSelected
                    ? 'rounded-xl bg-[#0f172a] px-4 py-1.5 font-bold text-white shadow-xs cursor-pointer'
                    : isPast || isCurrentCalendarWeek
                    ? 'font-semibold text-neutral-700 hover:text-neutral-950 cursor-pointer'
                    : 'font-semibold text-neutral-600 hover:text-neutral-950 cursor-pointer'
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
          disabled={!canGoNext}
          aria-label="Next weeks"
          title={canGoNext ? 'Next weeks' : 'Future weeks cannot be viewed'}
          className={`flex h-7 w-7 shrink-0 items-center justify-center transition-all ${
            canGoNext
              ? 'text-neutral-500 hover:text-neutral-900 active:scale-95 cursor-pointer'
              : 'text-neutral-300 opacity-40 cursor-not-allowed'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
