import React from 'react';
import { X, Crown, ExternalLink, ShieldCheck, Share2, MousePointerClick, Zap } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';

interface ProductDetailDrawerProps {
  product: Product | null;
  topProduct?: Product | null;
  onClose: () => void;
  onShare: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  soundEnabled: boolean;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  onClose,
  onShare,
  onTrackClick,
  soundEnabled,
}) => {
  if (!product) return null;

  const isRankOne = product.rank === 1;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="relative h-full w-full max-w-md bg-white border-l border-neutral-200 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-black">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
            <div className="flex items-center gap-2">
              <span className="font-mono-num text-xs font-black uppercase tracking-wider text-black">
                Website Profile
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-bold text-neutral-600">Spot #{product.rank} on Page</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Product Header */}
          <div className="mt-5 flex items-start gap-3.5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
              {product.logoUrl ? (
                <img
                  src={product.logoUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-2xl font-black text-black">{product.name[0]}</span>
              )}
              {isRankOne && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-white shadow-2xs">
                  <Crown className="h-3 w-3 fill-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-black tracking-tight truncate">
                  {product.name}
                </h3>
                {product.verified && (
                  <ShieldCheck className="h-4 w-4 text-black shrink-0" title="Verified" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onTrackClick(product.id, product.url)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline"
                >
                  <span>{product.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                {product.twitterHandle && (
                  <span className="text-xs text-neutral-400 font-medium">
                    {product.twitterHandle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p className="mt-3 text-xs text-neutral-600 font-medium leading-relaxed">
            {product.tagline}
          </p>

          {/* Key Metrics Grid */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                Category
              </div>
              <div className="text-xs font-black text-black mt-1 truncate">
                {product.category}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                Score
              </div>
              <div className="font-mono-num text-base font-black text-black mt-0.5 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-black" />
                <span>{product.dinoScore ?? 0}</span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 truncate">
                Visits
              </div>
              <div className="font-mono-num text-base font-black text-black flex items-center gap-1 mt-0.5">
                <MousePointerClick className="h-3.5 w-3.5 text-black" />
                <span>{product.clicks.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1">About</h4>
              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* Bottom CTAs */}
        <div className="pt-4 border-t border-neutral-200 mt-4 space-y-2">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              playSound('click', soundEnabled);
              onTrackClick(product.id, product.url);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-black text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
          >
            <span>Visit Website</span>
            <ExternalLink className="h-4 w-4" />
          </a>

          <button
            onClick={() => {
              playSound('click', soundEnabled);
              onShare(product);
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white py-2.5 text-xs font-bold text-black hover:bg-neutral-100 cursor-pointer min-h-[40px]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
