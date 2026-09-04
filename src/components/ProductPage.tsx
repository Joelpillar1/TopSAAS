import React, { useState } from 'react';
import { Product, Comment } from '../types';
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
  ChevronLeft, 
  X, 
  MessageSquareQuote, 
  MessageCircle, 
  Target,
  LogIn,
  User as UserIcon,
  Video,
  Play
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { timeAgo } from './ProductRow';

function getVideoEmbedUrl(url?: string): { type: 'iframe' | 'video' | 'link'; embedUrl: string } | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // YouTube: watch?v=ID or youtu.be/ID or youtube.com/embed/ID or shorts/ID
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return { type: 'iframe', embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=0&rel=0` };
  }

  // Loom: loom.com/share/ID or loom.com/embed/ID
  const loomMatch = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/i);
  if (loomMatch && loomMatch[1]) {
    return { type: 'iframe', embedUrl: `https://www.loom.com/embed/${loomMatch[1]}` };
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)/i);
  if (vimeoMatch && (vimeoMatch[3] || vimeoMatch[2])) {
    const id = vimeoMatch[3] || vimeoMatch[2];
    return { type: 'iframe', embedUrl: `https://player.vimeo.com/video/${id}` };
  }

  // Direct MP4 / WebM video
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return { type: 'video', embedUrl: trimmed };
  }

  return { type: 'link', embedUrl: trimmed };
}

