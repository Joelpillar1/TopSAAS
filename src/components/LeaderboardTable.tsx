import React from 'react';
import { ShieldCheck, Share2, ExternalLink, ChevronUp, MessageCircle, Star, ArrowUpRight } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { isProductUpvoted } from '../utils/db';
import { ProductLogo } from './ProductLogo';
import { RankMedal } from './RankMedal';

interface LeaderboardTableProps {
  products: Product[];
  soundEnabled: boolean;
  featuredProductId?: string | null;
  onShareProduct: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  /** When provided, clicking a row opens the in-app product page. */
  onOpenDetail?: (product: Product) => void;
  /** When provided the table shows upvote controls */
  onUpvote?: (product: Product) => void;
  upvotedIds?: Set<string>;
  startIndex?: number;
  commentCounts?: Record<string, number>;
  sponsorProduct?: Product | null;
  onOpenFeaturedSpotModal?: () => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  products,
  soundEnabled,
  featuredProductId,
  onShareProduct,
  onTrackClick,
  onOpenDetail,
  onUpvote,
  upvotedIds,
  startIndex = 0,
  commentCounts,
  sponsorProduct,
  onOpenFeaturedSpotModal,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#2a2a2a] shadow-xs transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-[#343434] text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              <th className="py-3 pl-4 pr-2 w-16 text-center">Rank</th>
              <th className="py-3 px-4">Product</th>
              {onUpvote && <th className="py-3 px-4 text-center w-28">Upvotes</th>}
              <th className="py-3 px-4 text-center hidden md:table-cell w-36">Category</th>
              <th className="py-3 px-4 text-center hidden lg:table-cell w-24">Feedback</th>
              <th className="py-3 pr-4 pl-2 text-right w-28">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {/* Optional Sponsor / Featured Spotlight Row at the top of Page 1 */}
            {startIndex === 0 && sponsorProduct && (
              <tr
                key={`sponsor-${sponsorProduct.id}`}
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenDetail?.(sponsorProduct);
                }}
                className="group cursor-pointer bg-gradient-to-r from-amber-500/10 via-[#2f2b23] to-[#2a2a2a] hover:from-amber-500/15 hover:via-[#353026] hover:to-[#2e2e2e] transition-colors relative border-b border-amber-500/30"
              >
                {/* Sponsor badge / Star in rank column */}
                <td className="py-3.5 pl-4 pr-2 text-center align-middle relative">
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 to-amber-600 rounded-r" />
                  <div className="flex justify-center">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-xs"
                      title="Featured Sponsor Spotlight"
                    >
                      <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                    </span>
                  </div>
                </td>

