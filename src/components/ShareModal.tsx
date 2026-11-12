import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink, Link2 } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { getProductSlug } from '../utils/slug';

interface ShareModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  product,
  isOpen,
  onClose,
  soundEnabled,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !product) return null;

  const slug = getProductSlug(product);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.topsaas.space';
  const productShareUrl = `${origin}/product/${encodeURIComponent(slug)}`;
  const upvotes = product.upvotes ?? 0;

  const shareHeadline =
    upvotes > 0
      ? `🚀 ${product.name} is live on TopSAAS!\n\n${product.tagline}\n\nCurrently #${product.rank || '—'} with ${upvotes} ${upvotes === 1 ? 'upvote' : 'upvotes'} — check it out and drop an upvote if you like it 👇\n`
      : `🚀 Just discovered ${product.name} on TopSAAS!\n\n${product.tagline}\n\nCheck it out and show some love 👇\n`;

  const fullShareText = `${shareHeadline}${productShareUrl}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareHeadline)}&url=${encodeURIComponent(productShareUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productShareUrl)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullShareText);
    setCopiedText(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(productShareUrl);
    setCopiedLink(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl p-5 sm:p-6 text-neutral-900 animate-in fade-in zoom-in-95 duration-150 my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
          aria-label="Close share modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4 pr-8">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 font-black shadow-xs">
            <Share2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-black text-neutral-950 truncate">
              Share {product.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium truncate">
              {product.category.split(',')[0].trim()}
            </p>
          </div>
        </div>

        {/* Compact Product Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-3.5 mb-3 shadow-2xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ProductLogo
                src={product.logoUrl}
                alt={product.name}
                containerClassName="h-10 w-10 shrink-0 rounded-lg bg-white border border-neutral-200 shadow-xs relative flex items-center justify-center overflow-hidden"
                iconClassName="h-5 w-5 text-neutral-300 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-neutral-950 text-sm truncate">{product.name}</div>
                <div className="text-xs text-neutral-500 line-clamp-1">{product.tagline}</div>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-1 text-[10px] font-black text-neutral-700 font-mono-num">
              #{product.rank || '—'} · ▲ {upvotes}
            </span>
          </div>
        </div>

        {/* Pre-written Copy Preview */}
        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-3 mb-4 text-xs text-neutral-700 leading-relaxed whitespace-pre-line break-words">
          {fullShareText}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-neutral-950 py-2.5 px-3 text-xs font-black text-white shadow-xs hover:bg-neutral-800 transition-all min-h-[42px]"
            >
              <span>Post to X / Twitter</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href={linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playSound('click', soundEnabled)}
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-blue-600 py-2.5 px-3 text-xs font-black text-white shadow-xs hover:bg-blue-700 transition-all min-h-[42px]"
            >
              <span>Share on LinkedIn</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-neutral-200 bg-white py-2.5 px-3 text-xs font-bold text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 shadow-xs transition-all cursor-pointer min-h-[42px]"
            >
              {copiedText ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-black">Copied Post!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Post &amp; Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-neutral-200 bg-neutral-50/70 py-2.5 px-3 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:bg-neutral-100 transition-all cursor-pointer min-h-[42px]"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-black">Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="h-3.5 w-3.5" />
                  <span>Copy Direct Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
