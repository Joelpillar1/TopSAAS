import React from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Trophy,
  ExternalLink,
  Twitter,
  Github,
  Globe,
  Heart,
  ArrowUp,
  Star,
  Zap,
  LayoutGrid,
  TrendingUp,
} from 'lucide-react';
import { Category } from '../types';
import { playSound } from '../utils/sound';

interface RichFooterProps {
  totalProducts: number;
  totalScore: number;
  soundEnabled: boolean;
  onOpenSubmit: () => void;
  onOpenHowItWorks: () => void;
  onSelectCategory: (cat: Category) => void;
}

export const RichFooter: React.FC<RichFooterProps> = ({
  totalProducts,
  totalScore,
  soundEnabled,
  onOpenSubmit,
  onOpenHowItWorks,
  onSelectCategory,
}) => {
  const currentYear = new Date().getFullYear();

  const handleCategoryClick = (cat: Category) => {
    playSound('click', soundEnabled);
    onSelectCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-neutral-200 bg-white mt-8">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white shadow-2xs">
                <Trophy className="h-5 w-5 fill-white stroke-white" />
              </div>
              <span className="font-black text-xl text-black tracking-tight">TopSAAS</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
              The curated directory of top SaaS products. Play the Dino Runner, rank up, and explore the internet&apos;s best tools — free and open.
            </p>
            {/* Mini Stats */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-100">
                  <Globe className="h-3 w-3 text-neutral-600" />
                </div>
                <span className="font-bold text-black font-mono-num">{totalProducts}</span>
                <span className="text-neutral-500">products</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-100">
                  <ArrowUp className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="font-bold text-black font-mono-num">{totalScore.toLocaleString()}</span>
                <span className="text-neutral-500">total score</span>
              </div>
            </div>
            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs"
                title="Follow on Twitter / X"
              >
                <Twitter className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:text-black hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs"
                title="View on GitHub"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Product</h4>
            <ul className="space-y-2">
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenHowItWorks(); }}
                  className="text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Zap className="h-3 w-3" />
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenSubmit(); }}
                  className="text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3" />
                  Submit Website
                </button>
              </li>

            </ul>
          </div>

          {/* Categories Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Categories</h4>
            <ul className="space-y-2">
              {(['AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3'] as const).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="text-xs text-neutral-500 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LayoutGrid className="h-3 w-3" />
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">Useful Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://x.com/ads4apps/status/2077469507543498836?s=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  <span>$10K in 90 Days App Marketing</span>
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/ErnestoSOFTWARE/status/2014110519913857122?s=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  <span>$800K/y App Guide</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.post-bridge.com/growth-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-black transition-colors flex items-center gap-1.5"
                >
                  <TrendingUp className="h-3 w-3 shrink-0" />
                  <span>Growth Hack by Jack Friks</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span>© {currentYear} TopSAAS.</span>
            <span>All rights reserved.</span>
            <span className="text-neutral-400">•</span>
            <span className="flex items-center gap-0.5">
              Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> by the community
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline font-mono-num">{totalProducts} products indexed</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
