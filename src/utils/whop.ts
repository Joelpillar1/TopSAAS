import { supabase } from './supabase';

export type PlanType = '1mo' | '3mo' | '1yr' | '7days' | '30days';

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
 * Normalizes plan key ('1mo', '3mo', '1yr')
 */
function normalizePlanKey(planType: PlanType): '1mo' | '3mo' | '1yr' {
  if (planType === '3mo') return '3mo';
  if (planType === '1yr') return '1yr';
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

  // 3. Fallback to Vite env variables if provided
  const envUrl =
    planKey === '3mo'
      ? import.meta.env.VITE_WHOP_LINK_3MO
      : planKey === '1yr'
      ? import.meta.env.VITE_WHOP_LINK_1YR
      : import.meta.env.VITE_WHOP_LINK_1MO;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim();
  }

  return null;
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
  const baseLink = dbUrl || 'https://whop.com/topsaas/1-month-sponsor/';

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
