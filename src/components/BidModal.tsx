import React, { useState } from 'react';
import { X, Trophy, Globe, Clock, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category } from '../types';
import { playSound } from '../utils/sound';

interface BidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: (params: {
    name: string;
    tagline: string;
    url: string;
    twitterHandle?: string;
    category: Category;
    backerName: string;
    backerEmail?: string;
  }) => void;
  soundEnabled: boolean;
}

const CATEGORIES: Category[] = [
  'AI Tools',
  'Developer Tools',
  'Productivity',
  'Design & UI',
  'SaaS & Indie',
  'Crypto & Web3',
];

export const BidModal: React.FC<BidModalProps> = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  soundEnabled,
}) => {
  // Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState<Category>('Developer Tools');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [backerName, setBackerName] = useState('');
  const [backerEmail, setBackerEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Submission Success / Under Review View state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedWebsiteName, setSubmittedWebsiteName] = useState('');

  if (!isOpen) return null;

  const handleResetForm = () => {
    setName('');
    setTagline('');
    setUrl('');
    setTwitterHandle('');
    setBackerName('');
    setBackerEmail('');
    setError(null);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedTagline = tagline.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName) {
      setError('Please enter your website or product name');
      return;
    }
    if (!trimmedTagline) {
      setError('Please enter a brief tagline');
      return;
    }
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
      name: trimmedName,
      tagline: trimmedTagline,
      url: formattedUrl,
      twitterHandle: twitterHandle.trim() || undefined,
      category,
      backerName: backerName.trim() || 'Creator',
      backerEmail: backerEmail.trim() || undefined,
    });

    setSubmittedWebsiteName(trimmedName);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 my-4 text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {isSubmitted ? (
          /* Under Review Feedback Screen */
          <div className="py-3 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-2xs">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 border border-amber-200/80 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                Under Review
              </div>
              <h3 className="text-xl font-black text-black tracking-tight">
                Submission Received!
              </h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                <strong className="text-black font-semibold">{submittedWebsiteName}</strong> has been received and is now <span className="font-semibold text-amber-700">under review</span>.
              </p>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-black">
                <ShieldCheck className="h-4 w-4 text-neutral-700" />
                What happens next?
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Your listing has been submitted for verification. Once approved, your website will be automatically listed on the live directory!
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
        ) : (
          /* Submission Form */
          <>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-2xs">
                <Trophy className="h-5 w-5 fill-white stroke-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-black tracking-tight">
                    Submit Your Website
                  </h3>
                  <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-800 uppercase">
                    Free Listing
                  </span>
                </div>
                <p className="text-xs text-neutral-500 font-medium">
                  Submit your product details for review and directory inclusion.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Website Name */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Website / Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Linear, Raycast, Supabase"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                />
              </div>

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
                    placeholder="https://yourwebsite.com"
                    className="w-full rounded-xl border border-neutral-300 bg-white pl-8.5 pr-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Tagline (One sentence summary) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Issue tracking built for high-performance engineering teams"
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all text-left truncate cursor-pointer ${
                        category === cat
                          ? 'border-black bg-black text-white shadow-2xs'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Creator / Twitter handle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Twitter / X Handle <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Your Name / Team <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={backerName}
                    onChange={(e) => setBackerName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black shadow-2xs"
                  />
                </div>
              </div>

              {/* Review Process Note */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-neutral-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-neutral-600 font-medium leading-normal">
                  All listings are placed in the <strong className="text-black">under review</strong> queue to maintain directory quality. Approvals appear on the homepage immediately.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-1.5">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-2.5 px-4 text-xs font-bold text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
                >
                  <span>Submit for Review</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
