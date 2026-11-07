/**
 * Live Countdown helper for Sponsors and Featured Spotlight placements.
 */

export interface CountdownInfo {
  formatted: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  isUrgent: boolean; // Less than 48 hours remaining
}

/** Formats a future timestamp into a live readable countdown */
export function getCountdown(targetMs?: number | null, nowMs: number = Date.now()): CountdownInfo {
  if (!targetMs) {
    return { formatted: 'No expiry', days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false };
  }

  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { formatted: 'Expired', days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: true };
  }

  const days = Math.floor(diff / (86400 * 1000));
  const hours = Math.floor((diff % (86400 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else {
    formatted = `${minutes}m ${seconds}s`;
  }

  return {
    formatted,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    isUrgent: diff <= 48 * 3600 * 1000,
  };
}

/** Formats preserved remaining duration (e.g. while paused) */
export function formatRemainingMs(ms?: number | null): string {
  if (!ms || ms <= 0) return '0h';
  const days = Math.floor(ms / (86400 * 1000));
  const hours = Math.floor((ms % (86400 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((ms % (3600 * 1000)) / (60 * 1000));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

