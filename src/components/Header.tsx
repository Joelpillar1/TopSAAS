import React from 'react';
import { Trophy, Plus } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  onGoHome?: () => void;
  onOpenSubmit?: () => void;
  onSignIn?: () => void;
  onGoToProfile?: () => void;
  user?: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  onGoHome,
  onOpenSubmit,
  onSignIn,
  onGoToProfile,
  user,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Left: Logo */}
        <button
          type="button"
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white shadow-2xs group-hover:bg-neutral-800 transition-colors">
            <Trophy className="h-4 w-4 fill-white stroke-white" />
          </div>
          <span className="font-black text-lg text-black tracking-tight hidden sm:block">
            TopSAAS
          </span>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Submit Website */}
          <button
            type="button"
            onClick={onOpenSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-black px-3.5 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit Website</span>
            <span className="sm:hidden">Submit</span>
          </button>

          {/* Auth: Sign in or User Avatar */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* User Avatar — click to view profile */}
              <button
                type="button"
                onClick={onGoToProfile}
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 shadow-2xs hover:border-neutral-400 hover:bg-neutral-50 transition-all cursor-pointer"
                title="My submissions"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || 'User'}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white text-[10px] font-black">
                    {(user.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-bold text-black truncate max-w-[120px]">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
                </span>
              </button>
            </div>
          ) : (
            /* Sign in with Google */
            <button
              type="button"
              onClick={onSignIn}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
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
      </div>
    </header>
  );
};
