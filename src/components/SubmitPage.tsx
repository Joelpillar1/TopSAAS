import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Loader2, Search, Video, X, Tag, Percent, Gift, Sparkles, Trash2, GripVertical, Star } from 'lucide-react';
import { Category, PricingModel, ProductSocial, SubmitProductDetails } from '../types';
import { SUBMISSION_CATEGORIES } from './BidModal';
import { getWebsiteFavicon } from '../utils/logo';
import { playSound } from '../utils/sound';

const DRAFT_KEY = 'topsaas_launch_draft_v1';
const STEP_KEY = 'topsaas_launch_step_v1';

const PRICING_OPTIONS: { value: PricingModel; hint: string }[] = [
  { value: 'Free', hint: 'No cost to use' },
  { value: 'Freemium', hint: 'Free tier + paid upgrade' },
  { value: 'Paid', hint: 'Requires payment' },
  { value: 'Open Source', hint: 'Source code available' },
];

const STEPS = ['Website', 'Media', 'Details', 'Founder'] as const;

interface FormState {
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
}

type FieldKey = 'name' | 'tagline' | 'url' | 'category' | 'demoVideoUrl';

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

function saveDraft(state: FormState, currentStep?: number) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    if (typeof currentStep === 'number') {
      localStorage.setItem(STEP_KEY, String(currentStep));
    }
  } catch {
    // Quota exceeded: retry saving without large image data URLs
    try {
      const lightweight = { ...state, screenshots: [], logoDataUrl: '' };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(lightweight));
    } catch {
      /* storage completely unavailable */
    }
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(STEP_KEY);
  } catch {
    /* ignore */
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
    return { ok: true, value: u };
  } catch {
    return { ok: false, value: u, error: 'Enter a valid URL, e.g. https://yourproduct.com' };
  }
}

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
  defaultCreatorName?: string;
  defaultCreatorAvatar?: string;
  onBack: () => void;
  onSignInRequest: () => void;
  onSubmit: (details: SubmitProductDetails) => Promise<string | null | undefined>;
  onViewListing: (productId: string) => void;
  soundEnabled: boolean;
}

const inputClass = (invalid: boolean) =>
  `w-full rounded-xl border bg-[#222222] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 transition-shadow ${
    invalid
      ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/25'
      : 'border-neutral-700 focus:border-neutral-400 focus:ring-neutral-500/25'
  }`;

const labelClass = 'mb-1.5 block text-xs font-bold text-neutral-200';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-red-400">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

