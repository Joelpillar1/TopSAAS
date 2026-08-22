import React from 'react';
import { X, Trophy, Gamepad2, Plus, Sparkles, ArrowRight, MousePointerClick, Crown, Flame } from 'lucide-react';
import { playSound } from '../utils/sound';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBidding: () => void;
  soundEnabled: boolean;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({
  isOpen,
  onClose,
  onStartBidding,
  soundEnabled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 my-4 sm:my-8 text-black animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-2xs">
            <Gamepad2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-black tracking-tight">
                How It Works
              </h3>
              <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-800 uppercase">
                100% Free
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Game your way to the top of the directory.
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 text-xs text-black">
          {/* Step 1 */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <Plus className="h-4 w-4 text-black shrink-0" />
              <span>1. Submit Your Website for Free</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium pl-6">
              Add your SaaS, developer tool, or AI product in seconds. TopSAAS automatically extracts your product tagline and favicon.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <Flame className="h-4 w-4 text-black shrink-0" />
              <span>2. Play the Dino Runner to Rank Up</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium pl-6">
              Pick your website and play the Dino game above! Every point you score directly boosts your product&apos;s <strong className="text-black font-semibold">Dino Score</strong> and pushes it higher up the leaderboard.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <MousePointerClick className="h-4 w-4 text-black shrink-0" />
              <span>3. Get Direct Visits & Visibility</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium pl-6">
              Visitors browse top ranked products, discover innovative tools, and click directly through to your website to sign up.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <Crown className="h-4 w-4 text-black shrink-0" />
              <span>4. Claim the Featured Spot (Optional)</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium pl-6">
              Want instant maximum exposure? Secure the exclusive #1 banner spot at the very top of the directory with animated BorderBeam styling.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
              onStartBidding();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs sm:text-sm font-black text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Submit Your Website Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
