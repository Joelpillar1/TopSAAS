import { supabase } from './supabase';
import { Category, PricingModel } from '../types';

export interface AutofillData {
  name: string;
  tagline: string;
  description: string;
  category: Category;
  categories: Category[];
  pricingModel: PricingModel;
  targetAudience: string;
  problemItSolves: string;
  solution: string;
  uniqueSellingPoint: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  discord?: string;
  youtube?: string;
  productHunt?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
}

export interface AutofillResponse {
  ok: boolean;
  data?: AutofillData;
  error?: string;
  noApiKey?: boolean;
}

/**
 * Formats low-level backend, Deno, network, and DNS errors into professional,
 * user-friendly messages for the submission form banner.
 */
export function formatAutofillErrorMessage(rawError?: string, _targetUrl?: string): string {
  if (!rawError) return 'Unable to auto-fill details from this website. Please fill in the details manually.';

  const err = rawError.toLowerCase();

  // Invalid domain / FQDN syntax (e.g. topsaas..space or trailing dot)
  if (err.includes('fqdn') || err.includes('empty label') || err.includes('invalid host') || err.includes('invalid url')) {
    return 'The website address contains an invalid domain or extra dots. Please check the URL for typos and try again.';
  }

  // Blocked private / internal / localhost host
  if (err.includes('target host not allowed') || err.includes('blocked host')) {
    return 'Localhost and private network addresses cannot be auto-filled. Please enter a public website URL.';
  }

  // DNS resolution failure
  if (err.includes('enotfound') || err.includes('getaddrinfo') || err.includes('name not resolved') || (err.includes('dns') && !err.includes('dnspython'))) {
    return 'Could not find this website domain. Please verify that the domain name is active and spelled correctly.';
  }

  // Connection refused or reset
  if (err.includes('econnrefused') || err.includes('connection refused') || err.includes('econnreset') || err.includes('failed to connect')) {
    return 'The website server is currently unreachable or refusing connections.';
  }

  // Timeout
  if (err.includes('timed out') || err.includes('timeout') || err.includes('aborterror')) {
    return 'The website took too long to respond. The server might be slow or temporarily down.';
  }

  // SSL / TLS Certificate errors
  if (err.includes('ssl') || err.includes('cert_') || err.includes('certificate')) {
    return 'Could not establish a secure connection (SSL/TLS certificate error) to this website.';
  }

  // HTTP status codes or Cloudflare / Bot protection
  if (err.includes('403') || err.includes('cloudflare') || err.includes('access denied') || err.includes('forbidden')) {
    return 'This website has anti-bot or firewall protection blocking auto-fill. Please enter your details manually.';
  }

  if (err.includes('404') || err.includes('not found')) {
    return 'The target page could not be found (404). Please verify that the URL is live in your browser.';
  }

  if (err.includes('500') || err.includes('server error') || err.includes('502') || err.includes('503')) {
    return 'The target website server returned an error. Please try again in a few moments or enter details manually.';
  }

  // If prefixed with generic "Could not reach target website:", clean it up recursively
  if (rawError.toLowerCase().startsWith('could not reach target website:')) {
    const stripped = rawError.replace(/^could not reach target website:\s*/i, '').trim();
    if (stripped) {
      return formatAutofillErrorMessage(stripped, _targetUrl);
    }
  }

  return rawError;
}

/**
 * Triggers OpenAI auto-fill for the given website URL.
 * Securely calls Supabase Edge Function (or local /api/autofill-submission in dev),
 * where the OpenAI API key is protected server-side in Supabase.
 */
export async function autofillWithOpenAI(url: string): Promise<AutofillResponse> {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) {
    return { ok: false, error: 'Please enter a website URL first.' };
  }

  // 1. Try Supabase Edge Function (primary production path where API key is protected in Supabase)
  let edgeFunctionNotDeployed = false;
  try {
    const { data, error } = await supabase.functions.invoke('autofill-submission', {
      body: { url: normalizedUrl },
    });

    if (!error && data?.ok && data?.data) {
      return { ok: true, data: data.data };
    }

    if (error) {
      console.warn('[Autofill] Supabase Edge Function error:', error);
      // Check if function not found (HTTP 404)
      const is404 =
        (error as any)?.context?.status === 404 ||
        (error as any)?.message?.includes('404') ||
        (error as any)?.message?.includes('not found');
      if (is404) {
        edgeFunctionNotDeployed = true;
      }
    }

    if (data?.code === 'NO_API_KEY') {
      return {
        ok: false,
        noApiKey: true,
        error:
          data.error ||
          'OpenAI API key is not configured in Supabase. Please configure OPENAI_API_KEY in your Supabase Edge Function Secrets or app_secrets table.',
      };
    }

    if (data?.error) {
      return { ok: false, error: formatAutofillErrorMessage(data.error, normalizedUrl) };
    }
  } catch (err) {
    console.warn('[Autofill] Edge function invocation threw:', err);
    edgeFunctionNotDeployed = true;
  }

  // 2. Try /api/autofill-submission (for local Vite dev middleware or Vercel serverless)
  try {
    const res = await fetch('/api/autofill-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: normalizedUrl }),
    });

    const body = await res.json().catch(() => null);

    if (res.ok && body?.ok && body?.data) {
      return { ok: true, data: body.data };
    }

    if (body?.code === 'NO_API_KEY') {
      const guidance = edgeFunctionNotDeployed
        ? 'Edge Function "autofill-submission" is not deployed to your Supabase project yet. Deploy it with `npx supabase functions deploy autofill-submission --no-verify-jwt`, or add OPENAI_API_KEY to your local .env file.'
        : body.error || 'OpenAI API key is not configured in Supabase.';

      return {
        ok: false,
        noApiKey: true,
        error: guidance,
      };
    }

    if (body?.error && res.status !== 404) {
      return { ok: false, error: formatAutofillErrorMessage(body.error, normalizedUrl) };
    }
  } catch {
    // Both endpoints failed
  }

  return {
    ok: false,
    error: edgeFunctionNotDeployed
      ? 'The Supabase Edge Function "autofill-submission" is not deployed yet. Please run `npx supabase functions deploy autofill-submission --no-verify-jwt`.'
      : 'Could not connect to auto-fill service. Please make sure the Supabase Edge Function is deployed.',
  };
}
