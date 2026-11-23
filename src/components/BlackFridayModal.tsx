import React, { useEffect } from 'react';
import { X, Check, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { WHOP_LINKS } from '../utils/whop';
import { appendTrackkitParams } from '../utils/trackkit';
import { playSound } from '../utils/sound';
import { BorderBeam } from './BorderBeam';

interface BlackFridayModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled?: boolean;
}

export const BlackFridayModal: React.FC<BlackFridayModalProps> = ({
  isOpen,
  onClose,
  soundEnabled = false,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const checkoutUrl = appendTrackkitParams(WHOP_LINKS.oneTime);

  const handleCheckoutClick = () => {
    playSound('click', soundEnabled);
    onClose();
  };

  const features = [
    'Permanent Dofollow SEO Backlink',
    'Guaranteed Live in 24h (Skip 14-day queue)',
    'Top-3 Category Placement for Launch Week',
    'Indexed in /llms.txt for ChatGPT & Claude Search',
    'Verified Founder Trust Badge on Product Card',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bf-modal-title"
    >
      <div
        className="relative w-full max-w-[380px] rounded-2xl bg-gradient-to-b from-[#0b1739] via-[#070f26] to-[#040817] border border-blue-500/35 text-white p-5 shadow-[0_0_50px_-10px_rgba(37,99,235,0.45)] animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Cyber Blue Border Beam */}
        <BorderBeam size="md" colorVariant="ocean" duration={8} />

        {/* Ambient Top Radial Blue Glow */}
        <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-56 h-28 bg-blue-500/30 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-36 h-24 bg-blue-600/15 blur-2xl rounded-full" />

        {/* Top Header Badge & Close Button */}
        <div className="relative flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/35 text-[10px] font-bold tracking-wider text-blue-300 uppercase shadow-[0_0_12px_rgba(37,99,235,0.3)]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            <Zap className="h-3 w-3 inline text-blue-400" />
            <span>Black Friday Special</span>
          </div>

          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="p-1 rounded-lg text-blue-300/70 hover:text-white hover:bg-blue-500/20 transition-colors cursor-pointer"
            aria-label="Close Black Friday offer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <h3
          id="bf-modal-title"
          className="relative text-[17px] font-bold text-white tracking-tight leading-snug mb-2"
        >
          Get Verified &amp; Ranked on TopSAAS
        </h3>

        {/* Anchor Pricing Box in App Blue */}
        <div className="relative flex items-baseline justify-between px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-500/30 mb-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white tracking-tight drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]">
              $5.00
            </span>
            <span className="text-xs text-blue-300/50 line-through font-semibold">$49</span>
          </div>
          <span className="text-[11px] font-bold text-blue-400 font-mono-num flex items-center gap-1">
            <Sparkles className="h-3 w-3 inline text-blue-400" />
            One-time · Lifetime
          </span>
        </div>

        {/* Targeted Features List with Glowing Blue Badges */}
        <ul className="relative space-y-2 mb-4 text-xs text-neutral-200 font-medium">
          {features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_8px_rgba(37,99,235,0.4)]">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="leading-tight text-neutral-100">{feat}</span>
            </li>
          ))}
        </ul>

        {/* App Primary Blue CTA Button with Electric Glow */}
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCheckoutClick}
          className="btn-primary group relative w-full py-2.5 px-4 text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(37,99,235,0.55)] hover:shadow-[0_4px_30px_rgba(37,99,235,0.8)] cursor-pointer transition-all"
        >
          <span>Claim Verified Launch — $5.00</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>

        {/* Urgency Footer */}
        <p className="relative mt-2.5 text-center text-[10px] text-blue-300/60 font-medium tracking-wide">
          ⏳ Cyber Week Offer · Limited Queue Review
        </p>
      </div>
    </div>
  );
};
