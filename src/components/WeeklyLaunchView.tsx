import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  /** Number of products visible in the selected week (for the summary line) */
  launchCount?: number;
  className?: string;
}

export const WeeklyLaunchView: React.FC<WeeklyLaunchViewProps> = ({
  selectedWeek,
  onSelectWeek,
  soundEnabled,
  launchCount,
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
    onSelectWeek(week);
  };

  const handleAllTimeClick = () => {
    if (selectedWeek === null) return;
    playSound('click', soundEnabled);
    onSelectWeek(null);
  };

  const summary = selectedWeek
    ? `${selectedWeek.label} · ${formatWeekDateRange(selectedWeek, '–')}${
        typeof launchCount === 'number'
          ? ` · ${launchCount} launch${launchCount === 1 ? '' : 'es'}`
          : ''
      }`
    : 'All-time leaderboard · ranked by total upvotes and comments';

  return (
    <div
      className={`sticky top-[53px] z-30 w-full py-2 bg-white/95 backdrop-blur-md border-b border-neutral-200/70 shadow-2xs select-none transition-all ${className}`}
      aria-label="Weekly launches navigation"
    >
      <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-none px-2">
        {/* View switch: recurring All Time entry point */}
        <button
          type="button"
          onClick={handleAllTimeClick}
          aria-current={selectedWeek === null ? 'page' : undefined}
          title="Show the all-time leaderboard"
          className={`shrink-0 text-[13px] sm:text-sm transition-all cursor-pointer ${
            selectedWeek === null
              ? 'rounded-xl bg-[#0f172a] px-4 py-1.5 font-bold text-white shadow-xs'
              : 'font-semibold text-neutral-700 hover:text-neutral-950'
          }`}
        >
          All Time
        </button>

        <span aria-hidden="true" className="h-5 w-px shrink-0 bg-neutral-200" />

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
            const label = isCurrentCalendarWeek ? 'This Week' : week.label;

            return (
              <button
                key={week.key}
                type="button"
                onClick={() => !isFuture && handleWeekClick(week)}
                disabled={isFuture}
                aria-current={isSelected ? 'page' : undefined}
                title={
                  isFuture
                    ? `${week.label} (Upcoming round)`
                    : `${week.label} · ${formatWeekDateRange(week, '–')}`
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
                <span>{label}</span>
                {isCurrentCalendarWeek && !isSelected && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-mint-500"
                  />
                )}
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

      <p className="mt-1 px-3 text-center text-[10.5px] font-semibold text-neutral-400">
        {summary}
      </p>
    </div>
  );
};
