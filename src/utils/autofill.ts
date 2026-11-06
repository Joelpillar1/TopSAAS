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
      return { ok: false, error: data.error };
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
      return { ok: false, error: body.error };
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
