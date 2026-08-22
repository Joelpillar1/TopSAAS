import React, { useState, useRef, useEffect } from 'react';
import { X, Globe, Loader2, CheckCircle2, ChevronDown, Check, Search, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/sound';
import { fetchWebsiteMetadata } from '../utils/fetchMetadata';
import { Category, Product } from '../types';
import { BorderBeam } from './BorderBeam';
import { HeroClaimBanner } from './HeroClaimBanner';

export const SUBMISSION_CATEGORIES: Category[] = [
  'AI Tools',
  'Developer Tools',
  'Productivity',
  'Design & UI',
  'SaaS & Indie',
  'Social Media & Community',
  'X / Twitter Tools',
  'LinkedIn Tools',
  'YouTube & Video',
  'Discord & Telegram',
  'Instagram & TikTok',
  'Marketing & SEO',
  'Analytics & Data',
  'Finance & Fintech',
  'E-commerce',
  'Security & Privacy',
  'Communication & Social',
  'Sales & CRM',
  'No-Code & Low-Code',
  'Education & Learning',
  'Cloud & DevOps',
  'Content & Media',
  'Automation & Workflows',
  'Open Source',
  'Crypto & Web3',
  'HR & Hiring',
  'Customer Support',
  'Health & Wellness',
];

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: (params: {
    name: string;
    tagline: string;
    url: string;
    category: Category;
  }) => void;
  soundEnabled: boolean;
  hasProduct?: boolean;
  featuredProductId?: string | null;
  featuredProduct?: Product | null;
  onOpenFeaturedSpotModal?: () => void;
  onTrackClick?: (productId: string, url: string) => void;
}

