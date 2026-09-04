// Monday-based (ISO-8601 style) week utilities for the weekly launch board

export interface WeekInfo {
  key: string; // '2026-W36'
  label: string; // 'Week 36'
  start: number; // Monday 00:00 local (inclusive)
  end: number; // next Monday 00:00 local (exclusive)
}

const WEEK_MS = 7 * 86400000;

/** ISO-8601 week number for a given date (Monday-start weeks) */
function getISOWeek(date: Date): number {
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
  return {
    key: `${monday.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`,
    label: `Week ${weekNumber}`,
    start,
    end,
  };
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