                {/* Sponsor Product details */}
                <td className="py-3.5 px-4 align-middle">
                  <div className="flex items-center gap-3">
                    <ProductLogo
                      src={sponsorProduct.logoUrl}
                      alt={sponsorProduct.name}
                      containerClassName="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-amber-500/40 bg-neutral-900 shadow-2xs group-hover:border-amber-400 group-hover:scale-105 transition-all"
                      iconClassName="h-5 w-5 text-amber-400 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white group-hover:text-amber-300 transition-colors text-sm truncate">
                          {sponsorProduct.name}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/50 px-1.5 py-px text-[9px] font-black uppercase tracking-wider text-amber-300 shrink-0">
                          <Star className="h-2.5 w-2.5 fill-amber-300" />
                          Featured
                        </span>
                        {sponsorProduct.verified && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" title="Verified listing" />
                        )}
                        {sponsorProduct.offerDiscount && (
                          <span className="rounded bg-mint-500/15 border border-mint-500/40 px-1.5 py-px text-[9px] font-black text-mint-300 shrink-0">
                            {sponsorProduct.offerDiscount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-1 max-w-lg mt-0.5 font-normal group-hover:text-neutral-200 transition-colors">
                        {sponsorProduct.tagline}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Upvotes Column for Sponsor */}
                {onUpvote && (
                  <td className="py-3.5 px-4 text-center align-middle">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpvote(sponsorProduct);
                      }}
                      title={isProductUpvoted(sponsorProduct.id, upvotedIds) ? 'Remove your upvote' : 'Upvote this product'}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                        isProductUpvoted(sponsorProduct.id, upvotedIds)
                          ? 'border-mint-500 bg-mint-500 text-[#0b0f14]'
                          : 'border-neutral-700 bg-transparent text-neutral-300 hover:border-mint-500/60 hover:text-mint-300 hover:bg-neutral-800'
                      }`}
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                      <span className="font-mono-num">{sponsorProduct.upvotes ?? 0}</span>
                    </button>
                  </td>
                )}

                {/* Sponsor Category */}
                <td className="py-3.5 px-4 text-center hidden md:table-cell align-middle">
                  <span className="rounded-md border border-neutral-700/50 bg-neutral-800/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-300 group-hover:border-neutral-600 group-hover:text-white transition-colors">
                    {sponsorProduct.category}
                  </span>
                </td>

                {/* Sponsor Comments */}
                <td className="py-3.5 px-4 text-center hidden lg:table-cell align-middle">
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-300">
                    <MessageCircle className="h-3.5 w-3.5 text-neutral-500" />
                    <span className="font-mono-num">{commentCounts?.[sponsorProduct.id] ?? 0}</span>
                  </span>
                </td>

                {/* Sponsor Action */}
                <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShareProduct(sponsorProduct);
                      }}
                      title="Share link"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:border-neutral-500 hover:bg-[#343434] transition-colors cursor-pointer"
                    >
                      <Share2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        playSound('click', soundEnabled);
                        onTrackClick(sponsorProduct.id, sponsorProduct.url);
                        window.open(sponsorProduct.url, '_blank', 'noopener,noreferrer');
                      }}
                      title="Visit website"
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-all cursor-pointer shadow-xs"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 font-bold" />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Standard Products */}
            {products.map((product, index) => {
              const rank = startIndex + index + 1;
              const isTopThree = rank <= 3;

              const handleRowClick = () => {
                if (onOpenDetail) {
                  playSound('click', soundEnabled);
                  onOpenDetail(product);
                  return;
                }
                playSound('click', soundEnabled);
                window.open(product.url, '_blank', 'noopener,noreferrer');
                onTrackClick(product.id, product.url);
              };

              const handleVisit = (e: React.MouseEvent) => {
                e.stopPropagation();
                playSound('click', soundEnabled);
                onTrackClick(product.id, product.url);
                window.open(product.url, '_blank', 'noopener,noreferrer');
              };

              const isUpvoted = isProductUpvoted(product.id, upvotedIds);

              const rowHighlightClass = (() => {
                if (rank === 1) return 'bg-[#313131] hover:bg-[#383838]';
                if (rank === 2) return 'bg-[#2e2e2e] hover:bg-[#363636]';
                if (rank === 3) return 'bg-[#2c2c2c] hover:bg-[#343434]';
                return 'hover:bg-[#333333]';
              })();

              return (
                <tr
                  key={product.id}
                  id={`product-row-${product.id}`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) return;
                    handleRowClick();
                  }}
                  className={`group transition-all duration-200 cursor-pointer relative ${rowHighlightClass}`}
                >
                  {/* Rank Column */}
                  <td className="py-3.5 pl-4 pr-2 text-center align-middle relative">
                    {isTopThree && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r ${
                          rank === 1 ? 'bg-mint-500' : rank === 2 ? 'bg-purple-400' : 'bg-amber-500'
                        }`}
                      />
                    )}
                    <div className="flex justify-center items-center">
                      {rank === 1 || rank === 2 || rank === 3 ? (
                        <RankMedal rank={rank as 1 | 2 | 3} className="h-6 w-6" />
                      ) : (
                        <span className="font-mono-num text-xs font-bold text-neutral-500 group-hover:text-neutral-300 transition-colors">
                          #{rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Product Column */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      <ProductLogo
                        src={product.logoUrl}
                        alt={product.name}
                        containerClassName="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-800 bg-[#222222] shadow-2xs group-hover:border-neutral-600 group-hover:scale-105 transition-all"
                        iconClassName="h-5 w-5 text-neutral-500 group-hover:text-neutral-300 shrink-0 transition-colors"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white group-hover:text-mint-300 transition-colors text-sm truncate">
                            {product.name}
                          </span>
                          {product.verified && (rank <= 5 || product.id === featuredProductId) && (
                            <ShieldCheck className="h-3.5 w-3.5 text-mint-500 shrink-0" title="Verified listing" />
                          )}
                          {product.offerDiscount && (
                            <span className="rounded bg-mint-500/15 border border-mint-500/40 px-1.5 py-px text-[9px] font-black text-mint-300 shrink-0">
                              {product.offerDiscount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-1 max-w-lg mt-0.5 font-normal group-hover:text-neutral-200 transition-colors">
                          {product.tagline}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Upvotes Column */}
                  {onUpvote && (
                    <td className="py-3.5 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpvote(product);
                        }}
                        title={isUpvoted ? 'Remove your upvote' : 'Upvote this product'}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                          isUpvoted
                            ? 'border-mint-500 bg-mint-500 text-[#0b0f14] shadow-xs'
                            : 'border-neutral-700 bg-transparent text-neutral-300 hover:border-mint-500/60 hover:text-mint-300 hover:bg-neutral-800'
                        }`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="font-mono-num">{product.upvotes ?? 0}</span>
                      </button>
                    </td>
                  )}

                  {/* Category Column */}
                  <td className="py-3.5 px-4 text-center hidden md:table-cell align-middle">
                    <span className="rounded-md border border-neutral-700/50 bg-neutral-800/80 px-2 py-0.5 text-[11px] font-semibold text-neutral-300 group-hover:border-neutral-600 group-hover:text-white transition-colors">
                      {product.category}
                    </span>
                  </td>

                  {/* Feedback / Comments Column */}
                  <td className="py-3.5 px-4 text-center hidden lg:table-cell align-middle">
                    <span className="inline-flex items-center gap-1 text-xs text-neutral-400 group-hover:text-neutral-300">
                      <MessageCircle className="h-3.5 w-3.5 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
                      <span className="font-mono-num">{commentCounts?.[product.id] ?? 0}</span>
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareProduct(product);
                        }}
                        title="Share link"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-transparent text-neutral-400 hover:text-white hover:border-neutral-500 hover:bg-[#343434] transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleVisit}
                        title="Visit website"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-800 text-neutral-300 hover:bg-white hover:text-black transition-all cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
