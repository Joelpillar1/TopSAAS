import React, { useEffect } from 'react';
import { X, Trophy, RotateCcw, Twitter, Sparkles, Zap, Crown } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { HeroClaimBanner } from './HeroClaimBanner';
import { BorderBeam } from './BorderBeam';

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  featuredProductId?: string | null;
  featuredProduct?: Product | null;
  onOpenFeaturedSpotModal?: () => void;
  onTrackClick?: (productId: string, url: string) => void;
  onPlayAgain: () => void;
  soundEnabled: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  onClose,
  score,
  highScore,
  isNewRecord,
  featuredProductId,
  featuredProduct,
  onOpenFeaturedSpotModal,
  onTrackClick,
  onPlayAgain,
  soundEnabled,
}) => {
  // Listen for Space or Enter to restart immediately
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onPlayAgain();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onPlayAgain, onClose]);

  if (!isOpen) return null;

  const handleShareOnX = () => {
    playSound('click', soundEnabled);
    const text = encodeURIComponent(
      `I just scored ${score} pts on the @TopSAAS Dino Runner! 🦖🚀\n\nCan you beat my score? Play here:`
    );
    const url = encodeURIComponent(window.location.origin);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-md rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 my-4 text-black animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onClose();
          }}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
          title="Close (ESC)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 mb-2.5">
            <Zap className="h-3.5 w-3.5 text-neutral-800 fill-neutral-800" />
            <span className="text-[11px] font-black uppercase tracking-wider text-black font-mono">
              GAME OVER
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight font-mono">
            RUN COMPLETE
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Press <kbd className="rounded bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">SPACE</kbd> to play again
          </p>
        </div>

        {/* Score Card */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 mb-4 text-center">
          <div className="grid grid-cols-2 gap-3 divide-x divide-neutral-200">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">
                Score
              </p>
              <p className="text-3xl font-black text-black font-mono-num">
                {score}
              </p>
            </div>
            <div className="pl-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-0.5">
                Best Record
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500 fill-amber-400" />
                <p className="text-3xl font-black text-black font-mono-num">
                  {highScore}
                </p>
              </div>
            </div>
          </div>

          {/* New Record Callout */}
          {isNewRecord && (
            <div className="mt-3 pt-3 border-t border-neutral-200">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-1 text-xs font-bold shadow-2xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                <span>NEW ALL-TIME HIGH SCORE! 🎉</span>
              </div>
            </div>
          )}
        </div>

        {/* Featured Spot Card Section (Matches Homepage Exactly: Chosen product / Empty / Default placeholder) */}
        <div className="mb-4">
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
            /* Explicitly cleared by admin: empty */
            null
          ) : (
            /* Default placeholder state: matches homepage card */
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
                  onClose();
                  onOpenFeaturedSpotModal?.();
                }}
                className="w-full rounded-xl border-2 border-neutral-300 bg-white px-3 py-3.5 sm:px-4 sm:py-4 hover:bg-neutral-50 transition-all cursor-pointer text-left block"
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

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onPlayAgain();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Play Again (Space)</span>
          </button>

          <button
            type="button"
            onClick={handleShareOnX}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-2.5 px-4 text-xs font-semibold text-neutral-700 hover:border-black hover:text-black hover:bg-neutral-50 transition-all cursor-pointer"
          >
            <Twitter className="h-3.5 w-3.5" />
            <span>Share Score on X</span>
          </button>
        </div>
      </div>
    </div>
  );
};
