import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone, Zap } from 'lucide-react';
import { Product } from '../types';
import { IDEAS_SPONSOR_SLOTS } from './IdeasSponsorCard';
import { getWebsiteFavicon } from '../utils/logo';
import { openOutboundUrl } from '../utils/referral';
import { playSound } from '../utils/sound';
import { getDeterministicBrandColor, extractDominantLogoColor } from '../utils/brandColor';

function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(37, 99, 235, ${alpha})`;
  const clean = hex.replace('#', '').trim();
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, white)`;
}

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
  onOpenBlackFridayModal?: () => void;
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
  onOpenBlackFridayModal,
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

    const items: { slot: MobileSponsorSlotDef; product?: Product; isOffer?: boolean }[] = [...filled];

    // Include Black Friday 40% off offer in the ad card rotation
    items.push({
      slot: {
        id: 'bf-offer',
        title: 'Black Friday: 40% off Verified Launch',
        subtitle: 'Launch in 24h for $9 (was $15) · Ends 30 Nov.',
      },
      isOffer: true,
    });

    // If not all slots are filled, append one open slot so builders know a spot is open
    if (firstOpenSlot && filled.length < maxSlots) {
      items.push({ slot: firstOpenSlot, product: undefined });
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
  const isOffer = Boolean(activeItem.isOffer);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playSound('click', soundEnabled);

    if (isOffer) {
      if (onOpenBlackFridayModal) {
        onOpenBlackFridayModal();
      } else if (typeof window !== 'undefined') {
        try { localStorage.setItem('topsaas_submit_plan', 'paid_19'); } catch { }
        window.location.href = '/submit';
      }
      return;
    }

    if (currentProduct?.url) {
      openOutboundUrl(currentProduct.url, {
        productId: currentProduct.id,
        productName: currentProduct.name,
        campaign: 'mobile_sponsor',
        onTrackClick,
      });
    } else if (currentProduct) {
      onOpenProduct?.(currentProduct);
    } else {
      onOpenFeaturedSpotModal?.();
    }
  };

  const displayName = currentProduct?.name || currentSlot.title || 'Advertise your product';
  const displayTagline = currentProduct
    ? (currentProduct.tagline || currentProduct.description || 'Verified developer tool')
    : (currentSlot.description || currentSlot.subtitle || 'Your product on a Sponsor card across the site, for 30 days.');
  const logoSrc = currentProduct
    ? (currentProduct.logoUrl || (currentProduct.url ? getWebsiteFavicon(currentProduct.url, 48) : null))
    : null;

  const [brandColor, setBrandColor] = useState<string>(() =>
    currentProduct ? getDeterministicBrandColor(currentProduct.name || currentProduct.url) : '#2563eb'
  );

  useEffect(() => {
    if (!currentProduct) {
      setBrandColor('#2563eb');
      return;
    }

    let isMounted = true;
    setBrandColor(getDeterministicBrandColor(currentProduct.name || currentProduct.url));

    if (logoSrc) {
      extractDominantLogoColor(logoSrc).then((extracted) => {
        if (isMounted && extracted) {
          setBrandColor(extracted);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [currentProduct?.id, currentProduct?.name, currentProduct?.url, logoSrc]);

  const innerBgColor = hexToRgba(brandColor, currentProduct ? 0.08 : 0.07);

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
      className={`group relative w-full box-border overflow-hidden rounded-2xl border bg-white p-1 text-left transition-all duration-200 cursor-pointer active:scale-[0.99] select-none ${
        currentProduct ? 'border-neutral-200/90' : 'border-dashed border-neutral-300'
      } ${
        isFloating
          ? 'shadow-lg shadow-neutral-900/10'
          : 'shadow-2xs'
      } ${className}`}
      aria-label={`Sponsored announcement: ${displayName}`}
    >
      <div
        className={`w-full rounded-xl px-3 py-2 flex items-center justify-between gap-2.5 transition-opacity duration-200 ${
          isFading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: innerBgColor }}
      >
        {/* Inline Logo + Name – Tagline */}
        <p className="text-[12px] leading-[17px] text-neutral-600 line-clamp-2 min-w-0 flex-1">
          <span className="inline-flex h-[18px] w-[18px] max-h-[18px] max-w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-white border border-neutral-200/70 overflow-hidden align-middle mr-1.5 -mt-0.5 shadow-2xs">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] max-h-[18px] max-w-[18px] object-contain block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <span className="flex h-[18px] w-[18px] items-center justify-center bg-blue-600 text-white">
                <Megaphone className="h-2.5 w-2.5" />
              </span>
            )}
          </span>
          <span className="font-bold text-neutral-900">{displayName}</span>
          <span className="text-neutral-400"> &ndash; </span>
          <span>{displayTagline}</span>
        </p>

        {/* Compact Ad Pill */}
        <span className="shrink-0 rounded-md border border-neutral-200/80 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400 select-none">
          Ad
        </span>
      </div>
    </div>
  );
};
