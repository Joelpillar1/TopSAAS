import React from 'react';
import {
  ShieldCheck,
  Trophy,
  FileText,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { Category } from '../types';
import { playSound } from '../utils/sound';
import { navigateTo } from '../utils/nav';
import { AiAgentsSection } from './AiAgentsSection';

interface RichFooterProps {
  totalProducts: number;
  soundEnabled: boolean;
  onOpenSubmit: () => void;
  onOpenHowItWorks: () => void;
  onSelectCategory: (cat: Category) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenPricing?: () => void;
  className?: string;
}

export const RichFooter: React.FC<RichFooterProps> = ({
  totalProducts,
  soundEnabled,
  onOpenSubmit,
  onOpenHowItWorks,
  onSelectCategory,
  onOpenPrivacy,
  onOpenTerms,
  onOpenPricing,
  className,
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={className || "mt-10 border-t border-neutral-200 bg-white"}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500 text-white shadow-[0_0_0_1px_rgba(37,99,235,0.3)]">
                <Trophy className="h-5 w-5 fill-white stroke-white" />
              </div>
              <span className="font-black text-xl text-neutral-950 tracking-tight">TopSAAS</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs">
              The curated directory of the internet&apos;s best SaaS products. Founders list their
              software, real people discover it, and the best rise to the top.
            </p>
          </div>

          {/* Product Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-900">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenHowItWorks(); }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); navigateTo('/trending'); }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Trending
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); navigateTo('/guides'); }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Build Guides
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenPrivacy?.(); }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenTerms?.(); }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-900">Resources</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://x.com/ads4apps/status/2077469507543498836?s=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  $10K in 90 Days App Marketing
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/ErnestoSOFTWARE/status/2014110519913857122?s=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  $800K/y App Guide
                </a>
              </li>
              <li>
                <a
                  href="https://www.post-bridge.com/growth-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
                >
                  Growth Hack by Jack Friks
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* AI & Agents Machine-Readable Hub */}
        <AiAgentsSection soundEnabled={soundEnabled} />
      </div>

      {/* Featured Badges */}
      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
          <h4 className="text-xs font-bold text-neutral-500 mb-3 text-center">Featured on</h4>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.topsaas.space/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-85 inline-flex items-center"
            >
              <img
                src="https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20light.png"
                alt="Featured on TopSAAS"
                height={36}
                className="h-9 w-auto"
                loading="lazy"
              />
            </a>
            <a
              href="https://spacerrapps.com/apps/topsaas?utm_source=badge&utm_medium=referral&utm_campaign=featured"
              target="_blank"
              rel="noopener"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="https://spacerrapps.com/badge/topsaas.svg?v=2&theme=light"
                alt="TopSAAS is featured on Spacerr"
                className="h-8 w-auto"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            </a>
            <a
              href="https://launchit.fast"
              target="_blank"
              rel="noopener"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="https://launchit.fast/img/launching.svg"
                alt="Featured on LaunchIt"
                className="h-8 w-auto"
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-neutral-500">
            <span>© {currentYear} TopSAAS.</span>
            <span>All rights reserved.</span>
            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); onOpenPrivacy?.(); }}
              className="hover:text-neutral-900 hover:underline transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-neutral-400">•</span>
            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); onOpenTerms?.(); }}
              className="hover:text-neutral-900 hover:underline transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
