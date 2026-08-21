import React from 'react';
import { X, Trophy, Sparkles, ArrowRight, MousePointerClick, ThumbsUp, Plus } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 my-4 sm:my-8 text-black animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 sm:right-4 sm:top-4 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-white font-black shadow-2xs">
            <Trophy className="h-5 w-5 fill-white stroke-white" />
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
              A community-curated directory of top web products and tools.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 sm:space-y-3 text-xs text-black">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <Plus className="h-4 w-4 text-black" />
              <span>1. Submit Your Website for Free</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium">
              Submit your website, SaaS, developer tool, or AI app without any fees or bidding. Your website appears directly on the live directory.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <ThumbsUp className="h-4 w-4 text-black" />
              <span>2. Community Upvotes</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium">
              Users and fans can upvote your product for free to boost its community visibility and help others discover it.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:p-3.5 space-y-1 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-black text-xs sm:text-sm">
              <MousePointerClick className="h-4 w-4 text-black" />
              <span>3. Direct Visits & Traffic</span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-medium">
              Visitors click through directly to explore your official website, try your tool, and sign up.
            </p>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
              onStartBidding();
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 sm:py-3 text-xs sm:text-sm font-black text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
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
