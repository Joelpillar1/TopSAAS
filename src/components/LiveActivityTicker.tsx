import React from 'react';
import { Swords, Flame, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';
import { LiveActivity } from '../types';

interface LiveActivityTickerProps {
  activities: LiveActivity[];
  onSelectProductById: (productId: string) => void;
}

export const LiveActivityTicker: React.FC<LiveActivityTickerProps> = ({
  activities,
  onSelectProductById,
}) => {
  if (!activities || activities.length === 0) return null;

  return (
    <div id="live-activity-ticker" className="relative flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white py-2 px-3 text-xs shadow-sm transition-all">
      <div className="flex shrink-0 items-center gap-1.5 pr-3 border-r border-neutral-200 text-neutral-900 font-bold tracking-wide">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="hidden sm:inline font-mono-num">TRAFFIC WAR LOG</span>
        <span className="sm:hidden font-mono-num">LOG</span>
      </div>

      {/* Horizontal marquee / latest items */}
      <div className="flex items-center gap-4 overflow-x-auto pl-3 scrollbar-none whitespace-nowrap">
        {activities.slice(0, 6).map((act, index) => {
          return (
            <button
              key={`${act.id || 'act'}-${index}`}
              onClick={() => onSelectProductById(act.productId)}
              className="flex items-center gap-1.5 text-neutral-700 hover:text-neutral-950 transition-colors group cursor-pointer"
            >
              {act.type === 'claim_first' ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[10px] font-black text-amber-900">
                  <Flame className="h-3 w-3 text-amber-600 fill-amber-500" />
                  CLAIMED #1
                </span>
              ) : act.type === 'outbid' ? (
                <span className="inline-flex items-center gap-1 rounded bg-orange-50 border border-orange-200 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
                  <Swords className="h-3 w-3 text-orange-600" />
                  OUTBID
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  BOOST
                </span>
              )}

              <span className="font-bold text-neutral-900 group-hover:underline">
                {act.productName}
              </span>

              <span className="font-mono-num font-black text-neutral-900">
                +${act.bidAmount}
              </span>

              <span className="text-neutral-500">
                to reach <span className="font-mono-num font-bold text-neutral-900">#{act.newRank}</span>
              </span>

              {act.displacedProductName && (
                <span className="text-neutral-400 text-[11px]">
                  (ousting {act.displacedProductName})
                </span>
              )}

              <span className="text-[10px] text-neutral-400 ml-1">
                {formatTimeAgo(act.timestamp)}
              </span>

              <ArrowUpRight className="h-3 w-3 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
