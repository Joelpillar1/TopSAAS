import { supabase } from './supabase';

export const DRAFT_KEY = 'topsaas_launch_draft_v1';
export const STEP_KEY = 'topsaas_launch_step_v1';
export const USER_DRAFTS_PREFIX = 'topsaas_user_drafts_';

export interface LaunchDraft {
  id: string;
  userId?: string;
  name: string;
  tagline: string;
  url: string;
  category?: string;
  categories?: string[];
  logoDataUrl?: string;
  pricingModel?: string;
  step: number;
  updatedAt: number;
  data: Record<string, any>;
}

/** Check if a raw draft object has any meaningful user input */
export function hasDraftContent(raw: Partial<Record<string, any>> | null | undefined): boolean {
  if (!raw || typeof raw !== 'object') return false;
  return Boolean(
    (raw.name && String(raw.name).trim()) ||
      (raw.url && String(raw.url).trim()) ||
      (raw.tagline && String(raw.tagline).trim()) ||
      (raw.description && String(raw.description).trim()) ||
      (raw.features && Array.isArray(raw.features) && raw.features.length > 0)
  );
}

/** Deduplicate a list of drafts, keeping only the most recently updated draft per product */
function deduplicateDrafts(list: LaunchDraft[]): { unique: LaunchDraft[]; duplicates: LaunchDraft[] } {
  const sorted = [...list].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const seenKeys = new Set<string>();
  const unique: LaunchDraft[] = [];
  const duplicates: LaunchDraft[] = [];

  for (const d of sorted) {
    const normUrl = d.url ? d.url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
    const normName = d.name ? d.name.trim().toLowerCase() : '';
    // Group by normalized URL if available, then name; otherwise treat untitled as single draft
    const groupKey = normUrl || normName || 'draft_main_slot';

    if (seenKeys.has(groupKey)) {
      duplicates.push(d);
    } else {
      seenKeys.add(groupKey);
      unique.push(d);
    }
  }

  return { unique, duplicates };
}

