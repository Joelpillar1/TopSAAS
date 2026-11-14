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
  Users,
  CheckCircle2,
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
  AlertCircle,
  Zap,
  ShieldCheck,
  Wallet,
  Link2,
  SlidersHorizontal,
  Info,
  RotateCw,
  Rocket,
  Loader2,
  Clock,
  BarChart3,
  Lock,
  MousePointerClick,
  Award,
  Download,
} from 'lucide-react';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { RichText } from './RichText';
import { VerifiedBadge } from './VerifiedBadge';
import { SponsoredPartnersSidebar } from './SponsoredPartnersSidebar';
import { timeAgo } from './ProductRow';
import { applyPageSeo } from '../utils/pageSeo';
import { formatOutboundUrl, trackOutboundClick } from '../utils/referral';
import { redirectToCheckout } from '../utils/whop';
import { getWeekInfo, getWeekByNumber, formatWeekDateRange, isInWeek } from '../utils/weeks';
import { getProductSlug } from '../utils/slug';

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

function parsePersonas(text?: string): string[] {
  if (!text) return [];
  const cleaned = text
    .replace(/^(specially crafted for|crafted for|ideal for|built for|designed for|for)\s+/i, '')
    .replace(/\.$/, '')
    .trim();
  const rawParts = cleaned.split(/,\s*(?:and\s+)?|;\s*|\s+and\s+/i);
  return rawParts
    .map((p) => p.trim())
    .filter((p) => p.length > 1 && p.length < 60)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
}

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

interface AnalyticsPoint {
  dateLabel: string;
  value: number;
}

interface AnalyticsChartCardProps {
  title: string;
  unitSingular: string;
  unitPlural: string;
  total: number;
  yMax: number;
  series: AnalyticsPoint[];
  rangeStartLabel: string;
  rangeEndLabel: string;
  emptyMessage: string;
  dotClassName: string;
  barClassName: string;
  barActiveClassName: string;
  baselineClassName: string;
}

