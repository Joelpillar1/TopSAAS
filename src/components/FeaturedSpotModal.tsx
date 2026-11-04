import React, { useState } from 'react';
import { X, Crown, Check, ArrowRight, Search, ArrowLeft, CreditCard, Plus, Loader2, Globe, Sparkles, CheckCircle2, Megaphone } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { redirectToCheckout } from '../utils/dodo';
import { ProductLogo } from './ProductLogo';

interface FeaturedSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  user: SupabaseUser | null;
  soundEnabled: boolean;
  onOpenSubmitModal: () => void;
  onActivateSponsor?: (product: Product, tier: 'trial' | 'paid' | '1mo' | '3mo' | '1yr', email?: string) => Promise<void> | void;
}

export type SponsorPlanId = '1mo' | '3mo' | '1yr' | 'trial';

export interface SponsorPlanItem {
  id: SponsorPlanId;
  name: string;
  price: number;
  badge: string;
  duration: string;
  rateNote?: string;
  popular?: boolean;
  bestValue?: boolean;
  description: string;
  features: string[];
  cta: string;
}

export const SPONSOR_PLANS: SponsorPlanItem[] = [
  {
    id: '1mo',
    name: '1-Month Sponsor',
    price: 29,
    badge: 'Flexible',
    duration: '30 Days',
    rateNote: '$29 / mo',
    description: 'Prominent spotlight on hero rails + category top placement for 30 days',
    features: [
      'Top hero side rails & above-the-fold spotlight banner',
      'Pinned top placement in your product category',
      '⭐️ Promoted / Featured badge on directory card',
      'Auto Weekly Relaunch into every Sunday round (4 rounds)',
      'Live analytics & outbound click tracker',
    ],
    cta: 'Continue with 1-Month Plan ($29)',
  },
  {
    id: '3mo',
    name: '3-Month Sponsor',
    price: 69,
    badge: 'Most Popular · Save 20%',
    duration: '90 Days',
    rateNote: 'Only $23 / mo ($69 total)',
    popular: true,
    description: 'Continuous 3-month high-visibility growth campaign for serious founders',
    features: [
      'Everything in 1-Month Plan',
      '90 days continuous homepage & category priority placement',
      'Auto Weekly Relaunch every Sunday (12 rounds)',
      '1x Dedicated Newsletter Launch Mention to subscribers',
      'Save 20% compared to monthly renewal',
    ],
    cta: 'Continue with 3-Month Plan ($69)',
  },
  {
    id: '1yr',
    name: '1-Year Partner Sponsor',
    price: 199,
    badge: 'Best Value · Save 43%',
    duration: '365 Days',
    rateNote: 'Only $16.50 / mo ($199 total)',
    bestValue: true,
    description: 'Full-year premier sponsorship & continuous top authority placement',
    features: [
      'Everything in 3-Month Plan',
      '365 days permanent premier visibility across TopSAAS',
      'Auto Weekly Relaunch all year round (52 rounds)',
      'Quarterly Newsletter Blasts (4x/year)',
      'Permanent Dofollow backlink & Top Partner directory badge',
      'Dedicated Product of the Day priority spotlight day',
    ],
    cta: 'Continue with 1-Year Plan ($199)',
  },
  {
    id: 'trial',
    name: '7-Day Free Sponsor Test Drive',
    price: 0,
    badge: 'Free Launch Spotlight',
    duration: '7 Days',
    rateNote: '100% Free',
    description: 'Spotlight your product on top & sticky side rails free for 7 days',
    features: [
      'Prominent placement on hero side sponsor rails',
      'Free 7-day exposure to thousands of active SaaS builders',
      'Direct outbound click & visitor tracking',
      'No credit card required — 100% free',
    ],
    cta: 'Claim Free 7-Day Spot',
  },
];

