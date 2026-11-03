// TopSAAS Platform Launch Week utilities
// Platform officially kicks off with Week 1 starting Monday, Nov 2, 2026.

export interface WeekInfo {
  key: string; // 'W1'
  label: string; // 'Week 1'
  weekNumber: number; // 1
  start: number; // Monday 00:00 local (inclusive)
  end: number; // next Monday 00:00 local (exclusive)
  isCurrent?: boolean;
  isFuture?: boolean;
}

export const WEEK_MS = 7 * 86400000;

// TopSAAS Week 1 Launch Epoch — Monday, Nov 2, 2026 00:00:00 local
export const LAUNCH_EPOCH_START = new Date(2026, 10, 2, 0, 0, 0, 0).getTime();

/** Returns the 1-based TopSAAS launch week number */
export function getWeekNumber(ts: number = Date.now()): number {
  if (ts < LAUNCH_EPOCH_START) return 1;
  return Math.floor((ts - LAUNCH_EPOCH_START) / WEEK_MS) + 1;
}

/** Returns WeekInfo for a specific 1-based week number */
export function getWeekByNumber(num: number): WeekInfo {
  const n = Math.max(1, num);
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
  // Week 1 captures all early launches up to Week 1 end
  if (('weekNumber' in week && week.weekNumber === 1) || week.start <= LAUNCH_EPOCH_START) {
    return ts < week.end;
  }
  return ts >= week.start && ts < week.end;
}
