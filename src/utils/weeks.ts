// TopSAAS Platform Launch Week utilities
// Platform officially kicks off with Week 1 starting Monday, Nov 2, 2026 00:00:00 UTC.

export interface WeekInfo {
  key: string; // 'W1'
  label: string; // 'Week 1'
  weekNumber: number; // 1
  start: number; // Monday 00:00 UTC (inclusive)
  end: number; // next Monday 00:00 UTC (exclusive)
  isCurrent?: boolean;
  isFuture?: boolean;
}

export const WEEK_MS = 7 * 86400000;

// TopSAAS Week 1 Launch Epoch — Monday, Nov 2, 2026 00:00:00 UTC (deterministic across all clients and timezones)
export const LAUNCH_EPOCH_START = Date.UTC(2026, 10, 2, 0, 0, 0, 0);

/** Returns the 1-based TopSAAS launch week number */
export function getWeekNumber(ts: number = Date.now()): number {
  const t = Number(ts) || Date.now();
  if (t < LAUNCH_EPOCH_START) return 1;
  return Math.floor((t - LAUNCH_EPOCH_START) / WEEK_MS) + 1;
}

/** Returns WeekInfo for a specific 1-based week number */
export function getWeekByNumber(num: number): WeekInfo {
  const n = Math.max(1, Number(num) || 1);
  const start = LAUNCH_EPOCH_START + (n - 1) * WEEK_MS;
  const end = start + WEEK_MS;
  const now = Date.now();
  const isCurrent = now >= start && now < end;
  const isFuture = start > now;
  return {
    key: `W${n}`,
    label: `Week ${n}`,
    weekNumber: n,
    start,
    end,
    isCurrent,
    isFuture,
  };
}

/** Week info for the week containing the given timestamp (defaults to now = Week 1) */
export function getWeekInfo(ts: number = Date.now()): WeekInfo {
  const n = getWeekNumber(ts);
  return getWeekByNumber(n);
}

/** Week info for an offset in weeks from current week (0 = current week, 1 = next week) */
export function getWeekByOffset(offset = 0): WeekInfo {
  const current = getWeekNumber();
  return getWeekByNumber(current + offset);
}

/** Get a sequence of `count` weeks starting at `startWeek` (default startWeek = 1, count = 7) */
export function getWeeksRange(startWeek = 1, count = 7): WeekInfo[] {
  const s = Math.max(1, startWeek);
  const out: WeekInfo[] = [];
  for (let i = 0; i < count; i++) {
    out.push(getWeekByNumber(s + i));
  }
  return out;
}

/** Kept for backwards compatibility: returns recent weeks up to current */
export function getRecentWeeks(count = 6): WeekInfo[] {
  const current = getWeekNumber();
  const start = Math.max(1, current - count + 1);
  const out: WeekInfo[] = [];
  for (let i = start; i <= current; i++) {
    out.push(getWeekByNumber(i));
  }
  return out;
}

/** Returns a 7-week window centered around centerOffset */
export function getWeeksWindow(centerOffset = 0, countBefore = 3, countAfter = 3): WeekInfo[] {
  const current = getWeekNumber();
  const center = Math.max(1, current + centerOffset);
  const start = Math.max(1, center - countBefore);
  const total = countBefore + 1 + countAfter;
  return getWeeksRange(start, total);
}

/** True if the timestamp falls inside the week range */
export function isInWeek(ts: number, week: WeekInfo | { start: number; end: number; weekNumber?: number }): boolean {
  const t = Number(ts);
  // Week 1 captures all early launches up to Week 1 end
  if (('weekNumber' in week && Number(week.weekNumber) === 1) || week.start <= LAUNCH_EPOCH_START) {
    return t < week.end;
  }
  return t >= week.start && t < week.end;
}

/** Calendar month key in local time, e.g. "2026-11" */
export function getMonthKey(ts: number = Date.now()): string {
  const d = new Date(Number(ts) || Date.now());
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** True if the timestamp falls in the same calendar month as the reference time */
export function isInMonth(ts: number, reference: number = Date.now()): boolean {
  const a = new Date(Number(ts) || 0);
  const b = new Date(Number(reference) || 0);
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth();
}

/** Human-readable calendar month, e.g. "November 2026" */
export function formatMonthLabel(reference: number = Date.now()): string {
  return new Date(Number(reference) || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Internal scale capacity per week. TopSAAS launches 25 apps each week. */
export const MAX_WEEKLY_LAUNCH_CAP = 25;

/** Formats a WeekInfo into a clean human date range, e.g. "Nov 9 to Nov 15" */
export function formatWeekDateRange(week: WeekInfo, format: 'to' | '–' = 'to'): string {
  const startDate = new Date(week.start);
  const endDate = new Date(week.end - 1); // Sunday 23:59:59.999 UTC
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const startDay = startDate.getUTCDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  const endDay = endDate.getUTCDate();

  if (format === 'to') {
    return `${startMonth} ${startDay} to ${endMonth} ${endDay}`;
  }

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

export interface LaunchSlotInfo extends WeekInfo {
  dateRangeStr: string;
  statusLabel: string;
  badgeStyle: string;
  isFull: boolean;
  isRecommended?: boolean;
}

/**
 * Returns available upcoming launch slots starting from the current week.
 * Assesses availability based on existing product/submission counts without revealing the hard ceiling.
 */
export function getUpcomingLaunchSlots(
  existingWeekCounts: Record<number, number> = {},
  slotCount = 8
): LaunchSlotInfo[] {
  const currentWeek = getWeekNumber();
  const slots: LaunchSlotInfo[] = [];

  for (let i = 0; i < slotCount; i++) {
    const weekNum = currentWeek + i;
    const week = getWeekByNumber(weekNum);
    const count = existingWeekCounts[weekNum] || 0;
    const isFull = count >= MAX_WEEKLY_LAUNCH_CAP;

    let statusLabel = 'Available';
    let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';

    if (i === 0 && week.isCurrent) {
      statusLabel = count >= MAX_WEEKLY_LAUNCH_CAP ? 'Round Active (Full)' : 'Live This Week';
      badgeStyle = count >= MAX_WEEKLY_LAUNCH_CAP
        ? 'bg-neutral-100 text-neutral-600 border-neutral-200'
        : 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (isFull) {
      statusLabel = 'Round Full';
      badgeStyle = 'bg-neutral-100 text-neutral-500 border-neutral-200';
    } else if (count >= 20) {
      statusLabel = 'Filling Fast';
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (count >= 15) {
      statusLabel = 'Popular';
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (i === 1) {
      statusLabel = 'Recommended';
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    slots.push({
      ...week,
      dateRangeStr: formatWeekDateRange(week),
      statusLabel,
      badgeStyle,
      isFull,
      isRecommended: i === 1 || (i === 0 && count < 20),
    });
  }

  return slots;
}
