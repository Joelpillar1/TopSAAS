import React, { useEffect, useMemo } from 'react';
import { CalendarDays, Check } from 'lucide-react';
import { Product, WebsiteSubmission } from '../types';
import {
  getUpcomingLaunchSlots,
  getWeekNumber,
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
    return getUpcomingLaunchSlots(weekCounts, 8);
  }, [weekCounts]);

  const currentWeek = useMemo(() => getWeekNumber(), []);

  // Default to first recommended or non-full slot if not explicitly selected
  const activeWeekNum = useMemo(() => {
    if (selectedWeekNumber) return selectedWeekNumber;
    const available = slots.find((s) => !s.isFull);
    return available ? available.weekNumber : slots[0]?.weekNumber;
  }, [selectedWeekNumber, slots]);

  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.weekNumber === activeWeekNum) || slots[0];
  }, [slots, activeWeekNum]);

  // If no week has been selected yet, inform the parent form
  useEffect(() => {
    if (!selectedWeekNumber && selectedSlot) {
      onSelectWeek(selectedSlot.weekNumber, selectedSlot.start);
    }
  }, [selectedWeekNumber, selectedSlot, onSelectWeek]);

  return (
    <div className="font-sans">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <label className="text-sm font-semibold text-neutral-900">Launch week</label>
          <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
            Pick the week your product goes live. New rounds start every Monday.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-bold text-neutral-600">
          <CalendarDays className="h-3 w-3" />
          Mondays · 00:00
        </span>
      </div>

      <div
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
        aria-label="Available launch weeks"
      >
        {slots.map((slot) => {
          const isSelected = activeWeekNum === slot.weekNumber;
          const offset = slot.weekNumber - currentWeek;
          const relativeLabel =
            offset === 0
              ? 'This week'
              : offset === 1
                ? 'Next week'
                : `In ${offset} weeks`;

          return (
            <button
              key={slot.key}
              type="button"
              aria-pressed={isSelected}
              disabled={slot.isFull}
              onClick={() => {
                if (slot.isFull) return;
                playSound('click', soundEnabled);
                onSelectWeek(slot.weekNumber, slot.start);
              }}
              className={`flex flex-col rounded-xl border px-3 py-2.5 text-left transition-all ${
                slot.isFull
                  ? 'cursor-not-allowed border-neutral-200 bg-neutral-50 text-neutral-400'
                  : isSelected
                    ? 'cursor-pointer border-neutral-950 bg-neutral-950 text-white shadow-sm'
                    : 'cursor-pointer border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center justify-between gap-1">
                <span
                  className={`truncate text-[10px] font-bold uppercase tracking-wide ${
                    isSelected ? 'text-white/70' : 'text-neutral-500'
                  }`}
                >
                  {relativeLabel}
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-white stroke-[3]" />}
              </span>

              <span
                className={`mt-1 block text-[13px] font-bold leading-tight ${
                  isSelected ? 'text-white' : ''
                }`}
              >
                {slot.dateRangeStr}
              </span>

              <span
                className={`mt-2 inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${
                  slot.isFull
                    ? 'border-neutral-200 bg-neutral-100 text-neutral-500'
                    : isSelected
                      ? 'border-white/20 bg-white/10 text-white'
                      : slot.badgeStyle
                }`}
              >
                {slot.statusLabel}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] font-medium text-neutral-500">
        Your listing goes live at 00:00 on the Monday and runs for the full week.
      </p>
    </div>
  );
};
