import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Loader2,
  Sparkles,
  Globe,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Zap,
  TrendingUp,
  ShieldCheck,
  MousePointerClick,
  ExternalLink,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { SponsorDraft } from '../types';
import { playSound } from '../utils/sound';
import { redirectToCheckout } from '../utils/whop';
import { getWebsiteFavicon } from '../utils/logo';
import { getDeterministicBrandColor, extractDominantLogoColor } from '../utils/brandColor';
import { QuadChevrons } from './SponsorRailCard';

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(37, 99, 235, ${alpha})`;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, white)`;
}

interface SaaSIdeasSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  defaultEmail?: string;
  user?: User | null;
  onRequireSignIn?: () => void;
}

export const SaaSIdeasSponsorModal: React.FC<SaaSIdeasSponsorModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  defaultEmail = '',
  user = null,
  onRequireSignIn,
}) => {
  const [step, setStep] = useState<'input' | 'plan'>('input');

  const [productName, setProductName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isLogoCustom, setIsLogoCustom] = useState(false);
  const [tagline, setTagline] = useState('');
  const [ctaText, setCtaText] = useState('Get Started');
  const [contactEmail, setContactEmail] = useState(defaultEmail);

  const [previewColor, setPreviewColor] = useState('#2563eb');
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync user email if logged in
  useEffect(() => {
    if (user?.email) {
      setContactEmail(user.email);
    } else if (defaultEmail && !contactEmail) {
      setContactEmail(defaultEmail);
    }
  }, [user, defaultEmail]);

  // Restore staged inputs if available
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('topsaas_sponsor_staged_draft');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.productName && !productName) setProductName(parsed.productName);
          if (parsed.websiteUrl && !websiteUrl) setWebsiteUrl(parsed.websiteUrl);
          if (parsed.logoUrl && !logoUrl) {
            setLogoUrl(parsed.logoUrl);
            if (!parsed.logoUrl.includes('google.com/s2/favicons') && !parsed.logoUrl.includes('icon.horse')) {
              setIsLogoCustom(true);
            }
          }
          if (parsed.tagline && !tagline) setTagline(parsed.tagline);
          if (parsed.ctaText) setCtaText(parsed.ctaText);
          if (parsed.contactEmail && !contactEmail && !user?.email) setContactEmail(parsed.contactEmail);
        }
      } catch {}
    }
  }, [isOpen]);

  // Escape key listener to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset step on reopen
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setFormError(null);
    }
  }, [isOpen]);

  // Dynamically sample logo color for real-time live preview
  useEffect(() => {
    let isMounted = true;
    const resolved = logoUrl.trim() || (websiteUrl.trim() ? getWebsiteFavicon(websiteUrl.trim()) : '');
    const fallbackColor = getDeterministicBrandColor(productName || websiteUrl);

    // Provide instant responsive visual feedback without waiting for image download
    setPreviewColor(fallbackColor);

    if (resolved) {
      extractDominantLogoColor(resolved).then((extracted) => {
        if (!isMounted) return;
        if (extracted) {
          setPreviewColor(extracted);
        } else {
          setPreviewColor(fallbackColor);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [productName, websiteUrl, logoUrl]);

  // Keep logo & preview in sync when website URL changes
  const handleWebsiteChange = (newUrl: string) => {
    setWebsiteUrl(newUrl);

    // If logo was not manually typed by the user, keep it synced to the new website's favicon
    const isAutoLogo = !isLogoCustom || !logoUrl.trim() || logoUrl.includes('google.com/s2/favicons') || logoUrl.includes('icon.horse');
    if (isAutoLogo) {
      const trimmed = newUrl.trim();
      if (trimmed) {
        setLogoUrl(getWebsiteFavicon(trimmed));
      } else {
        setLogoUrl('');
      }
    }
  };

  const handleWebsiteBlur = () => {
    let url = websiteUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
      setWebsiteUrl(url);
    }
    const isAutoLogo = !isLogoCustom || !logoUrl.trim() || logoUrl.includes('google.com/s2/favicons') || logoUrl.includes('icon.horse');
    if (isAutoLogo && url) {
      const icon = getWebsiteFavicon(url);
      setLogoUrl(icon);
    }
  };

  const handleClose = () => {
    playSound('click', soundEnabled);
    setFormError(null);
    onClose();
  };

  // Validate step 1 and advance to step 2
  const handleProceedToPlan = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = productName.trim();
    let url = websiteUrl.trim();
    const tag = tagline.trim();
    const email = contactEmail.trim();

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
      setWebsiteUrl(url);
    }
    if (!tag) {
      setFormError('Please enter a short description or tagline.');
      return;
    }
    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid founder contact email.');
      return;
    }

    if (!user) {
      playSound('click', soundEnabled);
      try {
        localStorage.setItem(
          'topsaas_sponsor_staged_draft',
          JSON.stringify({
            productName: name,
            websiteUrl: url,
            logoUrl,
            tagline: tag,
            ctaText,
            contactEmail: email,
          })
        );
      } catch {}
      setFormError('Please sign in or create an account to link your analytics and track your campaign.');
      onRequireSignIn?.();
      return;
    }

    playSound('click', soundEnabled);
    setStep('plan');
  };

  // Step 2 Checkout execution
  const handleCheckout = async () => {
    setFormError(null);

    const name = productName.trim();
    let url = websiteUrl.trim();
    const tag = tagline.trim();
    const email = contactEmail.trim();

    if (!name || !url || !tag || !email) {
      setFormError('Please fill out all required fields before proceeding.');
      setStep('input');
      return;
    }

    const resolvedLogo = logoUrl.trim() || getWebsiteFavicon(url);

    setIsProcessing(true);
    playSound('click', soundEnabled);

    try {
      const now = Date.now();
      const sponsorDraft: SponsorDraft = {
        id: `spn_ideas_${now}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        tagline: tag,
        url,
        logoUrl: resolvedLogo,
        category: 'SaaS',
        contactEmail: email,
        tier: '1mo',
        status: 'active',
        startedAt: now,
        expiresAt: now + 30 * 86400 * 1000,
        clicks: 0,
        source: 'whop',
      };

      // Save pending sponsor locally for instant fulfillment on return
      localStorage.setItem('topsaas_pending_sponsor', JSON.stringify(sponsorDraft));

      await redirectToCheckout({
        planType: 'saas_ideas_monthly',
        productName: name,
        customerEmail: email,
        placement: 'sponsor',
        sponsorId: sponsorDraft.id,
        sponsorName: name,
        sponsorUrl: url,
        sponsorLogo: resolvedLogo,
        sponsorTagline: tag,
        sponsorCategory: 'SaaS',
        sponsorEmail: email,
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setFormError('Could not start checkout session. Please try again.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const displayLogo = logoUrl.trim() || (websiteUrl.trim() ? getWebsiteFavicon(websiteUrl.trim()) : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
      <div
        className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl border border-neutral-200/90 bg-white shadow-2xl my-auto text-neutral-900 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'input' ? (
          <>
            {/* ── Section 1 (Top): Live Preview on Grey Canvas ── */}
            <div
              className="relative select-none overflow-hidden bg-[#ececed] border-b border-neutral-200/90 px-4 sm:px-6 pt-3.5 pb-4.5 flex flex-col items-center justify-center shrink-0"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(17,24,39,0.09) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            >
              {/* Soft light wash */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(255,255,255,0.75),transparent_70%)]" />

              {/* Minimal Top Header inside Grey Canvas */}
              <div className="relative z-10 w-full flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200/80 text-[11px] font-bold text-neutral-700 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <span>Sponsor Preview · Step 1 of 2</span>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl bg-white/90 p-1.5 text-neutral-500 backdrop-blur-sm transition-colors hover:bg-white hover:text-neutral-950 cursor-pointer shadow-2xs"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Centered Floating Live Card Preview */}
              <div
                className="relative z-10 w-full max-w-sm rounded-xl xl:rounded-2xl border border-neutral-300/80 p-3 text-left overflow-hidden shadow-xs transition-all duration-200"
                style={{
                  background: `linear-gradient(to right, ${hexToRgba(previewColor, 0.16)} 0%, ${hexToRgba(previewColor, 0.04)} 55%, #ffffff 100%)`,
                  borderColor: hexToRgba(previewColor, 0.32),
                }}
              >
                {/* Background Watermark Graphic */}
                <div
                  className="pointer-events-none absolute -right-2 -bottom-2 w-16 h-16 opacity-[0.08] rotate-12 flex items-center justify-center"
                  style={{ color: previewColor }}
                >
                  <Zap className="w-full h-full text-current" />
                </div>

                <div className="relative z-10 min-w-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-white shadow-2xs overflow-hidden"
                      style={{ backgroundColor: previewColor }}
                    >
                      {displayLogo ? (
                        <img
                          key={displayLogo}
                          src={displayLogo}
                          alt=""
                          className="h-full w-full object-contain p-0.5 bg-white"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 stroke-[2.2]" />
                      )}
                    </div>
                    <h4 className="truncate text-xs sm:text-[13.5px] font-black text-neutral-950">
                      {productName.trim() || 'Your Product Name'}
                    </h4>
                  </div>

                  <p className="mt-1 text-[11px] text-neutral-500 line-clamp-3 leading-snug">
                    {tagline.trim() || 'Stop submitting same resume to every role, tailor you resume to each job with cvarchitect'}
                  </p>
                </div>

                <div
                  className="relative z-10 mt-1.5 w-full rounded-lg py-1 px-2.5 flex items-center justify-between text-white text-[11px] font-bold shadow-2xs"
                  style={{ backgroundColor: previewColor }}
                >
                  <span className="truncate mr-2">{ctaText.trim() || 'Get Started'}</span>
                  <QuadChevrons className="h-3.5 w-auto" />
                </div>
              </div>
            </div>

            {/* ── Section 2 (Bottom): Inputs on White Background ── */}
            <div className="bg-white p-5 sm:p-6 overflow-y-auto max-h-[calc(92vh-220px)] no-scrollbar flex-1">
              <form onSubmit={handleProceedToPlan} className="space-y-3.5">
                {/* Field: Product Name & Website URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800">
                      Product Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. BentoPDF"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-800">
                      Website URL <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                      <input
                        type="text"
                        required
                        value={websiteUrl}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        onBlur={handleWebsiteBlur}
                        placeholder="https://yourproduct.com"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-8.5 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Field: Tagline */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800">
                      Tagline / Description <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-neutral-400 font-normal">Max 90 chars</span>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                    <input
                      type="text"
                      required
                      maxLength={90}
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Modern visual PDF editor with modular bento-style design blocks."
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-8.5 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Field: Logo URL & CTA button text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-800">Logo URL</label>
                      <span className="text-[10px] text-neutral-400 font-normal">Auto-detected</span>
                    </div>
                    <div className="relative">
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLogoUrl(val);
                          const isAuto = !val.trim() || val.includes('google.com/s2/favicons') || val.includes('icon.horse');
                          setIsLogoCustom(!isAuto);
                        }}
                        placeholder="https://yourproduct.com/logo.png"
                        className="w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-8.5 pr-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-800">Button Text</label>
                      <span className="text-[10px] text-neutral-400 font-normal">CTA label</span>
                    </div>
                    <input
                      type="text"
                      maxLength={24}
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder="Get Started"
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Field: Founder / Contact Email */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-800">
                      Founder / Contact Email <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-neutral-400 font-normal">For analytics &amp; receipts</span>
                  </div>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="founder@yourcompany.com"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-900 focus:outline-none transition-all"
                  />
                </div>

                {/* Account Status Banner */}
                {user ? (
                  <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 p-2.5 flex items-center gap-2 text-xs text-blue-900">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      Linked to account <strong>{user.email}</strong> · Analytics will appear in your profile.
                    </span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-2.5 flex items-center justify-between gap-2 text-xs text-amber-900">
                    <div className="flex items-center gap-2 min-w-0">
                      <Lock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">Sign in to track clicks &amp; edit your ad anytime</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        try {
                          localStorage.setItem(
                            'topsaas_sponsor_staged_draft',
                            JSON.stringify({
                              productName,
                              websiteUrl,
                              logoUrl,
                              tagline,
                              ctaText,
                              contactEmail,
                            })
                          );
                        } catch {}
                        onRequireSignIn?.();
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 underline shrink-0 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                {/* Error Message */}
                {formError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                    {formError}
                  </div>
                )}

                {/* Continue to Step 2 Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full btn-primary py-2.5 px-4 text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-95"
                  >
                    <span>Continue to Plan &amp; Perks</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* STEP 2: PLAN, PERKS & CHECKOUT */
          <div className="flex flex-col max-h-[92vh] overflow-hidden">
            {/* Step 2 Top Bar */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setStep('input');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Details</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-700">
                <span>Step 2 of 2 · Plan &amp; Perks</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 sm:px-8 py-5 space-y-5 flex-1 no-scrollbar">
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                  Review Plan &amp; Perks
                </h2>
                <p className="text-xs sm:text-[13px] text-neutral-500 max-w-md mx-auto leading-relaxed">
                  Your dedicated spot on the SaaS Ideas &amp; Curated Codebases sidebar rail is ready for activation.
                </p>
              </div>

              {/* Configured Product Summary Card */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-white shadow-xs overflow-hidden"
                    style={{ backgroundColor: previewColor }}
                  >
                    {displayLogo ? (
                      <img
                        src={displayLogo}
                        alt=""
                        className="h-full w-full object-contain p-1 bg-white"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Sparkles className="h-5 w-5 stroke-[2.2]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs sm:text-sm text-neutral-950 truncate">
                        {productName}
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 truncate max-w-xs sm:max-w-md">
                      {tagline}
                    </p>
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 hover:underline mt-0.5"
                    >
                      <span className="truncate">{websiteUrl}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setStep('input');
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0 cursor-pointer underline"
                >
                  Edit
                </button>
              </div>

              {/* Pricing & Perks Hero Card */}
              <div className="rounded-2xl border-2 border-blue-600/30 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/40 p-5 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-neutral-950 uppercase tracking-wide">
                        SaaS Ideas Monthly Pass
                      </span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                        High Intent
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Dedicated 24/7 placement on SaaS Ideas and all curated repo pages
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-3xl font-black text-neutral-950 font-mono-num tracking-tight">
                      $99<span className="text-sm font-medium text-neutral-500">/month</span>
                    </div>
                    <span className="text-[11px] text-neutral-400">Cancel or renew anytime</span>
                  </div>
                </div>

                {/* Detailed Perks ("Peaks") */}
                <div className="space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">
                    Sponsorship Perks &amp; Exposure Included:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-700">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <strong className="text-neutral-950 font-bold block">24/7 Sticky Sidebar Rail</strong>
                        <span className="text-[11px] text-neutral-500">Pinned constantly on /ideas and every single curated open-source detail page.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <strong className="text-neutral-950 font-bold block">Dynamic Logo Brand Theme</strong>
                        <span className="text-[11px] text-neutral-500">Card background accent and CTA buttons auto-adapt to your exact logo palette.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <Zap className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <strong className="text-neutral-950 font-bold block">Animated Chevrons Button</strong>
                        <span className="text-[11px] text-neutral-500">Dynamic traveling arrow animation that draws high-intent clicks immediately.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <strong className="text-neutral-950 font-bold block">Direct DoFollow Backlink</strong>
                        <span className="text-[11px] text-neutral-500">Boosts search engine indexation, AI bot training crawlers, and SEO authority.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <MousePointerClick className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <strong className="text-neutral-950 font-bold block">Active Founder Traffic</strong>
                        <span className="text-[11px] text-neutral-500">Reaching 50,000+ indie makers, engineers, and founders actively building software.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <strong className="text-neutral-950 font-bold block">Instant Live Activation</strong>
                        <span className="text-[11px] text-neutral-500">Automated activation pipeline deploys your ad immediately upon checkout.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
                  {formError}
                </div>
              )}

              {/* Checkout Action Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full btn-primary py-3.5 px-4 text-sm font-bold rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Redirecting to Whop checkout…</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Proceed to Checkout — $99/mo</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10.5px] text-neutral-400 flex items-center justify-center gap-1.5">
                  <Lock className="h-3 w-3 text-neutral-400" />
                  <span>Direct checkout via Whop · Instant activation · Cancel anytime</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
