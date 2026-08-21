import React from 'react';
import { Product } from '../types';
import { 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  CheckCircle2, 
  Crown, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Globe, 
  ChevronRight,
  MessageSquareQuote,
  Target,
  ThumbsUp
} from 'lucide-react';
import { playSound } from '../utils/sound';

interface ProductPageProps {
  product: Product;
  topProduct: Product;
  allProducts: Product[];
  soundEnabled: boolean;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onShare: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onUpvote?: (product: Product) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  allProducts,
  soundEnabled,
  onBack,
  onSelectProduct,
  onShare,
  onTrackClick,
  onUpvote,
}) => {
  const isRankOne = product.rank === 1;

  // Filter related products (same category or neighboring ranks)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || Math.abs(p.rank - product.rank) <= 2))
    .slice(0, 3);

  // Top 5 websites sorted by rank for bottom sticky carousel
  const topFiveWebsites = allProducts.slice(0, 5);

  return (
    <div className="min-h-screen bg-neutral-50 text-black flex flex-col font-sans pb-28 sm:pb-28">
      {/* Top sticky navigation breadcrumb bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onBack();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 sm:py-1.5 text-xs font-bold text-black shadow-2xs hover:bg-neutral-100 hover:border-black active:scale-95 transition-all cursor-pointer shrink-0 min-h-[38px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </button>

            {/* Breadcrumb path */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 font-medium truncate">
              <span className="cursor-pointer hover:text-black" onClick={onBack}>Directory</span>
              <span>/</span>
              <span className="text-neutral-600">{product.category}</span>
              <span>/</span>
              <span className="text-black font-bold truncate max-w-[160px]">{product.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onShare(product);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-neutral-700 hover:text-black hover:border-black shadow-2xs active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px]"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-1.5">Share</span>
            </button>

            {onUpvote && (
              <button
                onClick={() => {
                  playSound('click', soundEnabled);
                  onUpvote(product);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 sm:py-1.5 text-xs font-bold text-black shadow-2xs hover:border-black hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer min-h-[38px]"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
                <span>Upvote ({product.upvotes ?? 0})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="mx-auto w-full max-w-5xl px-3.5 py-4 sm:px-6 sm:py-6 space-y-5 sm:space-y-6 flex-1">
        {/* Header Hero Section */}
        <div className="rounded-2xl border border-neutral-300 bg-white p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
            {/* Logo and titles */}
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-2xs flex items-center justify-center">
                {product.logoUrl ? (
                  <img
                    src={product.logoUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-xl sm:text-2xl font-black text-neutral-400">
                    {product.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                {/* Rank Badge on Logo */}
                <div className={`absolute bottom-0 right-0 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-tl-lg font-mono-num text-[10px] sm:text-[11px] font-black ${
                  isRankOne ? 'bg-black text-white' : 'bg-neutral-800 text-white'
                }`}>
                  #{product.rank}
                </div>
              </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xl sm:text-3xl font-black tracking-tight text-black truncate">
                    {product.name}
                  </h1>
                  {product.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-300 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-neutral-800">
                      <CheckCircle2 className="h-3 w-3 fill-black text-white" />
                      <span>Verified</span>
                    </span>
                  )}
                  <span className="rounded-full bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-neutral-600">
                    {product.category}
                  </span>
                </div>

                <p className="text-xs sm:text-base font-medium text-neutral-600 max-w-2xl leading-relaxed">
                  {product.tagline}
                </p>

                {/* External URL & Twitter */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 text-xs">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackClick(product.id, product.url)}
                    className="inline-flex items-center gap-1 font-bold text-black underline underline-offset-4 hover:text-neutral-600 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{product.url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {product.twitterHandle && (
                    <a
                      href={`https://twitter.com/${product.twitterHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-neutral-500 hover:text-black transition-colors"
                    >
                      <span>{product.twitterHandle}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onTrackClick(product.id, product.url);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-xs font-black text-white shadow-2xs hover:bg-neutral-800 active:scale-[0.98] transition-all cursor-pointer text-center min-h-[44px] sm:min-h-[38px]"
              >
                <span>Visit Official Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>

              {onUpvote && (
                <button
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onUpvote(product);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-3 sm:py-2.5 text-xs font-bold text-black shadow-2xs hover:bg-neutral-100 hover:border-black active:scale-[0.98] transition-all cursor-pointer min-h-[44px] sm:min-h-[38px]"
                >
                  <ThumbsUp className="h-3.5 w-3.5 text-black" />
                  <span>Upvote ({product.upvotes ?? 0})</span>
                </button>
              )}
            </div>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-neutral-200">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Directory Spot
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isRankOne && <Crown className="h-4 w-4 fill-black text-black" />}
                <span className="font-mono-num text-lg font-black text-black">
                  #{product.rank}
                </span>
                <span className="text-[11px] font-semibold text-neutral-500">
                  {isRankOne ? 'Top Featured' : 'Spot'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Community Upvotes
              </div>
              <div className="font-mono-num text-lg font-black text-black mt-0.5">
                {product.upvotes ?? 0}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Total Visits
              </div>
              <div className="font-mono-num text-lg font-black text-black mt-0.5">
                {product.clicks.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Category
              </div>
              <div className="text-xs font-bold text-black mt-1 truncate">
                {product.category}
              </div>
            </div>
          </div>
        </div>

        {/* Deep-Dive Grid: Everything The Website Does */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Description, What It Does, Features, Use Cases */}
          <div className="lg:col-span-2 space-y-6">
            {/* About & Executive Overview */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                <Sparkles className="h-4 w-4 text-black" />
                <h2 className="text-sm font-black uppercase tracking-wider text-black">
                  About {product.name}
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal">
                {product.description || `${product.name} is a premier platform in the ${product.category} space. Engineered to deliver exceptional speed, polish, and reliable performance, it helps builders and teams streamline their workflows.`}
              </p>

              {product.featuredQuote && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 flex items-start gap-3">
                  <MessageSquareQuote className="h-5 w-5 text-black shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold text-neutral-800 italic">
                    "{product.featuredQuote}"
                  </div>
                </div>
              )}
            </div>

            {/* What It Does / Core Capabilities */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-black" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-black">
                    What {product.name} Does
                  </h2>
                </div>
                <span className="text-xs font-bold text-neutral-400">
                  {product.whatItDoes ? product.whatItDoes.length : 4} Key Capabilities
                </span>
              </div>

              <div className="space-y-3">
                {product.whatItDoes && product.whatItDoes.length > 0 ? (
                  product.whatItDoes.map((item, idx) => {
                    const parts = item.split(':');
                    const heading = parts.length > 1 ? parts[0] : null;
                    const body = parts.length > 1 ? parts.slice(1).join(':') : item;

                    return (
                      <div key={idx} className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3.5 hover:bg-neutral-100 transition-colors">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-white text-[10px] font-black">
                          {idx + 1}
                        </div>
                        <div className="text-xs sm:text-sm text-neutral-700 leading-relaxed">
                          {heading && <strong className="font-bold text-black block mb-0.5">{heading}:</strong>}
                          <span>{body}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                      <span>Streamlines {product.category.toLowerCase()} workflows with intuitive controls and rapid turnaround.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                      <span>Provides reliable infrastructure and modern developer-friendly APIs.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-black" />
                      <span>Built for high availability and keyboard-driven efficiency.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Core Features Grid */}
            {product.features && product.features.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <ShieldCheck className="h-4 w-4 text-black" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-black">
                    Key Features & Architecture
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-black text-black">
                          {feat.title}
                        </h3>
                        {feat.tag && (
                          <span className="rounded-full bg-white border border-neutral-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-black">
                            {feat.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-neutral-600">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Use Cases & Who Uses It */}
            {product.useCases && product.useCases.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                  <Target className="h-4 w-4 text-black" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-black">
                    Who Uses It & Real-World Use Cases
                  </h2>
                </div>

                <div className="space-y-3">
                  {product.useCases.map((uc, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-black">
                          {uc.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                          {uc.audience}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {uc.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 1 Col: Specifications, Quick Action Panel */}
          <div className="space-y-6">
            {/* Quick Specs & Highlights */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-black border-b border-neutral-100 pb-2">
                Website Specifications
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Category</span>
                  <span className="font-bold text-black">{product.category}</span>
                </div>

                {product.pricingModel && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Pricing Model</span>
                    <span className="font-bold text-black text-right truncate max-w-[180px]">{product.pricingModel}</span>
                  </div>
                )}

                {product.targetAudience && (
                  <div className="pt-1 border-t border-neutral-100">
                    <span className="text-neutral-500 font-medium block mb-0.5">Target Audience</span>
                    <span className="font-semibold text-neutral-800 text-[11px] block">{product.targetAudience}</span>
                  </div>
                )}

                {product.keyHighlights && product.keyHighlights.map((kh, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-1 border-t border-neutral-100">
                    <span className="text-neutral-500 font-medium">{kh.label}</span>
                    <span className="font-bold text-black">{kh.value}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <span className="text-neutral-500 font-medium">Directory Visits</span>
                  <span className="font-mono-num font-bold text-black">{product.clicks.toLocaleString()} clicks</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
                  <span className="text-neutral-500 font-medium">Official Link</span>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackClick(product.id, product.url)}
                    className="font-bold text-black underline flex items-center gap-1"
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Direct Visit CTA Card */}
            <div className="rounded-2xl border border-black bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black">
                  <span>Visit {product.name}</span>
                </div>
                <span className="text-[10px] font-mono-num font-bold text-neutral-500">
                  Spot #{product.rank}
                </span>
              </div>

              <p className="text-xs text-neutral-600">
                Explore the official website and get started with {product.name}.
              </p>

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onTrackClick(product.id, product.url);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 text-xs font-black text-white hover:bg-neutral-800 active:scale-95 transition-all shadow-2xs cursor-pointer min-h-[44px]"
              >
                <span>Open {product.name}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Explore Related Websites */}
        {relatedProducts.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-black">
                Explore More Websites
              </h2>
              <button
                onClick={onBack}
                className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Directory</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onSelectProduct(rel);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 hover:border-black hover:bg-white transition-all cursor-pointer space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg overflow-hidden border border-neutral-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        {rel.logoUrl ? (
                          <img src={rel.logoUrl} alt={rel.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-black">{rel.name.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-black group-hover:underline">
                          {rel.name}
                        </h3>
                        <span className="text-[10px] text-neutral-500">{rel.category}</span>
                      </div>
                    </div>

                    <div className="font-mono-num text-xs font-black text-black bg-white border border-neutral-200 px-2 py-0.5 rounded-md">
                      #{rel.rank}
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                    {rel.tagline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Infinite Scrolling Top 5 Websites Bar */}
      <aside 
        aria-label="Top Ranked Websites Live Feed"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-300 bg-white/95 backdrop-blur-md py-2 shadow-lg"
      >
        <div className="mx-auto flex max-w-5xl items-center px-3 sm:px-6">
          {/* Infinite scrolling marquee container */}
          <div className="relative flex-1 overflow-hidden mask-fade-edges">
            <div className="animate-marquee-infinite flex items-center gap-3">
              {[...topFiveWebsites, ...topFiveWebsites].map((item, idx) => {
                const isCurrentViewing = item.id === product.id;

                return (
                  <a
                    key={`${item.id}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onTrackClick(item.id, item.url);
                    }}
                    className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      isCurrentViewing
                        ? 'border-2 border-black bg-neutral-100 shadow-2xs'
                        : 'border-neutral-200 bg-white hover:border-black hover:bg-neutral-50'
                    }`}
                  >
                    {/* Logo / Favicon */}
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-white shadow-2xs">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-bold text-[10px] text-black">
                          {item.name[0]}
                        </span>
                      )}
                    </div>

                    {/* Website Name */}
                    <span className="text-black font-black whitespace-nowrap">
                      {item.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
