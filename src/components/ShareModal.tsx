import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { getTrafficSharePercent } from '../utils/traffic';

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
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const trafficShare = getTrafficSharePercent(product.rank);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://bidtraffic.io';
  const shareText = `Check out ${product.name} holding Rank #${product.rank} on TopSAAS with $${product.totalBid.toLocaleString()} total top-up! ${currentUrl}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `🔥 ${product.name} is holding Rank #${product.rank} on TopSAAS capturing ~${trafficShare}% of traffic with $${product.totalBid.toLocaleString()} total top-up!\n\nCan anyone top up and supersede them? 👇\n`
  )}&url=${encodeURIComponent(currentUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 text-black animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pr-8">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-xs">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-black">
              Share {product.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-500 font-medium line-clamp-1">
              Rank #{product.rank} • ~{trafficShare}% Traffic • ${product.totalBid.toLocaleString()} Top-Up
            </p>
          </div>
        </div>

        {/* Share Preview Card */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white border border-neutral-200 font-black text-black shadow-xs">
              {product.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-black text-sm truncate">{product.name}</div>
              <div className="text-xs text-neutral-500 line-clamp-1">{product.tagline}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playSound('click', soundEnabled)}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-black py-3 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition-all min-h-[44px]"
          >
            <span>Post to X / Twitter</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-neutral-300 bg-white py-3 sm:py-2.5 text-xs font-bold text-black hover:border-black hover:bg-neutral-100 shadow-xs transition-all cursor-pointer min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-black" />
                <span className="text-black font-black">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Share Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
