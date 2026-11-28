import React, { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck, FileText, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { playSound } from '../utils/sound';
import { Category } from '../types';
import { applyPageSeo } from '../utils/pageSeo';
import { privacySeo, termsSeo } from '../utils/coreSeo';
import { PRIVACY_SECTIONS, TERMS_SECTIONS } from '../data/legalContent';

export type LegalDocType = 'privacy' | 'terms';

interface LegalPageProps {
  initialDoc?: LegalDocType;
  onBack: () => void;
  onOpenSubmit: () => void;
  totalProducts: number;
  soundEnabled: boolean;
  onSelectCategory: (cat: Category) => void;
  onOpenHowItWorks: () => void;
  onOpenPricing?: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  initialDoc = 'privacy',
  onBack,
  onOpenSubmit,
  totalProducts,
  soundEnabled,
  onSelectCategory,
  onOpenHowItWorks,
  onOpenPricing,
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

  // Each legal document is a real, self-canonical page rather than a copy of
  // the homepage head.
  useEffect(() => {
    const seo = activeDoc === 'privacy' ? privacySeo() : termsSeo();
    return applyPageSeo({
      ...seo,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebPage',
            '@id': `${seo.canonical}#webpage`,
            url: seo.canonical,
            name: seo.title,
            description: seo.description,
            inLanguage: 'en',
            isPartOf: { '@type': 'WebSite', name: 'TopSAAS', url: 'https://www.topsaas.space/' },
          },
          {
            '@type': 'Organization',
            name: 'TopSAAS',
            url: 'https://www.topsaas.space/',
            logo: 'https://www.topsaas.space/logo/TopSAAS%20-%20blue.png',
          },
        ],
      },
      jsonLdId: activeDoc === 'privacy' ? 'privacy-jsonld' : 'terms-jsonld',
    });
  }, [activeDoc]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-mint-500 selection:text-white font-sans">
      <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        {/* Unified Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap">
          <a
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              playSound('click', soundEnabled);
              onBack();
            }}
            className="hover:text-neutral-950 transition-colors cursor-pointer"
          >
            Home
          </a>
          <span className="text-neutral-300 select-none">/</span>
          <span className="font-bold text-neutral-900">
            {activeDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </span>
        </nav>

        {/* Page Hero & Tab Switcher */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint-500 text-white shadow-xs">
                {activeDoc === 'privacy' ? <Lock className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
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
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-950'
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
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-950'
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
          {(activeDoc === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS).map((section) => (
            <section key={section.heading} className="space-y-2.5">
              <h2 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.definitions && (
                <div className="space-y-2 pl-1">
                  {section.definitions.map((definition) => (
                    <div key={definition.label}>
                      <strong className="text-neutral-950 font-bold">{definition.label}</strong> {definition.body}
                    </div>
                  ))}
                </div>
              )}
              {section.bullets && (
                <ul className="list-disc pl-5 space-y-1.5 text-neutral-400">
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {section.note && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 font-semibold text-neutral-700 text-xs">
                  {section.note}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Compliance Footer Note */}
        <div className="flex items-center justify-between px-2 pt-2 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="h-4 w-4 text-mint-600" />
            <span>TopSAAS Standards Compliant</span>
          </div>
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              onBack();
            }}
            className="font-bold text-neutral-950 hover:underline cursor-pointer"
          >
            ← Back to Home
          </button>
        </div>
      </main>
    </div>
  );
};
