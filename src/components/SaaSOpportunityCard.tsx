import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SaaSOpportunity } from '../data/saasOpportunities';
import { playSound } from '../utils/sound';
import { navigateTo } from '../utils/nav';

interface SaaSOpportunityCardProps {
  opportunity: SaaSOpportunity;
  soundEnabled: boolean;
  onOpenRepo?: (repoFullName: string) => void;
  compact?: boolean;
}

export const SaaSOpportunityCard: React.FC<SaaSOpportunityCardProps> = ({
  opportunity,
  soundEnabled,
  onOpenRepo,
}) => {
  const handleCardClick = () => {
    playSound('click', soundEnabled);
    if (opportunity.id === 'opp-bentopdf' || opportunity.repoFullName === 'alam00000/bentopdf') {
      navigateTo('/opensource/bentopdf');
      return;
    }
    if (opportunity.websiteUrl) {
      window.open(opportunity.websiteUrl, '_blank', 'noopener,noreferrer');
    } else if (onOpenRepo) {
      onOpenRepo(opportunity.repoFullName);
    } else {
      window.location.href = `/repo/${opportunity.repoFullName}`;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group relative flex w-full flex-col justify-between rounded-2xl border border-neutral-200/90 bg-gradient-to-r from-neutral-100 via-neutral-50 to-white p-3.5 xl:p-4 text-left shadow-2xs transition-all duration-200 hover:border-neutral-300 hover:shadow-xs hover:-translate-y-0.5 cursor-pointer overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <div>
        {/* Top Row: Logo + Name */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={opportunity.ownerAvatar}
            alt={opportunity.ideaTitle}
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-cover shrink-0 border border-neutral-200 bg-neutral-100 transition-transform group-hover:scale-105 shadow-2xs"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(opportunity.ideaTitle)}&background=f3f4f6&color=111827&bold=true`;
            }}
          />
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm xl:text-[15px] font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
              {opportunity.ideaTitle}
            </h4>
          </div>
        </div>

        {/* Middle: Description */}
        <p className="mt-2.5 text-xs text-neutral-600 line-clamp-3 leading-relaxed font-normal">
          {opportunity.whatToBuild}
        </p>
      </div>

      {/* Bottom: Large Button in App Theme */}
      <div className="mt-3.5 pt-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] py-2.5 px-3 text-xs font-bold text-white shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
        >
          <span>Build on this</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
};
