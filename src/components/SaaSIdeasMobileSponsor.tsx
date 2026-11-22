import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone } from 'lucide-react';
import { Product } from '../types';
import { IDEAS_SPONSOR_SLOTS, IdeasSponsorSlotDef } from './IdeasSponsorCard';
import { getWebsiteFavicon } from '../utils/logo';
import { openOutboundUrl } from '../utils/referral';
import { playSound } from '../utils/sound';

export interface MobileSponsorSlotDef {
  id: string | number;
  title?: string;
  subtitle?: string;
  description?: string;
  slotNumber?: number;
}

interface SaaSIdeasMobileSponsorProps {
  slots?: MobileSponsorSlotDef[];
  sponsors?: Product[];
  soundEnabled: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
  className?: string;
  isFloating?: boolean;
}

export const SaaSIdeasMobileSponsor: React.FC<SaaSIdeasMobileSponsorProps> = ({
  slots,
  sponsors = [],
  soundEnabled,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
  className = '',
  isFloating = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  const targetSlots = useMemo(() => {
    return slots && slots.length > 0 ? slots : IDEAS_SPONSOR_SLOTS.slice(0, 5);
  }, [slots]);

  const maxSlots = targetSlots.length;

  // Filter to only display all filled sponsors PLUS at most one available/open slot
  // Once all slots are exhausted, only the filled sponsors rotate.
  const displayItems = useMemo(() => {
    const filled: { slot: MobileSponsorSlotDef; product: Product }[] = [];
    let firstOpenSlot: MobileSponsorSlotDef | null = null;

    targetSlots.forEach((slot, index) => {
      const product = sponsors[index];
      if (product && (product.id || product.name)) {
        filled.push({ slot, product });
      } else if (!firstOpenSlot) {
        firstOpenSlot = slot;
      }
    });

    // Also include any filled sponsors if sponsors array has more items than targetSlots
    if (sponsors.length > targetSlots.length) {
      for (let i = targetSlots.length; i < sponsors.length; i++) {
        const product = sponsors[i];
        if (product && (product.id || product.name)) {
          filled.push({
            slot: { id: `sponsor-extra-${i}`, title: product.name, description: product.tagline },
            product,
          });
        }
      }
    }

    const items: { slot: MobileSponsorSlotDef; product?: Product }[] = [...filled];

    // If not all slots are filled, append exactly ONE open slot so builders know a spot is open
    if (firstOpenSlot && filled.length < maxSlots) {
      items.push({ slot: firstOpenSlot, product: undefined });
    }

    // Fallback if no sponsors exist at all
    if (items.length === 0) {
      items.push({ slot: targetSlots[0] || { id: 'slot-1', title: 'Advertise your product', subtitle: 'Your product on a Sponsor card across the site, for 30 days.' }, product: undefined });
    }

    return items;
  }, [targetSlots, sponsors, maxSlots]);

  const totalItems = displayItems.length;

  // Auto-rotate with an increased comfortable time delay (7.5 seconds)
  useEffect(() => {
    if (totalItems <= 1) return;

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % totalItems);
        setIsFading(false);
      }, 250); // smooth cross-fade
    }, 7500);

    return () => clearInterval(timer);
  }, [totalItems]);

  // Guard index out of range if displayItems count changes
  const activeItem = displayItems[currentIndex % totalItems] || displayItems[0];
  const currentSlot = activeItem.slot;
  const currentProduct = activeItem.product;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click', soundEnabled);

    if (currentProduct) {
      if (currentProduct.id && onTrackClick && currentProduct.url) {
        onTrackClick(currentProduct.id, currentProduct.url);
      }
      if (onOpenProduct) {
        onOpenProduct(currentProduct);
      } else if (currentProduct.url) {
        openOutboundUrl(currentProduct.url);
      }
    } else {
      onOpenFeaturedSpotModal?.();
    }
  };

  const displayName = currentProduct?.name || currentSlot.title || 'Advertise your product';
  const displayTagline = currentProduct
    ? (currentProduct.tagline || currentProduct.description || 'Verified developer tool')
    : (currentSlot.description || currentSlot.subtitle || 'Your product on a Sponsor card across the site, for 30 days.');
  const favicon = currentProduct ? getWebsiteFavicon(currentProduct.url, 48) : null;

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`group relative w-full overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-white px-3.5 py-2.5 text-left transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
        isFloating
          ? 'shadow-lg shadow-neutral-900/10 ring-1 ring-black/5'
          : 'shadow-2xs'
      } ${className}`}
      aria-label={`Sponsored announcement: ${displayName}`}
    >
      {/* Top Row: [Small Logo] [Brand Name] ......... [Grey "SPONSORED" text] */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Logo container */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-50 p-0.5 border border-neutral-200/80 overflow-hidden">
            {favicon ? (
              <img
                src={favicon}
                alt=""
                className={`h-full w-full object-contain rounded-xs transition-opacity duration-200 ${
                  isFading ? 'opacity-0' : 'opacity-100'
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xs bg-blue-600 text-white">
                <Megaphone className="h-3 w-3" />
              </div>
            )}
          </div>

          {/* Brand Name */}
          <h3
            className={`text-sm font-bold tracking-tight text-neutral-900 truncate transition-opacity duration-200 ${
              isFading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {displayName}
          </h3>
        </div>

        {/* Grey SPONSORED Text without colored frame */}
        <div className="shrink-0 flex items-center">
          <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase select-none">
            SPONSORED
          </span>
        </div>
      </div>

      {/* Description text */}
      <div className="mt-1">
        <p
          className={`text-xs text-neutral-500 font-normal leading-snug line-clamp-2 transition-opacity duration-200 ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {displayTagline}
        </p>
      </div>
    </div>
  );
};
