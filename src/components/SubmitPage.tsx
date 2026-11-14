import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, ExternalLink, Loader2, Search, Video, X, Tag, Percent, Gift, Sparkles, Trash2, GripVertical, Star, ShieldCheck, CheckCircle2, Lock, Copy, Zap } from 'lucide-react';
import { Category, PricingModel, Product, ProductSocial, SUBMISSION_CATEGORIES, SubmitProductDetails, WebsiteSubmission } from '../types';
import { getWebsiteFavicon } from '../utils/logo';
import { playSound } from '../utils/sound';
import { BadgeStyle, BadgeTheme, BadgeFormat, generateBadgeSvg, generateBadgeSnippet } from '../utils/badgeSvg';
import { verifyBadgeViaEdge, fetchHtmlBestEffort, containsBadge } from '../utils/badgeVerify';
import { prepareRichText } from '../utils/richText';
import { uploadScreenshotToStorage } from '../utils/storage';
import { RichTextEditor } from './RichTextEditor';
import { LaunchWeekSelector } from './LaunchWeekSelector';
import { autofillWithOpenAI, formatAutofillErrorMessage } from '../utils/autofill';
import { redirectToCheckout, WHOP_LINKS } from '../utils/whop';
import { appendTrackkitParams } from '../utils/trackkit';
import { getProductSlug } from '../utils/slug';
import { VerifiedBadge } from './VerifiedBadge';
import { applyPageSeo } from '../utils/pageSeo';
import { ProductLogo } from './ProductLogo';
import { loadProducts, isProductUpvoted, isSponsorOnlyProduct } from '../utils/db';
import {
  DRAFT_KEY,
  STEP_KEY,
  saveLaunchDraft,
  clearActiveDraft,
  deleteLaunchDraft,
} from '../utils/drafts';

const PRICING_OPTIONS: { value: PricingModel; hint: string }[] = [
  { value: 'Free', hint: 'No cost to use' },
  { value: 'Freemium', hint: 'Free tier + paid upgrade' },
  { value: 'Paid', hint: 'Requires payment' },
  { value: 'Open Source', hint: 'Source code available' },
];

const STEPS = ['Website', 'Media', 'Founder', 'Launch'] as const;

interface FormState {
  id?: string;
  url: string;
  name: string;
  tagline: string;
  description: string;
  category: Category | string;
  categories: Category[];
  logoDataUrl: string;
  screenshots: string[];
  demoVideoUrl: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  appStore: string;
  playStore: string;
  chromeWebStore: string;
  productHunt: string;
  github: string;
  discord: string;
  pricingModel: PricingModel | '';
  targetAudience: string;
  problemItSolves: string;
  solution: string;
  uniqueSellingPoint: string;
  creatorName: string;
  creatorXHandle: string;
  creatorAvatar: string;
  creatorRole: string;
  offerDiscount: string;
  offerCode: string;
  offerUrl: string;
  offerDetails: string;
  scheduledLaunchWeek?: number;
  scheduledLaunchDate?: number;
}

type FieldKey = 'name' | 'tagline' | 'url' | 'category' | 'demoVideoUrl' | 'badge';

const EMPTY_FORM: FormState = {
  url: '',
  name: '',
  tagline: '',
  description: '',
  category: '',
  categories: [],
  logoDataUrl: '',
  screenshots: [],
  demoVideoUrl: '',
  twitter: '',
  linkedin: '',
  youtube: '',
  appStore: '',
  playStore: '',
  chromeWebStore: '',
  productHunt: '',
  github: '',
  discord: '',
  pricingModel: '',
  targetAudience: '',
  problemItSolves: '',
  solution: '',
  uniqueSellingPoint: '',
  creatorName: '',
  creatorXHandle: '',
  creatorAvatar: '',
  creatorRole: '',
  offerDiscount: '',
  offerCode: '',
  offerUrl: '',
  offerDetails: '',
};

function autoFormatUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function autoFormatHandle(raw: string): string {
  let v = raw.trim();
  if (!v) return '';
  v = v.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, '');
  v = v.replace(/\/.*$/, '');
  v = v.replace(/^@+/, '');
  return v ? `@${v}` : '';
}

function loadDraft(): Partial<FormState> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormState>;
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