const CommentAvatar: React.FC<{
  avatarUrl?: string;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}> = ({
  avatarUrl,
  name = 'User',
  className = 'h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-700 bg-neutral-800',
  fallbackClassName = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[11px] font-black text-[#0b0f14]'
}) => {
  const [hasError, setHasError] = useState(false);
  const initial = (name || 'U').trim().slice(0, 1).toUpperCase() || 'U';

  if (avatarUrl && !hasError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className={fallbackClassName}>
      {initial}
    </div>
  );
};

interface ProductPageProps {
  product: Product;
  topProduct: Product;
  allProducts: Product[];
  comments: Comment[];
  soundEnabled: boolean;
  isSignedIn?: boolean;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onOpenSignIn?: () => void;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onShare: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onAddComment: (productId: string, content: string, userName: string, userEmail?: string, userAvatar?: string) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  allProducts,
  comments,
  soundEnabled,
  isSignedIn = false,
  userName,
  userEmail,
  userAvatar,
  onOpenSignIn,
  onBack,
  onSelectProduct,
  onShare,
  onTrackClick,
  onAddComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isRankOne = product.rank === 1;

  // Filter related products (same category or neighboring ranks)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || Math.abs(p.rank - product.rank) <= 2))
    .slice(0, 3);

  // Top 5 websites sorted by rank for bottom sticky carousel
  const topFiveWebsites = allProducts.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#222222] text-neutral-100 flex flex-col font-sans pb-28 sm:pb-28">
      {/* Top sticky navigation breadcrumb bar */}
      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-[#222222]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onBack();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-[#343434] px-3 py-2 sm:py-1.5 text-xs font-bold text-neutral-100 shadow-2xs hover:bg-neutral-800 hover:border-neutral-500 active:scale-95 transition-all cursor-pointer shrink-0 min-h-[38px]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Directory</span>
            </button>

            {/* Breadcrumb path */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-500 font-medium truncate">
              <span className="cursor-pointer hover:text-white" onClick={onBack}>Directory</span>
              <span>/</span>
              <span className="text-neutral-400">{product.category}</span>
              <span>/</span>
              <span className="text-white font-bold truncate max-w-[160px]">{product.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                playSound('click', soundEnabled);
                onShare(product);
              }}
              className="inline-flex items-center justify-center rounded-xl border border-neutral-700 bg-[#343434] p-2 sm:px-3 sm:py-1.5 text-xs font-bold text-neutral-300 hover:text-white hover:border-neutral-500 shadow-2xs active:scale-95 transition-all cursor-pointer min-h-[38px] min-w-[38px]"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline sm:ml-1.5">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="mx-auto w-full max-w-5xl px-3.5 py-4 sm:px-6 sm:py-6 space-y-5 sm:space-y-6 flex-1">
        {/* Header Hero Section */}
        <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
            {/* Logo and titles */}
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              <ProductLogo
                src={product.logoUrl}
                alt={product.name}
                containerClassName="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-800 bg-[#222222] shadow-2xs flex items-center justify-center"
                iconClassName="h-8 w-8 text-neutral-500 shrink-0"
                badge={
                  <div className={`absolute bottom-0 right-0 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-tl-lg font-mono-num text-[10px] sm:text-[11px] font-black z-20 ${
                    isRankOne ? 'bg-mint-500 text-[#0b0f14]' : 'bg-neutral-700 text-white'
                  }`}>
                    #{product.rank}
                  </div>
                }
              />
            </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white truncate">
                    {product.name}
                  </h1>
                  {product.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/15 border border-mint-500/40 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-mint-300">
                      <CheckCircle2 className="h-3 w-3 fill-mint-500 text-[#0b0f14]" />
                      <span>Verified</span>
                    </span>
                  )}
                  <span className="rounded-full bg-[#343434] border border-neutral-700 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-neutral-400">
                    {product.category}
                  </span>
                </div>

                <p className="text-xs sm:text-base font-medium text-neutral-400 max-w-2xl leading-relaxed">
                  {product.tagline}
                </p>

                {/* Built By Founder Hero Badge */}
                {(product.creatorName || product.creatorUsername || product.creatorAvatar) && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-[#222222] border border-neutral-700/80 pl-1 pr-2.5 py-0.5 text-xs">
                      <CommentAvatar
                        avatarUrl={product.creatorAvatar}
                        name={product.creatorName || product.creatorUsername || 'Founder'}
                        className="h-5 w-5 shrink-0 rounded-full object-cover border border-neutral-600"
                        fallbackClassName="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[9px] font-black text-[#0b0f14]"
                      />
                      <span className="text-neutral-500 font-medium text-[11px]">Built by</span>
                      <span className="font-bold text-white text-[11px]">{product.creatorName || product.creatorUsername}</span>
                      {product.creatorUsername && product.creatorName && (
                        <span className="text-neutral-400 text-[10px]">
                          {product.creatorUsername.startsWith('@') ? product.creatorUsername : `@${product.creatorUsername}`}
                        </span>
                      )}
                      {product.creatorRole && (
                        <span className="text-[9px] font-semibold text-mint-300 bg-mint-500/10 border border-mint-500/25 px-1.5 py-0.5 rounded">
                          {product.creatorRole}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* External URL & Social Links */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 text-xs">
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackClick(product.id, product.url)}
                    className="inline-flex items-center gap-1 font-bold text-mint-300 underline underline-offset-4 hover:text-mint-200 transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{product.url.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  {product.twitterHandle && !product.socials?.some((s) => s.platform === 'x') && (
                    <a
                      href={`https://x.com/${product.twitterHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-[#343434] px-2 py-0.5 text-[11px] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
                    >
                      <span>X {product.twitterHandle.startsWith('@') ? product.twitterHandle : `@${product.twitterHandle}`}</span>
                    </a>
                  )}

                  {product.socials?.map((s, idx) => {
                    const name = (() => {
                      switch (s.platform) {
                        case 'x': return 'X (Twitter)';
                        case 'linkedin': return 'LinkedIn';
                        case 'reddit': return 'Reddit';
                        case 'product_hunt': return 'Product Hunt';
                        case 'github': return 'GitHub';
                        case 'discord': return 'Discord';
                        case 'app_store': return 'App Store';
                        case 'play_store': return 'Google Play';
                        case 'chrome_web_store': return 'Chrome Extension';
                        default: return s.platform;
                      }
                    })();
                    return (
                      <a
                        key={`${s.platform}-${idx}`}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-neutral-700 bg-[#343434] px-2 py-0.5 text-[11px] font-semibold text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
                      >
                        <span>{name}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </a>
                    );
                  })}
                </div>
              </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onTrackClick(product.id, product.url);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-black text-[#0b0f14] shadow-2xs hover:bg-neutral-300 active:scale-[0.98] transition-all cursor-pointer text-center min-h-[44px] sm:min-h-[38px]"
              >
                <span>Visit Official Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 pt-4 border-t border-neutral-800">
            <div className="rounded-xl border border-neutral-800 bg-[#222222] p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Directory Spot
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isRankOne && <Crown className="h-4 w-4 fill-mint-500 text-mint-500" />}
                <span className="font-mono-num text-lg font-black text-white">
                  #{product.rank}
                </span>
                <span className="text-[11px] font-semibold text-neutral-500">
                  {isRankOne ? 'Top Featured' : 'Spot'}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-[#222222] p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Total Visits
              </div>
              <div className="font-mono-num text-lg font-black text-white mt-0.5">
                {product.clicks.toLocaleString()}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-[#222222] p-3 shadow-2xs">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Category
              </div>
              <div className="text-xs font-bold text-white mt-1 truncate">
                {product.category}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Video Section */}
        {(() => {
          const videoData = getVideoEmbedUrl(product.demoVideoUrl);
          if (!videoData) return null;

          return (
            <section className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-mint-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Product Demo Video</h2>
                </div>
                <a
                  href={product.demoVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-mint-300 hover:text-mint-200 transition-colors"
                >
                  <span>Open Video</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-800 bg-black">
                {videoData.type === 'iframe' ? (
                  <iframe
                    src={videoData.embedUrl}
                    title={`${product.name} Demo Video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                ) : videoData.type === 'video' ? (
                  <video
                    src={videoData.embedUrl}
                    controls
                    preload="metadata"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-500/20 text-mint-300">
                      <Play className="h-6 w-6 fill-mint-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Watch {product.name} Demo</h3>
                      <p className="text-xs text-neutral-400 mt-1">Click below to watch the product demonstration.</p>
                    </div>
                    <a
                      href={videoData.embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-xs font-black text-[#0b0f14] hover:bg-mint-400 transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Watch Demo</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* Screenshots Gallery */}
        {product.screenshots && product.screenshots.length > 0 && (
          <section className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Screenshots</h2>
              <span className="font-mono-num text-xs font-bold text-neutral-500">
                {product.screenshots.length} {product.screenshots.length === 1 ? 'image' : 'images'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {product.screenshots.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setLightboxIndex(i);
                  }}
                  className="group relative aspect-video overflow-hidden rounded-xl border border-neutral-800 bg-[#222222] cursor-pointer"
                  aria-label={`View screenshot ${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`${product.name} screenshot ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Deep-Dive Grid: Everything The Website Does */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left 2 Cols: Description, What It Does, Features, Use Cases */}
          <div className="lg:col-span-2 space-y-6">
            {/* About & Executive Overview */}
            <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Sparkles className="h-4 w-4 text-mint-300" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  About {product.name}
                </h2>
              </div>

              <p className="text-sm sm:text-base leading-relaxed text-neutral-400 font-normal">
                {product.description || `${product.name} is a premier platform in the ${product.category} space. Engineered to deliver exceptional speed, polish, and reliable performance, it helps builders and teams streamline their workflows.`}
              </p>

              {product.featuredQuote && (
                <div className="rounded-xl border border-neutral-800 bg-[#222222] p-4 flex items-start gap-3">
                  <MessageSquareQuote className="h-5 w-5 text-mint-300 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold text-neutral-300 italic">
                    "{product.featuredQuote}"
                  </div>
                </div>
              )}
            </div>

            {/* What It Does / Core Capabilities */}
            <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-mint-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    What {product.name} Does
                  </h2>
                </div>
                <span className="text-xs font-bold text-neutral-500">
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
                      <div key={idx} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#222222] p-3.5 hover:bg-[#343434] transition-colors">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[#0b0f14] text-[10px] font-black">
                          {idx + 1}
                        </div>
                        <div className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                          {heading && <strong className="font-bold text-white block mb-0.5">{heading}:</strong>}
                          <span>{body}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-2 text-xs text-neutral-500">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-mint-500" />
                      <span>Streamlines {product.category.toLowerCase()} workflows with intuitive controls and rapid turnaround.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-mint-500" />
                      <span>Provides reliable infrastructure and modern developer-friendly APIs.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-mint-500" />
                      <span>Built for high availability and keyboard-driven efficiency.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Core Features Grid */}
            {product.features && product.features.length > 0 && (
              <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <ShieldCheck className="h-4 w-4 text-mint-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    Key Features & Architecture
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-800 bg-[#222222] p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-black text-white">
                          {feat.title}
                        </h3>
                        {feat.tag && (
                          <span className="rounded-full bg-neutral-800 border border-neutral-700 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-neutral-300">
                            {feat.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed text-neutral-400">
                        {feat.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Use Cases & Who Uses It */}
            {product.useCases && product.useCases.length > 0 && (
              <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
                  <Target className="h-4 w-4 text-mint-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    Who Uses It & Real-World Use Cases
                  </h2>
                </div>

                <div className="space-y-3">
                  {product.useCases.map((uc, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white">
                          {uc.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-neutral-400 bg-[#343434] px-2 py-0.5 rounded-md">
                          {uc.audience}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
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
            {/* Founder / Maker Spotlight Card */}
            {(product.creatorName || product.creatorUsername || product.creatorAvatar || product.creatorXHandle) && (
              <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-mint-400" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-white">
                      Meet the Founder
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/10 border border-mint-500/30 px-2 py-0.5 text-[9px] font-bold text-mint-300">
                    <CheckCircle2 className="h-2.5 w-2.5 fill-mint-500 text-[#0b0f14]" />
                    Verified Maker
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <CommentAvatar
                    avatarUrl={product.creatorAvatar}
                    name={product.creatorName || product.creatorUsername || 'Founder'}
                    className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-neutral-700 bg-neutral-800 shadow-md"
                    fallbackClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint-500 text-sm font-black text-[#0b0f14]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-white truncate">
                        {product.creatorName || product.creatorUsername || 'Product Maker'}
                      </h3>
                    </div>
                    {product.creatorUsername && (
                      <p className="text-xs font-semibold text-mint-300">
                        {product.creatorUsername.startsWith('@') ? product.creatorUsername : `@${product.creatorUsername}`}
                      </p>
                    )}
                    <p className="text-[11px] font-medium text-neutral-400 mt-0.5">
                      {product.creatorRole || 'Founder & Creator'}
                    </p>
                  </div>
                </div>

                {product.creatorXHandle && (
                  <div className="pt-2 border-t border-neutral-800/80">
                    <a
                      href={`https://x.com/${product.creatorXHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-[#343434] py-2 px-3 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Follow {product.creatorXHandle.startsWith('@') ? product.creatorXHandle : `@${product.creatorXHandle}`} on X</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Quick Specs & Highlights */}
            <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-white border-b border-neutral-800 pb-2">
                Website Specifications
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Category</span>
                  <span className="font-bold text-white">{product.category}</span>
                </div>

                {product.pricingModel && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Pricing Model</span>
                    <span className="font-bold text-white text-right truncate max-w-[180px]">{product.pricingModel}</span>
                  </div>
                )}

                {product.targetAudience && (
                  <div className="pt-1 border-t border-neutral-800">
                    <span className="text-neutral-500 font-medium block mb-0.5">Target Audience</span>
                    <span className="font-semibold text-neutral-300 text-[11px] block">{product.targetAudience}</span>
                  </div>
                )}

                {product.keyHighlights && product.keyHighlights.map((kh, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-1 border-t border-neutral-800">
                    <span className="text-neutral-500 font-medium">{kh.label}</span>
                    <span className="font-bold text-white">{kh.value}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                  <span className="text-neutral-500 font-medium">Directory Visits</span>
                  <span className="font-mono-num font-bold text-white">{product.clicks.toLocaleString()} clicks</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-neutral-800">
                  <span className="text-neutral-500 font-medium">Official Link</span>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackClick(product.id, product.url)}
                    className="font-bold text-mint-300 underline flex items-center gap-1 hover:text-mint-200 transition-colors"
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {product.socials && product.socials.length > 0 && (
                  <div className="pt-2.5 border-t border-neutral-800 space-y-2">
                    <span className="text-neutral-500 font-medium block text-[11px]">Social & Distribution</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.socials.map((s, idx) => {
                        const name = (() => {
                          switch (s.platform) {
                            case 'x': return 'X';
                            case 'linkedin': return 'LinkedIn';
                            case 'reddit': return 'Reddit';
                            case 'product_hunt': return 'Product Hunt';
                            case 'github': return 'GitHub';
                            case 'discord': return 'Discord';
                            case 'app_store': return 'App Store';
                            case 'play_store': return 'Google Play';
                            case 'chrome_web_store': return 'Extension';
                            default: return s.platform;
                          }
                        })();
                        return (
                          <a
                            key={`spec-soc-${idx}`}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-[#343434] px-2 py-1 text-[10px] font-bold text-neutral-300 hover:border-mint-500/50 hover:text-mint-200 transition-colors"
                          >
                            <span>{name}</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Visit CTA Card */}
            <div className="rounded-2xl border border-mint-500/50 bg-[#2f2f2f] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-mint-200">
                  <span>Visit {product.name}</span>
                </div>
                <span className="text-[10px] font-mono-num font-bold text-neutral-500">
                  Spot #{product.rank}
                </span>
              </div>

              <p className="text-xs text-neutral-400">
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-mint-500 py-3 text-xs font-black text-[#0b0f14] hover:bg-mint-400 active:scale-95 transition-all shadow-2xs cursor-pointer min-h-[44px]"
              >
                <span>Open {product.name}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Discussion & Comments */}
        <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-mint-300" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Discussion
              </h2>
            </div>
            <span className="font-mono-num text-xs font-bold text-neutral-500">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>

          {/* Compose box or Sign-in prompt */}
          {isSignedIn ? (
            <div className="space-y-3 rounded-xl border border-neutral-700/60 bg-[#1e1e1e] p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5">
                <CommentAvatar
                  avatarUrl={userAvatar}
                  name={userName || userEmail?.split('@')[0] || 'User'}
                  className="h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                  fallbackClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[11px] font-black text-[#0b0f14]"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">
                      {userName || userEmail?.split('@')[0] || 'Signed-in User'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/10 border border-mint-500/20 px-2 py-0.5 text-[9px] font-bold text-mint-300">
                      Verified
                    </span>
                  </div>
                  {userEmail && (
                    <p className="text-[10px] text-neutral-400 truncate">
                      {userEmail}
                    </p>
                  )}
                </div>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Ask a question or leave a comment about ${product.name}...`}
                rows={3}
                maxLength={2000}
                className="w-full rounded-xl border border-neutral-700 bg-[#2a2a2a] px-3.5 py-2.5 text-xs font-medium text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-mint-500/30 focus:border-mint-500 transition-shadow resize-none"
              />

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] font-medium text-neutral-400">{commentText.length}/2000</span>
                <button
                  type="button"
                  disabled={!commentText.trim()}
                  onClick={() => {
                    const authorName = userName || userEmail?.split('@')[0] || 'User';
                    playSound('click', soundEnabled);
                    onAddComment(product.id, commentText, authorName, userEmail, userAvatar);
                    setCommentText('');
                  }}
                  className="rounded-xl bg-mint-500 px-4 py-2 text-xs font-bold text-[#0b0f14] hover:bg-mint-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                >
                  Post comment
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-neutral-700/60 bg-[#1e1e1e] p-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400 border border-neutral-700">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Join the discussion</p>
                  <p className="text-[11px] text-neutral-400">Sign in to leave a comment with your name and profile picture.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenSignIn?.();
                }}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-mint-500 hover:bg-mint-400 text-[#0b0f14] px-4 py-2.5 text-xs font-black shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign in to comment</span>
              </button>
            </div>
          )}

          {/* Comment list */}
          {comments.length === 0 ? (
            <p className="py-2 text-xs font-medium text-neutral-400">
              No comments yet — start the conversation.
            </p>
          ) : (
            <div className="space-y-3">
              {[...comments]
                .sort((a, b) => a.createdAt - b.createdAt)
                .map((c) => (
                  <div key={c.id} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#222222] p-3.5">
                    <CommentAvatar
                      avatarUrl={c.userAvatar}
                      name={c.userName}
                      className="h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-700 bg-neutral-800"
                      fallbackClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[11px] font-black text-[#0b0f14]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.userName}</span>
                        <span className="text-[10px] font-medium text-neutral-500">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-400 break-words whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Explore Related Websites */}
        {relatedProducts.length > 0 && (
          <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Explore More Websites
              </h2>
              <button
                onClick={onBack}
                className="text-xs font-bold text-neutral-500 hover:text-white flex items-center gap-1 cursor-pointer"
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
                  className="rounded-xl border border-neutral-800 bg-[#222222] p-4 hover:border-neutral-600 hover:bg-[#343434] transition-all cursor-pointer space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg overflow-hidden border border-neutral-800 bg-[#222222] flex items-center justify-center shrink-0 shadow-2xs">
                        {rel.logoUrl ? (
                          <img src={rel.logoUrl} alt={rel.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">{rel.name.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-white group-hover:underline">
                          {rel.name}
                        </h3>
                        <span className="text-[10px] text-neutral-500">{rel.category}</span>
                      </div>
                    </div>

                    <div className="font-mono-num text-xs font-black text-neutral-200 bg-neutral-800 border border-neutral-700 px-2 py-0.5 rounded-md">
                      #{rel.rank}
                    </div>
                  </div>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                    {rel.tagline}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Screenshots lightbox */}
      {lightboxIndex !== null && product.screenshots && product.screenshots.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Screenshot viewer"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 bg-[#2a2a2a] text-white hover:border-neutral-500 cursor-pointer"
            aria-label="Close viewer"
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSound('click', soundEnabled);
                setLightboxIndex(lightboxIndex - 1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 bg-[#2a2a2a] text-white hover:border-neutral-500 cursor-pointer"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {lightboxIndex < product.screenshots.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                playSound('click', soundEnabled);
                setLightboxIndex(lightboxIndex + 1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-700 bg-[#2a2a2a] text-white hover:border-neutral-500 cursor-pointer"
              aria-label="Next screenshot"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <img
            src={product.screenshots[lightboxIndex]}
            alt={`${product.name} screenshot ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto max-h-[85vh] max-w-full rounded-2xl border border-neutral-700 object-contain shadow-2xl"
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-neutral-700 bg-[#2a2a2a] px-3 py-1 text-xs font-bold text-neutral-300">
            {lightboxIndex + 1} / {product.screenshots.length}
          </span>
        </div>
      )}

      {/* Sticky Bottom Infinite Scrolling Top 5 Websites Bar */}
      <aside 
        aria-label="Top Ranked Websites Live Feed"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-800 bg-[#222222]/90 backdrop-blur-md py-2 shadow-lg"
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
                        ? 'border-2 border-mint-500 bg-[#2f2f2f] shadow-2xs'
                        : 'border-neutral-700 bg-[#2a2a2a] hover:border-neutral-500 hover:bg-[#333333]'
                    }`}
                  >
                    {/* Logo / Favicon */}
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-700 bg-[#222222] shadow-2xs">
                      {item.logoUrl ? (
                        <img
                          src={item.logoUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-bold text-[10px] text-neutral-300">
                          {item.name[0]}
                        </span>
                      )}
                    </div>

                    {/* Website Name */}
                    <span className="text-white font-black whitespace-nowrap">
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
