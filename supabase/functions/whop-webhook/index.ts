import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-signature',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rawPayload = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawPayload);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const action = body.action || body.event || '';
    const data = body.data || body;
    console.log(`Received Whop webhook event: ${action}`, JSON.stringify(data));

    // Handle payment.succeeded or membership.went_valid
    const isPaymentSuccess =
      action === 'payment.succeeded' ||
      action === 'membership.went_valid' ||
      action === 'membership.created';

    if (isPaymentSuccess) {
      const metadata = data.metadata || {};
      const customFields = data.custom_fields || {};
      const email = data.email || data.user?.email || metadata.customer_email || null;
      const targetProductId = metadata.target_product_id || customFields.target_product_id;
      const productName = metadata.product_name || customFields.product_name;
      const planType = metadata.plan_type || '1mo';

      let durationDays = 30;
      if (planType === '3mo' || (data.plan_id && data.plan_id.includes('3mo'))) {
        durationDays = 90;
      } else if (planType === '1yr' || (data.plan_id && data.plan_id.includes('1yr'))) {
        durationDays = 365;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // 1. Locate product to sponsor
      let productRecord = null;
      if (targetProductId) {
        const { data: p } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', targetProductId)
          .maybeSingle();
        productRecord = p;
      }

      if (!productRecord && productName) {
        const { data: p } = await supabase
          .from('products')
          .select('id, name')
          .ilike('name', productName)
          .maybeSingle();
        productRecord = p;
      }

      if (productRecord) {
        const { error: updateErr } = await supabase
          .from('products')
          .update({
            is_sponsored: true,
            sponsor_tier: 'paid',
            sponsor_started_at: now.toISOString(),
            sponsor_expires_at: expiresAt.toISOString(),
            sponsor_email: email,
          })
          .eq('id', productRecord.id);

        if (updateErr) {
          console.error(`Error updating product sponsorship:`, updateErr);
        } else {
          console.log(`Successfully activated sponsorship for product ${productRecord.name} (${productRecord.id}) for ${durationDays} days`);
        }
      } else {
        console.warn(`Product not found for sponsorship (targetProductId: ${targetProductId}, productName: ${productName})`);
      }

      // Record transaction if sponsor_orders exists
      try {
        await supabase.from('sponsor_orders').insert({
          provider: 'whop',
          event_action: action,
          whop_payment_id: data.id || null,
          customer_email: email,
          plan_type: planType,
          duration_days: durationDays,
          product_id: productRecord?.id || targetProductId || null,
          payload: body,
        });
      } catch (logErr) {
        console.warn('Could not write to sponsor_orders (optional):', logErr);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    console.error('whop-webhook processing error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