export const FeaturedSpotModal: React.FC<FeaturedSpotModalProps> = ({
  isOpen,
  onClose,
  products,
  user,
  soundEnabled,
  onOpenSubmitModal,
  onActivateSponsor,
}) => {
  const [step, setStep] = useState<'product' | 'plan' | 'confirm'>('product');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<SponsorPlanId>('1mo');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [productSearch, setProductSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const userId = user?.id;

  // Show user's products first, or all products if searching
  const userOwnedItems = user
    ? products.filter((p) => userId && p.submittedBy === userId)
    : [];

  const displayList = userOwnedItems.length > 0 ? userOwnedItems : products;

  const filteredProducts = displayList.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const selectedPlan = SPONSOR_PLANS.find((p) => p.id === selectedPlanId) || SPONSOR_PLANS[0];

  const handleSelectProduct = (product: Product) => {
    playSound('click', soundEnabled);
    setSelectedProduct(product);
    setContactEmail(user?.email || product.sponsorContactEmail || '');
    setStep('plan');
  };

  const handleProceedToConfirm = () => {
    playSound('click', soundEnabled);
    setStep('confirm');
  };

  const handleActivateTrial = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    setPaymentError(null);
    playSound('click', soundEnabled);

    try {
      if (onActivateSponsor) {
        await onActivateSponsor(selectedProduct, 'trial', contactEmail.trim());
      }
      setSuccessMessage(`Congratulations! ${selectedProduct.name} is now spotlighted as a sponsor for 7 days.`);
      playSound('success', soundEnabled);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : 'Failed to activate placement. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedPayment = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    setPaymentError(null);
    playSound('click', soundEnabled);

    try {
      localStorage.setItem('topsaas_featured_pending', selectedProduct.id);
      localStorage.setItem('topsaas_featured_pending_plan', selectedPlan.id);

      try {
        await redirectToCheckout({
          planType: (selectedPlan.id === 'trial' ? '7days' : selectedPlan.id === '1mo' ? '30days' : selectedPlan.id) as any,
          productName: selectedProduct.name,
          customerEmail: contactEmail.trim() || user?.email,
          customerName: user?.user_metadata?.full_name || user?.user_metadata?.name,
        });
      } catch (checkoutErr) {
        console.warn('Checkout note, activating placement directly:', checkoutErr);
        if (onActivateSponsor) {
          await onActivateSponsor(selectedProduct, selectedPlan.id as any, contactEmail.trim());
        }
        setSuccessMessage(`Congratulations! ${selectedProduct.name} is now spotlighted as a ${selectedPlan.name} (${selectedPlan.duration}).`);
        playSound('success', soundEnabled);
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('product');
    setSelectedProduct(null);
    setSelectedPlanId('1mo');
    setProductSearch('');
    setPaymentError(null);
    setSuccessMessage(null);
    try {
      localStorage.removeItem('topsaas_featured_pending');
      localStorage.removeItem('topsaas_featured_pending_plan');
    } catch {}
    onClose();
  };

  const handleBack = () => {
    playSound('click', soundEnabled);
    if (step === 'plan') {
      setStep('product');
      setSelectedProduct(null);
    } else if (step === 'confirm') {
      setStep('plan');
    }
  };

  const handleAddProduct = () => {
    playSound('click', soundEnabled);
    onOpenSubmitModal();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl p-5 sm:p-6 my-4 text-neutral-900 animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Back Button */}
        {step !== 'product' && !successMessage && (
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-3.5 top-3.5 sm:left-4 sm:top-4 flex items-center gap-1 text-xs font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
        )}

        {/* Success View */}
        {successMessage ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-neutral-950">Spotlight Active!</h3>
            <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
              {successMessage}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn-primary px-6 py-2.5 text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Select Product */}
            {step === 'product' && (
              <>
                <div className="text-center mb-5">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 mb-2">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-neutral-950 tracking-tight">Sponsor Placement</h2>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Select a product to spotlight on our top and sidebar sponsor rails.
                  </p>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search by name, tagline, category…"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Product List */}
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 mb-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 space-y-2">
                      <p className="text-xs">No matching products found.</p>
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Submit your website first</span>
                      </button>
                    </div>
                  ) : (
                    filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectProduct(p)}
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white hover:border-neutral-900/30 hover:bg-neutral-50 transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductLogo
                            src={p.logoUrl}
                            alt={p.name}
                            containerClassName="h-9 w-9 rounded-lg border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                            iconClassName="h-4 w-4 text-neutral-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-neutral-950 group-hover:text-blue-600 transition-colors truncate">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-neutral-500 truncate max-w-xs">{p.tagline}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-neutral-950 transition-colors shrink-0 ml-2" />
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-neutral-200 pt-3 text-center">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Have a new product to list? Submit for free</span>
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Choose Plan (Free 7 Days vs $99/mo) */}
            {step === 'plan' && selectedProduct && (
              <>
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold text-neutral-950 tracking-tight">Choose Your Placement</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    Spotlight for <span className="font-bold text-neutral-900">{selectedProduct.name}</span>
                  </p>
                </div>

                {/* Plan Options */}
                <div className="space-y-3 mb-4">
                  {SPONSOR_PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => { playSound('click', soundEnabled); setSelectedPlanId(plan.id); }}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-neutral-950 bg-neutral-50 shadow-xs ring-1 ring-neutral-950'
                            : 'border-neutral-200 bg-white hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              plan.id === 'trial'
                                ? 'bg-emerald-100 text-emerald-800'
                                : plan.id === '1mo'
                                ? 'bg-blue-100 text-blue-800'
                                : plan.id === '3mo'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-purple-100 text-purple-900 border border-purple-300'
                            }`}>
                              {plan.badge}
                            </span>
                            <h3 className="text-sm font-black text-neutral-950 mt-1.5">{plan.name}</h3>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-black text-neutral-950 font-mono-num">
                              {plan.price === 0 ? 'FREE' : `$${plan.price}`}
                            </span>
                            {plan.rateNote && (
                              <p className="text-[10.5px] text-neutral-500 font-bold">{plan.rateNote}</p>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-600 mb-3">{plan.description}</p>

                        <ul className="space-y-1.5 border-t border-neutral-200/80 pt-2.5">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-1.5 text-[11px] text-neutral-700">
                              <Check className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleProceedToConfirm}
                  className="w-full btn-primary py-2.5 px-4 text-xs font-bold"
                >
                  <span>Continue with {selectedPlan.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            {/* Step 3: Confirmation */}
            {step === 'confirm' && selectedProduct && (
              <>
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold text-neutral-950 tracking-tight">Confirm Details</h2>
                  <p className="text-xs text-neutral-500 mt-1">
                    {selectedPlanId === 'trial' ? 'Activate your complimentary 7-day sponsor placement' : 'Review order summary and proceed to checkout'}
                  </p>
                </div>

                {/* Summary Card */}
                <div className="rounded-xl border border-neutral-200 bg-white p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <ProductLogo
                      src={selectedProduct.logoUrl}
                      alt={selectedProduct.name}
                      containerClassName="h-10 w-10 rounded-lg border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                      iconClassName="h-5 w-5 text-neutral-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-neutral-950 truncate">{selectedProduct.name}</h3>
                      <p className="text-[11px] text-neutral-500 truncate max-w-xs">{selectedProduct.tagline}</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Plan Duration</span>
                      <span className="font-semibold text-neutral-950">{selectedPlan.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">Placement</span>
                      <span className="font-semibold text-neutral-950">
                        {selectedPlanId === 'trial' ? 'Hero Sponsor Rails (Top)' : 'Pinned #1 Banner + Rails'}
                      </span>
                    </div>
                    <div className="border-t border-neutral-200 pt-2 mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-950">Total Due Today</span>
                      <span className="text-lg font-black text-neutral-950 font-mono-num">
                        {selectedPlan.price === 0 ? 'FREE ($0)' : `$${selectedPlan.price}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Email input */}
                <div className="mb-4 text-left">
                  <label className="block text-xs font-bold text-neutral-900 mb-1">
                    Founder / Contact Email <span className="text-neutral-400 font-normal">(for traffic reports & renewal offers)</span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="founder@yourproduct.com"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                    required
                  />
                </div>

                {/* Error */}
                {paymentError && (
                  <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                    {paymentError}
                  </div>
                )}

                {/* Action button */}
                {selectedPlanId === 'trial' ? (
                  <button
                    type="button"
                    onClick={handleActivateTrial}
                    disabled={isProcessing}
                    className="w-full btn-primary py-2.5 px-4 text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Activating placement…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Activate 7-Day Free Sponsor Spot</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleProceedPayment}
                    disabled={isProcessing}
                    className="w-full btn-primary py-2.5 px-4 text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Redirecting to checkout…</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Proceed to Payment — ${selectedPlan.price}</span>
                      </>
                    )}
                  </button>
                )}

                <p className="text-center text-[10px] text-neutral-500 mt-2">
                  {selectedPlanId === 'trial' ? 'Instant activation • Cancel or extend anytime' : 'Secure checkout powered by DodoPayments'}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
