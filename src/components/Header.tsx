import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Menu, X, User as UserIcon, Zap, TrendingUp, BookOpen, Plus } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { navigateTo } from '../utils/nav';

export type DirectoryTab = 'directory' | 'saas-ideas' | 'mrr-calculator' | 'pricing';

interface HeaderProps {
  onGoHome?: () => void;
  onOpenSubmit?: () => void;
  onSignIn?: () => void;
  onGoToProfile?: () => void;
  user?: User | null;
  /** Active top-nav section (Directory / SaaS Ideas / Pricing) */
  activeTab?: DirectoryTab;
  onTabChange?: (tab: DirectoryTab) => void;
}

interface TabSwitcherProps {
  activeTab: DirectoryTab;
  onTabChange: (tab: DirectoryTab) => void;
}

const TABS: { key: DirectoryTab; label: string }[] = [
  { key: 'directory', label: 'Directory' },
  { key: 'saas-ideas', label: 'SaaS Ideas' },
  { key: 'mrr-calculator', label: 'MRR Calculator' },
];

const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex items-center gap-5" aria-label="Browse sections">
      {TABS.map((t) => {
        const active = activeTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            aria-current={active ? 'page' : undefined}
            className={`relative py-1 text-[13px] transition-colors cursor-pointer ${active
              ? 'font-bold text-neutral-950'
              : 'font-semibold text-neutral-500 hover:text-neutral-950'
              }`}
          >
            <span>{t.label}</span>
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-neutral-950 transition-opacity ${active ? 'opacity-100' : 'opacity-0'
                }`}
            />
          </button>
        );
      })}
    </nav>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  onOpenSubmit,
  onSignIn,
  onGoToProfile,
  user,
  activeTab = 'directory',
  onTabChange,
}) => {
  // Mobile hamburger menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSubmitClick = () => {
    if (onOpenSubmit) {
      onOpenSubmit();
    } else {
      navigateTo('/submit');
    }
  };

  // Close the menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Logo */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <img
              src="/logo/TopSAAS%20-%20blue.png"
              alt="TopSAAS"
              className="h-8 w-8 shrink-0 rounded-lg object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-display font-black text-lg sm:text-xl tracking-tight text-neutral-950 whitespace-nowrap inline-block shrink-0">
              TopSAAS
            </span>
          </button>

          {/* Center: Top-nav sections (desktop only — mobile lives in the hamburger menu) */}
          {onTabChange && (
            <div className="hidden flex-1 justify-center sm:flex">
              <TabSwitcher activeTab={activeTab} onTabChange={onTabChange} />
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Submit Button - always takes founder directly to /submit */}
            <button
              type="button"
              onClick={handleSubmitClick}
              className="flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Submit</span>
            </button>

            {/* Auth: Sign in or User Avatar (desktop only — mobile lives in the hamburger menu) */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                /* User Avatar — click to view profile */
                <button
                  type="button"
                  onClick={onGoToProfile}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 shadow-2xs hover:border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer"
                  title="My submissions"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-white text-[10px] font-black">
                      {(user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-bold text-neutral-900 truncate max-w-[120px]">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>
              ) : (
                /* Sign in with Google */
                <button
                  type="button"
                  onClick={onSignIn}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                >
                  {/* Google "G" logo */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span className="hidden sm:inline">Sign in with Google</span>
                  <span className="sm:hidden">Sign in</span>
                </button>
              )}
            </div>

            {/* Mobile: Hamburger menu */}
            <div ref={menuRef} className="relative sm:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-menu"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-800 shadow-2xs hover:border-neutral-300 hover:bg-neutral-50 transition-all cursor-pointer active:scale-[0.98]"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div
                  id="mobile-nav-menu"
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl"
                >
                  {onTabChange && (
                    <>
                      {TABS.map((t) => {
                        const active = activeTab === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                              onTabChange(t.key);
                              closeMenu();
                            }}
                            aria-current={active ? 'page' : undefined}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors cursor-pointer ${active
                              ? 'bg-neutral-100 font-bold text-neutral-950'
                              : 'font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                              }`}
                          >
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                      <div className="my-1.5 border-t border-neutral-200" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleSubmitClick();
                      closeMenu();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-bold text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 text-mint-500" />
                    <span>Submit a SaaS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('/trending');
                      closeMenu();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-mint-500" />
                    <span>Trending</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigateTo('/guides');
                      closeMenu();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-mint-500" />
                    <span>Build Guides</span>
                  </button>
                  <div className="my-1 border-t border-neutral-200" />
                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        onGoToProfile?.();
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-3.5 w-3.5 text-mint-500" />
                      <span>My Profile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSignIn?.();
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
                    >
                      {/* Google "G" logo */}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <span>Sign in</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
