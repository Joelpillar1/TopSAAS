import React from 'react';
import { ArrowUpRight, BadgeCheck, Megaphone } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';

interface SpotlightCardProps {
  soundEnabled: boolean;
  onRent: () => void;
}

/** "Rent this spotlight" ad card used at the top of the left side rail */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({ soundEnabled, onRent }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-neutral-500">
          Featured Spotlight
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-mint-700 ring-1 ring-inset ring-mint-200">
          Sponsored
        </span>
      </div>
      <div className="px-4 py-4 text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-[11px] font-bold text-neutral-400">From</span>
          <span className="font-mono-num text-[28px] font-black leading-none tracking-tight text-neutral-950">$999</span>
          <span className="text-[10px] font-semibold text-neutral-400">/ 30 days</span>
        </div>
        <p className="mx-auto mt-2 max-w-[200px] text-[11px] font-medium leading-relaxed text-neutral-500">
          The top placement on TopSAAS — seen by every visitor, every day.
        </p>
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onRent();
          }}
          className="mt-4 w-full rounded-xl bg-neutral-950 py-2.5 text-xs font-bold text-white transition-all hover:bg-neutral-800 active:scale-[0.98] cursor-pointer"
        >
          Reserve this spot
        </button>
      </div>
    </div>
  );
};

interface RailCardProps {
  title: string;
  dot?: 'red' | 'neutral';
  children: React.ReactNode;
}

/** Framed card with a title bar for the rail feeds */
export const RailCard: React.FC<RailCardProps> = ({ title, dot = 'neutral', children }) => {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-2.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            dot === 'red' ? 'bg-mint-500 animate-pulse' : 'bg-neutral-300'
          }`}
        />
        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-black">
          {title}
        </h3>
      </div>
      <div className="divide-y divide-neutral-100">{children}</div>
    </div>
  );
};

interface FeedRowProps {
  logo: React.ReactNode;
  name: string;
  sub?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  soundEnabled: boolean;
}

export const FeedRow: React.FC<FeedRowProps> = ({
  logo,
  name,
  sub,
  right,
  onClick,
  soundEnabled,
}) => {
  const content = (
    <>
      <div className="shrink-0">{logo}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-black">{name}</p>
        {sub && <p className="truncate text-[10px] text-neutral-400 font-medium mt-0.5">{sub}</p>}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
      {onClick && <ArrowUpRight className="h-3 w-3 shrink-0 text-neutral-300" />}
    </>
  );

  const classes =
    'flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-neutral-50';

  if (!onClick) {
    return <div className="flex w-full items-center gap-2.5 px-4 py-2.5">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => {
        playSound('click', soundEnabled);
        onClick();
      }}
      className={classes}
    >
      {content}
    </button>
  );
};

interface PromotedCardProps {
  product: Product | null;
  soundEnabled: boolean;
  onOpen: (product: Product) => void;
  onRent: () => void;
}

/** "Promoted" product card (paid surface) with a reserve placeholder when unclaimed */
export const PromotedCard: React.FC<PromotedCardProps> = ({ product, soundEnabled, onOpen, onRent }) => {
  if (!product) {
    return (
      <button
        type="button"
        onClick={() => {
          playSound('click', soundEnabled);
          onRent();
        }}
        className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white px-4 py-6 text-center transition-all hover:border-neutral-400 hover:shadow-sm cursor-pointer"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-black">Your ad here</p>
          <p className="mt-0.5 text-[10px] font-medium text-neutral-400">From $29 / week</p>
        </div>
        <span className="text-[10px] font-bold text-neutral-500 underline underline-offset-2 group-hover:text-black transition-colors">
          Book this spot
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <ProductLogo
            src={product.logoUrl}
            alt={product.name}
            containerClassName="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs relative"
            iconClassName="h-4 w-4 text-neutral-400 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate text-xs font-bold text-black">{product.name}</p>
              {product.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-neutral-400" />}
            </div>
            <p className="mt-0.5 truncate text-[10px] font-medium text-neutral-500">{product.tagline}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onOpen(product);
          }}
          className="shrink-0 rounded-lg bg-neutral-900 px-2.5 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-neutral-800 cursor-pointer"
        >
          Visit ↗
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <span className="text-[10px] font-bold text-neutral-500 underline underline-offset-2 hover:text-black cursor-pointer transition-colors" onClick={() => { playSound('click', soundEnabled); onRent(); }}>
          Advertise ↗
        </span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-500">
          Promoted
        </span>
      </div>
    </div>
  );
};

interface SponsoredLaunchBannerProps {
  product: Product;
  soundEnabled: boolean;
  onOpen: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
}

/** Mid-board sponsored launch banner (paid surface, rendered inside the weekly list) */
export const SponsoredLaunchBanner: React.FC<SponsoredLaunchBannerProps> = ({
  product,
  soundEnabled,
  onOpen,
  onTrackClick,
}) => {
  return (
    <div className="flex items-stretch gap-0 overflow-hidden rounded-2xl border border-mint-300/70 bg-mint-50/50 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
      {/* Vertical SPONSORED label */}
      <div className="flex shrink-0 items-center justify-center border-r border-mint-200/70 bg-white px-1.5">
        <span className="text-[8px] font-black uppercase tracking-[0.25em] text-mint-700 [writing-mode:vertical-rl] rotate-180">
          Sponsored
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          playSound('click', soundEnabled);
          onOpen(product);
        }}
        className="group flex flex-1 items-center gap-3 px-3.5 py-3.5 text-left transition-colors hover:bg-mint-50 cursor-pointer min-w-0"
      >
        <ProductLogo
          src={product.logoUrl}
          alt={product.name}
          containerClassName="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-mint-300/60 bg-white shadow-2xs relative"
          iconClassName="h-4 w-4 text-neutral-400 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-bold tracking-tight text-neutral-900 group-hover:text-black transition-colors">
              {product.name}
            </h3>
            {product.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-neutral-400" />}
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs font-medium text-neutral-500 sm:line-clamp-2 max-w-xl">
            {product.tagline}
          </p>
          <p className="mt-1 text-[10px] font-semibold text-neutral-400">
            {product.category}
          </p>
        </div>
      </button>

      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          playSound('click', soundEnabled);
          onTrackClick(product.id, product.url);
        }}
        className="flex shrink-0 items-center gap-1 rounded-xl bg-neutral-900 px-3.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-neutral-800 self-center mr-3 cursor-pointer"
      >
        Visit
        <ArrowUpRight className="h-3 w-3" />
      </a>
    </div>
  );
};
