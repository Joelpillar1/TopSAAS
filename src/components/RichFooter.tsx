import {
  ShieldCheck,
  Sparkles,
  Trophy,
  Globe,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import { Category } from '../types';
import { playSound } from '../utils/sound';
import { AiAgentsSection } from './AiAgentsSection';

interface RichFooterProps {
  totalProducts: number;
  soundEnabled: boolean;
  onOpenSubmit: () => void;
  onOpenHowItWorks: () => void;
  onSelectCategory: (cat: Category) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
}

export const RichFooter: React.FC<RichFooterProps> = ({
  totalProducts,
  soundEnabled,
  onOpenSubmit,
  onOpenHowItWorks,
  onSelectCategory,
  onOpenPrivacy,
  onOpenTerms,
}) => {
  const currentYear = new Date().getFullYear();

  const handleCategoryClick = (cat: Category) => {
    playSound('click', soundEnabled);
    onSelectCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-10 border-t border-neutral-800 bg-[#1c1c1c]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500 text-[#0b0f14]">
                <Trophy className="h-5 w-5 fill-[#0b0f14] stroke-[#0b0f14]" />
              </div>
              <span className="font-black text-xl text-white tracking-tight">TopSAAS</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">
              The curated directory of the internet&apos;s best SaaS products. Founders list their
              software, real people discover it, and the best rise to the top.
            </p>
            {/* Mini Stats */}
            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-neutral-800">
                  <Globe className="h-3 w-3 text-neutral-300" />
                </div>
                <span className="font-bold text-white font-mono-num">{totalProducts}</span>
                <span className="text-neutral-500">products</span>
              </div>
            </div>

          </div>

          {/* Product Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-200">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenHowItWorks(); }}
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenSubmit(); }}
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3" />
                  New Launch
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenPrivacy?.(); }}
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { playSound('click', soundEnabled); onOpenTerms?.(); }}
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="h-3 w-3" />
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Categories Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-200">Categories</h4>
            <ul className="space-y-2.5">
              {(['AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3'] as const).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <LayoutGrid className="h-3 w-3 text-neutral-600" />
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-neutral-200">Resources</h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://x.com/ads4apps/status/2077469507543498836?s=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  $10K in 90 Days App Marketing
                </a>
              </li>
              <li>
                <a
                  href="https://x.com/ErnestoSOFTWARE/status/2014110519913857122?s=46"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  $800K/y App Guide
                </a>
              </li>
              <li>
                <a
                  href="https://www.post-bridge.com/growth-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-neutral-500 hover:text-white transition-colors cursor-pointer"
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

      {/* Bottom Bar */}
      <div className="border-t border-neutral-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-neutral-500">
            <span>© {currentYear} TopSAAS.</span>
            <span>All rights reserved.</span>
            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); onOpenPrivacy?.(); }}
              className="hover:text-white hover:underline transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <span className="text-neutral-700">•</span>
            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); onOpenTerms?.(); }}
              className="hover:text-white hover:underline transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-neutral-500">
            <span className="font-mono-num">{totalProducts} products indexed</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
