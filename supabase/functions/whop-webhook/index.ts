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
          await supabase.from('products').update(relaunchPayload).eq('id', targetProductId);
        }
        if (productName) {
          await supabase.from('submissions').update(relaunchPayload).ilike('name', productName);
          await supabase.from('products').update(relaunchPayload).ilike('name', productName);
        }
        console.log(`Successfully scheduled weekly relaunch for product: ${productName || targetProductId}`);
      }

      // 1. Locate product record for product-based placements.
      let productRecord = null;
      if (targetProductId) {
        const { data: p } = await supabase
          .from('products')
          .select('id, name, tagline, url, logo_url, category')
          .eq('id', targetProductId)
          .maybeSingle();
        productRecord = p;
      }

      if (!productRecord && productName) {
        const { data: p } = await supabase
          .from('products')
          .select('id, name, tagline, url, logo_url, category')
          .ilike('name', productName)
          .maybeSingle();
        productRecord = p;
      }

      const finalProductId = productRecord?.id || targetProductId;

      // Handle Featured Spot (Pinned top banner)
      if (isFeatured && finalProductId) {
        try {
          const { data: settingRows } = await supabase
            .from('site_settings')
            .select('key, value')
            .in('key', ['featured_products', 'featured_product_ids']);

          const settingRow = settingRows?.find((r: any) => r.key === 'featured_product_ids') || settingRows?.find((r: any) => r.key === 'featured_products');

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

          const expiryTimestamp = expiresAt.getTime().toString();
          await supabase.from('site_settings').upsert([
            {
              key: 'featured_products',
              value: JSON.stringify(currentFeatured),
              description: 'Active pinned featured products list',
              updated_at: now.toISOString(),
            },
            {
              key: 'featured_product_ids',
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
              key: 'featured_product_id',
              value: finalProductId,
              description: 'Primary pinned featured product',
              updated_at: now.toISOString(),
            },
            {
              key: 'featured_expiry',
              value: expiryTimestamp,
              description: 'Expiry timestamp for pinned featured spot',
              updated_at: now.toISOString(),
            },
            {
              key: 'featured_expires_at',
              value: expiryTimestamp,
              description: 'Expiry timestamp for pinned featured spot',
              updated_at: now.toISOString(),
            },
          ]);
          console.log(`Successfully activated featured banner for product ${finalProductId} for ${durationDays} days`);
        } catch (featErr) {
          console.error('Error activating featured spot in site_settings:', featErr);
        }
      }

      // Handle Sponsor Spot (sidebar rails). Sponsors live in their own table;
      // they are never written into the products directory.
      const isSponsorPlan = !isVerifiedLaunch && !isWeeklyRelaunch && !isFeatured;
      if (isSponsorPlan) {
        const nowMs = now.getTime();
        const expiresMs = expiresAt.getTime();
        const sponsorId =
          metadata.sponsor_id ||
          customFields.sponsor_id ||
          `spn_${data.id || nowMs}`;
        const sponsorName =
          metadata.sponsor_name ||
          customFields.sponsor_name ||
          productRecord?.name ||
          productName ||
          'Sponsor';
        const sponsorUrl =
          metadata.sponsor_url ||
          customFields.sponsor_url ||
          productRecord?.url ||
          '';
        const sponsorLogo =
          metadata.sponsor_logo ||
          customFields.sponsor_logo ||
          productRecord?.logo_url ||
          null;
        const sponsorTagline =
          metadata.sponsor_tagline ||
          customFields.sponsor_tagline ||
          productRecord?.tagline ||
          '';
        const sponsorCategory =
          metadata.sponsor_category ||
          customFields.sponsor_category ||
          productRecord?.category ||
          'SaaS';
        const sponsorProductId =
          metadata.sponsor_product_id ||
          customFields.sponsor_product_id ||
          finalProductId ||
          null;
        const sponsorEmail =
          metadata.sponsor_email ||
          customFields.sponsor_email ||
          email ||
          null;
        const tier = rawPlanType.includes('trial')
          ? 'trial'
          : durationDays >= 365
            ? '1yr'
            : durationDays >= 90
              ? '3mo'
              : durationDays === 7
                ? 'paid'
                : '1mo';

        const { data: existingSponsor } = await supabase
          .from('sponsors')
          .select('clicks, created_at')
          .eq('id', sponsorId)
          .maybeSingle();

        const { error: sponsorErr } = await supabase
          .from('sponsors')
          .upsert(
            {
              id: sponsorId,
              product_id: sponsorProductId,
              name: sponsorName,
              tagline: sponsorTagline,
              url: sponsorUrl,
              logo_url: sponsorLogo,
              category: sponsorCategory,
              contact_email: sponsorEmail,
              tier,
              status: 'active',
              started_at: nowMs,
              expires_at: expiresMs,
              paused_remaining_ms: null,
              clicks: existingSponsor?.clicks ?? 0,
              source: 'whop',
              whop_payment_id: data.id || null,
              plan_type: rawPlanType || null,
              created_at: existingSponsor?.created_at ?? nowMs,
              updated_at: nowMs,
            },
            { onConflict: 'id' }
          );

        if (sponsorErr) {
          console.error('Error writing sponsor:', sponsorErr);
        } else {
          console.log(`Successfully activated sponsor ${sponsorId} for ${durationDays} days`);
        }
      }

      // Record transaction if sponsor_orders exists
      try {
        await supabase.from('sponsor_orders').insert({
          provider: 'whop',
          event_action: action,
          whop_payment_id: data.id || null,
          customer_email: email,
          plan_type: rawPlanType,
          duration_days: durationDays,
          product_id: productRecord?.id || targetProductId || null,
          payload: body,
        });
      } catch (logErr) {
        console.warn('Could not write to sponsor_orders (optional):', logErr);
      }

      // Send payment confirmation email via send-email Edge Function
      if (email && supabaseUrl && supabaseServiceKey) {
        const planLabel = isVerifiedLaunch
          ? 'Verified Launch ($19)'
          : isWeeklyRelaunch
            ? 'Auto Weekly Relaunch ($5/week)'
            : isFeatured
              ? `Featured Spot (${durationDays} days)`
              : `Sidebar Sponsor (${durationDays} days)`;
        const displayName = productRecord?.name || productName || 'Your product';
        const paymentKey = data.id || `${finalProductId || displayName}-${rawPlanType}-${now.toISOString().slice(0, 10)}`;

        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'payment_receipt',
              to: email,
              idempotencyKey: `payment_receipt:${paymentKey}`,
              data: {
                planName: planLabel,
                productName: displayName,
                durationDays: isVerifiedLaunch ? 0 : durationDays,
              },
            }),
          });
        } catch (emailErr) {
          console.warn('Could not trigger payment_receipt email:', emailErr);
        }
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

