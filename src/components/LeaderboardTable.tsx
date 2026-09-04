import React from 'react';
import { Crown, ShieldCheck, Share2, ExternalLink, ChevronUp } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';

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
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              <th className="py-3 pl-4 pr-2 w-14 text-center">Rank</th>
              <th className="py-3 px-4">Product</th>
              {onUpvote && <th className="py-3 px-4 text-center">Upvotes</th>}
              <th className="py-3 px-4 text-center hidden md:table-cell">Category</th>
              <th className="py-3 pr-4 pl-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((product, index) => {
              const rank = index + 1;
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

              const isUpvoted = !!upvotedIds?.has(product.id);

              return (
                <tr
                  key={product.id}
                  id={`product-row-${product.id}`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) return;
                    handleRowClick();
                  }}
                  className={`group transition-colors cursor-pointer ${
                    rank === 1 ? 'bg-mint-50/30 hover:bg-mint-50/60' : 'hover:bg-neutral-50/80'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 pl-4 pr-2 text-center align-middle relative">
                    {isTopThree && (
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-r ${
                          rank === 1 ? 'bg-mint-500' : 'bg-neutral-300'
                        }`}
                      />
                    )}
                    <div className="flex justify-center">
                      {rank === 1 ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint-500 text-white shadow-2xs" title="#1 in the directory">
                          <Crown className="h-3.5 w-3.5 fill-white stroke-white" />
                        </span>
                      ) : (
                        <span className="font-mono-num text-xs font-semibold text-neutral-400 group-hover:text-neutral-800">
                          {rank}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Product */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      <ProductLogo
                        src={product.logoUrl}
                        alt={product.name}
                        containerClassName="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white shadow-2xs"
                        iconClassName="h-5 w-5 text-neutral-400 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900 group-hover:underline transition-colors text-sm truncate">
                            {product.name}
                          </span>
                          {product.verified && (rank <= 5 || product.id === featuredProductId) && (
                            <ShieldCheck className="h-3.5 w-3.5 text-neutral-400 shrink-0" title="Verified listing" />
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 line-clamp-1 max-w-lg mt-0.5 font-normal">
                          {product.tagline}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Upvotes */}
                  {onUpvote && (
                    <td className="py-3.5 px-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpvote(product);
                        }}
                        title={isUpvoted ? 'Remove your upvote' : 'Upvote this product'}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                          isUpvoted
                            ? 'border-mint-500 bg-mint-50 text-mint-700'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900'
                        }`}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        <span className="font-mono-num">{product.upvotes ?? 0}</span>
                      </button>
                    </td>
                  )}

                  {/* Category */}
                  <td className="py-3.5 px-4 text-center hidden md:table-cell align-middle">
                    <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                      {product.category}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareProduct(product);
                        }}
                        title="Share link"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={handleVisit}
                        title="Visit website"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white opacity-0 group-hover:opacity-100 hover:bg-neutral-800 transition-all cursor-pointer"
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
