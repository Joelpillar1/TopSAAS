import { supabase } from './supabase';

// Secret salt used to generate the cryptographic hash of the administrator password.
// The plain-text password is NEVER written, exposed, or bundled in client-side code.
const ADMIN_SALT = 'topsaas_admin_secret_salt_2026';

// One-way SHA-256 digest of (ADMIN_SALT + password)
const EXPECTED_ADMIN_HASH = 'ba587f1940b8a529ef76807fc508593777dfdae733a797f1f20129ed71a98e01';

// Known admin email addresses
export const ALLOWED_ADMIN_EMAILS = [
  'joelpillar88@gmail.com',
  'joelpillar51@gmail.com',
];

const ADMIN_SESSION_STORAGE_KEY = 'topsaas_admin_session_auth_v1';
const ADMIN_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AdminSession {
  email: string;
  timestamp: number;
}

/** Check if current session has an active, valid admin unlock */
export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (session && session.email && session.timestamp) {
      if (Date.now() - session.timestamp < ADMIN_SESSION_MAX_AGE_MS) {
        return session;
      }
    }
  } catch {}
  return null;
}

/** Check whether the admin session is currently active and unlocked */
export function isAdminSessionActive(): boolean {
  return getAdminSession() !== null;
}

/** Save an active admin unlock to sessionStorage */
export function setAdminSession(email: string): void {
  try {
    const session: AdminSession = {
      email: email.trim().toLowerCase(),
      timestamp: Date.now(),
    };
    sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {}
}

/** Clear the admin session lock */
export function clearAdminSession(): void {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  } catch {}
}

/**
 * Verify administrator credentials securely:
 * 1. Checks that the email is an authorized administrator.
 * 2. Hashes the input password using WebCrypto SHA-256 with the secret salt.
 * 3. Compares the resulting digest against the expected one-way hash.
 * 
 * The plain-text password is NEVER stored, compared, or exposed in the codebase.
 */
export async function verifyAdminCredentials(
  email: string,
  passwordInput: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = passwordInput.trim();

  if (!cleanEmail) {
    return { success: false, error: 'Please enter your administrator email.' };
  }

  if (!cleanPassword) {
    return { success: false, error: 'Please enter your administrator password.' };
  }

  // 1. Verify email authorization
  let isAuthorized = ALLOWED_ADMIN_EMAILS.includes(cleanEmail);
  if (!isAuthorized) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (data && (data.role === 'admin' || data.role === 'moderator')) {
        isAuthorized = true;
      }
    } catch {}
  }

  if (!isAuthorized) {
    return {
      success: false,
      error: 'This email is not authorized to access the administrator portal.',
    };
  }

  // 2. Cryptographic one-way hash verification
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(ADMIN_SALT + cleanPassword);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (computedHash !== EXPECTED_ADMIN_HASH) {
      return { success: false, error: 'Incorrect administrator password.' };
    }

    // Success: save unlock in session
    setAdminSession(cleanEmail);
    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Authentication failed due to browser crypto limitation.',
    };
  }
}

