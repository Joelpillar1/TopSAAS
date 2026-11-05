import { supabase } from './supabase';

export const WHOP_LINKS = {
  weeklyRelaunch: 'https://whop.com/topsaas/weekly-relaunch/',
  oneTime: 'https://whop.com/topsaas/one-time-fe/',
  perProductPass: 'https://whop.com/topsaas/per-product-pass/',
  sponsor1mo: 'https://whop.com/checkout/plan_VHCOSyqWd9l9Q',
  sponsor3mo: 'https://whop.com/checkout/plan_SMad32AkVoMeu',
  sponsor1yr: 'https://whop.com/checkout/plan_2uumEoGYQUKtb',
} as const;

export type PlanType =
  | '1mo'
  | '3mo'
  | '1yr'
  | '7days'
  | '30days'
  | 'weekly_relaunch'
  | 'onetime'
  | 'per_product_pass'
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
  if (p === 'weekly_relaunch' || p === 'weekly-relaunch' || p === 'relaunch') return 'weekly_relaunch';
  if (p === 'onetime' || p === 'one-time' || p === 'one-time-fe' || p === 'lifetime') return 'onetime';
  if (p === 'per_product_pass' || p === 'per-product-pass' || p === 'pro_monthly' || p === 'pro') return 'per_product_pass';
  if (p === '3mo') return '3mo';
  if (p === '1yr') return '1yr';
  return '1mo';
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

    if (!rpcErr && rpcUrl && typeof rpcUrl === 'string' && rpcUrl.trim()) {
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

    if (!error && data?.value) {
      return data.value;
    }
  } catch (err) {
    console.debug('Direct whop_payments_config query note:', err);
  }

  // 3. Known production Whop links
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

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }

  return WHOP_LINKS.sponsor1mo;
}

/**
 * Creates a Whop checkout session by querying Supabase Edge Function or Database.
 */
export async function createCheckoutSession(
  options: CheckoutOptions
): Promise<CheckoutResponse> {
  const { planType, productName, targetProductId, customerEmail } = options;

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
        },
      }
    );

    if (!error && data?.checkout_url) {
      return data;
    }
  } catch (err) {
    console.debug('whop-checkout function note, reading from Supabase config:', err);
  }

  // 2. Fetch checkout URL dynamically from Supabase database
  const dbUrl = await getWhopCheckoutUrlFromSupabase(planType);
  const baseLink = dbUrl || WHOP_LINKS.weeklyRelaunch;

  const redirectUrl = encodeURIComponent(returnUrl);
  const separator = baseLink.includes('?') ? '&' : '?';
  const directUrl = `${baseLink}${separator}redirect_url=${redirectUrl}${
    customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ''
  }`;

  return { checkout_url: directUrl };
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

  window.location.href = checkout_url;
}