export const SubmitPage: React.FC<SubmitPageProps> = ({
  isSignedIn,
  defaultCreatorName = '',
  defaultCreatorAvatar = '',
  onBack,
  onSignInRequest,
  onSubmit,
  onViewListing,
  soundEnabled,
}) => {
  const [form, setForm] = useState<FormState>(() => {
    const draft = loadDraft();
    const initial: FormState = {
      ...EMPTY_FORM,
      creatorName: defaultCreatorName || '',
      creatorAvatar: defaultCreatorAvatar || '',
      ...draft,
    };
    if (draft?.categories && draft.categories.length > 0 && !draft.category) {
      initial.category = draft.categories.join(', ');
    } else if (draft?.category && (!draft.categories || draft.categories.length === 0)) {
      initial.categories = draft.category.split(',').map((c) => c.trim() as Category).filter(Boolean);
    }
    return initial;
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const [step, setStep] = useState<number>(() => loadSavedStep());

  // Automatically persist form inputs and active step on every change
  useEffect(() => {
    saveDraft(form, step);
  }, [form, step]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isAddingShots, setIsAddingShots] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const [launched, setLaunched] = useState<{ id: string; name: string } | null>(null);

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

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
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
        if (!check.ok) out.url = check.error || 'Enter a valid website URL, e.g. https://yourproduct.com';
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
    } else if (i === 1) {
      if (form.demoVideoUrl.trim()) {
        const check = normalizeUrl(form.demoVideoUrl);
        if (!check.ok) out.demoVideoUrl = 'Enter a valid video URL or clear this field.';
      }
    } else if (i === 2) {
      if (form.categories.length === 0 && !form.category.trim()) {
        out.category = 'Choose at least one category for your listing.';
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
        normalizeUrl(form.url).ok
      );
    }
    if (i === 1) {
      return isStepComplete(0);
    }
    if (i === 2) {
      return isStepComplete(0) && (form.categories.length > 0 || !!form.category.trim());
    }
    if (i === 3) {
      return isStepComplete(0) && isStepComplete(2);
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
        setBanner('Please fill in the required fields before proceeding to the next step.');
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
      setBanner('Please complete the required fields to continue.');
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
      const dataUrl = await processImageFile(file, { maxSide: 256, format: 'image/png' });
      set('logoDataUrl', dataUrl);
      playSound('click', soundEnabled);
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Could not process that image.');
    }
  };

  // ── Feature screenshots (up to 10) ──
  const applyScreenshotFiles = async (files: FileList | File[]) => {
    const remaining = 10 - form.screenshots.length;
    if (remaining <= 0) {
      setBanner('You can add up to 10 screenshots.');
      return;
    }
    setIsAddingShots(true);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        try {
          added.push(await processImageFile(file, { maxSide: 1024, format: 'image/jpeg', quality: 0.72 }));
        } catch (err) {
          setBanner(err instanceof Error ? err.message : 'Could not process that screenshot.');
          break;
        }
      }
      if (added.length > 0) {
        set('screenshots', [...form.screenshots, ...added].slice(0, 10));
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
      set('creatorAvatar', dataUrl);
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

  // ── Launch ──
  const handleLaunch = async () => {
    // Validate every step; jump to the first one with a problem
    const missing: number[] = [];
    for (let i = 0; i < STEPS.length; i++) {
      if (Object.keys(validateStep(i)).length > 0) missing.push(i);
    }
    if (missing.length > 0) {
      const first = missing[0];
      setErrors(validateStep(first));
      setBanner('Some required fields are still empty — they are marked below.');
      setStep(first);
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      return;
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

      const newId = await onSubmit({
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        url: check.value,
        category: finalCategory,
        description: form.description.trim() || undefined,
        logoUrl: form.logoDataUrl || undefined,
        screenshots: form.screenshots.length > 0 ? form.screenshots.slice(0, 10) : undefined,
        demoVideoUrl: form.demoVideoUrl ? autoFormatUrl(form.demoVideoUrl) : undefined,
        twitterHandle: normalizeTwitterHandle(form.twitter) || undefined,
        socials: socials.length > 0 ? socials : undefined,
        creatorName: form.creatorName.trim() || defaultCreatorName || undefined,
        creatorXHandle: normalizeTwitterHandle(form.creatorXHandle) || undefined,
        creatorAvatar: form.creatorAvatar || defaultCreatorAvatar || undefined,
        creatorRole: form.creatorRole.trim() || undefined,
        targetAudience: form.targetAudience.trim() || undefined,
        pricingModel: form.pricingModel || undefined,
        problemItSolves: form.problemItSolves.trim() || undefined,
        solution: form.solution.trim() || undefined,
        uniqueSellingPoint: form.uniqueSellingPoint.trim() || undefined,
        offerDiscount: form.offerDiscount.trim() || undefined,
        offerCode: form.offerCode.trim() || undefined,
        offerUrl: form.offerUrl.trim() ? autoFormatUrl(form.offerUrl) : undefined,
        offerDetails: form.offerDetails.trim() || undefined,
      });

      if (!newId) {
        setBanner('Something went wrong while submitting. Please try again.');
        setIsSubmitting(false);
        return;
      }

      playSound('success', soundEnabled);
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.55 }, colors: ['#ffffff', '#66cc88', '#9aa5b1'] });
      } catch {}
      clearDraft();
      setLaunched({ id: newId, name: form.name.trim() });
    } catch {
      setBanner('Something went wrong while submitting. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    saveDraft(form);
    setDraftSaved(true);
    playSound('click', soundEnabled);
    setTimeout(() => setDraftSaved(false), 2600);
  };

  const handleStartOver = () => {
    clearDraft();
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setBanner(null);
    setLaunched(null);
    setStep(0);
    requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  // ── Success (Under Review) ──
  if (launched) {
    return (
      <div className="min-h-screen bg-[#222222] text-neutral-100 font-sans">
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg">
            <Clock className="h-8 w-8" strokeWidth={2.5} />
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Pending Approval
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-white">{launched.name} is submitted</h1>
          <p className="mt-2 max-w-md text-xs sm:text-sm leading-relaxed text-neutral-400">
            Your launch has been received and under review queue. Once approved your product will automatically appear live in the directory.
          </p>

          <div className="mt-6 w-full rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 text-left space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Review status</span>
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Pending Approval
              </span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-neutral-800 pt-2.5">
              <span className="text-neutral-400">Turnaround time</span>
              <span className="font-bold text-white">Usually reviewed within 24 hours</span>
            </div>
            <div className="flex items-center justify-between text-xs border-t border-neutral-800 pt-2.5">
              <span className="text-neutral-400">Submitted URL</span>
              <span className="font-bold text-neutral-300 truncate max-w-[240px]">{form.url || launched.name}</span>
            </div>
          </div>

          <div className="mt-7 flex flex-col w-full sm:w-auto sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl bg-white px-6 py-3 text-xs font-black text-[#0b0f14] hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md"
            >
              Back to directory
            </button>
            <button
              type="button"
              onClick={handleStartOver}
              className="rounded-xl border border-neutral-700 bg-[#343434] px-5 py-3 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white active:scale-[0.98] transition-all cursor-pointer"
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
  const showUrlError = step === 0 && !!errors.url;
  const showCategoryError = step === 2 && !!errors.category;

  const autoLogoPreview = !form.logoDataUrl && normalizeUrl(form.url).ok ? getWebsiteFavicon(form.url, 128) : '';

  const visibleCategories = SUBMISSION_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase().trim())
  );

  return (
    <div className="bg-[#222222] text-neutral-100 font-sans flex flex-col flex-1">
      <main className="mx-auto w-full max-w-2xl flex-1 px-3.5 sm:px-6 pb-12 pt-4 sm:pt-6">
        <div ref={panelRef}>
          {/* ── Intro ── */}
          <div className="mb-5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Submit your website</h1>
            <p className="mt-1 text-[13px] sm:text-sm font-medium text-neutral-400">
              Four quick steps: website details, media & video, directory specs, and founder profile.
            </p>
          </div>

          {/* ── Signed-out notice ── */}
          {!isSignedIn && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-neutral-800 bg-[#343434] px-4 py-3">
              <p className="text-xs font-medium leading-relaxed text-neutral-400">
                You&apos;re not signed in. Sign in with Google before submitting so the listing is
                linked to your profile — then you can manage it from there.
              </p>
            </div>
          )}

          {/* ── Banner ── */}
          {banner && (
            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-semibold text-red-300">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {banner}
              </p>
            </div>
          )}

          {/* ── Step tabs ── */}
          <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-1" role="tablist" aria-label="Submission steps">
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
                  className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-1.5 sm:px-2 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#0b0f14] shadow-2xs'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shrink-0 ${
                      active
                        ? 'bg-[#0b0f14] text-white'
                        : isCompleted
                        ? 'bg-mint-500/20 text-mint-400 border border-mint-500/40'
                        : 'bg-neutral-800 text-neutral-400'
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
            <section className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-6 shadow-xs space-y-4">
              <div>
                <label className={labelClass}>
                  Website URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.url}
                  onChange={(e) => {
                    set('url', e.target.value);
                    if (draftSaved) setDraftSaved(false);
                  }}
                  placeholder="https://yourproduct.com"
                  className={inputClass(!!showUrlError)}
                />
                <FieldError message={showUrlError ? errors.url : undefined} />
              </div>


              <div className="border-t border-neutral-800 pt-4">
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
                <label className={labelClass}>
                  Description
                  <span className="float-right font-mono-num text-[10px] font-semibold text-neutral-500">
                    {form.description.length}/2000
                  </span>
                </label>
                <textarea
                  value={form.description}
                  maxLength={2000}
                  rows={5}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What does it do, and who is it for?"
                  className={`${inputClass(false)} resize-y leading-relaxed`}
                />
                <p className="mt-1.5 text-[11px] font-medium text-neutral-600">
                  Optional — shown on your listing page under About.
                </p>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-800 bg-[#222222]">
                  {form.logoDataUrl ? (
                    <img src={form.logoDataUrl} alt="Logo preview" className="h-full w-full object-contain" />
                  ) : autoLogoPreview ? (
                    <img src={autoLogoPreview} alt="Site favicon preview" className="h-8 w-8 object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Logo</span>
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
                    className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors outline-none ${
                      isDraggingLogo
                        ? 'border-white bg-white/5'
                        : 'border-neutral-700 bg-[#222222] hover:border-neutral-500'
                    }`}
                  >
                    {form.logoDataUrl ? (
                      <>
                        <p className="text-xs font-bold text-neutral-200">Logo uploaded</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            set('logoDataUrl', '');
                          }}
                          className="rounded-lg border border-neutral-700 bg-[#343434] px-2.5 py-1 text-[11px] font-bold text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
                        >
                          Remove and upload another
                        </button>
                      </>
                    ) : (
                      <p className="text-xs font-bold text-neutral-300">Upload logo</p>
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

              {/* Feature screenshots gallery (up to 10) */}
              <div className="mt-6 border-t border-neutral-800 pt-6">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <div>
                    <label className="text-sm font-bold text-neutral-200">Feature screenshots</label>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Drag to reorder or use the arrow buttons. The first image (#1) is your primary listing cover.
                    </p>
                  </div>
                  <span className="font-mono-num text-[11px] font-bold text-neutral-400 bg-[#222222] px-2 py-0.5 rounded-md border border-neutral-700 shrink-0">
                    {form.screenshots.length}/10
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
                        className={`group relative aspect-video overflow-hidden rounded-xl border bg-[#1f1f1f] shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing ${
                          isDragOver
                            ? 'border-mint-500 ring-2 ring-mint-500/50 scale-[1.03] z-10'
                            : isDragging
                            ? 'opacity-40 border-neutral-600'
                            : isFirst
                            ? 'border-mint-500/50 hover:border-mint-500/80'
                            : 'border-neutral-700 hover:border-neutral-500'
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
                            <span className="inline-flex items-center gap-1 rounded-md bg-mint-500 px-2 py-0.5 text-[10px] font-black text-[#0b0f14] shadow-md">
                              <Star className="h-3 w-3 fill-[#0b0f14]" />
                              <span>#1 Cover</span>
                            </span>
                          ) : (
                            <span className="rounded-md bg-black/80 backdrop-blur-xs border border-neutral-700/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-200 shadow-md">
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
                          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-black/80 text-neutral-300 hover:bg-red-600 hover:text-white border border-neutral-700/60 hover:border-red-500 transition-all cursor-pointer shadow-md"
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
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/90 border border-neutral-700/60 text-white hover:bg-mint-500 hover:text-[#0b0f14] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                              className="rounded-md bg-neutral-800/90 border border-neutral-700/60 px-2 py-0.5 text-[9px] font-bold text-neutral-300 hover:text-mint-300 hover:border-mint-500/60 transition-all cursor-pointer"
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
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/90 border border-neutral-700/60 text-white hover:bg-mint-500 hover:text-[#0b0f14] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                            title="Move later in gallery"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {form.screenshots.length < 10 && (
                    <button
                      type="button"
                      onClick={() => screenshotsInputRef.current?.click()}
                      disabled={isAddingShots}
                      className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-700 bg-[#222222] text-neutral-500 transition-colors hover:border-neutral-500 hover:text-neutral-300 disabled:opacity-60"
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
                <p className="mt-2 text-[11px] font-medium text-neutral-500">
                  Optional — up to 10 screenshots, shown in a gallery on your listing page in this exact order.
                </p>
              </div>

              {/* Demo Video URL Input */}
              <div className="mt-6 border-t border-neutral-800 pt-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                    <Video className="h-4 w-4 text-mint-400" />
                    <span>Demo Video URL</span>
                  </label>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-neutral-500">
                  Add a YouTube, Loom, Vimeo, or video link demonstrating your product. It will be showcased on your listing page.
                </p>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-6 shadow-xs space-y-6">
              {/* Multi-Category Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass}>
                    Categories <span className="text-red-400">*</span>
                  </label>
                  <span className="font-mono-num text-[11px] font-bold text-neutral-400 bg-[#222222] px-2 py-0.5 rounded-md border border-neutral-700">
                    {form.categories.length}/3 selected
                  </span>
                </div>

                {/* Selected categories pill tags */}
                {form.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-xl border border-neutral-800 bg-[#222222]">
                    {form.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500/15 border border-mint-500/40 px-2.5 py-1 text-xs font-bold text-mint-200 shadow-2xs"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-mint-500/30 text-mint-300 hover:text-white transition-colors cursor-pointer"
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
                    className={`w-full flex items-center justify-between rounded-xl border bg-[#222222] px-3.5 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer text-left ${
                      showCategoryError
                        ? 'border-red-500/70'
                        : isCategoryOpen
                          ? 'border-white ring-2 ring-white/15'
                          : 'border-neutral-700 hover:border-neutral-500'
                    }`}
                  >
                    <span className="text-neutral-400 font-medium">
                      {form.categories.length > 0
                        ? `${form.categories.length} category${form.categories.length > 1 ? 'ies' : ''} selected — click to manage`
                        : 'Choose up to 3 categories...'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200 ${
                        isCategoryOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl border border-neutral-700 bg-[#343434] p-2 shadow-2xl space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                        <input
                          type="text"
                          autoFocus
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search 25+ categories..."
                          className="w-full rounded-lg border border-neutral-700 bg-[#222222] pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:border-neutral-400 focus:outline-none"
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
                                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors cursor-pointer ${
                                  selected
                                    ? 'bg-mint-500/20 font-bold text-mint-200'
                                    : 'font-medium text-neutral-400 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span className="truncate">{cat}</span>
                                {selected && <Check className="h-3.5 w-3.5 shrink-0 text-mint-300 stroke-[3]" />}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Toggle Popular Categories */}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 self-center mr-1">
                    Popular:
                  </span>
                  {['AI Tools', 'Developer Tools', 'Productivity', 'SaaS & Indie', 'Marketing & SEO', 'Design & UI'].map(
                    (cat) => {
                      const active = form.categories.includes(cat as Category);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat as Category)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                            active
                              ? 'bg-mint-500/20 text-mint-200 border border-mint-500/50 shadow-2xs'
                              : 'bg-[#222222] text-neutral-400 border border-neutral-700 hover:text-white hover:border-neutral-500'
                          }`}
                        >
                          {active ? `✓ ${cat}` : `+ ${cat}`}
                        </button>
                      );
                    }
                  )}
                </div>

                <FieldError message={showCategoryError ? errors.category : undefined} />
                <p className="mt-1.5 text-[11px] font-medium text-neutral-600">
                  Select up to 3 relevant categories to maximize visibility across directory filters.
                </p>
              </div>

              {/* Pricing */}
              <div className="border-t border-neutral-800 pt-5">
                <label className={labelClass}>Pricing model</label>
                <div className="grid grid-cols-2 gap-2">
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
                        className={`rounded-xl border px-3 py-2.5 text-left transition-all cursor-pointer ${
                          selected
                            ? 'border-white bg-white'
                            : 'border-neutral-700 bg-[#222222] hover:border-neutral-500'
                        }`}
                      >
                        <span className={`block text-xs font-bold ${selected ? 'text-[#0b0f14]' : 'text-neutral-200'}`}>
                          {opt.value}
                        </span>
                        <span className={`block text-[10px] font-medium ${selected ? 'text-neutral-600' : 'text-neutral-500'}`}>
                          {opt.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-neutral-600">
                  Optional — shown on your listing page.
                </p>
              </div>

              {/* Special Offer & Viewer Discount */}
              <div className="border-t border-neutral-800 pt-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-mint-500/15 text-mint-400 border border-mint-500/30">
                      <Tag className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Special Offer & Discount</span>
                        <span className="rounded bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.5 text-[9px] font-black text-mint-300 uppercase tracking-wider">
                          Boosts Clicks
                        </span>
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Offer TopSAAS viewers a discount code or promo to drive conversions and early customers.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Optional
                  </span>
                </div>

                <div className="rounded-xl border border-neutral-700/80 bg-[#222222] p-3.5 sm:p-4 space-y-3.5">
                  {/* Preset chips for quick fill */}
                  <div>
                    <div className="text-[10px] font-bold text-neutral-400 mb-1.5 uppercase tracking-wider">
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
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                            form.offerDiscount === preset
                              ? 'bg-mint-500 text-[#0b0f14] border border-mint-400 shadow-2xs'
                              : 'bg-[#2a2a2a] text-neutral-300 border border-neutral-700 hover:border-neutral-500 hover:text-white'
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
                      <p className="mt-1 text-[10px] text-neutral-500">
                        Shown as a badge on directory cards & listing page.
                      </p>
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
                      <p className="mt-1 text-[10px] text-neutral-500">
                        Visitors can copy this with one click on your listing.
                      </p>
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
                      <p className="mt-1 text-[10px] text-neutral-500">
                        Optional — leave blank to use your main website URL.
                      </p>
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
                      <p className="mt-1 text-[10px] text-neutral-500">
                        Optional note displayed under the promo code.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Who it's for */}
              <div className="border-t border-neutral-800 pt-5">
                <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">
                  Who it&apos;s for
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Target audience</label>
                    <input
                      type="text"
                      value={form.targetAudience}
                      maxLength={120}
                      onChange={(e) => set('targetAudience', e.target.value)}
                      placeholder="e.g. Indie hackers, developers, small teams"
                      className={inputClass(false)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Problem it solves</label>
                    <textarea
                      value={form.problemItSolves}
                      maxLength={600}
                      rows={3}
                      onChange={(e) => set('problemItSolves', e.target.value)}
                      placeholder="What pain point does it address?"
                      className={`${inputClass(false)} resize-y leading-relaxed`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Your solution</label>
                    <textarea
                      value={form.solution}
                      maxLength={600}
                      rows={3}
                      onChange={(e) => set('solution', e.target.value)}
                      placeholder="How does it solve that problem?"
                      className={`${inputClass(false)} resize-y leading-relaxed`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>What makes it different</label>
                    <textarea
                      value={form.uniqueSellingPoint}
                      maxLength={600}
                      rows={3}
                      onChange={(e) => set('uniqueSellingPoint', e.target.value)}
                      placeholder="What sets it apart from alternatives?"
                      className={`${inputClass(false)} resize-y leading-relaxed`}
                    />
                  </div>
                </div>
                <p className="mt-2 text-[11px] font-medium text-neutral-600">
                  Optional — these fill the What it does section of your listing page.
                </p>
              </div>

              {/* Social & Distribution Links */}
              <div className="border-t border-neutral-800 pt-5 space-y-4">
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-neutral-400">
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

                <p className="mt-1 text-[11px] font-medium text-neutral-600">
                  Optional — displayed on your listing page so users can join your community or download your apps.
                </p>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-6 shadow-xs space-y-6">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Founder & Maker Profile
                </h2>
                <p className="mt-1 text-xs text-neutral-400">
                  Put a face and handle behind your launch. This displays in the &quot;Meet the Founder&quot; section of your listing page.
                </p>
              </div>

              {/* Founder Profile Picture */}
              <div className="border-t border-neutral-800 pt-5">
                <label className={labelClass}>Founder profile picture</label>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl border border-neutral-700 bg-[#222222]">
                  {/* Photo Preview */}
                  <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border-2 border-neutral-700 bg-[#2a2a2a] flex items-center justify-center shadow-md">
                    {form.creatorAvatar ? (
                      <img src={form.creatorAvatar} alt="Founder preview" className="h-full w-full object-cover" />
                    ) : defaultCreatorAvatar ? (
                      <img src={defaultCreatorAvatar} alt="Account avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-black text-mint-300">
                        {(form.creatorName || defaultCreatorName || 'F').slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Actions & info */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <p className="text-xs font-bold text-white">
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
                        className="rounded-lg border border-neutral-700 bg-[#343434] px-3 py-1.5 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {form.creatorAvatar ? 'Change photo' : 'Upload custom photo'}
                      </button>
                      {form.creatorAvatar && defaultCreatorAvatar && form.creatorAvatar !== defaultCreatorAvatar && (
                        <button
                          type="button"
                          onClick={() => set('creatorAvatar', defaultCreatorAvatar)}
                          className="rounded-lg border border-neutral-800 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Use Google photo
                        </button>
                      )}
                      {form.creatorAvatar && (
                        <button
                          type="button"
                          onClick={() => set('creatorAvatar', '')}
                          className="rounded-lg border border-neutral-800 bg-transparent px-2.5 py-1.5 text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
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
              <div className="border-t border-neutral-800 pt-5">
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
              <div className="border-t border-neutral-800 pt-5">
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
              <div className="border-t border-neutral-800 pt-5">
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
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer ${
                        form.creatorRole === role
                          ? 'bg-mint-500/15 text-mint-200 border border-mint-500/40'
                          : 'bg-[#222222] text-neutral-400 border border-neutral-700 hover:text-white hover:border-neutral-500'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Sticky action bar ── */}
      <footer className="sticky bottom-0 z-40 border-t border-neutral-800 bg-[#222222]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-3.5 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="text-[11px] font-bold text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            {draftSaved ? 'Draft saved' : 'Save draft'}
          </button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => handleTabClick(step - 1)}
                className="rounded-xl border border-neutral-700 bg-[#343434] px-4 py-2.5 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-all cursor-pointer"
              >
                Back
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-black text-[#0b0f14] hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                Continue
              </button>
            ) : isSignedIn ? (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={isSubmitting}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-black text-[#0b0f14] hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  'Submit website'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onSignInRequest}
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-black text-[#0b0f14] hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                Sign in to submit
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SubmitPage;
