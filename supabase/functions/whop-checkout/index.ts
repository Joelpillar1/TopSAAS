import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CheckoutRequestBody {
  plan_type: '1mo' | '3mo' | '1yr' | '7days' | '30days';
  product_name: string;
  target_product_id?: string;
  customer_email?: string;
  return_url?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CheckoutRequestBody = await req.json();
    const { plan_type, product_name, target_product_id, customer_email, return_url } = body;

    if (!plan_type) {
      return new Response(
        JSON.stringify({ error: 'plan_type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Attempt to load settings from whop_payments_config table
    const { data: configRows } = await supabase
      .from('whop_payments_config')
      .select('key, value');

    const config: Record<string, string> = {};
    if (configRows) {
      for (const row of configRows) {
        if (row.key && row.value) config[row.key] = row.value;
      }
    }

    const apiKey = config['api_key'] || Deno.env.get('WHOP_API_KEY') || '';
    
    // Check for explicit custom checkout URLs or plan IDs
    const planKey = plan_type === '3mo' ? '3mo' : plan_type === '1yr' ? '1yr' : '1mo';
    const customCheckoutUrl =
      config[`checkout_url_${planKey}`] ||
      Deno.env.get(`WHOP_CHECKOUT_${planKey.toUpperCase()}`) ||
      (planKey === '3mo'
        ? 'https://whop.com/checkout/plan_SMad32AkVoMeu'
        : planKey === '1yr'
        ? 'https://whop.com/checkout/plan_2uumEoGYQUKtb'
        : 'https://whop.com/checkout/plan_VHCOSyqWd9l9Q');

    const planId =
      config[`plan_${planKey}_id`] ||
      Deno.env.get(`WHOP_PLAN_${planKey.toUpperCase()}`) ||
      (planKey === '3mo'
        ? 'plan_SMad32AkVoMeu'
        : planKey === '1yr'
        ? 'plan_2uumEoGYQUKtb'
        : 'plan_VHCOSyqWd9l9Q');

    const redirectTarget = return_url || `https://topsaas.space/payment-success?plan=${plan_type}&product=${encodeURIComponent(product_name || '')}`;

    // 1. If explicit checkout URL is provided in config or env
    if (customCheckoutUrl) {
      const parsed = new URL(customCheckoutUrl);
      parsed.searchParams.set('redirect_url', redirectTarget);
      if (customer_email) parsed.searchParams.set('email', customer_email);
      if (target_product_id) parsed.searchParams.set('metadata[product_id]', target_product_id);
      if (product_name) parsed.searchParams.set('metadata[product_name]', product_name);

      return new Response(
        JSON.stringify({ checkout_url: parsed.toString() }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. If Whop API key is present and we can create a checkout session or resolve plan checkout
    if (apiKey && planId) {
      try {
        // Whop API v5 Checkout Sessions endpoint
        const apiRes = await fetch('https://api.whop.com/api/v5/checkout_sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            plan_id: planId,
            redirect_url: redirectTarget,
            metadata: {
              target_product_id: target_product_id || '',
              product_name: product_name || '',
              plan_type: plan_type,
            },
            ...(customer_email ? { email: customer_email } : {}),
          }),
        });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          const checkoutUrl = apiData.url || apiData.checkout_url;
          if (checkoutUrl) {
            return new Response(
              JSON.stringify({ checkout_url: checkoutUrl, session_id: apiData.id }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } else {
          console.warn('Whop API checkout session creation status:', apiRes.status, await apiRes.text());
        }
      } catch (apiErr) {
        console.warn('Whop API session request failed, falling back to direct URL:', apiErr);
      }
    }

    // 3. Fallback to standard Whop direct checkout link format: https://whop.com/checkout/:plan_id
    const resolvedPlanId = planId || `plan_topsaas_${planKey}`;
    const directUrl = new URL(`https://whop.com/checkout/${resolvedPlanId}`);
    directUrl.searchParams.set('redirect_url', redirectTarget);
    if (customer_email) directUrl.searchParams.set('email', customer_email);

    return new Response(
      JSON.stringify({ checkout_url: directUrl.toString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    console.error('whop-checkout error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