/** Get list of saved drafts for a user from local storage immediately */
export function getUserDrafts(userId?: string): LaunchDraft[] {
  if (typeof window === 'undefined') return [];
  const draftsMap = new Map<string, LaunchDraft>();

  // 1. Load user-specific stored drafts
  if (userId) {
    try {
      const rawUserList = localStorage.getItem(`${USER_DRAFTS_PREFIX}${userId}`);
      if (rawUserList) {
        const parsed = JSON.parse(rawUserList);
        if (Array.isArray(parsed)) {
          parsed.forEach((d) => {
            if (d && typeof d === 'object' && d.id) {
              draftsMap.set(d.id, d);
            }
          });
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }

  // 2. Also check the active draft in localStorage (legacy/current active draft)
  try {
    const rawActive = localStorage.getItem(DRAFT_KEY);
    if (rawActive) {
      const parsed = JSON.parse(rawActive);
      if (hasDraftContent(parsed)) {
        const rawStep = localStorage.getItem(STEP_KEY);
        const parsedStep = rawStep ? parseInt(rawStep, 10) : 0;
        const validStep = Number.isFinite(parsedStep) && parsedStep >= 0 && parsedStep <= 4 ? parsedStep : 0;

        const activeId = parsed.id || (userId ? `draft_${userId}_launch` : 'draft_active');
        if (!draftsMap.has(activeId)) {
          draftsMap.set(activeId, {
            id: activeId,
            userId,
            name: parsed.name || '',
            tagline: parsed.tagline || '',
            url: parsed.url || '',
            category: parsed.category || (parsed.categories?.[0] ?? ''),
            categories: parsed.categories || (parsed.category ? [parsed.category] : []),
            logoDataUrl: parsed.logoDataUrl || '',
            pricingModel: parsed.pricingModel || '',
            step: validStep,
            updatedAt: parsed.updatedAt || Date.now(),
            data: parsed,
          });
        }
      }
    }
  } catch {
    /* ignore storage errors */
  }

  const { unique } = deduplicateDrafts(Array.from(draftsMap.values()));
  return unique;
}

// In-memory cache & debouncer to prevent burning Supabase API quotas
let dbSyncTimeout: ReturnType<typeof setTimeout> | null = null;
let cachedDbDrafts: { userId: string; timestamp: number; drafts: LaunchDraft[] } | null = null;
const DRAFTS_CACHE_TTL_MS = 60 * 1000; // 60s cache TTL

/** Debounced background sync to Supabase user_drafts table */
export function syncDraftToDbDebounced(dbPayload: Record<string, any>, delayMs: number = 2500): void {
  if (dbSyncTimeout) {
    clearTimeout(dbSyncTimeout);
  }
  dbSyncTimeout = setTimeout(() => {
    Promise.resolve(
      supabase
        .from('user_drafts')
        .upsert(dbPayload, { onConflict: 'id' })
    )
      .then(({ error }) => {
        if (error) {
          console.warn('Supabase draft sync warning:', error.message);
        } else if (cachedDbDrafts && cachedDbDrafts.userId === dbPayload.user_id) {
          cachedDbDrafts = null;
        }
      })
      .catch(() => {});
  }, delayMs);
}

/** Fetch user drafts from Supabase database with in-memory 60s cache to avoid hitting request limits */
export async function fetchUserDraftsFromDb(userId: string, forceRefresh: boolean = false): Promise<LaunchDraft[]> {
  const now = Date.now();
  if (!forceRefresh && cachedDbDrafts && cachedDbDrafts.userId === userId && now - cachedDbDrafts.timestamp < DRAFTS_CACHE_TTL_MS) {
    return cachedDbDrafts.drafts;
  }

  try {
    const { data, error } = await supabase
      .from('user_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error || !data) return getUserDrafts(userId);

    const dbDrafts: LaunchDraft[] = (data as unknown as Record<string, unknown>[]).map((row) => {
      const rowData = (row.data as Record<string, any>) || {};
      const stepVal = typeof row.step === 'number' ? row.step : 0;
      const validStep = Number.isFinite(stepVal) && stepVal >= 0 && stepVal <= 4 ? stepVal : 0;
      const updatedTimestamp = row.updated_at ? new Date(String(row.updated_at)).getTime() : Date.now();

      return {
        id: String(row.id),
        userId: String(row.user_id),
        name: String(row.name || ''),
        tagline: String(row.tagline || ''),
        url: String(row.url || ''),
        category: String(row.category || ''),
        categories: rowData.categories || (row.category ? [String(row.category)] : []),
        logoDataUrl: rowData.logoDataUrl || '',
        pricingModel: rowData.pricingModel || '',
        step: validStep,
        updatedAt: updatedTimestamp,
        data: rowData,
      };
    });

    // Deduplicate DB drafts
    const { unique, duplicates } = deduplicateDrafts(dbDrafts);

    // If there were duplicate rows in Supabase, purge them in the background
    if (duplicates.length > 0) {
      const duplicateIds = duplicates.map((d) => d.id);
      Promise.resolve(
        supabase
          .from('user_drafts')
          .delete()
          .in('id', duplicateIds)
      )
        .then(() => {
          console.log(`Cleaned up ${duplicateIds.length} duplicate drafts from Supabase.`);
        })
        .catch(() => {});
    }

    // Merge with local drafts
    if (typeof window !== 'undefined') {
      const localDrafts = getUserDrafts(userId);
      const combined = [...unique, ...localDrafts];
      const { unique: finalMerged } = deduplicateDrafts(combined);

      try {
        localStorage.setItem(`${USER_DRAFTS_PREFIX}${userId}`, JSON.stringify(finalMerged));
      } catch {
        /* ignore */
      }
      cachedDbDrafts = { userId, timestamp: now, drafts: finalMerged };
      return finalMerged;
    }

    cachedDbDrafts = { userId, timestamp: now, drafts: unique };
    return unique;
  } catch (err) {
    console.warn('Could not fetch drafts from Supabase:', err);
    return getUserDrafts(userId);
  }
}

/** Save or update a draft both locally and to Supabase database with a stable ID */
export function saveLaunchDraft(
  state: Record<string, any>,
  currentStep: number = 0,
  userId?: string
): LaunchDraft {
  const now = Date.now();
  // Ensure a stable deterministic ID per user draft so it never spawns duplicates on keystrokes
  const draftId = state.id || (userId ? `draft_${userId}_launch` : 'draft_active');
  const validStep = Number.isFinite(currentStep) && currentStep >= 0 && currentStep <= 4 ? currentStep : 0;

  const draft: LaunchDraft = {
    id: draftId,
    userId,
    name: state.name || '',
    tagline: state.tagline || '',
    url: state.url || '',
    category: state.category || (state.categories?.[0] ?? ''),
    categories: state.categories || (state.category ? [state.category] : []),
    logoDataUrl: state.logoDataUrl || '',
    pricingModel: state.pricingModel || '',
    step: validStep,
    updatedAt: now,
    data: {
      ...state,
      id: draftId,
      updatedAt: now,
    },
  };

  if (typeof window === 'undefined') return draft;

  // 1. Update active draft for instant resume
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft.data));
    localStorage.setItem(STEP_KEY, String(validStep));
  } catch {
    // Quota fallback: omit large screenshots/logo data URLs
    try {
      const lightweight = { ...draft.data, screenshots: [], logoDataUrl: '' };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(lightweight));
    } catch {
      /* ignore */
    }
  }

  // 2. Update local user drafts list (deduplicated)
  if (userId) {
    try {
      const userKey = `${USER_DRAFTS_PREFIX}${userId}`;
      const existing = getUserDrafts(userId);
      const { unique } = deduplicateDrafts([draft, ...existing]);
      localStorage.setItem(userKey, JSON.stringify(unique.slice(0, 5)));
    } catch {
      /* ignore */
    }

    // 3. Debounced background sync to Supabase user_drafts table (preserves API limits)
    const dbPayload = {
      id: draftId,
      user_id: userId,
      name: draft.name,
      tagline: draft.tagline,
      url: draft.url,
      category: draft.category || '',
      step: validStep,
      data: draft.data,
      updated_at: new Date(now).toISOString(),
    };

    syncDraftToDbDebounced(dbPayload, 2500);
  }

  return draft;
}

