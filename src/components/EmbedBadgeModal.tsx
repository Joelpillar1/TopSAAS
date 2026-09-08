import React, { useState } from 'react';
import { X, Check, Copy, Code2, Download, ExternalLink, Sparkles, Trophy, ChevronUp } from 'lucide-react';
import { Product } from '../types';
import {
  BadgeStyle,
  BadgeTheme,
  BadgeFormat,
  generateBadgeSvg,
  generateBadgeSnippet,
  getProductTopSaasUrl,
} from '../utils/badgeSvg';
import { playSound } from '../utils/sound';

interface EmbedBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  soundEnabled?: boolean;
}

export const EmbedBadgeModal: React.FC<EmbedBadgeModalProps> = ({
  isOpen,
  onClose,
  product,
  soundEnabled = true,
}) => {
  const [style, setStyle] = useState<BadgeStyle>('featured');
  const [theme, setTheme] = useState<BadgeTheme>('light');
  const [format, setFormat] = useState<BadgeFormat>('html');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const svgContent = generateBadgeSvg(product, { style, theme });
  const snippet = generateBadgeSnippet(product, style, theme, format);
  const liveUrl = getProductTopSaasUrl(product);

  const handleCopy = async () => {
    try {
      playSound('click', soundEnabled);
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleDownloadSvg = () => {
    playSound('click', soundEnabled);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `topsaas-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${style}-${theme}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-xl rounded-2xl border border-neutral-800 bg-[#222222] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-white max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/15 border border-mint-500/30 text-mint-400">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Embed Founder Badge</h3>
              <p className="text-[11px] text-neutral-400">Show off your TopSAAS ranking & collect upvotes</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-neutral-400">
              <span>LIVE PREVIEW</span>
              <span className="text-mint-400 font-medium">Clicking opens your directory listing</span>
            </div>

            <div
              className={`flex items-center justify-center rounded-xl p-8 border transition-all ${
                theme === 'dark'
                  ? 'bg-[#0f0f11] border-neutral-800'
                  : 'bg-[#f4f4f5] border-neutral-300'
              }`}
            >
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-95 transition-opacity hover:scale-[1.02] transform duration-150 inline-block shadow-md rounded-2xl"
                title="Click to visit your listing"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Style Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Badge Style
              </label>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[#2a2a2a] p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setStyle('featured');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    style === 'featured'
                      ? 'bg-mint-500 text-[#0b0f14] shadow-xs'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                  title="Featured On TopSAAS (with mint upvote chevron)"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Featured</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setStyle('classic');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    style === 'classic'
                      ? 'bg-mint-500 text-[#0b0f14] shadow-xs'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                  title="Classic Minimal (DanielLaunches style)"
                >
                  <Trophy className="h-3 w-3" />
                  <span>Classic</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setStyle('rank');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    style === 'rank'
                      ? 'bg-mint-500 text-[#0b0f14] shadow-xs'
                      : 'text-neutral-300 hover:text-white'
                  }`}
                  title="Live Leaderboard Rank"
                >
                  <Trophy className="h-3 w-3" />
                  <span>Rank</span>
                </button>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                Theme Color
              </label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#2a2a2a] p-1 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setTheme('dark');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Dark Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setTheme('light');
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-neutral-800 text-white border border-neutral-700 shadow-xs'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Light Mode
                </button>
              </div>
            </div>
          </div>

          {/* Code Snippet Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 rounded-lg bg-[#2a2a2a] p-0.5 border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setFormat('html')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    format === 'html' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('markdown')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    format === 'markdown' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Markdown (README)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('image_url')}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    format === 'image_url' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Image URL
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title="Download SVG file"
                >
                  <Download className="h-3 w-3" />
                  <span>Download SVG</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl border border-neutral-800 bg-[#17171a] p-3 font-mono text-[11px] text-neutral-300 leading-relaxed overflow-x-auto">
              <pre className="whitespace-pre-wrap break-all pr-14">{snippet}</pre>
              <button
                type="button"
                onClick={handleCopy}
                className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  copied
                    ? 'bg-mint-500 text-[#0b0f14]'
                    : 'bg-[#2a2a2a] text-white hover:bg-neutral-700 border border-neutral-700'
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

          {/* Quick instructions */}
          <div className="rounded-xl border border-neutral-800/60 bg-[#2a2a2a]/60 p-3 text-[11.5px] text-neutral-400 leading-relaxed flex items-start gap-2.5">
            <span className="text-mint-400 font-bold shrink-0">Tip:</span>
            <span>
              Paste this snippet into your website footer, landing page hero, or GitHub README. Every click links
              straight to your TopSAAS listing to drive more community upvotes!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-800 px-5 py-3.5 flex items-center justify-between bg-[#1f1f22] shrink-0">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
          >
            <span>View Public Listing</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer shadow-sm ${
              copied
                ? 'bg-mint-500 text-[#0b0f14]'
                : 'bg-white text-black hover:bg-neutral-200'
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
