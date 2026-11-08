import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Product, Comment } from '../types';
import { 
  ExternalLink, 
  Layers, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  MessageSquareQuote, 
  MessageCircle, 
  MessageSquare,
  Send,
  Target,
  LogIn,
  User as UserIcon,
  Video,
  Play,
  ChevronUp,
  Tag,
  Copy,
  Check,
  Flame,
  Compass,
  Calendar,
  TrendingUp,
  CornerDownRight,
  Heart,
  Share2,
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { RichText } from './RichText';
import { VerifiedBadge } from './VerifiedBadge';
import { SponsoredPartnersSidebar } from './SponsoredPartnersSidebar';
import { timeAgo } from './ProductRow';
import { applyPageSeo } from '../utils/pageSeo';
import { formatOutboundUrl, trackOutboundClick } from '../utils/referral';

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

const AVATAR_GRADIENTS = [
  'bg-gradient-to-tr from-blue-600 to-indigo-600',
  'bg-gradient-to-tr from-violet-600 to-purple-600',
  'bg-gradient-to-tr from-indigo-500 to-blue-600',
  'bg-gradient-to-tr from-sky-500 to-blue-700',
  'bg-gradient-to-tr from-blue-700 to-slate-800',
];

const CommentAvatar: React.FC<{
  avatarUrl?: string;
  name?: string;
  className?: string;
  fallbackClassName?: string;
}> = ({
  avatarUrl,
  name = 'User',
  className = 'h-8 w-8 shrink-0 rounded-full object-cover border border-neutral-200/80 bg-neutral-100 shadow-2xs',
  fallbackClassName,
}) => {
  const [hasError, setHasError] = useState(false);
  const initial = (name || 'U').trim().slice(0, 1).toUpperCase() || 'U';
  const charCode = initial.charCodeAt(0) || 0;
  const gradientClass = AVATAR_GRADIENTS[charCode % AVATAR_GRADIENTS.length];

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
    <div
      className={
        fallbackClassName ||
        `flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${gradientClass} text-[11px] font-black text-white shadow-2xs select-none`
      }
    >
      {initial}
    </div>
  );
};

interface ProductPageProps {
  product: Product;
  topProduct: Product;
  allProducts: Product[];
  sponsors?: Product[];
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
  sponsors,
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
  const [commentUpvotes, setCommentUpvotes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedOffer, setCopiedOffer] = useState(false);

