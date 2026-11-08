import { supabase } from './supabase';
import { getTrackkitAttribution, appendTrackkitParams } from './trackkit';

export const WHOP_LINKS = {
  // Weekly Relaunch ($5/week)
  weeklyRelaunch: 'https://whop.com/checkout/plan_81SmEHd2w16EG',

  // $19 Per Product Pass / One-Time Verified Launch
  oneTime: 'https://whop.com/checkout/plan_B4wY8ei9eab1S',
  perProductPass: 'https://whop.com/checkout/plan_B4wY8ei9eab1S',
  verifiedLaunch: 'https://whop.com/checkout/plan_B4wY8ei9eab1S',

  // Sponsor Spot (Sidebar Rails: $10/wk & $29/mo)
  sponsor1wk: 'https://whop.com/checkout/plan_Ux5pdAxT3WN7D',
  sponsor1mo: 'https://whop.com/checkout/plan_VHCOSyqWd9l9Q',
  sponsor3mo: 'https://whop.com/checkout/plan_SMad32AkVoMeu',
  sponsor1yr: 'https://whop.com/checkout/plan_2uumEoGYQUKtb',

  // Featured Spot (Pinned top banner: $15/wk & $39/mo)
  featured1wk: 'https://whop.com/checkout/plan_YGXtgHZnspc77',
  featured1mo: 'https://whop.com/checkout/plan_GBN00B27YgYdx',

  // Zero Plan ($0 testing & confirmation)
  zero: 'https://whop.com/topsaas/zero-ce-84f1',
} as const;

export type PlanType =
  | '1wk'
  | '1mo'
  | '3mo'
  | '1yr'
  | '7days'
  | '30days'
  | 'sponsor_1wk'
  | 'sponsor_1mo'
  | 'featured_1wk'
  | 'featured_1mo'
  | 'weekly_relaunch'
  | 'onetime'
  | 'per_product_pass'
  | 'verified_launch'
  | 'lifetime';

export interface CheckoutOptions {
  planType: PlanType;
  productName: string;
  targetProductId?: string;
  customerEmail?: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id?: string;
}

/**
 * Normalizes plan key to database key suffix
 */
export function normalizePlanKey(planType: PlanType): string {
  const p = String(planType).toLowerCase();

  // Featured Spot plans
  if (p === 'featured_1wk' || p === 'featured1wk' || p === 'featured-1wk' || p === 'featured_weekly') {
    return 'featured_1wk';
  }
  if (p === 'featured_1mo' || p === 'featured1mo' || p === 'featured-1mo' || p === 'featured_monthly') {
    return 'featured_1mo';
  }

  // Sponsor Spot plans
  if (p === 'sponsor_1wk' || p === 'sponsor1wk' || p === 'sponsor-1wk' || p === 'sponsor_weekly') {
    return 'sponsor_1wk';
  }
  if (p === 'sponsor_1mo' || p === 'sponsor1mo' || p === 'sponsor-1mo' || p === 'sponsor_monthly') {
    return 'sponsor_1mo';
  }

  // Generic 1wk / 1mo (defaults to sponsor)
  if (p === '1wk' || p === 'weekly' || p === '1week' || p === '7days') return 'sponsor_1wk';

  // Weekly relaunch
  if (p === 'weekly_relaunch' || p === 'weekly-relaunch' || p === 'relaunch') return 'weekly_relaunch';

  // $19 Per Product Pass / Verified launch one-time
  if (
    p === 'onetime' ||
    p === 'one-time' ||
    p === 'one-time-fe' ||
    p === 'lifetime' ||
    p === 'verified_launch' ||
    p === 'per_product_pass' ||
    p === 'per-product-pass'
  ) {
    return 'onetime';
  }

  if (p === '3mo') return '3mo';
  if (p === '1yr') return '1yr';
  return 'sponsor_1mo';
}

export function isValidCheckoutUrl(url: unknown): url is string {
  if (typeof url !== 'string' || !url.trim()) return false;
  // A direct checkout URL must contain whop.com/checkout/
  // Legacy store/hub URLs like whop.com/topsaas/... are rejected
  return url.includes('whop.com/checkout/');
}

/**
 * Fetches the secure checkout URL dynamically from Supabase database (whop_payments_config).
 * This ensures checkout links are managed in your Supabase database and not exposed statically in code.
 */
