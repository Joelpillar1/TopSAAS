import React from 'react';
import { ArrowUpRight, Crown, Sparkles } from 'lucide-react';
import { playSound } from '../utils/sound';

interface SponsorTileProps {
  soundEnabled: boolean;
  onOpenFeaturedSpotModal: () => void;
}

export const SponsorTile: React.FC<SponsorTileProps> = ({
  soundEnabled,
  onOpenFeaturedSpotModal,
}) => {
  const handleClick = () => {
    playSound('click', soundEnabled);
    onOpenFeaturedSpotModal();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group relative flex flex-col bg-[#2a2a2a] p-5 text-left transition-colors cursor-pointer hover:bg-[#333333] focus:outline-none focus-visible:ring-2 focus-visible:ring-mint-500/60"
    >
      {/* Icon + sponsor badge */}
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] transition-colors group-hover:border-neutral-700">
          <Crown className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#343434] border border-neutral-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300">
            Sponsor
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-bold tracking-tight text-white">
        <span className="truncate">Your SaaS Here</span>
      </h3>

      {/* Description */}
      <p className="mt-1 flex-1 text-[12.5px] font-medium leading-relaxed text-neutral-400 line-clamp-2">
        Feature your product at the top of the directory with prime placement and verified visibility.
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-neutral-800 pt-3">
        <div className="flex items-center gap-2 text-[10.5px] font-semibold text-neutral-500">
          <span>Featured Spot</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-300 transition-colors group-hover:text-white">
          <span>Get Featured</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-colors group-hover:text-white" />
        </div>
      </div>
    </div>
  );
};
