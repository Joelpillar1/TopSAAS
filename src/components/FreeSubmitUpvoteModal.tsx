import React, { useMemo } from 'react';
import { X, ChevronUp, Check, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { getWebsiteFavicon } from '../utils/logo';
import { ProductLogo } from './ProductLogo';
import { isProductUpvoted } from '../utils/db';

interface FreeSubmitUpvoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  /** Live directory products list (updated by App.tsx onUpvote) */
  products: Product[];
  /** Snapshot IDs of up to 10 un-upvoted directory apps chosen when the modal opened */
  candidateIds: string[];
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
  candidateIds = [],
  userUpvotes = new Set<string>(),
  onUpvote,
  soundEnabled,
  isSubmitting = false,
}) => {
  // Resolve live Product objects for the snapshotted candidate IDs so upvote counts
  // and upvoted state come directly from App.tsx without duplication or list jumping.
  const modalProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return candidateIds
      .map((id) => byId.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [products, candidateIds]);

  if (!isOpen) return null;

  const requiredCount = Math.min(5, modalProducts.length);
  const upvotedCount = modalProducts.filter((p) => isProductUpvoted(p.id, userUpvotes)).length;
  const isRequirementMet = modalProducts.length === 0 || upvotedCount >= requiredCount;
  const remaining = Math.max(0, requiredCount - upvotedCount);
  const progressPercent = requiredCount > 0
    ? Math.min(100, Math.round((upvotedCount / requiredCount) * 100))
    : 100;

  const handleToggleUpvote = (prod: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Delegate directly to App.tsx's handleUpvote (handles sound, optimistic +1/-1, userUpvotes & DB sync)
    onUpvote?.(prod);
  };

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
              TopSAAS is community-powered! Upvote at least{' '}
              <strong className="text-neutral-900 font-bold">
                {requiredCount} of the {modalProducts.length} apps
              </strong>{' '}
              below that you haven&apos;t upvoted yet to unlock your submission.
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
                {upvotedCount} of {requiredCount} upvoted — Ready to submit!
              </span>
            ) : (
              <span className="font-bold text-neutral-700 text-[11px] bg-white border border-neutral-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                {upvotedCount} of {requiredCount} upvoted ·{' '}
                <span className="text-blue-600 font-extrabold">{remaining} more required</span>
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

        {/* Scrollable Apps List */}
        <div className="border border-neutral-200 rounded-2xl overflow-hidden mb-5">
          <div className="bg-neutral-100/70 border-b border-neutral-200 px-3.5 py-2 text-[11px] font-bold text-neutral-500 flex items-center justify-between">
            <span>Apps you haven&apos;t upvoted yet</span>
            <span>Click ▲ to upvote</span>
          </div>

          <div className="max-h-[320px] sm:max-h-[360px] overflow-y-auto divide-y divide-neutral-100 bg-white">
            {modalProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No un-upvoted directory apps available.
              </div>
            ) : (
              modalProducts.map((prod, index) => {
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
                            {prod.category.split(',')[0].trim()}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {prod.tagline}
                      </p>
                    </div>

                    {/* Upvote Button (identical to ProductRow) */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleUpvote(prod, e)}
                      title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
                      className={`flex flex-col items-center justify-center rounded-xl border py-1 w-11 transition-all cursor-pointer active:scale-95 shrink-0 ${
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
                      <span className="text-xs font-black font-mono-num leading-tight">
                        {prod.upvotes ?? 0}
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
              <span>Submit ({upvotedCount}/{requiredCount} upvoted) →</span>
            ) : (
              <span>Upvote {remaining} more app{remaining === 1 ? '' : 's'} to submit</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
