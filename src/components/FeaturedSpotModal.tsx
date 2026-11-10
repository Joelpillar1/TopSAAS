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
  Calendar,
  LogIn,
  FolderPlus,
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { Product, SponsorDraft, SponsorTier, WebsiteSubmission } from '../types';
import { playSound } from '../utils/sound';
import { redirectToCheckout, PlanType } from '../utils/whop';
import { ProductLogo } from './ProductLogo';
import { getWebsiteFavicon } from '../utils/logo';
import { supabase } from '../utils/supabase';
import {
  insertProductDirect,
  isSponsorOnlyProduct,
  mapDbProduct,
  mapDbSubmission,
  submissionToProduct,
} from '../utils/db';

interface FeaturedSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  submissions?: WebsiteSubmission[];
  user: SupabaseUser | null;
  soundEnabled: boolean;
  onOpenSubmitModal: () => void;
  onOpenSignInModal?: () => void;
  initialTier?: SponsorPlanId;
  mode?: 'featured' | 'sponsor';
  featuredProductIds?: string[];
  onActivateSponsor?: (
    sponsor: SponsorDraft,
    tier: 'trial' | 'paid' | '1mo' | '3mo' | '1yr',
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
  originalPrice?: string;
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
    cardTitle: '7 days',
    price: 15,
    priceLabel: '$15',
    period: '/week',
    discountBadge: 'Starter',
    badge: 'Popular',
    duration: '7 days',
    originalPrice: '$20',
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
    cardTitle: '30 days',
    price: 39,
    priceLabel: '$39',
    period: '/month',
    discountBadge: '-35%',
    badge: 'Best Value',
    duration: '30 days',
    originalPrice: '$60',
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
];

export const SPONSOR_PLANS: SponsorPlanItem[] = [
  {
    id: '1wk',
    name: '1-Week Sidebar Sponsor',
    cardTitle: '7 days',
    price: 10,
    priceLabel: '$10',
    period: '/week',
    discountBadge: 'Starter',
    badge: 'Starter',
    duration: '7 days',
    originalPrice: '$15',
    rateNote: '$10 / week',
    description: '24/7 Sticky sidebar rails on Homepage and Product pages for 7 days',
    features: [
      'Visible on every page in the right sidebar',
      '24/7 Sticky sidebar rails on Homepage and Product Details',
      'Golden Verified Sponsor badge on partner cards',
      'Direct DoFollow SEO backlink',
    ],
    cta: 'Get 1 Week — $10',
  },
  {
    id: '1mo',
    name: '1-Month Sidebar Sponsor',
    cardTitle: '30 days',
    price: 29,
    priceLabel: '$29',
    period: '/month',
    discountBadge: '-28%',
    badge: 'Most Popular',
    duration: '30 days',
    originalPrice: '$40',
    rateNote: '$29 / month ($7.25/wk)',
    popular: true,
    description: 'Persistent 30-day sticky sidebar rails across all pages',
    features: [
      'Visible on every page in the right sidebar (30 days)',
      '24/7 Sticky sidebar rails across Homepage and all Detail pages',
      'Golden Verified Sponsor badge on partner cards',
      'Direct DoFollow SEO backlink',
    ],
    cta: 'Get Monthly — $29',
  },
];

function planDurationDays(planId: SponsorPlanId): number {
  if (planId === '1wk' || planId === 'trial') return 7;
  if (planId === '3mo') return 90;
  if (planId === '1yr') return 365;
  return 30;
}

function planSponsorTier(planId: SponsorPlanId): SponsorTier {
  if (planId === 'trial') return 'trial';
  if (planId === '3mo') return '3mo';
  if (planId === '1yr') return '1yr';
  if (planId === '1wk') return 'paid';
  return '1mo';
}

