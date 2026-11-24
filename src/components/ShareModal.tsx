import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Copy, Check, Download, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { getProductSlug } from '../utils/slug';
import {
  renderShareCardToCanvas,
  copyShareCardImageToClipboard,
  downloadShareCardImage,
} from '../utils/shareCardCanvas';

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
  const [postText, setPostText] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const slug = product ? getProductSlug(product) : '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.topsaas.space';
  const productShareUrl = `${origin}/product/${encodeURIComponent(slug)}`;

  // Default crafted announcement post in TopSAAS brand voice
  const generatePostCopy = useCallback((p: Product, url: string) => {
    const upvotes = p.upvotes ?? 0;
    const rank = p.rank || 1;
    const upvoteStr = `${upvotes} ${upvotes === 1 ? 'upvote' : 'upvotes'}`;

    return `🚀 We're live on TopSAAS!\n\nMeet ${p.name} — ${p.tagline}\n\n🏆 Currently #${rank} on the weekly leaderboard with ${upvoteStr}.\n\nCheck out our official launch page and drop an upvote 👇\n${url}`;
  }, []);

  // Update text whenever product changes
  useEffect(() => {
    if (product) {
      setPostText(generatePostCopy(product, productShareUrl));
    }
  }, [product, productShareUrl, generatePostCopy]);

  // Render single signature TopSAAS card on canvas
  useEffect(() => {
    if (isOpen && product && canvasRef.current) {
      renderShareCardToCanvas(canvasRef.current, product, 2);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleShareOnX = () => {
    playSound('click', soundEnabled);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLaunchLink = () => {
    navigator.clipboard.writeText(productShareUrl);
    setCopiedLink(true);
    playSound('click', soundEnabled);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCardImage = async () => {
    playSound('click', soundEnabled);
    const success = await copyShareCardImageToClipboard(product);
    if (success) {
      setCopiedImage(true);
      playSound('success', soundEnabled);
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
      });
      setTimeout(() => setCopiedImage(false), 2500);
    } else {
      await downloadShareCardImage(product, `${slug}-launch-card.png`);
    }
  };

  const handleDownloadCardImage = async () => {
    playSound('click', soundEnabled);
    await downloadShareCardImage(product, `${slug}-launch-card.png`);
    playSound('success', soundEnabled);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="relative w-full max-w-[480px] rounded-2xl border border-neutral-200 bg-white shadow-2xl p-5 sm:p-6 text-neutral-900 animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
          aria-label="Close share modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* TopSAAS Brand Eyebrow */}
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-blue-600 mb-1 select-none">
          <Sparkles className="h-3 w-3" />
          <span>Launch Spotlight</span>
        </div>

        {/* Heading */}
        <h3 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight pr-6">
          Share {product.name}
        </h3>

        {/* Subtitle */}
        <p className="text-xs sm:text-[13px] text-neutral-500 mt-1 mb-4 leading-normal">
          Personalize your announcement post to rally upvotes, drive early adopters, and climb the TopSAAS leaderboard.
        </p>

        {/* Launch Card Preview Container */}
        <div className="mb-4 rounded-xl border border-neutral-200/90 bg-neutral-950 p-2.5 sm:p-3 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Official TopSAAS Launch Card</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyCardImage}
                title="Copy card image to clipboard"
                className="text-[11px] font-bold text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer bg-white/10 hover:bg-white/15 px-2 py-0.5 rounded border border-white/10 transition-colors"
              >
                {copiedImage ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedImage ? 'Copied Image!' : 'Copy Image'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCardImage}
                title="Download card image"
                className="text-neutral-400 hover:text-white p-1 cursor-pointer rounded hover:bg-white/10 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#060a1d]">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[170px] object-contain block mx-auto"
            />
          </div>
        </div>

        {/* Section Header: Crafted Announcement */}
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="announcement-post-input" className="text-xs font-bold text-neutral-800">
            Crafted announcement
          </label>
        </div>

        {/* Editable Announcement Text Box */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <textarea
            id="announcement-post-input"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            rows={5}
            className="w-full resize-none bg-transparent text-xs sm:text-[13px] leading-relaxed text-neutral-900 focus:outline-hidden font-normal"
            placeholder="Write your announcement post..."
          />
        </div>

        {/* Bottom Actions: Share on X & Copy Launch Link */}
        <div className="grid grid-cols-2 gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleShareOnX}
            className="btn-primary w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-xs cursor-pointer min-h-[44px]"
          >
            <span className="font-mono text-sm sm:text-base font-black">𝕏</span>
            <span>Share on X</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLaunchLink}
            className="btn-secondary w-full py-3 px-4 rounded-xl border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 text-xs sm:text-sm font-bold shadow-2xs cursor-pointer transition-colors min-h-[44px]"
          >
            {copiedLink ? (
              <>
                <Check className="h-4 w-4 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-800">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-neutral-500" />
                <span>Copy Launch Link</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
