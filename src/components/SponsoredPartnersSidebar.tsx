import React from 'react';
import { Star, ExternalLink, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';
import { ProductLogo } from './ProductLogo';
import { playSound } from '../utils/sound';

interface SponsoredPartnersSidebarProps {
  sponsors: Product[];
  currentProductId?: string;
  soundEnabled: boolean;
  onSelectProduct: (product: Product) => void;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenFeaturedSpotModal?: () => void;
}

export const SponsoredPartnersSidebar: React.FC<SponsoredPartnersSidebarProps> = ({
  sponsors,
  currentProductId,
  soundEnabled,
  onSelectProduct,
  onTrackClick,
  onOpenFeaturedSpotModal,
}) => {
  // Exclude current product if it happens to be one of the sponsors
  const activeSponsors = sponsors
    .filter((s) => s.id !== currentProductId)
    .slice(0, 4);

  if (activeSponsors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-neutral-400 text-neutral-500" />
          <h2 className="text-sm font-bold text-neutral-950">
            Featured Partners
          </h2>
        </div>
        <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded-md">
          Sponsored
        </span>
      </div>

      {/* List of 4 Partners */}
      <div className="divide-y divide-neutral-200">
        {activeSponsors.map((sponsor, idx) => (
          <div
            key={sponsor.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              playSound('click', soundEnabled);
              if (sponsor.url) {
                onTrackClick?.(sponsor.id, sponsor.url);
                window.open(sponsor.url, '_blank', 'noopener,noreferrer');
              } else {
                onSelectProduct(sponsor);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playSound('click', soundEnabled);
                if (sponsor.url) {
                  onTrackClick?.(sponsor.id, sponsor.url);
                  window.open(sponsor.url, '_blank', 'noopener,noreferrer');
                } else {
                  onSelectProduct(sponsor);
                }
              }
            }}
            className={`group flex items-start gap-3 text-left transition-colors cursor-pointer ${
              idx > 0 ? 'pt-3.5' : ''
            } ${idx < activeSponsors.length - 1 ? 'pb-3.5' : ''}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 group-hover:border-neutral-300">
              <ProductLogo
                src={sponsor.logoUrl}
                alt={sponsor.name}
                containerClassName="flex h-full w-full items-center justify-center"
                iconClassName="h-4 w-4 text-neutral-400"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <h3 className="truncate text-xs font-bold text-neutral-950 group-hover:underline transition-colors">
                  {sponsor.name}
                </h3>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                {sponsor.tagline}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sponsor CTA */}
      {onOpenFeaturedSpotModal && (
        <div className="pt-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onOpenFeaturedSpotModal();
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 py-2 text-xs font-bold text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 hover:bg-neutral-100/70 transition-all cursor-pointer"
          >
            <span>Promote your SaaS here</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

