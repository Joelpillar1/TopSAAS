// DodoPayments Integration
// Docs: https://docs.dodopayments.com/developer-resources/integration-guide
// Checkout is handled server-side via Supabase Edge Function (dodo-checkout)

import { supabase } from './supabase';

export type PlanType = '7days' | '30days';

/**
 * Get product IDs from the config table (for display/validation only — no secrets exposed)
 */
export async function getProductIds(): Promise<{ product7days: string; product30days: string }> {
  const { data, error } = await supabase
    .from('dodo_payments_config')
    .select('key, value');

  if (error) {
    console.error('Failed to fetch DodoPayments config:', error);
    throw new Error('Failed to load payment configuration');
  }

  const configRecord: Record<string, string> = {};
  if (data) {
    data.forEach((item) => {
      configRecord[item.key] = item.value;
    });
  }

  return {
    product7days: configRecord.product_7days || '',
    product30days: configRecord.product_30days || '',
  };
}

/**
 * Get product ID for a plan
 */
export async function getProductId(plan: PlanType): Promise<string> {
  const ids = await getProductIds();
  const productId = plan === '7days' ? ids.product7days : ids.product30days;

  if (!productId) {
    throw new Error(`Product not configured for ${plan} plan. Please add the product ID in the admin panel.`);
  }

  return productId;
}

interface CheckoutSessionParams {
  planType: PlanType;
  productName: string;
  customerEmail?: string;
  customerName?: string;
}

interface CheckoutSessionResponse {
  checkout_url: string;
  checkout_session_id: string;
}

/**
 * Create a DodoPayments checkout session via Edge Function (keeps API key server-side)
 */
export async function createCheckoutSession({
  planType,
  productName,
  customerEmail,
  customerName,
}: CheckoutSessionParams): Promise<CheckoutSessionResponse> {
  const { data, error } = await supabase.functions.invoke('dodo-checkout', {
    body: {
      planType,
      productName,
      customerEmail,
      customerName,
    },
  });

  if (error) {
    console.error('Edge function error:', error);
    throw new Error(error.message || 'Payment session creation failed');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    checkout_url: data.checkout_url,
    checkout_session_id: data.checkout_session_id,
  };
}

/**
 * Redirect to DodoPayments checkout
 */
export async function redirectToCheckout(params: CheckoutSessionParams): Promise<void> {
  const { checkout_url } = await createCheckoutSession(params);
  window.location.href = checkout_url;
}
