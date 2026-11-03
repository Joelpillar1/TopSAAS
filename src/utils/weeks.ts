// Monday-based (ISO-8601 style) week utilities for the weekly launch board

export interface WeekInfo {
  key: string; // '2026-W45'
  label: string; // 'Week 45'
  weekNumber: number; // 45
  start: number; // Monday 00:00 local (inclusive)
  end: number; // next Monday 00:00 local (exclusive)
  isCurrent?: boolean;
  isFuture?: boolean;
}

const WEEK_MS = 7 * 86400000;

/** ISO-8601 week number for a given date (Monday-start weeks) */
export function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Move to Thursday of the same week (ISO weeks belong to the year of their Thursday)
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / WEEK_MS);
}

/** Week info (start/end/label) for the week containing the given timestamp */
export function getWeekInfo(ts: number): WeekInfo {
  const d = new Date(ts);
  const day = d.getDay(); // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday, 0, 0, 0, 0);
  const start = monday.getTime();
  const end = start + WEEK_MS;
  const weekNumber = getISOWeek(monday);
  const now = Date.now();
  const isCurrent = now >= start && now < end;
  const isFuture = start > now;
  return {
    key: `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`,
    label: `Week ${weekNumber}`,
    weekNumber,
    start,
    end,
    isCurrent,
    isFuture,
  };
}

/** Week info for an offset in weeks from now (0 = current week, -1 = last week, +1 = next week) */
export function getWeekByOffset(offset = 0): WeekInfo {
  const now = Date.now();
  return getWeekInfo(now + offset * WEEK_MS);
}

/** Get a sequence of weeks around an offset (e.g. 3 past, current, 3 future) */
export function getWeeksWindow(centerOffset = 0, countBefore = 3, countAfter = 3): WeekInfo[] {
  const out: WeekInfo[] = [];
  for (let i = -countBefore; i <= countAfter; i++) {
    out.push(getWeekByOffset(centerOffset + i));
  }
  return out;
}

/** Week info for the `count` most recent weeks, oldest first (last entry = current week) */
export function getRecentWeeks(count = 6): WeekInfo[] {
  const now = Date.now();
  const out: WeekInfo[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(getWeekInfo(now - i * WEEK_MS));
  }
  return out;
}

/** True if the timestamp falls inside the week range */
export function isInWeek(ts: number, week: { start: number; end: number }): boolean {
  return ts >= week.start && ts < week.end;
}
