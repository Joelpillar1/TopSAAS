import React from 'react';
import { X, ShieldCheck, FileText, Lock, Globe, CheckCircle2 } from 'lucide-react';
import { playSound } from '../utils/sound';

export type LegalTab = 'privacy' | 'terms';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
  soundEnabled: boolean;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy',
  soundEnabled,
}) => {
  const [activeTab, setActiveTab] = React.useState<LegalTab>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleTabChange = (tab: LegalTab) => {
    playSound('click', soundEnabled);
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-7 my-6 text-black animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            onClose();
          }}
          className="absolute right-3.5 top-3.5 sm:right-5 sm:top-5 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header & Tabs */}
        <div className="pr-8 pb-4 border-b border-neutral-200 shrink-0 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white shadow-2xs">
              {activeTab === 'privacy' ? <Lock className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-black tracking-tight">
                {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h2>
              <p className="text-[11px] sm:text-xs text-neutral-500 font-medium">
                Last updated: August 2026 • TopSAAS Directory & Platform
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 p-1">
            <button
              type="button"
              onClick={() => handleTabChange('privacy')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('terms')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white text-black shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Terms of Service</span>
            </button>
          </div>
        </div>

        {/* Scrollable Document Content */}
        <div className="overflow-y-auto py-4 space-y-6 text-xs text-neutral-700 leading-relaxed pr-1 scrollbar-thin">
          {activeTab === 'privacy' ? (
            /* ── Privacy Policy ── */
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">1. Overview & Commitment</h3>
                <p>
                  TopSAAS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the TopSAAS directory and TopSAAS Runner platform. We respect your privacy and are committed to protecting any information collected when you use our website, submit a SaaS product, play our runner game, or interact with our community.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">2. Information We Collect</h3>
                <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                  <li>
                    <strong className="text-black font-semibold">Account Information:</strong> When you sign in via Google OAuth, we receive your basic public profile (name, email address, and avatar image) to authenticate product ownership and creator profiles.
                  </li>
                  <li>
                    <strong className="text-black font-semibold">Product Submissions:</strong> Website URLs, product names, categories, descriptions, logos/favicons, and social handles that you publicly submit to our directory.
                  </li>
                  <li>
                    <strong className="text-black font-semibold">Game & Scoring Data:</strong> Game duration, velocity, and score progression earned in the TopSAAS Runner, verified via anti-cheat mechanics to prevent scripting.
                  </li>
                  <li>
                    <strong className="text-black font-semibold">Payment Details:</strong> When claiming a Featured Spot, payments are processed directly by our secure payment provider (Dodo Payments / Stripe). We never collect or store full credit card numbers on our servers.
                  </li>
                  <li>
                    <strong className="text-black font-semibold">Local Storage & Preferences:</strong> We store local interface preferences such as sound FX toggles, selected view layout (cards vs. table), and submission drafts.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">3. How We Use Your Information</h3>
                <p>We use collected data solely to:</p>
                <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                  <li>Display, index, and categorize SaaS products on our live leaderboard.</li>
                  <li>Verify and attribute legitimate game scores to your submitted product.</li>
                  <li>Prevent automated bot spam, fraud, and score manipulation.</li>
                  <li>Deliver sponsored featured placements and public directory analytics.</li>
                </ul>
                <p className="font-semibold text-black pt-1">
                  We will never sell, rent, or trade your personal information to third-party advertisers.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">4. Third-Party Services & Infrastructure</h3>
                <p>
                  Our services run on trusted industry-standard infrastructure including Supabase (PostgreSQL with Row Level Security), Google Cloud Authentication, and secure payment processors. These partners only process data as necessary to perform their respective technical services.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">5. Data Retention & Deletion Rights</h3>
                <p>
                  You have the right to request the delisting of your website, deletion of your profile, or a copy of your stored records at any time. You can delist products from your creator dashboard or by contacting our administration team.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">6. Updates to This Policy</h3>
                <p>
                  We may periodically revise this Privacy Policy to reflect platform updates or legal standards. Changes will be posted directly on this page with an updated revision date.
                </p>
              </section>
            </>
          ) : (
            /* ── Terms of Service ── */
            <>
              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">1. Acceptance of Terms</h3>
                <p>
                  By accessing or using TopSAAS (the &quot;Platform&quot;), including exploring directory listings, submitting a SaaS product, playing the TopSAAS Runner, or purchasing a Featured Spot, you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">2. Directory Submissions & Content Guidelines</h3>
                <p>When submitting a website to TopSAAS:</p>
                <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                  <li>You warrant that you are the creator, authorized representative, or legitimate backer of the product.</li>
                  <li>Your submitted website must be functional, safe, and free from malware, phishing, fraudulent claims, or hate speech.</li>
                  <li>TopSAAS reserves the right to review, edit tags/categories, approve, reject, or delist any submission at our sole discretion.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">3. Fair Play & Anti-Cheat Policy</h3>
                <p>
                  The TopSAAS Runner is a community feature designed for authentic engagement. Game scores directly impact product rankings.
                </p>
                <ul className="list-disc pl-4 space-y-1 text-neutral-600">
                  <li>All game sessions are verified in real time for physical movement velocity and duration.</li>
                  <li>The use of automated bots, memory injectors, scripts, or macro tools to artificially manipulate scores is strictly prohibited.</li>
                  <li>Any product found engaging in scripted score abuse is subject to instant score resets or permanent removal from the directory.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">4. Featured Spots & Commercial Placements</h3>
                <p>
                  Featured Spots grant guaranteed top placement on the homepage and in-game sponsor badge for a designated 30-day term. Once activated, sponsorship fees are non-refundable as digital exposure begins immediately. Featured tools must comply with our standard safety and quality guidelines.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">5. Intellectual Property</h3>
                <p>
                  Product names, logos, screenshots, and trademarks showcased on TopSAAS belong to their respective copyright holders. TopSAAS indexes and displays these assets for directory discovery, curation, and fair-use reference.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">6. Disclaimer of Warranties & Limitation of Liability</h3>
                <p>
                  TopSAAS is provided &quot;as is&quot; without warranty of any kind. We do not guarantee continuous uptime or specific conversion metrics for listed or featured websites. In no event shall TopSAAS be liable for any indirect, incidental, or consequential damages arising from platform usage.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-black text-black">7. Modifications to Service</h3>
                <p>
                  We reserve the right to modify or discontinue any part of the service with or without notice. Continued use of the service constitutes acceptance of any updated terms.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer Close Action */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>TopSAAS Standards Compliant</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onClose();
            }}
            className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-neutral-800 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
