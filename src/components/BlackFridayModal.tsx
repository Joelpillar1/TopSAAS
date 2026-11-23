import React, { useEffect } from 'react';
import { X, Check, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { WHOP_LINKS } from '../utils/whop';
import { appendTrackkitParams } from '../utils/trackkit';
import { playSound } from '../utils/sound';

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
    'Live in 24 Hours (Skip 14-day queue)',
    'Top-3 Category Placement for Launch Week',
    'Indexed in /llms.txt for ChatGPT & Claude Search',
    'Verified Founder Trust Badge on Product Card',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bf-modal-title"
    >
      <div
        className="relative w-full max-w-[380px] rounded-2xl bg-neutral-950 border border-neutral-800 text-white p-5 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-emerald-500/20 blur-3xl rounded-full" />

        {/* Top Header Badge & Close Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <Zap className="h-3 w-3 inline text-emerald-400" />
            <span>Black Friday Special</span>
          </div>

          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close Black Friday offer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title */}
        <h3
          id="bf-modal-title"
          className="text-base font-bold text-white tracking-tight leading-snug mb-2"
        >
          Get Verified &amp; Ranked on TopSAAS
        </h3>

        {/* Anchor Pricing Box */}
        <div className="flex items-baseline justify-between px-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800/80 mb-3.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-black text-white tracking-tight">$5.00</span>
            <span className="text-xs text-neutral-500 line-through font-semibold">$49</span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-400">
            One-time · Lifetime pass
          </span>
        </div>

        {/* Targeted Features List */}
        <ul className="space-y-2 mb-4 text-xs text-neutral-300 font-medium">
          {features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="h-4 w-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="h-2.5 w-2.5 stroke-[3]" />
              </div>
              <span className="leading-tight">{feat}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleCheckoutClick}
          className="group w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer text-center"
        >
          <span>Claim Verified Launch — $5.00</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>

        {/* Urgency Footer */}
        <p className="mt-2.5 text-center text-[10px] text-neutral-400 font-medium">
          ⏳ Cyber Week Offer · Limited Queue Review
        </p>
      </div>
    </div>
  );
};
