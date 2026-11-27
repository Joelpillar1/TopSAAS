import React from 'react';
import { Product } from '../types';
import { SponsorRailCard } from './SponsorRailCard';

export interface IdeasSponsorSlotDef {
  id: string;
  slotNumber: number;
  iconType?: 'database' | 'code' | 'cpu' | 'card' | 'rocket';
  title: string;
  category: string;
  description: string;
  footerLabel: string;
}

export const IDEAS_SPONSOR_SLOTS: IdeasSponsorSlotDef[] = [
  {
    id: 'ideas-sp-1',
    slotNumber: 1,
    title: 'Advertise your product',
    category: 'Prime Placement',
    description: 'Your product on a Sponsor card across the site.',
    footerLabel: 'Sponsored',
  },
  {
    id: 'ideas-sp-2',
    slotNumber: 2,
    title: 'Advertise your product',
    category: 'Prime Placement',
    description: 'Your product on a Sponsor card across the site.',
    footerLabel: 'Sponsored',
  },
  {
    id: 'ideas-sp-3',
    slotNumber: 3,
    title: 'Advertise your product',
    category: 'Prime Placement',
    description: 'Your product on a Sponsor card across the site.',
    footerLabel: 'Sponsored',
  },
  {
    id: 'ideas-sp-4',
    slotNumber: 4,
    title: 'Advertise your product',
    category: 'Prime Placement',
    description: 'Your product on a Sponsor card across the site.',
    footerLabel: 'Sponsored',
  },
  {
    id: 'ideas-sp-5',
    slotNumber: 5,
    title: 'Advertise your product',
    category: 'Prime Placement',
    description: 'Your product on a Sponsor card across the site.',
    footerLabel: 'Sponsored',
  },
];

interface IdeasSponsorCardProps {
  slot: IdeasSponsorSlotDef;
  product?: Product;
  soundEnabled: boolean;
  onTrackClick?: (productId: string, url: string) => void;
  onOpenProduct?: (product: Product) => void;
  onOpenFeaturedSpotModal?: () => void;
}

export const IdeasSponsorCard: React.FC<IdeasSponsorCardProps> = ({
  slot,
  product,
  soundEnabled,
  onTrackClick,
  onOpenProduct,
  onOpenFeaturedSpotModal,
}) => {
  return (
    <SponsorRailCard
      product={product}
      slotTitle={slot.title}
      slotDescription={slot.description}
      ctaLabel={product ? (product.actionText || 'Get Started') : 'Claim — $99/mo'}
      soundEnabled={soundEnabled}
      largeText
      onTrackClick={onTrackClick}
      onOpenProduct={onOpenProduct}
      onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
      onCardClick={
        product
          ? undefined
          : () => {
              onOpenFeaturedSpotModal?.();
            }
      }
    />
  );
};