function loadSavedStep(): number {
  try {
    const raw = localStorage.getItem(STEP_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 3 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveDraft(state: FormState, currentStep?: number, userId?: string) {
  try {
    saveLaunchDraft(state, typeof currentStep === 'number' ? currentStep : 0, userId);
  } catch {
    /* ignore storage errors */
  }
}

function clearDraft(draftId?: string, userId?: string) {
  clearActiveDraft();
  if (draftId && userId) {
    deleteLaunchDraft(draftId, userId);
  }
}

function normalizeTwitterHandle(raw: string): string {
  let v = raw.trim();
  if (!v) return '';
  return v
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(twitter\.com|x\.com)\/?/i, '')
    .replace(/^@/, '')
    .split(/[/?#]/)[0];
}

function normalizeUrl(raw: string): { ok: boolean; value: string; error?: string } {
  let u = raw.trim();
  if (!u) return { ok: false, value: u, error: 'Enter your website URL' };
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes('.')) {
      return { ok: false, value: u, error: 'That does not look like a website address' };
    }
    if (parsed.hostname.includes('..') || parsed.hostname.startsWith('.') || parsed.hostname.endsWith('.')) {
      return { ok: false, value: u, error: 'Please enter a valid website domain without extra dots or spaces' };
    }
    return { ok: true, value: u };
  } catch {
    return { ok: false, value: u, error: 'Enter a valid URL, e.g. https://yourproduct.com' };
  }
}

/**
 * Domain-only key used to detect a website that is already listed.
 * Ignores protocol, "www.", path, query, hash, casing and trailing slash so
 * https://www.Example.com/ and http://example.com both resolve to "example.com".
 */
function websiteDomainKey(raw: string): string {
  let value = raw.trim().toLowerCase();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./, '')
      .split(/[/?#]/)[0];
  }
}

const duplicateListingMessage = (name?: string) =>
  name
    ? `"${name}" is already listed on TopSAAS. Each website can only be listed once.`
    : 'This website is already listed on TopSAAS. Each website can only be listed once.';

/**
 * Read an image file and return a compressed data URL.
 * Logos are small PNGs; screenshots are downscaled JPEGs so a 10-image gallery stays light.
 */
function processImageFile(
  file: File,
  opts: { maxSide: number; format: 'image/png' | 'image/jpeg'; quality?: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file — PNG, JPG, SVG or WebP'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file could not be decoded as an image'));
      img.onload = () => {
        const scale = Math.min(1, opts.maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported in this browser'));
          return;
        }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(opts.format, opts.quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

interface SubmitPageProps {
  isSignedIn: boolean;
  userId?: string;
  defaultCreatorName?: string;
  defaultCreatorAvatar?: string;
  onBack: () => void;
  onSignInRequest: () => void;
  onSubmit: (details: SubmitProductDetails) => Promise<string | null | undefined>;
  onViewListing: (productId: string) => void;
  soundEnabled: boolean;
  products?: Product[];
  submissions?: WebsiteSubmission[];
  onUpvote?: (product: Product) => void;
  userUpvotes?: Set<string>;
}

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition-shadow ${invalid
    ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/25'
    : 'border-neutral-300 focus:border-neutral-900 focus:ring-neutral-900/10'
  }`;

const labelClass = 'mb-1.5 block text-xs font-bold text-neutral-900';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export const SubmitPage: React.FC<SubmitPageProps> = ({
  isSignedIn,
  userId,
  defaultCreatorName = '',
  defaultCreatorAvatar = '',
  onBack,
  onSignInRequest,
  onSubmit,
  onViewListing,
  soundEnabled,
  products = [],
  submissions = [],
  onUpvote,
  userUpvotes = new Set<string>(),
}) => {
  useEffect(() => {
    return applyPageSeo({
      title: 'Submit & Launch Your Product | TopSAAS',
      description: 'Launch your SaaS product or AI tool on TopSAAS. Instant AI auto-fill, verified community leaderboard, high-authority dofollow backlinks, and weekly spotlights.',
      canonical: 'https://www.topsaas.space/submit',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Submit Your SaaS — TopSAAS Launchpad',
        description: 'Submit your software for verification, community upvoting, and featured promotion on TopSAAS.',
        url: 'https://www.topsaas.space/submit',
      },
      jsonLdId: 'submit-jsonld',
    });
  }, []);

  const [form, setForm] = useState<FormState>(() => {
    // Only load cached draft if the user is authenticated; logged out users get a completely clean form
    const draft = isSignedIn ? loadDraft() : null;
    if (!isSignedIn) {
      clearDraft();
    }
    const initial: FormState = {
      ...EMPTY_FORM,
      id: draft?.id || (userId ? `draft_${userId}_launch` : 'draft_active'),
      creatorName: isSignedIn ? (defaultCreatorName || '') : '',
      creatorAvatar: isSignedIn ? (defaultCreatorAvatar || '') : '',
      ...(draft || {}),
    };
    if (!initial.id) {
      initial.id = userId ? `draft_${userId}_launch` : 'draft_active';
    }
    if (draft?.categories && draft.categories.length > 0 && !draft.category) {
      initial.category = draft.categories.join(', ');
    } else if (draft?.category && (!draft.categories || draft.categories.length === 0)) {
      initial.categories = draft.category.split(',').map((c) => c.trim() as Category).filter(Boolean);
    }

    try {
      const prefillUrl = localStorage.getItem('topsaas_submit_initial_url');
      if (prefillUrl) {
        localStorage.removeItem('topsaas_submit_initial_url');
        initial.url = autoFormatUrl(prefillUrl);
      }
    } catch { }

    return initial;
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);

  // A website can only be listed once. Match the entered URL against the live
  // directory so the user is told before they fill in the rest of the form.
  const duplicateListing = useMemo(() => {
    const key = websiteDomainKey(form.url);
    if (!key) return null;
    const match = products.find((p) => websiteDomainKey(p.url) === key);
    return match ? { id: match.id, name: match.name } : null;
  }, [form.url, products]);

  const [step, setStep] = useState<number>(() => (isSignedIn ? loadSavedStep() : 0));
  const [autoRelaunch, setAutoRelaunch] = useState<boolean>(() => {
    try {
      const fromPricing = localStorage.getItem('topsaas_submit_auto_relaunch');
      if (fromPricing === 'true') {
        localStorage.removeItem('topsaas_submit_auto_relaunch');
        return true;
      }
    } catch { }
    return false;
  });
  const [autoRelaunchPaid, setAutoRelaunchPaid] = useState<boolean>(false);
  const [isAutoRelaunchModalOpen, setIsAutoRelaunchModalOpen] = useState(false);
  const [isPayingRelaunch, setIsPayingRelaunch] = useState(false);
  const [relaunchEmail, setRelaunchEmail] = useState('');

  // Automatically persist form inputs and active step on every change ONLY when signed in
  useEffect(() => {
    if (!isSignedIn) {
      clearDraft();
      return;
    }
    if (form.name || form.url || form.tagline) {
      saveDraft(form, step, userId);
    }
  }, [form, step, isSignedIn, userId]);

  // When authentication status changes: if logged out, wipe any cached drafts and reset form
  useEffect(() => {
    if (!isSignedIn) {
      clearDraft();
      setForm({
        ...EMPTY_FORM,
        creatorName: '',
        creatorAvatar: '',
      });
      setStep(0);
      setIsBadgeVerified(false);
      setBadgeVerificationError(null);
    } else {
      const draft = loadDraft();
      if (draft) {
        setForm((prev) => ({
          ...prev,
          creatorName: prev.creatorName || draft.creatorName || defaultCreatorName || '',
          creatorAvatar: prev.creatorAvatar || draft.creatorAvatar || defaultCreatorAvatar || '',
          ...draft,
          logoDataUrl: prev.logoDataUrl || draft.logoDataUrl || '',
          screenshots: prev.screenshots.length > 0 ? prev.screenshots : (draft.screenshots || []),
        }));
        setStep(loadSavedStep());
      } else if (defaultCreatorName || defaultCreatorAvatar) {
        setForm((prev) => ({
          ...prev,
          creatorName: prev.creatorName || defaultCreatorName || '',
          creatorAvatar: prev.creatorAvatar || defaultCreatorAvatar || '',
        }));
      }
    }
  }, [isSignedIn, defaultCreatorName, defaultCreatorAvatar]);

  // Ensure prefilled URL from localStorage (e.g. from HomeHero "Launch Now") is loaded
  useEffect(() => {
    try {
      const prefillUrl = localStorage.getItem('topsaas_submit_initial_url');
      if (prefillUrl) {
        localStorage.removeItem('topsaas_submit_initial_url');
        setForm((prev) => ({ ...prev, url: autoFormatUrl(prefillUrl) }));
        setStep(0);
      }
      const fromPricing = localStorage.getItem('topsaas_submit_auto_relaunch');
      if (fromPricing === 'true') {
        localStorage.removeItem('topsaas_submit_auto_relaunch');
        setAutoRelaunch(true);
      }
    } catch { }
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isAddingShots, setIsAddingShots] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const [launched, setLaunched] = useState<{ id: string; name: string } | null>(null);
  const [freeVerificationMethod, setFreeVerificationMethod] = useState<'upvote' | 'badge'>('upvote');
  const [showAdvancedDetails, setShowAdvancedDetails] = useState<boolean>(() => {
    return Boolean(form.problemItSolves || form.solution || form.uniqueSellingPoint);
  });
  const [fallbackProducts, setFallbackProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!products || products.length === 0) {
      loadProducts().then((res) => {
        if (res && res.length > 0) setFallbackProducts(res);
      }).catch(() => { });
    }
  }, [products]);

  const allAvailableProducts = useMemo(() => {
    if (products && products.length > 0) return products;
    return fallbackProducts;
  }, [products, fallbackProducts]);

  const candidateProducts = useMemo(() => {
    return [...allAvailableProducts]
      .filter((p) => !isSponsorOnlyProduct(p))
      .sort((a, b) => {
        const aUp = isProductUpvoted(a.id, userUpvotes) ? 1 : 0;
        const bUp = isProductUpvoted(b.id, userUpvotes) ? 1 : 0;
        if (aUp !== bUp) return aUp - bUp;
        const rankA = a.rank ?? 9999;
        const rankB = b.rank ?? 9999;
        if (rankA !== rankB) return rankA - rankB;
        return (b.upvotes ?? 0) - (a.upvotes ?? 0);
      })
      .slice(0, 10);
  }, [allAvailableProducts, userUpvotes]);

  const upvotedCount = useMemo(() => {
    if (!allAvailableProducts || allAvailableProducts.length === 0) return 0;
    return allAvailableProducts.filter((p) => isProductUpvoted(p.id, userUpvotes)).length;
  }, [allAvailableProducts, userUpvotes]);

  const isUpvoteRequirementMet = allAvailableProducts.length === 0 || upvotedCount >= 5;

  // ── Launch Tier & Verification States ──
  const [submissionPlan, setSubmissionPlan] = useState<'free' | 'paid_19'>(() => {
    try {
      const fromStorage = localStorage.getItem('topsaas_submit_plan');
      if (fromStorage === 'paid_19' || fromStorage === 'verified') return 'paid_19';
    } catch { }
    return 'free';
  });
  const [showOptionalBadge, setShowOptionalBadge] = useState(false);
  const [showAllVerifiedFeatures, setShowAllVerifiedFeatures] = useState(false);
  const [showAllStarterFeatures, setShowAllStarterFeatures] = useState(false);
  const [isBadgeVerified, setIsBadgeVerified] = useState(false);
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [badgeVerificationError, setBadgeVerificationError] = useState<string | null>(null);
  const [badgeVerificationSuccess, setBadgeVerificationSuccess] = useState<string | null>(null);
  const [badgeStyle, setBadgeStyle] = useState<BadgeStyle>('featured');
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>('dark');
  const [badgeFormat, setBadgeFormat] = useState<BadgeFormat>('html');
  const [copiedBadge, setCopiedBadge] = useState(false);
  // PNG badge variant selected by the user in Step 5
  type BadgeVariant = 'type1-blue' | 'type1-light' | 'type2-blue' | 'type2-light';
  const [badgeVariant, setBadgeVariant] = useState<BadgeVariant>('type1-blue');
  const [customBadgeUrl, setCustomBadgeUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);

  // ── OpenAI Auto-fill States ──
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillSuccess, setAutofillSuccess] = useState(false);

  const categoryRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const screenshotsInputRef = useRef<HTMLInputElement | null>(null);
  const founderPhotoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [isCategoryOpen]);

  const handleAutofill = async () => {
    const rawUrl = form.url.trim();
    if (!rawUrl) {
      setErrors((prev) => ({ ...prev, url: 'Enter your website URL first to auto-fill.' }));
      setBanner('Please enter your website URL before clicking Auto-fill.');
      playSound('click', soundEnabled);
      return;
    }

    const check = normalizeUrl(rawUrl);
    if (!check.ok) {
      setErrors((prev) => ({ ...prev, url: check.error || 'Enter a valid website URL.' }));
      setBanner(check.error || 'Please enter a valid website URL before auto-filling.');
      playSound('click', soundEnabled);
      return;
    }

    if (duplicateListing) {
      const message = duplicateListingMessage(duplicateListing.name);
      setErrors((prev) => ({ ...prev, url: message }));
      setBanner(message);
      playSound('error', soundEnabled);
      return;
    }

    const targetUrl = check.value;
    setIsAutofilling(true);
    setBanner(null);
    setErrors((prev) => ({ ...prev, url: undefined }));

    try {
      const res = await autofillWithOpenAI(targetUrl);

      if (!res.ok || !res.data) {
        setIsAutofilling(false);
        setBanner(formatAutofillErrorMessage(res.error, targetUrl) || 'Failed to auto-fill details from website.');
        return;
      }

      const d = res.data;
      setForm((prev) => {
        const nextCats = (d.categories && d.categories.length > 0)
          ? d.categories
          : (d.category ? [d.category] : prev.categories);

        return {
          ...prev,
          url: targetUrl,
          name: d.name || prev.name,
          tagline: d.tagline || prev.tagline,
          description: d.description || prev.description,
          category: nextCats.length > 0 ? nextCats.join(', ') : (d.category || prev.category),
          categories: nextCats,
          pricingModel: d.pricingModel || prev.pricingModel,
          targetAudience: d.targetAudience || prev.targetAudience,
          problemItSolves: d.problemItSolves || prev.problemItSolves,
          solution: d.solution || prev.solution,
          uniqueSellingPoint: d.uniqueSellingPoint || prev.uniqueSellingPoint,
          twitter: d.twitter ? autoFormatHandle(d.twitter) : prev.twitter,
          github: d.github || prev.github,
          linkedin: d.linkedin || prev.linkedin,
          discord: d.discord || prev.discord,
          youtube: d.youtube || prev.youtube,
          productHunt: d.productHunt || prev.productHunt,
        };
      });

      // Clear any validation errors for auto-filled fields
      setErrors({});
      setBanner(null);
      setIsAutofilling(false);
      setAutofillSuccess(true);
      playSound('success', soundEnabled);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.4 } });
      } catch { }

      setTimeout(() => setAutofillSuccess(false), 3000);
    } catch (err: any) {
      setIsAutofilling(false);
      setBanner(formatAutofillErrorMessage(err?.message, targetUrl) || 'Something went wrong while auto-filling.');
    }
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'url') {
      setIsBadgeVerified(false);
      setBadgeVerificationSuccess(null);
      setBadgeVerificationError(null);
    }
    if ((key === 'name' || key === 'tagline' || key === 'url' || key === 'category') && value) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const toggleCategory = (cat: Category) => {
    playSound('click', soundEnabled);
    setForm((prev) => {
      const exists = prev.categories.includes(cat);
      let nextCats: Category[];
      if (exists) {
        nextCats = prev.categories.filter((c) => c !== cat);
      } else {
        if (prev.categories.length >= 3) {
          setBanner('You can select up to 3 categories.');
          return prev;
        }
        nextCats = [...prev.categories, cat];
      }
      setErrors((errs) => ({ ...errs, category: undefined }));
      return {
        ...prev,
        categories: nextCats,
        category: nextCats.join(', '),
      };
    });
  };

  // ── Per-step validation ──
  const validateStep = (i: number): Partial<Record<FieldKey, string>> => {
    const out: Partial<Record<FieldKey, string>> = {};
    if (i === 0) {
      if (!form.url.trim()) {
        out.url = 'Enter your website URL.';
      } else {
        const check = normalizeUrl(form.url);
        if (!check.ok) {
          out.url = check.error || 'Enter a valid website URL, e.g. https://yourproduct.com';
        } else if (duplicateListing) {
          out.url = duplicateListingMessage(duplicateListing.name);
        }
      }

      if (!form.name.trim()) {
        out.name = 'Enter your product name.';
      } else if (form.name.trim().length < 2) {
        out.name = 'Product name must be at least 2 characters.';
      } else if (form.name.trim().length > 60) {
        out.name = 'Keep the name under 60 characters.';
      }

      if (!form.tagline.trim()) {
        out.tagline = 'Add a one-line tagline for your product.';
      } else if (form.tagline.trim().length < 3) {
        out.tagline = 'Tagline must be at least 3 characters.';
      } else if (form.tagline.trim().length > 80) {
        out.tagline = 'Taglines are capped at 80 characters.';
      }

      if (form.categories.length === 0 && !form.category.trim()) {
        out.category = 'Choose at least one category for your listing.';
      }
    } else if (i === 1) {
      if (form.demoVideoUrl.trim()) {
        const check = normalizeUrl(form.demoVideoUrl);
        if (!check.ok) out.demoVideoUrl = 'Enter a valid video URL or clear this field.';
      }
    }
    return out;
  };

  const isStepComplete = (i: number): boolean => {
    const errs = validateStep(i);
    if (Object.keys(errs).length > 0) return false;
    if (i === 0) {
      return (
        form.name.trim().length >= 2 &&
        form.tagline.trim().length >= 3 &&
        normalizeUrl(form.url).ok &&
        (form.categories.length > 0 || !!form.category.trim())
      );
    }
    if (i === 1) {
      return isStepComplete(0);
    }
    if (i === 2) {
      return isStepComplete(1);
    }
    if (i === 3) {
      if (submissionPlan === 'paid_19') return isStepComplete(2);
      if (freeVerificationMethod === 'upvote') {
        return isStepComplete(2) && isUpvoteRequirementMet;
      }
      return isStepComplete(2) && isBadgeVerified;
    }
    return false;
  };

  const handleTabClick = (targetStep: number) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      playSound('click', soundEnabled);
      setStep(targetStep);
      setErrors({});
      setBanner(null);
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }
    // Moving forwards: validate all prior steps up to targetStep
    for (let s = 0; s < targetStep; s++) {
      const stepErrors = validateStep(s);
      if (Object.keys(stepErrors).length > 0 || !isStepComplete(s)) {
        setStep(s);
        setErrors(stepErrors);
        setBanner(
          s === 0 && duplicateListing
            ? duplicateListingMessage(duplicateListing.name)
            : 'Please fill in the required fields before proceeding to the next step.'
        );
        playSound('click', soundEnabled);
        requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
    }
    playSound('click', soundEnabled);
    setStep(targetStep);
    setErrors({});
    setBanner(null);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0 || !isStepComplete(step)) {
      setErrors(stepErrors);
      setBanner(
        step === 0 && duplicateListing
          ? duplicateListingMessage(duplicateListing.name)
          : 'Please complete the required fields to continue.'
      );
      playSound('click', soundEnabled);
      return;
    }
    setErrors({});
    setBanner(null);
    playSound('click', soundEnabled);
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // ── Logo ──
  const applyLogoFile = async (file: File) => {
    try {
      // 1. Instantly process and set base64 preview for instant UI feedback
      const dataUrl = await processImageFile(file, { maxSide: 256, format: 'image/png' });
      set('logoDataUrl', dataUrl);
      playSound('click', soundEnabled);

      // 2. Upload to Supabase Storage CDN for permanent persistence and small payload
      const cleanPrefix = (form.name || 'product').toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 24) || 'product';
      const cdnUrl = await uploadScreenshotToStorage(file, `${cleanPrefix}-logo`);
      if (cdnUrl) {
        set('logoDataUrl', cdnUrl);
      }
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not process that image.');
    }
  };

  // ── Feature screenshots (up to 4) ──
  const applyScreenshotFiles = async (files: FileList | File[]) => {
    const remaining = 4 - form.screenshots.length;
    if (remaining <= 0) {
      setBanner('You can add up to 4 screenshots.');
      return;
    }
    setIsAddingShots(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        try {
          // Attempt direct upload to Supabase storage to save egress & database size
          const storageUrl = await uploadScreenshotToStorage(file, form.name || 'product');
          if (storageUrl) {
            added.push(storageUrl);
          } else {
            added.push(await processImageFile(file, { maxSide: 1024, format: 'image/jpeg', quality: 0.72 }));
          }
        } catch (err) {
          setBanner(err instanceof Error ? err.message : 'Could not process that screenshot.');
          break;
        }
      }
      if (added.length > 0) {
        set('screenshots', [...form.screenshots, ...added].slice(0, 4));
        playSound('click', soundEnabled);
      }
    } finally {
      setIsAddingShots(false);
    }
  };

  const [draggedScreenshotIndex, setDraggedScreenshotIndex] = useState<number | null>(null);
  const [dragOverScreenshotIndex, setDragOverScreenshotIndex] = useState<number | null>(null);

  const moveScreenshot = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= form.screenshots.length || fromIndex === toIndex) return;
    setForm((prev) => {
      const updated = [...prev.screenshots];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { ...prev, screenshots: updated };
    });
    playSound('click', soundEnabled);
  };

  const removeScreenshot = (index: number) => {
    set('screenshots', form.screenshots.filter((_, i) => i !== index));
    playSound('click', soundEnabled);
  };

  // ── Founder Photo ──
  const applyFounderPhoto = async (file: File) => {
    try {
      const dataUrl = await processImageFile(file, { maxSide: 256, format: 'image/png' });
      // Upload a public copy so the same photo can be reused on the founder's
      // profile without bloating auth metadata with a base64 data URL.
      const cdnUrl = await uploadScreenshotToStorage(file, `founder-avatar-${userId || 'user'}`);
      set('creatorAvatar', cdnUrl || dataUrl);
      playSound('click', soundEnabled);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not process photo.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyLogoFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const file = e.clipboardData?.files?.[0];
    if (file) {
      e.preventDefault();
      applyLogoFile(file);
    }
  };

  // ── Badge Helpers & Verification ──
  const previewProduct: Product = {
    id: `sub-${encodeURIComponent((form.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`,
    name: form.name.trim() || 'Your Product',
    tagline: form.tagline.trim() || 'Featured on TopSAAS',
    url: normalizeUrl(form.url).value || 'https://yourproduct.com',
    category: (form.categories[0] || form.category || 'Developer Tools') as Category,
    rank: 1,
    upvotes: 1,
    clicks: 0,
    logoUrl: form.logoDataUrl || (normalizeUrl(form.url).ok ? getWebsiteFavicon(form.url, 128) : undefined),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // PNG badge snippet — links back to the product's TopSAAS listing so the verifier detects topsaas.space
  const BADGE_IMG_SRCS: Record<string, string> = {
    'type1-blue': 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%201%20-%20blue.png',
    'type1-light': 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%201%20-%20light.png',
    'type2-blue': 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20blue.png',
    'type2-light': 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20light.png',
  };
  const badgeImgSrc = BADGE_IMG_SRCS[badgeVariant];
  const slug = getProductSlug(previewProduct);
  const productListingUrl = `https://topsaas.space/products/${encodeURIComponent(slug)}?ref=badge`;
  const badgeAltText = 'Featured on TopSAAS';
  const badgeEmbedSnippet = badgeFormat === 'markdown'
    ? `[![${badgeAltText}](${badgeImgSrc})](${productListingUrl})`
    : `<a href="${productListingUrl}" target="_blank" rel="noopener">\n  <img src="${badgeImgSrc}" alt="${badgeAltText}" height="36" />\n</a>`;

  const handleCopyBadgeSnippet = async () => {
    playSound('click', soundEnabled);
    try {
      await navigator.clipboard.writeText(badgeEmbedSnippet);
    } catch { }
    setCopiedBadge(true);
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const handleManualConfirmBadge = () => {
    setIsBadgeVerified(true);
    setBadgeVerificationError(null);
    setBadgeVerificationSuccess('Badge placement confirmed. Our team will verify your badge prior to launch approval.');
    playSound('success', soundEnabled);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
  };

  const handleVerifyBadge = async (specificUrl?: string) => {
    setIsVerifyingBadge(true);
    setBadgeVerificationError(null);
    setBadgeVerificationSuccess(null);
    playSound('click', soundEnabled);

    const safeUrl = typeof specificUrl === 'string' ? specificUrl : undefined;
    const rawToVerify = (safeUrl || customBadgeUrl || form.url).trim();
    const check = normalizeUrl(rawToVerify);
    if (!check.ok || !check.value) {
      setBadgeVerificationError('Please provide a valid website URL in Step 1 or enter a specific badge URL.');
      setIsVerifyingBadge(false);
      return;
    }

    const targetUrl = check.value;

    const markVerified = (message: string) => {
      setIsBadgeVerified(true);
      setBadgeVerificationSuccess(message);
      setBadgeVerificationError(null);
      playSound('success', soundEnabled);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    };

    try {
      // Local / private dev environments are not reachable by any verifier.
      if (/localhost|127\.0\.0\.1|192\.168\.|10\.|::1/i.test(targetUrl)) {
        markVerified(`Local development environment (${targetUrl}) detected. Badge verified.`);
        return;
      }

      // 1. Server-side check — no CORS, real user agent, deep scans bundles.
      const edge = await verifyBadgeViaEdge(targetUrl);
      let fetched = edge.fetched;
      let verified = edge.verified;

      // 2. Browser fallback check if server was blocked or didn't find it
      if (!verified) {
        const client = await fetchHtmlBestEffort(targetUrl);
        if (client.fetched && containsBadge(client.html)) {
          verified = true;
          fetched = true;
        }
      }

      if (verified) {
        markVerified(`TopSAAS badge detected on ${targetUrl}! Verification complete.`);
      } else if (edge.blocked) {
        setBadgeVerificationError(
          edge.reason || `Automated verification was blocked by your site's bot protection or Cloudflare. You can confirm badge placement manually below to proceed.`
        );
        playSound('error', soundEnabled);
      } else if (fetched) {
        setBadgeVerificationError(
          `We reached ${targetUrl}, but could not find the TopSAAS badge snippet in your page or bundles. Make sure the snippet is embedded in your HTML or footer, then publish and try again.`
        );
        playSound('error', soundEnabled);
      } else {
        setBadgeVerificationError(
          edge.reason || `We could not reach ${targetUrl} to verify the badge automatically. Please ensure your website is publicly accessible, or confirm badge placement below to proceed.`
        );
        playSound('error', soundEnabled);
      }
    } catch (err) {
      setBadgeVerificationError(
        `Verification check failed: ${err instanceof Error ? err.message : 'Network error'}. Please ensure your website is online and try again, or confirm badge placement below.`
      );
      playSound('error', soundEnabled);
    } finally {
      setIsVerifyingBadge(false);
    }
  };

  // ── Launch ──
  const handleLaunch = async () => {
    // A live listing cannot be submitted again, regardless of which step the user is on.
    if (duplicateListing) {
      const message = duplicateListingMessage(duplicateListing.name);
      setErrors((prev) => ({ ...prev, url: message }));
      setBanner(message);
      setStep(0);
      playSound('error', soundEnabled);
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }

    // Validate every step; jump to the first one with a problem
    const missing: number[] = [];
    for (let i = 0; i < STEPS.length; i++) {
      if (Object.keys(validateStep(i)).length > 0 || !isStepComplete(i)) missing.push(i);
    }
    if (missing.length > 0) {
      const first = missing[0];
      setErrors(validateStep(first));
      setBanner('Some required fields are still empty — they are marked below.');
      setStep(first);
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
    }

    if (submissionPlan === 'free') {
      if (freeVerificationMethod === 'upvote' && !isUpvoteRequirementMet) {
        setBanner(`Please upvote ${Math.max(0, 5 - upvotedCount)} more product${5 - upvotedCount === 1 ? '' : 's'} in Step 4 to unlock your free launch.`);
        setStep(3);
        requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
      if (freeVerificationMethod === 'badge' && !isBadgeVerified) {
        setBanner('Please embed and verify the TopSAAS badge on your website in Step 4 before submitting.');
        setStep(3);
        requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
    }

    if (submissionPlan === 'paid_19') {
      setIsSubmitting(true);
      try {
        // Submit payload without triggering success UI/confetti beforehand
        const newId = await executeSubmission(undefined, undefined, true);
        if (newId) {
          localStorage.setItem('topsaas_pending_paid_submission', JSON.stringify({
            id: newId,
            name: form.name.trim(),
            plan: 'onetime',
          }));

          await redirectToCheckout({
            planType: 'onetime',
            productName: form.name.trim(),
            targetProductId: newId,
            customerEmail: form.creatorXHandle || undefined,
          });
        }
      } catch (err: any) {
        console.error('Fast-Track checkout error:', err);
        setBanner(err?.message || 'Failed to start checkout. Please try again.');
        setIsSubmitting(false);
      }
      return;
    }

    // When users toggle the $5, it does nothing till they click submit
    // Once they click on submit, show the modal so they can pay from there
    if (autoRelaunch && !autoRelaunchPaid) {
      setIsAutoRelaunchModalOpen(true);
      return;
    }

    await executeSubmission();
  };

  const executeSubmission = async (
    overrideAutoRelaunch?: boolean,
    overridePaid?: boolean,
    skipSuccessUi?: boolean
  ): Promise<string | undefined> => {
    // Final guard: never create a submission for a website that is already live.
    if (duplicateListing) {
      const message = duplicateListingMessage(duplicateListing.name);
      setErrors((prev) => ({ ...prev, url: message }));
      setBanner(message);
      setStep(0);
      playSound('error', soundEnabled);
      return undefined;
    }

    setIsSubmitting(true);
    setBanner(null);
    try {
      const check = normalizeUrl(form.url);

      const cleanUrl = (raw: string): string => {
        let u = raw.trim();
        if (!u) return '';
        if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
        return u;
      };

      const socials: ProductSocial[] = [];
      if (form.twitter.trim()) {
        const handle = normalizeTwitterHandle(form.twitter);
        socials.push({ platform: 'x', url: `https://x.com/${handle}` });
      }
      if (form.linkedin.trim()) socials.push({ platform: 'linkedin', url: cleanUrl(form.linkedin) });
      if (form.youtube.trim()) socials.push({ platform: 'youtube', url: cleanUrl(form.youtube) });
      if (form.productHunt.trim()) socials.push({ platform: 'product_hunt', url: cleanUrl(form.productHunt) });
      if (form.github.trim()) socials.push({ platform: 'github', url: cleanUrl(form.github) });
      if (form.discord.trim()) socials.push({ platform: 'discord', url: cleanUrl(form.discord) });
      if (form.appStore.trim()) socials.push({ platform: 'app_store', url: cleanUrl(form.appStore) });
      if (form.playStore.trim()) socials.push({ platform: 'play_store', url: cleanUrl(form.playStore) });
      if (form.chromeWebStore.trim()) socials.push({ platform: 'chrome_web_store', url: cleanUrl(form.chromeWebStore) });
      const finalCategory = form.categories.length > 0 ? (form.categories.join(', ') as Category) : form.category;

      const isRelaunch = overrideAutoRelaunch !== undefined ? overrideAutoRelaunch : (submissionPlan === 'paid_19' ? true : autoRelaunch);
      const isPaid = overridePaid !== undefined ? overridePaid : (submissionPlan === 'paid_19' ? true : autoRelaunchPaid);

      const newId = await onSubmit({
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        url: check.value,
        category: finalCategory,
        description: prepareRichText(form.description) || undefined,
        logoUrl: form.logoDataUrl || undefined,
        screenshots: form.screenshots.length > 0 ? form.screenshots.slice(0, 4) : undefined,
        demoVideoUrl: form.demoVideoUrl ? autoFormatUrl(form.demoVideoUrl) : undefined,
        twitterHandle: normalizeTwitterHandle(form.twitter) || undefined,
        socials: socials.length > 0 ? socials : undefined,
        creatorName: form.creatorName.trim() || defaultCreatorName || undefined,
        creatorXHandle: normalizeTwitterHandle(form.creatorXHandle) || undefined,
        creatorAvatar: form.creatorAvatar || defaultCreatorAvatar || undefined,
        creatorRole: form.creatorRole.trim() || undefined,
        targetAudience: form.targetAudience.trim() || undefined,
        pricingModel: form.pricingModel || undefined,
        problemItSolves: prepareRichText(form.problemItSolves) || undefined,
        solution: prepareRichText(form.solution) || undefined,
        uniqueSellingPoint: prepareRichText(form.uniqueSellingPoint) || undefined,
        offerDiscount: form.offerDiscount.trim() || undefined,
        offerCode: form.offerCode.trim() || undefined,
        offerUrl: form.offerUrl.trim() ? autoFormatUrl(form.offerUrl) : undefined,
        offerDetails: form.offerDetails.trim() || undefined,
        autoRelaunch: isRelaunch || undefined,
        autoRelaunchPaid: (isRelaunch && isPaid) || undefined,
        scheduledLaunchWeek: form.scheduledLaunchWeek,
        scheduledLaunchDate: form.scheduledLaunchDate,
      });

      if (!newId) {
        setBanner('Something went wrong while submitting. Please try again.');
        setIsSubmitting(false);
        return undefined;
      }

      // If skipping success UI (e.g. redirecting to paid checkout first), exit cleanly
      if (skipSuccessUi) {
        return newId;
      }

      playSound('success', soundEnabled);
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: ['#ffffff', '#66cc88', '#9aa5b1'] });
      } catch { }
      clearDraft((form as any).id, userId);
      setLaunched({ id: newId, name: form.name.trim() });
      return newId;
    } catch {
      setBanner('Something went wrong while submitting. Please try again.');
      setIsSubmitting(false);
      return undefined;
    }
  };

  const handleSaveDraft = () => {
    if (!isSignedIn) {
      playSound('click', soundEnabled);
      onSignInRequest();
      return;
    }
    saveDraft(form, step, userId);
    setDraftSaved(true);
    playSound('click', soundEnabled);
    setTimeout(() => setDraftSaved(false), 2600);
  };

  const handleStartOver = () => {
    clearDraft(form.id, userId);
    setForm({
      ...EMPTY_FORM,
      id: userId ? `draft_${userId}_launch` : 'draft_active',
      creatorName: isSignedIn ? (defaultCreatorName || '') : '',
      creatorAvatar: isSignedIn ? (defaultCreatorAvatar || '') : '',
    });
    setErrors({});
    setBanner(null);
    setLaunched(null);
    setStep(0);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  useEffect(() => {
    if (launched) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [launched]);

  // ── Success (Under Review) ──
  if (launched) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans">
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 sm:py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-50 border border-mint-200 text-mint-600 shadow-xs">
            <Clock className="h-8 w-8" strokeWidth={2.5} />
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-mint-50 border border-mint-200 px-3 py-1 text-xs font-bold text-mint-700">
            <span className="h-2 w-2 rounded-full bg-mint-500 animate-pulse" />
            Pending Approval
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">{launched.name} is submitted</h1>
          <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-neutral-500">
            Your launch has been received and under review queue. Once approved your product will automatically appear live in the directory.
          </p>

          <div className="mt-6 w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500">Review status</span>
              <span className="font-bold text-mint-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Pending Approval
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-neutral-200 pt-2.5">
              <span className="text-neutral-500">Turnaround time</span>
              <span className="font-bold text-neutral-950">Usually reviewed within 24 hours</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-neutral-200 pt-2.5">
              <span className="text-neutral-500">Submitted URL</span>
              <span className="font-bold text-neutral-900 truncate max-w-[240px]">{form.url || launched.name}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col w-full sm:w-auto sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="btn-primary px-6 py-3 text-xs font-bold"
            >
              Back to directory
            </button>
            <button
              type="button"
              onClick={handleStartOver}
              className="rounded-xl border border-neutral-200 bg-neutral-100 px-5 py-3 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              Submit another website
            </button>
          </div>
        </div>
      </div>
    );
  }

  const showNameError = step === 0 && !!errors.name;
  const showTaglineError = step === 0 && !!errors.tagline;
  const showUrlError = step === 0 && !!errors.url && !duplicateListing;
  const showCategoryError = step === 0 && !!errors.category;

  const autoLogoPreview = !form.logoDataUrl && normalizeUrl(form.url).ok ? getWebsiteFavicon(form.url, 128) : '';

  const visibleCategories = SUBMISSION_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase().trim())
  );

  return (
    <div className="bg-white text-neutral-900 font-sans flex flex-col flex-1">
      <main className="mx-auto w-full max-w-2xl flex-1 px-3.5 sm:px-6 pb-12 pt-4 sm:pt-6">
        <div ref={panelRef}>
          {/* ── Intro ── */}
          <div className="mb-5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">Submit your website</h1>
            <p className="mt-1 text-[13px] sm:text-sm font-medium text-neutral-500">
              Four quick steps: product details, media & links, founder profile, and launch options.
            </p>
          </div>

          {/* ── Signed-out notice ── */}
          {!isSignedIn && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <p className="text-xs font-medium leading-relaxed text-neutral-600">
                You&apos;re not signed in. Sign in with Google before submitting so the listing is
                linked to your profile — then you can manage it from there.
              </p>
            </div>
          )}

          {/* ── Banner ── */}
          {banner && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {banner}
              </p>
            </div>
          )}

          {/* ── Step tabs ── */}
          <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl border border-neutral-200 bg-white p-1 shadow-2xs" role="tablist" aria-label="Submission steps">
            {STEPS.map((label, i) => {
              const active = step === i;
              const isCompleted = isStepComplete(i) && step > i;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleTabClick(i)}
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-1.5 sm:px-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${active
                    ? 'bg-neutral-950 text-white shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950'
                    }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shrink-0 ${active
                      ? 'bg-mint-500 text-white'
                      : isCompleted
                        ? 'bg-mint-500/20 text-mint-700 border border-mint-500/40'
                        : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                      }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" strokeWidth={3.5} /> : i + 1}
                  </span>
                  <span className="hidden xs:inline sm:inline truncate">{label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Step panels ── */}
          {step === 0 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
              <div>
                <label className={labelClass}>
                  Website URL <span className="text-red-400">*</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={form.url}
                      onChange={(e) => {
                        set('url', e.target.value);
                        if (draftSaved) setDraftSaved(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAutofill();
                        }
                      }}
                      placeholder="https://yourproduct.com"
                      className={inputClass(!!showUrlError)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAutofill()}
                    disabled={isAutofilling || !form.url.trim()}
                    className={`btn-primary rounded-xl px-4 py-2.5 text-xs font-bold shrink-0 cursor-pointer ${autofillSuccess ? '!bg-emerald-600 !border-emerald-700' : ''
                      }`}
                  >
                    {isAutofilling ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Analyzing site...</span>
                      </>
                    ) : autofillSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Filled with AI!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Fill with AI</span>
                      </>
                    )}
                  </button>
                </div>
                <FieldError message={showUrlError ? errors.url : undefined} />
                {duplicateListing && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-bold text-amber-900">
                        Already listed
                      </p>
                      <p className="text-[11px] font-medium leading-relaxed text-amber-800">
                        {duplicateListingMessage(duplicateListing.name)}
                      </p>
                    </div>
                  </div>
                )}
              </div>


              <div className="border-t border-neutral-200 pt-4">
                <label className={labelClass}>
                  Product name <span className="text-red-400">*</span>
                  <span className="float-right font-mono-num text-[10px] font-semibold text-neutral-500">
                    {form.name.length}/60
                  </span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  maxLength={60}
                  onChange={(e) => {
                    set('name', e.target.value);
                    if (draftSaved) setDraftSaved(false);
                  }}
                  placeholder="e.g. TopSAAS"
                  className={inputClass(!!showNameError)}
                />
                <FieldError message={showNameError ? errors.name : undefined} />
              </div>

              <div>
                <label className={labelClass}>
                  Tagline <span className="text-red-400">*</span>
                  <span className="float-right font-mono-num text-[10px] font-semibold text-neutral-500">
                    {form.tagline.length}/80
                  </span>
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  maxLength={80}
                  onChange={(e) => {
                    set('tagline', e.target.value);
                    if (draftSaved) setDraftSaved(false);
                  }}
                  placeholder="A one-line description of what it does"
                  className={inputClass(!!showTaglineError)}
                />
                <FieldError message={showTaglineError ? errors.tagline : undefined} />
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <RichTextEditor
                  value={form.description}
                  onChange={(html) => {
                    set('description', html);
                    if (draftSaved) setDraftSaved(false);
                  }}
                  placeholder="What does it do, and who is it for? Use the toolbar to add bold, lists, links and more."
                  maxLength={2000}
                  minHeightClass="min-h-[150px]"
                  ariaLabel="Description"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className={labelClass}>
                  Target audience
                  <span className="float-right font-mono-num text-[10px] font-semibold text-neutral-500">
                    {form.targetAudience.length}/120
                  </span>
                </label>
                <input
                  type="text"
                  value={form.targetAudience}
                  maxLength={120}
                  onChange={(e) => {
                    set('targetAudience', e.target.value);
                    if (draftSaved) setDraftSaved(false);
                  }}
                  placeholder="e.g. Indie hackers, developers, small teams, marketers"
                  className={inputClass(false)}
                />
                <p className="mt-1 text-[11px] font-medium text-neutral-500">
                  Who is this product built for? Helps people find you in search and category filters.
                </p>
              </div>

              {/* Multi-Category Selection */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass}>
                    Categories <span className="text-red-400">*</span>
                  </label>
                  <span className="font-mono-num text-[11px] font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200">
                    {form.categories.length}/3 selected
                  </span>
                </div>

                {/* Selected categories pill tags */}
                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-xl border border-neutral-200 bg-white">
                    {form.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500/15 border border-mint-500/40 px-2.5 py-1 text-xs font-bold text-mint-700 shadow-2xs"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-mint-500/30 text-mint-600 hover:text-white transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div ref={categoryRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setIsCategoryOpen((o) => !o);
                      setCategorySearch('');
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-sm font-semibold text-neutral-900 transition-all cursor-pointer text-left ${showCategoryError
                      ? 'border-red-500/70'
                      : isCategoryOpen
                        ? 'border-neutral-900 ring-2 ring-neutral-900/10'
                        : 'border-neutral-300 hover:border-neutral-400'
                      }`}
                  >
                    <span className="text-neutral-700 font-medium">
                      {form.categories.length > 0
                        ? `${form.categories.length} category${form.categories.length > 1 ? 'ies' : ''} selected — click to manage`
                        : 'Choose up to 3 categories...'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>

                  {isCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl border border-neutral-200 bg-white p-2 shadow-2xl space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                        <input
                          type="text"
                          autoFocus
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search 25+ categories..."
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                        {visibleCategories.length === 0 ? (
                          <div className="p-3 text-center text-xs text-neutral-500">No matching categories</div>
                        ) : (
                          visibleCategories.map((cat) => {
                            const selected = form.categories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => toggleCategory(cat)}
                                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${selected
                                  ? 'bg-mint-500/20 font-bold text-mint-700'
                                  : 'font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                                  }`}
                              >
                                <span className="truncate">{cat}</span>
                                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-mint-600 stroke-[3]" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <FieldError message={showCategoryError ? errors.category : undefined} />
              </div>

              {/* Pricing */}
              <div className="border-t border-neutral-200 pt-4">
                <label className={labelClass}>Pricing model</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PRICING_OPTIONS.map((opt) => {
                    const selected = form.pricingModel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          playSound('click', soundEnabled);
                          set('pricingModel', selected ? '' : opt.value);
                        }}
                        className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${selected
                          ? 'border-neutral-950 bg-neutral-950 text-white'
                          : 'border-neutral-200 bg-white hover:border-neutral-400 text-neutral-900'
                          }`}
                      >
                        <span className={`block text-xs font-bold ${selected ? 'text-white' : 'text-neutral-900'}`}>
                          {opt.value}
                        </span>
                        <span className={`block text-[10px] font-medium ${selected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Collapsible Advanced Details (Problem, Solution, Different) ── */}
              <div className="border-t border-neutral-200 pt-4">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 transition-all">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setShowAdvancedDetails((prev) => !prev);
                    }}
                    className="flex w-full items-center justify-between text-left cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-neutral-200 shadow-2xs text-neutral-900 shrink-0">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-neutral-950">
                            Add Advanced Details
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600 shadow-2xs">
                            Optional
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Problem, solution, what makes it different, and special offers
                        </p>
                      </div>
                    </div>
                    <div className="h-6 w-6 rounded-lg border border-neutral-200 flex items-center justify-center bg-white shadow-2xs shrink-0">
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-neutral-700 transition-transform duration-200 ${
                          showAdvancedDetails ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {showAdvancedDetails && (
                    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4 animate-in fade-in-50 duration-150">
                      <div>
                        <label className={labelClass}>Problem it solves</label>
                        <RichTextEditor
                          value={form.problemItSolves}
                          onChange={(html) => set('problemItSolves', html)}
                          placeholder="What pain point does it address?"
                          maxLength={600}
                          minHeightClass="min-h-[96px]"
                          ariaLabel="Problem it solves"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Your solution</label>
                        <RichTextEditor
                          value={form.solution}
                          onChange={(html) => set('solution', html)}
                          placeholder="How does it solve that problem?"
                          maxLength={600}
                          minHeightClass="min-h-[96px]"
                          ariaLabel="Your solution"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>What makes it different</label>
                        <RichTextEditor
                          value={form.uniqueSellingPoint}
                          onChange={(html) => set('uniqueSellingPoint', html)}
                          placeholder="What sets it apart from alternatives?"
                          maxLength={600}
                          minHeightClass="min-h-[96px]"
                          ariaLabel="What makes it different"
                        />
                      </div>

                      {/* Special Offer & Viewer Discount */}
                      <div className="border-t border-neutral-200 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-mint-500/15 text-mint-600 border border-mint-500/30">
                              <Tag className="h-3.5 w-3.5" />
                            </div>
                            <h3 className="text-xs font-bold text-neutral-950 flex items-center gap-1.5">
                              <span>Special Offer & Discount</span>
                              <span className="rounded bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.5 text-[9px] font-black text-mint-600">
                                Boosts Clicks
                              </span>
                            </h3>
                          </div>
                          <span className="text-[10px] font-semibold text-neutral-500">
                            Optional
                          </span>
                        </div>

                        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 space-y-3.5">
                          {/* Preset chips for quick fill */}
                          <div>
                            <div className="text-[10px] font-bold text-neutral-600 mb-1.5">
                              Quick Discount Presets:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {['10% OFF', '20% OFF', '30% OFF', '50% OFF', 'Free Trial', 'Lifetime Deal'].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    playSound('click', soundEnabled);
                                    set('offerDiscount', preset);
                                    if (!form.offerCode) {
                                      const num = preset.match(/\d+/)?.[0] || 'DEAL';
                                      set('offerCode', `TOPSAAS${num}`);
                                    }
                                  }}
                                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${form.offerDiscount === preset
                                    ? 'bg-mint-500 text-white border border-mint-400 shadow-2xs'
                                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-950'
                                    }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelClass}>
                                Discount / Offer Headline
                              </label>
                              <input
                                type="text"
                                value={form.offerDiscount}
                                maxLength={50}
                                onChange={(e) => set('offerDiscount', e.target.value)}
                                placeholder="e.g. 20% OFF or 50% Lifetime"
                                className={inputClass(false)}
                              />
                            </div>

                            <div>
                              <label className={labelClass}>
                                Promo / Coupon Code
                              </label>
                              <input
                                type="text"
                                value={form.offerCode}
                                maxLength={30}
                                onChange={(e) => set('offerCode', e.target.value.toUpperCase())}
                                placeholder="e.g. TOPSAAS20"
                                className={`${inputClass(false)} font-mono font-bold tracking-wider`}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className={labelClass}>
                                Offer Redemption URL
                              </label>
                              <input
                                type="url"
                                value={form.offerUrl}
                                onChange={(e) => set('offerUrl', e.target.value)}
                                onBlur={(e) => {
                                  const formatted = autoFormatUrl(e.target.value);
                                  if (formatted !== e.target.value) set('offerUrl', formatted);
                                }}
                                placeholder="e.g. https://yoursite.com/deal or checkout link"
                                className={inputClass(false)}
                              />
                            </div>

                            <div>
                              <label className={labelClass}>
                                Offer Details / Terms
                              </label>
                              <input
                                type="text"
                                value={form.offerDetails}
                                maxLength={100}
                                onChange={(e) => set('offerDetails', e.target.value)}
                                placeholder="e.g. Valid on first year of annual plans"
                                className={inputClass(false)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : autoLogoPreview ? (
                    <img src={autoLogoPreview} alt="Site favicon preview" className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold  text-neutral-600">Logo</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onPaste={handlePaste}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={handleDrop}
                    className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors outline-none ${isDraggingLogo
                      ? 'border-neutral-900 bg-neutral-50'
                      : 'border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50/50'
                      }`}
                  >
                    {form.logoDataUrl ? (
                      <>
                        <p className="text-xs font-bold text-neutral-900">Logo uploaded</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            set('logoDataUrl', '');
                          }}
                          className="rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                        >
                          Remove and upload another
                        </button>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-neutral-900">Upload logo</p>
                    )}
                    <p className="text-[10px] font-medium text-neutral-500">
                      Click, drop, or paste a square image — large files are compressed automatically
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) applyLogoFile(file);
                      e.target.value = '';
                    }}
                  />
                  <p className="mt-2 text-[11px] font-medium text-neutral-500">
                    {form.logoDataUrl
                      ? 'Your logo is used on directory cards and your listing page.'
                      : autoLogoPreview
                        ? 'No logo needed — your website favicon will be used automatically.'
                        : 'The logo is used on directory cards. Leave it empty to use the favicon of your website.'}
                  </p>
                </div>
              </div>

              {/* Feature screenshots gallery (up to 4) */}
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-neutral-900">Feature screenshots</label>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Drag to reorder or use the arrow buttons. The first image (#1) is your primary listing cover.
                    </p>
                  </div>
                  <span className="font-mono-num text-[11px] font-bold text-neutral-700 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-200 shrink-0">
                    {form.screenshots.length}/4
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                  {form.screenshots.map((src, i) => {
                    const isFirst = i === 0;
                    const isLast = i === form.screenshots.length - 1;
                    const isDragging = draggedScreenshotIndex === i;
                    const isDragOver = dragOverScreenshotIndex === i;

                    return (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => {
                          setDraggedScreenshotIndex(i);
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', String(i));
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverScreenshotIndex !== i) {
                            setDragOverScreenshotIndex(i);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedScreenshotIndex !== null && draggedScreenshotIndex !== i) {
                            moveScreenshot(draggedScreenshotIndex, i);
                          }
                          setDraggedScreenshotIndex(null);
                          setDragOverScreenshotIndex(null);
                        }}
                        onDragEnd={() => {
                          setDraggedScreenshotIndex(null);
                          setDragOverScreenshotIndex(null);
                        }}
                        className={`group relative aspect-video overflow-hidden rounded-xl border bg-[#1f1f1f] shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing ${isDragOver
                          ? 'border-mint-500 ring-2 ring-mint-500/50 scale-[1.03] z-10'
                          : isDragging
                            ? 'opacity-40 border-neutral-600'
                            : isFirst
                              ? 'border-mint-500/50 hover:border-mint-500/80'
                              : 'border-neutral-200 hover:border-neutral-500'
                          }`}
                      >
                        <img
                          src={src}
                          alt={`Screenshot ${i + 1} of ${form.name || 'your product'}`}
                          className="h-full w-full object-cover pointer-events-none select-none"
                        />

                        {/* Order / Cover Badge */}
                        <div className="absolute left-2 top-2 z-10">
                          {isFirst ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-mint-500 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                              <Star className="h-3 w-3 fill-white" />
                              <span>#1 Cover</span>
                            </span>
                          ) : (
                            <span className="rounded-md bg-black/80 backdrop-blur-xs border border-neutral-200/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-200 shadow-md">
                              #{i + 1}
                            </span>
                          )}
                        </div>

                        {/* Delete Button (Top Right) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeScreenshot(i);
                          }}
                          aria-label={`Remove screenshot ${i + 1}`}
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-black/80 text-neutral-300 hover:bg-red-600 hover:text-white border border-neutral-200/60 hover:border-red-500 transition-all cursor-pointer shadow-md"
                          title="Delete screenshot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        {/* Bottom Overlay Controls: Move Left, Make Cover, Move Right */}
                        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                          {/* Move Left Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveScreenshot(i, i - 1);
                            }}
                            disabled={isFirst}
                            aria-label="Move left"
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/90 border border-neutral-200/60 text-white hover:bg-mint-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Move earlier in gallery"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>

                          {/* Quick 'Set as Cover' button for non-cover images */}
                          {!isFirst && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveScreenshot(i, 0);
                              }}
                              className="rounded-md bg-neutral-800/90 border border-neutral-200/60 px-2 py-0.5 text-[9px] font-bold text-neutral-300 hover:text-mint-600 hover:border-mint-500/60 transition-all cursor-pointer"
                              title="Set this screenshot as main cover (#1)"
                            >
                              Set as Cover
                            </button>
                          )}

                          {/* Move Right Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveScreenshot(i, i + 1);
                            }}
                            disabled={isLast}
                            aria-label="Move right"
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/90 border border-neutral-200/60 text-white hover:bg-mint-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Move later in gallery"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {form.screenshots.length < 4 && (
                    <button
                      type="button"
                      onClick={() => screenshotsInputRef.current?.click()}
                      disabled={isAddingShots}
                      className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-950 disabled:opacity-60"
                    >
                      {isAddingShots ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-[10px] font-semibold">Adding…</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base font-black leading-none">+</span>
                          <span className="text-[10px] font-semibold">Add screenshot</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  ref={screenshotsInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) applyScreenshotFiles(files);
                    e.target.value = '';
                  }}
                />
              </div>

              {/* Demo Video URL Input */}
              <div className="mt-6 border-t border-neutral-200 pt-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-mint-600" />
                    <span>Demo Video URL</span>
                  </label>
                  <span className="text-[10px] font-semibold text-neutral-500">
                    Optional
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={form.demoVideoUrl}
                    onChange={(e) => {
                      set('demoVideoUrl', e.target.value);
                      if (draftSaved) setDraftSaved(false);
                    }}
                    onBlur={(e) => {
                      const formatted = autoFormatUrl(e.target.value);
                      if (formatted !== e.target.value) set('demoVideoUrl', formatted);
                    }}
                    placeholder="https://www.youtube.com/watch?v=... or Loom / Vimeo link"
                    className={inputClass(false)}
                  />
                  {form.demoVideoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        set('demoVideoUrl', '');
                        if (draftSaved) setDraftSaved(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-neutral-500">
                  Add a YouTube, Loom, Vimeo, or video link demonstrating your product. It will be showcased on your listing page.
                </p>
              </div>

              {/* Social & Distribution Links */}
              <div className="mt-6 border-t border-neutral-200 pt-6 space-y-4">
                <div>
                  <h2 className="text-[11px] font-bold text-neutral-700">
                    Social & Distribution Links
                  </h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    Add links to your community, repositories, and app store listings (optional).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* X / Twitter */}
                  <div>
                    <label className={labelClass}>X (Twitter)</label>
                    <input
                      type="text"
                      value={form.twitter}
                      maxLength={120}
                      onChange={(e) => set('twitter', e.target.value)}
                      placeholder="https://x.com/yourproduct or @yourproduct"
                      className={inputClass(false)}
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label className={labelClass}>LinkedIn</label>
                    <input
                      type="text"
                      value={form.linkedin}
                      maxLength={160}
                      onChange={(e) => set('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourproduct"
                      className={inputClass(false)}
                    />
                  </div>

                  {/* YouTube */}
                  <div>
                    <label className={labelClass}>YouTube</label>
                    <input
                      type="text"
                      value={form.youtube}
                      maxLength={160}
                      onChange={(e) => set('youtube', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel or video"
                      className={inputClass(false)}
                    />
                  </div>

                  {/* Product Hunt */}
                  <div>
                    <label className={labelClass}>Product Hunt</label>
                    <input
                      type="text"
                      value={form.productHunt}
                      maxLength={160}
                      onChange={(e) => set('productHunt', e.target.value)}
                      placeholder="https://producthunt.com/products/yourproduct"
                      className={inputClass(false)}
                    />
                  </div>

                  {/* GitHub */}
                  <div>
                    <label className={labelClass}>GitHub</label>
                    <input
                      type="text"
                      value={form.github}
                      maxLength={160}
                      onChange={(e) => set('github', e.target.value)}
                      placeholder="https://github.com/yourusername/yourrepo"
                      className={inputClass(false)}
                    />
                  </div>

                  {/* Discord */}
                  <div>
                    <label className={labelClass}>Discord</label>
                    <input
                      type="text"
                      value={form.discord}
                      maxLength={160}
                      onChange={(e) => set('discord', e.target.value)}
                      placeholder="https://discord.gg/yourserver"
                      className={inputClass(false)}
                    />
                  </div>

                  {/* Apple App Store */}
                  <div>
                    <label className={labelClass}>Apple App Store</label>
                    <input
                      type="text"
                      value={form.appStore}
                      maxLength={200}
                      onChange={(e) => set('appStore', e.target.value)}
                      placeholder="https://apps.apple.com/app/id..."
                      className={inputClass(false)}
                    />
                  </div>

                  {/* Google Play Store */}
                  <div>
                    <label className={labelClass}>Google Play Store</label>
                    <input
                      type="text"
                      value={form.playStore}
                      maxLength={200}
                      onChange={(e) => set('playStore', e.target.value)}
                      placeholder="https://play.google.com/store/apps/details?id=..."
                      className={inputClass(false)}
                    />
                  </div>

                  {/* Chrome Extension */}
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Chrome Web Store Extension</label>
                    <input
                      type="text"
                      value={form.chromeWebStore}
                      maxLength={200}
                      onChange={(e) => set('chromeWebStore', e.target.value)}
                      placeholder="https://chromewebstore.google.com/detail/..."
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-6">
              {/* Founder Profile Picture */}
              <div>
                <label className={labelClass}>Founder profile picture</label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-neutral-200 bg-white">
                  {/* Photo Preview */}
                  <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border-2 border-neutral-200 bg-white flex items-center justify-center shadow-md">
                    {form.creatorAvatar ? (
                      <img src={form.creatorAvatar} alt="Founder preview" className="h-full w-full object-cover" />
                    ) : defaultCreatorAvatar ? (
                      <img src={defaultCreatorAvatar} alt="Account avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-mint-600">
                        {(form.creatorName || defaultCreatorName || 'F').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Actions & info */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="text-xs font-bold text-neutral-950">
                      {form.creatorAvatar
                        ? 'Custom photo selected'
                        : defaultCreatorAvatar
                          ? 'Showing photo from your signed-in account'
                          : 'No photo selected (initial badge will be used)'}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Square JPG or PNG, auto-compressed for quick loading.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => founderPhotoInputRef.current?.click()}
                        className="rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        {form.creatorAvatar ? 'Change photo' : 'Upload custom photo'}
                      </button>
                      {form.creatorAvatar && defaultCreatorAvatar && form.creatorAvatar !== defaultCreatorAvatar && (
                        <button
                          type="button"
                          onClick={() => set('creatorAvatar', defaultCreatorAvatar)}
                          className="rounded-lg border border-neutral-200 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
                        >
                          Use Google photo
                        </button>
                      )}
                      {form.creatorAvatar && (
                        <button
                          type="button"
                          onClick={() => set('creatorAvatar', '')}
                          className="rounded-lg border border-neutral-200 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={founderPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) applyFounderPhoto(file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Founder Name */}
              <div className="border-t border-neutral-200 pt-5">
                <label className={labelClass}>Founder / Maker name</label>
                <input
                  type="text"
                  value={form.creatorName}
                  maxLength={60}
                  onChange={(e) => set('creatorName', e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className={inputClass(false)}
                />
                <p className="mt-1.5 text-[11px] font-medium text-neutral-500">
                  Your display name shown next to your listing.
                </p>
              </div>

              {/* Personal X Handle */}
              <div className="border-t border-neutral-200 pt-5">
                <label className={labelClass}>Personal X (Twitter) profile</label>
                <input
                  type="text"
                  value={form.creatorXHandle}
                  maxLength={80}
                  onChange={(e) => set('creatorXHandle', e.target.value)}
                  onBlur={(e) => {
                    const formatted = autoFormatHandle(e.target.value);
                    if (formatted !== e.target.value) set('creatorXHandle', formatted);
                  }}
                  placeholder="@alexrivera or https://x.com/alexrivera"
                  className={inputClass(false)}
                />
                <p className="mt-1.5 text-[11px] font-medium text-neutral-500">
                  Allows visitors to follow your maker journey directly on X.
                </p>
              </div>

              {/* Role / Title */}
              <div className="border-t border-neutral-200 pt-5">
                <label className={labelClass}>Role or title</label>
                <input
                  type="text"
                  value={form.creatorRole}
                  maxLength={50}
                  onChange={(e) => set('creatorRole', e.target.value)}
                  placeholder="e.g. Founder & Solo Maker"
                  className={inputClass(false)}
                />
                {/* Quick Role Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Solo Founder', 'Founder & CEO', 'Creator & Maker', 'Lead Engineer', 'Indie Builder'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => set('creatorRole', role)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${form.creatorRole === role
                        ? 'bg-mint-500/15 text-mint-700 border border-mint-500/40'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:text-neutral-950 hover:border-neutral-400 hover:bg-neutral-50'
                        }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Step 3: Launch Options & Pricing Plan ── */}
          {step === 3 && (
            <section className="space-y-6 animate-in fade-in-50 duration-200">
              {/* 1. Choose Your Launch Plan */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold text-neutral-700">1. Choose Your Launch Plan</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">Select how you want to launch your product on TopSAAS.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch pt-3">
                  {/* Option 1: Starter (Free Forever) */}
                  <div
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setSubmissionPlan('free');
                    }}
                    className={`relative rounded-3xl border transition-all cursor-pointer flex flex-col justify-between p-5 sm:p-6 ${submissionPlan === 'free'
                      ? 'border-neutral-900 bg-white shadow-xl shadow-neutral-900/5 ring-2 ring-neutral-950'
                      : 'border-neutral-200/90 bg-white hover:border-neutral-300 hover:shadow-md'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-lg sm:text-2xl font-black text-neutral-950 tracking-tight whitespace-nowrap">Starter</h4>
                        <span className={`shrink-0 whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 rounded-full ${submissionPlan === 'free'
                          ? 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border border-neutral-200 bg-neutral-100 text-neutral-600'
                          }`}>
                          {submissionPlan === 'free' ? 'Selected' : 'Free Forever'}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500 leading-relaxed mt-1 mb-2">
                        Your launch partner. Unlock directory visibility with a free submission.
                      </p>

                      <div className="flex items-baseline gap-2 my-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">Free Plan</span>
                      </div>

                      <div className="pt-2 mb-4 space-y-2.5">
                        <p className="text-[11px] font-bold text-neutral-500">
                          Get started with:
                        </p>
                        <ul className="space-y-2.5 text-xs sm:text-[13px] text-neutral-700 font-medium">
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span><strong>TopSAAS badge required</strong> on your website</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span>Public SaaS directory listing</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span>Community upvote ranking & discovery</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span>Dedicated product profile page</span>
                          </li>

                          {/* Expandable Starter Details */}
                          {showAllStarterFeatures && (
                            <>
                              <li className="flex items-start gap-2.5 leading-snug animate-in fade-in-50 duration-150">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                                  <Check className="h-3 w-3 stroke-[3]" />
                                </div>
                                <span>Standard community review queue</span>
                              </li>
                              <li className="flex items-start gap-2.5 text-neutral-400 leading-snug animate-in fade-in-50 duration-150">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 text-neutral-400 mt-0.5">
                                  <X className="h-3 w-3 stroke-[2.5]" />
                                </div>
                                <span>nofollow link only</span>
                              </li>
                              <li className="flex items-start gap-2.5 text-neutral-400 leading-snug animate-in fade-in-50 duration-150">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 border border-neutral-200 text-neutral-400 mt-0.5">
                                  <X className="h-3 w-3 stroke-[2.5]" />
                                </div>
                                <span>No verified badge</span>
                              </li>
                            </>
                          )}
                        </ul>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click', soundEnabled);
                            setShowAllStarterFeatures((prev) => !prev);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer py-1"
                        >
                          <span>{showAllStarterFeatures ? 'Show fewer details' : '+ 3 more details'}</span>
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAllStarterFeatures ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click', soundEnabled);
                        setSubmissionPlan('free');
                      }}
                      className={`w-full rounded-2xl py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${submissionPlan === 'free'
                        ? 'border border-neutral-900 bg-neutral-950 text-white shadow-xs'
                        : 'border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 shadow-2xs'
                        }`}
                    >
                      <span>{submissionPlan === 'free' ? 'Selected ✓' : 'Select Starter →'}</span>
                    </button>
                  </div>

                  {/* Option 2: Verified Launch ($5 / Product · One-time) with Overlapping Tag */}
                  <div
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setSubmissionPlan('paid_19');
                      setAutoRelaunch(false);
                    }}
                    className={`relative rounded-3xl border transition-all cursor-pointer flex flex-col justify-between p-5 sm:p-6 bg-gradient-to-b from-blue-50/60 via-slate-50/40 to-white ${submissionPlan === 'paid_19'
                      ? 'border-blue-600 shadow-xl shadow-blue-500/10 ring-2 ring-blue-600'
                      : 'border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                      }`}
                  >
                    {/* Overlapping Most Popular Tag */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3.5 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-blue-600/25">
                        <Sparkles className="h-3 w-3 fill-white/20" />
                        <span>Most Popular</span>
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-lg sm:text-2xl font-black text-neutral-950 tracking-tight whitespace-nowrap">Verified Launch</h4>
                          <VerifiedBadge className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                        </div>
                        {submissionPlan === 'paid_19' && (
                          <span className="shrink-0 whitespace-nowrap text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700">
                            Selected
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 leading-relaxed mt-1 mb-2">
                        Fast-track 24h approval, category top-3 spot (7 days), dofollow SEO backlink, and verified badge.
                      </p>

                      <div className="flex items-baseline gap-2 my-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight font-sans">$5.00</span>
                        <span className="text-xs font-semibold text-neutral-500 font-sans">/Product (One-time)</span>
                      </div>

                      <div className="pt-2 mb-4 space-y-2.5">
                        <p className="text-[11px] font-bold text-neutral-700">
                          Everything in Starter, plus:
                        </p>
                        <ul className="space-y-2.5 text-xs sm:text-[13px] text-neutral-800 font-medium">
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span><strong>Live within 24 hours</strong> (skip 14-day queue)</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span><strong>Permanent High-Authority DoFollow backlink</strong></span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span><strong>Official Verified Mint Badge</strong> on card & profile</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span><strong>Pinned Top 3</strong> in your primary category (7 Days)</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span><strong>1,000+ word story on /blog</strong></span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span>Indexed in <strong>/llms.txt</strong> for AI search (ChatGPT, Perplexity and more)</span>
                          </li>
                          <li className="flex items-start gap-2.5 leading-snug">
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-600 mt-0.5">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                            <span>Lifetime listing — <strong>zero recurring subscription fees</strong></span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click', soundEnabled);
                        setSubmissionPlan('paid_19');
                        setAutoRelaunch(false);
                      }}
                      className="w-full rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white py-3 px-4 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-neutral-950/20"
                    >
                      <span>{submissionPlan === 'paid_19' ? 'Selected ✓' : 'Get Verified Launch — $5 →'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Plan Specific Options */}
              {submissionPlan === 'paid_19' ? (
                /* ── Fast-Track ($5) Details ── */
                <div className="space-y-4 border-t border-neutral-200 pt-5">
                  <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-slate-50/40 to-white p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-sm">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-neutral-950 text-xs sm:text-sm">No website badge required for Fast-Track ($5)</p>
                      <p className="text-[11px] sm:text-xs text-neutral-600 leading-relaxed">
                        You do not need to add any badge or backlink to your site. Your submission will bypass website verification, jump straight into the expedited 24-hour review queue, and receive permanent DoFollow SEO value upon approval.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowOptionalBadge((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 pt-1 cursor-pointer"
                      >
                        <span>{showOptionalBadge ? 'Hide optional badge snippet' : 'Want to display a badge anyway? (Optional)'}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform ${showOptionalBadge ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Optional Badge Code for Fast-Track users if they want it */}
                  {showOptionalBadge && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 space-y-4 animate-in fade-in-50 duration-150">
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-neutral-700">CHOOSE YOUR OPTIONAL BADGE</p>
                        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                          {([
                            { id: 'type1-blue', src: '/Share%20Badge/TopSAAS%20Type%201%20-%20blue.png', label: 'Type 1 · Blue', bg: 'bg-[#1a2580]' },
                            { id: 'type1-light', src: '/Share%20Badge/TopSAAS%20Type%201%20-%20light.png', label: 'Type 1 · Light', bg: 'bg-white' },
                            { id: 'type2-blue', src: '/Share%20Badge/TopSAAS%20Type%202%20-%20blue.png', label: 'Type 2 · Blue', bg: 'bg-[#1a2580]' },
                            { id: 'type2-light', src: '/Share%20Badge/TopSAAS%20Type%202%20-%20light.png', label: 'Type 2 · Light', bg: 'bg-white' },
                          ] as { id: BadgeVariant; src: string; label: string; bg: string }[]).map(({ id, src, label, bg }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => { playSound('click', soundEnabled); setBadgeVariant(id); }}
                              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 sm:p-2.5 transition-all cursor-pointer ${badgeVariant === id
                                ? 'border-mint-500 shadow-sm shadow-mint-500/20'
                                : 'border-neutral-200 hover:border-neutral-400'
                                } ${bg}`}
                            >
                              {badgeVariant === id && (
                                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-mint-500">
                                  <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                                </span>
                              )}
                              <img src={src} alt={label} className="h-6 sm:h-7.5 w-auto max-w-[85%] object-contain" draggable={false} />
                              <span className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-full ${id.endsWith('light') ? 'text-neutral-700' : 'text-white/85'
                                }`}>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative rounded-xl border border-neutral-200 bg-[#17171a] p-3 font-mono text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all pr-16">{badgeEmbedSnippet}</pre>
                        <button
                          type="button"
                          onClick={handleCopyBadgeSnippet}
                          className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${copiedBadge ? 'bg-mint-500 text-white' : 'bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-300'
                            }`}
                        >
                          {copiedBadge ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedBadge ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Free Plan: Upvote 5 Products OR Embed Website Badge ── */
                <div className="space-y-5 border-t border-neutral-200 pt-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-neutral-900">2. Free Verification Requirement</p>
                      <span className="text-[11px] font-semibold text-neutral-500">Choose one option below</span>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl border border-neutral-200 bg-neutral-100/70">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setFreeVerificationMethod('upvote');
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                          freeVerificationMethod === 'upvote'
                            ? 'bg-white text-neutral-950 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-950'
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        <span>Upvote 5 Products</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">Instant</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setFreeVerificationMethod('badge');
                        }}
                        className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
                          freeVerificationMethod === 'badge'
                            ? 'bg-white text-neutral-950 shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-950'
                        }`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-mint-600" />
                        <span>Embed Website Badge</span>
                      </button>
                    </div>
                  </div>

                  {freeVerificationMethod === 'upvote' ? (
                    /* ── In-Place 5 Upvote Section ── */
                    <div className="space-y-4 animate-in fade-in-50 duration-150">
                      {/* Progress Tracker Card */}
                      <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-4 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold text-neutral-900">
                            Community Upvote Progress
                          </span>
                          {isUpvoteRequirementMet ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap">
                              <Check className="h-3 w-3 stroke-[3]" />
                              {upvotedCount}/5 upvoted — Free Launch Unlocked!
                            </span>
                          ) : (
                            <span className="font-bold text-neutral-700 text-[11px] bg-white border border-neutral-200 px-2.5 py-0.5 rounded-full shadow-2xs whitespace-nowrap">
                              {upvotedCount}/5 upvoted ·{' '}
                              <span className="text-blue-600 font-extrabold">{Math.max(0, 5 - upvotedCount)} left</span>
                            </span>
                          )}
                        </div>

                        <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden mt-2.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isUpvoteRequirementMet ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((upvotedCount / 5) * 100))}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
                          {isUpvoteRequirementMet
                            ? 'Great job! You have upvoted at least 5 products. You can now launch your product for free below.'
                            : 'Click the ▲ button on any 5 products below to support community makers and unlock your free launch right here.'}
                        </p>
                      </div>

                      {/* Embedded Live Directory Products List */}
                      <div className="border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                        <div className="bg-neutral-100/70 border-b border-neutral-200 px-3.5 py-2 text-[11px] font-bold text-neutral-600 flex items-center justify-between gap-2">
                          <span>Pick apps to upvote</span>
                          <span>Click ▲ to upvote</span>
                        </div>

                        <div className="max-h-[340px] overflow-y-auto divide-y divide-neutral-100">
                          {candidateProducts.length === 0 ? (
                            <div className="p-8 text-center text-xs text-neutral-400">
                              No directory products available right now.
                            </div>
                          ) : (
                            candidateProducts.map((prod, index) => {
                              const upvoted = isProductUpvoted(prod.id, userUpvotes);
                              const logoSrc = prod.logoUrl || getWebsiteFavicon(prod.url);

                              return (
                                <div
                                  key={prod.id}
                                  className={`flex items-center gap-3 p-3 transition-colors ${
                                    upvoted ? 'bg-mint-50/25' : 'hover:bg-neutral-50/70'
                                  }`}
                                >
                                  {/* Directory Rank */}
                                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] font-black text-neutral-600 font-mono-num">
                                    #{prod.rank ?? index + 1}
                                  </div>

                                  {/* Product Logo */}
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
                                    <ProductLogo
                                      src={logoSrc}
                                      alt={prod.name}
                                      containerClassName="h-full w-full flex items-center justify-center"
                                      iconClassName="h-4 w-4 text-neutral-400"
                                    />
                                  </div>

                                  {/* Product Info */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-xs sm:text-sm text-neutral-950 truncate">
                                        {prod.name}
                                      </span>
                                      {prod.url && (
                                        <a
                                          href={prod.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                                          title="Visit website"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      )}
                                      {prod.category && (
                                        <span className="hidden sm:inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200/60 truncate max-w-[100px]">
                                          {prod.category.split(',')[0].trim()}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                      {prod.tagline}
                                    </p>
                                  </div>

                                  {/* Upvote Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onUpvote?.(prod);
                                    }}
                                    title={upvoted ? 'Remove upvote' : 'Upvote this product'}
                                    className={`flex flex-col items-center justify-center rounded-xl border py-1 px-2.5 min-w-[46px] transition-all cursor-pointer active:scale-95 shrink-0 ${
                                      upvoted
                                        ? 'border-mint-500 bg-mint-500 text-white shadow-2xs'
                                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 shadow-2xs'
                                    }`}
                                  >
                                    <ChevronUp
                                      className={`h-4 w-4 ${
                                        upvoted ? 'text-white' : 'text-neutral-900 fill-neutral-900'
                                      }`}
                                    />
                                    <span className="text-[10px] font-mono-num font-bold">
                                      {prod.upvotes ?? 0}
                                    </span>
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── Embed Website Badge Section ── */
                    <div className="space-y-5 animate-in fade-in-50 duration-150">
                      {/* Badge Picker */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-neutral-700">Choose Your Badge Style</p>
                        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                          {([
                            { id: 'type1-blue', src: '/Share%20Badge/TopSAAS%20Type%201%20-%20blue.png', label: 'Type 1 · Blue', bg: 'bg-[#1a2580]' },
                            { id: 'type1-light', src: '/Share%20Badge/TopSAAS%20Type%201%20-%20light.png', label: 'Type 1 · Light', bg: 'bg-white' },
                            { id: 'type2-blue', src: '/Share%20Badge/TopSAAS%20Type%202%20-%20blue.png', label: 'Type 2 · Blue', bg: 'bg-[#1a2580]' },
                            { id: 'type2-light', src: '/Share%20Badge/TopSAAS%20Type%202%20-%20light.png', label: 'Type 2 · Light', bg: 'bg-white' },
                          ] as { id: BadgeVariant; src: string; label: string; bg: string }[]).map(({ id, src, label, bg }) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => { playSound('click', soundEnabled); setBadgeVariant(id); }}
                              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 p-2 sm:p-2.5 transition-all cursor-pointer ${badgeVariant === id
                                ? 'border-mint-500 shadow-sm shadow-mint-500/20'
                                : 'border-neutral-200 hover:border-neutral-400'
                                } ${bg}`}
                            >
                              {badgeVariant === id && (
                                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-mint-500">
                                  <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                                </span>
                              )}
                              <img
                                src={src}
                                alt={label}
                                className="h-6 sm:h-7.5 w-auto max-w-[85%] object-contain"
                                draggable={false}
                              />
                              <span className={`text-[9px] sm:text-[10px] font-bold text-center leading-tight truncate max-w-full ${id.endsWith('light') ? 'text-neutral-700' : 'text-white/85'
                                }`}>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Copy Code Snippet */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">Copy Snippet to Your Website</span>
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-neutral-200 text-[11px]">
                            <button
                              type="button"
                              onClick={() => setBadgeFormat('html')}
                              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${badgeFormat === 'html' ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'}`}
                            >
                              HTML
                            </button>
                            <button
                              type="button"
                              onClick={() => setBadgeFormat('markdown')}
                              className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${badgeFormat === 'markdown' ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'}`}
                            >
                              Markdown
                            </button>
                          </div>
                        </div>

                        <div className="relative rounded-xl border border-neutral-200 bg-[#17171a] p-3 font-mono text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-all pr-16">{badgeEmbedSnippet}</pre>
                          <button
                            type="button"
                            onClick={handleCopyBadgeSnippet}
                            className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${copiedBadge ? 'bg-mint-500 text-white' : 'bg-white text-neutral-800 hover:bg-neutral-100 border border-neutral-300'
                              }`}
                          >
                            {copiedBadge ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedBadge ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Place this badge in your website footer, homepage, or docs. Verify the badge before submitting.
                        </p>
                      </div>

                      {/* Badge Verification */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-neutral-900">Verify Placement</span>
                          <span className="text-[11px] text-neutral-500">Target: <code className="font-mono text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">{customBadgeUrl || form.url || 'your website'}</code></span>
                        </div>

                        {isBadgeVerified ? (
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500 text-white shrink-0">
                                <Check className="h-4 w-4 stroke-[3]" />
                              </div>
                              <div>
                                <p className="font-bold text-emerald-950 text-xs">TopSAAS Badge Verified!</p>
                                <p className="text-[11px] text-emerald-700">
                                  {badgeVerificationSuccess || 'Badge confirmed on your website. The submit button is now unlocked below.'}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsBadgeVerified(false);
                                setBadgeVerificationSuccess(null);
                              }}
                              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                            >
                              Re-check
                            </button>
                          </div>
                        ) : badgeVerificationError ? (
                          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-800 space-y-3 shadow-2xs">
                            <div className="flex items-start gap-3">
                              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                                <AlertCircle className="h-4 w-4" />
                              </div>
                              <div className="space-y-1.5 flex-1">
                                <p className="font-bold text-neutral-900 text-xs">Badge Not Detected Yet</p>
                                <p className="text-[11px] text-neutral-600 leading-relaxed">{badgeVerificationError}</p>
                                <div className="pt-2 flex items-center gap-2 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyBadge()}
                                    disabled={isVerifyingBadge}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    {isVerifyingBadge ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                                    <span>Try verifying again</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                                    className="rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-800 px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer"
                                  >
                                    {showCustomUrlInput ? 'Hide alternate URL' : 'Badge on another page?'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Alternate Page URL input */}
                            {showCustomUrlInput && (
                              <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2">
                                <label className="text-[11px] font-bold text-neutral-700 block">
                                  Enter the specific page where the badge is embedded:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="url"
                                    value={customBadgeUrl}
                                    onChange={(e) => setCustomBadgeUrl(e.target.value)}
                                    placeholder="https://yourproduct.com/footer or https://docs.yourproduct.com"
                                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleVerifyBadge(customBadgeUrl)}
                                    disabled={isVerifyingBadge || !customBadgeUrl.trim()}
                                    className="rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer shrink-0"
                                  >
                                    Verify URL
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Manual Confirmation Fallback */}
                            <div className="border-t border-neutral-200 pt-3 flex items-center justify-between gap-3">
                              <p className="text-[11px] text-neutral-500">
                                Behind Cloudflare, SPA, or private environment?
                              </p>
                              <button
                                type="button"
                                onClick={handleManualConfirmBadge}
                                className="text-[11px] font-bold text-neutral-900 hover:text-mint-600 underline cursor-pointer shrink-0"
                              >
                                Confirm badge placement manually →
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs text-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                            <div className="space-y-0.5">
                              <p className="font-bold text-neutral-900 text-xs">Ready to verify badge?</p>
                              <p className="text-[11px] text-neutral-500">
                                Paste the snippet into your website footer or homepage, then click verify.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleVerifyBadge()}
                                disabled={isVerifyingBadge}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                              >
                                {isVerifyingBadge ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Verifying…</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="h-3.5 w-3.5 text-mint-400" />
                                    <span>Verify Badge Now</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Target Launch Round / Date Picker */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs">
                <LaunchWeekSelector
                  selectedWeekNumber={form.scheduledLaunchWeek}
                  onSelectWeek={(weekNum, weekStartDate) => {
                    setForm((prev) => ({
                      ...prev,
                      scheduledLaunchWeek: weekNum,
                      scheduledLaunchDate: weekStartDate,
                    }));
                  }}
                  products={products}
                  submissions={submissions}
                  soundEnabled={soundEnabled}
                />
              </div>

              {/* Weekly Relaunch Add-on (only shown for free plan, as it is already included in $19 plan) */}
              {submissionPlan !== 'paid_19' && (
                <div
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setAutoRelaunch((prev) => !prev);
                  }}
                  className={`rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer select-none ${autoRelaunch
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/30 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                    }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 text-xl font-bold">
                        🚀
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-neutral-950">Auto Weekly Relaunch</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            +$5 / week
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                          Relaunch into active weekly voting rounds every Sunday automatically. Re-engage the community, reset weekly votes, and get fresh homepage exposure every week.
                        </p>
                        {autoRelaunch && (
                          <p className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>Selected: Payment of $5 will be prompted when you click Submit</span>
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Switch */}
                    <span
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${autoRelaunch ? 'bg-blue-600' : 'bg-neutral-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${autoRelaunch ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                      />
                    </span>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-2xs">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="text-[11px] font-bold text-neutral-500 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            {draftSaved ? 'Draft saved' : 'Save draft'}
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => handleTabClick(step - 1)}
                className="btn-secondary px-4 py-2.5 text-xs font-bold"
              >
                Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary px-5 py-2.5 text-xs font-bold"
              >
                Continue
              </button>
            ) : isSignedIn ? (
              submissionPlan === 'paid_19' ? (
                <button
                  type="button"
                  data-ml-goal="checkout_click"
                  data-ml-goal-plan="verified_launch"
                  onClick={handleLaunch}
                  disabled={isSubmitting}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-black cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting & Redirecting…</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Launch Now - $5</span>
                    </>
                  )}
                </button>
              ) : freeVerificationMethod === 'badge' && !isBadgeVerified ? (
                <button
                  type="button"
                  onClick={() => handleVerifyBadge()}
                  disabled={isVerifyingBadge}
                  className="btn-primary inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black cursor-pointer shadow-sm active:scale-95"
                >
                  {isVerifyingBadge ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying badge…</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verify badge</span>
                    </>
                  )}
                </button>
              ) : freeVerificationMethod === 'upvote' && !isUpvoteRequirementMet ? (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setBanner(`Please upvote ${Math.max(0, 5 - upvotedCount)} more product${5 - upvotedCount === 1 ? '' : 's'} above to unlock free launch.`);
                  }}
                  className="rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-700 px-5 py-2.5 text-xs font-bold cursor-pointer hover:bg-neutral-200 transition-colors shadow-2xs"
                >
                  <span>Upvote 5 products ({upvotedCount}/5)</span>
                </button>
              ) : (
                <button
                  type="button"
                  data-ml-goal={autoRelaunch ? 'checkout_click' : 'submit_free_launch'}
                  data-ml-goal-plan={autoRelaunch ? 'weekly_relaunch' : 'free'}
                  onClick={handleLaunch}
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 text-xs font-black transition-all rounded-xl select-none ${isSubmitting
                    ? 'btn-primary opacity-80 cursor-wait'
                    : autoRelaunch
                      ? 'btn-primary bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 cursor-pointer'
                      : 'btn-primary cursor-pointer'
                    }`}
                  title={
                    autoRelaunch
                      ? 'Submit website with Weekly Relaunch ($5/week)'
                      : 'Submit website for review'
                  }
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting…
                    </span>
                  ) : autoRelaunch ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span>🚀</span>
                      <span>Submit with Weekly Relaunch — $5 (Paid)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white/90" />
                      <span>Submit</span>
                    </span>
                  )}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onSignInRequest}
                className="btn-primary px-5 py-2.5 text-xs font-black"
              >
                Sign in to submit
              </button>
            )}
          </div>
        </div>

        {/* ── Auto Weekly Relaunch Checkout Modal ── */}
        {isAutoRelaunchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg rounded-3xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsAutoRelaunchModalOpen(false);
                  playSound('click', soundEnabled);
                }}
                className="absolute top-4 right-4 rounded-full p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl shadow-lg shadow-blue-500/25">
                  🚀
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-neutral-950">Auto Weekly Relaunch</h3>
                    <span className="rounded-full bg-blue-100 border border-blue-200 px-2.5 py-0.5 text-[11px] font-black text-blue-800">
                      Add-on
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Automate your product traction with continuous weekly round re-entry
                  </p>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-neutral-950">$5</span>
                    <span className="text-xs font-bold text-neutral-600"> / week</span>
                  </div>
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                    Cancel anytime
                  </span>
                </div>
                <p className="mt-2 text-xs text-blue-950 leading-relaxed font-medium">
                  Every Sunday at 00:00, your SaaS is automatically relaunched into the active voting round. Your weekly votes reset, giving your product 52 high-traffic chances per year to win top rosettes and rank #1.
                </p>
              </div>

              {/* What you get */}
              <div className="space-y-2.5 text-xs text-neutral-700">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-neutral-950">Automated Weekly Rounds:</strong> Hands-free re-entry every Sunday at 00:00 without lifting a finger.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-neutral-950">Podium & Rosette Contender:</strong> Continuous eligibility for Top 3 Product of the Week accolades.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-neutral-950">Live /accept Admin Monitoring:</strong> Tagged with VIP Auto-Relaunch monitoring on the administrator dashboard.
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-800">
                  Billing Email
                </label>
                <input
                  type="email"
                  value={relaunchEmail}
                  onChange={(e) => setRelaunchEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600/30"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    setAutoRelaunch(false);
                    setAutoRelaunchPaid(false);
                    setIsAutoRelaunchModalOpen(false);
                    playSound('click', soundEnabled);
                    await executeSubmission(false, false);
                  }}
                  className="w-full sm:w-auto text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors py-2 text-center cursor-pointer"
                >
                  Submit Free (Skip Relaunch)
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAutoRelaunchModalOpen(false);
                      playSound('click', soundEnabled);
                    }}
                    className="rounded-xl border border-neutral-200 px-4 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isPayingRelaunch}
                    onClick={async () => {
                      setIsPayingRelaunch(true);
                      playSound('click', soundEnabled);
                      try {
                        const newId = await executeSubmission(true, true);
                        const returnUrl = encodeURIComponent(
                          `${window.location.origin}/payment-success?plan=weekly_relaunch&product=${encodeURIComponent(form.name.trim())}${newId ? `&target_product_id=${encodeURIComponent(newId)}` : ''
                          }`
                        );
                        const emailParam = relaunchEmail.trim() ? `&email=${encodeURIComponent(relaunchEmail.trim())}` : '';
                        const whopUrl = appendTrackkitParams(`https://whop.com/checkout/plan_81SmEHd2w16EG?redirect_url=${returnUrl}${emailParam}`);
                        window.location.href = whopUrl;
                      } catch (err) {
                        console.error('Whop checkout error:', err);
                        setIsPayingRelaunch(false);
                      }
                    }}
                    data-ml-goal="checkout_click"
                    data-ml-goal-plan="weekly_relaunch"
                    className="btn-primary flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-black text-white shadow-md shadow-blue-600/25 cursor-pointer flex-1 sm:flex-none"
                  >
                    {isPayingRelaunch ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Redirecting…</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Launch Now - $5</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SubmitPage;
