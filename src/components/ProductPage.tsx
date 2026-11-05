import React, { useState } from 'react';
import { Product, Comment } from '../types';
import { 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  MessageSquareQuote, 
  MessageCircle, 
  Target,
  LogIn,
  User as UserIcon,
  Video,
  Play,
  ChevronUp,
  Tag,
  Copy,
  Check,
  Star,
  Flame,
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { RichText } from './RichText';
import { VerifiedBadge } from './VerifiedBadge';
import { SponsoredPartnersSidebar } from './SponsoredPartnersSidebar';
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
  className = 'h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-200 bg-neutral-800',
  fallbackClassName = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[11px] font-black text-white'
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
  onUpvote?: (product: Product) => void;
  isUpvoted?: boolean;
  onOpenFeaturedSpotModal?: () => void;
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
  onUpvote,
  isUpvoted = false,
  onOpenFeaturedSpotModal,
}) => {
  const [commentText, setCommentText] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedOffer, setCopiedOffer] = useState(false);

  const handleCopyOfferCode = (code: string) => {
    playSound('click', soundEnabled);
    try {
      navigator.clipboard.writeText(code);
    } catch {}
    setCopiedOffer(true);
    setTimeout(() => setCopiedOffer(false), 2000);
  };

  // Filter related products (same category or neighboring ranks)
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || Math.abs(p.rank - product.rank) <= 2))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans pb-12 sm:pb-16">
      {/* Main Page Content */}
      <main className="mx-auto w-full max-w-5xl px-3.5 py-4 sm:px-6 sm:py-6 space-y-5 sm:space-y-6 flex-1">
        {/* Header Hero Section */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-8 shadow-xs space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
            {/* Logo and titles */}
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              <ProductLogo
                src={product.logoUrl}
                alt={product.name}
                containerClassName="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs flex items-center justify-center"
                iconClassName="h-8 w-8 text-neutral-500 shrink-0"
              />
            </div>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h1 className="text-xl sm:text-3xl font-black tracking-tight text-neutral-950 truncate">
                    {product.name}
                  </h1>
                  {product.verified && (
                    <VerifiedBadge className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" title="Verified Startup" />
                  )}
                  {product.isSponsored && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-bold tracking-tight text-white shadow-xs select-none">
                      <span>Sponsored</span>
                    </span>
                  )}
                  {(product.autoRelaunch || product.isRelaunched) && !product.isSponsored && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-xs font-bold text-blue-700 shadow-2xs select-none">
                      <span>🚀</span>
                      <span>Weekly Relaunch</span>
                    </span>
                  )}
                  {product.offerDiscount && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-2 py-0.5 text-xs font-black tracking-tight text-white shadow-xs shadow-orange-500/25 select-none">
                      <Flame className="h-3 w-3 fill-white stroke-white shrink-0" />
                      <span>{product.offerDiscount}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-base font-medium text-neutral-400 max-w-2xl leading-relaxed">
                  {product.tagline}
                </p>

                {/* Built By Founder Hero Badge */}
                {(product.creatorName || product.creatorAvatar) && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-neutral-200 pl-1 pr-2 py-1 text-xs shadow-2xs">
                      <CommentAvatar
                        avatarUrl={product.creatorAvatar}
                        name={product.creatorName || 'Founder'}
                        className="h-5 w-5 shrink-0 rounded-full object-cover border border-neutral-600"
                        fallbackClassName="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[9px] font-black text-white"
                      />
                      <span className="text-neutral-500 font-medium text-[11px]">Built by</span>
                      <span className="font-bold text-neutral-900 text-[11px]">{product.creatorName}</span>
                      {product.creatorRole && (
                        <span className="text-[9px] font-semibold text-mint-600 bg-mint-500/10 border border-mint-500/25 px-1.5 py-0.5 rounded-md">
                          {product.creatorRole}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(product.twitterHandle || (product.socials && product.socials.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 text-xs">
                    {product.twitterHandle && !product.socials?.some((s) => s.platform === 'x') && (
                      <a
                        href={`https://x.com/${product.twitterHandle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                      >
                        <span>X {product.twitterHandle.startsWith('@') ? product.twitterHandle : `@${product.twitterHandle}`}</span>
                      </a>
                    )}

                    {product.socials?.map((s, idx) => {
                      const name = (() => {
                        switch (s.platform) {
                          case 'x': return 'X (Twitter)';
                          case 'linkedin': return 'LinkedIn';
                          case 'youtube': return 'YouTube';
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
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                        >
                          <span>{name}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {onUpvote ? (
                <button
                  type="button"
                  onClick={() => onUpvote(product)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-3 text-xs font-bold transition-all cursor-pointer active:scale-95 border min-h-[44px] sm:min-h-[38px] ${
                    isUpvoted
                      ? 'bg-mint-500 border-mint-400 text-white'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50'
                  }`}
                  title={!isSignedIn ? 'Sign in to upvote' : (isUpvoted ? 'Remove upvote' : 'Upvote product')}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="font-mono-num font-black text-sm">{(product.upvotes ?? 0).toLocaleString()}</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-xs font-bold text-neutral-900 min-h-[44px] sm:min-h-[38px]">
                  <ChevronUp className="h-4 w-4 text-mint-600" />
                  <span className="font-mono-num font-black text-sm">{(product.upvotes ?? 0).toLocaleString()}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('product-discussion-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer min-h-[44px] sm:min-h-[38px]"
                title="Jump to discussion"
              >
                <MessageCircle className="h-4 w-4 text-mint-600" />
                <span className="font-mono-num font-black text-sm">{comments.length.toLocaleString()}</span>
              </button>

              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onTrackClick(product.id, product.url);
                }}
                className="btn-primary px-5 py-2.5 text-xs font-bold text-center min-h-[42px] sm:min-h-[38px]"
              >
                <span>Visit Website</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Exclusive Offer / Viewer Deal Banner */}
          {(product.offerDiscount || product.offerCode) && (
            <div className="relative overflow-hidden rounded-2xl border border-mint-500/40 bg-mint-50/70 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint-500 text-white">
                    <Tag className="h-5 w-5 fill-white stroke-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full bg-mint-500 text-white px-2 py-0.5 text-[10px] font-bold">
                        Exclusive TopSAAS deal
                      </span>
                      {product.offerDiscount && (
                        <span className="text-sm sm:text-base font-black text-mint-600">
                          {product.offerDiscount}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-700 mt-1 font-medium">
                      {product.offerDetails || `Special discount available for TopSAAS viewers.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  {product.offerCode && (
                    <button
                      type="button"
                      onClick={() => handleCopyOfferCode(product.offerCode!)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl border border-dashed border-mint-500/60 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-mint-700 hover:bg-mint-500/10 hover:border-mint-400 transition-all cursor-pointer min-h-[40px]"
                      title="Click to copy promo code"
                    >
                      <span>{product.offerCode}</span>
                      {copiedOffer ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-sans font-black text-mint-700 bg-mint-500/15 px-1.5 py-0.5 rounded">
                          <Check className="h-3 w-3" /> Copied!
                        </span>
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-neutral-500" />
                      )}
                    </button>
                  )}

                  <a
                    href={product.offerUrl || product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onTrackClick(product.id, product.offerUrl || product.url);
                    }}
                    className="flex-1 sm:flex-initial btn-primary px-4 py-2 text-xs font-bold min-h-[40px]"
                  >
                    <span>Redeem Deal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Metrics bar */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-200">
            <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-2xs">
              <div className="text-[11px] font-bold text-neutral-500">
                Category
              </div>
              <div className="text-xs font-bold text-neutral-950 mt-1 truncate">
                {product.category}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-2xs">
              <div className="text-[11px] font-bold text-neutral-500">
                {product.pricingModel ? 'Pricing' : 'Status'}
              </div>
              <div className="text-xs font-bold text-neutral-950 mt-1 truncate">
                {product.pricingModel || 'Live on Directory'}
              </div>
            </div>
          </div>
        </div>

        {/* Product Media: Demo Video (YouTube, Loom, Vimeo, direct MP4) or Screenshots */}
        {(() => {
          const videoData = getVideoEmbedUrl(product.demoVideoUrl);
          if (!videoData) return null;

          return (
            <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-mint-600" />
                  <h2 className="text-sm font-bold text-neutral-950">Product demo</h2>
                </div>
                <span className="text-[11px] font-bold text-mint-600 bg-mint-50 border border-mint-200 px-2 py-0.5 rounded-md">
                  Interactive video
                </span>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 bg-black">
                {videoData.type === 'iframe' && (
                  <iframe
                    src={videoData.embedUrl}
                    title={`${product.name} demo video`}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
                {videoData.type === 'video' && (
                  <video
                    src={videoData.embedUrl}
                    controls
                    className="h-full w-full object-cover"
                    poster={product.screenshots?.[0]}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
                {videoData.type === 'link' && (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
                    <p className="text-sm text-neutral-600">Watch the product demo video:</p>
                    <a
                      href={videoData.embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-mint-500 px-4 py-2 text-xs font-black text-white hover:bg-mint-600"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Watch on external site
                    </a>
                  </div>
                )}
              </div>
            </section>
          );
        })()}

        {/* Screenshots Gallery */}
        {product.screenshots && product.screenshots.length > 0 && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <h2 className="text-sm font-bold text-neutral-950">Screenshots</h2>
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
                  className="group relative aspect-video overflow-hidden rounded-xl border border-neutral-200 bg-white cursor-pointer"
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
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-neutral-200 pb-3">
                <h2 className="text-sm font-bold text-neutral-950">
                  About {product.name}
                </h2>
              </div>

              {product.description ? (
                <RichText
                  html={product.description}
                  className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal"
                />
              ) : (
                <p className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal">
                  {`${product.name} is a premier platform in the ${product.category} space. Engineered to deliver exceptional speed, polish, and reliable performance, it helps builders and teams streamline their workflows.`}
                </p>
              )}

              {product.featuredQuote && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-start gap-3">
                  <MessageSquareQuote className="h-5 w-5 text-mint-600 shrink-0 mt-0.5" />
                  <div className="text-xs font-semibold text-neutral-600 italic">
                    "{product.featuredQuote}"
                  </div>
                </div>
              )}
            </div>


            {/* Problem / Solution / What Makes It Different */}
            {(() => {
              const sections = [
                product.problemItSolves && {
                  title: 'Problem',
                  content: product.problemItSolves,
                },
                product.solution && {
                  title: 'Solution',
                  content: product.solution,
                },
                product.uniqueSellingPoint && {
                  title: 'What makes it different',
                  content: product.uniqueSellingPoint,
                },
              ].filter(Boolean) as { title: string; content: string }[];

              if (sections.length === 0) return null;

              return (
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="border-b border-neutral-200 pb-3">
                    <h2 className="text-sm font-bold text-neutral-950">
                      What {product.name} does
                    </h2>
                  </div>

                  <div className="divide-y divide-neutral-200">
                    {sections.map((section, idx) => (
                      <div
                        key={section.title}
                        className={`${idx > 0 ? 'pt-5' : ''} ${idx < sections.length - 1 ? 'pb-5' : ''} space-y-1.5`}
                      >
                        <div className="mb-1">
                          <span className="text-xs font-bold text-mint-600">
                            {section.title}
                          </span>
                        </div>
                        <RichText
                          html={section.content}
                          className="text-xs sm:text-sm text-neutral-700 leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}


            {/* Use Cases & Who Uses It */}
            {product.useCases && product.useCases.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
                <div className="border-b border-neutral-200 pb-3">
                  <h2 className="text-sm font-bold text-neutral-950">
                    Who uses it and real-world use cases
                  </h2>
                </div>

                <div className="space-y-3">
                  {product.useCases.map((uc, idx) => (
                    <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-1 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-100 hover:shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-neutral-950">
                          {uc.title}
                        </h3>
                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-md">
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
            {(product.creatorName || product.creatorAvatar || product.creatorXHandle) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                  <div>
                    <h2 className="text-xs font-bold text-neutral-950">
                      Meet the founder
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/10 border border-mint-500/30 px-2 py-0.5 text-[9px] font-bold text-mint-600">
                    <CheckCircle2 className="h-2.5 w-2.5 fill-mint-500 text-white" />
                    Verified Maker
                  </span>
                </div>

                <div className="flex items-center gap-3.5">
                  <CommentAvatar
                    avatarUrl={product.creatorAvatar}
                    name={product.creatorName || 'Founder'}
                    className="h-12 w-12 shrink-0 rounded-full object-cover border-2 border-neutral-200 bg-neutral-800 shadow-md"
                    fallbackClassName="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint-500 text-sm font-black text-white"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-black text-neutral-950 truncate">
                        {product.creatorName || 'Product Maker'}
                      </h3>
                    </div>
                    <p className="text-[11px] font-medium text-neutral-400 mt-0.5">
                      {product.creatorRole || 'Founder & Creator'}
                    </p>
                  </div>
                </div>

                {product.creatorXHandle && (
                  <div className="pt-2 border-t border-neutral-200">
                    <a
                      href={`https://x.com/${product.creatorXHandle.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-100 py-2 px-3 text-xs font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 transition-all cursor-pointer"
                    >
                      <span>Follow {product.creatorXHandle.startsWith('@') ? product.creatorXHandle : `@${product.creatorXHandle}`} on X</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Quick Specs & Highlights */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3.5">
              <h2 className="text-xs font-bold text-neutral-950 border-b border-neutral-200 pb-2">
                Website specifications
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500 font-medium">Category</span>
                  <span className="font-bold text-neutral-900">{product.category}</span>
                </div>

                {product.pricingModel && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 font-medium">Pricing Model</span>
                    <span className="font-bold text-neutral-900 text-right truncate max-w-[180px]">{product.pricingModel}</span>
                  </div>
                )}

                {product.targetAudience && (
                  <div className="pt-1 border-t border-neutral-200">
                    <span className="text-neutral-500 font-medium block mb-0.5">Target Audience</span>
                    <span className="font-semibold text-neutral-800 text-[11px] block">{product.targetAudience}</span>
                  </div>
                )}

                {product.keyHighlights && product.keyHighlights.map((kh, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-1 border-t border-neutral-200">
                    <span className="text-neutral-500 font-medium">{kh.label}</span>
                    <span className="font-bold text-neutral-900">{kh.value}</span>
                  </div>
                ))}


                <div className="flex items-center justify-between pt-1 border-t border-neutral-200">
                  <span className="text-neutral-500 font-medium">Official Link</span>
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onTrackClick(product.id, product.url)}
                    className="font-bold text-mint-600 underline flex items-center gap-1 hover:text-mint-700 transition-colors"
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {product.socials && product.socials.length > 0 && (
                  <div className="pt-2.5 border-t border-neutral-200 space-y-2">
                    <span className="text-neutral-500 font-medium block text-[11px]">Social & Distribution</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.socials.map((s, idx) => {
                        const name = (() => {
                          switch (s.platform) {
                            case 'x': return 'X';
                            case 'linkedin': return 'LinkedIn';
                            case 'youtube': return 'YouTube';
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
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 transition-colors"
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

            {/* Sponsored Partners Sidebar Card */}
            <SponsoredPartnersSidebar
              sponsors={allProducts.filter((p) => p.isSponsored)}
              currentProductId={product.id}
              soundEnabled={soundEnabled}
              onSelectProduct={onSelectProduct}
              onTrackClick={onTrackClick}
              onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
            />

            {/* Direct Visit CTA Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="text-xs font-bold text-neutral-700">
                  <span>Visit {product.name}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-500">
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
                className="w-full btn-primary py-3 text-xs font-bold min-h-[44px]"
              >
                <span>Open {product.name}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Discussion & Comments */}
        <div id="product-discussion-section" className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h2 className="text-sm font-bold text-neutral-950">
              Discussion
            </h2>
            <span className="font-mono-num text-xs font-bold text-neutral-500">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </span>
          </div>

          {/* Compose box or Sign-in prompt */}
          {isSignedIn ? (
            <div className="space-y-3 rounded-xl border border-neutral-200/60 bg-white p-3.5 sm:p-4">
              <div className="flex items-center gap-2.5">
                <CommentAvatar
                  avatarUrl={userAvatar}
                  name={userName || userEmail?.split('@')[0] || 'User'}
                  className="h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-200 bg-neutral-800"
                  fallbackClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[11px] font-black text-white"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-950 truncate">
                      {userName || userEmail?.split('@')[0] || 'Signed-in User'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/10 border border-mint-500/20 px-2 py-0.5 text-[9px] font-bold text-mint-600">
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
                className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-mint-500/30 focus:border-mint-500 transition-shadow resize-none"
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
                  className="rounded-xl bg-mint-500 px-4 py-2 text-xs font-bold text-white hover:bg-mint-600 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                >
                  Post comment
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-neutral-200/60 bg-white p-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 border border-neutral-200">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-950">Join the discussion</p>
                  <p className="text-[11px] text-neutral-400">Sign in to leave a comment with your name and profile picture.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenSignIn?.();
                }}
                className="w-full sm:w-auto shrink-0 btn-primary px-4 py-2.5 text-xs font-bold"
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
                  <div key={c.id} className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-3.5">
                    <CommentAvatar
                      avatarUrl={c.userAvatar}
                      name={c.userName}
                      className="h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-200 bg-neutral-800"
                      fallbackClassName="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint-500 text-[11px] font-black text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-950">{c.userName}</span>
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
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-950">
                Explore more websites
              </h2>
              <button
                onClick={onBack}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
              >
                <span>Back to Home</span>
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
                  className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-600 hover:bg-neutral-100 transition-all cursor-pointer space-y-2 group shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg overflow-hidden border border-neutral-200 bg-white flex items-center justify-center shrink-0 shadow-2xs">
                        {rel.logoUrl ? (
                          <img src={rel.logoUrl} alt={rel.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">{rel.name.slice(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-neutral-900 group-hover:underline">
                          {rel.name}
                        </h3>
                        <span className="text-[10px] text-neutral-500">{rel.category}</span>
                      </div>
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
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-900/80 text-white hover:bg-neutral-900 cursor-pointer"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-900/80 text-white hover:bg-neutral-900 cursor-pointer"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-900/80 text-white hover:bg-neutral-900 cursor-pointer"
              aria-label="Next screenshot"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <img
            src={product.screenshots[lightboxIndex]}
            alt={`${product.name} screenshot ${lightboxIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto max-h-[85vh] max-w-full rounded-2xl border border-neutral-200 object-contain shadow-2xl"
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-neutral-700">
            {lightboxIndex + 1} / {product.screenshots.length}
          </span>
        </div>
      )}
    </div>
  );
};
