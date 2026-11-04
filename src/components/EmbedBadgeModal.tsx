import React, { useState } from 'react';
import { X, Check, Copy, Code2, Download, ExternalLink } from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';

interface EmbedBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  soundEnabled?: boolean;
}

export type BadgeVariant = 'type1-blue' | 'type1-light' | 'type2-blue' | 'type2-light';
export type BadgeFormat = 'html' | 'markdown' | 'image_url';

export const BADGE_OPTIONS: {
  id: BadgeVariant;
  label: string;
  sublabel: string;
  src: string;
  fullUrl: string;
  bg: string;
  previewBg: string;
}[] = [
  {
    id: 'type1-blue',
    label: 'Type 1 · Blue',
    sublabel: 'Electric blue brand gradient',
    src: '/Share%20Badge/TopSAAS%20Type%201%20-%20blue.png',
    fullUrl: 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%201%20-%20blue.png',
    bg: 'bg-[#1a2580]',
    previewBg: 'bg-[#0f154c]',
  },
  {
    id: 'type1-light',
    label: 'Type 1 · Light',
    sublabel: 'Clean light badge for dark sites',
    src: '/Share%20Badge/TopSAAS%20Type%201%20-%20light.png',
    fullUrl: 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%201%20-%20light.png',
    bg: 'bg-white',
    previewBg: 'bg-neutral-100',
  },
  {
    id: 'type2-blue',
    label: 'Type 2 · Blue',
    sublabel: 'Compact blue pill badge',
    src: '/Share%20Badge/TopSAAS%20Type%202%20-%20blue.png',
    fullUrl: 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20blue.png',
    bg: 'bg-[#1a2580]',
    previewBg: 'bg-[#0f154c]',
  },
  {
    id: 'type2-light',
    label: 'Type 2 · Light',
    sublabel: 'Compact clean light badge',
    src: '/Share%20Badge/TopSAAS%20Type%202%20-%20light.png',
    fullUrl: 'https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20light.png',
    bg: 'bg-white',
    previewBg: 'bg-neutral-100',
  },
];

export const EmbedBadgeModal: React.FC<EmbedBadgeModalProps> = ({
  isOpen,
  onClose,
  product,
  soundEnabled = true,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<BadgeVariant>('type1-blue');
  const [format, setFormat] = useState<BadgeFormat>('html');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const selectedBadge = BADGE_OPTIONS.find((b) => b.id === selectedVariant) || BADGE_OPTIONS[0];
  const productListingUrl = `https://topsaas.space/product/${encodeURIComponent(product.id)}`;
  const badgeAltText = `Featured on TopSAAS`;

  const snippet = (() => {
    if (format === 'html') {
      return `<a href="${productListingUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${selectedBadge.fullUrl}" alt="${badgeAltText}" height="36" />\n</a>`;
    }
    if (format === 'markdown') {
      return `[![${badgeAltText}](${selectedBadge.fullUrl})](${productListingUrl})`;
    }
    return selectedBadge.fullUrl;
  })();

  const handleCopy = async () => {
    try {
      playSound('click', soundEnabled);
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownload = async () => {
    playSound('click', soundEnabled);
    try {
      const response = await fetch(selectedBadge.src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `topsaas-badge-${selectedVariant}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(selectedBadge.src, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-neutral-900 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-600">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-neutral-950">Embed Official Badge</h3>
              <p className="text-[11px] text-neutral-500">Show off your TopSAAS badge & collect community upvotes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-500">
              <span>LIVE PREVIEW</span>
              <span className="text-mint-600 font-medium">Clicking opens your directory listing</span>
            </div>

            <div
              className={`flex items-center justify-center rounded-xl p-6 sm:p-8 border border-neutral-200 transition-all ${selectedBadge.previewBg}`}
            >
              <a
                href={productListingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-95 transition-transform hover:scale-[1.03] inline-block shadow-md rounded-xl"
                title="Click to visit your listing"
              >
                <img
                  src={selectedBadge.src}
                  alt={selectedBadge.label}
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </a>
            </div>
          </div>

          {/* 1. Pick Official Badge Variant */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider block">
              1. Choose Badge Design
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {BADGE_OPTIONS.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setSelectedVariant(badge.id);
                  }}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all cursor-pointer ${
                    selectedVariant === badge.id
                      ? 'border-mint-500 shadow-md shadow-mint-500/20'
                      : 'border-neutral-200 hover:border-neutral-300'
                  } ${badge.bg}`}
                >
                  {selectedVariant === badge.id && (
                    <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-mint-500 shadow-xs">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </span>
                  )}
                  <img
                    src={badge.src}
                    alt={badge.label}
                    className="h-8 w-auto object-contain"
                    draggable={false}
                  />
                  <span
                    className={`text-[10px] font-bold ${
                      badge.id.endsWith('light') ? 'text-neutral-700' : 'text-white/85'
                    }`}
                  >
                    {badge.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Code Snippet Box */}
          <div className="space-y-2 border-t border-neutral-200 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                2. Copy Snippet
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-0.5 border border-neutral-200 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFormat('html')}
                  className={`px-2.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    format === 'html' ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('markdown')}
                  className={`px-2.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    format === 'markdown' ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('image_url')}
                  className={`px-2.5 py-0.5 rounded font-bold transition-all cursor-pointer ${
                    format === 'image_url' ? 'bg-neutral-950 text-white' : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            <div className="relative rounded-xl border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] text-neutral-800 leading-relaxed overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all pr-16">{snippet}</pre>
              <button
                type="button"
                onClick={handleCopy}
                className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-mint-500 text-white'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick instructions & Download */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50 p-3 text-[11px] text-neutral-600">
            <p className="leading-relaxed">
              Embed this badge in your footer, navbar, or GitHub README to showcase your launch on TopSAAS.
            </p>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 shrink-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer shadow-2xs"
              title="Download Badge PNG file"
            >
              <Download className="h-3 w-3" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 px-5 py-3.5 flex items-center justify-between bg-neutral-50 shrink-0">
          <a
            href={productListingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-950 transition-colors"
          >
            <span>View Public Listing</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-sm ${
              copied ? 'bg-mint-500 text-white' : 'bg-neutral-950 text-white hover:bg-neutral-800'
            }`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Embed Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
