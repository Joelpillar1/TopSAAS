import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Github,
  Search,
  Filter,
  ShieldCheck,
  Cpu,
  Lock,
  Terminal,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Code2,
  Briefcase,
  Target,
  DollarSign,
  TrendingUp,
  Sparkles,
  Layers,
  Wrench,
  AlertTriangle,
  Send,
  Boxes,
  Globe,
  BookOpen,
  Calculator,
  Compass,
  Rocket,
  Package,
} from 'lucide-react';
import {
  BENTO_PDF_META,
  BENTO_PDF_ARCHITECTURE,
  BENTO_TOOLS,
  BENTO_FAQS,
  BENTO_BLUEPRINTS,
  BENTO_INTERNAL_LINKS,
  BENTO_EXTERNAL_RESOURCES,
  BentoTool,
  BentoBlueprintIdea,
} from '../data/bentoPdfDeepDive';
import { applyPageSeo } from '../utils/pageSeo';
import { playSound } from '../utils/sound';
import { plainCopy } from '../utils/plainCopy';
import { navigateTo } from '../utils/nav';

interface OpenSourceBentoPdfPageProps {
  soundEnabled: boolean;
  onBack: () => void;
  onSelectProduct?: (productId: string) => void;
}

const CATEGORIES = [
  'All',
  'Organize & Manage',
  'Edit & Annotate',
  'Convert to PDF',
  'Convert from PDF',
  'Security & Compliance',
] as const;

type CategoryFilter = (typeof CATEGORIES)[number];
type PageView = 'overview' | 'claimpack' | 'bentobid' | 'difflegal' | 'untrusted-pdf';

