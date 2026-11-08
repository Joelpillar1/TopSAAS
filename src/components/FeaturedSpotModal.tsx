import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  ArrowRight,
  Search,
  ArrowLeft,
  CreditCard,
  Plus,
  Loader2,
  Sparkles,
  CheckCircle2,
  Megaphone,
  Award,
  Globe,
  Image as ImageIcon,
  FileText,
  Star,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { redirectToCheckout, PlanType } from '../utils/whop';
import { ProductLogo } from './ProductLogo';
import { getWebsiteFavicon } from '../utils/logo';
import { insertProductDirect, isSponsorOnlyProduct } from '../utils/db';

interface FeaturedSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  user: SupabaseUser | null;
  soundEnabled: boolean;
  onOpenSubmitModal: () => void;
  initialTier?: SponsorPlanId;
  mode?: 'featured' | 'sponsor';
  featuredProductIds?: string[];
  onActivateSponsor?: (
    product: Product,
    tier: 'trial' | 'paid' | '1wk' | '1mo' | '3mo' | '1yr',
    email?: string
  ) => Promise<void> | void;
  onActivateFeatured?: (
    product: Product,
    durationDays?: number,
    email?: string
  ) => Promise<void> | void;
}

export type SponsorPlanId = '1wk' | '1mo' | '3mo' | '1yr' | 'trial';

export interface SponsorPlanItem {
  id: SponsorPlanId;
  name: string;
  cardTitle: string;
  price: number;
  priceLabel: string;
  period: string;
  discountBadge?: string;
  badge: string;
  duration: string;
  rateNote?: string;
  popular?: boolean;
  bestValue?: boolean;
  description: string;
  features: string[];
  cta: string;
}

export const FEATURED_PLANS: SponsorPlanItem[] = [
  {
    id: '1wk',
    name: '1-Week Featured Spot',
    cardTitle: '1 Week',
    price: 15,
    priceLabel: '$15',
    period: '/week',
    badge: 'Popular',
    duration: '7 Days',
    rateNote: '$15 / week',
    description: 'Pinned top position directly in the product feed above normal cards for 7 days',
    features: [
      'Pinned top placement inside the main product cards feed',
      'Highest visibility spot across TopSAAS',
      'Exclusive Featured distinction on product card',
      'Category priority placement',
      'Direct outbound referral link',
    ],
    cta: 'Get 1 Week — $15',
  },
  {
    id: '1mo',
    name: '1-Month Featured Spot',
    cardTitle: '1 Month',
    price: 39,
    priceLabel: '$39',
    period: '/month',
    discountBadge: 'Save 35% • $9.75/wk',
    badge: 'Best Value',
    duration: '30 Days',
    rateNote: '$39 / month ($9.75/wk)',
    popular: true,
    description: 'Continuous 30-day top pinned spotlight in the main product cards feed',
    features: [
      '30 days continuous top placement above product cards',
      'Exclusive Featured distinction on product card',
      'Pinned top spot when visitors filter your category',
      'Prime visibility above organic cards',
    ],
    cta: 'Get 1 Month — $39',
  },
  {
    id: 'trial',
    name: '7-Day Free Featured Test Drive',
    cardTitle: '7 Days',
    price: 0,
    priceLabel: 'FREE',
    period: '7 days',
    discountBadge: '100% Free',
    badge: 'Free Test Drive',
    duration: '7 Days',
    rateNote: '100% Free',
    description: 'Try the Featured Spot above product cards free for 7 days',
    features: [
      'Pinned placement above standard product cards',
      '7 days exposure to thousands of active SaaS visitors',
      'High-visibility launch exposure',
      'No credit card required — 100% free',
    ],
    cta: 'Claim Free 7-Day Spot',
  },
];

