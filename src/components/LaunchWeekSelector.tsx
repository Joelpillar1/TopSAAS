import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { Product, WebsiteSubmission } from '../types';
import { playSound } from '../utils/sound';
import { MAX_WEEKLY_LAUNCH_CAP, getWeekByNumber, getWeekNumber } from '../utils/weeks';
import { isSponsorOnlyProduct, publishedProductId } from '../utils/db';

interface LaunchWeekSelectorProps {
  selectedWeekNumber?: number;
  onSelectWeek: (weekNumber: number, weekStartDate: number) => void;
  products?: Product[];
  submissions?: WebsiteSubmission[];
  soundEnabled?: boolean;
}

export interface LaunchSlot {
  id: string;
  weekNumber: number;
  start: number;
  end: number;
  dateRange: string;
  isFull: boolean;
  taken: number;
  available: number;
  cap: number;
  label: string;
}

/** Formats date range according to convention (e.g. Nov 9–15, 2026 or Dec 28, 2026 – Jan 3, 2027) */
function formatSlotDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const startDay = start.getDate();
  const startYear = start.getFullYear();

  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const endDay = end.getDate();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
  }
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}–${endDay}, ${startYear}`;
}

export const LaunchWeekSelector: React.FC<LaunchWeekSelectorProps> = ({
  selectedWeekNumber,
  onSelectWeek,
  products = [],
  submissions = [],
  soundEnabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close custom dropdown on outside click or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Generate 24 upcoming TopSAAS launch round slots starting from the current platform week.
  // Excludes rejected submissions, sponsor-only items, and previous-week products.
  const slots: LaunchSlot[] = useMemo(() => {
    const now = Date.now();
    const currentWeekNum = getWeekNumber(now);
    const result: LaunchSlot[] = [];
    const totalSlots = 24;
    const cap = MAX_WEEKLY_LAUNCH_CAP;

    const rejectedIds = new Set<string>();
    for (const s of submissions) {
      if (s.status === 'rejected') {
        rejectedIds.add(s.id);
        rejectedIds.add(publishedProductId(s.id));
      }
    }

    for (let i = 0; i < totalSlots; i++) {
      const weekInfo = getWeekByNumber(currentWeekNum + i);
      const weekNum = weekInfo.weekNumber;
      const startMs = weekInfo.start;
      const endMs = weekInfo.end - 1;
      const startDate = new Date(startMs);
      const endDate = new Date(endMs);
      const dateRange = formatSlotDateRange(startDate, endDate);
      const slotId = weekInfo.key;

      // Aggregate active apps for this specific launch round
      const activeAppIds = new Set<string>();

      for (const p of products) {
        if (isSponsorOnlyProduct(p) || rejectedIds.has(p.id)) continue;

        const pDate = p.scheduledLaunchDate ? Number(p.scheduledLaunchDate) : Number(p.createdAt || 0);
        const matchesScheduledWeek = p.scheduledLaunchWeek
          ? p.scheduledLaunchWeek === weekNum
          : pDate >= startMs && pDate <= endMs;
        const autoRelaunch = Boolean(p.autoRelaunch);
        const inRelaunchWeeks = Array.isArray(p.relaunchWeeks) && p.relaunchWeeks.includes(weekNum);

        if (matchesScheduledWeek || autoRelaunch || inRelaunchWeeks) {
          activeAppIds.add(p.id);
        }
      }

      for (const s of submissions) {
        if (s.status !== 'approved' && s.status !== 'under_review') continue;
        const prodId = publishedProductId(s.id);
        if (activeAppIds.has(prodId) || activeAppIds.has(s.id)) continue;

        const sDate = s.scheduledLaunchDate ? Number(s.scheduledLaunchDate) : Number(s.submittedAt || 0);
        const matchesWeek = s.scheduledLaunchWeek
          ? s.scheduledLaunchWeek === weekNum
          : sDate >= startMs && sDate <= endMs;

        if (matchesWeek) {
          activeAppIds.add(s.id);
        }
      }

      const count = activeAppIds.size;
      const isPast = endMs < now;
      const taken = Math.min(cap, count);
      const available = isPast ? 0 : Math.max(0, cap - count);
      const isFull = isPast || available === 0;

      const label = isFull
        ? `${dateRange} · full (0/${cap} available)`
        : `${dateRange} · ${available}/${cap} available`;

      result.push({
        id: slotId,
        weekNumber: weekNum,
        start: startMs,
        end: endMs,
        dateRange,
        isFull,
        taken,
        available,
        cap,
        label,
      });
    }

    return result;
  }, [products, submissions]);

  // Find the selected slot or default to the first available (non-full) slot
  const firstAvailableSlot = useMemo(() => slots.find((s) => !s.isFull) || slots[0], [slots]);

  const activeSlot = useMemo(() => {
    if (selectedWeekNumber) {
      const match = slots.find((s) => s.weekNumber === selectedWeekNumber && !s.isFull);
      if (match) return match;
    }
    return firstAvailableSlot;
  }, [selectedWeekNumber, slots, firstAvailableSlot]);

  // Ensure the parent form has the selected week registered
  useEffect(() => {
    if (!selectedWeekNumber && activeSlot) {
      onSelectWeek(activeSlot.weekNumber, activeSlot.start);
    }
  }, [selectedWeekNumber, activeSlot, onSelectWeek]);

  // Scroll active item into view when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current && activeSlot) {
      const activeEl = listRef.current.querySelector<HTMLElement>(`[data-slot-id="${activeSlot.id}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, activeSlot]);

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

      {/* Custom Dropdown Trigger Button */}
      <div ref={dropdownRef} className="relative mt-3">
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            setIsOpen((prev) => !prev);
          }}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left text-xs sm:text-[13px] font-medium transition-all focus:outline-hidden focus:ring-2 focus:ring-neutral-950 ${
            isOpen
              ? 'border-neutral-950 ring-2 ring-neutral-950/10 shadow-xs'
              : 'border-neutral-300 hover:border-neutral-400 shadow-2xs'
          }`}
        >
          <span className="truncate text-neutral-900 font-medium">
            {activeSlot ? activeSlot.label : 'Select launch week...'}
          </span>

          <ChevronDown
            className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Custom Dropdown Popover List */}
        {isOpen && (
          <div
            ref={listRef}
            role="listbox"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-neutral-300 bg-white py-1 shadow-xl"
          >
            {slots.map((slot) => {
              const isSelected = activeSlot?.id === slot.id;

              return (
                <button
                  key={slot.id}
                  data-slot-id={slot.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={slot.isFull}
                  onClick={() => {
                    if (slot.isFull) return;
                    playSound('click', soundEnabled);
                    onSelectWeek(slot.weekNumber, slot.start);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-xs sm:text-[13px] transition-colors select-none ${
                    slot.isFull
                      ? 'cursor-not-allowed text-neutral-400'
                      : isSelected
                        ? 'bg-blue-600 text-white font-medium cursor-pointer'
                        : 'cursor-pointer text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  <span className="block truncate">
                    {slot.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] font-medium text-neutral-500">
        Your listing goes live at 00:00 on the Monday and runs for the full week.
      </p>
    </div>
  );
};