export const OpenSourceBentoPdfPage: React.FC<OpenSourceBentoPdfPageProps> = ({
  soundEnabled,
  onBack,
}) => {
  const [activeView, setActiveView] = useState<PageView>('overview');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedToolId, setExpandedToolId] = useState<number | null>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedDocker, setCopiedDocker] = useState(false);

  // SEO & AEO / GEO Optimization with Schema.org JSON-LD
  useEffect(() => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': ['Article', 'TechArticle'],
          '@id': 'https://www.topsaas.space/opensource/bentopdf#article',
          headline: 'BentoPDF Technical Reference & Micro-SaaS Blueprint Suite',
          description:
            'A structured technical teardown of BentoPDF (alam00000/bentopdf). In-depth architectural analysis of all 51 client-side WebAssembly tools, security mechanisms, and 4 high-ticket SaaS ideas (ClaimPack, BentoBid, DiffLegal, Untrusted PDF).',
          author: {
            '@type': 'Organization',
            name: 'TopSAAS Technical Research',
            url: 'https://www.topsaas.space',
          },
          publisher: {
            '@type': 'Organization',
            name: 'TopSAAS',
            url: 'https://www.topsaas.space',
            logo: {
              '@type': 'ImageObject',
              url: 'https://www.topsaas.space/favicon.ico',
            },
          },
          about: {
            '@type': 'SoftwareApplication',
            name: 'BentoPDF',
            operatingSystem: 'Cross-platform, Web Browser, Docker',
            applicationCategory: 'UtilityApplication',
            codeRepository: 'https://github.com/alam00000/bentopdf',
            url: 'https://www.bentopdf.com/',
            author: {
              '@type': 'Person',
              name: 'Alam Abdullah',
            },
          },
          significantLink: [
            ...BENTO_INTERNAL_LINKS.map((l) => `https://www.topsaas.space${l.url}`),
            ...BENTO_EXTERNAL_RESOURCES.map((l) => l.url),
          ],
        },
        {
          '@type': 'ItemList',
          name: 'BentoPDF 51 Tools Roster',
          itemListElement: BENTO_TOOLS.map((t, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: t.name,
            description: t.plainEnglish,
          })),
        },
        {
          '@type': 'FAQPage',
          mainEntity: BENTO_FAQS.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      ],
    };

    return applyPageSeo({
      title: 'BentoPDF Technical Reference & SaaS Ideas: 51 Tools & 4 Blueprints | TopSAAS',
      description:
        'Technical architectural reference for BentoPDF (alam00000/bentopdf). Explore how each of the 51 WebAssembly tools works under the hood, plus deep-dive blueprints for ClaimPack, BentoBid, DiffLegal, and Untrusted PDF.',
      canonical: 'https://www.topsaas.space/opensource/bentopdf',
      jsonLd,
      jsonLdId: 'bentopdf-reference-jsonld',
    });
  }, []);

  // Filtered tools based on search and category
  const filteredTools = useMemo(() => {
    return BENTO_TOOLS.filter((tool) => {
      const matchesCategory =
        selectedCategory === 'All' || tool.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.tagline.toLowerCase().includes(query) ||
        tool.plainEnglish.toLowerCase().includes(query) ||
        tool.underTheHood.toLowerCase().includes(query) ||
        tool.realWorldUse.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeIdea: BentoBlueprintIdea | undefined = useMemo(() => {
    if (activeView === 'overview') return undefined;
    return BENTO_BLUEPRINTS.find((idea) => idea.id === activeView);
  }, [activeView]);

  const handleCopyDocker = () => {
    playSound('click', soundEnabled);
    plainCopy('docker run -d -p 8080:8080 --restart unless-stopped ghcr.io/alam00000/bentopdf-simple:latest');
    setCopiedDocker(true);
    setTimeout(() => setCopiedDocker(false), 2000);
  };

  const handleSelectView = (view: PageView) => {
    playSound('click', soundEnabled);
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleToolExpand = (id: number) => {
    playSound('click', soundEnabled);
    setExpandedToolId((prev) => (prev === id ? null : id));
  };

  const toggleFaq = (index: number) => {
    playSound('click', soundEnabled);
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <article className="min-h-screen bg-neutral-50/50 text-neutral-900 font-sans pb-24 selection:bg-neutral-200 selection:text-neutral-900">
      {/* ── Sub-Nav / Breadcrumb Header ── */}
      <nav className="relative z-10 border-b border-neutral-200/80 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6 gap-2">
          {/* Left: Back button & Breadcrumb */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onBack();
              }}
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:text-neutral-950 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Back to SaaS Ideas</span>
              <span className="sm:hidden">Back</span>
            </button>
            <span className="text-neutral-300 shrink-0 hidden sm:inline">/</span>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                playSound('click', soundEnabled);
                navigateTo('/');
              }}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:inline shrink-0"
            >
              Directory
            </a>
            <span className="text-neutral-300 shrink-0 hidden md:inline">/</span>
            <a
              href="/ideas"
              onClick={(e) => {
                e.preventDefault();
                playSound('click', soundEnabled);
                navigateTo('/ideas');
              }}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors hidden md:inline shrink-0"
            >
              SaaS Ideas
            </a>
            <span className="text-neutral-300 shrink-0 hidden md:inline">/</span>
            <span className="text-xs font-semibold text-neutral-900 truncate">BentoPDF</span>
          </div>

          {/* Right: GitHub, Docker & Live Instance */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href={BENTO_PDF_META.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-200 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shrink-0 whitespace-nowrap shadow-2xs"
              title="View BentoPDF source on GitHub"
            >
              <Github className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono text-[11px] font-bold text-neutral-900">{BENTO_PDF_META.stars}</span>
            </a>
            <a
              href={BENTO_PDF_META.dockerPackageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shrink-0 whitespace-nowrap shadow-2xs"
              title="Inspect Docker container on GitHub Container Registry"
            >
              <Package className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span>GHCR Docker</span>
              <ExternalLink className="h-3 w-3 text-neutral-400 shrink-0" />
            </a>
            <a
              href={BENTO_PDF_META.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg bg-neutral-900 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-neutral-800 transition-colors shrink-0 whitespace-nowrap"
              title="Open Official BentoPDF Live Application"
            >
              <Globe className="h-3.5 w-3.5 text-neutral-300 shrink-0" />
              <span className="hidden sm:inline">Live Instance</span>
              <span className="sm:hidden">Live</span>
              <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Main Content Container (no inner sidebar; outer sponsor rails sit outside) ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* ── View Switcher Bar (Overview + 4 SaaS Blueprints) ── */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectView('overview')}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'overview'
                  ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                  : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
              }`}
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              <span>Overview &amp; 51 Tools</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono leading-none ${
                  activeView === 'overview' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                51
              </span>
            </button>

            {BENTO_BLUEPRINTS.map((idea) => {
              const isSelected = activeView === idea.id;
              return (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => handleSelectView(idea.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                  }`}
                >
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span>{idea.name}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono leading-none ${
                      isSelected ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {idea.pricing.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <main className="w-full min-w-0">
          {/* VIEW 1: OVERVIEW & 51 TOOLS */}
          {activeView === 'overview' && (
            <div className="space-y-8">
              {/* Minimal Hero */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={BENTO_PDF_META.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200 transition-colors"
                  >
                    <Code2 className="h-3.5 w-3.5 text-neutral-600" />
                    <span>alam00000/bentopdf</span>
                    <ExternalLink className="h-3 w-3 text-neutral-400" />
                  </a>
                  <a
                    href={BENTO_PDF_META.wasmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-neutral-100 hover:bg-neutral-200/80 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200 transition-colors"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-neutral-600" />
                    <span>100% Client-Side WASM</span>
                    <ExternalLink className="h-3 w-3 text-neutral-400" />
                  </a>
                  <a
                    href={BENTO_PDF_META.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-xs font-medium transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5 text-emerald-600" />
                    <span>bentopdf.com Live</span>
                    <ExternalLink className="h-3 w-3 text-emerald-600" />
                  </a>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                  BentoPDF: Codebase Architecture &amp; 51 Tools Reference
                </h1>

                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                  A comprehensive, technical breakdown of BentoPDF. Explore how all 51 tools execute
                  in browser memory via WebAssembly without sending documents to an external server.
                </p>

                {/* Key Facts Strip */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-3 border-t border-neutral-100 text-xs">
                  <div><span className="text-neutral-500">Tools: </span><span className="font-bold text-neutral-950">51</span><span className="text-neutral-400"> across 5 categories</span></div>
                  <div><span className="text-neutral-500">Backend: </span><span className="font-bold text-neutral-950">Zero</span><span className="text-neutral-400"> — client-side only</span></div>
                  <div><span className="text-neutral-500">Data stored: </span><span className="font-bold text-neutral-950">0 bytes</span><span className="text-neutral-400"> — automatic compliance</span></div>
                  <div><span className="text-neutral-500">Engine: </span><a href={BENTO_PDF_META.wasmUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-neutral-950 hover:underline">WebAssembly</a><span className="text-neutral-400"> · <a href={BENTO_PDF_META.mupdfUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">MuPDF</a> &amp; <a href={BENTO_PDF_META.tesseractUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">Tesseract.js</a></span></div>
                </div>
              </div>

              {/* Architecture Core Pillars */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                      Local WebAssembly Execution Model
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      How client-side sandboxing functions compared to traditional cloud document servers.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyDocker}
                      className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-900 px-3 py-1.5 text-xs font-mono font-medium text-neutral-200 hover:bg-neutral-800 transition-all cursor-pointer shrink-0"
                      title="Copy Docker Run command"
                    >
                      <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                      <span>docker run bentopdf-simple</span>
                      {copiedDocker ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-neutral-400" />}
                    </button>
                    <a
                      href={BENTO_PDF_META.dockerPackageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors shadow-2xs"
                      title="Inspect Docker container package on GHCR"
                    >
                      <Package className="h-3.5 w-3.5 text-neutral-500" />
                      <span>GHCR Package</span>
                      <ExternalLink className="h-3 w-3 text-neutral-400" />
                    </a>
                  </div>
                </div>

                <div className="space-y-3">
                  {BENTO_PDF_ARCHITECTURE.corePillars.map((pillar, i) => (
                    <div key={i} className="flex gap-3 text-xs text-neutral-600 leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-700 mt-0.5">{i + 1}</span>
                      <div>
                        <span className="font-semibold text-neutral-900">{pillar.title}: </span>
                        {pillar.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tools Filter Bar */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-neutral-700" />
                      <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                        Tools Reference Directory
                      </h2>
                      <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-mono font-semibold text-neutral-600">
                        {filteredTools.length} tools
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Select a tool below to view its plain English explanation, technical mechanics, and practical use cases.
                    </p>
                  </div>

                  <div className="relative w-full md:w-64 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search 51 tools..."
                      className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 py-1.5 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-neutral-100">
                  <Filter className="h-3.5 w-3.5 text-neutral-400 shrink-0 mr-1" />
                  {CATEGORIES.map((cat) => {
                    const count =
                      cat === 'All'
                        ? BENTO_TOOLS.length
                        : BENTO_TOOLS.filter((t) => t.category === cat).length;
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setSelectedCategory(cat);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-neutral-900 text-white shadow-2xs'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900'
                        }`}
                      >
                        <span>{cat}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                            isSelected ? 'bg-neutral-800 text-white' : 'bg-neutral-200/80 text-neutral-600'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 51 Tools Roster */}
              <div className="space-y-2.5">
                {filteredTools.map((tool) => {
                  const isExpanded = expandedToolId === tool.id;
                  return (
                    <div
                      key={tool.id}
                      id={`tool-${tool.slug}`}
                      className={`rounded-xl border transition-all duration-150 overflow-hidden bg-white ${
                        isExpanded
                          ? 'border-neutral-400 shadow-2xs'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleToolExpand(tool.id)}
                        className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer transition-colors hover:bg-neutral-50/70 focus:outline-none"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 border border-neutral-200/80 text-[11px] font-mono font-bold text-neutral-600">
                            {tool.id}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-xs sm:text-sm font-semibold text-neutral-950 truncate">
                                {tool.name}
                              </h3>
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 border border-neutral-200/60">
                                {tool.category}
                              </span>
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-700">
                                {tool.badge}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1 font-normal">
                              {tool.tagline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="hidden sm:inline-block text-[11px] font-medium text-neutral-400">
                            {isExpanded ? 'Hide' : 'Details'}
                          </span>
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-neutral-500">
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-neutral-100 px-4 pb-4 pt-3 space-y-3">
                          <div className="space-y-1">
                            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">What It Does</div>
                            <p className="text-xs text-neutral-700 leading-relaxed">{tool.plainEnglish}</p>
                          </div>
                          <div className="border-t border-neutral-100 pt-3 space-y-1">
                            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Technical Architecture</div>
                            <p className="text-xs text-neutral-600 leading-relaxed font-mono">{tool.underTheHood}</p>
                          </div>
                          <div className="border-t border-neutral-100 pt-3 space-y-1">
                            <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Practical Use Case</div>
                            <p className="text-xs text-neutral-600 leading-relaxed">{tool.realWorldUse}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Architectural FAQs */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-neutral-700" />
                    <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                      Architectural &amp; Technical FAQs
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Direct technical facts on client-side memory safety, OCR execution, and container deployments.
                  </p>
                </div>

                <div className="space-y-2">
                  {BENTO_FAQS.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className="rounded-xl border border-neutral-200 bg-neutral-50/40 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleFaq(index)}
                          className="w-full flex items-center justify-between p-3.5 text-left font-medium text-xs sm:text-sm text-neutral-900 hover:bg-neutral-100/50 transition-colors cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          <span className="ml-3 shrink-0 text-neutral-400">
                            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="p-3.5 pt-1 border-t border-neutral-100 text-xs text-neutral-600 leading-relaxed font-normal bg-white">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Internal & External Resources Ecosystem ── */}
              <div className="space-y-4 pt-2">
                <div className="border-b border-neutral-200 pb-2">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                    Related Ecosystem &amp; Authoritative References
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Navigate related TopSAAS directories, economic calculators, and official open-source specifications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* TopSAAS Platform Hubs (Internal Links) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                      <Compass className="h-3.5 w-3.5 text-neutral-600" />
                      <h3 className="text-xs font-bold text-neutral-950">TopSAAS Platform Hubs</h3>
                      <span className="ml-auto text-[10px] font-mono text-neutral-400">Internal</span>
                    </div>
                    {BENTO_INTERNAL_LINKS.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        onClick={(e) => {
                          e.preventDefault();
                          playSound('click', soundEnabled);
                          navigateTo(link.url);
                        }}
                        className="group flex items-start justify-between gap-3 py-2 border-b border-neutral-100 last:border-0 hover:text-blue-600 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">{link.title}</div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{link.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0 mt-0.5">{link.badge} →</span>
                      </a>
                    ))}
                  </div>

                  {/* Authoritative Technical References (External Links) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                      <ExternalLink className="h-3.5 w-3.5 text-neutral-600" />
                      <h3 className="text-xs font-bold text-neutral-950">Authoritative References</h3>
                      <span className="ml-auto text-[10px] font-mono text-neutral-400">External</span>
                    </div>
                    {BENTO_EXTERNAL_RESOURCES.map((link) => (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start justify-between gap-3 py-2 border-b border-neutral-100 last:border-0"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                            {link.title}
                            <ExternalLink className="h-2.5 w-2.5 text-neutral-400 group-hover:text-blue-600 shrink-0" />
                          </div>
                          <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">{link.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 shrink-0 mt-0.5">{link.badge}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: THE CURATED SAAS IDEAS (ClaimPack, BentoBid, DiffLegal, Untrusted PDF) */}
          {activeIdea && (
            <div className="space-y-6">
              {/* Idea Header */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700 border border-neutral-200">
                    {activeIdea.badge}
                  </span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-600">
                    {activeIdea.niche}
                  </span>
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-950">
                    {activeIdea.name}
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-600 mt-1 font-normal">
                    {activeIdea.tagline}
                  </p>
                </div>

                {/* Key Metrics Bar */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-neutral-100 text-xs">
                  <div><span className="text-neutral-500">Pricing: </span><span className="font-bold text-neutral-950">{activeIdea.pricing}</span></div>
                  <div><span className="text-neutral-500">Target MRR: </span><span className="font-bold text-neutral-950">{activeIdea.targetMrr}</span></div>
                  <div><span className="text-neutral-500">Breakeven: </span><span className="font-bold text-neutral-950">{activeIdea.customersNeeded}</span></div>
                  <div><span className="text-neutral-500">Est. MVP: </span><span className="font-bold text-neutral-950">{activeIdea.timeToMvp}</span></div>
                </div>

                {/* Internal Link to MRR Calculator */}
                <a
                  href="/mrr-calculator"
                  onClick={(e) => {
                    e.preventDefault();
                    playSound('click', soundEnabled);
                    navigateTo('/mrr-calculator');
                  }}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 p-3 text-xs text-neutral-700 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-neutral-500 group-hover:text-neutral-900" />
                    <span>Model financial unit economics, pricing sensitivity, and breakeven volume in the <strong>TopSAAS MRR Calculator</strong>.</span>
                  </div>
                  <span className="font-semibold text-neutral-900 shrink-0 inline-flex items-center gap-1">
                    Calculate MRR <ArrowUpRight className="h-3 w-3" />
                  </span>
                </a>
              </div>

              {/* 1. Market & Customer ICP */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Target className="h-4 w-4 text-neutral-700" />
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    1. The Market &amp; Target Customer (ICP)
                  </h2>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-neutral-700 leading-relaxed">
                  <div>
                    <span className="font-semibold text-neutral-950">Target Buyer: </span>
                    {activeIdea.market.target}
                  </div>
                  <p className="text-neutral-600 font-normal">{activeIdea.market.description}</p>
                  <p className="text-neutral-500 text-xs font-normal border-l-2 border-neutral-200 pl-3">
                    {activeIdea.market.sizeAndSpend}
                  </p>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1.5 pt-2 text-xs">
                  <div><span className="text-[10px] font-semibold text-neutral-500 uppercase">Decision Maker: </span><span className="font-semibold text-neutral-900">{activeIdea.customer.title}</span></div>
                  <div><span className="text-[10px] font-semibold text-neutral-500 uppercase">Budget: </span><span className="text-neutral-700">{activeIdea.customer.budgetAuthority}</span></div>
                  <div><span className="text-[10px] font-semibold text-neutral-500 uppercase">Trigger: </span><span className="text-neutral-700">{activeIdea.customer.triggerMoment}</span></div>
                </div>
              </div>

              {/* 2. The Problem & Incumbent Flaws */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <AlertTriangle className="h-4 w-4 text-neutral-700" />
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    2. The Burning Problem &amp; Why Existing Solutions Fail
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-medium">
                  {activeIdea.problem.corePain}
                </p>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-neutral-900">Incumbent Software Flaws:</div>
                  <ul className="space-y-1.5 pl-4 list-disc text-xs text-neutral-600">
                    {activeIdea.problem.incumbentFlaws.map((flaw, i) => (
                      <li key={i}>{flaw}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-xs text-neutral-600">
                  <span className="font-semibold text-neutral-900">Cost of Inaction: </span>
                  {activeIdea.problem.riskOfDoingNothing}
                </div>
              </div>

              {/* 3. The Product Solution */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Boxes className="h-4 w-4 text-neutral-700" />
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    3. The Product Solution ({activeIdea.product.name})
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                  {activeIdea.product.summary}
                </p>

                <ol className="space-y-2 pt-2">
                  {activeIdea.product.keyFeatures.map((feat, i) => (
                    <li key={i} className="flex gap-3 text-xs text-neutral-600 leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-700 mt-0.5">{i + 1}</span>
                      <div><span className="font-semibold text-neutral-900">{feat.title}: </span>{feat.description}</div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 4. Search Analytics & Market Demand */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <TrendingUp className="h-4 w-4 text-neutral-700" />
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    4. Search Analytics &amp; Keyword Demand
                  </h2>
                </div>

                <p className="text-xs text-neutral-500">
                  {activeIdea.searchDemand.totalSearches}
                </p>

                <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Keyword Query</th>
                        <th className="py-2.5 px-3">Monthly Searches</th>
                        <th className="py-2.5 px-3">Avg. CPC</th>
                        <th className="py-2.5 px-3">Difficulty (KD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-600">
                      {activeIdea.searchDemand.keywords.map((kw, i) => (
                        <tr key={i} className="hover:bg-neutral-50/60">
                          <td className="py-2.5 px-3 font-mono font-medium text-neutral-900">{kw.query}</td>
                          <td className="py-2.5 px-3 font-mono">{kw.volume} / mo</td>
                          <td className="py-2.5 px-3 font-mono">{kw.cpc}</td>
                          <td className="py-2.5 px-3 font-mono">{kw.kd} / 100</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Zero-Ad-Spend Customer Acquisition */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Send className="h-4 w-4 text-neutral-700" />
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    5. Traffic &amp; Zero-Ad-Spend Distribution
                  </h2>
                </div>

                <div className="space-y-3 pt-1">
                  {activeIdea.trafficAcquisition.map((ch, i) => (
                    <div key={i} className="flex gap-3 text-xs text-neutral-600 leading-relaxed border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-bold text-neutral-700 mt-0.5">{i + 1}</span>
                      <div><span className="font-semibold text-neutral-900">{ch.channel}: </span>{ch.strategy}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Technical Delta on BentoPDF */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Wrench className="h-4 w-4 text-neutral-700" />
                  <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                    6. Technical Delta on Top of BentoPDF
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 mb-2">Modules to Keep from BentoPDF:</div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-neutral-600">
                      {activeIdea.technicalDelta.modulesToKeep.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 mb-2">Custom Layers to Build:</div>
                    <ul className="space-y-1.5 pl-4 list-disc text-xs text-neutral-600">
                      {activeIdea.technicalDelta.whatToBuild.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 bg-neutral-900 p-3.5 text-xs text-neutral-300 font-mono">
                  <span className="text-neutral-400">// Architecture Note: </span>
                  {activeIdea.technicalDelta.architectureNote}
                </div>
              </div>

              {/* Cross-Link & Next Steps */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-neutral-950">Next Steps &amp; Ecosystem Resources</h3>
                    <p className="text-[11px] text-neutral-500">Ready to build or explore more SaaS opportunities?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectView('overview')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-800 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to 51 Tools Roster</span>
                  </button>
                </div>

                <div className="space-y-1 pt-1">
                  {[
                    { href: '/ideas', label: 'More SaaS Ideas', desc: 'Browse 50+ curated open-source monetization angles.', internal: true },
                    { href: '/mrr-calculator', label: 'MRR Calculator', desc: 'Simulate revenue tiers and break-even customer volume.', internal: true },
                    { href: '/guides', label: 'Build Guides', desc: 'Production playbooks on launching and acquiring users.', internal: true },
                    { href: '/submit', label: 'Submit Your SaaS', desc: 'Get verified listing and dofollow SEO backlink.', internal: true },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => { e.preventDefault(); playSound('click', soundEnabled); navigateTo(item.href); }}
                      className="group flex items-start justify-between gap-3 py-2.5 border-b border-neutral-100 last:border-0 hover:text-neutral-950 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">{item.label}</div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5 group-hover:text-blue-600 transition-colors" />
                    </a>
                  ))}
                </div>

                <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
                  <span className="text-[11px]">External references:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={BENTO_PDF_META.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950 font-medium hover:underline text-[11px]"
                    >
                      <Github className="h-3 w-3" />
                      <span>alam00000/bentopdf GitHub</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <span className="text-neutral-300">•</span>
                    <a
                      href={BENTO_PDF_META.officialWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950 font-medium hover:underline text-[11px]"
                    >
                      <Globe className="h-3 w-3" />
                      <span>bentopdf.com Live App</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <span className="text-neutral-300">•</span>
                    <a
                      href={BENTO_PDF_META.dockerPackageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-neutral-700 hover:text-neutral-950 font-medium hover:underline text-[11px]"
                    >
                      <Package className="h-3 w-3" />
                      <span>bentopdf-simple GHCR</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </article>
  );
};
