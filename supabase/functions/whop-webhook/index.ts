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
      const rawPlanType = String(metadata.plan_type || customFields.plan_type || '').toLowerCase();
      const planId = String(data.plan_id || '');

      const isVerifiedLaunch =
        rawPlanType === 'onetime' ||
        rawPlanType === 'verified_launch' ||
        rawPlanType === 'per_product_pass' ||
        planId === 'plan_B4wY8ei9eab1S';

      const isWeeklyRelaunch =
        rawPlanType === 'weekly_relaunch' ||
        rawPlanType === 'relaunch' ||
        planId === 'plan_81SmEHd2w16EG';

      const isFeatured =
        rawPlanType.startsWith('featured') ||
        planId === 'plan_YGXtgHZnspc77' ||
        planId === 'plan_GBN00B27YgYdx';

      let durationDays = 30;
      if (
        rawPlanType.includes('1wk') ||
        rawPlanType.includes('7days') ||
        rawPlanType.includes('weekly') ||
        planId === 'plan_Ux5pdAxT3WN7D' ||
        planId === 'plan_YGXtgHZnspc77'
      ) {
        durationDays = 7;
      } else if (rawPlanType === '3mo' || planId.includes('3mo') || planId === 'plan_SMad32AkVoMeu') {
        durationDays = 90;
      } else if (rawPlanType === '1yr' || planId.includes('1yr') || planId === 'plan_2uumEoGYQUKtb') {
        durationDays = 365;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

      // Handle Verified Launch ($19 Fast-Track)
      if (isVerifiedLaunch) {
        if (targetProductId) {
          await supabase.from('submissions').update({ verified: true }).eq('id', targetProductId);
          await supabase.from('products').update({ verified: true }).eq('id', targetProductId);
        }
        if (productName) {
          await supabase.from('submissions').update({ verified: true }).ilike('name', productName);
          await supabase.from('products').update({ verified: true }).ilike('name', productName);
        }
        console.log(`Successfully verified submission for product: ${productName || targetProductId}`);
      }

      // Handle Weekly Relaunch ($5)
      if (isWeeklyRelaunch) {
        const relaunchPayload = {
          auto_relaunch: true,
          auto_relaunch_paid: true,
          auto_relaunch_paid_at: now.getTime(),
          is_relaunched: true,
          last_relaunched_at: now.getTime(),
        };
        if (targetProductId) {
          await supabase.from('submissions').update(relaunchPayload).eq('id', targetProductId);
        }
        if (productName) {
          await supabase.from('submissions').update(relaunchPayload).ilike('name', productName);
        }
        console.log(`Successfully scheduled weekly relaunch for product: ${productName || targetProductId}`);
      }

      // 1. Locate product record
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

      const finalProductId = productRecord?.id || targetProductId;

      // Handle Featured Spot (Pinned top banner)
      if (isFeatured && finalProductId) {
        try {
          const { data: settingRow } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'featured_products')
            .maybeSingle();

          let currentFeatured: string[] = [];
          if (settingRow?.value) {
            try {
              currentFeatured = JSON.parse(settingRow.value);
            } catch {}
          }
          if (!Array.isArray(currentFeatured)) currentFeatured = [];
          if (!currentFeatured.includes(finalProductId)) {
            currentFeatured.unshift(finalProductId);
          }

          await supabase.from('site_settings').upsert([
            {
              key: 'featured_products',
              value: JSON.stringify(currentFeatured),
              description: 'Active pinned featured products list',
              updated_at: now.toISOString(),
            },
            {
              key: 'featured_product',
              value: finalProductId,
              description: 'Primary pinned featured product',
              updated_at: now.toISOString(),
            },
            {
              key: 'featured_expiry',
              value: expiresAt.getTime().toString(),
              description: 'Expiry timestamp for pinned featured spot',
              updated_at: now.toISOString(),
            },
          ]);
          console.log(`Successfully activated featured banner for product ${finalProductId} for ${durationDays} days`);
        } catch (featErr) {
          console.error('Error activating featured spot in site_settings:', featErr);
        }
      }

      // Handle Sponsor Spot (Sidebar rails)
      if (!isVerifiedLaunch && !isWeeklyRelaunch && !isFeatured && productRecord) {
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

        // Also add to site_settings 'active_sponsors'
        try {
          const { data: sponsorsRow } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'active_sponsors')
            .maybeSingle();

          let sponsorsList: any[] = [];
          if (sponsorsRow?.value) {
            try {
              sponsorsList = JSON.parse(sponsorsRow.value);
            } catch {}
          }
          if (!Array.isArray(sponsorsList)) sponsorsList = [];

          const existingIdx = sponsorsList.findIndex((s) => s.productId === productRecord.id);
          const sponsorEntry = {
            productId: productRecord.id,
            productName: productRecord.name,
            tier: durationDays >= 365 ? '1yr' : durationDays >= 90 ? '3mo' : durationDays === 7 ? 'trial' : '1mo',
            startedAt: now.getTime(),
            expiresAt: expiresAt.getTime(),
            customerEmail: email || undefined,
          };

          if (existingIdx >= 0) {
            sponsorsList[existingIdx] = sponsorEntry;
          } else {
            sponsorsList.push(sponsorEntry);
          }

          await supabase.from('site_settings').upsert({
            key: 'active_sponsors',
            value: JSON.stringify(sponsorsList),
            description: 'List of currently active sponsors',
            updated_at: now.toISOString(),
          });
        } catch (sponErr) {
          console.warn('Could not update active_sponsors in site_settings:', sponErr);
        }
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