export const SPONSOR_PLANS: SponsorPlanItem[] = [
  {
    id: '1wk',
    name: '1-Week Sidebar Sponsor',
    cardTitle: '1 Week',
    price: 10,
    priceLabel: '$10',
    period: '/week',
    badge: 'Starter',
    duration: '7 Days',
    rateNote: '$10 / week',
    description: '24/7 Sticky sidebar rails on Homepage and Product pages for 7 days',
    features: [
      'Visible on every page in the right sidebar',
      '24/7 Sticky sidebar rails on Homepage and Product Details',
      '⭐️ Verified Sponsor badge on partner cards',
      'Direct DoFollow SEO backlink',
    ],
    cta: 'Get 1 Week — $10',
  },
  {
    id: '1mo',
    name: '1-Month Sidebar Sponsor',
    cardTitle: '1 Month',
    price: 29,
    priceLabel: '$29',
    period: '/month',
    discountBadge: 'Save 28% • $7.25/wk',
    badge: 'Most Popular',
    duration: '30 Days',
    rateNote: '$29 / month ($7.25/wk)',
    popular: true,
    description: 'Persistent 30-day sticky sidebar rails + category top spotlight',
    features: [
      'Visible on every page in the right sidebar (30 days)',
      'Large sponsored banner in the weekly launch feed',
      'Pinned top placement in your product category',
      '⭐️ Verified Sponsor badge on partner cards',
    ],
    cta: 'Get Monthly — $29',
  },
  {
    id: 'trial',
    name: '7-Day Free Sponsor Test Drive',
    cardTitle: '7 Days',
    price: 0,
    priceLabel: 'FREE',
    period: '7 days',
    discountBadge: '100% Free',
    badge: 'Free Launch Spotlight',
    duration: '7 Days',
    rateNote: '100% Free',
    description: 'Spotlight your product on sticky sidebar rails free for 7 days',
    features: [
      'Sticky sidebar rails placement on Homepage & Details',
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
  initialTier,
  mode = 'featured',
  featuredProductIds = [],
  onActivateSponsor,
  onActivateFeatured,
}) => {
  const [step, setStep] = useState<'product' | 'plan' | 'confirm'>('product');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SponsorPlanId>(initialTier || '3mo');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [productSearch, setProductSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New App Form State (anyone can sponsor without prior listing)
  const [productMode, setProductMode] = useState<'new' | 'existing'>('new');
  const [newProductName, setNewProductName] = useState('');
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTier) {
      setSelectedPlanId(initialTier);
    }
  }, [initialTier, isOpen]);

  // If user has existing owned products, default to existing mode so they see their apps
  useEffect(() => {
    if (user && products.some((p) => p.submittedBy === user.id)) {
      setProductMode('existing');
    }
  }, [user, products]);

  const userId = user?.id;

  // Show user's products first, or all directory products if searching (exclude sponsor-only ads)
  const directoryProducts = products.filter((p) => !isSponsorOnlyProduct(p));
  const userOwnedItems = user
    ? directoryProducts.filter((p) => userId && p.submittedBy === userId)
    : [];

  const displayList = userOwnedItems.length > 0 ? userOwnedItems : directoryProducts;

  const filteredProducts = displayList.filter((p) => {
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const availablePlans = mode === 'featured' ? FEATURED_PLANS : SPONSOR_PLANS;
  const selectedPlan =
    availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  const handleCreateAndSelectProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    const name = newProductName.trim();
    let url = newWebsiteUrl.trim();
    const tagline = newTagline.trim();

    if (!name) {
      setFormError('Please enter your product name.');
      return;
    }
    if (!url) {
      setFormError('Please enter your website URL.');
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    if (!tagline) {
      setFormError('Please enter one line about your product.');
      return;
    }

    const resolvedLogo = newLogoUrl.trim() || getWebsiteFavicon(url);

    const newProd: Product = {
      id: `prod_sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      tagline,
      url,
      logoUrl: resolvedLogo,
      category: 'SaaS',
      rank: 9999,
      upvotes: 0,
      clicks: 0,
      verified: true,
      isSponsored: false,
      isSponsorOnly: true,
      sponsorTier: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      submittedBy: user?.id,
      sponsorContactEmail: contactEmail.trim() || user?.email,
    };

    playSound('click', soundEnabled);
    setSelectedProduct(newProd);
    setIsNewProduct(true);
    setStep('plan');
  };

  const handleSelectProduct = (product: Product) => {
    playSound('click', soundEnabled);
    setSelectedProduct(product);
    setIsNewProduct(false);
    if (!contactEmail && product.sponsorContactEmail) {
      setContactEmail(product.sponsorContactEmail);
    }
    setStep('plan');
  };

  const handleProceedToConfirm = () => {
    playSound('click', soundEnabled);
    setPaymentError(null);
    setStep('confirm');
  };

  const handleBack = () => {
    playSound('click', soundEnabled);
    if (step === 'confirm') setStep('plan');
    else if (step === 'plan') setStep('product');
  };

  const handleClose = () => {
    playSound('click', soundEnabled);
    setStep('product');
    setSelectedProduct(null);
    setIsNewProduct(false);
    setSelectedPlanId('3mo');
    setPaymentError(null);
    setSuccessMessage(null);
    setFormError(null);
    setProductMode('new');
    setNewProductName('');
    setNewWebsiteUrl('');
    setNewLogoUrl('');
    setNewTagline('');
    onClose();
  };

  const handleAddProduct = () => {
    handleClose();
    onOpenSubmitModal();
  };

  // Activate 7-day free trial placement
  const handleActivateTrial = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const email = contactEmail.trim() || user?.email || undefined;
      let targetProduct = selectedProduct;

      // If it's a new product, save it to Supabase first upon activating trial
      if (isNewProduct) {
        const prodToInsert: Product = {
          ...selectedProduct,
          isSponsored: mode === 'sponsor',
          isSponsorOnly: true,
          sponsorTier: mode === 'sponsor' ? 'trial' : undefined,
          sponsorStartedAt: mode === 'sponsor' ? Date.now() : undefined,
          sponsorExpiresAt: mode === 'sponsor' ? Date.now() + 7 * 86400 * 1000 : undefined,
          sponsorContactEmail: email,
        };
        await insertProductDirect(prodToInsert);
        targetProduct = prodToInsert;
      }

      if (mode === 'featured') {
        if (onActivateFeatured) {
          await onActivateFeatured(targetProduct, 7, email);
        }
        setSuccessMessage(
          `Congratulations! ${targetProduct.name} is now in the Featured Spot above the product cards for 7 days!`
        );
      } else {
        if (onActivateSponsor) {
          await onActivateSponsor(targetProduct, 'trial', email);
        }
        setSuccessMessage(
          `Congratulations! ${targetProduct.name} is now spotlighted as a sponsor for 7 days.`
        );
      }
      playSound('success', soundEnabled);
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to activate trial:', err);
      setPaymentError(
        'Could not activate free placement right now. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Proceed with paid checkout
  const handleProceedPayment = async () => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const email = contactEmail.trim() || user?.email || undefined;
      const planType: PlanType =
        mode === 'featured'
          ? (selectedPlan.id === '1wk' ? 'featured_1wk' : 'featured_1mo')
          : (selectedPlan.id === '1wk' ? 'sponsor_1wk' : selectedPlan.id === '3mo' ? '3mo' : selectedPlan.id === '1yr' ? '1yr' : 'sponsor_1mo');

      // If this is a new product that was entered via the form, stage it in local storage
      // so PaymentSuccess.tsx can insert it into Supabase upon return from successful Whop checkout.
      if (isNewProduct) {
        let durationDays = 30;
        if (selectedPlan.id === '1wk') durationDays = 7;
        else if (selectedPlan.id === '3mo') durationDays = 90;
        else if (selectedPlan.id === '1yr') durationDays = 365;

        const pendingProduct: Product = {
          ...selectedProduct,
          isSponsored: mode === 'sponsor',
          isSponsorOnly: true,
          sponsorTier: mode === 'sponsor' ? (selectedPlan.id === '3mo' ? '3mo' : selectedPlan.id === '1yr' ? '1yr' : 'paid') : undefined,
          sponsorStartedAt: Date.now(),
          sponsorExpiresAt: Date.now() + durationDays * 86400 * 1000,
          sponsorContactEmail: email,
        };
        localStorage.setItem('topsaas_featured_pending_new_product', JSON.stringify(pendingProduct));
      }

      await redirectToCheckout({
        planType,
        productName: selectedProduct.name,
        targetProductId: selectedProduct.id,
        customerEmail: email,
      });
    } catch (err: unknown) {
      console.error('Payment checkout error:', err);
      // Clean up staged product on error
      localStorage.removeItem('topsaas_featured_pending_new_product');
      localStorage.removeItem('topsaas_featured_pending');
      localStorage.removeItem('topsaas_featured_pending_plan');
      setPaymentError(
        (err as Error)?.message ||
          'Could not start checkout. Please try again or contact support.'
      );
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const paidPlans = availablePlans.filter((p) => p.id !== 'trial');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl my-auto text-neutral-900 animate-in fade-in zoom-in-95 duration-150 font-sans overflow-hidden">
        {/* Top bar with Back & Close */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-4 pb-2 shrink-0 border-b border-neutral-100">
          <div>
            {step !== 'product' && !successMessage && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer ml-auto"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="overflow-y-auto px-5 sm:px-7 py-5 space-y-5 flex-1">
          {/* Success View */}
          {successMessage ? (
            <div className="py-8 text-center space-y-4">
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
              {/* Step 1: Select or Add Product */}
              {step === 'product' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 mb-2">
                      {mode === 'featured' ? (
                        <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                      ) : (
                        <Megaphone className="h-5 w-5" />
                      )}
                    </div>
                    <h2 className="text-xl font-black text-neutral-950 tracking-tight">
                      {mode === 'featured' ? 'Feature Your App on TopSAAS' : 'Sponsor Your App on TopSAAS'}
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      {mode === 'featured'
                        ? 'Pin your product in the Featured Spotlight directly above the directory cards.'
                        : 'Spotlight your product 24/7 on top & side rails across the entire directory.'}
                    </p>
                  </div>

                  {/* Mode Switcher Tabs */}
                  <div className="flex rounded-xl bg-neutral-100 p-1 border border-neutral-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setProductMode('new');
                        setFormError(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        productMode === 'new'
                          ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200/60'
                          : 'text-neutral-500 hover:text-neutral-950'
                      }`}
                    >
                      + Add New App to {mode === 'featured' ? 'Feature' : 'Sponsor'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setProductMode('existing');
                        setFormError(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        productMode === 'existing'
                          ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200/60'
                          : 'text-neutral-500 hover:text-neutral-950'
                      }`}
                    >
                      Choose from Directory
                    </button>
                  </div>

                  {/* Mode A: New App Form */}
                  {productMode === 'new' ? (
                    <form onSubmit={handleCreateAndSelectProduct} className="space-y-3.5 pt-1">
                      {formError && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 animate-in fade-in duration-150">
                          {formError}
                        </div>
                      )}

                      {/* Product Name */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-800 flex items-center justify-between">
                          <span>Product Name <span className="text-rose-500">*</span></span>
                        </label>
                        <input
                          type="text"
                          required
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          placeholder="e.g. Acme AI"
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Website URL */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-800 flex items-center justify-between">
                          <span>Website URL <span className="text-rose-500">*</span></span>
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                          <input
                            type="text"
                            required
                            value={newWebsiteUrl}
                            onChange={(e) => setNewWebsiteUrl(e.target.value)}
                            placeholder="https://yourproduct.com"
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Logo URL + Live Preview */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-800 flex items-center justify-between">
                          <span>Logo URL <span className="text-neutral-400 font-normal">(optional — auto-detects from website)</span></span>
                        </label>
                        <div className="flex items-center gap-2.5">
                          {/* Live preview */}
                          <div className="h-10 w-10 shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden">
                            {newLogoUrl || (newWebsiteUrl && newWebsiteUrl.includes('.')) ? (
                              <img
                                src={newLogoUrl || getWebsiteFavicon(newWebsiteUrl)}
                                alt="Logo Preview"
                                className="h-6 w-6 object-contain"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <ImageIcon className="h-4 w-4 text-neutral-300" />
                            )}
                          </div>
                          <div className="relative flex-1">
                            <input
                              type="url"
                              value={newLogoUrl}
                              onChange={(e) => setNewLogoUrl(e.target.value)}
                              placeholder="https://yourproduct.com/logo.png"
                              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* One line about it */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-neutral-800 flex items-center justify-between">
                          <span>One line about it (Tagline) <span className="text-rose-500">*</span></span>
                          <span className="text-[10px] text-neutral-400 font-normal">Max 90 chars</span>
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                          <input
                            type="text"
                            required
                            maxLength={90}
                            value={newTagline}
                            onChange={(e) => setNewTagline(e.target.value)}
                            placeholder="e.g. AI-powered customer onboarding in minutes"
                            className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-9 pr-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Submit & proceed */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <span>Continue to Choose Plan</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Mode B: Choose from Directory */
                    <div className="space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="Search directory products by name or category…"
                          className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                        />
                      </div>

                      {/* Product List */}
                      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                        {filteredProducts.length === 0 ? (
                          <div className="text-center py-8 text-neutral-500 space-y-2">
                            <p className="text-xs">No matching products found.</p>
                            <button
                              type="button"
                              onClick={() => {
                                playSound('click', soundEnabled);
                                setProductMode('new');
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add it as a new product above</span>
                            </button>
                          </div>
                        ) : (
                          filteredProducts.map((p) => {
                            const isAlreadyActive = mode === 'featured'
                              ? Boolean(featuredProductIds.includes(p.id))
                              : Boolean(p.isSponsored && (p.sponsorExpiresAt ? p.sponsorExpiresAt > Date.now() : true));
                            return (
                              <div
                                key={p.id}
                                role="button"
                                tabIndex={isAlreadyActive ? -1 : 0}
                                onClick={() => {
                                  if (isAlreadyActive) return;
                                  handleSelectProduct(p);
                                }}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                  isAlreadyActive
                                    ? 'border-neutral-200 bg-neutral-50/70 opacity-60 cursor-not-allowed'
                                    : 'border-neutral-200 bg-white hover:border-blue-500/50 hover:bg-neutral-50 cursor-pointer group'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <ProductLogo
                                    src={p.logoUrl}
                                    alt={p.name}
                                    containerClassName="h-9 w-9 rounded-lg border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                                    iconClassName="h-4 w-4 text-neutral-700 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs font-bold text-neutral-950 group-hover:text-blue-600 transition-colors truncate">
                                        {p.name}
                                      </h4>
                                      {isAlreadyActive && (
                                        <span className="inline-flex shrink-0 items-center rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold text-amber-700">
                                          {mode === 'featured' ? 'Active in Featured Spot' : 'Active on Sponsor Rails'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-neutral-500 truncate max-w-sm">
                                      {isAlreadyActive
                                        ? (mode === 'featured'
                                            ? 'This product is already active in the featured spot'
                                            : 'This product is already live on the homepage sponsor rails')
                                        : p.tagline}
                                    </p>
                                  </div>
                                </div>
                                {!isAlreadyActive ? (
                                  <ArrowRight className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 transition-colors shrink-0 ml-2" />
                                ) : (
                                  <span className="text-[10px] font-bold text-neutral-400 shrink-0 ml-2">
                                    Active
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Choose Plan (Exact layout of Image 2) */}
              {step === 'plan' && selectedProduct && (
                <div className="space-y-4">
                  {/* Header */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                        {mode === 'featured' ? 'Featured Spotlight Plans' : 'Sponsorship Plans'}
                      </h2>
                      <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {selectedProduct.name}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {mode === 'featured'
                        ? 'Choose the plan that fits your budget. Your product will be pinned in the Featured Spot directly above the directory cards.'
                        : 'Choose the plan that fits your budget. These are one-time payments, not a recurring subscription.'}
                    </p>
                  </div>

                  {/* Price Cards in a Row (2 side by side) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
                    {paidPlans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      return (
                        <div
                          key={plan.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            playSound('click', soundEnabled);
                            setSelectedPlanId(plan.id);
                          }}
                          className={`rounded-2xl p-4 text-center flex flex-col justify-between transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50/20 shadow-xs ring-2 ring-blue-600/10'
                              : 'border border-neutral-200 bg-white hover:border-neutral-300'
                          }`}
                        >
                          <div className="space-y-2 mb-3">
                            <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                              {plan.cardTitle}
                            </h3>
                            <div className="flex items-baseline justify-center gap-0.5">
                              <span className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono-num">
                                {plan.priceLabel}
                              </span>
                              <span className="text-xs font-semibold text-neutral-500">
                                {plan.period}
                              </span>
                            </div>
                            {plan.discountBadge && (
                              <p className="text-[11px] font-bold text-blue-600">
                                {plan.discountBadge}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              playSound('click', soundEnabled);
                              setSelectedPlanId(plan.id);
                            }}
                            className={`w-full rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-500'
                                : 'border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300'
                            }`}
                          >
                            {plan.cta}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* 7-Day Free Test Drive banner option */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setSelectedPlanId('trial');
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      selectedPlanId === 'trial'
                        ? 'border-2 border-emerald-600 bg-emerald-50/30 ring-2 ring-emerald-500/10'
                        : 'border-neutral-200 bg-neutral-50/60 hover:bg-neutral-100/70 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-black text-[10px] shrink-0">
                        FREE
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-950 flex items-center gap-1.5">
                          <span>{mode === 'featured' ? '7-Day Free Featured Spotlight' : '7-Day Free Sponsor Test Drive'}</span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            No Card Required
                          </span>
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">
                          {mode === 'featured'
                            ? 'Pin your product in the Featured Spot above directory cards free for 7 days'
                            : 'Test sponsor rails free for 7 days before upgrading to a paid tier'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg shrink-0 ${
                        selectedPlanId === 'trial'
                          ? 'bg-emerald-600 text-white'
                          : 'border border-neutral-200 bg-white text-neutral-700'
                      }`}
                    >
                      {selectedPlanId === 'trial' ? 'Selected' : 'Claim Free'}
                    </span>
                  </div>

                  {/* Dynamic Package Details Container (At the bottom of cards, just like Image 2) */}
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                        {selectedPlan.name} Includes:
                      </h3>
                      <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                        {selectedPlan.duration} Active Visibility
                      </span>
                    </div>

                    {/* Features grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2 text-neutral-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Homepage sidebar placement</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Visible on top hero sponsor rails</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Direct traffic to your website</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-700">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Outbound visitor click tracker</span>
                      </div>
                      {selectedPlan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-neutral-900 font-medium">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Continue Button */}
                  <button
                    type="button"
                    onClick={handleProceedToConfirm}
                    className="w-full btn-primary py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>
                      {selectedPlan.price === 0
                        ? 'Continue with 7-Day Free Test Drive'
                        : `Continue with ${selectedPlan.name} ($${selectedPlan.price})`}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 'confirm' && selectedProduct && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-xl font-black text-neutral-950 tracking-tight">
                      Confirm Placement
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      {selectedPlanId === 'trial'
                        ? (mode === 'featured'
                            ? 'Activate your complimentary 7-day featured spot above the directory cards'
                            : 'Activate your complimentary 7-day sponsor placement')
                        : 'Review order summary and proceed to checkout'}
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <ProductLogo
                        src={selectedProduct.logoUrl}
                        alt={selectedProduct.name}
                        containerClassName="h-10 w-10 rounded-lg border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                        iconClassName="h-5 w-5 text-neutral-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-neutral-950 truncate">
                          {selectedProduct.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 truncate max-w-sm">
                          {selectedProduct.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-neutral-100 pt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Selected Plan</span>
                        <span className="font-bold text-neutral-950">{selectedPlan.name}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Duration</span>
                        <span className="font-semibold text-neutral-950">{selectedPlan.duration}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Placement</span>
                        <span className="font-semibold text-blue-600">
                          {mode === 'featured'
                            ? 'Featured Spot (Above Directory Cards)'
                            : 'Homepage Side Rails'}
                        </span>
                      </div>
                      <div className="border-t border-neutral-100 pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-950">Total Due Today</span>
                        <span className="text-xl font-black text-neutral-950 font-mono-num">
                          {selectedPlan.price === 0 ? 'FREE ($0)' : `$${selectedPlan.price}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Email input */}
                  <div className="text-left space-y-1">
                    <label className="block text-xs font-bold text-neutral-900">
                      Founder / Contact Email{' '}
                      <span className="text-neutral-400 font-normal">
                        (for traffic analytics & renewal notifications)
                      </span>
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="founder@yourproduct.com"
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-blue-600 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Error */}
                  {paymentError && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                      {paymentError}
                    </div>
                  )}

                  {/* Action button */}
                  {selectedPlanId === 'trial' ? (
                    <button
                      type="button"
                      data-ml-goal="start_trial"
                      onClick={handleActivateTrial}
                      disabled={isProcessing}
                      className="w-full btn-primary py-3 px-4 text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed justify-center"
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
                      data-ml-goal="checkout_click"
                      data-ml-goal-plan={selectedPlan.id}
                      onClick={handleProceedPayment}
                      disabled={isProcessing}
                      className="w-full btn-primary py-3 px-4 text-xs font-bold disabled:opacity-60 disabled:cursor-not-allowed justify-center"
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

                  <p className="text-center text-[10px] text-neutral-500">
                    {selectedPlanId === 'trial'
                      ? 'Instant activation • Cancel or extend anytime'
                      : 'Secure checkout powered by Whop (Cards, Apple Pay, Google Pay, Crypto)'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