/** Interactive bar chart card with crosshair highlight, live header readout, and floating tooltip */
const AnalyticsChartCard: React.FC<AnalyticsChartCardProps> = ({
  title,
  unitSingular,
  unitPlural,
  total,
  yMax,
  series,
  rangeStartLabel,
  rangeEndLabel,
  emptyMessage,
  dotClassName,
  barClassName,
  barActiveClassName,
  baselineClassName,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : null;
  const ticks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${dotClassName}`} />
          <span className="text-sm font-bold text-neutral-950">{title}</span>
        </div>
        <span className="text-xs font-mono-num text-neutral-500 transition-colors">
          {activePoint
            ? `${activePoint.dateLabel} · ${activePoint.value.toLocaleString()}`
            : `${total.toLocaleString()} total`}
        </span>
      </div>

      <div className="relative flex gap-3 h-44">
        {/* Y-axis */}
        <div className="flex flex-col justify-between text-[10px] font-mono-num text-neutral-400 pb-5 select-none">
          {ticks.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>

        {/* Plot Area */}
        <div
          className="relative flex-1 flex flex-col justify-end"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Subtle horizontal gridlines */}
          <div className="pointer-events-none absolute inset-0 bottom-5 flex flex-col justify-between">
            {ticks.slice(0, 4).map((_, i) => (
              <div key={i} className="w-full border-t border-dashed border-neutral-100" />
            ))}
            <div />
          </div>

          {total === 0 && hoveredIdx === null && (
            <div className="absolute inset-0 bottom-5 flex items-center justify-center pointer-events-none z-10">
              <span className="text-xs text-neutral-400 text-center px-3">
                {emptyMessage}
              </span>
            </div>
          )}

          {/* Interactive Bars */}
          <div className="relative z-10 flex items-end gap-1 h-full pb-1 border-b border-neutral-200/70">
            {series.map((pt, idx) => {
              const isHovered = hoveredIdx === idx;
              const pct = pt.value > 0 ? Math.max(8, Math.round((pt.value / yMax) * 100)) : 0;
              const tooltipAlign =
                idx <= 1
                  ? 'left-0'
                  : idx >= series.length - 2
                  ? 'right-0'
                  : 'left-1/2 -translate-x-1/2';

              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-label={`${pt.dateLabel}: ${pt.value} ${pt.value === 1 ? unitSingular : unitPlural}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onFocus={() => setHoveredIdx(idx)}
                  onBlur={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx((prev) => (prev === idx ? null : idx))}
                  className={`relative flex-1 h-full flex items-end cursor-crosshair rounded-t-md transition-colors outline-none ${
                    isHovered ? 'bg-neutral-100/70' : ''
                  }`}
                >
                  {isHovered && (
                    <div
                      className={`pointer-events-none absolute -top-8 ${tooltipAlign} z-30 whitespace-nowrap rounded-lg bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg`}
                    >
                      <span className="text-neutral-300">{pt.dateLabel}</span>
                      <span className="mx-1 text-neutral-500">·</span>
                      <span className="font-mono-num font-bold">
                        {pt.value.toLocaleString()} {pt.value === 1 ? unitSingular : unitPlural}
                      </span>
                    </div>
                  )}

                  <div
                    className={`w-full rounded-t-sm transition-all duration-150 ${
                      pt.value > 0
                        ? isHovered
                          ? barActiveClassName
                          : barClassName
                        : isHovered
                        ? `h-[4px] ${barActiveClassName}`
                        : `h-[2px] ${baselineClassName}`
                    }`}
                    style={pt.value > 0 ? { height: `${pct}%` } : undefined}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-1.5 text-[10px] font-mono-num text-neutral-400">
            <span>{rangeStartLabel}</span>
            <span>{rangeEndLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AnalyticsLockOverlayProps {
  badgeLabel: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
}

/** Minimal blurred-card lock overlay matching the reference design */
const AnalyticsLockOverlay: React.FC<AnalyticsLockOverlayProps> = ({
  badgeLabel,
  description,
  actionLabel,
  onAction,
}) => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-white/45 backdrop-blur-[1.5px]">
    <span className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-600 shadow-2xs">
      <Lock className="h-3 w-3 text-neutral-500" />
      <span>{badgeLabel}</span>
    </span>
    {description && (
      <p className="mt-2.5 max-w-xs text-xs font-medium text-neutral-600 leading-relaxed">
        {description}
      </p>
    )}
    <button
      type="button"
      onClick={onAction}
      className="mt-2 text-xs font-bold text-neutral-950 hover:underline cursor-pointer"
    >
      {actionLabel}
    </button>
  </div>
);

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
  userId?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  onOpenSignIn?: () => void;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onShare: (product: Product) => void;
  onTrackClick: (productId: string, url: string) => void;
  onAddComment: (productId: string, content: string, userName: string, userEmail?: string, userAvatar?: string) => void;
  onUpvote?: (product: Product) => void;
  isUpvoted?: boolean;
  onOpenFeaturedSpotModal?: () => void;
  hasPaidAccess?: boolean;
  onOpenPricing?: () => void;
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
  userId,
  isOwner: isOwnerProp,
  isAdmin = false,
  onOpenSignIn,
  onBack,
  onSelectProduct,
  onShare,
  onTrackClick,
  onAddComment,
  onUpvote,
  isUpvoted = false,
  onOpenFeaturedSpotModal,
  hasPaidAccess = false,
  onOpenPricing,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  const [analyticsRange, setAnalyticsRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [commentText, setCommentText] = useState('');
  const [commentUpvotes, setCommentUpvotes] = useState<Record<string, number>>({});
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copiedOffer, setCopiedOffer] = useState(false);

  // Owner verification: only the owner of this product sees the relaunch control
  const isOwner = Boolean(
    isOwnerProp ||
    product.isUserOwned ||
    (userId && product.submittedBy === userId) ||
    (userEmail && product.submittedBy && product.submittedBy.toLowerCase() === userEmail.toLowerCase())
  );
  const canSeeAnalyticsTab = Boolean(isOwner || isAdmin);

  // Launch Week Window: rounds reset Sunday 23:59:59 / Monday 00:00.
  // The relaunch prompt activates as we approach another launch week (Friday 00:00 through Sunday 23:59:59 - last 72h).
  const currentWeek = useMemo(() => getWeekInfo(Date.now()), []);
  const nowMs = Date.now();
  const isRelaunchWindow = nowMs >= currentWeek.end - 3 * 86400000;
  const msUntilNextRound = Math.max(0, currentWeek.end - nowMs);
  const daysUntilNextRound = Math.max(1, Math.ceil(msUntilNextRound / 86400000));
  const nextWeekNumber = currentWeek.weekNumber + 1;

  // Did this product launch in the current active calendar week?
  const isLaunchedInCurrentRound = useMemo(() => {
    if (product.scheduledLaunchWeek != null) {
      return Number(product.scheduledLaunchWeek) === currentWeek.weekNumber;
    }
    if (product.createdAt && isInWeek(product.createdAt, currentWeek)) return true;
    if (product.lastRelaunchedAt && isInWeek(product.lastRelaunchedAt, currentWeek)) return true;
    return false;
  }, [product.scheduledLaunchWeek, product.createdAt, product.lastRelaunchedAt, currentWeek]);

  // Natural timing flow:
  // Only shows when it's approaching another launch week (Friday 00:00 through Sunday 23:59:59 - last 72h),
  // OR when the product is from an older week and inactive, OR when already auto-relaunching.
  const shouldShowRelaunchBanner = isOwner && (
    product.autoRelaunch ||
    !isLaunchedInCurrentRound ||
    isRelaunchWindow
  );

  useEffect(() => {
    setActiveTab('overview');
  }, [product.id]);

  const analyticsData = useMemo(() => {
    const upvotes = product.upvotes ?? 0;
    const clicks = product.clicks ?? 0;
    const commentCount = comments.length;
    const totalDirectory = Math.max(1, allProducts.length);

    const sortedAll = [...allProducts].sort((a, b) => {
      const upDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
      if (upDiff !== 0) return upDiff;
      return (b.clicks ?? 0) - (a.clicks ?? 0);
    });
    const foundAllIdx = sortedAll.findIndex((p) => p.id === product.id);
    const allTimeRank = foundAllIdx >= 0 ? foundAllIdx + 1 : (product.rank || totalDirectory);
    const topPercentile = Math.max(1, Math.round((allTimeRank / totalDirectory) * 100));

    const primaryCat = (product.category || '').split(',')[0].trim().toLowerCase();
    const categoryPeers = primaryCat
      ? allProducts.filter((p) => (p.category || '').toLowerCase().includes(primaryCat))
      : allProducts;
    const totalInCategory = Math.max(1, categoryPeers.length);
    const sortedCat = [...categoryPeers].sort((a, b) => {
      const upDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
      if (upDiff !== 0) return upDiff;
      return (b.clicks ?? 0) - (a.clicks ?? 0);
    });
    const foundCatIdx = sortedCat.findIndex((p) => p.id === product.id);
    const categoryRank = foundCatIdx >= 0 ? foundCatIdx + 1 : 1;

    const avgCatUpvotes = Math.round(
      categoryPeers.reduce((sum, p) => sum + (p.upvotes ?? 0), 0) / totalInCategory
    );
    const avgCatClicks = Math.round(
      categoryPeers.reduce((sum, p) => sum + (p.clicks ?? 0), 0) / totalInCategory
    );

    const launchWeek = product.scheduledLaunchWeek
      ? getWeekByNumber(product.scheduledLaunchWeek)
      : getWeekInfo(product.createdAt);
    const launchWeekRange = formatWeekDateRange(launchWeek, '–');

    const totalEngagement = upvotes + clicks + commentCount;

    const rangeDays = analyticsRange === '7d' ? 7 : analyticsRange === '90d' ? 90 : 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (rangeDays - 1) * 86400000);
    const fmtAxisDate = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const rangeStartLabel = fmtAxisDate(startDate);
    const rangeEndLabel = fmtAxisDate(endDate);

    // Deterministic daily distribution from launch date to today for visual trend bars
    const barCount = analyticsRange === '7d' ? 7 : analyticsRange === '90d' ? 24 : 20;
    const span = Math.max(1, endDate.getTime() - startDate.getTime());
    const buildSeries = (total: number): AnalyticsPoint[] => {
      const pointDates = Array.from({ length: barCount }, (_, i) => {
        const ts = startDate.getTime() + (barCount > 1 ? (i / (barCount - 1)) * span : 0);
        return fmtAxisDate(new Date(ts));
      });
      if (total <= 0) {
        return pointDates.map((dateLabel) => ({ dateLabel, value: 0 }));
      }
      const launchStart = Math.max(startDate.getTime(), product.createdAt || startDate.getTime());
      const activeStartIdx = Math.min(
        barCount - 1,
        Math.max(0, Math.floor(((launchStart - startDate.getTime()) / span) * barCount))
      );
      const activeBars = Math.max(1, barCount - activeStartIdx);
      const values = Array(barCount).fill(0);
      // Put a realistic launch-day peak and steady tail summing to exact `total`
      let remaining = total;
      for (let i = activeStartIdx; i < barCount; i++) {
        const isLast = i === barCount - 1;
        if (isLast) {
          values[i] = remaining;
        } else {
          const weight = i === activeStartIdx ? 0.38 : 0.62 / Math.max(1, activeBars - 1);
          const val = Math.min(remaining, Math.max(0, Math.round(total * weight)));
          values[i] = val;
          remaining -= val;
        }
      }
      return pointDates.map((dateLabel, i) => ({ dateLabel, value: values[i] }));
    };

    const upvoteSeries = buildSeries(upvotes);
    const clickSeries = buildSeries(clicks);
    const upvoteYMax = Math.max(4, ...upvoteSeries.map((pt) => pt.value));
    const clickYMax = Math.max(4, ...clickSeries.map((pt) => pt.value));

    const pctDiff = (val: number, avg: number) =>
      avg > 0 ? Math.round(((val - avg) / avg) * 100) : val > 0 ? 100 : 0;
    const upvoteDeltaPct = pctDiff(upvotes, avgCatUpvotes);
    const clickDeltaPct = pctDiff(clicks, avgCatClicks);

    // Gap to Top 3 or #1 in category
    let gapTargetRank = 1;
    let gapUpvotesNeeded = 0;
    if (categoryRank > 3 && sortedCat.length >= 3) {
      gapTargetRank = 3;
      gapUpvotesNeeded = Math.max(1, ((sortedCat[2]?.upvotes ?? 0) - upvotes) + 1);
    } else if (categoryRank > 1 && sortedCat.length >= 1) {
      gapTargetRank = 1;
      gapUpvotesNeeded = Math.max(1, ((sortedCat[0]?.upvotes ?? 0) - upvotes) + 1);
    }

    const rankDelta = product.previousRank ? product.previousRank - allTimeRank : 0;
    const clicksPerUpvote = upvotes > 0 ? Number((clicks / upvotes).toFixed(1)) : clicks;

    const healthChecklist = [
      { label: 'Brand Logo', done: Boolean(product.logoUrl) },
      { label: 'Screenshots', done: Boolean(product.screenshots && product.screenshots.length > 0) },
      { label: 'Demo Video', done: Boolean(product.demoVideoUrl) },
      {
        label: 'Promo Deal',
        done: Boolean(product.offerDiscount || product.offerCode || product.offerDetails),
      },
      { label: 'Full Description', done: Boolean(product.description && product.description.trim().length >= 40) },
    ];
    const healthScore = healthChecklist.filter((item) => item.done).length;

    return {
      upvotes,
      clicks,
      commentCount,
      totalEngagement,
      allTimeRank,
      totalDirectory,
      topPercentile,
      categoryRank,
      totalInCategory,
      avgCatUpvotes,
      avgCatClicks,
      launchWeek,
      launchWeekRange,
      rangeStartLabel,
      rangeEndLabel,
      upvoteSeries,
      clickSeries,
      upvoteYMax,
      clickYMax,
      upvoteDeltaPct,
      clickDeltaPct,
      gapTargetRank,
      gapUpvotesNeeded,
      rankDelta,
      clicksPerUpvote,
      healthChecklist,
      healthScore,
    };
  }, [product, allProducts, comments.length, analyticsRange]);

  const handleExportAnalyticsCsv = () => {
    playSound('click', soundEnabled);
    const rows = [
      ['Metric', 'Value'],
      ['Product', product.name],
      ['Category', product.category],
      ['Launch Round', `${analyticsData.launchWeek.label} (${analyticsData.launchWeekRange})`],
      ['Upvotes', String(analyticsData.upvotes)],
      ['Outbound Clicks', String(analyticsData.clicks)],
      ['Comments', String(analyticsData.commentCount)],
      ['Clicks per Upvote', String(analyticsData.clicksPerUpvote)],
      ['All-Time Rank', `#${analyticsData.allTimeRank} of ${analyticsData.totalDirectory} (Top ${analyticsData.topPercentile}%)`],
      ['Category Rank', `#${analyticsData.categoryRank} of ${analyticsData.totalInCategory}`],
      ['Category Avg Upvotes', String(analyticsData.avgCatUpvotes)],
      ['Category Avg Clicks', String(analyticsData.avgCatClicks)],
      ['Listing Health', `${analyticsData.healthScore}/${analyticsData.healthChecklist.length}`],
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getProductSlug(product)}-topsaas-analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [isRelaunchModalOpen, setIsRelaunchModalOpen] = useState(false);
  const [isStartingRelaunch, setIsStartingRelaunch] = useState(false);
  const [relaunchEmail, setRelaunchEmail] = useState(userEmail || '');

  // Keep relaunch email in sync if userEmail loads
  useEffect(() => {
    if (userEmail && !relaunchEmail) {
      setRelaunchEmail(userEmail);
    }
  }, [userEmail]);

  const handleStartRelaunchCheckout = async () => {
    setIsStartingRelaunch(true);
    playSound('click', soundEnabled);
    try {
      await redirectToCheckout({
        planType: 'weekly_relaunch',
        productName: product.name,
        targetProductId: product.id,
        customerEmail: relaunchEmail.trim() || userEmail || undefined,
      });
    } catch (err) {
      console.error('Relaunch checkout error:', err);
      const returnUrl = encodeURIComponent(
        `${window.location.origin}/payment-success?plan=weekly_relaunch&product=${encodeURIComponent(product.name)}&target_product_id=${encodeURIComponent(product.id)}`
      );
      const email = relaunchEmail.trim() || userEmail || '';
      const emailParam = email ? `&email=${encodeURIComponent(email)}` : '';
      window.location.href = `https://whop.com/checkout/plan_81SmEHd2w16EG?redirect_url=${returnUrl}${emailParam}`;
    }
  };

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

    const canonical = `https://www.topsaas.space/products/${getProductSlug(product)}`;

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
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-neutral-900 px-2 py-0.5 text-xs font-bold tracking-tight text-white shadow-xs select-none">
                          <VerifiedBadge variant="gold" className="h-3.5 w-3.5 shrink-0" />
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

                    {/* Built By Founder Hero Badge (from Step 3: Founder) */}
                    {(product.creatorName || product.creatorAvatar) && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-neutral-200 pl-1 pr-2 py-1 text-xs shadow-2xs">
                          <CommentAvatar
                            avatarUrl={product.creatorAvatar}
                            name={product.creatorName || 'Founder'}
                            className="h-5 w-5 shrink-0 rounded-full object-cover border border-neutral-200"
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

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onShare(product);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-xs font-bold text-neutral-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 transition-all cursor-pointer min-h-[44px] sm:min-h-[38px]"
                    title="Share & download social banner"
                  >
                    <Share2 className="h-4 w-4 text-blue-600" />
                    <span className="hidden sm:inline">Share</span>
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

            {/* Product Details Tabs: Overview & Analytics (visible only to owner or admin) */}
            {canSeeAnalyticsTab && (
              <div className="flex items-center gap-1.5 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-2xs w-fit" role="tablist" aria-label="Product sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'overview'}
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab('overview');
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'analytics'}
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveTab('analytics');
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/80'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
                {!hasPaidAccess && (
                  <Lock className={`h-3.5 w-3.5 ${activeTab === 'analytics' ? 'text-neutral-300' : 'text-neutral-400'}`} />
                )}
              </button>
              </div>
            )}

            {(!canSeeAnalyticsTab || activeTab === 'overview') && (
              <>
            {/* Founder Relaunch Banner (Owner only — shown when approaching next week or inactive) */}
            {shouldShowRelaunchBanner && (
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-white p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-blue-950">Founder Control</span>
                        <span className="rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                          Product Owner
                        </span>
                        {product.autoRelaunch ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                            <Check className="h-3 w-3" /> Auto-Relaunch Active ($5/wk)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            <Clock className="h-3 w-3" /> Round closes in {daysUntilNextRound === 1 ? '< 24h' : `${daysUntilNextRound} days`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {product.autoRelaunch
                          ? `Your product is all set to automatically relaunch this Sunday at midnight into Week ${nextWeekNumber} with reset upvotes and fresh podium contention.`
                          : `Week ${currentWeek.weekNumber} is wrapping up! Queue ${product.name} for Week ${nextWeekNumber} ($5) to start Monday morning with fresh voting power and get seen by potential users.`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setIsRelaunchModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-xs font-black shadow-xs shadow-blue-600/25 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>
                      {product.autoRelaunch
                        ? 'Manage Relaunch'
                        : `Queue for Week ${nextWeekNumber} ($5)`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Product Media Gallery: Demo Video and Screenshots (from Step 1 of /submit) */}
            {totalMediaCount > 0 && (
              <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-5 w-5 text-neutral-900 shrink-0" />
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

            {/* 1. About Section (from Step 0 of /submit: Description) */}
            {(() => {
              const isBoilerplateDesc = (desc?: string | null): boolean => {
                if (!desc) return true;
                const trimmed = desc.trim();
                if (!trimmed) return true;
                if (/is a high-quality product in the .* ecosystem/i.test(trimmed)) return true;
                return false;
              };

              const cleanTagline = (product.tagline || '').trim().replace(/\.+$/, '');
              const cleanAudience = (product.targetAudience || '').trim().replace(/\.+$/, '');
              const displayDescription = isBoilerplateDesc(product.description) ? null : product.description;

              const richAboutFallback = (
                <div className="space-y-3.5 text-sm sm:text-base leading-relaxed text-neutral-700 font-normal">
                  <p>
                    <strong className="font-bold text-neutral-950">{product.name}</strong>
                    {cleanTagline ? ` — ${cleanTagline}.` : ` is a specialized SaaS platform designed for the ${product.category} ecosystem.`}
                  </p>
                  <p>
                    {cleanAudience
                      ? `Specially crafted for ${cleanAudience}, ${product.name} streamlines day-to-day operations, removes repetitive manual overhead, and accelerates team velocity with intuitive modern tooling.`
                      : `Engineered for modern builders, teams, and creators, ${product.name} simplifies complex workflows in the ${product.category} domain by providing high-reliability features and a polished user experience.`}
                  </p>
                  <p>
                    From initial setup to continuous daily usage, {product.name} focuses on delivering measurable performance, reliability, and immediate value right out of the box.
                  </p>
                </div>
              );

              return (
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                        About {product.name}
                      </h2>
                      <p className="text-xs text-neutral-500 font-normal">
                        Overview and background of the product
                      </p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <RichText
                      html={displayDescription}
                      className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal"
                      fallback={richAboutFallback}
                    />
                  </div>

                  {product.featuredQuote && (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 flex items-start gap-3">
                      <MessageSquareQuote className="h-5 w-5 text-mint-600 shrink-0 mt-0.5" />
                      <div className="text-xs font-semibold text-neutral-700 italic">
                        "{product.featuredQuote}"
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* 2. Problem Section (from Step 2 of /submit: Problem it solves) */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                    Problem It Solves
                  </h2>
                  <p className="text-xs text-neutral-500 font-normal">
                    The core challenges and pain points {product.name} addresses
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <RichText
                  html={product.problemItSolves}
                  className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal"
                  fallback={
                    <p className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal">
                      {`${product.name} addresses friction, fragmentation, and repetitive operational overhead encountered by teams and builders in the ${product.category} space.`}
                    </p>
                  }
                />
              </div>
            </div>

            {/* 3. Solution Section (from Step 2 of /submit: Your solution) */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                    The Solution
                  </h2>
                  <p className="text-xs text-neutral-500 font-normal">
                    How {product.name} solves this problem
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <RichText
                  html={product.solution}
                  className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal"
                  fallback={
                    <p className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal">
                      {`By unifying intuitive tooling with seamless performance, ${product.name} enables users to execute faster, automate tedious steps, and deliver superior results.`}
                    </p>
                  }
                />
              </div>
            </div>

            {/* 4. Why Different Section (from Step 2 of /submit: What makes it different) */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                    Why {product.name} is Different
                  </h2>
                  <p className="text-xs text-neutral-500 font-normal">
                    Key differentiators and competitive advantage
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <RichText
                  html={product.uniqueSellingPoint}
                  className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal"
                  fallback={
                    <p className="text-sm sm:text-base leading-relaxed text-neutral-700 font-normal">
                      {`Built with a focus on simplicity, modern architecture, and speed, ${product.name} provides a distinctive edge over conventional and fragmented alternatives.`}
                    </p>
                  }
                />
              </div>
            </div>

            {/* 5. Target Audience Section (if provided in Step 2) */}
            {product.targetAudience && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                      Target Audience
                    </h2>
                    <p className="text-xs text-neutral-500 font-normal">
                      Who {product.name} is designed for
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
                    {product.targetAudience}
                  </p>
                  {parsePersonas(product.targetAudience).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {parsePersonas(product.targetAudience).map((persona) => (
                        <span
                          key={persona}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-2xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{persona}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Real-World Use Cases (if custom use cases were provided) */}
            {product.useCases && product.useCases.length > 0 && product.useCases.some((uc) => uc.description && uc.description !== product.targetAudience && !uc.description.includes(product.targetAudience || '___')) && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-neutral-100 pb-3.5">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-950">
                    Who uses it and real-world use cases
                  </h2>
                  <p className="text-xs text-neutral-500 font-normal">
                    Who {product.name} is designed for and how teams leverage it
                  </p>
                </div>

                <div className="space-y-3">
                  {product.useCases.map((uc, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-4 sm:p-5 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-neutral-950">
                          {uc.title}
                        </h3>
                        {uc.audience && (
                          <span className="text-[11px] font-semibold text-neutral-700 bg-white border border-neutral-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                            {uc.audience}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
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
              </>
            )}

            {canSeeAnalyticsTab && activeTab === 'analytics' && (() => {
              const lockBadge = isOwner ? 'PAID PLAN' : 'OWNER ONLY';
              const lockActionLabel = isOwner
                ? 'Unlock on Paid Plan'
                : !isSignedIn
                ? 'Sign in as owner'
                : 'Owner & Paid Plan only';
              const handleLockAction = () => {
                playSound('click', soundEnabled);
                if (isOwner) {
                  if (onOpenPricing) {
                    onOpenPricing();
                  } else {
                    window.location.href = '/pricing';
                  }
                } else if (!isSignedIn && onOpenSignIn) {
                  onOpenSignIn();
                } else if (onOpenPricing) {
                  onOpenPricing();
                }
              };

              const blurredClass = hasPaidAccess
                ? ''
                : 'blur-[5px] select-none pointer-events-none opacity-65';

              return (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 sm:p-6 shadow-xs space-y-5">
                {/* Header Row: Eyebrow + Title + 7d/30d/90d Range Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div>
                    <span className="block text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.14em] text-mint-600">
                      Launch Analytics
                    </span>
                    <h2 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-neutral-950">
                      Launch performance &amp; engagement
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-neutral-500">
                      Verified clicks, upvotes, and rankings.
                    </p>
                  </div>

                  <div className="inline-flex items-center rounded-xl border border-neutral-200/80 bg-neutral-100 p-1 self-start sm:self-auto shrink-0" role="group" aria-label="Analytics time range">
                    {(['7d', '30d', '90d'] as const).map((range) => (
                      <button
                        key={range}
                        type="button"
                        disabled={!hasPaidAccess}
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setAnalyticsRange(range);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                          !hasPaidAccess
                            ? 'cursor-not-allowed text-neutral-400'
                            : analyticsRange === range
                            ? 'bg-white text-neutral-950 shadow-2xs cursor-pointer'
                            : 'text-neutral-500 hover:text-neutral-800 cursor-pointer'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Metrics & Interactive Charts (Locked per-section for non-owners or free listings) */}
                <div className="relative rounded-2xl overflow-hidden">
                  <div className={`space-y-4 ${blurredClass}`}>
                    {/* Top 3 Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-2xs">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint-50 border border-mint-200/70 text-mint-600">
                          <ChevronUp className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-black font-mono-num leading-none text-neutral-950">
                            {hasPaidAccess ? analyticsData.upvotes.toLocaleString() : '0'}
                          </p>
                          <p className="mt-1 text-xs font-bold text-neutral-600">Upvotes</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-2xs">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-black font-mono-num leading-none text-neutral-950">
                            {hasPaidAccess ? analyticsData.commentCount.toLocaleString() : '0'}
                          </p>
                          <p className="mt-1 text-xs font-bold text-neutral-600">Comments</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-2xs">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/70 text-blue-600">
                          <MousePointerClick className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-black font-mono-num leading-none text-neutral-950">
                            {hasPaidAccess ? analyticsData.clicks.toLocaleString() : '0'}
                          </p>
                          <p className="mt-1 text-xs font-bold text-neutral-600">Clicks</p>
                        </div>
                      </div>
                    </div>

                    {/* Two Side-by-Side Interactive Trend Chart Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AnalyticsChartCard
                        title="Upvotes"
                        unitSingular="upvote"
                        unitPlural="upvotes"
                        total={hasPaidAccess ? analyticsData.upvotes : 0}
                        yMax={hasPaidAccess ? analyticsData.upvoteYMax : 4}
                        series={hasPaidAccess ? analyticsData.upvoteSeries : analyticsData.upvoteSeries.map((pt) => ({ ...pt, value: 0 }))}
                        rangeStartLabel={analyticsData.rangeStartLabel}
                        rangeEndLabel={analyticsData.rangeEndLabel}
                        emptyMessage="No upvotes yet. It launches when it launches."
                        dotClassName="bg-mint-500"
                        barClassName="bg-mint-500/80"
                        barActiveClassName="bg-mint-600"
                        baselineClassName="bg-mint-500/45"
                      />

                      <AnalyticsChartCard
                        title="Clicks"
                        unitSingular="click"
                        unitPlural="clicks"
                        total={hasPaidAccess ? analyticsData.clicks : 0}
                        yMax={hasPaidAccess ? analyticsData.clickYMax : 4}
                        series={hasPaidAccess ? analyticsData.clickSeries : analyticsData.clickSeries.map((pt) => ({ ...pt, value: 0 }))}
                        rangeStartLabel={analyticsData.rangeStartLabel}
                        rangeEndLabel={analyticsData.rangeEndLabel}
                        emptyMessage="Nobody has clicked through yet."
                        dotClassName="bg-blue-600"
                        barClassName="bg-blue-600/80"
                        barActiveClassName="bg-blue-700"
                        baselineClassName="bg-blue-500/45"
                      />
                    </div>
                  </div>

                  {!hasPaidAccess && (
                    <AnalyticsLockOverlay
                      badgeLabel={lockBadge}
                      description={
                        isOwner
                          ? 'See upvotes, outbound clicks, and daily trends on any paid plan (Sponsored, Featured, Relaunch, or One-Time).'
                          : 'Analytics are private to the product owner on a paid plan.'
                      }
                      actionLabel={lockActionLabel}
                      onAction={handleLockAction}
                    />
                  )}
                </div>

                {/* Subtle Directory Rank & Launch Strip */}
                {hasPaidAccess && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white px-4 py-2.5 text-xs text-neutral-600">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-800">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        <span>All-Time #{analyticsData.allTimeRank}</span>
                        <span className="text-neutral-400 font-normal">(Top {analyticsData.topPercentile}%)</span>
                      </span>
                      <span className="text-neutral-300">·</span>
                      <span className="font-medium">
                        #{analyticsData.categoryRank} of {analyticsData.totalInCategory} in {product.category}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{analyticsData.launchWeek.label} ({analyticsData.launchWeekRange})</span>
                    </span>
                  </div>
                )}

                {/* Tier 1 Paid Insights: Category Benchmark, Momentum & Listing Health */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Category Benchmark & Gap to Top 3 */}
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-2xs overflow-hidden">
                    <div className={`space-y-4 ${blurredClass}`}>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-950">Category Benchmark</h3>
                        <p className="mt-0.5 text-xs font-medium text-neutral-500">
                          {product.category}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-600">
                              Upvotes vs. avg ({hasPaidAccess ? analyticsData.avgCatUpvotes : '—'})
                            </span>
                            <span className={`font-mono-num font-bold ${analyticsData.upvoteDeltaPct >= 0 ? 'text-mint-600' : 'text-neutral-600'}`}>
                              {hasPaidAccess
                                ? (analyticsData.upvoteDeltaPct >= 0 ? `+${analyticsData.upvoteDeltaPct}%` : `${analyticsData.upvoteDeltaPct}%`)
                                : '—'}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-mint-500 transition-all"
                              style={{
                                width: hasPaidAccess
                                  ? `${Math.min(100, Math.max(4, Math.round((analyticsData.upvotes / Math.max(1, analyticsData.upvotes, analyticsData.avgCatUpvotes)) * 100)))}%`
                                  : '45%',
                              }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-neutral-600">
                              Clicks vs. avg ({hasPaidAccess ? analyticsData.avgCatClicks : '—'})
                            </span>
                            <span className={`font-mono-num font-bold ${analyticsData.clickDeltaPct >= 0 ? 'text-blue-600' : 'text-neutral-600'}`}>
                              {hasPaidAccess
                                ? (analyticsData.clickDeltaPct >= 0 ? `+${analyticsData.clickDeltaPct}%` : `${analyticsData.clickDeltaPct}%`)
                                : '—'}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-600 transition-all"
                              style={{
                                width: hasPaidAccess
                                  ? `${Math.min(100, Math.max(4, Math.round((analyticsData.clicks / Math.max(1, analyticsData.clicks, analyticsData.avgCatClicks)) * 100)))}%`
                                  : '35%',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-neutral-50 border border-neutral-200/70 px-3.5 py-2.5 text-xs space-y-0.5">
                        <span className="block font-medium text-neutral-500">Next milestone</span>
                        <p className="font-bold text-neutral-950 leading-snug">
                          {hasPaidAccess
                            ? (analyticsData.gapUpvotesNeeded === 0
                                ? `#1 in ${product.category}`
                                : `${analyticsData.gapUpvotesNeeded} ${analyticsData.gapUpvotesNeeded === 1 ? 'upvote' : 'upvotes'} to Top ${analyticsData.gapTargetRank}`)
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {!hasPaidAccess && (
                      <AnalyticsLockOverlay
                        badgeLabel={lockBadge}
                        actionLabel={lockActionLabel}
                        onAction={handleLockAction}
                      />
                    )}
                  </div>

                  {/* 2. Momentum, Conversion & Listing Health */}
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-2xs overflow-hidden">
                    <div className={`space-y-4 flex flex-col justify-between h-full ${blurredClass}`}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3">
                          <span className="text-[11px] font-semibold text-neutral-500">Rank Momentum</span>
                          <p className={`mt-1 text-base font-black font-mono-num ${
                            analyticsData.rankDelta > 0
                              ? 'text-mint-600'
                              : analyticsData.rankDelta < 0
                              ? 'text-rose-600'
                              : 'text-neutral-900'
                          }`}>
                            {hasPaidAccess
                              ? (analyticsData.rankDelta > 0
                                  ? `▲ ${analyticsData.rankDelta} ${analyticsData.rankDelta === 1 ? 'spot' : 'spots'}`
                                  : analyticsData.rankDelta < 0
                                  ? `▼ ${Math.abs(analyticsData.rankDelta)} ${Math.abs(analyticsData.rankDelta) === 1 ? 'spot' : 'spots'}`
                                  : 'Steady')
                              : '—'}
                          </p>
                        </div>

                        <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3">
                          <span className="text-[11px] font-semibold text-neutral-500">Clicks / Upvote</span>
                          <p className="mt-1 text-base font-black font-mono-num text-neutral-950">
                            {hasPaidAccess ? `${analyticsData.clicksPerUpvote}x` : '—'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-neutral-900">Listing Health</span>
                          <span className="font-mono-num font-bold text-neutral-600">
                            {hasPaidAccess ? `${analyticsData.healthScore}/${analyticsData.healthChecklist.length} complete` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {analyticsData.healthChecklist.map((item) => (
                            <span
                              key={item.label}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                item.done
                                  ? 'border-mint-200 bg-mint-50 text-mint-700'
                                  : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                              }`}
                            >
                              {item.done ? (
                                <CheckCircle2 className="h-3 w-3 text-mint-600" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-neutral-400" />
                              )}
                              <span>{item.label}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={handleExportAnalyticsCsv}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-950 transition-colors cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {!hasPaidAccess && (
                      <AnalyticsLockOverlay
                        badgeLabel={lockBadge}
                        actionLabel={lockActionLabel}
                        onAction={handleLockAction}
                      />
                    )}
                  </div>
                </div>
              </div>
              );
            })()}
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

            {/* 2. Quick Specs & Highlights (Website Specifications) */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3.5">
              <h2 className="flex items-center gap-2 text-sm sm:text-base font-bold text-neutral-950 border-b border-neutral-100 pb-2.5">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-neutral-400" />
                Website specifications
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                    <Tag className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    Category
                  </span>
                  <span className="font-bold text-neutral-900 text-right">{product.category}</span>
                </div>

                {product.pricingModel && (
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200/60">
                    <span className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                      <Wallet className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      Pricing Model
                    </span>
                    <span className="font-bold text-neutral-900 text-right truncate max-w-[180px]">{product.pricingModel}</span>
                  </div>
                )}

                {product.targetAudience && (
                  <div className="flex items-start justify-between gap-3 pt-1 border-t border-neutral-200/60">
                    <span className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                      <Users className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      Target Audience
                    </span>
                    <span className="font-bold text-neutral-900 text-right">{product.targetAudience}</span>
                  </div>
                )}

                {product.keyHighlights && product.keyHighlights.map((kh, idx) => {
                  const key = kh.label.toLowerCase();
                  const Icon = key.includes('submitted')
                    ? UserIcon
                    : key.includes('status')
                      ? CheckCircle2
                      : Info;
                  return (
                    <div key={idx} className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200/60">
                      <span className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                        {kh.label}
                      </span>
                      <span className="font-bold text-neutral-900 text-right">{kh.value}</span>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-neutral-200/60">
                  <span className="flex items-center gap-1.5 text-neutral-500 font-medium shrink-0">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    Official Link
                  </span>
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

                {(product.twitterHandle || (product.socials && product.socials.length > 0)) && (
                  <div className="pt-2.5 border-t border-neutral-200/60 space-y-2">
                    <span className="text-neutral-500 font-medium block text-[11px]">Social & Distribution</span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.twitterHandle && !product.socials?.some((s) => s.platform === 'x') && (
                        <a
                          href={`https://x.com/${product.twitterHandle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700 hover:border-gray-300 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                        >
                          <span>X</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                      {product.socials?.map((s, idx) => {
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

            {/* 3. Founder / Maker Spotlight Card (from Step 3 of /submit) */}
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

      {/* Relaunch Modal (Owner only) */}
      {isOwner && isRelaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-950">Auto Weekly Relaunch</h3>
                  <p className="text-xs text-neutral-500">{product.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRelaunchModalOpen(false)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-blue-950">Weekly Relaunch Plan</span>
                <span className="text-lg font-black text-blue-600 font-mono-num">$5 <span className="text-xs font-semibold text-neutral-500">/ week</span></span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Every Sunday at 00:00 UTC, {product.name} is automatically relaunched into the active voting round.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-neutral-700">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Fresh weekly voting:</strong> Upvotes reset every round, giving you 52 high-traffic chances per year to rank #1.</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-700">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Directory boost:</strong> Tagged with VIP Auto-Relaunch active on the live directory.</span>
              </div>
              <div className="flex items-start gap-2 text-neutral-700">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Cancel anytime:</strong> Manage or cancel with 1 click anytime directly in your customer portal.</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-neutral-700 block">
                Billing Email
              </label>
              <input
                type="email"
                value={relaunchEmail}
                onChange={(e) => setRelaunchEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-xs font-medium text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRelaunchModalOpen(false)}
                className="w-1/3 rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isStartingRelaunch}
                onClick={handleStartRelaunchCheckout}
                className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-2.5 text-xs font-black text-white shadow-xs shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-60"
              >
                {isStartingRelaunch ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Redirecting…</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-3.5 w-3.5" />
                    <span>Relaunch with $5 weekly</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-center text-neutral-400">
              Secured by Whop · Merchant of Record · Cancel anytime
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
