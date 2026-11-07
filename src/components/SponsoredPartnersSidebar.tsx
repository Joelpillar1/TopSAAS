import React from 'react';
import { Zap, ExternalLink, Megaphone, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';
import { ProductLogo } from './ProductLogo';
import { playSound } from '../utils/sound';
import { openOutboundUrl } from '../utils/referral';

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
  const activeSponsors = (sponsors || [])
    .filter((s) => s.id !== currentProductId && s.isSponsored)
    .slice(0, 4);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600 fill-blue-600" />
          <h2 className="text-sm font-black text-neutral-950 tracking-tight">
            Sponsors
          </h2>
        </div>
        {onOpenFeaturedSpotModal && (
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onOpenFeaturedSpotModal();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <span>Advertise</span>
            <ArrowUpRight className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* List of active sponsors (if any) */}
      {activeSponsors.length > 0 && (
        <div className="divide-y divide-neutral-100">
          {activeSponsors.map((sponsor, idx) => (
            <div
              key={sponsor.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                playSound('click', soundEnabled);
                if (sponsor.url) {
                  openOutboundUrl(sponsor.url, {
                    campaign: 'sponsored_partners_sidebar',
                    productId: sponsor.id,
                    productName: sponsor.name,
                    onTrackClick,
                  });
                } else {
                  onSelectProduct(sponsor);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  playSound('click', soundEnabled);
                  if (sponsor.url) {
                    openOutboundUrl(sponsor.url, {
                      campaign: 'sponsored_partners_sidebar',
                      productId: sponsor.id,
                      productName: sponsor.name,
                      onTrackClick,
                    });
                  } else {
                    onSelectProduct(sponsor);
                  }
                }
              }}
              className={`group flex items-start gap-3 text-left transition-colors cursor-pointer ${
                idx > 0 ? 'pt-3' : ''
              } ${idx < activeSponsors.length - 1 ? 'pb-3' : ''}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 group-hover:border-blue-300 transition-colors">
                <ProductLogo
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  containerClassName="flex h-full w-full items-center justify-center"
                  iconClassName="h-4 w-4 text-neutral-400"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate text-xs font-bold text-neutral-950 group-hover:text-blue-600 transition-colors">
                    {sponsor.name}
                  </h3>
                  <ExternalLink className="h-2.5 w-2.5 text-neutral-400 opacity-60 group-hover:opacity-100 group-hover:text-blue-600 transition-all shrink-0" />
                </div>
                <p className="mt-0.5 text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                  {sponsor.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Become a Sponsor slot (shows open slots available) */}
      {onOpenFeaturedSpotModal && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            playSound('click', soundEnabled);
            onOpenFeaturedSpotModal();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              playSound('click', soundEnabled);
              onOpenFeaturedSpotModal();
            }
          }}
          className="group flex items-center justify-between gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 hover:bg-blue-50/40 hover:border-blue-300/80 p-3 text-left transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors truncate">
                Become a Sponsor
              </h4>
              <p className="text-[10.5px] text-neutral-500 truncate">
                Prime sidebar placement · <span className="text-emerald-600 font-semibold">Free 7 days</span>
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-blue-600 transition-colors shrink-0" />
        </div>
      )}
    </div>
  );
};