function cleanDomainToName(rawUrl: string): string {
  try {
    let u = rawUrl.trim();
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    const parsed = new URL(u);
    let host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length > 0 && parts[0]) {
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch {}
  return 'My Product';
}

export const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  soundEnabled,
  hasProduct = false,
  featuredProductId,
  featuredProduct,
  onOpenFeaturedSpotModal,
  onTrackClick,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Category>('AI Tools');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close custom dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryOpen(false);
      }
    };
    if (isCategoryOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCategoryOpen]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setName('');
    setTagline('');
    setUrl('');
    setCategory('AI Tools');
    setIsCategoryOpen(false);
    setCategorySearch('');
    setError(null);
    setIsSubmitting(false);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  // Auto-detect metadata on URL blur if name or tagline are still empty
  const handleUrlBlur = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    let normalizedUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return;
    }

    // Only auto-fetch if user hasn't typed both fields yet
    if (!name.trim() || !tagline.trim()) {
      try {
        const metadata = await fetchWebsiteMetadata(normalizedUrl);
        if (metadata.title && !name.trim()) {
          setName(metadata.title);
        }
        if (metadata.description && !tagline.trim()) {
          setTagline(metadata.description);
        }
      } catch {
        // Fallback name from domain
        if (!name.trim()) {
          setName(cleanDomainToName(normalizedUrl));
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter the website URL');
      return;
    }

    let formattedUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      new URL(formattedUrl);
    } catch {
      setError('Please enter a valid URL (e.g., https://yourwebsite.com)');
      return;
    }

    setIsSubmitting(true);

    let finalName = name.trim();
    let finalTagline = tagline.trim();

    // Auto-detect metadata during submit if either field was left blank
    if (!finalName || !finalTagline) {
      try {
        const metadata = await fetchWebsiteMetadata(formattedUrl);
        if (!finalName && metadata.title) {
          finalName = metadata.title;
        }
        if (!finalTagline && metadata.description) {
          finalTagline = metadata.description;
        }
      } catch {}
    }

    // Fallbacks if still empty
    if (!finalName) {
      finalName = cleanDomainToName(formattedUrl);
    }
    if (!finalTagline) {
      finalTagline = `The modern software tool in the ${category} space.`;
    }

    playSound('success', soundEnabled);

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#404040', '#808080', '#e5e5e5'],
      });
    } catch {}

    onConfirmSubmit({
      name: finalName,
      tagline: finalTagline,
      url: formattedUrl,
      category,
    });

    setName(finalName);
    setTagline(finalTagline);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const filteredCategories = SUBMISSION_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(categorySearch.toLowerCase().trim())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 my-4 text-black animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {isSubmitted ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-black tracking-tight">
                You&apos;re live! 🎉
              </h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                <strong className="text-black font-semibold">{name}</strong> has been added to the directory and is now visible on the homepage.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 px-4 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer min-h-[42px]"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : hasProduct ? (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-500 shadow-2xs">
              <Globe className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-black tracking-tight">
                You already have a product listed
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed">
                Each account can submit one product. Play the dino game above to increase your product&apos;s score and ranking!
              </p>
            </div>

            {/* Featured Spot Preview */}
            <div className="pt-1 text-left">
              {featuredProductId && featuredProduct ? (
                <BorderBeam
                  duration={5}
                  size={260}
                  colorFrom="#ffaa40"
                  colorMid="#9c40ff"
                  colorTo="#00d2ff"
                >
                  <HeroClaimBanner
                    topProduct={featuredProduct}
                    soundEnabled={soundEnabled}
                    onTrackClick={onTrackClick || (() => {})}
                  />
                </BorderBeam>
              ) : featuredProductId === '' ? (
                null
              ) : (
                <BorderBeam
                  duration={5}
                  size={260}
                  colorFrom="#ffaa40"
                  colorMid="#9c40ff"
                  colorTo="#00d2ff"
                >
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      handleClose();
                      onOpenFeaturedSpotModal?.();
                    }}
                    className="w-full rounded-xl border-2 border-neutral-300 bg-white px-3 py-3.5 hover:bg-neutral-50 transition-all cursor-pointer text-left block"
                  >
                    <div className="flex items-center gap-2.5">
                      <Crown className="h-4 w-4 text-neutral-300 shrink-0" />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-neutral-400">Featured spot</p>
                        <span className="text-[10px] text-neutral-400">—</span>
                        <p className="text-[11px] text-neutral-500 font-medium">Get featured for 30 days</p>
                      </div>
                    </div>
                  </button>
                </BorderBeam>
              )}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 px-4 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer min-h-[42px]"
              >
                <span>Got it</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-2xs">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-black tracking-tight">
                    Submit Your Website
                  </h3>
                  <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-800 uppercase">
                    Free
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">
                  Add your product to the directory instantly.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Website URL */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Globe className="absolute left-3 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onBlur={handleUrlBlur}
                    placeholder="https://yourwebsite.com"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-8.5 pr-3 py-2.5 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                  />
                </div>
              </div>

              {/* Website Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Product Name <span className="text-neutral-400 font-normal">(auto-detected from URL)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Linear, Raycast, Supabase"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  One-liner Tagline <span className="text-neutral-400 font-normal">(auto-detected from URL)</span>
                </label>
                <input
                  type="text"
                  maxLength={140}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="One sentence describing what it does"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                />
              </div>

              {/* Custom Category Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={categoryDropdownRef}>
                  {/* Custom Trigger Button */}
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setIsCategoryOpen(!isCategoryOpen);
                      setCategorySearch('');
                    }}
                    className={`w-full flex items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-xs font-semibold text-black transition-all cursor-pointer shadow-2xs text-left ${
                      isCategoryOpen
                        ? 'border-black ring-1 ring-black'
                        : 'border-neutral-300 hover:border-neutral-400'
                    }`}
                  >
                    <span className="truncate">{category}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-500 transition-transform duration-200 shrink-0 ${
                        isCategoryOpen ? 'rotate-180 text-black' : ''
                      }`}
                    />
                  </button>

                  {/* Custom Dropdown Menu */}
                  {isCategoryOpen && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                      {/* Search Filter */}
                      <div className="relative mb-1.5 px-1 pt-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                        <input
                          type="text"
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          placeholder="Search categories..."
                          className="w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-8 pr-2.5 py-1.5 text-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none"
                          autoFocus
                        />
                      </div>

                      {/* Options List */}
                      <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-xs text-neutral-400">
                            No matching categories
                          </div>
                        ) : (
                          filteredCategories.map((cat) => {
                            const isSelected = category === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  setCategory(cat);
                                  setIsCategoryOpen(false);
                                }}
                                className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer text-left ${
                                  isSelected
                                    ? 'bg-neutral-100 font-bold text-black'
                                    : 'font-medium text-neutral-700 hover:bg-neutral-50 hover:text-black'
                                }`}
                              >
                                <span className="truncate">{cat}</span>
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 text-black shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 px-4 text-xs font-bold text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer min-h-[44px] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Detecting & Submitting...</span>
                    </>
                  ) : (
                    <span>Add to Directory</span>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
