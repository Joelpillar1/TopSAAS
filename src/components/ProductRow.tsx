import React from 'react';
import { ExternalLink, MessageCircle, Flame, ChevronUp } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';
import { RankMedal } from './RankMedal';
import { BorderBeam } from './BorderBeam';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { openOutboundUrl } from '../utils/referral';

interface ProductRowProps {
  product: Product;
  rank: number;
  soundEnabled: boolean;
  showVerified?: boolean;
  /** Comment count shown in the row actions */
  commentCount?: number;
  /** Highlights the row with the featured gradient frame (used for top 3) */
  featuredFrame?: boolean;
  onOpen: (product: Product) => void;
  /** When provided the row shows an upvote control */
  onUpvote?: (product: Product) => void;
  upvoted?: boolean;
  onTrackClick?: (productId: string, url: string) => void;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  rank,
  soundEnabled,
  showVerified = false,
  commentCount,
  featuredFrame = false,
  onOpen,
  onUpvote,
  upvoted = false,
  onTrackClick,
}) => {
  const handleOpen = () => {
    playSound('click', soundEnabled);
    onOpen(product);
  };

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpvote?.(product);
  };

  const handleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleOpen();
  };

  // "by Sal" — creator name only (no @handle or duplicate category)
  const handle = product.creatorXHandle || product.creatorUsername;
  const rawCreator = product.creatorName || (handle ? handle.replace(/^@/, '') : null);
  const byline = rawCreator ? `by ${rawCreator}` : null;

  // Categories: on mobile show only one category; on desktop show all
  const categories = React.useMemo(() => {
    if (!product.category) return [];
    return product.category.split(',').map((c) => c.trim()).filter(Boolean);
  }, [product.category]);
  const primaryCategory = categories[0] || product.category;

  const handleVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('click', soundEnabled);
    if (product.url) {
      openOutboundUrl(product.url, {
        productId: product.id,
        productName: product.name,
        campaign: 'leaderboard_row',
        onTrackClick,
      });
    } else {
      handleOpen();
    }
  };

  const row = (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      className={`group relative flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200 ease-out cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 sm:gap-4 ${
        featuredFrame
          ? 'border-neutral-300/80 bg-gradient-to-r from-neutral-200/65 via-neutral-100/35 to-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:border-neutral-400 hover:shadow-[0_4px_18px_rgba(0,0,0,0.08)]'
          : 'border-neutral-200/80 bg-white shadow-2xs hover:border-neutral-300 hover:bg-neutral-50/70'
      }`}
    >
      {/* Rank medal / number */}
      {rank !== undefined && rank > 0 && (
        <div className="flex shrink-0 items-center justify-center">
          {rank === 1 || rank === 2 || rank === 3 ? (
            <RankMedal rank={rank as 1 | 2 | 3} className="h-8 w-8 sm:h-9 sm:w-9" variant="coin" />
          ) : (
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-neutral-200/90 bg-neutral-100/90 font-mono-num text-[11px] sm:text-xs font-black text-neutral-500 shadow-2xs">
              {rank}
            </div>
          )}
        </div>
      )}

      {/* Icon tile */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-colors group-hover:border-neutral-200 sm:h-14 sm:w-14 shadow-2xs">
        <ProductLogo
          src={product.logoUrl}
          alt={product.name}
          containerClassName="flex h-full w-full items-center justify-center bg-transparent relative"
          iconClassName="h-5 w-5 text-neutral-400 shrink-0"
        />
      </div>

      {/* Copy — name, byline, tagline */}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-neutral-950 sm:text-base group-hover:text-black transition-colors">
            {product.name}
          </h3>
          {showVerified && product.verified && (
            <VerifiedBadge className="h-4 w-4 shrink-0" title="Verified Startup" />
          )}
          {product.isSponsored && (
            <span
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-neutral-400 select-none"
              title="Golden Verified Sponsor"
            >
              <VerifiedBadge variant="gold" className="h-3.5 w-3.5 shrink-0" />
              <span>Sponsored</span>
            </span>
          )}
          {(product.autoRelaunch || product.isRelaunched) && !product.isSponsored && (
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 shadow-2xs select-none"
              title="Relaunched tool in this weekly round"
            >
              <span>🚀</span>
              <span>Relaunched</span>
            </span>
          )}
          {product.offerDiscount && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-2 py-0.5 text-[10px] font-black tracking-tight text-white shadow-xs shadow-orange-500/25 transition-transform hover:scale-105 select-none">
              <Flame className="h-2.5 w-2.5 fill-white stroke-white shrink-0" />
              <span>{product.offerDiscount}</span>
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-[12.5px] font-medium leading-relaxed text-neutral-600 sm:text-[13px]">
          {product.tagline}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1 font-medium text-neutral-400">
            <MessageCircle className="h-3.5 w-3.5" />
            <span className="font-mono-num">{commentCount ?? 0}</span>
          </span>
          {byline && (
            <span className="truncate text-[11px] font-medium text-neutral-400 hidden sm:inline">
              · {byline}
            </span>
          )}
          {/* Mobile view: only show one of the categories */}
          {primaryCategory && (
            <span className="inline-flex sm:hidden shrink-0 items-center rounded-full border border-neutral-200/80 bg-neutral-100/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-600 truncate max-w-[120px]">
              {primaryCategory}
            </span>
          )}
          {/* Desktop view: show all categories */}
          {categories.length > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 flex-wrap">
              {categories.map((cat, idx) => (
                <span
                  key={idx}
                  className="inline-flex shrink-0 items-center rounded-full border border-neutral-200/80 bg-neutral-100/70 px-2 py-0.5 text-[10px] font-semibold text-neutral-600"
                >
                  {cat}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Actions: upvote · visit (vertically stacked on mobile like attached, only upvote & visit alone, maintaining size) */}
      <div className="flex flex-col sm:flex-row shrink-0 items-center gap-1.5 sm:gap-2.5 self-center">
        {onUpvote && (
          <button
            type="button"
            onClick={handleUpvote}
            title={upvoted ? 'Remove your upvote' : 'Upvote this product'}
            className={`flex flex-col items-center justify-center rounded-xl sm:rounded-2xl border py-1 sm:py-1.5 w-11 transition-all cursor-pointer active:scale-95 ${upvoted
              ? 'border-mint-500 bg-mint-500 text-white shadow-2xs'
              : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400 shadow-2xs'
              }`}
          >
            <ChevronUp className={`h-4 w-4 ${upvoted ? 'text-white' : 'text-neutral-900 fill-neutral-900'}`} />
            <span className="text-xs font-black font-mono-num leading-tight">{product.upvotes ?? 0}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleVisit}
          title={`Visit ${product.name}`}
          className="inline-flex w-11 h-8 sm:w-9 sm:h-9 items-center justify-center rounded-xl bg-neutral-950 text-white transition-all hover:bg-neutral-800 shrink-0 cursor-pointer shadow-2xs"
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  if (!featuredFrame) return row;

  return (
    <BorderBeam size="md" colorVariant="colorful" strength={0.8} className="w-full rounded-2xl">
      {row}
    </BorderBeam>
  );
};
