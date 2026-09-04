import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Plus, LayoutGrid, Sparkles, Menu, X, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export type DirectoryTab = 'directory' | 'saas-ideas';

interface HeaderProps {
  onGoHome?: () => void;
  onOpenSubmit?: () => void;
  onSignIn?: () => void;
  onGoToProfile?: () => void;
  user?: User | null;
  /** Active top-nav section (Directory / SaaS Ideas) */
  activeTab?: DirectoryTab;
  onTabChange?: (tab: DirectoryTab) => void;
}

interface TabSwitcherProps {
  activeTab: DirectoryTab;
  onTabChange: (tab: DirectoryTab) => void;
}

const TABS: { key: DirectoryTab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'directory',
    label: 'Directory',
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
  },
  {
    key: 'saas-ideas',
    label: 'SaaS Ideas',
    icon: <Sparkles className="h-3.5 w-3.5" />,
  },
];

const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="flex items-center gap-1" aria-label="Browse sections">
      {TABS.map((t) => {
        const active = activeTab === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
              active ? 'font-bold text-white' : 'font-semibold text-neutral-400 hover:text-white'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
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
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-[#222222]/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Logo */}
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500 text-[#0b0f14] shadow-[0_0_0_1px_rgba(102,204,136,0.4)] group-hover:bg-mint-400 transition-colors">
              <Trophy className="h-4 w-4 fill-[#0b0f14] stroke-[#0b0f14]" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">TopSAAS</span>
          </button>

          {/* Center: Top-nav sections (desktop only — mobile lives in the hamburger menu) */}
          {onTabChange && (
            <div className="hidden flex-1 justify-center sm:flex">
              <TabSwitcher activeTab={activeTab} onTabChange={onTabChange} />
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* New Launch */}
            <button
              type="button"
              onClick={onOpenSubmit}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Launch</span>
              <span className="sm:hidden">Launch</span>
            </button>

            {/* Auth: Sign in or User Avatar (desktop only — mobile lives in the hamburger menu) */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                /* User Avatar — click to view profile */
                <button
                  type="button"
                  onClick={onGoToProfile}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-[#343434] px-2.5 py-1.5 shadow-2xs hover:border-neutral-500 transition-all cursor-pointer"
                  title="My submissions"
                >
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata?.full_name || 'User'}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-[#0b0f14] text-[10px] font-black">
                      {(user.email?.[0] || 'U').toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:inline text-xs font-bold text-white truncate max-w-[120px]">
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>
              ) : (
                /* Sign in with Google */
                <button
                  type="button"
                  onClick={onSignIn}
                  className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-[#343434] px-3.5 py-2 text-xs font-bold text-neutral-100 hover:border-neutral-400 hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                >
                  {/* Google "G" logo */}
                  <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-700 bg-[#343434] text-neutral-100 shadow-2xs hover:border-neutral-500 transition-all cursor-pointer active:scale-[0.98]"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              {/* Dropdown panel */}
              {menuOpen && (
                <div
                  id="mobile-nav-menu"
                  className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-neutral-800 bg-[#2a2a2a] p-1.5 shadow-2xl"
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
                            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors cursor-pointer ${
                              active
                                ? 'font-bold text-mint-200 bg-mint-500/15'
                                : 'font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white'
                            }`}
                          >
                            {t.icon}
                            <span>{t.label}</span>
                          </button>
                        );
                      })}
                      <div className="my-1.5 h-px bg-neutral-800" />
                    </>
                  )}

                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        onGoToProfile?.();
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>My Profile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSignIn?.();
                        closeMenu();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
                    >
                      {/* Google "G" logo */}
                      <svg className="h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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