import React, { useState } from 'react';
import { X, Crown, Check, ArrowRight, Search, ArrowLeft, CreditCard, Plus, Loader2, Globe } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { getWebsiteFavicon } from '../utils/logo';
import { redirectToCheckout } from '../utils/dodo';
import { ProductLogo } from './ProductLogo';

interface FeaturedSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  user: SupabaseUser | null;
  soundEnabled: boolean;
  onOpenSubmitModal: () => void;
}

const FEATURED_PLAN = {
  id: '30days' as const,
  name: '30 Days',
  price: 999,
  perDay: 33.30,
  description: 'Top directory placement for 30 consecutive days',
  features: [
    'Pinned #1 featured banner at the top of the directory',
    '30-day continuous prime visibility to all visitors',
    'Dynamic animated border beam highlight',
    'Direct outbound clicks & verified badge priority',
  ],
};

export const FeaturedSpotModal: React.FC<FeaturedSpotModalProps> = ({
  isOpen,
  onClose,
  products,
  user,
  soundEnabled,
  onOpenSubmitModal,
}) => {
  const [step, setStep] = useState<'product' | 'plan' | 'confirm'>('product');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const userId = user?.id;

  // Show strictly this user's products (submissions are accepted instantly, so products are the source of truth)
  const userOwnedItems = user
    ? products.filter((p) => userId && p.submittedBy === userId)
    : [];

  const filteredProducts = userOwnedItems.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const handleSelectProduct = (product: Product) => {
    playSound('click', soundEnabled);
    setSelectedProduct(product);
    setStep('plan');
  };

  const handleProceedToConfirm = () => {
    playSound('click', soundEnabled);
    setStep('confirm');
  };

  const handleProceed = async () => {
    if (!selectedProduct) return;
    
    setIsProcessing(true);
    setPaymentError(null);
    playSound('click', soundEnabled);
    
    try {
      localStorage.setItem('topsaas_featured_pending', selectedProduct.id);
      localStorage.setItem('topsaas_featured_pending_plan', '30days');

      await redirectToCheckout({
        planType: '30days',
        productName: selectedProduct.name,
        customerEmail: user?.email,
        customerName: user?.user_metadata?.full_name || user?.user_metadata?.name,
      });
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep('product');
    setSelectedProduct(null);
    setProductSearch('');
    try { 
      localStorage.removeItem('topsaas_featured_pending'); 
      localStorage.removeItem('topsaas_featured_pending_plan'); 
    } catch {}
    onClose();
  };

  const handleBack = () => {
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
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#222222] shadow-2xl p-5 sm:p-6 my-4 text-neutral-100 animate-in fade-in zoom-in-95 duration-150 font-sans">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Back Button */}
        {step !== 'product' && (
          <button
            type="button"
            onClick={handleBack}
            className="absolute left-3.5 top-3.5 sm:left-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* Minimalist Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className={`flex items-center gap-1.5 ${step === 'product' ? 'text-white' : 'text-neutral-500'}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'product' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}>
              1
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Your Product</span>
          </div>
          <div className="w-6 h-px bg-neutral-800" />
          <div className={`flex items-center gap-1.5 ${step === 'plan' ? 'text-white' : 'text-neutral-500'}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'plan' ? 'bg-white text-black' : step === 'confirm' ? 'bg-mint-500 text-black' : 'bg-neutral-800 text-neutral-400'}`}>
              {step === 'confirm' ? <Check className="h-3 w-3" /> : '2'}
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Pricing</span>
          </div>
          <div className="w-6 h-px bg-neutral-800" />
          <div className={`flex items-center gap-1.5 ${step === 'confirm' ? 'text-white' : 'text-neutral-500'}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 'confirm' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}>
              3
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Payment</span>
          </div>
        </div>

        {/* Step 1: Select Your Product */}
        {step === 'product' && (
          <>
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-mint-500/10 border border-mint-500/25 px-3 py-1 mb-2.5">
                <Crown className="h-3.5 w-3.5 text-mint-300" />
                <span className="text-xs font-bold text-mint-200">Featured Spot</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Choose Your Product</h2>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Select one of your submitted products to get featured at the top for 30 days.
              </p>
            </div>

            {/* Product List */}
            {userOwnedItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-700 bg-[#2a2a2a] p-6 text-center mb-3">
                <Globe className="h-8 w-8 mx-auto text-neutral-400 mb-2" />
                <h3 className="text-xs font-bold text-white">No submitted products found</h3>
                <p className="text-[11px] text-neutral-400 max-w-xs mx-auto mt-1 mb-4">
                  You haven&apos;t submitted any products under your account yet. Submit your website to feature it.
                </p>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Submit Project</span>
                </button>
              </div>
            ) : (
              <>
                {/* Search if multiple products */}
                {userOwnedItems.length > 3 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search your products..."
                      className="w-full rounded-xl border border-neutral-700 bg-[#1e1e1e] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-mint-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="max-h-72 overflow-y-auto space-y-2 mb-3 pr-0.5">
                  {filteredProducts.map((product) => {
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectProduct(product)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-neutral-800 bg-[#2a2a2a] hover:border-neutral-600 hover:bg-[#303030] transition-all cursor-pointer text-left group"
                      >
                        <ProductLogo
                          src={product.logoUrl}
                          alt={product.name}
                          containerClassName="h-9 w-9 rounded-lg border border-neutral-700 bg-[#1e1e1e] shrink-0 overflow-hidden relative flex items-center justify-center"
                          iconClassName="h-4 w-4 text-neutral-300 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white group-hover:text-mint-200 transition-colors truncate">{product.name}</span>
                            <span className="text-[10px] font-semibold text-mint-300 bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.2 rounded">
                              Live
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate">{product.tagline}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-neutral-500 group-hover:text-white transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>

                {/* Add project button */}
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-700 bg-[#2a2a2a] py-2 px-3 text-xs font-semibold text-neutral-300 hover:border-neutral-500 hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>Submit Project</span>
                </button>
              </>
            )}
          </>
        )}

        {/* Step 2: Clean Pricing Card ($999 for 30 Days) */}
        {step === 'plan' && selectedProduct && (
          <>
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">Featured Placement</h2>
              <p className="text-xs text-neutral-400 mt-1">
                30 days of top-tier exposure for <span className="font-bold text-white">{selectedProduct.name}</span>
              </p>
            </div>

            {/* Single Clean Pricing Card */}
            <div className="rounded-xl border border-neutral-700 bg-[#2a2a2a] p-5 text-left mb-4 shadow-xs">
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white font-mono-num">
                    ${FEATURED_PLAN.price}
                  </span>
                  <span className="text-xs font-medium text-neutral-400">
                    /m
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-neutral-400">
                  ~${FEATURED_PLAN.perDay.toFixed(2)} / day
                </span>
              </div>

              <p className="text-xs text-neutral-300 mb-4 font-medium leading-relaxed">
                {FEATURED_PLAN.description}
              </p>

              <div className="border-t border-neutral-800 pt-3 mb-4">
                <ul className="space-y-2">
                  {FEATURED_PLAN.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-mint-400" />
                      <span className="text-xs text-neutral-300 leading-snug">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={handleProceedToConfirm}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 px-4 text-xs font-black text-black shadow-2xs hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer"
              >
                <span>Continue with 30-Day Plan</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm & Pay ($999) */}
        {step === 'confirm' && selectedProduct && (
          <>
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-white tracking-tight">Confirm & Proceed</h2>
              <p className="text-xs text-neutral-400 mt-1">Review your featured spot summary</p>
            </div>

            {/* Order Summary */}
            <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <ProductLogo
                  src={selectedProduct.logoUrl}
                  alt={selectedProduct.name}
                  containerClassName="h-10 w-10 rounded-lg border border-neutral-700 bg-[#1e1e1e] shrink-0 overflow-hidden relative flex items-center justify-center"
                  iconClassName="h-5 w-5 text-neutral-300 shrink-0"
                />
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedProduct.name}</h3>
                  <p className="text-[11px] text-neutral-400 truncate max-w-xs">{selectedProduct.tagline}</p>
                </div>
              </div>

              <div className="border-t border-neutral-800 pt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Plan Duration</span>
                  <span className="font-semibold text-white">30 Days</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Placement</span>
                  <span className="font-semibold text-white">Top Directory Banner</span>
                </div>
                <div className="border-t border-neutral-800 pt-2 mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Total Due</span>
                  <span className="text-lg font-black text-white font-mono-num">
                    ${FEATURED_PLAN.price}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="mb-3 rounded-xl bg-red-950/40 border border-red-800/60 p-2.5 text-xs text-red-200">
                {paymentError}
              </div>
            )}

            {/* Pay Button */}
            <button
              type="button"
              onClick={handleProceed}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-2.5 px-4 text-xs font-black text-black shadow-2xs hover:bg-neutral-200 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Proceed to Payment — ${FEATURED_PLAN.price}</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-neutral-500 mt-2">
              Secure checkout powered by DodoPayments
            </p>
          </>
        )}
      </div>
    </div>
  );
};
