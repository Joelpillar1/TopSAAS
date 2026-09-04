import React, { useState, useRef, useEffect } from 'react';
import { Crown, Search, X, Eraser } from 'lucide-react';
import { Product } from '../types';
import { ProductLogo } from './ProductLogo';

interface FeaturedProductSelectorProps {
  products: Product[];
  featuredId: string | null;
  onSelect: (productId: string | null) => void;
}

export const FeaturedProductSelector: React.FC<FeaturedProductSelectorProps> = ({
  products,
  featuredId,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const featured = products.find((p) => p.id === featuredId);

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={dropdownRef} className="relative mb-2">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-[#2a2a2a] px-3 py-1.5 text-xs font-bold text-neutral-300 hover:border-mint-500/60 hover:text-white transition-all cursor-pointer"
      >
        <Crown className="h-3 w-3 text-mint-500" />
        <span>
          {featured ? `Featured: ${featured.name}` : 'Set Featured Product'}
        </span>
        <X
          className="h-3 w-3 text-neutral-400 hover:text-red-400"
          onClick={(e) => {
            e.stopPropagation();
            onSelect('');
          }}
          title="Clear featured"
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-80 rounded-xl border border-neutral-800 bg-[#2a2a2a] shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-neutral-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto">              {/* Default & Empty options */}
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setOpen(false);
                setQuery('');
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-800/60 transition-colors cursor-pointer ${
                featuredId === null ? 'bg-mint-500/15' : ''
              }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-amber-400 text-white">
                <Crown className="h-3 w-3 fill-white stroke-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">Default</div>
                <div className="text-[10px] text-neutral-400">Show featured banner placeholder</div>
              </div>
              {featuredId === null && (
                <Crown className="h-3 w-3 text-mint-500 shrink-0 fill-mint-500" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onSelect('');
                setOpen(false);
                setQuery('');
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-800/60 transition-colors cursor-pointer ${
                featuredId === '' ? 'bg-mint-500/15' : ''
              }`}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-neutral-700 text-neutral-300">
                <Eraser className="h-3 w-3" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white">Empty</div>
                <div className="text-[10px] text-neutral-400">Clear featured, show no spotlight</div>
              </div>
              {featuredId === '' && (
                <Crown className="h-3 w-3 text-mint-500 shrink-0 fill-mint-500" />
              )}
            </button>
            <div className="border-b border-neutral-800 mx-3" />
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onSelect(p.id);
                  setOpen(false);
                  setQuery('');
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-800/60 transition-colors cursor-pointer ${
                  p.id === featuredId ? 'bg-mint-500/15' : ''
                }`}
              >
                <ProductLogo
                  src={p.logoUrl}
                  alt={p.name}
                  containerClassName="h-5 w-5 rounded border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                  iconClassName="h-3 w-3 text-black shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{p.name}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{p.tagline}</div>
                </div>
                <span className="text-[10px] text-neutral-500 shrink-0">{p.category}</span>
                {p.id === featuredId && (
                  <Crown className="h-3 w-3 text-mint-500 shrink-0 fill-mint-500" />
                )}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-neutral-400">No products found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};