import React, { useMemo } from 'react';
import { Calendar, Check, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Product, WebsiteSubmission } from '../types';
import {
  getUpcomingLaunchSlots,
  getWeekNumber,
  LaunchSlotInfo,
} from '../utils/weeks';
import { playSound } from '../utils/sound';

interface LaunchWeekSelectorProps {
  selectedWeekNumber?: number;
  onSelectWeek: (weekNumber: number, weekStartDate: number) => void;
  products?: Product[];
  submissions?: WebsiteSubmission[];
  soundEnabled?: boolean;
}

export const LaunchWeekSelector: React.FC<LaunchWeekSelectorProps> = ({
  selectedWeekNumber,
  onSelectWeek,
  products = [],
  submissions = [],
  soundEnabled = false,
}) => {
  // Aggregate existing apps per week to determine slot congestion
  const weekCounts = useMemo(() => {
    const counts: Record<number, number> = {};

    for (const p of products) {
      const w = p.scheduledLaunchWeek || getWeekNumber(p.createdAt);
      counts[w] = (counts[w] || 0) + 1;
    }

    for (const s of submissions) {
      if (s.status === 'approved' || s.status === 'under_review') {
        const w = s.scheduledLaunchWeek || getWeekNumber(s.submittedAt);
        counts[w] = (counts[w] || 0) + 1;
      }
    }

    return counts;
  }, [products, submissions]);

  const slots = useMemo(() => {
    return getUpcomingLaunchSlots(weekCounts, 5);
  }, [weekCounts]);

  // Default to first recommended or non-full slot if not explicitly selected
  const activeWeekNum = useMemo(() => {
    if (selectedWeekNumber) return selectedWeekNumber;
    const available = slots.find((s) => !s.isFull);
    return available ? available.weekNumber : slots[0]?.weekNumber;
  }, [selectedWeekNumber, slots]);

  const handleSelect = (slot: LaunchSlotInfo) => {
    if (slot.isFull) return;
    playSound('click', soundEnabled);
    onSelectWeek(slot.weekNumber, slot.start);
  };

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <span>Target Launch Round / Date</span>
          <span className="text-rose-500">*</span>
        </label>
        <span className="text-[11px] text-neutral-500 font-medium">
          Rounds kick off every Monday at 00:00
        </span>
      </div>

      <p className="text-xs text-neutral-600 leading-relaxed">
        Choose which weekly round you want your product to go live in. Each round competes for the top podium rosettes, newsletter blasts, and homepage leaderboard.
      </p>

      {/* Week Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {slots.map((slot) => {
          const isSelected = activeWeekNum === slot.weekNumber;
          const isFull = slot.isFull;

          return (
            <div
              key={slot.key}
              role="button"
              tabIndex={isFull ? -1 : 0}
              onClick={() => handleSelect(slot)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(slot);
                }
              }}
              className={`relative rounded-xl border p-3.5 text-left transition-all select-none ${
                isFull
                  ? 'border-neutral-200 bg-neutral-50/70 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-blue-600 bg-blue-50/40 shadow-xs ring-1 ring-blue-600/20 cursor-pointer'
                  : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60 cursor-pointer'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Radio Check Circle */}
                  <div
                    className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : isFull
                        ? 'border-neutral-300 bg-neutral-200'
                        : 'border-neutral-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-neutral-950">
                        {slot.label}
                      </span>
                      {slot.isCurrent && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-neutral-600 mt-0.5">
                      {slot.dateRangeStr}
                    </p>
                  </div>
                </div>

                {/* Badge */}
                <span
                  className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-tight ${slot.badgeStyle}`}
                >
                  {slot.statusLabel}
                </span>
              </div>

              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-blue-100 flex items-center gap-1.5 text-[10.5px] font-semibold text-blue-700">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span>Your product will launch in this weekly round</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