function buildSponsorDraft(
  product: Product,
  email: string | undefined,
  planId: SponsorPlanId,
  source: 'trial' | 'whop'
): SponsorDraft {
  const now = Date.now();
  const days = planDurationDays(planId);
  return {
    id: `spn_${now}_${Math.random().toString(36).slice(2, 8)}`,
    productId: product.isSponsorOnly ? undefined : product.id,
    name: product.name,
    tagline: product.tagline,
    url: product.url,
    logoUrl: product.logoUrl,
    category: product.category,
    contactEmail: email || product.sponsorContactEmail,
    tier: planSponsorTier(planId),
    status: 'active',
    startedAt: now,
    expiresAt: now + days * 86400 * 1000,
    clicks: 0,
    source,
  };
}

export const FeaturedSpotModal: React.FC<FeaturedSpotModalProps> = ({
  isOpen,
  onClose,
  products,
  submissions = [],
  user,
  soundEnabled,
  onOpenSubmitModal,
  onOpenSignInModal,
  initialTier,
  mode = 'featured',
  featuredProductIds = [],
  onActivateSponsor,
  onActivateFeatured,
}) => {
  const [step, setStep] = useState<'product' | 'plan' | 'confirm'>('product');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<SponsorPlanId>(initialTier || '1mo');
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

  // Authoritative user-owned products fetched directly from Supabase
  const [dbUserProducts, setDbUserProducts] = useState<Product[]>([]);
  const [isLoadingUserProducts, setIsLoadingUserProducts] = useState(false);

  useEffect(() => {
    if (initialTier) {
      setSelectedPlanId(initialTier);
    }
  }, [initialTier, isOpen]);

  useEffect(() => {
    if (!isOpen || !user) {
      setDbUserProducts([]);
      setIsLoadingUserProducts(false);
      return;
    }

    let isMounted = true;
    setIsLoadingUserProducts(true);

    (async () => {
      try {
        const [prodsRes, subsResById, subsResByEmail] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('submitted_by', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('submissions')
            .select('*')
            .eq('submitted_by', user.id)
            .order('submitted_at', { ascending: false }),
          user.email
            ? supabase
                .from('submissions')
                .select('*')
                .eq('backer_email', user.email)
                .order('submitted_at', { ascending: false })
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (!isMounted) return;

        const collected: Product[] = [];
        if (!prodsRes.error && prodsRes.data) {
          collected.push(
            ...(prodsRes.data as unknown as Record<string, unknown>[]).map(mapDbProduct)
          );
        }

        const combinedSubs = new Map<string, WebsiteSubmission>();
        if (!subsResById.error && subsResById.data) {
          (subsResById.data as unknown as Record<string, unknown>[])
            .map(mapDbSubmission)
            .forEach((s) => combinedSubs.set(s.id, s));
        }
        if (!subsResByEmail.error && subsResByEmail.data) {
          (subsResByEmail.data as unknown as Record<string, unknown>[])
            .map(mapDbSubmission)
            .forEach((s) => combinedSubs.set(s.id, s));
        }

        combinedSubs.forEach((sub) => {
          const prod = submissionToProduct(sub);
          if (!collected.some((p) => p.id === prod.id || p.id === sub.id)) {
            collected.push(prod);
          }
        });

        if (isMounted) {
          setDbUserProducts(collected);
        }
      } catch (err) {
        console.warn('Error fetching user products for sponsor modal:', err);
      } finally {
        if (isMounted) {
          setIsLoadingUserProducts(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  const userId = user?.id;
  const userEmail = user?.email?.toLowerCase();

  // Helper: check if a product is owned by the current user
  const isProductOwnedByUser = (p: Product) => {
    if (!user) return false;
    if (userId && p.submittedBy === userId) return true;
    if (userEmail && p.submittedBy && p.submittedBy.toLowerCase() === userEmail) return true;
    if (userEmail && p.sponsorContactEmail && p.sponsorContactEmail.toLowerCase() === userEmail) return true;
    if (p.isUserOwned) return true;
    if (typeof window !== 'undefined' && localStorage.getItem('topsaas_my_product_id') === p.id) return true;
    return false;
  };

  // Exclude sponsor-only ads
  const directoryProducts = products.filter((p) => !isSponsorOnlyProduct(p));

  // Collect strictly this user's apps (no directory fallback!)
  const userOwnedMap = new Map<string, Product>();

  // 1. From products prop
  directoryProducts.filter(isProductOwnedByUser).forEach((p) => userOwnedMap.set(p.id, p));

  // 2. From submissions prop
  if (user && submissions && submissions.length > 0) {
    submissions
      .filter((s) => {
        if (userId && s.submittedBy === userId) return true;
        if (userEmail && s.submittedBy && s.submittedBy.toLowerCase() === userEmail) return true;
        if (userEmail && s.backerEmail && s.backerEmail.toLowerCase() === userEmail) return true;
        return false;
      })
      .forEach((sub) => {
        const prod = submissionToProduct(sub);
        if (!userOwnedMap.has(prod.id) && !userOwnedMap.has(sub.id)) {
          userOwnedMap.set(prod.id, prod);
        }
      });
  }

  // 3. From direct Supabase fetch
  dbUserProducts.forEach((p) => {
    if (!isSponsorOnlyProduct(p) && !userOwnedMap.has(p.id)) {
      userOwnedMap.set(p.id, p);
    }
  });

  const userOwnedItems = user ? Array.from(userOwnedMap.values()) : [];

  // When modal opens: if user has existing owned products, default to existing mode so they see their apps.
  // Otherwise, default to 'new' so guests and makers without listings start at "+ Add New App".
  useEffect(() => {
    if (isOpen) {
      if (user && userOwnedItems.length > 0) {
        setProductMode('existing');
      } else {
        setProductMode('new');
      }
    }
  }, [isOpen, user, userOwnedItems.length]);

  // NEVER fall back to all directory products: only filter user's own items
  const filteredProducts = userOwnedItems.filter((p) => {
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
    setSelectedPlanId('1mo');
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

      // Featured placements still reference a product listing. Sponsor
      // placements never write a product row.
      if (isNewProduct && mode === 'featured') {
        const prodToInsert: Product = {
          ...selectedProduct,
          isSponsored: false,
          isSponsorOnly: false,
          sponsorTier: undefined,
          sponsorStartedAt: undefined,
          sponsorExpiresAt: undefined,
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
          await onActivateSponsor(buildSponsorDraft(targetProduct, email, 'trial', 'trial'), 'trial', email);
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

      if (mode === 'sponsor') {
        // Stage the sponsor record. PaymentSuccess and the webhook both upsert
        // the same id, so the paid placement survives even if the tab closes.
        const sponsorDraft = buildSponsorDraft(selectedProduct, email, selectedPlan.id, 'whop');
        localStorage.setItem('topsaas_pending_sponsor', JSON.stringify(sponsorDraft));

        await redirectToCheckout({
          planType,
          productName: selectedProduct.name,
          targetProductId: sponsorDraft.productId,
          customerEmail: email,
          placement: 'sponsor',
          sponsorId: sponsorDraft.id,
          sponsorName: sponsorDraft.name,
          sponsorUrl: sponsorDraft.url,
          sponsorLogo: sponsorDraft.logoUrl,
          sponsorTagline: sponsorDraft.tagline,
          sponsorCategory: sponsorDraft.category,
          sponsorProductId: sponsorDraft.productId,
          sponsorEmail: sponsorDraft.contactEmail,
        });
        return;
      }

      // Featured placements reference a real product listing.
      if (isNewProduct) {
        const durationDays = planDurationDays(selectedPlan.id);
        const pendingProduct: Product = {
          ...selectedProduct,
          isSponsored: false,
          isSponsorOnly: false,
          sponsorTier: undefined,
          sponsorStartedAt: undefined,
          sponsorExpiresAt: undefined,
          sponsorContactEmail: email,
        };
        localStorage.setItem('topsaas_featured_pending_new_product', JSON.stringify(pendingProduct));
        localStorage.setItem('topsaas_featured_pending_new_product_days', String(durationDays));
      }

      await redirectToCheckout({
        planType,
        productName: selectedProduct.name,
        targetProductId: selectedProduct.id,
        customerEmail: email,
        placement: 'featured',
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
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${productMode === 'new'
                          ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200/60'
                          : 'text-neutral-500 hover:text-neutral-950'
                        }`}
                    >
                      + Add New App
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        setProductMode('existing');
                        setFormError(null);
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${productMode === 'existing'
                          ? 'bg-white text-neutral-950 shadow-xs border border-neutral-200/60'
                          : 'text-neutral-500 hover:text-neutral-950'
                        }`}
                    >
                      <span>Choose from Directory</span>
                      {user && userOwnedItems.length > 0 && (
                        <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.2 text-[10px] font-black">
                          {userOwnedItems.length}
                        </span>
                      )}
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
                    /* Mode B: Choose from Directory (User's Listed Apps Only) */
                    <div className="space-y-3">
                      {!user ? (
                        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 space-y-3">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700">
                            <LogIn className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-neutral-900">Sign in to view your listed apps</h3>
                            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                              Sign in to choose and sponsor products you have already submitted to TopSAAS.
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                            {onOpenSignInModal && (
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  onOpenSignInModal();
                                }}
                                className="btn-primary py-2 px-4 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                <span>Sign In to TopSAAS</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                playSound('click', soundEnabled);
                                setProductMode('new');
                              }}
                              className="rounded-lg border border-neutral-300 bg-white py-2 px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                            >
                              Sponsor unlisted app (+ Add New)
                            </button>
                          </div>
                        </div>
                      ) : isLoadingUserProducts && userOwnedItems.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 space-y-2">
                          <Loader2 className="mx-auto h-5 w-5 animate-spin text-neutral-400" />
                          <p className="text-xs font-medium">Checking your listed apps…</p>
                        </div>
                      ) : userOwnedItems.length === 0 ? (
                        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/70 space-y-3">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-700">
                            <FolderPlus className="h-5 w-5" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-xs font-bold text-neutral-900">No listed apps found</h3>
                            <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                              You haven&apos;t listed any apps in the directory yet under this account ({user.email}).
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                playSound('click', soundEnabled);
                                setProductMode('new');
                              }}
                              className="btn-primary py-2 px-4 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add New App to Sponsor</span>
                            </button>
                            {onOpenSubmitModal && (
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  onOpenSubmitModal();
                                }}
                                className="rounded-lg border border-neutral-300 bg-white py-2 px-3 text-xs font-bold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                              >
                                Submit app to directory
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Search */}
                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                            <input
                              type="text"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              placeholder="Search your listed apps by name or category…"
                              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                            />
                          </div>

                          {/* Product List */}
                          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                            {filteredProducts.length === 0 ? (
                              <div className="text-center py-8 text-neutral-500 space-y-2">
                                <p className="text-xs">No matching apps found in your listings.</p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playSound('click', soundEnabled);
                                    setProductMode('new');
                                  }}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Add a new app to sponsor above</span>
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
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isAlreadyActive
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
                    </>
                  )}
                </div>
              )}
                </div>
              )}

              {/* Step 2: Choose Plan (Horizontal list matching attached reference) */}
              {step === 'plan' && selectedProduct && (
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black shrink-0 shadow-2xs">
                          1
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
                          How long
                        </h2>
                      </div>
                      <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                        {selectedProduct.name}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal List of Plan Cards (Weekly, Monthly) */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full pt-3">
                    {availablePlans.map((plan) => {
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
                          className={`rounded-2xl p-3 sm:p-4 text-left flex flex-col justify-between transition-all duration-200 cursor-pointer relative select-none ${isSelected
                              ? plan.popular
                                ? 'border-2 border-blue-600 bg-gradient-to-b from-blue-50/70 via-blue-50/40 to-white shadow-md ring-4 ring-blue-600/10'
                                : 'border-2 border-blue-600 bg-blue-50/40 shadow-xs ring-2 ring-blue-600/10'
                              : plan.popular
                                ? 'border-2 border-blue-200/90 bg-gradient-to-b from-blue-50/30 via-white to-white hover:border-blue-400 hover:shadow-xs'
                                : 'border border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/60'
                            }`}
                        >
                          {/* Most Popular Floating Badge for 30-day plan */}
                          {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
                              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white text-[9px] sm:text-[9.5px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full shadow-md ring-2 ring-white">
                                <Sparkles className="h-2.5 w-2.5 text-amber-300 fill-amber-300" />
                                <span>Most Popular</span>
                              </span>
                            </div>
                          )}

                          {/* Duration on left, Discount/Badge on right */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs sm:text-[13px] font-bold text-neutral-900 truncate">
                              {plan.duration}
                            </span>
                            {plan.discountBadge && (
                              <span
                                className={`text-[9.5px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${plan.popular
                                    ? 'bg-blue-100 text-blue-700 font-extrabold'
                                    : isSelected
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-neutral-100 text-neutral-700'
                                  }`}
                              >
                                {plan.discountBadge}
                              </span>
                            )}
                          </div>

                          {/* Large Price in center */}
                          <div className="my-1.5 sm:my-2">
                            <span className="text-xl sm:text-2xl font-black text-neutral-950 font-mono-num tracking-tight">
                              {plan.priceLabel}
                            </span>
                          </div>

                          {/* Strikethrough comparison price at bottom */}
                          <div className="flex items-center justify-between gap-1 min-h-[16px]">
                            <div className="flex items-center gap-1.5">
                              {plan.originalPrice ? (
                                <span className="text-xs text-neutral-400 line-through font-mono-num font-medium">
                                  {plan.originalPrice}
                                </span>
                              ) : (
                                <span className="text-[10.5px] text-neutral-400 font-medium">
                                  {plan.period}
                                </span>
                              )}
                            </div>
                            {plan.popular && (
                              <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                                Save 28%
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Activation Info Banner */}
                  <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-100/70 border border-neutral-200/80 rounded-xl px-3.5 py-2.5">
                    <Calendar className="h-4 w-4 text-neutral-500 shrink-0" />
                    <span className="font-medium">
                      Goes live immediately upon successful checkout.
                    </span>
                  </div>

                  {/* Selected Plan Details & Inclusions Container */}
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5 sm:p-4 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                          {selectedPlan.name} Includes:
                        </h3>
                        {selectedPlan.popular && (
                          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs">
                            <Sparkles className="h-2.5 w-2.5 text-amber-300 fill-amber-300" />
                            <span>Most Popular</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                        {selectedPlan.duration} Active Visibility
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                      {selectedPlan.features.map((feat) => (
                        <div key={feat} className="flex items-center gap-2 text-neutral-800 min-w-0">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span className="whitespace-nowrap truncate">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Bar: Duration • Discount | Price Strikethrough | Continue button */}
                  <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                        <span>{selectedPlan.duration}</span>
                        {selectedPlan.discountBadge && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-bold">{selectedPlan.discountBadge}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl font-black text-neutral-950 font-mono-num">
                          {selectedPlan.priceLabel}
                        </span>
                        {selectedPlan.originalPrice && (
                          <span className="text-xs sm:text-sm text-neutral-400 line-through font-mono-num">
                            {selectedPlan.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToConfirm}
                      className="btn-primary py-2.5 px-5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs shrink-0 rounded-xl cursor-pointer"
                    >
                      <span>Continue to payment</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
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
                      Review order summary and proceed to checkout
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
                          ${selectedPlan.price}
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

                  <p className="text-center text-[10px] text-neutral-500">
                    Secure checkout powered by Whop (Cards, Apple Pay, Google Pay, Crypto)
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
