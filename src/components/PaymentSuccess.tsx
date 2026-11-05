import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft, Crown, ExternalLink } from 'lucide-react';
import { playSound } from '../utils/sound';
import { setGlobalFeaturedProduct, insertProductDirect } from '../utils/db';

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

    // Restore any newly created sponsor app from local storage
    const pendingNewProdJson = localStorage.getItem('topsaas_featured_pending_new_product');
    if (pendingNewProdJson) {
      try {
        const parsed = JSON.parse(pendingNewProdJson);
        insertProductDirect(parsed);
      } catch (err) {
        console.warn('Error saving pending new product on payment success:', err);
      }
      localStorage.removeItem('topsaas_featured_pending_new_product');
    }

    // After successful payment, activate the pending featured product globally in Supabase
    const pendingProductId = targetProductId || localStorage.getItem('topsaas_featured_pending');
    const pendingPlan = planParam || localStorage.getItem('topsaas_featured_pending_plan');
    if (pendingProductId) {
      let durationDays = 30;
      if (pendingPlan === '3mo') durationDays = 90;
      else if (pendingPlan === '1yr') durationDays = 365;
      else if (pendingPlan === '7days') durationDays = 7;

      setGlobalFeaturedProduct(pendingProductId, durationDays);
      localStorage.removeItem('topsaas_featured_pending');
      localStorage.removeItem('topsaas_featured_pending_plan');
      onActivateFeatured?.(pendingProductId);
    }
  }, []);

  const planInfo = (() => {
    const p = params.plan;
    if (p === '1mo' || p === '30days') return { name: '1-Month Sponsor', price: '$29' };
    if (p === '3mo') return { name: '3-Month Sponsor', price: '$69' };
    if (p === '1yr') return { name: '1-Year Partner Sponsor', price: '$199' };
    if (p === '7days') return { name: '7-Day Sponsor', price: '$59' };
    return { name: 'Sponsorship Spotlight', price: 'Paid' };
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
            Payment Successful!
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            Your sponsorship has been activated. You&apos;re now prominently featured on TopSAAS!
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
                <span>The verified sponsor badge is now active on your listing</span>
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
