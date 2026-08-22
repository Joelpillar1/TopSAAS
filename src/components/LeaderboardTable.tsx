import React from 'react';
import { Crown, ArrowUp, ArrowDown, ShieldCheck, Share2, MousePointerClick, Zap } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';

interface LeaderboardTableProps {
  products: Product[];
  soundEnabled: boolean;
  featuredProductId?: string | null;
  onShareProduct: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  products,
  soundEnabled,
  featuredProductId,
  onShareProduct,
  onTrackClick,
}) => {
  return (
    <div id="leaderboard-table-container" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-100/90 text-[11px] font-bold uppercase tracking-wider text-neutral-600">
              <th className="py-3 pl-4 pr-2 w-14 text-center">Spot</th>
              <th className="py-3 px-4">Website / Product</th>
              <th className="py-3 px-4 text-center hidden md:table-cell">Category</th>
              <th className="py-3 px-4 text-center hidden sm:table-cell">Visits</th>
              <th className="py-3 px-4 text-center">Score</th>
              <th className="py-3 pr-4 pl-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {products.map((product, index) => {
              const rank = product.rank ?? (index + 1);
              const prevRank = product.previousRank ?? rank;
              const rankDiff = prevRank - rank;
              const isTopThree = rank <= 3;

              // Progressive row highlight fading from #1 (boldest) down to #5
              const rowHighlightClass = (() => {
                if (rank === 1) return 'bg-neutral-100/90 font-medium hover:bg-neutral-100';
                if (rank === 2) return 'bg-neutral-100/60 hover:bg-neutral-100/80';
                if (rank === 3) return 'bg-neutral-50/80 hover:bg-neutral-100/60';
                if (rank === 4) return 'bg-neutral-50/50 hover:bg-neutral-50/80';
                if (rank === 5) return 'bg-neutral-50/25 hover:bg-neutral-50/60';
                if (product.isUserOwned) return 'bg-neutral-50/40 hover:bg-neutral-100/50';
                return 'hover:bg-neutral-50/80';
              })();

              // Gradient colors for the beam accent on top 3 rows
              const beamGradientStyle: React.CSSProperties = isTopThree
                ? {
                    backgroundImage:
                      'linear-gradient(180deg, #ffaa40 0%, #9c40ff 50%, #00d2ff 100%)',
                  }
                : {};

              return (
                <tr
                  key={product.id}
                  id={`product-row-${product.id}`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button')) return;
                    playSound('click', soundEnabled);
                    window.open(product.url, '_blank', 'noopener,noreferrer');
                    onTrackClick(product.id, product.url);
                  }}
                  className={`group transition-colors cursor-pointer ${rowHighlightClass}`}
                >
                  {/* Rank / Spot Column */}
                  <td className="py-3.5 pl-4 pr-2 text-center align-middle relative">
                    {/* Gradient beam accent bar for top 3 rows */}
                    {isTopThree && (
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full" style={beamGradientStyle} />
                    )}
                    {isTopThree && (
                      <div className="absolute left-0 top-0 bottom-0 w-[8px] blur-sm opacity-40" style={beamGradientStyle} />
                    )}
                    <div className="flex flex-col items-center justify-center relative z-10">
                      {rank === 1 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white font-black shadow-xs" title="#1 on the page">
                          <Crown className="h-4 w-4 fill-white stroke-white" />
                        </div>
                      ) : rank === 2 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white font-black text-xs shadow-xs border border-neutral-900">
                          #2
                        </div>
                      ) : rank === 3 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-700 text-white font-extrabold text-xs shadow-xs border border-neutral-700">
                          #3
                        </div>
                      ) : rank === 4 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-300 text-black font-bold text-xs border border-neutral-400">
                          #4
                        </div>
                      ) : rank === 5 ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-200 text-neutral-800 font-bold text-xs border border-neutral-300">
                          #5
                        </div>
                      ) : (
                        <span className="font-mono-num text-xs font-semibold text-neutral-500 group-hover:text-black">
                          #{rank}
                        </span>
                      )}

                      {/* Rank Movement Indicator */}
                      {rankDiff > 0 ? (
                        <span className="flex items-center text-[9px] font-bold text-neutral-800 font-mono-num mt-0.5">
                          <ArrowUp className="h-2 w-2" />+{rankDiff}
                        </span>
                      ) : rankDiff < 0 ? (
                        <span className="flex items-center text-[9px] font-bold text-neutral-400 font-mono-num mt-0.5">
                          <ArrowDown className="h-2 w-2" />{rankDiff}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Website Info Column */}
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      {/* Favicon / Logo */}
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white group-hover:border-neutral-400 transition-all shadow-xs">
                        {product.logoUrl ? (
                          <img
                            src={product.logoUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="font-black text-black">{product.name[0]}</span>
                        )}
                        {product.isUserOwned && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black text-[7px] font-black text-white text-center uppercase tracking-wider">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Name & Tagline */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-black group-hover:underline transition-colors text-sm truncate">
                            {product.name}
                          </span>
                          {product.verified && (rank <= 5 || product.id === featuredProductId) && (
                            <ShieldCheck className="h-3.5 w-3.5 text-black shrink-0" title="Verified Website" />
                          )}
                        </div>

                        <p className="text-xs text-neutral-500 line-clamp-1 max-w-lg mt-0.5 font-normal">
                          {product.tagline}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category Column */}
                  <td className="py-3.5 px-4 text-center hidden md:table-cell align-middle">
                    <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                      {product.category}
                    </span>
                  </td>

                  {/* Visits / Clicks Column */}
                  <td className="py-3.5 px-4 text-center hidden sm:table-cell align-middle">
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-black font-mono-num">
                      <MousePointerClick className="h-3 w-3 text-neutral-600" />
                      <span>{product.clicks.toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Score Column */}
                  <td className="py-3.5 px-4 text-center align-middle">
                    <div className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="font-mono-num text-xs font-bold text-black">{product.dinoScore ?? 0}</span>
                      <span className="text-[10px] text-neutral-400">pts</span>
                    </div>
                  </td>

                  {/* Action Column: Share */}
                  <td className="py-3.5 pr-4 pl-2 text-right align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onShareProduct(product)}
                        title="Share website link"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Share2 className="h-3 w-3" />
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

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return url;
  }
}
