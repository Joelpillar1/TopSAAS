import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft, Crown, ExternalLink } from 'lucide-react';
import { playSound } from '../utils/sound';
import { setGlobalFeaturedProduct, insertProductDirect, createSponsor, loadProductById } from '../utils/db';
import { SponsorDraft } from '../types';
import { supabase } from '../utils/supabase';

interface PaymentSuccessProps {
  onBackToDirectory: () => void;
  soundEnabled: boolean;
  onActivateFeatured?: (productId: string) => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  onBackToDirectory,
  soundEnabled,
  onActivateFeatured,
}) => {
  const [params, setParams] = useState<{
    plan: string | null;
    product: string | null;
    paymentId: string | null;
    status: string | null;
  }>({ plan: null, product: null, paymentId: null, status: null });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const planParam = searchParams.get('plan');
    const productParam = searchParams.get('product');
    const paymentIdParam =
      searchParams.get('payment_id') ||
      searchParams.get('checkout_id') ||
      searchParams.get('id');
    const statusParam = searchParams.get('status') || 'succeeded';
    const targetProductId = searchParams.get('target_product_id');

    setParams({
      plan: planParam,
      product: productParam,
      paymentId: paymentIdParam,
      status: statusParam,
    });
    playSound('success', soundEnabled);
    try {
      window.trackkit?.('goal', 'payment_success', {
        plan: planParam || undefined,
        product: productParam || undefined,
      });
    } catch {}

    // Commit any verified launch from SubmitPage upon return from successful Whop checkout
    try {
      const pendingPaidSub = localStorage.getItem('topsaas_pending_paid_submission');
      const finalProductId = targetProductId || (pendingPaidSub ? JSON.parse(pendingPaidSub).id : null);
      if (finalProductId) {
        supabase.from('submissions').update({ verified: true }).eq('id', finalProductId).then(() => {});
        localStorage.removeItem('topsaas_pending_paid_submission');
        localStorage.removeItem('topsaas_launch_draft_v1');
        localStorage.removeItem('topsaas_launch_step_v1');
      }
    } catch (e) {
      console.warn('Error confirming verified launch status:', e);
    }

    // Restore a paid sponsor from local storage. The webhook and this return
    // page both upsert the same sponsor id, so one payment creates one row.
    const pendingSponsorJson = localStorage.getItem('topsaas_pending_sponsor');
    if (pendingSponsorJson) {
      try {
        const draft = JSON.parse(pendingSponsorJson) as SponsorDraft;
        createSponsor({
          ...draft,
          whopPaymentId: paymentIdParam || draft.whopPaymentId,
          planType: planParam || draft.planType,
          source: 'whop',
        });
      } catch (err) {
        console.warn('Error saving pending sponsor on payment success:', err);
      }
      localStorage.removeItem('topsaas_pending_sponsor');
    }

    // Restore a newly created featured listing from local storage.
    const pendingNewProdJson = localStorage.getItem('topsaas_featured_pending_new_product');
    if (pendingNewProdJson) {
      try {
        const parsed = JSON.parse(pendingNewProdJson);
        parsed.isSponsorOnly = false;
        parsed.isSponsored = false;
        insertProductDirect(parsed);
      } catch (err) {
        console.warn('Error saving pending new product on payment success:', err);
      }
      localStorage.removeItem('topsaas_featured_pending_new_product');
      localStorage.removeItem('topsaas_featured_pending_new_product_days');
    }

    // Immediate local activation for weekly relaunch
    if (planParam === 'weekly_relaunch' && targetProductId) {
      const nowMs = Date.now();
      const relaunchPayload = {
        auto_relaunch: true,
        auto_relaunch_paid: true,
        auto_relaunch_paid_at: nowMs,
        is_relaunched: true,
        last_relaunched_at: nowMs,
      };
      supabase.from('products').update(relaunchPayload).eq('id', targetProductId).then(() => {});
      supabase.from('submissions').update(relaunchPayload).eq('id', targetProductId).then(() => {});
    }

    // After successful payment, activate a pending featured product globally.
    const pendingProductId = targetProductId || localStorage.getItem('topsaas_featured_pending');
    const pendingPlan = planParam || localStorage.getItem('topsaas_featured_pending_plan');
    if (pendingProductId) {
      let durationDays = 30;
      if (pendingPlan === '3mo') durationDays = 90;
      else if (pendingPlan === '1yr') durationDays = 365;
      else if (pendingPlan === '7days' || pendingPlan === 'sponsor_1wk' || pendingPlan === 'featured_1wk') durationDays = 7;

      const isSponsorPlan = pendingPlan?.startsWith('sponsor') || pendingPlan === '3mo' || pendingPlan === '1yr';
      if (isSponsorPlan && !pendingSponsorJson) {
        // Fallback for a direct checkout link with no staged sponsor. Build the
        // sponsor from the linked product snapshot instead of writing products.
        loadProductById(pendingProductId).then((product) => {
          if (!product) return;
          const tier = pendingPlan === '3mo' ? '3mo' : pendingPlan === '1yr' ? '1yr' : 'paid';
          const expiresAt = Date.now() + durationDays * 86400 * 1000;
          createSponsor({
            productId: product.id,
            name: product.name,
            tagline: product.tagline,
            url: product.url,
            logoUrl: product.logoUrl,
            category: product.category,
            contactEmail: product.sponsorContactEmail,
            tier,
            status: 'active',
            startedAt: Date.now(),
            expiresAt,
            source: 'whop',
            whopPaymentId: paymentIdParam || undefined,
            planType: pendingPlan || undefined,
          });
        }).catch((err) => console.warn('Could not create fallback sponsor:', err));
      } else if (!isSponsorPlan) {
        setGlobalFeaturedProduct(pendingProductId, durationDays);
        onActivateFeatured?.(pendingProductId);
      }

      localStorage.removeItem('topsaas_featured_pending');
      localStorage.removeItem('topsaas_featured_pending_plan');
    }
  }, []);

  const planInfo = (() => {
    const p = params.plan;
    if (p === 'onetime' || p === 'verified_launch' || p === 'per_product_pass') {
      return { name: 'Fast-Track Launch ($5)', price: '$5' };
    }
    if (p === 'weekly_relaunch') {
      return { name: 'Auto Weekly Relaunch', price: '$5/week' };
    }
    if (p === 'featured_1wk' || p === 'featured1wk') return { name: '1-Week Featured Spot', price: '$15/week' };
    if (p === 'featured_1mo' || p === 'featured1mo') return { name: '1-Month Featured Spot', price: '$39/month' };
    if (p === 'sponsor_1wk' || p === 'sponsor1wk') return { name: '1-Week Sidebar Sponsor', price: '$10/week' };
    if (p === 'sponsor_1mo' || p === 'sponsor1mo' || p === '1mo' || p === '30days') return { name: '1-Month Sponsor', price: '$29/month' };
    if (p === '3mo') return { name: '3-Month Sponsor', price: '$69' };
    if (p === '1yr') return { name: '1-Year Partner Sponsor', price: '$199' };
    if (p === '7days') return { name: '7-Day Sponsor', price: '$10' };
    return { name: 'Launch & Spotlight Pass', price: 'Paid' };
  })();

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-lg text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-black text-neutral-950 tracking-tight mb-2">
            {params.plan === 'onetime' || params.plan === 'verified_launch' || params.plan === 'per_product_pass'
              ? 'Launch Fast-Track Confirmed!'
              : 'Payment Successful!'}
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            {params.plan === 'onetime' || params.plan === 'verified_launch' || params.plan === 'per_product_pass'
              ? 'Your $5 Verified Launch has been activated. Your product is prioritized for 24-hour review with an official verified badge and permanent DoFollow SEO backlink!'
              : 'Your sponsorship has been activated. You are now prominently featured on TopSAAS!'}
          </p>

          {/* Order Details */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-neutral-950">Order Details</span>
            </div>
            <div className="space-y-2">
              {params.product && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Product</span>
                  <span className="font-bold text-neutral-950">{decodeURIComponent(params.product)}</span>
                </div>
              )}
              {planInfo.name && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Plan</span>
                  <span className="font-bold text-neutral-950">{planInfo.name}</span>
                </div>
              )}
              {planInfo.price && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Amount Paid</span>
                  <span className="font-bold text-neutral-950 font-mono-num">{planInfo.price}</span>
                </div>
              )}
              {params.paymentId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Payment ID</span>
                  <span className="font-mono text-[10px] text-neutral-600">{params.paymentId}</span>
                </div>
              )}
              {params.status && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    {params.status === 'succeeded' ? 'Succeeded' : params.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-6 text-left">
            <h3 className="text-xs font-bold text-neutral-950 mb-2">What happens next?</h3>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="font-bold text-neutral-950">1.</span>
                <span>Your product is now featured on the top rails and partner directory</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="font-bold text-neutral-950">2.</span>
                <span>The Golden Verified Sponsor badge is now active on your partner cards</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="font-bold text-neutral-950">3.</span>
                <span>Direct click tracking and priority placement are fully active</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onBackToDirectory();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-950 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                playSound('click', soundEnabled);
                onBackToDirectory();
              }}
              className="text-xs text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
            >
              or go to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
