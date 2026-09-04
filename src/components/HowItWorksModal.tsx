import React from 'react';
import { X, Rocket, Plus, Sparkles, ArrowRight, Globe, TrendingUp, Crown } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-[#222222] shadow-2xl p-5 sm:p-6 my-4 sm:my-8 text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-mint-300 font-black shadow-2xs border border-neutral-700">
            <Rocket className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                How It Works
              </h3>
              <span className="rounded-full bg-mint-500/10 border border-mint-500/25 px-2 py-0.5 text-[10px] font-bold text-mint-300 uppercase">
                Free to list
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium">
              From listing to featured — in minutes.
            </p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5 text-xs text-neutral-200">
          {/* Step 1 */}
          <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-white text-xs sm:text-sm">
              <Plus className="h-4 w-4 text-mint-400 shrink-0" />
              <span>1. List Your SaaS for Free</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-normal pl-6">
              Add your product in under a minute. Listings go live instantly — no review queue, no waiting. Your favicon and tagline are picked up automatically.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-white text-xs sm:text-sm">
              <Globe className="h-4 w-4 text-mint-400 shrink-0" />
              <span>2. Get Discovered</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-normal pl-6">
              Visitors search the directory, browse categories, and open your product profile — then click straight through to your website.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-white text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4 text-mint-400 shrink-0" />
              <span>3. Rise in the Rankings</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-normal pl-6">
              TopSAAS is editor-curated. The most useful and upvoted products get promoted to the top of the directory.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-white text-xs sm:text-sm">
              <Crown className="h-4 w-4 text-mint-400 shrink-0" />
              <span>4. Claim the Featured Spot (Optional)</span>
            </div>
            <p className="text-neutral-400 leading-relaxed font-normal pl-6">
              Want maximum exposure? Reserve the #1 spotlight banner at the top of the directory for 30 days.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
              onStartBidding();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs sm:text-sm font-black text-black shadow-2xs hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
          >
            <Sparkles className="h-4 w-4" />
            <span>List Your SaaS Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
