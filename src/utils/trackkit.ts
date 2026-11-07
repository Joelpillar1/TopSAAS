/**
 * Trackkit Analytics & Revenue Attribution Utilities
 * Dashboard: https://minilytics.trackkit.workers.dev
 * Website ID: 5y6c5l0e536b6o6v
 */

export interface TrackkitAttribution {
  ml_visitor_id?: string;
  ml_session_id?: string;
}

/**
 * Read visitor and session IDs from window.trackkit attribution helper or first-party cookies.
 */
export function getTrackkitAttribution(): TrackkitAttribution {
  if (typeof window === 'undefined') return {};

  try {
    // 1. Check window.trackkit or window.minilytics attribution helper
    const attr =
      window.trackkit?.attribution?.() ||
      window.minilytics?.attribution?.();

    if (attr?.ml_visitor_id || attr?.ml_session_id) {
      return {
        ml_visitor_id: attr.ml_visitor_id || '',
        ml_session_id: attr.ml_session_id || '',
      };
    }

    // 2. Fallback: parse document.cookie for ml_vid and ml_sid
    const cookies = document.cookie ? document.cookie.split(';') : [];
    let ml_vid = '';
    let ml_sid = '';

    for (const cookie of cookies) {
      const [rawKey, rawVal] = cookie.trim().split('=');
      if (rawKey === 'ml_vid' && rawVal) ml_vid = decodeURIComponent(rawVal);
      if (rawKey === 'ml_sid' && rawVal) ml_sid = decodeURIComponent(rawVal);
    }

    return {
      ml_visitor_id: ml_vid || undefined,
      ml_session_id: ml_sid || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Identify authenticated user in Trackkit
 */
export function identifyUser(user: { id: string; email?: string | null; name?: string | null }): void {
  if (typeof window === 'undefined') return;
  try {
    window.trackkit?.('identify', {
      user_id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
    });
  } catch {}
}

/**
 * Trigger a Trackkit custom goal
 */
export function trackGoal(goal: string, data?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    window.trackkit?.('goal', goal, data);
  } catch {}
}

/**
 * Appends Trackkit attribution parameters (ml_visitor_id, ml_session_id)
 * to any checkout/payment URL before redirection.
 */
export function appendTrackkitParams(checkoutUrl: string): string {
  if (!checkoutUrl) return checkoutUrl;
  try {
    const { ml_visitor_id, ml_session_id } = getTrackkitAttribution();
    if (!ml_visitor_id && !ml_session_id) return checkoutUrl;

    const url = new URL(checkoutUrl, typeof window !== 'undefined' ? window.location.origin : 'https://topsaas.space');

    if (ml_visitor_id) {
      url.searchParams.set('metadata[ml_visitor_id]', ml_visitor_id);
    }
    if (ml_session_id) {
      url.searchParams.set('metadata[ml_session_id]', ml_session_id);
    }

    return url.toString();
  } catch {
    return checkoutUrl;
  }
}

