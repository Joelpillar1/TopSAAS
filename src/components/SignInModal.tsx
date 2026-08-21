import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export const SignInModal: React.FC<SignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-300 bg-white shadow-2xl p-6 sm:p-8 text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white mb-5 shadow-2xs">
          <ShieldCheck className="h-7 w-7" />
        </div>

        {/* Text */}
        <h3 className="text-lg font-black text-black mb-1.5">
          Sign in to continue
        </h3>
        <p className="text-xs text-neutral-500 mb-6 max-w-[260px] mx-auto leading-relaxed">
          You need an account to submit a website to the directory. It's free and takes seconds.
        </p>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs text-neutral-400 hover:text-black transition-colors cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
};
