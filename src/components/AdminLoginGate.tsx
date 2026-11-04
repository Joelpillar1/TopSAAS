import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { verifyAdminCredentials } from '../utils/adminAuth';
import { playSound } from '../utils/sound';
import confetti from 'canvas-confetti';

interface AdminLoginGateProps {
  onSuccess: (adminEmail: string) => void;
  onBackToHome: () => void;
  soundEnabled?: boolean;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onSuccess,
  onBackToHome,
  soundEnabled = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = await verifyAdminCredentials(email, password);
      if (result.success) {
        playSound('success', soundEnabled);
        try {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
        onSuccess(email.trim().toLowerCase());
      } else {
        playSound('click', soundEnabled);
        setErrorMessage(result.error || 'Invalid administrator credentials.');
      }
    } catch {
      setErrorMessage('An unexpected error occurred during verification.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Top Header Card */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-mint-500 to-emerald-400 text-white shadow-md shadow-mint-500/20 ring-4 ring-mint-500/10">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-950 sm:text-3xl">
            Admin Portal Access
          </h2>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Please authenticate with your administrator credentials to access <span className="font-mono font-bold text-neutral-800">/accept</span>.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="mt-8 rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-semibold text-red-700 flex items-start gap-2.5">
              <span className="shrink-0 mt-0.5 text-red-500 font-bold">✕</span>
              <p className="flex-1 leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Admin Email
              </label>
              <div className="relative rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 hover:border-neutral-300">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@topsaas.co"
                  className="w-full bg-transparent py-2.5 pl-9 pr-3 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl border border-neutral-200 bg-white transition-all focus-within:border-mint-500 focus-within:ring-2 focus-within:ring-mint-500/20 hover:border-neutral-300">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent py-2.5 pl-9 pr-10 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full btn-primary py-3 px-4 text-xs font-bold rounded-xl shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying credentials…</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Unlock Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Back Button */}
          <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Directory</span>
            </button>
          </div>
        </div>

        {/* Security badge note */}
        <p className="mt-4 text-center text-[11px] text-neutral-400">
          Encrypted with SHA-256 zero-exposure authorization
        </p>
      </div>
    </div>
  );
};

