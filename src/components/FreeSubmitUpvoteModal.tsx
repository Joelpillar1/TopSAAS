import React, { useMemo, useState, useEffect } from 'react';
import { X, ChevronUp, Check, ExternalLink, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { getWebsiteFavicon } from '../utils/logo';
import { ProductLogo } from './ProductLogo';
import { isProductUpvoted } from '../utils/db';

interface FreeSubmitUpvoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  products: Product[];
  userUpvotes?: Set<string>;
  onUpvote?: (product: Product) => void;
  soundEnabled: boolean;
  isSubmitting?: boolean;
}

export const FreeSubmitUpvoteModal: React.FC<FreeSubmitUpvoteModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  products = [],
  userUpvotes = new Set<string>(),
  onUpvote,
  soundEnabled,
  isSubmitting = false,
}) => {
  // Take top 10 products ranked in directory
  const top10 = useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const rankA = a.rank ?? 9999;
        const rankB = b.rank ?? 9999;
        if (rankA !== rankB) return rankA - rankB;
        return (b.upvotes ?? 0) - (a.upvotes ?? 0);
      })
      .slice(0, 10);
  }, [products]);

  // Track local upvotes state for instant responsive UI feedback
  const [localUpvotes, setLocalUpvotes] = useState<Set<string>>(() => new Set(userUpvotes));
  const [upvoteDeltas, setUpvoteDeltas] = useState<Record<string, number>>({});

  // Sync with incoming userUpvotes
  useEffect(() => {
    if (userUpvotes && userUpvotes.size > 0) {
      setLocalUpvotes((prev) => {
        const merged = new Set(prev);
        userUpvotes.forEach((id) => merged.add(id));
        return merged;
      });
    }
  }, [userUpvotes]);

  if (!isOpen) return null;

  const handleToggleUpvote = (prod: Product, e?: React.MouseEvent) => {
    e?.stopPropagation();
    playSound('upvote', soundEnabled);

    const currentlyUpvoted = isProductUpvoted(prod.id, localUpvotes);
    const next = new Set(localUpvotes);

    if (currentlyUpvoted) {
      next.delete(prod.id);
      next.delete(prod.id.replace(/^prod-/, ''));
      next.delete(`prod-${prod.id}`);
      setUpvoteDeltas((prev) => ({ ...prev, [prod.id]: (prev[prod.id] ?? 0) - 1 }));
    } else {
      next.add(prod.id);
      setUpvoteDeltas((prev) => ({ ...prev, [prod.id]: (prev[prod.id] ?? 0) + 1 }));
    }

    setLocalUpvotes(next);

    if (onUpvote) {
      onUpvote(prod);
    }
  };

  const upvotedCount = top10.filter((p) => isProductUpvoted(p.id, localUpvotes)).length;
  const isRequirementMet = upvotedCount >= 5;
  const remaining = Math.max(0, 5 - upvotedCount);
  const progressPercent = Math.min(100, Math.round((upvotedCount / 5) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-sans"
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-neutral-200 bg-white shadow-2xl p-5 sm:p-7 my-auto text-neutral-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onClose();
          }}
          disabled={isSubmitting}
          className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8 mb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-950 font-black shadow-2xs border border-neutral-200">
            <Sparkles className="h-5 w-5 text-amber-500 fill-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-neutral-950 tracking-tight">
                Support Creators to Launch Free
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                Community Step
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              TopSAAS is community-powered! Upvote at least <strong className="text-neutral-900 font-bold">5 of the top 10</strong> launches below to unlock your free directory submission.
            </p>
          </div>
        </div>

        {/* Progress Tracker Card */}
        <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-3.5 sm:p-4 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-neutral-800">
              Your Upvote Progress
            </span>
            {isRequirementMet ? (
              <span className="inline-flex items-center gap-1 font-bold text-mint-700 bg-mint-50 border border-mint-200 px-2.5 py-0.5 rounded-full text-[11px]">
                <Check className="h-3 w-3 stroke-[3]" />
                {upvotedCount} of 5 upvoted — Ready to submit!
              </span>
            ) : (
              <span className="font-bold text-neutral-700 text-[11px] bg-white border border-neutral-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                {upvotedCount} of 5 upvoted · <span className="text-blue-600 font-extrabold">{remaining} more required</span>
              </span>
            )}
          </div>

          <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden mt-2.5">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isRequirementMet ? 'bg-mint-500' : 'bg-neutral-900'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Top 10 Apps List */}
        <div className="border border-neutral-200 rounded-2xl overflow-hidden mb-5">
          <div className="bg-neutral-100/70 border-b border-neutral-200 px-3.5 py-2 text-[11px] font-bold text-neutral-500 flex items-center justify-between">
            <span>Top 10 Launches on TopSAAS</span>
            <span>Click ▲ to upvote</span>
          </div>

          <div className="max-h-[320px] sm:max-h-[360px] overflow-y-auto divide-y divide-neutral-100 bg-white">
            {top10.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                Loading directory products...
              </div>
            ) : (
              top10.map((prod, index) => {
                const isUpvoted = isProductUpvoted(prod.id, localUpvotes);
                const logoSrc = prod.logoUrl || getWebsiteFavicon(prod.url);
                const currentVotes = (prod.upvotes ?? 0) + (upvoteDeltas[prod.id] ?? 0);

                return (
                  <div
                    key={prod.id}
                    className={`flex items-center gap-3 p-3 transition-colors ${
                      isUpvoted ? 'bg-mint-50/20' : 'hover:bg-neutral-50/70'
                    }`}
                  >
                    {/* Rank Number */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] font-black text-neutral-600 font-mono-num">
                      #{index + 1}
                    </div>

                    {/* Product Logo */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
                      <ProductLogo
                        src={logoSrc}
                        alt={prod.name}
                        containerClassName="h-full w-full flex items-center justify-center"
                        iconClassName="h-5 w-5 text-neutral-400"
                      />
                    </div>

                    {/* Product Name & Tagline */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
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
                            {prod.category}
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
                      onClick={(e) => handleToggleUpvote(prod, e)}
                      title={isUpvoted ? 'Upvoted (click to undo)' : 'Click to upvote'}
                      className={`flex flex-col items-center justify-center rounded-xl border py-1 w-11 transition-all cursor-pointer active:scale-95 shrink-0 ${
                        isUpvoted
                          ? 'border-mint-500 bg-mint-500 text-white shadow-2xs ring-2 ring-mint-500/20'
                          : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50 shadow-2xs'
                      }`}
                    >
                      <ChevronUp
                        className={`h-3.5 w-3.5 ${
                          isUpvoted ? 'text-white' : 'text-neutral-900 fill-neutral-900'
                        }`}
                      />
                      <span className="text-[11px] font-black font-mono-num leading-tight">
                        {currentVotes}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-xs font-bold text-neutral-500 hover:text-neutral-950 py-2.5 px-3 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-center"
          >
            Back to review
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isRequirementMet || isSubmitting) return;
              playSound('click', soundEnabled);
              onComplete();
            }}
            disabled={!isRequirementMet || isSubmitting}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl py-3 px-6 text-xs font-bold transition-all ${
              isRequirementMet && !isSubmitting
                ? 'btn-primary bg-neutral-950 text-white hover:bg-neutral-800 shadow-md cursor-pointer'
                : 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-70'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Submitting product...</span>
              </>
            ) : isRequirementMet ? (
              <span>Submit Free Listing ({upvotedCount}/5 upvoted) →</span>
            ) : (
              <span>Upvote {remaining} more app{remaining === 1 ? '' : 's'} to submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

