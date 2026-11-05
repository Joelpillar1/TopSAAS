import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronUp } from 'lucide-react';
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (slot: LaunchSlotInfo) => {
    if (slot.isFull) return;
    playSound('click', soundEnabled);
    onSelectWeek(slot.weekNumber, slot.start);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="space-y-1.5 font-sans relative">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-neutral-800">
          Starting
        </label>
        <span className="text-[11px] text-neutral-500 font-medium">
          Rounds kick off every Monday at 00:00
        </span>
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          playSound('click', soundEnabled);
          setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all bg-white text-left ${
          isOpen
            ? 'border-rose-500 ring-2 ring-rose-500/10'
            : 'border-neutral-300 hover:border-neutral-400'
        }`}
      >
        <span className="text-neutral-900 font-medium">
          {selectedSlot?.dateRangeStr || 'Select launch round'}
        </span>
        <ChevronUp
          className={`h-4 w-4 text-neutral-600 transition-transform duration-200 ${
            isOpen ? 'rotate-0' : 'rotate-180'
          }`}
        />
      </button>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-900/10 max-h-80 overflow-y-auto space-y-0.5">
          {slots.map((slot) => {
            const isSelected = activeWeekNum === slot.weekNumber;
            const isFull = slot.isFull;

            return (
              <button
                key={slot.key}
                type="button"
                disabled={isFull}
                onClick={() => handleSelect(slot)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isFull
                    ? 'opacity-40 cursor-not-allowed text-neutral-400'
                    : isSelected
                    ? 'bg-neutral-100/90 text-neutral-950 font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate">{slot.dateRangeStr}</span>
                  {slot.isRecommended && !slot.isFull && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Recommended
                    </span>
                  )}
                  {slot.isFull && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 shrink-0">
                      Full
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="h-4 w-4 text-rose-500 stroke-[2.5] shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