  // Dynamic SEO & SoftwareApplication JSON-LD schema for AEO / GEO
  useEffect(() => {
    const rawTagline = (product.tagline || '').trim();
    const cleanDesc = (product.description || product.tagline || `${product.name} is a modern SaaS tool listed on TopSAAS.`)
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);

    const title = rawTagline
      ? `${product.name} — ${rawTagline} | TopSAAS`
      : `${product.name} — Modern SaaS & AI Tool | TopSAAS`;

    const canonical = `https://www.topsaas.space/product/${product.id}`;

    // Schema.org SoftwareApplication JSON-LD
    const jsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: product.name,
      description: product.description || product.tagline || `Discover ${product.name} on TopSAAS`,
      url: product.url,
      applicationCategory: product.category || 'BusinessApplication',
      operatingSystem: 'All',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        category: product.pricingModel || 'Freemium',
      },
    };

    if (product.logoUrl) {
      jsonLd.image = product.logoUrl;
    }
    if (product.screenshots && product.screenshots.length > 0) {
      jsonLd.screenshot = product.screenshots[0];
    }
    if (product.creatorName) {
      jsonLd.author = {
        '@type': 'Person',
        name: product.creatorName,
      };
    }
    if (typeof product.upvotes === 'number' && product.upvotes > 0) {
      jsonLd.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: Math.max(1, product.upvotes),
        bestRating: '5',
        worstRating: '1',
      };
    }

    return applyPageSeo({
      title,
      description: cleanDesc,
      canonical,
      jsonLd,
      jsonLdId: `product-jsonld-${product.id}`,
    });
  }, [product]);

  const hasLinks = /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i.test(commentText);

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    if (hasLinks) return;
    if (!isSignedIn) {
      playSound('click', soundEnabled);
      onOpenSignIn?.();
      return;
    }
    const authorName = userName || userEmail?.split('@')[0] || 'User';
    playSound('click', soundEnabled);
    onAddComment(product.id, commentText.trim(), authorName, userEmail, userAvatar);
    setCommentText('');
  };

  const handleToggleCommentLike = (commentId: string) => {
    playSound('click', soundEnabled);
    setLikedComments((prev) => {
      const isCurrentlyLiked = Boolean(prev[commentId]);
      setCommentUpvotes((curr) => ({
        ...curr,
        [commentId]: Math.max(0, (curr[commentId] || 0) + (isCurrentlyLiked ? -1 : 1)),
      }));
      return {
        ...prev,
        [commentId]: !isCurrentlyLiked,
      };
    });
  };

  const handleReplyTo = (author: string) => {
    playSound('click', soundEnabled);
    setCommentText((prev) => (prev ? `${prev.trim()} @${author} ` : `@${author} `));
    commentInputRef.current?.focus();
  };

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

  // Media gallery (demo video + screenshots unified horizontally)
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const videoData = useMemo(() => getVideoEmbedUrl(product.demoVideoUrl), [product.demoVideoUrl]);
  const screenshots = product.screenshots || [];
  const totalMediaCount = (videoData ? 1 : 0) + screenshots.length;

  const updateScrollState = () => {
    if (!galleryRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const itemWidth = clientWidth * 0.85;
    if (itemWidth > 0) {
      const idx = Math.round(scrollLeft / itemWidth);
      setActiveMediaIndex(Math.max(0, Math.min(idx, totalMediaCount - 1)));
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = galleryRef.current;
    if (el) {
      el.addEventListener('scroll', updateScrollState, { passive: true });
      window.addEventListener('resize', updateScrollState);
      return () => {
        el.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [totalMediaCount]);

  const handleScrollMedia = (direction: 'left' | 'right') => {
    playSound('click', soundEnabled);
    if (!galleryRef.current) return;
    const container = galleryRef.current;
    const scrollAmount = container.clientWidth * 0.85;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollToMediaIndex = (index: number) => {
    playSound('click', soundEnabled);
    if (!galleryRef.current) return;
    const container = galleryRef.current;
    const items = container.querySelectorAll<HTMLElement>('[data-media-item]');
    if (items[index]) {
      items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setActiveMediaIndex(index);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/40 text-neutral-900 flex flex-col font-sans pb-12 sm:pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-3.5 py-2.5 sm:px-6 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 font-bold text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2 text-neutral-400 text-[11px] truncate">
            <span className="hidden sm:inline">Directory</span>
            <span className="hidden sm:inline">/</span>
            <span className="text-neutral-600 font-semibold">{product.category}</span>
            <span>/</span>
            <span className="text-neutral-900 font-bold truncate max-w-[140px] sm:max-w-xs">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Main Page Content - Side-by-Side 2-Column Grid starting from the top */}
      <main className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Main Product Details & Discussion (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6 min-w-0">
            {/* Header Hero Section */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-7 shadow-xs space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-5">
                {/* Logo and titles */}
                <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                  <ProductLogo
                    src={product.logoUrl}
                    alt={product.name}
                    containerClassName="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs flex items-center justify-center"
                    iconClassName="h-8 w-8 text-neutral-500 shrink-0"
                  />

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

                    <p className="text-xs sm:text-base font-medium text-neutral-500 max-w-2xl leading-relaxed">
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
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0">
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
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <span className="font-mono-num font-black text-sm">{comments.length.toLocaleString()}</span>
                  </button>

                  <a
                    href={formatOutboundUrl(product.url, { campaign: 'product_page' })}
                    target="_blank"
                    rel="noopener"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      trackOutboundClick(product.id, product.url, product.name, onTrackClick);
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
                        href={formatOutboundUrl(product.offerUrl || product.url, { campaign: 'product_deal' })}
                        target="_blank"
                        rel="noopener"
                        onClick={() => {
                          playSound('click', soundEnabled);
                          trackOutboundClick(product.id, product.offerUrl || product.url, product.name, onTrackClick);
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
            </div>

            {/* Product Media Gallery: Demo Video and Screenshots on the SAME horizontal line */}
            {totalMediaCount > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" />
                    <h2 className="text-lg sm:text-xl font-bold text-neutral-950">
                      Product Preview & Demo
                    </h2>
                  </div>
                </div>

                {/* Horizontal Scroll Track with Floating Arrow Buttons */}
                <div className="relative group/gallery">
                  {/* Floating Prev Arrow */}
                  {totalMediaCount > 1 && canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => handleScrollMedia('left')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 border border-neutral-200 text-neutral-800 shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      aria-label="Previous preview"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}

                  {/* Floating Next Arrow */}
                  {totalMediaCount > 1 && canScrollRight && (
                    <button
                      type="button"
                      onClick={() => handleScrollMedia('right')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 border border-neutral-200 text-neutral-800 shadow-xl hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      aria-label="Next preview"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}

                  {/* Horizontal Scroll Track */}
                  <div
                    ref={galleryRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar pb-1 pt-0.5"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {/* 1. Demo Video (if available, first in horizontal line) */}
                    {videoData && (
                      <div
                        data-media-item
                        className={`${
                          totalMediaCount === 1
                            ? 'w-full'
                            : 'w-[88%] sm:w-[90%] md:w-[640px]'
                        } shrink-0 snap-center aspect-video rounded-2xl border border-neutral-200 bg-black overflow-hidden relative shadow-sm`}
                      >
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
                            poster={screenshots[0]}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                        {videoData.type === 'link' && (
                          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-white bg-neutral-900">
                            <Play className="h-10 w-10 text-mint-500" />
                            <p className="text-sm text-neutral-300">Watch the product demo video:</p>
                            <a
                              href={videoData.embedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4 fill-current" />
                              Watch on external site
                            </a>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/20">
                            <Video className="h-3 w-3 text-blue-400" />
                            Demo Video
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 2. Screenshots (on the same horizontal line) */}
                    {screenshots.map((src, i) => (
                      <div
                        key={i}
                        data-media-item
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setLightboxIndex(i);
                        }}
                        className={`${
                          totalMediaCount === 1
                            ? 'w-full'
                            : 'w-[88%] sm:w-[90%] md:w-[640px]'
                        } shrink-0 snap-center aspect-video rounded-2xl border border-neutral-200 bg-neutral-100 overflow-hidden relative shadow-sm cursor-pointer group`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            playSound('click', soundEnabled);
                            setLightboxIndex(i);
                          }
                        }}
                        aria-label={`View screenshot ${i + 1}`}
                      >
                        <img
                          src={src}
                          alt={`${product.name} screenshot ${i + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 bg-white/95 text-neutral-900 rounded-xl px-3.5 py-2 text-xs font-bold shadow-lg border border-neutral-200 flex items-center gap-1.5">
                            <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                            <span>Click to expand</span>
                          </div>
                        </div>
                        <div className="absolute top-3 left-3 pointer-events-none">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/10">
                            <span>Screenshot {i + 1}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Thumbnails / Slide Dots below if multiple items */}
                {totalMediaCount > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {Array.from({ length: totalMediaCount }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => scrollToMediaIndex(idx)}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          activeMediaIndex === idx
                            ? 'w-6 bg-blue-600'
                            : 'w-2 bg-neutral-200 hover:bg-neutral-300'
                        }`}
                        aria-label={`Go to item ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* About & Executive Overview */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
              <div className="border-b border-neutral-200 pb-3">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-950">
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
                    <h2 className="text-lg sm:text-xl font-bold text-neutral-950">
                      What {product.name} does
                    </h2>
                  </div>

                  <div className="divide-y divide-neutral-200">
                    {sections.map((section, idx) => (
                      <div
                        key={section.title}
                        className={`${idx > 0 ? 'pt-5' : ''} ${idx < sections.length - 1 ? 'pb-5' : ''} space-y-1.5`}
                      >
                        <div className="mb-1.5">
                          <h3 className="text-base sm:text-lg font-bold text-neutral-950">
                            {section.title}
                          </h3>
                        </div>
                        <RichText
                          html={section.content}
                          className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal"
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
                  <h2 className="text-lg sm:text-xl font-bold text-neutral-950">
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

            {/* Discussion & Comments (Modern Card-Based Discussion matching reference) */}
            <div id="product-discussion-section" className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-7 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-950">
                  Discussion
                </h2>
                <span className="text-xs sm:text-sm font-medium text-neutral-500">
                  {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                </span>
              </div>

              {/* Composer Box (Clean Modern Card matching screenshot) */}
              <div className="rounded-xl border border-neutral-200/90 bg-white p-4 sm:p-5 space-y-3.5">
                {/* User Info Header: Avatar + Name + Verified Badge + Email */}
                <div className="flex items-center gap-3">
                  <CommentAvatar
                    avatarUrl={userAvatar}
                    name={userName || userEmail?.split('@')[0] || (isSignedIn ? 'User' : 'Guest')}
                    className="h-10 w-10 shrink-0 rounded-full object-cover border border-neutral-200 shadow-2xs"
                    fallbackClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00897b] text-base font-bold text-white shadow-2xs select-none"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-neutral-900 truncate">
                        {isSignedIn ? (userName || userEmail?.split('@')[0] || 'User') : 'Guest User'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">
                      {isSignedIn ? (userEmail || '') : 'Sign in to join the conversation'}
                    </p>
                  </div>
                </div>

                {/* Textarea container */}
                <div className="rounded-xl border border-neutral-200 bg-white p-3.5 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        if (commentText.trim() && !hasLinks) {
                          handlePostComment();
                        }
                      }
                    }}
                    onClick={() => {
                      if (!isSignedIn) {
                        playSound('click', soundEnabled);
                        onOpenSignIn?.();
                      }
                    }}
                    placeholder={`Ask a question or leave a comment about ${product.name}...`}
                    rows={3}
                    maxLength={2000}
                    className="w-full bg-transparent border-0 p-0 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-0 resize-none min-h-[64px] leading-relaxed"
                  />
                </div>

                {/* Bottom Row: Counter & Post Comment Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-medium text-neutral-400">
                    {commentText.length}/2000
                  </span>

                  <button
                    type="button"
                    onClick={handlePostComment}
                    disabled={!commentText.trim() || hasLinks}
                    className={`rounded-xl px-6 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-2xs ${
                      commentText.trim() && !hasLinks
                        ? 'bg-[#8faefa] hover:bg-blue-500 text-white cursor-pointer active:scale-95'
                        : 'bg-[#b8cbfb]/70 text-white cursor-not-allowed'
                    }`}
                  >
                    Post comment
                  </button>
                </div>

                {hasLinks && (
                  <p className="text-[11px] text-rose-500 font-medium">
                    ⚠️ Links aren't allowed in comments.
                  </p>
                )}
              </div>

              {/* Comments List: Each comment in its own clean card */}
              <div className="space-y-3 pt-1">
                {comments.length === 0 ? (
                  <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/50 p-8 text-center">
                    <p className="text-sm font-bold text-neutral-700">No comments yet</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      Be the first to ask a question or leave feedback about {product.name}!
                    </p>
                  </div>
                ) : (
                  [...comments]
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((c) => {
                      const isMaker = Boolean(
                        (product.creatorName && c.userName && c.userName.toLowerCase() === product.creatorName.toLowerCase()) ||
                        (product.creatorUsername && c.userName && c.userName.toLowerCase() === product.creatorUsername.toLowerCase())
                      );
                      const displayBody = c.content.replace(/^\[[1-5]★ Review\]\s*/i, '');
                      const isLiked = Boolean(likedComments[c.id]);
                      const upvotes = (commentUpvotes[c.id] || 0) + (isLiked ? 1 : 0);

                      return (
                        <div
                          key={c.id}
                          className="rounded-xl border border-neutral-200/90 bg-white p-4 sm:p-5 transition-all hover:border-neutral-300"
                        >
                          <div className="flex items-start gap-3">
                            <CommentAvatar
                              avatarUrl={c.userAvatar}
                              name={c.userName}
                              className="h-10 w-10 shrink-0 rounded-full object-cover border border-neutral-200 shadow-2xs"
                              fallbackClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00897b] text-base font-bold text-white shadow-2xs select-none"
                            />
                            <div className="min-w-0 flex-1 space-y-1.5">
                              {/* Header: Name + Timestamp + Maker badge */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-neutral-900">
                                  {c.userName}
                                </span>
                                {isMaker && (
                                  <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    Maker
                                  </span>
                                )}
                                <span className="text-xs text-neutral-400 font-normal">
                                  {timeAgo(c.createdAt)}
                                </span>
                              </div>

                              {/* Comment Content */}
                              <p className="text-sm text-neutral-700 leading-relaxed break-words whitespace-pre-wrap font-normal">
                                {displayBody}
                              </p>

                              {/* Actions: Helpful & Reply */}
                              <div className="flex items-center gap-4 pt-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCommentLike(c.id)}
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                    isLiked ? 'text-rose-600 font-bold' : 'text-neutral-400 hover:text-neutral-700'
                                  }`}
                                >
                                  <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-rose-600 text-rose-600' : 'text-neutral-400'}`} />
                                  <span>{upvotes > 0 ? upvotes : 'Helpful'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleReplyTo(c.userName)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
                                >
                                  <CornerDownRight className="h-3.5 w-3.5" />
                                  <span>Reply</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
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
          </div>

          {/* RIGHT COLUMN: Sidebar (lg:col-span-4) - Starts from top with Sponsored first */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-6 lg:sticky lg:top-20 self-start">
            {/* 1. Sponsored Partners Sidebar (⚡ Sponsors placed at the very top) */}
            <SponsoredPartnersSidebar
              sponsors={sponsors && sponsors.length > 0 ? sponsors : allProducts.filter((p) => p.isSponsored)}
              currentProductId={product.id}
              soundEnabled={soundEnabled}
              onSelectProduct={onSelectProduct}
              onTrackClick={onTrackClick}
              onOpenFeaturedSpotModal={onOpenFeaturedSpotModal}
            />

            {/* 2. Quick Specs & Highlights (Website Specifications placed above meet founder) */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3.5">
              <h2 className="text-sm sm:text-base font-bold text-neutral-950 border-b border-neutral-100 pb-2.5">
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
                  <div className="pt-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500 font-medium block mb-0.5">Target Audience</span>
                    <span className="font-semibold text-neutral-800 text-[11px] block">{product.targetAudience}</span>
                  </div>
                )}

                {product.keyHighlights && product.keyHighlights.map((kh, idx) => (
                  <div key={idx} className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                    <span className="text-neutral-500 font-medium">{kh.label}</span>
                    <span className="font-bold text-neutral-900">{kh.value}</span>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1 border-t border-neutral-200/60">
                  <span className="text-neutral-500 font-medium">Official Link</span>
                  <a
                    href={formatOutboundUrl(product.url, { campaign: 'product_sidebar_overview' })}
                    target="_blank"
                    rel="noopener"
                    onClick={() => trackOutboundClick(product.id, product.url, product.name, onTrackClick)}
                    className="font-bold text-blue-600 underline flex items-center gap-1 hover:text-blue-700 transition-colors"
                  >
                    <span>Visit</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {product.socials && product.socials.length > 0 && (
                  <div className="pt-2.5 border-t border-neutral-200/60 space-y-2">
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

            {/* 3. Founder / Maker Spotlight Card */}
            {(product.creatorName || product.creatorAvatar || product.creatorXHandle) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-950">
                      Meet the founder
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <CommentAvatar
                    avatarUrl={product.creatorAvatar}
                    name={product.creatorName || 'Founder'}
                    className="h-12 w-12 shrink-0 rounded-full object-cover border border-neutral-200 bg-neutral-100 shadow-2xs"
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
                  <div className="pt-2 border-t border-neutral-100">
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

            {/* 4. Quick Access Shortcuts */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
              <h3 className="text-sm sm:text-base font-black text-neutral-950 border-b border-neutral-100 pb-2.5">
                Quick Access
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onBack();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <Compass className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Live Directory</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onBack();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>This Week's Launches</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    onBack();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-blue-600 transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Trending Now</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                </button>
              </div>
            </div>

          </div>
        </div>
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
