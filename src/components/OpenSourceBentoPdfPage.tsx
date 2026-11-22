import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
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
} from 'lucide-react';
import {
  BENTO_PDF_META,
  BENTO_PDF_ARCHITECTURE,
  BENTO_TOOLS,
  BENTO_FAQS,
  BENTO_BLUEPRINTS,
  BentoTool,
  BentoBlueprintIdea,
} from '../data/bentoPdfDeepDive';
import { applyPageSeo } from '../utils/pageSeo';
import { playSound } from '../utils/sound';
import { plainCopy } from '../utils/plainCopy';

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
          '@type': 'TechArticle',
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
            author: {
              '@type': 'Person',
              name: 'Alam Abdullah',
            },
          },
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
      <nav className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                onBack();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 hover:text-neutral-950 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to SaaS Ideas</span>
            </button>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-medium text-neutral-500">Open Source</span>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-semibold text-neutral-900">BentoPDF</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={BENTO_PDF_META.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">GitHub</span>
              <span className="font-mono text-[11px] font-bold text-neutral-900">{BENTO_PDF_META.stars}</span>
            </a>
            <a
              href={BENTO_PDF_META.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white shadow-2xs hover:bg-neutral-800 transition-colors"
            >
              <span>Live Instance</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 sm:pt-8 flex flex-col lg:flex-row items-start gap-8">
        {/* ── Sticky Left Sidebar ── */}
        <aside className="w-full lg:w-64 xl:w-72 shrink-0 lg:sticky lg:top-20 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-4">
            {/* Repo Identity Capsule */}
            <div className="pb-3 border-b border-neutral-100 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-950 font-mono">BentoPDF</span>
                <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  {BENTO_PDF_META.license}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Client-side WebAssembly PDF toolkit
              </p>
            </div>

            {/* Nav Group 1: Overview */}
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Codebase Overview
              </div>
              <button
                type="button"
                onClick={() => handleSelectView('overview')}
                className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                  activeView === 'overview'
                    ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Overview &amp; 51 Tools</span>
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    activeView === 'overview' ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200/80 text-neutral-600'
                  }`}
                >
                  51
                </span>
              </button>
            </div>

            {/* Nav Group 2: The Ideas */}
            <div className="space-y-1 pt-2 border-t border-neutral-100">
              <div className="px-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Curated SaaS Blueprints
              </div>

              {BENTO_BLUEPRINTS.map((idea) => {
                const isSelected = activeView === idea.id;
                return (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => handleSelectView(idea.id)}
                    className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-neutral-900 text-white shadow-2xs font-semibold'
                        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{idea.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
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

          {/* Quick Architecture Spec Box */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-100/60 p-4 space-y-2 text-xs">
            <div className="font-semibold text-neutral-900">Technical Highlights</div>
            <div className="space-y-1.5 text-neutral-600 text-[11px] leading-relaxed">
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>Zero Server Uploads (Client RAM)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>MuPDF &amp; Tesseract.js WASM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                <span>Docker: bentopdf-simple</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content Area ── */}
        <main className="flex-1 min-w-0 max-w-full">
          {/* VIEW 1: OVERVIEW & 51 TOOLS */}
          {activeView === 'overview' && (
            <div className="space-y-8">
              {/* Minimal Hero */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                    <Code2 className="h-3.5 w-3.5 text-neutral-600" />
                    alam00000/bentopdf
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 border border-neutral-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-neutral-600" />
                    100% Client-Side WASM
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                  BentoPDF: Codebase Architecture &amp; 51 Tools Reference
                </h1>

                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                  A comprehensive, technical breakdown of BentoPDF. Explore how all 51 tools execute
                  in browser memory via WebAssembly without sending documents to an external server.
                </p>

                {/* Key Facts Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Tool Count</div>
                    <div className="text-xl font-bold text-neutral-950 mt-0.5">51 Tools</div>
                    <div className="text-[10px] text-neutral-400">Across 5 categories</div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Server Compute</div>
                    <div className="text-xl font-bold text-neutral-950 mt-0.5">Zero Backend</div>
                    <div className="text-[10px] text-neutral-400">Client-side execution</div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Data Retention</div>
                    <div className="text-xl font-bold text-neutral-950 mt-0.5">0 Bytes Stored</div>
                    <div className="text-[10px] text-neutral-400">Automatic compliance</div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Core Engine</div>
                    <div className="text-xl font-bold text-neutral-950 mt-0.5 truncate">WebAssembly</div>
                    <div className="text-[10px] text-neutral-400">MuPDF &amp; Tesseract.js</div>
                  </div>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {BENTO_PDF_ARCHITECTURE.corePillars.map((pillar, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700">
                          {i + 1}
                        </span>
                        <h3 className="text-xs font-bold text-neutral-900">{pillar.title}</h3>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed pl-6">{pillar.description}</p>
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
                        <div className="border-t border-neutral-100 bg-neutral-50/30 p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                              <div className="text-[10px] font-semibold text-neutral-900 uppercase tracking-wider">
                                What It Does
                              </div>
                              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                                {tool.plainEnglish}
                              </p>
                            </div>

                            <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                              <div className="text-[10px] font-semibold text-neutral-900 uppercase tracking-wider">
                                Technical Architecture
                              </div>
                              <p className="text-xs text-neutral-600 leading-relaxed font-mono">
                                {tool.underTheHood}
                              </p>
                            </div>

                            <div className="rounded-lg border border-neutral-200 bg-white p-3 space-y-1">
                              <div className="text-[10px] font-semibold text-neutral-900 uppercase tracking-wider">
                                Practical Use Case
                              </div>
                              <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                                {tool.realWorldUse}
                              </p>
                            </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Target Pricing</div>
                    <div className="text-sm sm:text-base font-bold text-neutral-950 mt-0.5">{activeIdea.pricing}</div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Target MRR</div>
                    <div className="text-sm sm:text-base font-bold text-neutral-950 mt-0.5">{activeIdea.targetMrr}</div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Breakeven Volume</div>
                    <div className="text-sm sm:text-base font-bold text-neutral-950 mt-0.5">{activeIdea.customersNeeded}</div>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
                    <div className="text-[11px] font-medium text-neutral-500">Estimated MVP</div>
                    <div className="text-sm sm:text-base font-bold text-neutral-950 mt-0.5">{activeIdea.timeToMvp}</div>
                  </div>
                </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase">Decision Maker</div>
                    <div className="text-xs font-semibold text-neutral-900">{activeIdea.customer.title}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase">Budget Discretion</div>
                    <div className="text-xs font-normal text-neutral-700">{activeIdea.customer.budgetAuthority}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-1">
                    <div className="text-[10px] font-semibold text-neutral-500 uppercase">Purchase Trigger</div>
                    <div className="text-xs font-normal text-neutral-700">{activeIdea.customer.triggerMoment}</div>
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {activeIdea.product.keyFeatures.map((feat, i) => (
                    <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-1">
                      <div className="text-xs font-semibold text-neutral-900">{feat.title}</div>
                      <p className="text-xs text-neutral-600 leading-relaxed font-normal">{feat.description}</p>
                    </div>
                  ))}
                </div>
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

                <div className="space-y-3">
                  {activeIdea.trafficAcquisition.map((ch, i) => (
                    <div key={i} className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3.5 space-y-1">
                      <div className="text-xs font-semibold text-neutral-950">{ch.channel}</div>
                      <p className="text-xs text-neutral-600 leading-relaxed font-normal">{ch.strategy}</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-neutral-900">Modules to Keep from BentoPDF:</div>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-neutral-600">
                      {activeIdea.technicalDelta.modulesToKeep.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-neutral-900">Custom Layers to Build:</div>
                    <ul className="space-y-1 pl-4 list-disc text-xs text-neutral-600">
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
            </div>
          )}
        </main>
      </div>
    </article>
  );
};
