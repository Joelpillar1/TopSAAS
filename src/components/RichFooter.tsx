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

  // The footer is always white site-wide. Drop any background utility passed in
  // by a page so it can never paint a different footer color.
  const extraClasses = (className ?? '')
    .split(/\s+/)
    .filter((token) => token && !/(^|:)bg-/.test(token))
    .join(' ');

  const footerClassName = ['mt-10 border-t border-neutral-200 bg-white', extraClasses]
    .filter(Boolean)
    .join(' ');

  return (
    <footer className={footerClassName}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo/TopSAAS%20-%20blue.png"
                alt="TopSAAS"
                className="h-9 w-9 shrink-0 rounded-xl object-contain"
              />
              <span className="font-black text-xl text-neutral-950 tracking-tight">TopSAAS</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed max-w-xs">
              The curated directory of the internet&apos;s best SaaS products. Founders list their
              software, real people discover it, and the best rise to the top.
            </p>

            {/* Seamless Infinite Marquee Badges (Constrained to ~2 badges at a time) */}
            <div className="relative w-full max-w-[270px] overflow-hidden pt-1.5">
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent z-10" />
              <div className="flex w-max items-center gap-4 animate-marquee-infinite py-1">
                {/* Set 1 */}
                <a
                  href="https://www.topsaas.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-85 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20light.png"
                    alt="Featured on TopSAAS"
                    height={32}
                    className="h-8 w-auto"
                    loading="lazy"
                  />
                </a>
                <a
                  href="https://spacerrapps.com/apps/topsaas?utm_source=badge&utm_medium=referral&utm_campaign=featured"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://spacerrapps.com/badge/topsaas.svg?v=2&theme=light"
                    alt="TopSAAS is featured on Spacerr"
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://launchit.fast"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://launchit.fast/img/launching.svg"
                    alt="Featured on LaunchIt"
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://verifieddr.com/website/topsaas-space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://verifieddr.com/badge/topsaas-space.svg?metric=truedr"
                    alt="Verified DR - Verified Domain Rating for topsaas.space"
                    width={220}
                    height={68}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://www.scrolllaunch.com/products/topsaas?ref=badge"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://www.scrolllaunch.com/api/badge/topsaas?variant=launched&theme=light"
                    alt="TopSAAS - Featured on ScrollLaunch"
                    width={220}
                    height={48}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <span
                  style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    fontFamily: 'system-ui,sans-serif',
                    lineHeight: 1,
                  }}
                  className="transition-opacity hover:opacity-85 inline-flex flex-col items-center shrink-0"
                >
                  <a
                    href="https://tools.launchllama.co/products/topsaas?utm_source=badge&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', lineHeight: 0 }}
                  >
                    <img
                      src="https://tools.launchllama.co/featured-badge.png?v=2"
                      alt="Launch Llama Tools"
                      width={200}
                      height={52}
                      className="h-7.5 w-auto"
                      style={{ display: 'block', border: 0 }}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  </a>
                  <a
                    href="https://mcpshelf.co/?utm_source=badge&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      marginTop: -2,
                      paddingTop: 0,
                      fontSize: 7,
                      fontWeight: 600,
                      color: '#888',
                      textDecoration: 'none',
                      lineHeight: 1,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Launch your MCP
                  </a>
                </span>
                <a
                  href="https://getbannerbid.com/directory"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://getbannerbid.com/badges/listed-dark.svg"
                    alt="Listed on GetBannerBid"
                    width={200}
                    height={54}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://builtbyindies.com/products/topsaas?utm_source=badge&utm_medium=embed&utm_campaign=live"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://builtbyindies.com/badge/82e153d0-3bf0-4245-95ad-d9d9f5174868.svg"
                    alt="BuiltByIndies"
                    height={60}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://submitmysaas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://submitmysaas.com/featured-badge.png"
                    alt="Featured on SubmitMySaas"
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://www.indietool.io"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://www.indietool.io/badge.svg"
                    alt="Featured on IndieTool"
                    width={236}
                    height={54}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <div className="inline-flex items-center shrink-0 transition-opacity hover:opacity-80 [&_img]:h-8 [&_img]:w-auto [&_img]:max-w-full">
                  <a href="https://daniellaunches.com" target="_blank">
                    <img src="https://daniellaunches.com/badge-light.svg" alt="Featured on DanielLaunches" width="220" height="48" />
                  </a>
                </div>
                <a
                  href="https://twelve.tools"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://twelve.tools/badge3-white.svg"
                    alt="Featured on Twelve Tools"
                    width={148}
                    height={40}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://startupfa.me/s/topsaas?utm_source=topsaas.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://startupfa.me/badges/featured-badge.webp"
                    alt="TopSAAS - Featured on Startup Fame"
                    width={171}
                    height={54}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://fazier.com/launches/topsaas.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral"
                    alt="Fazier badge"
                    width={250}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://www.showmysites.com"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://www.showmysites.com/static/backlink/gray_border.webp"
                    alt="ShowMySites Badge"
                    width={200}
                    height={60}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>

                {/* Set 2 (for seamless infinite loop) */}
                <a
                  href="https://www.topsaas.space/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-85 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://topsaas.space/Share%20Badge/TopSAAS%20Type%202%20-%20light.png"
                    alt="Featured on TopSAAS"
                    height={32}
                    className="h-8 w-auto"
                    loading="lazy"
                  />
                </a>
                <a
                  href="https://spacerrapps.com/apps/topsaas?utm_source=badge&utm_medium=referral&utm_campaign=featured"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://spacerrapps.com/badge/topsaas.svg?v=2&theme=light"
                    alt="TopSAAS is featured on Spacerr"
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://launchit.fast"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://launchit.fast/img/launching.svg"
                    alt="Featured on LaunchIt"
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://verifieddr.com/website/topsaas-space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://verifieddr.com/badge/topsaas-space.svg?metric=truedr"
                    alt="Verified DR - Verified Domain Rating for topsaas.space"
                    width={220}
                    height={68}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://www.scrolllaunch.com/products/topsaas?ref=badge"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://www.scrolllaunch.com/api/badge/topsaas?variant=launched&theme=light"
                    alt="TopSAAS - Featured on ScrollLaunch"
                    width={220}
                    height={48}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <span
                  style={{
                    display: 'inline-block',
                    textAlign: 'center',
                    fontFamily: 'system-ui,sans-serif',
                    lineHeight: 1,
                  }}
                  className="transition-opacity hover:opacity-85 inline-flex flex-col items-center shrink-0"
                >
                  <a
                    href="https://tools.launchllama.co/products/topsaas?utm_source=badge&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', lineHeight: 0 }}
                  >
                    <img
                      src="https://tools.launchllama.co/featured-badge.png?v=2"
                      alt="Launch Llama Tools"
                      width={200}
                      height={52}
                      className="h-7.5 w-auto"
                      style={{ display: 'block', border: 0 }}
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  </a>
                  <a
                    href="https://mcpshelf.co/?utm_source=badge&utm_medium=referral"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      marginTop: -2,
                      paddingTop: 0,
                      fontSize: 7,
                      fontWeight: 600,
                      color: '#888',
                      textDecoration: 'none',
                      lineHeight: 1,
                      letterSpacing: '0.02em',
                    }}
                  >
                    Launch your MCP
                  </a>
                </span>
                <a
                  href="https://getbannerbid.com/directory"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://getbannerbid.com/badges/listed-dark.svg"
                    alt="Listed on GetBannerBid"
                    width={200}
                    height={54}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://builtbyindies.com/products/topsaas?utm_source=badge&utm_medium=embed&utm_campaign=live"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://builtbyindies.com/badge/82e153d0-3bf0-4245-95ad-d9d9f5174868.svg"
                    alt="BuiltByIndies"
                    height={60}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://submitmysaas.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://submitmysaas.com/featured-badge.png"
                    alt="Featured on SubmitMySaas"
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://www.indietool.io"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://www.indietool.io/badge.svg"
                    alt="Featured on IndieTool"
                    width={236}
                    height={54}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <div className="inline-flex items-center shrink-0 transition-opacity hover:opacity-80 [&_img]:h-8 [&_img]:w-auto [&_img]:max-w-full">
                  <a href="https://daniellaunches.com" target="_blank">
                    <img src="https://daniellaunches.com/badge-light.svg" alt="Featured on DanielLaunches" width="220" height="48" />
                  </a>
                </div>
                <a
                  href="https://twelve.tools"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://twelve.tools/badge3-white.svg"
                    alt="Featured on Twelve Tools"
                    width={148}
                    height={40}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://startupfa.me/s/topsaas?utm_source=topsaas.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://startupfa.me/badges/featured-badge.webp"
                    alt="TopSAAS - Featured on Startup Fame"
                    width={171}
                    height={54}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://fazier.com/launches/topsaas.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=neutral"
                    alt="Fazier badge"
                    width={250}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
                <a
                  href="https://www.showmysites.com"
                  target="_blank"
                  rel="noopener"
                  className="transition-opacity hover:opacity-80 inline-flex items-center shrink-0"
                >
                  <img
                    src="https://www.showmysites.com/static/backlink/gray_border.webp"
                    alt="ShowMySites Badge"
                    width={200}
                    height={60}
                    className="h-7.5 w-auto"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                </a>
              </div>
            </div>
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
                <a
                  href="/pricing"
                  onClick={(e) => {
                    e.preventDefault();
                    playSound('click', soundEnabled);
                    if (onOpenPricing) onOpenPricing();
                    else navigateTo('/pricing');
                  }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Pricing
                </a>
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
                <a
                  href="/directories"
                  onClick={(e) => { e.preventDefault(); playSound('click', soundEnabled); navigateTo('/directories'); }}
                  className="text-xs text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Product Directories
                </a>
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

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-[11px] text-neutral-500">
            <span>© {currentYear} TopSAAS.</span>
            <span>All rights reserved.</span>
            <a
              href="/pricing"
              onClick={(e) => {
                e.preventDefault();
                playSound('click', soundEnabled);
                if (onOpenPricing) onOpenPricing();
                else navigateTo('/pricing');
              }}
              className="hover:text-neutral-900 hover:underline transition-colors cursor-pointer"
            >
              Pricing
            </a>
            <span className="text-neutral-400">•</span>
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
