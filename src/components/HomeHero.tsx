import React, { useRef, useState, useEffect } from 'react';
import { Globe, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GridPattern } from '@/components/ui/grid-pattern';
import { playSound } from '../utils/sound';
import grokPng from '../assets/llms/grok.png';
import claudePng from '../assets/llms/claude.png';
import chatgptPng from '../assets/llms/chatgpt.png';
import geminiPng from '../assets/llms/gemini.png';
import googlePng from '../assets/llms/google.png';
import bingPng from '../assets/llms/bing.png';
import perplexityPng from '../assets/llms/perplexity.png';

const PLACEHOLDERS = [
  'https://yourstartup.com',
  'https://formbot.ai',
  'https://devmetrics.io',
  'https://saasflow.app',
  'https://promptengine.co',
];

const AI_LOGOS = [
  { name: 'Grok', src: grokPng, isSquircle: true },
  { name: 'Claude', src: claudePng },
  { name: 'ChatGPT', src: chatgptPng },
  { name: 'Gemini', src: geminiPng },
  { name: 'Google', src: googlePng },
  { name: 'Bing', src: bingPng },
  { name: 'Perplexity', src: perplexityPng },
];

interface HomeHeroProps {
  totalProducts: number;
  totalCategories: number;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onOpenSubmit: (initialUrl?: string) => void;
  soundEnabled: boolean;
  dealsCount?: number;
  stealsOnly?: boolean;
  onToggleSteals?: () => void;
  className?: string;
}

