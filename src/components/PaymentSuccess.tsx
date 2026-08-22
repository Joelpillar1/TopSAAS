import React, { useEffect, useState } from 'react';
import { CheckCircle, ArrowLeft, Crown, ExternalLink } from 'lucide-react';
import { playSound } from '../utils/sound';

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
    setParams({
      plan: searchParams.get('plan'),
      product: searchParams.get('product'),
      paymentId: searchParams.get('payment_id'),
      status: searchParams.get('status'),
    });
    playSound('success', soundEnabled);

    // After successful payment, activate the pending featured product with expiry
    const pendingProductId = localStorage.getItem('topsaas_featured_pending');
    const pendingPlan = localStorage.getItem('topsaas_featured_pending_plan');
    if (pendingProductId) {
      const durationDays = pendingPlan === '30days' ? 30 : 7;
      const expiresAt = Date.now() + durationDays * 86400000;
      localStorage.setItem('topsaas_featured_product', pendingProductId);
      localStorage.setItem('topsaas_featured_expiry', expiresAt.toString());
      localStorage.removeItem('topsaas_featured_pending');
      localStorage.removeItem('topsaas_featured_pending_plan');
      onActivateFeatured?.(pendingProductId);
    }
  }, []);

  const planName = '30 Days';
  const price = '$999';

  return (
    <div className="min-h-screen bg-neutral-50 text-black flex items-center justify-center font-sans px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-lg text-center">
          {/* Success Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-black text-black tracking-tight mb-2">
            Payment Successful!
          </h1>
          <p className="text-sm text-neutral-600 mb-6">
            Your featured spot has been purchased. You&apos;re now at the top of the directory!
          </p>

          {/* Order Details */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-4 w-4 text-black" />
              <span className="text-xs font-bold text-black">Order Details</span>
            </div>
            <div className="space-y-2">
              {params.product && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Product</span>
                  <span className="font-bold text-black">{decodeURIComponent(params.product)}</span>
                </div>
              )}
              {planName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Plan</span>
                  <span className="font-bold text-black">{planName}</span>
                </div>
              )}
              {price && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Amount Paid</span>
                  <span className="font-bold text-black font-mono-num">{price}</span>
                </div>
              )}
              {params.paymentId && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Payment ID</span>
                  <span className="font-mono text-[10px] text-neutral-500">{params.paymentId}</span>
                </div>
              )}
              {params.status && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Status</span>
                  <span className="inline-flex items-center gap-1 text-black font-bold">
                    <CheckCircle className="h-3 w-3 text-black" />
                    {params.status === 'succeeded' ? 'Succeeded' : params.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-6 text-left">
            <h3 className="text-xs font-bold text-black mb-2">What happens next?</h3>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="font-bold text-black">1.</span>
                <span>Your product is now featured at the top of the directory</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="font-bold text-black">2.</span>
                <span>The border beam animation is now active on your listing</span>
              </li>
              <li className="flex items-start gap-2 text-xs text-neutral-600">
                <span className="font-bold text-black">3.</span>
                <span>You&apos;ll receive analytics access via email shortly</span>
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
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 px-4 text-sm font-black text-white shadow-2xs hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                playSound('click', soundEnabled);
                onBackToDirectory();
              }}
              className="text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer"
            >
              or go to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
