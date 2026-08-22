import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { Header } from './Header';
import { RichFooter } from './RichFooter';
import { playSound } from '../utils/sound';
import { User } from '@supabase/supabase-js';
import { Category } from '../types';

export type LegalDocType = 'privacy' | 'terms';

interface LegalPageProps {
  initialDoc?: LegalDocType;
  onBack: () => void;
  onOpenSubmit: () => void;
  onSignIn: () => void;
  onGoToProfile: () => void;
  user: User | null;
  totalProducts: number;
  totalScore: number;
  soundEnabled: boolean;
  onSelectCategory: (cat: Category) => void;
  onOpenHowItWorks: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  initialDoc = 'privacy',
  onBack,
  onOpenSubmit,
  onSignIn,
  onGoToProfile,
  user,
  totalProducts,
  totalScore,
  soundEnabled,
  onSelectCategory,
  onOpenHowItWorks,
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  useEffect(() => {
    setActiveDoc(initialDoc);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialDoc]);

  const handleDocSwitch = (doc: LegalDocType) => {
    playSound('click', soundEnabled);
    setActiveDoc(doc);
    try {
      window.history.pushState('', document.title, `/${doc}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-black flex flex-col justify-between selection:bg-black selection:text-white font-sans">
      <Header
        onGoHome={onBack}
        onOpenSubmit={onOpenSubmit}
        onSignIn={onSignIn}
        onGoToProfile={onGoToProfile}
        user={user}
      />

      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        {/* Breadcrumb / Back Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onBack();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-black hover:text-black transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Directory</span>
          </button>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
            <span>Legal</span>
            <ChevronRight className="h-3 w-3 text-neutral-300" />
            <span className="text-black font-bold">
              {activeDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </span>
          </div>
        </div>

        {/* Page Hero & Tab Switcher */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white shadow-xs">
                {activeDoc === 'privacy' ? <Lock className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
                  {activeDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                </h1>
                <p className="text-xs text-neutral-500 font-medium">
                  Official Terms & Policies • Effective August 2026
                </p>
              </div>
            </div>

            {/* Switcher Buttons */}
            <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleDocSwitch('privacy')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeDoc === 'privacy'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Privacy Policy</span>
              </button>
              <button
                type="button"
                onClick={() => handleDocSwitch('terms')}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeDoc === 'terms'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Terms of Service</span>
              </button>
            </div>
          </div>
        </div>

        {/* Document Content Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-xs space-y-8 text-neutral-700 text-sm leading-relaxed">
          {activeDoc === 'privacy' ? (
            /* ════════════════ PRIVACY POLICY ════════════════ */
            <>
              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">1. Overview & Scope</h2>
                <p>
                  TopSAAS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the TopSAAS directory and the TopSAAS Runner platform. We believe in open, fair, and transparent discovery for software creators. This Privacy Policy describes how we handle information collected when you access our platform, sign in, submit websites, or play the TopSAAS Runner.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">2. Information We Collect</h2>
                <div className="space-y-2 pl-1">
                  <div>
                    <strong className="text-black font-bold">A. User Account Data:</strong> When you sign in with Google OAuth, we receive your basic public profile information (name, email address, and avatar) provided by Google. This data is solely used to authenticate your session and link products you create.
                  </div>
                  <div>
                    <strong className="text-black font-bold">B. Website Submissions:</strong> Information you submit publicly to the directory, including website URLs, tool names, descriptions, categories, favicons, and social handles.
                  </div>
                  <div>
                    <strong className="text-black font-bold">C. Gameplay & Score Verification Data:</strong> When playing the TopSAAS Runner, session duration and score velocity are transmitted to our Supabase database to verify fair play and prevent automated scripts.
                  </div>
                  <div>
                    <strong className="text-black font-bold">D. Payment Processing:</strong> When purchasing a Featured Spot sponsorship, transactions are securely processed by third-party payment providers (Dodo Payments / Stripe). TopSAAS does not process or store raw payment card data.
                  </div>
                  <div>
                    <strong className="text-black font-bold">E. Local Storage:</strong> We use your browser&apos;s local storage to remember your UI preferences, such as sound FX settings, theme toggles, and view layout (grid vs. table).
                  </div>
                </div>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">3. How We Use Your Data</h2>
                <p>We utilize the collected information strictly for legitimate operational purposes:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                  <li>Displaying, categorizing, and maintaining the public SaaS directory.</li>
                  <li>Attributing and ranking legitimate community scores earned in the runner.</li>
                  <li>Preventing bot attacks, duplicate submissions, and fraudulent leaderboard scripting.</li>
                  <li>Enabling creators to manage, edit, and delist their products.</li>
                </ul>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-semibold text-black text-xs">
                  🔒 We never sell, lease, or monetize your personal data to third-party data brokers or advertisers.
                </div>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">4. Data Security & Storage</h2>
                <p>
                  All data is secured using Supabase infrastructure with PostgreSQL Row Level Security (RLS) policies and HTTPS encrypted in-transit. Access to administrative management tools is strictly restricted to verified administrative users.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">5. Your Privacy Rights & Deletion</h2>
                <p>
                  You have the right to request the deletion of your account profile or the delisting of any submitted website at any time. Creators can manage or remove their tools directly from their profile page or contact our administration.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">6. Contact & Inquiries</h2>
                <p>
                  For any privacy inquiries, data deletion requests, or questions regarding this policy, please reach out to our team via Twitter/X or through our official community channels.
                </p>
              </section>
            </>
          ) : (
            /* ════════════════ TERMS OF SERVICE ════════════════ */
            <>
              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">1. Acceptance of Terms</h2>
                <p>
                  By visiting, browsing, submitting content, or utilizing services on TopSAAS (the &quot;Platform&quot;), you agree to comply with and be bound by these Terms of Service. If you do not agree with any portion of these terms, please discontinue use of the platform.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">2. Directory Submissions & Guidelines</h2>
                <p>By submitting a website or software product to TopSAAS:</p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                  <li>You confirm that you are the creator, owner, or authorized representative of the product.</li>
                  <li>Your submitted website must be live, functional, and comply with standard web safety practices.</li>
                  <li>Websites containing malicious software, phishing schemes, illegal content, or deceptive practices are strictly prohibited and will be permanently banned.</li>
                  <li>TopSAAS reserves the right to review, edit category tags, approve, reject, or delist submissions to ensure quality.</li>
                </ul>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">3. Fair Play & Anti-Cheat Policy</h2>
                <p>
                  The TopSAAS Runner is a community feature designed for authentic gameplay and organic product engagement:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-600">
                  <li>All scores submitted from game sessions are mathematically and velocity-verified by our anti-cheat engine.</li>
                  <li>Automated botting, script injection, memory manipulation, or fake browser headless farming is strictly prohibited.</li>
                  <li>Any product benefiting from fraudulent or scripted gameplay will have its scores reset or face permanent directory removal.</li>
                </ul>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">4. Featured Spots & Sponsorship Terms</h2>
                <p>
                  Featured Spot placements provide guaranteed prominent display at the top of the homepage and in the TopSAAS Runner header for 30 consecutive days. As digital exposure commences immediately upon payment activation, sponsorship fees are non-refundable.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">5. Trademarks & Intellectual Property</h2>
                <p>
                  All software names, logos, screenshots, and trade names displayed on TopSAAS remain the intellectual property of their respective creators. TopSAAS indexes and showcases these assets solely for discovery, directory aggregation, and fair-use reference.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">6. Limitation of Liability</h2>
                <p>
                  TopSAAS is provided &quot;as is&quot; without warranties of any kind. TopSAAS does not guarantee specific traffic volume, conversion rates, or uninterrupted server availability. Under no circumstances shall TopSAAS or its operators be liable for indirect, incidental, or consequential damages resulting from platform usage.
                </p>
              </section>

              <section className="space-y-2.5">
                <h2 className="text-base sm:text-lg font-black text-black tracking-tight">7. Modifications to Terms</h2>
                <p>
                  We reserve the right to modify these Terms of Service at any time. Revisions take effect immediately upon being posted on this page. Your continued use of the service constitutes agreement to updated terms.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Compliance Footer Note */}
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>TopSAAS Standards Compliant</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onBack();
            }}
            className="font-bold text-black hover:underline cursor-pointer"
          >
            ← Back to Directory
          </button>
        </div>
      </main>

      <RichFooter
        totalProducts={totalProducts}
        totalScore={totalScore}
        soundEnabled={soundEnabled}
        onOpenSubmit={onOpenSubmit}
        onOpenHowItWorks={onOpenHowItWorks}
        onSelectCategory={onSelectCategory}
        onOpenPrivacy={() => handleDocSwitch('privacy')}
        onOpenTerms={() => handleDocSwitch('terms')}
      />
    </div>
  );
};