export async function getWhopCheckoutUrlFromSupabase(
  planType: PlanType
): Promise<string | null> {
  const planKey = normalizePlanKey(planType);

  try {
    // 1. Try secure RPC function if available
    const { data: rpcUrl, error: rpcErr } = await supabase.rpc(
      'get_whop_checkout_url',
      { p_plan_type: planKey }
    );

    if (!rpcErr && isValidCheckoutUrl(rpcUrl)) {
      return rpcUrl.trim();
    }
  } catch (err) {
    console.debug('RPC get_whop_checkout_url note:', err);
  }

  try {
    // 2. Direct RLS query on whop_payments_config table (safe public checkout_url_% keys)
    const { data, error } = await supabase
      .from('whop_payments_config')
      .select('value')
      .eq('key', `checkout_url_${planKey}`)
      .maybeSingle();

    if (!error && isValidCheckoutUrl(data?.value)) {
      return data.value.trim();
    }
  } catch (err) {
    console.debug('Direct whop_payments_config query note:', err);
  }

  // 3. Known production Whop direct checkout links
  if (planKey === 'featured_1wk') return WHOP_LINKS.featured1wk;
  if (planKey === 'featured_1mo') return WHOP_LINKS.featured1mo;
  if (planKey === 'sponsor_1wk') return WHOP_LINKS.sponsor1wk;
  if (planKey === 'sponsor_1mo') return WHOP_LINKS.sponsor1mo;
  if (planKey === 'weekly_relaunch') return WHOP_LINKS.weeklyRelaunch;
  if (planKey === 'onetime') return WHOP_LINKS.oneTime;
  if (planKey === 'per_product_pass') return WHOP_LINKS.perProductPass;

  // 4. Fallback to Vite env variables if provided
  const envUrl =
    planKey === '3mo'
      ? import.meta.env.VITE_WHOP_LINK_3MO
      : planKey === '1yr'
        ? import.meta.env.VITE_WHOP_LINK_1YR
        : import.meta.env.VITE_WHOP_LINK_1MO;

  if (isValidCheckoutUrl(envUrl)) {
    return envUrl.trim();
  }

  return planKey === 'onetime' ? WHOP_LINKS.oneTime : WHOP_LINKS.sponsor1mo;
}

/**
 * Creates a Whop checkout session by querying Supabase Edge Function or Database.
 */
export async function createCheckoutSession(
  options: CheckoutOptions
): Promise<CheckoutResponse> {
  const { planType, productName, targetProductId, customerEmail } = options;
  const planKey = normalizePlanKey(planType);
  const attribution = getTrackkitAttribution();

  const returnUrl = `${window.location.origin}/payment-success?plan=${planType}&product=${encodeURIComponent(
    productName
  )}${targetProductId ? `&target_product_id=${targetProductId}` : ''}`;

  // 1. Attempt edge function checkout session
  try {
    const { data, error } = await supabase.functions.invoke<CheckoutResponse>(
      'whop-checkout',
      {
        body: {
          plan_type: planType,
          product_name: productName,
          target_product_id: targetProductId,
          customer_email: customerEmail,
          return_url: returnUrl,
          ml_visitor_id: attribution.ml_visitor_id,
          ml_session_id: attribution.ml_session_id,
        },
      }
    );

    if (!error && isValidCheckoutUrl(data?.checkout_url)) {
      return {
        ...data,
        checkout_url: appendTrackkitParams(data.checkout_url),
      };
    }
  } catch (err) {
    console.debug('whop-checkout function note, reading from direct config:', err);
  }

  // 2. Fetch checkout URL dynamically from Supabase database or verified direct checkout links
  const dbUrl = await getWhopCheckoutUrlFromSupabase(planType);
  const fallbackUrl =
    planKey === 'onetime'
      ? WHOP_LINKS.oneTime
      : planKey === 'weekly_relaunch'
      ? WHOP_LINKS.weeklyRelaunch
      : WHOP_LINKS.sponsor1mo;

  const baseLink = isValidCheckoutUrl(dbUrl) ? dbUrl : fallbackUrl;

  const redirectUrl = encodeURIComponent(returnUrl);
  const separator = baseLink.includes('?') ? '&' : '?';
  const directUrl = `${baseLink}${separator}redirect_url=${redirectUrl}${customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ''}`;

  return { checkout_url: appendTrackkitParams(directUrl) };
}

/**
 * Saves pending sponsor product in localStorage and redirects user to Whop checkout.
 */
export async function redirectToCheckout(options: CheckoutOptions): Promise<void> {
  if (options.targetProductId) {
    localStorage.setItem('topsaas_featured_pending', options.targetProductId);
    localStorage.setItem('topsaas_featured_pending_plan', options.planType);
  }

  const { checkout_url } = await createCheckoutSession(options);
  if (!checkout_url) {
    throw new Error('No checkout URL received from Whop payment provider.');
  }

  const finalUrl = appendTrackkitParams(checkout_url);
  window.location.href = finalUrl;
}