/** Clear the currently active draft from localStorage */
export function clearActiveDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(STEP_KEY);
  } catch {
    /* ignore */
  }
}

/** Delete a draft both locally and from Supabase database */
export function deleteLaunchDraft(draftId: string, userId?: string): void {
  if (typeof window === 'undefined') return;

  // 1. Check if it matches active draft
  try {
    const rawActive = localStorage.getItem(DRAFT_KEY);
    if (rawActive) {
      const parsed = JSON.parse(rawActive);
      if (parsed.id === draftId || draftId === 'draft_active') {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(STEP_KEY);
      }
    }
  } catch {
    /* ignore */
  }

  // 2. Remove from local user list
  if (userId) {
    if (cachedDbDrafts && cachedDbDrafts.userId === userId) {
      cachedDbDrafts = null;
    }
    if (dbSyncTimeout) {
      clearTimeout(dbSyncTimeout);
      dbSyncTimeout = null;
    }
    try {
      const userKey = `${USER_DRAFTS_PREFIX}${userId}`;
      const existing = getUserDrafts(userId);
      const filtered = existing.filter((d) => d.id !== draftId && (draftId !== 'draft_active' || d.id !== 'draft_active'));
      localStorage.setItem(userKey, JSON.stringify(filtered));
    } catch {
      /* ignore */
    }

    // 3. Delete from Supabase user_drafts table
    Promise.resolve(
      supabase
        .from('user_drafts')
        .delete()
        .eq('id', draftId)
        .eq('user_id', userId)
    )
      .then(({ error }) => {
        if (error) console.warn('Supabase draft delete warning:', error.message);
      })
      .catch(() => {});
  }
}

/** Load a draft into the active slot so /submit will render it */
export function loadDraftIntoActive(draft: LaunchDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft.data || draft));
    localStorage.setItem(STEP_KEY, String(draft.step ?? 0));
  } catch {
    /* ignore */
  }
}

/** Format relative time for draft display */
export function formatDraftTime(timestamp: number): string {
  if (!timestamp) return 'recently';
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
