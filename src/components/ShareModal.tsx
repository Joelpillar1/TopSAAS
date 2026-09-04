import React, { useState } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';

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

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://topsaas.top';
  const tweetText = `🚀 Check out ${product.name} — ranked #${product.rank} on TopSAAS, the curated SaaS directory!\n\nDiscover it here 👇\n`;
  const shareText = `${tweetText}${currentUrl}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(currentUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-800 bg-[#222222] shadow-2xl p-5 sm:p-6 text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pr-8">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-mint-300 border border-neutral-700 font-black shadow-xs">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Share {product.name}
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-400 font-medium line-clamp-1">
              Rank #{product.rank} • {product.category}
            </p>
          </div>
        </div>

        {/* Share Preview Card */}
        <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3 sm:p-4 mb-4">
          <div className="flex items-center gap-3">
            <ProductLogo
              src={product.logoUrl}
              alt={product.name}
              containerClassName="h-10 w-10 shrink-0 rounded-lg bg-[#1e1e1e] border border-neutral-700 shadow-xs relative flex items-center justify-center overflow-hidden"
              iconClassName="h-5 w-5 text-neutral-300 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-sm truncate">{product.name}</div>
              <div className="text-xs text-neutral-400 line-clamp-1">{product.tagline}</div>
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
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-white py-3 sm:py-2.5 text-xs font-black text-black shadow-xs hover:bg-neutral-200 transition-all min-h-[44px]"
          >
            <span>Post to X / Twitter</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-neutral-700 bg-[#2a2a2a] py-3 sm:py-2.5 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white shadow-xs transition-all cursor-pointer min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-mint-400" />
                <span className="text-mint-300 font-black">Copied to Clipboard!</span>
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