export const HomeHero: React.FC<HomeHeroProps> = ({
  totalCategories,
  onOpenSubmit,
  soundEnabled,
  dealsCount = 0,
  stealsOnly = false,
  onToggleSteals,
  className,
}) => {
  const [launchUrl, setLaunchUrl] = useState('');
  const [placeholderText, setPlaceholderText] = useState('https://yourstartup.com');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused || launchUrl) return;

    let wordIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentWord = PLACEHOLDERS[wordIdx];

      if (isDeleting) {
        setPlaceholderText(currentWord.substring(0, charIdx - 1));
        charIdx--;
      } else {
        setPlaceholderText(currentWord.substring(0, charIdx + 1));
        charIdx++;
      }

      let speed = isDeleting ? 35 : 70;

      if (!isDeleting && charIdx === currentWord.length) {
        speed = 2200;
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        wordIdx = (wordIdx + 1) % PLACEHOLDERS.length;
        speed = 350;
      }

      timeoutId = setTimeout(tick, speed);
    };

    timeoutId = setTimeout(tick, 1000);
    return () => clearTimeout(timeoutId);
  }, [isFocused, launchUrl]);

  const [activeLogoIdx, setActiveLogoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveLogoIdx((prev) => (prev + 1) % AI_LOGOS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = launchUrl.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    playSound('click', soundEnabled);
    onOpenSubmit(trimmed);
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden px-1 mt-0 sm:mt-5 pt-0 sm:pt-6 pb-1",
        className
      )}
      aria-label="Find the best SaaS"
    >
      {/* Background: subtle grid pattern */}
      <GridPattern
        width={32}
        height={32}
        x={-1}
        y={-1}
        strokeDasharray="3 3"
        squares={[
          [4, 4],
          [5, 1],
          [8, 2],
          [5, 3],
          [5, 5],
          [10, 10],
          [12, 15],
        ]}
        className={cn(
          '[mask-image:radial-gradient(560px_circle_at_center,white,transparent)]',
          'inset-x-0 inset-y-[-30%] h-[200%] skew-y-12',
          'fill-neutral-300/30 stroke-neutral-300/40',
        )}
      />
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center">
        {/* Top AI & Search Models Badge */}
        <div className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 sm:gap-2.5 rounded-full border border-neutral-200/90 bg-white/95 px-2.5 sm:px-3.5 py-1 sm:py-1.5 shadow-2xs backdrop-blur-xs max-w-full">
          <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-neutral-500 tracking-tight shrink-0">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            Get cited by
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {AI_LOGOS.map((logo, idx) => {
              const isActive = activeLogoIdx === idx;
              return (
                <img
                  key={logo.name}
                  src={logo.src}
                  alt={logo.name}
                  title={logo.name}
                  width={18}
                  height={18}
                  className={cn(
                    'h-[14px] w-[14px] sm:h-[18px] sm:w-[18px] object-contain transition-all duration-500',
                    logo.isSquircle && 'rounded-[2px] sm:rounded-[3px]',
                    isActive
                      ? 'scale-125 -translate-y-0.5 drop-shadow-[0_2px_8px_rgba(37,99,235,0.4)] brightness-110'
                      : 'opacity-80 hover:opacity-100 hover:scale-110'
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Headline: strictly 2 lines on mobile and desktop */}
        <h1 className="text-[25px] min-[390px]:text-[28px] sm:text-5xl font-black leading-[1.14] sm:leading-[1.08] tracking-tight text-neutral-950">
          <span className="block">The Launchpad Built</span>
          {' '}
          <span className="block whitespace-nowrap shimmer-text-ai">For Humans &amp; AI Search.</span>
        </h1>

        <p className="mt-3.5 text-xs sm:text-sm font-medium text-neutral-500 max-w-lg">
          Get your startup discovered by early adopters and indexed by Google, Bing, AI search, and LLMs.
        </p>

        {/* Launch Now input and button */}
        <form
          onSubmit={handleSubmitLaunch}
          className="relative mt-4 w-full max-w-lg flex items-center rounded-xl sm:rounded-2xl border border-neutral-300 bg-white p-1 shadow-2xs transition-all focus-within:border-mint-500 focus-within:ring-4 focus-within:ring-mint-500/10 hover:border-neutral-400"
        >
          <div className="flex items-center pl-2.5 pr-2 text-neutral-400">
            <Globe className="h-4 w-4 shrink-0" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={launchUrl}
            onChange={(e) => setLaunchUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholderText}
            aria-label="Your SaaS website URL"
            required
            className="w-full bg-transparent py-1.5 text-sm font-semibold text-neutral-900 placeholder-neutral-400 outline-none"
          />
          <button
            type="submit"
            data-ml-goal="launch_cta_click"
            className="shrink-0 btn-primary px-4 sm:px-4.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl"
          >
            Launch Now
          </button>
        </form>

        {/* Combined micro-benefits and live stats on the same line */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-[11px] font-semibold text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="text-mint-600 font-bold">✓</span> AI prefill
          </span>
          <span className="text-neutral-300">·</span>
          <span className="flex items-center gap-1">
            <span className="text-mint-600 font-bold">✓</span> Takes 30 secs
          </span>
          <span className="text-neutral-300">·</span>
          <span className="flex items-center gap-1">
            <span className="text-mint-600 font-bold">✓</span> 100% Free
          </span>
          {dealsCount > 0 && onToggleSteals && (
            <>
              <span className="text-neutral-300">·</span>
              <button
                type="button"
                onClick={() => {
                  onToggleSteals();
                  const section = document.getElementById('leaderboard-section');
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${stealsOnly ? 'text-amber-700 font-bold' : 'text-neutral-600 hover:text-amber-600'
                  }`}
                title={stealsOnly ? 'Turn off Steals Only filter' : 'Show only tools with exclusive discounts'}
              >
                <Flame className={`h-3.5 w-3.5 ${stealsOnly ? 'text-amber-600 fill-amber-500/30 animate-pulse' : 'text-amber-500'}`} />
                <span className={`font-bold font-mono-num ${stealsOnly ? 'text-amber-800' : 'text-neutral-800'}`}>{dealsCount}</span>
                <span>{dealsCount === 1 ? 'steal' : 'steals'}</span>
                {stealsOnly && (
                  <span className="text-[9px] font-black text-amber-700 bg-amber-100/70 px-1 rounded">
                    active
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
