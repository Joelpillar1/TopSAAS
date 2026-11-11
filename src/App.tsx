import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { User } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_SUBMISSIONS } from './data/initialSubmissions';
import { Category, Product, WebsiteSubmission, Comment, SubmitProductDetails, Sponsor, SponsorDraft } from './types';
import { HeroClaimBanner } from './components/HeroClaimBanner';
import { BorderBeam } from './components/BorderBeam';
import { HomeHero } from './components/HomeHero';
import { HowItWorksModal } from './components/HowItWorksModal';
import { ShareModal } from './components/ShareModal';
import { Pagination } from './components/Pagination';
import { RichFooter } from './components/RichFooter';
import { Header, DirectoryTab } from './components/Header';
import { SignInModal } from './components/SignInModal';
import { LegalTab } from './components/LegalModal';
import { playSound } from './utils/sound';
import confetti from 'canvas-confetti';
import { supabase } from './utils/supabase';
import { loadProducts, loadProductById, loadSubmissions, invalidateCache, saveAllProducts, saveProductRanksDirect, debouncedSyncProducts, toggleUpvote, getUserUpvotes, getUpvoteStats, checkIsAdmin, getGlobalFeaturedProduct, setGlobalFeaturedProduct, setGlobalFeaturedProducts, setProductFeaturedPosition, LOCAL_FEATURED_PRODUCTS_KEY, LOCAL_FEATURED_POSITIONS_MAP_KEY, insertProductDirect, updateProductDirect, fetchComments, addComment, getCachedCommentsSync, submissionToProduct, publishedProductId, isProductUpvoted, getGuestUpvotes, saveGuestUpvotes, incrementProductUpvotesDirect, incrementProductClicksDirect, loadSponsors, createSponsor, updateSponsor, endSponsor, endSponsorsForProduct, toggleSponsorPause, incrementSponsorClicks, sponsorToDisplayProduct, isLiveSponsor, getSponsorRailsEnabled, setSponsorRailsEnabled, LOCAL_SPONSOR_RAILS_KEY, getFeaturedPosition, setFeaturedPosition, LOCAL_FEATURED_POSITION_KEY, SUBMISSION_QUEUE_COLUMNS, loadSubmissionById, isSponsorOnlyProduct, getProductSlug, matchesProductIdentifier } from './utils/db';
import { trackGoal } from './utils/trackkit';
import { isInWeek, getWeekInfo, getWeekNumber, getWeekByNumber, getMonthKey, isInMonth, formatMonthLabel, formatWeekDateRange, WeekInfo } from './utils/weeks';
import { getWebsiteFavicon } from './utils/logo';
import { uploadScreenshotToStorage } from './utils/storage';
import { Trophy, X, Plus, ShieldCheck, Loader2, Star, MessageCircle, Flame, Search } from 'lucide-react';
import { FeaturedSpotModal } from './components/FeaturedSpotModal';
import { ProductPage } from './components/ProductPage';
import { BadgeRoute } from './components/BadgeRoute';

// Lazy-load secondary pages to keep the homepage bundle ultra-lightweight
const AdminAcceptPage = React.lazy(() => import('./components/AdminAcceptPage').then((m) => ({ default: m.AdminAcceptPage })));
const ProfilePage = React.lazy(() => import('./components/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const PaymentSuccess = React.lazy(() => import('./components/PaymentSuccess').then((m) => ({ default: m.PaymentSuccess })));
const SubmitPage = React.lazy(() => import('./components/SubmitPage').then((m) => ({ default: m.SubmitPage })));
const SaaSIdeas = React.lazy(() => import('./components/SaaSIdeas').then((m) => ({ default: m.SaaSIdeas })));
const TrendingPage = React.lazy(() => import('./components/TrendingPage').then((m) => ({ default: m.TrendingPage })));
const GuidesListPage = React.lazy(() => import('./components/GuidesListPage').then((m) => ({ default: m.GuidesListPage })));
const GuideDetailPage = React.lazy(() => import('./components/GuideDetailPage').then((m) => ({ default: m.GuideDetailPage })));
const MrrCalculatorPage = React.lazy(() => import('./components/MrrCalculatorPage').then((m) => ({ default: m.MrrCalculatorPage })));
const LegalPage = React.lazy(() => import('./components/LegalPage').then((m) => ({ default: m.LegalPage })));
const PricingPage = React.lazy(() => import('./components/PricingPage').then((m) => ({ default: m.PricingPage })));
const RepoDetailPage = React.lazy(() => import('./components/RepoDetailPage').then((m) => ({ default: m.RepoDetailPage })));
import type { CuratedRepo } from './data/curatedRepos';
import { ProductRow, timeAgo } from './components/ProductRow';
import { SponsorTile } from './components/SponsorTile';
import { HeroSponsorRails, MobileTopSponsorTicker, MobileBottomStickySponsorTicker } from './components/HeroSponsorRails';
import { WeeklyLaunchView } from './components/WeeklyLaunchView';
import { BestOfSection } from './components/BestOfSection';
import { ProductLogo } from './components/ProductLogo';
import { SkeletonRows, SkeletonGrid, SkeletonTile } from './components/SkeletonCard';
import { SkeletonTable } from './components/SkeletonTable';
import { SkeletonProductPage } from './components/SkeletonProductPage';
import { AdminLoginGate } from './components/AdminLoginGate';
import { isAdminSessionActive, clearAdminSession } from './utils/adminAuth';

// Map a Supabase DB row to our WebsiteSubmission type
const mapDbSubmission = (row: Record<string, unknown>): WebsiteSubmission => ({
  id: row.id as string,
  name: row.name as string,
  tagline: row.tagline as string,
  url: row.url as string,
  logoUrl: (row.logo_url as string) || undefined,
  screenshots: (row.screenshots as string[]) || undefined,
  demoVideoUrl: (row.demo_video_url as string) || undefined,
  twitterHandle: (row.twitter_handle as string) || undefined,
  socials: (row.socials as WebsiteSubmission['socials']) || undefined,
  creatorName: (row.creator_name as string) || undefined,
  creatorUsername: (row.creator_username as string) || undefined,
  creatorXHandle: (row.creator_x_handle as string) || undefined,
  creatorAvatar: (row.creator_avatar as string) || undefined,
  creatorRole: (row.creator_role as string) || undefined,
  category: row.category as Category,
  backerName: (row.backer_name as string) || 'Creator',
  backerEmail: (row.backer_email as string) || undefined,
  status: (row.status as WebsiteSubmission['status']) || 'under_review',
  submittedAt: typeof row.submitted_at === 'number' ? row.submitted_at : Number(row.submitted_at) || Date.now(),
  reviewedAt: typeof row.reviewed_at === 'number' ? row.reviewed_at : (row.reviewed_at ? Number(row.reviewed_at) : undefined),
  rejectionReason: (row.rejection_reason as string) || undefined,
  targetAudience: (row.target_audience as string) || undefined,
  pricingModel: (row.pricing_model as string) || undefined,
  submittedBy: (row.submitted_by as string) || undefined,
  offerDiscount: (row.offer_discount as string) || undefined,
  offerCode: (row.offer_code as string) || undefined,
  offerUrl: (row.offer_url as string) || undefined,
  offerDetails: (row.offer_details as string) || undefined,
  description: (row.description as string) || undefined,
  problemItSolves: (row.problem_it_solves as string) || undefined,
  solution: (row.solution as string) || undefined,
  uniqueSellingPoint: (row.unique_selling_point as string) || undefined,
  autoRelaunch: Boolean(row.auto_relaunch ?? row.autoRelaunch) || undefined,
  autoRelaunchPaid: Boolean(row.auto_relaunch_paid ?? row.autoRelaunchPaid) || undefined,
  autoRelaunchPaidAt: (row.auto_relaunch_paid_at as number) || undefined,
  verified: Boolean(row.verified) || false,
  scheduledLaunchWeek: (row.scheduled_launch_week as number) || (row.scheduledLaunchWeek as number) || undefined,
  scheduledLaunchDate: (row.scheduled_launch_date as number) || (row.scheduledLaunchDate as number) || undefined,
  relaunchWeeks: (row.relaunch_weeks as number[]) || (row.relaunchWeeks as number[]) || undefined,
  isRelaunched: Boolean(row.is_relaunched ?? row.isRelaunched) || undefined,
  lastRelaunchedAt: (row.last_relaunched_at as number) || (row.lastRelaunchedAt as number) || undefined,
});

// Map a WebsiteSubmission to Supabase insert/update format
const toDbSubmission = (sub: WebsiteSubmission) => {
  const isUuid = sub.submittedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub.submittedBy);
  return {
    id: sub.id,
    name: sub.name,
    tagline: sub.tagline,
    url: sub.url,
    logo_url: sub.logoUrl || null,
    screenshots: sub.screenshots || null,
    demo_video_url: sub.demoVideoUrl || null,
    twitter_handle: sub.twitterHandle || null,
    socials: sub.socials || null,
    creator_name: sub.creatorName || null,
    creator_username: sub.creatorUsername || null,
    creator_x_handle: sub.creatorXHandle || null,
    creator_avatar: sub.creatorAvatar || null,
    creator_role: sub.creatorRole || null,
    category: sub.category,
    backer_name: sub.backerName || 'Creator',
    backer_email: sub.backerEmail || null,
    status: sub.status || 'under_review',
    submitted_at: sub.submittedAt || Date.now(),
    reviewed_at: sub.reviewedAt || null,
    rejection_reason: sub.rejectionReason || null,
    target_audience: sub.targetAudience || null,
    pricing_model: sub.pricingModel || null,
    submitted_by: isUuid ? sub.submittedBy : null,
    offer_discount: sub.offerDiscount || null,
    offer_code: sub.offerCode || null,
    offer_url: sub.offerUrl || null,
    offer_details: sub.offerDetails || null,
    description: sub.description || null,
    problem_it_solves: sub.problemItSolves || null,
    solution: sub.solution || null,
    unique_selling_point: sub.uniqueSellingPoint || null,
    auto_relaunch: sub.autoRelaunch || false,
    auto_relaunch_paid: sub.autoRelaunchPaid || false,
    auto_relaunch_paid_at: sub.autoRelaunchPaidAt || null,
    verified: sub.verified || false,
    scheduled_launch_week: sub.scheduledLaunchWeek || null,
    scheduled_launch_date: sub.scheduledLaunchDate || null,
    relaunch_weeks: sub.relaunchWeeks || null,
    is_relaunched: sub.isRelaunched || false,
    last_relaunched_at: sub.lastRelaunchedAt || null,
  };
};

let idCounter = 0;
const generateUniqueId = (prefix: string = 'id') => {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
};

interface FeedEvent {
  id: string;
  productId: string;
  name: string;
  kind: 'visit' | 'listing';
  time: number;
}

const STORAGE_KEYS = {
  PRODUCTS: 'directory_free_products_v5',
  SOUND: 'directory_sound_enabled',
  SUBMISSIONS: 'directory_pending_submissions_v1',
  DELETED_SUBMISSIONS: 'directory_deleted_submissions_v1',
  VIEW_LAYOUT: 'directory_view_layout',
};

/** Load the set of submission IDs that were explicitly deleted via the UI */
function getDeletedSubmissionIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_SUBMISSIONS);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch { }
  return new Set();
}

/** Record a submission ID as permanently deleted so the merge won't re-add it */
function markSubmissionDeleted(id: string) {
  try {
    const deleted = getDeletedSubmissionIds();
    deleted.add(id);
    deleted.add(id.toLowerCase().replace(/\/$/, ''));
    localStorage.setItem(STORAGE_KEYS.DELETED_SUBMISSIONS, JSON.stringify([...deleted]));
  } catch { }
}

/** Clear deleted state when a submission is created or resubmitted */
function unmarkSubmissionDeleted(idOrUrl: string) {
  try {
    const deleted = getDeletedSubmissionIds();
    const key = idOrUrl.toLowerCase().replace(/\/$/, '');
    let changed = false;
    if (deleted.has(idOrUrl)) {
      deleted.delete(idOrUrl);
      changed = true;
    }
    if (deleted.has(key)) {
      deleted.delete(key);
      changed = true;
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.DELETED_SUBMISSIONS, JSON.stringify([...deleted]));
    }
  } catch { }
}

export default function App() {
  // Navigation / Route state (/ vs /accept)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (/^\/repo\//.test(path)) {
        return 'repo';
      }
      if (/^\/product\//.test(path)) {
        return 'product';
      }
      if (/^\/guides\//.test(path)) {
        return 'guide';
      }
      if (path === '/trending' || hash === '#trending' || hash === '#/trending') {
        return 'trending';
      }
      if (path === '/guides' || hash === '#guides' || hash === '#/guides') {
        return 'guides';
      }
      if (/^\/badge\//.test(path)) {
        return 'badge';
      }
      if (path === '/accept' || hash === '#accept' || hash === '#/accept') {
        return '/accept';
      }
      if (path === '/payment-success' || path === '/payment/success' || hash === '#payment-success' || hash === '#/payment-success') {
        return '/payment-success';
      }
      if (path === '/profile' || hash === '#profile' || hash === '#/profile') {
        return '/profile';
      }
      if (path === '/submit' || hash === '#submit' || hash === '#/submit') {
        return '/submit';
      }
      if (path === '/ideas' || hash === '#ideas' || hash === '#/ideas') {
        return '/ideas';
      }
      if (path === '/pricing' || hash === '#pricing' || hash === '#/pricing') {
        return '/pricing';
      }
      if (path === '/mrr-calculator' || hash === '#mrr-calculator' || hash === '#/mrr-calculator') {
        return '/mrr-calculator';
      }
      if (path === '/privacy' || hash === '#privacy' || hash === '#/privacy') {
        return '/privacy';
      }
      if (path === '/terms' || hash === '#terms' || hash === '#/terms') {
        return '/terms';
      }
    }
    return '/';
  });



  // Submissions queue (Pending Approval / Approved / Rejected)
  const [submissions, setSubmissions] = useState<WebsiteSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy dummy/sample items
          return parsed.filter(
            (s) =>
              s &&
              s.id &&
              !['midjourney.com', 'ollama.com', 'resend.com', 'ollama.ai'].some((d) => s.url?.toLowerCase().includes(d))
          );
        }
      }
    } catch { }
    return INITIAL_SUBMISSIONS;
  });
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);

  // Load submissions from cache / Supabase on mount
  useEffect(() => {
    async function loadSubs() {
      try {
        const dbSubs = await loadSubmissions();
        if (dbSubs && dbSubs.length > 0) {
          setSubmissions(dbSubs);
          try {
            localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(dbSubs));
          } catch { }
        }
      } catch { }
      setSubmissionsLoaded(true);
    }
    loadSubs();
  }, []);

  // Load persisted live products (sorted by rank)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS) || localStorage.getItem('topsaas_products_cache_v2');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            // Legacy sponsor-only rows are migrated into the sponsors table.
            .filter((p) => !isSponsorOnlyProduct(p) && !p.id.startsWith('spn_'))
            .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))
            .map((p, idx) => {
              const initial = INITIAL_PRODUCTS.find((init) => init.id === p.id);
              const resolvedLogo = initial?.logoUrl || (!p.logoUrl || p.logoUrl.includes('unsplash.com') ? getWebsiteFavicon(p.url) : p.logoUrl);
              return {
                ...(initial || {}),
                ...p,
                rank: idx + 1,
                logoUrl: resolvedLogo,
              };
            });
        }
      }
    } catch { }

    // First-time visitor: instant paint from build-time initial products seed
    return INITIAL_PRODUCTS;
  });

  // Sponsors (paid + trial placements) live in their own table and are never
  // mixed into the products directory.
  const [sponsors, setSponsors] = useState<Sponsor[]>(() => {
    try {
      const saved = localStorage.getItem('topsaas_sponsors_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return [];
  });

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminSessionUnlocked, setAdminSessionUnlocked] = useState<boolean>(() => isAdminSessionActive());
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('topsaas_user_upvotes');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const set = new Set<string>();
          for (const id of arr) {
            if (typeof id === 'string') {
              set.add(id);
              if (id.startsWith('prod-')) set.add(id.replace(/^prod-/, ''));
              else set.add(`prod-${id}`);
            }
          }
          return set;
        }
      }
    } catch { }
    return new Set();
  });

  const updateUserUpvotes = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setUserUpvotes((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('topsaas_user_upvotes', JSON.stringify(Array.from(next)));
      } catch { }
      return next;
    });
  }, []);
  // Initialize loaded immediately if we have cached or seed products (instant paint in 0ms)
  const [productsLoaded, setProductsLoaded] = useState<boolean>(() => products.length > 0);

  // Sync loaded state whenever products populate
  useEffect(() => {
    if (products.length > 0 && !productsLoaded) {
      setProductsLoaded(true);
    }
  }, [products.length, productsLoaded]);

  // Featured products (admin can set multiple products as featured, or user paid for it)
  const [featuredProductIds, setFeaturedProductIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_FEATURED_PRODUCTS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
      }
      const single = localStorage.getItem('topsaas_featured_product');
      if (single && single !== 'default' && single !== 'empty') {
        return [single];
      }
    } catch { }
    return [];
  });

  // Per-product position map: { [productId]: positionNumber } (0 = top, N = after rank N)
  const [featuredPositions, setFeaturedPositions] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_FEATURED_POSITIONS_MAP_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch { }
    return {};
  });

  const [featuredExpiresAt, setFeaturedExpiresAt] = useState<number | null>(() => {
    try {
      const raw = localStorage.getItem('topsaas_featured_expiry');
      return raw ? parseInt(raw, 10) : null;
    } catch {
      return null;
    }
  });

  const [featuredProductId, setFeaturedProductId] = useState<string | null>(() => {
    try {
      const id = localStorage.getItem('topsaas_featured_product');
      if (!id) return null;
      const expiry = localStorage.getItem('topsaas_featured_expiry');
      if (expiry && Date.now() > Number(expiry)) {
        // Featured spot has expired — clear it
        localStorage.removeItem('topsaas_featured_product');
        localStorage.removeItem('topsaas_featured_expiry');
        return null;
      }
      return id;
    } catch { return null; }
  });

  // Featured product position in the directory listing (0 = top/above #1, N = after rank N)
  const [featuredPosition, setFeaturedPositionState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_FEATURED_POSITION_KEY);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
      return 0;
    } catch {
      return 0;
    }
  });

  // Load global featured product & position from Supabase on mount and check periodically
  useEffect(() => {
    const syncFeatured = () => {
      getGlobalFeaturedProduct().then((config) => {
        if (config.productIds !== undefined) setFeaturedProductIds(config.productIds);
        if (config.positions !== undefined) setFeaturedPositions(config.positions);
        if (config.productId !== undefined) setFeaturedProductId(config.productId);
        if (config.position !== undefined) setFeaturedPositionState(config.position);
        if (config.expiresAt !== undefined) setFeaturedExpiresAt(config.expiresAt);
      });
    };

    syncFeatured();

    // Check periodically only when the tab is actively visible to eliminate background egress
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      syncFeatured();
    }, 180_000); // 3 minutes

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncFeatured();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleSetProductFeaturedPosition = async (productId: string, pos: number) => {
    const updated = { ...featuredPositions, [productId]: Math.max(0, pos) };
    setFeaturedPositions(updated);
    playSound('click', soundEnabled);
    await setProductFeaturedPosition(productId, pos);
  };

  const handleSetFeaturedPosition = async (pos: number) => {
    setFeaturedPositionState(pos);
    await setFeaturedPosition(pos);
  };

  // Master toggle for homepage side sponsor rails (persisted via site_settings and localStorage)
  const [sponsorRailsEnabled, setSponsorRailsEnabledState] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SPONSOR_RAILS_KEY);
      if (raw !== null) return raw === 'true';
    } catch { }
    return false; // Default OFF so it never flashes open ad spots when disabled
  });

  // Load master sponsor rails state from Supabase on mount
  useEffect(() => {
    getSponsorRailsEnabled().then((enabled) => {
      setSponsorRailsEnabledState(enabled);
    });
  }, []);

  const handleToggleSponsorRails = async (enabled: boolean) => {
    setSponsorRailsEnabledState(enabled);
    await setSponsorRailsEnabled(enabled);
  };

  // Submitter name auto-filled from Google profile
  const submitterName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  // Global / UI Audio SFX toggle (under the game: OFF by default, independent)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('topsaas_ui_sound');
      if (saved !== null) return saved === 'true';
    } catch { }
    return false; // OFF by default as requested
  });

  // Active tab: derived from currentRoute so /ideas and /pricing survive reload.
  const activeTab: DirectoryTab =
    currentRoute === '/ideas'
      ? 'saas-ideas'
      : currentRoute === '/mrr-calculator'
        ? 'mrr-calculator'
        : currentRoute === '/pricing'
          ? 'pricing'
          : 'directory';

  // View layout — single-column row list (the bento grid was retired)
  // Search and Category filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  // One-Click Deals filter state ("Steals Only")
  const [stealsOnly, setStealsOnly] = useState<boolean>(false);

  // Pagination state for homepage (50 list per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);

  // Modals
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isFeaturedSpotModalOpen, setIsFeaturedSpotModalOpen] = useState(false);
  const [featuredModalMode, setFeaturedModalMode] = useState<'featured' | 'sponsor'>('featured');
  const [featuredInitialTier, setFeaturedInitialTier] = useState<'1wk' | '1mo' | '3mo' | '1yr' | 'trial'>('1mo');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');

  // Live activity feed shown in the directory side rails
  const [liveFeed, setLiveFeed] = useState<FeedEvent[]>([]);
  const lastClickFeedRef = React.useRef<Record<string, number>>({});

  // Weekly launch board state: selected week (defaults to current calendar week)
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo | null>(() => getWeekInfo(Date.now()));

  // Upvotes earned per launch week (derived from upvotes.created_at)
  const [weeklyUpvotes, setWeeklyUpvotes] = useState<Record<number, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem('topsaas_weekly_upvotes_cache');
      if (saved) return JSON.parse(saved);
    } catch { }
    return {};
  });
  // Upvotes earned per calendar month (derived from upvotes.created_at)
  const [monthlyUpvotes, setMonthlyUpvotes] = useState<Record<string, Record<string, number>>>(() => {
    try {
      const saved = localStorage.getItem('topsaas_monthly_upvotes_cache');
      if (saved) return JSON.parse(saved);
    } catch { }
    return {};
  });

  // Comments (discussion threads on product detail pages)
  const [comments, setComments] = useState<Comment[]>(() => {
    return getCachedCommentsSync();
  });
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(() => {
    const cached = getCachedCommentsSync();
    const counts: Record<string, number> = {};
    for (const c of cached) {
      counts[c.productId] = (counts[c.productId] ?? 0) + 1;
    }
    return counts;
  });

  // Comments left during each launch week, indexed the same way as upvotes
  const weeklyCommentCounts = React.useMemo(() => {
    const byWeek: Record<number, Record<string, number>> = {};
    for (const c of comments) {
      if (typeof c.createdAt !== 'number' || !Number.isFinite(c.createdAt)) continue;
      const week = getWeekNumber(c.createdAt);
      const weekMap = (byWeek[week] ??= {});
      weekMap[c.productId] = (weekMap[c.productId] ?? 0) + 1;
      const alt = c.productId.startsWith('prod-')
        ? c.productId.replace(/^prod-/, '')
        : `prod-${c.productId}`;
      weekMap[alt] = weekMap[c.productId];
    }
    return byWeek;
  }, [comments]);

  // Comments left during each calendar month, indexed the same way as upvotes
  const monthlyCommentCounts = React.useMemo(() => {
    const byMonth: Record<string, Record<string, number>> = {};
    for (const c of comments) {
      if (typeof c.createdAt !== 'number' || !Number.isFinite(c.createdAt)) continue;
      const month = getMonthKey(c.createdAt);
      const monthMap = (byMonth[month] ??= {});
      monthMap[c.productId] = (monthMap[c.productId] ?? 0) + 1;
      const alt = c.productId.startsWith('prod-')
        ? c.productId.replace(/^prod-/, '')
        : `prod-${c.productId}`;
      monthMap[alt] = monthMap[c.productId];
    }
    return byMonth;
  }, [comments]);

  // Product detail route state — resolved from /products/:name, /product/:id, or /badge/:id
  const [productRouteId, setProductRouteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/^\/(?:products?|badge)\/(.+)$/);
      if (m) return decodeURIComponent(m[1]);
    }
    return null;
  });
  // Repo detail route state — resolved from /repo/:owner/:name
  const [repoRouteId, setRepoRouteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/^\/repo\/(.+)$/);
      if (m) return decodeURIComponent(m[1]);
    }
    return null;
  });
  // Build guide route state — resolved from /guides/:slug
  const [guideSlug, setGuideSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/^\/guides\/(.+)$/);
      if (m) return decodeURIComponent(m[1]);
    }
    return null;
  });
  // User's submitted product ID tracking (persists even if not signed in)
  const [myProductId, setMyProductId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('topsaas_my_product_id');
    } catch {
      return null;
    }
  });

  // Hash change and browser history listener for SPA routing
  useEffect(() => {
    const handleRouteCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      const badgeMatch = path.match(/^\/badge\/(.+)$/);
      const productMatch = path.match(/^\/(?:products?)\/(.+)$/);
      const repoMatch = path.match(/^\/repo\/(.+)$/);
      if (badgeMatch) {
        setCurrentRoute('badge');
        setProductRouteId(decodeURIComponent(badgeMatch[1]));
      } else if (productMatch) {
        setCurrentRoute('product');
        setProductRouteId(decodeURIComponent(productMatch[1]));
      } else if (repoMatch) {
        setCurrentRoute('repo');
        setRepoRouteId(decodeURIComponent(repoMatch[1]));
      } else if (path === '/trending' || hash === '#trending' || hash === '#/trending') {
        setCurrentRoute('trending');
      } else if (path === '/guides' || hash === '#guides' || hash === '#/guides') {
        setCurrentRoute('guides');
      } else if (/^\/guides\//.test(path)) {
        const gm = path.match(/^\/guides\/(.+)$/);
        setCurrentRoute('guide');
        setGuideSlug(gm ? decodeURIComponent(gm[1]) : null);
      } else if (path === '/accept' || hash === '#accept' || hash === '#/accept') {
        setCurrentRoute('/accept');
      } else if (path === '/payment-success' || path === '/payment/success' || hash === '#payment-success' || hash === '#/payment-success') {
        setCurrentRoute('/payment-success');
      } else if (path === '/profile' || hash === '#profile' || hash === '#/profile') {
        setCurrentRoute('/profile');
      } else if (path === '/submit' || hash === '#submit' || hash === '#/submit') {
        setCurrentRoute('/submit');
      } else if (path === '/ideas' || hash === '#ideas' || hash === '#/ideas') {
        setCurrentRoute('/ideas');
      } else if (path === '/mrr-calculator' || hash === '#mrr-calculator' || hash === '#/mrr-calculator') {
        setCurrentRoute('/mrr-calculator');
      } else if (path === '/privacy' || hash === '#privacy' || hash === '#/privacy') {
        setCurrentRoute('/privacy');
      } else if (path === '/terms' || hash === '#terms' || hash === '#/terms') {
        setCurrentRoute('/terms');
      } else {
        setCurrentRoute('/');
      }
    };

    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);
    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
    };
  }, []);

  // Ensure /accept is strictly unindexed and private from all search engines & crawlers
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (currentRoute === '/accept') {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        document.head.appendChild(metaRobots);
      }
      metaRobots.content = 'noindex, nofollow, noarchive, nosnippet';
      document.title = 'Admin Portal · TopSAAS';
    } else {
      if (metaRobots) {
        metaRobots.content = 'index, follow';
      }
    }
  }, [currentRoute]);

  // Dynamic Category & Homepage SEO on main directory
  useEffect(() => {
    if (currentRoute === '/' && activeTab === 'directory') {
      if (selectedCategory && selectedCategory !== 'All') {
        const title = `Top ${selectedCategory} & Software (2026) | TopSAAS`;
        const desc = `Discover the best ${selectedCategory} software, AI tools, and indie products. Real-time community upvotes and verified launches on TopSAAS.`;
        document.title = title;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', desc);
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', title);
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', desc);
      } else {
        document.title = 'TopSAAS — The Curated Directory of Modern SaaS & AI Tools';
        const defaultDesc = 'Discover, compare, and launch modern SaaS products and AI tools. Real-time community leaderboard, verified founder launches, weekly spotlights, and open-source starters.';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', defaultDesc);
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', 'TopSAAS — The Curated Directory of Modern SaaS & AI Tools');
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', defaultDesc);
      }
    }
  }, [currentRoute, activeTab, selectedCategory]);

  // Honor ?q= deep links (the SearchAction target advertised in the homepage
  // JSON-LD), so search-engine site-search results land with the query applied.
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const q = searchParams.get('q');
      if (q) setSearchQuery(q);

      // Inbound referral tracking (?ref=badge, ?utm_source=..., etc.)
      const ref = searchParams.get('ref');
      const utmSource = searchParams.get('utm_source');
      const utmMedium = searchParams.get('utm_medium');
      const utmCampaign = searchParams.get('utm_campaign');
      const referrer = typeof document !== 'undefined' ? document.referrer : '';

      if (ref === 'badge' || utmSource === 'badge') {
        trackGoal('badge_inbound_click', {
          referrer: referrer || undefined,
          path: window.location.pathname,
        });
      } else if (ref || utmSource) {
        trackGoal('inbound_referral', {
          ref: ref || undefined,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
          referrer: referrer || undefined,
        });
      }
    } catch { }
  }, []);

  // Navigation handlers
  const handleBackToLeaderboard = () => {
    setCurrentRoute('/');
    try {
      window.history.pushState('', document.title, '/');
    } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToProfile = () => {
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setCurrentRoute('/profile');
    try {
      window.history.pushState({}, 'My Profile', '/profile');
    } catch {
      window.location.hash = 'profile';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to a repo's detail page (/repo/:owner/:name)
  const handleOpenRepo = (repo: CuratedRepo) => {
    setCurrentRoute('repo');
    setRepoRouteId(repo.full_name);
    try {
      window.history.pushState({}, repo.name, `/repo/${repo.full_name}`);
    } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Navigate to a product's detail page
  const handleOpenProduct = (product: Product) => {
    setCurrentRoute('product');
    const slug = getProductSlug(product);
    setProductRouteId(slug || product.id);
    try {
      window.history.pushState({}, product.name, `/products/${encodeURIComponent(slug || product.id)}`);
    } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to safely persist submissions with quota-exceeded fallback
  const saveSubmissionsToStorage = (list: WebsiteSubmission[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
    } catch {
      // Quota exceeded: retry saving without large base64 image data URLs
      try {
        const lightweight = list.map((s) => ({
          ...s,
          screenshots: s.screenshots?.filter((img) => !img.startsWith('data:image')),
          logoUrl: s.logoUrl?.startsWith('data:image') ? undefined : s.logoUrl,
        }));
        localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(lightweight));
      } catch { }
    }
  };

  // Persist State Changes (products + sound + submissions to localStorage)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
      saveSubmissionsToStorage(submissions);
    } catch { }
  }, [products, soundEnabled, submissions]);

  // Fetch fresh submissions whenever admin enters /accept or unlocks session
  const refreshAdminSubmissions = async () => {
    invalidateCache('submissions_queue');
    try {
      const fresh = await loadSubmissions(true);
      if (fresh) {
        setSubmissions(fresh);
        saveSubmissionsToStorage(fresh);
      }
    } catch { }
  };

  useEffect(() => {
    if ((currentRoute === '/accept' || currentRoute === 'accept') && adminSessionUnlocked) {
      refreshAdminSubmissions();
    }
  }, [currentRoute, adminSessionUnlocked]);

  // Subscribe to realtime changes on submissions table only when on admin accept review page
  useEffect(() => {
    if (!submissionsLoaded || (!isAdmin && !adminSessionUnlocked) || (currentRoute !== '/accept' && currentRoute !== 'accept')) return;
    const channel = supabase
      .channel('admin-submissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as Record<string, unknown>;
          setSubmissions((prev) => {
            const mapped = mapDbSubmission(newRow);
            if (prev.some((s) => s.id === mapped.id)) return prev;
            return [mapped, ...prev].sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Record<string, unknown>;
          setSubmissions((prev) =>
            prev.map((s) => (s.id === updated.id ? mapDbSubmission(updated) : s))
          );
        } else if (payload.eventType === 'DELETE') {
          const deleted = payload.old as Record<string, unknown>;
          markSubmissionDeleted(deleted.id as string);
          setSubmissions((prev) => prev.filter((s) => s.id !== deleted.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [submissionsLoaded, isAdmin, currentRoute]);

  // Lazy-load full product details (screenshots, features, useCases, long text)
  // only when navigating to a specific product's detail page.
  useEffect(() => {
    if (currentRoute !== 'product' || !productRouteId) return;
    const targetId = productRouteId;
    loadProductById(targetId).then((fullProd) => {
      if (!fullProd) return;
      setProducts((prev) => {
        const found = prev.some((p) => p.id === fullProd.id || matchesProductIdentifier(p, targetId));
        if (found) {
          return prev.map((p) => {
            if (p.id === fullProd.id || matchesProductIdentifier(p, targetId)) {
              // Maintain directory authoritative upvotes & rank so details page exactly matches directory cards
              return {
                ...fullProd,
                ...p,
                description: fullProd.description || p.description,
                problemItSolves: fullProd.problemItSolves || p.problemItSolves,
                solution: fullProd.solution || p.solution,
                uniqueSellingPoint: fullProd.uniqueSellingPoint || p.uniqueSellingPoint,
                screenshots: (fullProd.screenshots && fullProd.screenshots.length > 0) ? fullProd.screenshots : p.screenshots,
                features: fullProd.features || p.features,
                useCases: fullProd.useCases || p.useCases,
                targetAudience: fullProd.targetAudience || p.targetAudience,
                pricingModel: fullProd.pricingModel || p.pricingModel,
                keyHighlights: fullProd.keyHighlights || p.keyHighlights,
                demoVideoUrl: fullProd.demoVideoUrl || p.demoVideoUrl,
                upvotes: p.upvotes !== undefined ? p.upvotes : fullProd.upvotes,
                rank: p.rank || fullProd.rank,
              };
            }
            return p;
          });
        }
        return [...prev, fullProd];
      });
    });
  }, [currentRoute, productRouteId]);

  // Canonical app-name URL auto-sync: If user visits /product/xxx or /products/prod-sub-xxx,
  // smoothly replace URL address bar with /products/<name> (e.g. /products/cvarchitect)
  useEffect(() => {
    if (currentRoute !== 'product' || !productRouteId) return;
    const matched = products.find((p) => matchesProductIdentifier(p, productRouteId));
    if (matched) {
      const slug = getProductSlug(matched);
      if (slug && typeof window !== 'undefined') {
        const canonicalPath = `/products/${encodeURIComponent(slug)}`;
        if (window.location.pathname !== canonicalPath) {
          try {
            window.history.replaceState({}, matched.name, canonicalPath);
            setProductRouteId(slug);
          } catch { }
        }
      }
    }
  }, [currentRoute, productRouteId, products]);

  // Auth: listen for session changes, get initial session, and save profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
      if (session?.user) {
        saveUserProfile(session.user);
        window.trackkit?.('identify', {
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        });
      }
    }).catch(() => {
      setAuthLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        saveUserProfile(session.user);
        window.trackkit?.('identify', {
          user_id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        });
        if (event === 'SIGNED_IN') {
          window.trackkit?.('goal', 'signup_completed');
        }
      }
      if (event === 'SIGNED_OUT' || !session?.user) {
        try {
          localStorage.removeItem('topsaas_launch_draft_v1');
          localStorage.removeItem('topsaas_launch_step_v1');
          localStorage.removeItem('topsaas_pending_paid_submission');
          localStorage.removeItem('topsaas_submit_plan');
          localStorage.removeItem('topsaas_submit_initial_url');
          localStorage.removeItem('topsaas_submit_auto_relaunch');
          localStorage.removeItem('topsaas_guest_upvotes');
        } catch { }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // When user signs in after initiating a submission (e.g. from "Launch Now"),
  // automatically route them to /submit with their entered URL
  useEffect(() => {
    if (!user) return;
    try {
      const pendingRedirect = localStorage.getItem('topsaas_pending_submit_redirect');
      if (pendingRedirect === 'true') {
        localStorage.removeItem('topsaas_pending_submit_redirect');
        setCurrentRoute('/submit');
        try {
          window.history.pushState({}, 'Launch a product', '/submit');
        } catch { }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch { }
  }, [user]);

  // When user is signed in, automatically claim any submissions matching the user's email
  useEffect(() => {
    if (!user) return;
    setSubmissions((prev) => {
      let changed = false;
      const updated = prev.map((s) => {
        const isEmailMatch = s.backerEmail && user.email && s.backerEmail.trim().toLowerCase() === user.email.trim().toLowerCase();
        if (isEmailMatch && s.submittedBy !== user.id) {
          changed = true;
          return {
            ...s,
            submittedBy: user.id,
            backerEmail: s.backerEmail || user.email,
          };
        }
        return s;
      });
      if (changed) {
        saveSubmissionsToStorage(updated);
        // One narrow RPC instead of a per-row UPDATE: it attaches this account to
        // any of its unclaimed submissions (matched by verified email) without
        // needing write access to protected columns like `status` (migration 026).
        supabase.rpc('claim_submissions').then(() => { }, () => { });
        return updated;
      }
      return prev;
    });
  }, [user]);

  // Load products from Supabase on mount (preserving rank order)
  const productsLoadedRef = React.useRef(false);
  useEffect(() => {
    async function load() {
      if (productsLoadedRef.current) return;
      productsLoadedRef.current = true;
      const [dbProducts, dbSponsors, upvoteStats, railsEnabled] = await Promise.all([
        loadProducts(),
        loadSponsors(),
        getUpvoteStats(),
        getSponsorRailsEnabled(),
      ]);
      setSponsors(dbSponsors);
      try {
        localStorage.setItem('topsaas_sponsors_cache', JSON.stringify(dbSponsors));
      } catch { }
      setSponsorRailsEnabledState(railsEnabled);
      setWeeklyUpvotes(upvoteStats.byWeek);
      setMonthlyUpvotes(upvoteStats.byMonth);
      try {
        localStorage.setItem('topsaas_weekly_upvotes_cache', JSON.stringify(upvoteStats.byWeek));
        localStorage.setItem('topsaas_monthly_upvotes_cache', JSON.stringify(upvoteStats.byMonth));
      } catch { }
      const upvoteCounts = upvoteStats.total;

      // Repair the products table whenever a stored count diverges from reality.
      // Uses the security-definer increment RPC so even anonymous visitors can heal
      // counts (direct UPDATEs are RLS-restricted to signed-in users).
      const repairStoredUpvoteCounts = async (list: Product[]) => {
        for (const p of list) {
          const real = upvoteCounts.get(p.id);
          const stored = p.upvotes ?? 0;
          if (real === undefined || real === stored) continue;
          try {
            const { error: rpcError } = await supabase.rpc('increment_product_upvotes', {
              p_product_id: p.id,
              p_delta: real - stored,
            });
            if (rpcError) {
              await supabase.from('products').update({ upvotes: real, updated_at: Date.now() }).eq('id', p.id);
            }
          } catch { }
        }
      };

      // The upvotes table is the authoritative record — display its count directly
      const applyRealUpvoteCounts = (list: Product[]): Product[] =>
        list.map((p) => {
          const real = upvoteCounts.get(p.id);
          return real !== undefined ? { ...p, upvotes: real } : p;
        });

      if (dbProducts !== null && dbProducts.length > 0) {
        // Products ARE the published listing and already carry every field from the
        // submission they were published from, so nothing is merged in here — the
        // submissions table is never consulted on this path.
        const sorted = dbProducts
          // Sponsors are not directory listings, even if a legacy row slipped in.
          .filter((p) => !isSponsorOnlyProduct(p) && !p.id.startsWith('spn_'))
          .sort((a, b) => {
            const rA = a.rank ?? 9999;
            const rB = b.rank ?? 9999;
            if (rA !== rB) return rA - rB;
            const upvoteDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
            if (upvoteDiff !== 0) return upvoteDiff;
            return (a.createdAt ?? 0) - (b.createdAt ?? 0);
          });

        const ranked = sorted.map((p, idx) => ({ ...p, rank: idx + 1 }));
        const withCounts = applyRealUpvoteCounts(ranked);
        repairStoredUpvoteCounts(ranked); // heal DB rows whose stored counts lag reality
        setProducts(withCounts);
        try {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(withCounts));
          localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(withCounts));
        } catch { }
      } else if (dbProducts !== null) {
        // Supabase is reachable but returned zero products — clear stale localStorage
        setProducts([]);
        try {
          localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
          localStorage.removeItem('topsaas_products_cache_v2');
        } catch { }
      }
      // If dbProducts is null (network/RLS error), keep localStorage as fallback
      setProductsLoaded(true);
    }
    load();
  }, []);

  // Check admin status and load user upvotes when signed in
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      updateUserUpvotes(new Set());
      try { localStorage.removeItem('topsaas_user_upvotes'); } catch { }
      try { localStorage.removeItem('topsaas_guest_upvotes'); } catch { }
      return;
    }
    checkIsAdmin().then((admin) => {
      setIsAdmin(admin);
      if (!admin) return;
      // Submissions are RLS-scoped (migration 025): a visitor who signs in after
      // mounting still holds the anonymous, approved-only view in state, so an
      // admin must refetch to populate the full moderation queue.
      supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false })
        .then(({ data, error }) => {
          if (error || !data) return;
          const rows = data.map(mapDbSubmission);
          setSubmissions(rows);

          // Idempotent publish catch-up: an approved submission whose listing is
          // missing (for example its insert failed at approval time) is published
          // now. This is decided purely by the deterministic id, so it can never
          // create a duplicate listing.
          setProducts((prev) => {
            const publishedIds = new Set(prev.map((p) => p.id));
            const missing = rows.filter(
              (s) => s.status === 'approved' && !publishedIds.has(publishedProductId(s.id))
            );
            if (missing.length === 0) return prev;

            const additions = missing.map((s, i) => submissionToProduct(s, prev.length + i + 1));
            const next = [...prev, ...additions];
            additions.forEach((p) => { insertProductDirect(p).catch(() => { }); });
            saveAllProducts(next).catch(() => { });
            return next;
          });
        });
    });
    getUserUpvotes().then((dbVotes) => {
      updateUserUpvotes(dbVotes);
    });
  }, [user]);

  // Save user profile to Supabase profiles table
  const saveUserProfile = async (u: User) => {
    try {
      const meta = u.user_metadata || {};
      const payload: Record<string, any> = {
        id: u.id,
        email: u.email || null,
        full_name: meta.full_name || meta.name || null,
        avatar_url: meta.avatar_url || meta.picture || null,
        updated_at: new Date().toISOString(),
      };

      if (meta.username) payload.username = meta.username;
      if (meta.bio) payload.bio = meta.bio;
      if (Array.isArray(meta.looking_for)) payload.looking_for = meta.looking_for;
      if (meta.twitter_url) payload.twitter_url = meta.twitter_url;
      if (meta.linkedin_url) payload.linkedin_url = meta.linkedin_url;
      if (meta.website_url) payload.website_url = meta.website_url;
      if (meta.booking_url) payload.booking_url = meta.booking_url;

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) console.error('Profile save error:', error.message);
    } catch (e) {
      console.error('Profile save failed:', e);
    }
  };

  // Auth: sign in with Google
  const handleSignIn = async () => {
    setIsSignInModalOpen(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Sign in error:', error.message);
  };

  // Top nav Submit button: always navigates directly to the /submit page on click
  const handleTopNavSubmit = () => {
    playSound('click', soundEnabled);
    setCurrentRoute('/submit');
    try {
      window.history.pushState({}, 'Launch a product', '/submit');
    } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit now lives on its own page — every "New Launch" CTA routes there
  const handleOpenSubmit = (initialUrl?: string) => {
    playSound('click', soundEnabled);
    const trimmed = initialUrl ? initialUrl.trim() : '';
    if (trimmed) {
      try {
        localStorage.setItem('topsaas_submit_initial_url', trimmed);
      } catch { }
    }
    if (!user) {
      try {
        localStorage.setItem('topsaas_pending_submit_redirect', 'true');
      } catch { }
      setIsSignInModalOpen(true);
      return;
    }
    setCurrentRoute('/submit');
    try {
      window.history.pushState({}, 'Launch a product', '/submit');
    } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth: sign out
  const handleSignOut = async () => {
    try {
      localStorage.removeItem('topsaas_launch_draft_v1');
      localStorage.removeItem('topsaas_launch_step_v1');
      localStorage.removeItem('topsaas_pending_paid_submission');
      localStorage.removeItem('topsaas_submit_plan');
      localStorage.removeItem('topsaas_submit_initial_url');
      localStorage.removeItem('topsaas_submit_auto_relaunch');
      localStorage.removeItem('topsaas_guest_upvotes');
    } catch { }
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
  };

  // Automatic ranking comparator: (upvotes * 2) + comments, tie-broken by upvotes, comments, assigned rank, then oldest first
  const compareProductsByRank = useCallback((a: Product, b: Product) => {
    const scoreA = (a.upvotes ?? 0) * 2 + (commentCounts[a.id] ?? 0);
    const scoreB = (b.upvotes ?? 0) * 2 + (commentCounts[b.id] ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const upvoteDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
    if (upvoteDiff !== 0) return upvoteDiff;
    const commentDiff = (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0);
    if (commentDiff !== 0) return commentDiff;
    const rankA = a.rank ?? 999999;
    const rankB = b.rank ?? 999999;
    if (rankA !== rankB) return rankA - rankB;
    return (a.createdAt ?? 0) - (b.createdAt ?? 0);
  }, [commentCounts]);

  // Weekly upvote/comment lookups (both 'prod-' prefixed and raw id forms)
  const getWeeklyUpvotes = useCallback(
    (productId: string, weekNumber: number) => {
      const weekMap = weeklyUpvotes[weekNumber];
      if (!weekMap) return 0;
      const alt = productId.startsWith('prod-')
        ? productId.replace(/^prod-/, '')
        : `prod-${productId}`;
      return weekMap[productId] ?? weekMap[alt] ?? 0;
    },
    [weeklyUpvotes]
  );

  const getWeeklyComments = useCallback(
    (productId: string, weekNumber: number) => {
      const weekMap = weeklyCommentCounts[weekNumber];
      if (!weekMap) return 0;
      const alt = productId.startsWith('prod-')
        ? productId.replace(/^prod-/, '')
        : `prod-${productId}`;
      return weekMap[productId] ?? weekMap[alt] ?? 0;
    },
    [weeklyCommentCounts]
  );

  // Weekly ranking: engagement earned during that week only.
  // score = weeklyUpvotes * 2 + weeklyComments, tie-broken by the same counters.
  const compareProductsForWeek = useCallback(
    (week: WeekInfo) => (a: Product, b: Product) => {
      const weekNumber = week.weekNumber;
      const aUp = getWeeklyUpvotes(a.id, weekNumber);
      const bUp = getWeeklyUpvotes(b.id, weekNumber);
      const aComments = getWeeklyComments(a.id, weekNumber);
      const bComments = getWeeklyComments(b.id, weekNumber);
      const aScore = aUp * 2 + aComments;
      const bScore = bUp * 2 + bComments;

      if (bScore !== aScore) return bScore - aScore;
      if (bUp !== aUp) return bUp - aUp;
      if (bComments !== aComments) return bComments - aComments;

      // No engagement yet: earliest launch in that round first, then name for stability.
      // Relaunches without a timestamp this round sort after genuinely new launches.
      const launchTime = (p: Product) => {
        if (isInWeek(p.createdAt, week)) return p.createdAt;
        if (p.lastRelaunchedAt && isInWeek(p.lastRelaunchedAt, week)) return p.lastRelaunchedAt;
        return week.end;
      };
      const createdDiff = launchTime(a) - launchTime(b);
      if (createdDiff !== 0) return createdDiff;
      return a.name.localeCompare(b.name);
    },
    [getWeeklyUpvotes, getWeeklyComments]
  );

  // Monthly upvote/comment lookups for "This Month's Best"
  const getMonthlyUpvotes = useCallback(
    (productId: string, monthKey: string) => {
      const monthMap = monthlyUpvotes[monthKey];
      if (!monthMap) return 0;
      const alt = productId.startsWith('prod-')
        ? productId.replace(/^prod-/, '')
        : `prod-${productId}`;
      return monthMap[productId] ?? monthMap[alt] ?? 0;
    },
    [monthlyUpvotes]
  );

  const getMonthlyComments = useCallback(
    (productId: string, monthKey: string) => {
      const monthMap = monthlyCommentCounts[monthKey];
      if (!monthMap) return 0;
      const alt = productId.startsWith('prod-')
        ? productId.replace(/^prod-/, '')
        : `prod-${productId}`;
      return monthMap[productId] ?? monthMap[alt] ?? 0;
    },
    [monthlyCommentCounts]
  );

  // Monthly ranking: engagement earned during that calendar month only.
  const compareProductsForMonth = useCallback(
    (monthKey: string) => (a: Product, b: Product) => {
      const aUp = getMonthlyUpvotes(a.id, monthKey);
      const bUp = getMonthlyUpvotes(b.id, monthKey);
      const aComments = getMonthlyComments(a.id, monthKey);
      const bComments = getMonthlyComments(b.id, monthKey);
      const aScore = aUp * 2 + aComments;
      const bScore = bUp * 2 + bComments;

      if (bScore !== aScore) return bScore - aScore;
      if (bUp !== aUp) return bUp - aUp;
      if (bComments !== aComments) return bComments - aComments;

      const createdDiff = (a.createdAt ?? 0) - (b.createdAt ?? 0);
      if (createdDiff !== 0) return createdDiff;
      return a.name.localeCompare(b.name);
    },
    [getMonthlyUpvotes, getMonthlyComments]
  );

  // Upvote a product (requires an account)
  const handleUpvote = async (product: Product) => {
    if (!user) {
      playSound('click', soundEnabled);
      setIsSignInModalOpen(true);
      return;
    }

    playSound('upvote', soundEnabled);

    const canonicalId = product.id.startsWith('prod-') ? product.id : publishedProductId(product.id);
    const bareId = product.id.startsWith('prod-') ? product.id.replace(/^prod-/, '') : product.id;

    const currentlyUpvoted = isProductUpvoted(product.id, userUpvotes) || isProductUpvoted(canonicalId, userUpvotes);
    const willBeUpvoted = !currentlyUpvoted;
    const delta = willBeUpvoted ? 1 : -1;

    // 1. Instant optimistic update for userUpvotes state (persisted immediately)
    updateUserUpvotes((prev) => {
      const next = new Set(prev);
      if (willBeUpvoted) {
        next.add(product.id);
        next.add(canonicalId);
        next.add(bareId);
      } else {
        next.delete(product.id);
        next.delete(canonicalId);
        next.delete(bareId);
      }
      return next;
    });

    // 2. Instant optimistic update of products count & live dynamic re-ranking
    // Weekly views re-sort from weekly engagement, so all-time ranks stay untouched there.
    let reRankedProducts: Product[] = [];
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const isMatch = p.id === product.id || p.id === canonicalId || p.id === bareId;
        if (isMatch) {
          const nextUpvotes = Math.max(0, (p.upvotes ?? 0) + delta);
          return { ...p, upvotes: nextUpvotes, updatedAt: Date.now() };
        }
        return p;
      });

      const reRanked = selectedWeek
        ? updated
        : [...updated].sort(compareProductsByRank).map((p, idx) => ({
          ...p,
          previousRank: p.rank !== (idx + 1) ? (p.rank ?? (idx + 1)) : p.previousRank,
          rank: idx + 1,
        }));
      reRankedProducts = reRanked;

      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(reRanked));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(reRanked));
      } catch { }

      return reRanked;
    });

    // The vote just cast belongs to the current calendar week
    setWeeklyUpvotes((prev) => {
      const week = getWeekNumber(Date.now());
      const current = prev[week] ?? {};
      const nextCount = Math.max(
        0,
        (current[product.id] ?? current[canonicalId] ?? current[bareId] ?? 0) + delta
      );
      const nextWeek: Record<string, number> = {
        ...current,
        [product.id]: nextCount,
        [canonicalId]: nextCount,
        [bareId]: nextCount,
      };
      return { ...prev, [week]: nextWeek };
    });

    // ...and the current calendar month
    setMonthlyUpvotes((prev) => {
      const month = getMonthKey(Date.now());
      const current = prev[month] ?? {};
      const nextCount = Math.max(
        0,
        (current[product.id] ?? current[canonicalId] ?? current[bareId] ?? 0) + delta
      );
      const nextMonth: Record<string, number> = {
        ...current,
        [product.id]: nextCount,
        [canonicalId]: nextCount,
        [bareId]: nextCount,
      };
      return { ...prev, [month]: nextMonth };
    });

    // 3. Background persistence to Supabase via toggleUpvote RPC / direct table fallback
    toggleUpvote(canonicalId).then((rpcResult) => {
      if (rpcResult === null) {
        // Network/RPC failure: keep optimistic state and try direct increment fallback
        incrementProductUpvotesDirect(canonicalId, delta).catch(() => {
          debouncedSyncProducts(reRankedProducts);
        });
      } else if (rpcResult !== willBeUpvoted) {
        // Reconcile state only if remote server returned a definitive opposite result
        updateUserUpvotes((prev) => {
          const synced = new Set(prev);
          if (rpcResult) {
            synced.add(product.id);
            synced.add(canonicalId);
            synced.add(bareId);
          } else {
            synced.delete(product.id);
            synced.delete(canonicalId);
            synced.delete(bareId);
          }
          return synced;
        });
      }
    }).catch(() => {
      debouncedSyncProducts(reRankedProducts);
    });
  };

  // Keep the public founder profile in sync with the name/photo used on a
  // submission. The Submit page edits a per-launch copy, so without this the
  // profile page would keep showing the old values.
  const syncCreatorProfile = async (creatorName?: string, creatorAvatar?: string) => {
    if (!user) return;
    const meta = user.user_metadata || {};
    const currentName = (meta.full_name || meta.name || '').trim();
    const currentAvatar = meta.avatar_url || meta.picture || '';
    const nextName = (creatorName || '').trim() || currentName || user.email?.split('@')[0] || '';
    let nextAvatar = creatorAvatar || currentAvatar;

    // Drafts created before the storage upload change may still hold a base64
    // data URL. Move it to public storage so auth metadata stays small.
    if (nextAvatar.startsWith('data:')) {
      try {
        const blob = await (await fetch(nextAvatar)).blob();
        const file = new File([blob], 'founder-avatar.png', { type: blob.type || 'image/png' });
        nextAvatar = (await uploadScreenshotToStorage(file, `avatar-${user.id}`)) || nextAvatar;
      } catch { }
    }

    const nameChanged = Boolean(nextName && nextName !== currentName);
    const avatarChanged = Boolean(nextAvatar && nextAvatar !== currentAvatar);
    if (!nameChanged && !avatarChanged) return;

    try {
      await supabase.auth.updateUser({
        data: {
          ...(nameChanged ? { full_name: nextName } : {}),
          ...(avatarChanged ? { avatar_url: nextAvatar } : {}),
        },
      });
    } catch (err) {
      console.warn('Could not update auth profile metadata:', err);
    }

    try {
      const payload: Record<string, unknown> = {
        id: user.id,
        email: user.email,
        updated_at: new Date().toISOString(),
      };
      if (nextName) payload.full_name = nextName;
      if (nextAvatar) payload.avatar_url = nextAvatar;
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) console.warn('Could not update profiles table:', error.message);
    } catch (err) {
      console.warn('Could not update profiles table:', err);
    }
  };

  // Handle User Submission — queued under review for admin approval
  const handleConfirmSubmit = async (details: SubmitProductDetails): Promise<string | undefined> => {
    const now = Date.now();
    const subId = generateUniqueId('sub');

    const { name, tagline, url, category } = details;
    const logoUrl = details.logoUrl || getWebsiteFavicon(url);
    const targetAudience = details.targetAudience?.trim() || undefined;

    // Create a submission record with status: 'under_review'
    const newSubmission: WebsiteSubmission = {
      id: subId,
      name,
      tagline,
      url,
      logoUrl,
      screenshots: details.screenshots && details.screenshots.length > 0 ? details.screenshots.slice(0, 4) : undefined,
      demoVideoUrl: details.demoVideoUrl?.trim() || undefined,
      twitterHandle: details.twitterHandle || undefined,
      socials: details.socials && details.socials.length > 0 ? details.socials : undefined,
      creatorName: details.creatorName || undefined,
      creatorUsername: details.creatorUsername || undefined,
      creatorXHandle: details.creatorXHandle || undefined,
      creatorAvatar: details.creatorAvatar || undefined,
      creatorRole: details.creatorRole || undefined,
      category,
      backerName: details.creatorName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator',
      backerEmail: user?.email,
      status: 'under_review',
      submittedAt: now,
      targetAudience,
      pricingModel: details.pricingModel || undefined,
      submittedBy: user?.id || undefined,
      offerDiscount: details.offerDiscount?.trim() || undefined,
      offerCode: details.offerCode?.trim() || undefined,
      offerUrl: details.offerUrl?.trim() || undefined,
      offerDetails: details.offerDetails?.trim() || undefined,
      description: details.description?.trim() || undefined,
      problemItSolves: details.problemItSolves?.trim() || undefined,
      solution: details.solution?.trim() || undefined,
      uniqueSellingPoint: details.uniqueSellingPoint?.trim() || undefined,
      autoRelaunch: details.autoRelaunch || undefined,
      autoRelaunchPaid: details.autoRelaunchPaid || (details.autoRelaunch ? true : undefined),
      autoRelaunchPaidAt: details.autoRelaunch ? now : undefined,
      verified: false,
      scheduledLaunchWeek: details.scheduledLaunchWeek || undefined,
      scheduledLaunchDate: details.scheduledLaunchDate || undefined,
      lastRelaunchedAt: details.autoRelaunch ? now : undefined,
    };

    // Clear any previous deletion record for this URL or ID so it is completely fresh
    unmarkSubmissionDeleted(url);
    unmarkSubmissionDeleted(subId);

    setSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => s.id !== subId && s.url.toLowerCase().replace(/\/$/, '') !== url.toLowerCase().replace(/\/$/, '')
      );
      const updated = [newSubmission, ...filtered].sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));
      saveSubmissionsToStorage(updated);
      return updated;
    });
    invalidateCache('submissions_queue');

    try {
      const payload = toDbSubmission(newSubmission);
      let { error } = await supabase.from('submissions').insert(payload);
      if (error && (error.code === '23503' || String(error.message).includes('submitted_by'))) {
        const payloadNoFk = { ...payload, submitted_by: null };
        const res = await supabase.from('submissions').insert(payloadNoFk);
        error = res.error;
      }
      if (error) {
        console.warn('Initial Supabase insert note, trying fallback insert:', error.message || error);
        // Fallback with minimal standard columns in case custom columns do not exist in remote DB table
        const minimal: Record<string, unknown> = {
          id: payload.id,
          name: payload.name,
          tagline: payload.tagline,
          url: payload.url,
          category: payload.category,
          backer_name: payload.backer_name,
          status: payload.status,
          submitted_at: payload.submitted_at,
        };
        if (payload.backer_email) minimal.backer_email = payload.backer_email;
        if (payload.submitted_by) minimal.submitted_by = payload.submitted_by;
        if (payload.logo_url) {
          minimal.logo_url = payload.logo_url;
        }
        if (payload.screenshots && Array.isArray(payload.screenshots) && payload.screenshots.length > 0) {
          minimal.screenshots = payload.screenshots;
        }
        if (payload.twitter_handle) minimal.twitter_handle = payload.twitter_handle;
        if (payload.creator_name) minimal.creator_name = payload.creator_name;
        if (payload.creator_username) minimal.creator_username = payload.creator_username;
        if (payload.creator_x_handle) minimal.creator_x_handle = payload.creator_x_handle;
        if (payload.creator_avatar) minimal.creator_avatar = payload.creator_avatar;
        if (payload.creator_role) minimal.creator_role = payload.creator_role;
        if (payload.demo_video_url) minimal.demo_video_url = payload.demo_video_url;
        if (payload.socials) minimal.socials = payload.socials;
        if (payload.target_audience) minimal.target_audience = payload.target_audience;
        if (payload.pricing_model) minimal.pricing_model = payload.pricing_model;
        if (payload.description) minimal.description = payload.description;
        if (payload.problem_it_solves) minimal.problem_it_solves = payload.problem_it_solves;
        if (payload.solution) minimal.solution = payload.solution;
        if (payload.unique_selling_point) minimal.unique_selling_point = payload.unique_selling_point;
        if (payload.offer_discount) minimal.offer_discount = payload.offer_discount;
        if (payload.offer_code) minimal.offer_code = payload.offer_code;
        if (payload.offer_url) minimal.offer_url = payload.offer_url;
        if (payload.offer_details) minimal.offer_details = payload.offer_details;
        await supabase.from('submissions').insert(minimal);
      }
    } catch (err) {
      console.warn('Error syncing submission to remote DB (stored locally):', err);
    }

    // The founder name/photo edited on the Submit page should become the
    // account's public profile values too.
    await syncCreatorProfile(details.creatorName, details.creatorAvatar);

    return subId;
  };

  // Admin Acceptance Pipeline: publishes a submission as its live listing, exactly once.
  const handleAcceptSubmission = async (sub: WebsiteSubmission) => {
    // Ensure full submission details (including screenshots) are available if missing from memory
    let fullSub = sub;
    if (!fullSub.screenshots || fullSub.screenshots.length === 0) {
      try {
        const loaded = await loadSubmissionById(sub.id, true);
        if (loaded?.screenshots && loaded.screenshots.length > 0) {
          fullSub = { ...fullSub, screenshots: loaded.screenshots };
        }
      } catch {}
    }

    // 1. Mark the submission approved (queue + Supabase)
    const reviewedAt = Date.now();
    const approvedSub: WebsiteSubmission = { ...fullSub, status: 'approved', reviewedAt };

    setSubmissions((prev) => {
      const updated = prev.map((s) => (s.id === sub.id ? approvedSub : s));
      saveSubmissionsToStorage(updated);
      return updated;
    });
    invalidateCache('submissions_queue');
    invalidateCache('products_list');

    try {
      await supabase.from('submissions').update({ status: 'approved', reviewed_at: reviewedAt }).eq('id', sub.id);
    } catch { }

    // 2. Publish the listing at its deterministic id. The id alone decides create
    //    vs. refresh — no URL matching, no reconciliation against submissions.
    const listingId = publishedProductId(sub.id);
    let productToSync: Product | null = null;

    setProducts((prev) => {
      const existing = prev.find((p) => p.id === listingId);
      const fresh = submissionToProduct(approvedSub, existing?.rank ?? prev.length + 1);

      const nextProducts = existing
        ? prev.map((p) =>
          p.id === listingId
            ? {
              ...fresh,
              submittedBy: fresh.submittedBy || p.submittedBy || approvedSub.submittedBy,
              screenshots: (fresh.screenshots && fresh.screenshots.length > 0)
                ? fresh.screenshots
                : (p.screenshots && p.screenshots.length > 0 ? p.screenshots : undefined),
              // A republish must never reset engagement or the creation date.
              rank: p.rank,
              previousRank: p.previousRank ?? p.rank,
              upvotes: p.upvotes,
              clicks: p.clicks,
              createdAt: p.createdAt,
            }
            : p
        )
        : [...prev, fresh].map((p, idx) => ({ ...p, rank: idx + 1 }));

      productToSync = nextProducts.find((p) => p.id === listingId) ?? fresh;

      debouncedSyncProducts(nextProducts);
      saveAllProducts(nextProducts).catch(() => { });
      try {
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(nextProducts));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(nextProducts));
      } catch { }
      return nextProducts;
    });

    setLiveFeed((prev) =>
      [{ id: `listing-${Date.now()}`, productId: productToSync?.id || listingId, name: sub.name, kind: 'listing', time: Date.now() }, ...prev].slice(0, 14)
    );

    if (productToSync) {
      try {
        await insertProductDirect(productToSync);
      } catch { }
    }
  };

  // Admin Reject Pipeline
  const handleRejectSubmission = async (submissionId: string, reason?: string) => {
    const reviewedAt = Date.now();
    const rejectionReason = reason || 'Did not meet current directory guidelines';
    invalidateCache('submissions_queue');
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, status: 'rejected', reviewedAt, rejectionReason } : s
      )
    );
    try {
      await supabase.from('submissions').update({ status: 'rejected', reviewed_at: reviewedAt, rejection_reason: rejectionReason }).eq('id', submissionId);
    } catch { }
  };

  // Admin Delete Permanent
  const handleDeleteSubmission = async (submissionId: string) => {
    const targetSub = submissions.find((s) => s.id === submissionId);
    markSubmissionDeleted(submissionId);
    invalidateCache('submissions_queue');
    invalidateCache('products_list');
    if (targetSub) {
      markSubmissionDeleted(targetSub.url);
      markSubmissionDeleted(targetSub.url.toLowerCase().replace(/\/$/, ''));
    }
    setSubmissions((prev) => {
      const updated = prev.filter((s) => {
        if (s.id === submissionId) return false;
        if (targetSub && s.url.toLowerCase().replace(/\/$/, '') === targetSub.url.toLowerCase().replace(/\/$/, '')) {
          return false;
        }
        return true;
      });
      saveSubmissionsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('submissions').delete().eq('id', submissionId);
      if (targetSub) {
        // Still sweep duplicate submissions that share this URL (moderation cleanup).
        await supabase.from('submissions').delete().eq('url', targetSub.url);
        // The listing id is deterministic — no need to hunt for it by URL.
        await supabase.from('products').delete().eq('id', publishedProductId(submissionId));
      }
    } catch (err) {
      console.error('Error deleting submission from DB:', err);
    }
  };

  // Admin Update Submission Details
  const handleUpdateSubmission = async (updated: WebsiteSubmission) => {
    invalidateCache('submissions_queue');
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await supabase.from('submissions').update(toDbSubmission(updated)).eq('id', updated.id);
    } catch { }
  };

  // Admin Restore Submission to Queue
  const handleRestoreSubmission = async (submissionId: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'under_review' } : s))
    );
    try {
      await supabase.from('submissions').update({ status: 'under_review', reviewed_at: null }).eq('id', submissionId);
    } catch { }
  };

  // Seed sample submissions for testing
  const handleSeedSampleSubmissions = async () => {
    setSubmissions(INITIAL_SUBMISSIONS);
    playSound('click', soundEnabled);
    try {
      await supabase.from('submissions').upsert(
        INITIAL_SUBMISSIONS.map(toDbSubmission),
        { onConflict: 'id' }
      );
    } catch { }
  };

  // Track click on a website (counts the visit + pushes a live traffic event + tracks sponsor performance + persists to Supabase)
  const handleTrackClick = (productId: string, _url: string) => {
    const now = Date.now();
    trackGoal('outbound_click', { product_id: productId });

    // Sponsor cards use sponsor ids (spn_...). Their clicks are tracked on the
    // sponsors table, never on a product row.
    const sponsor = sponsors.find((s) => s.id === productId);
    if (sponsor) {
      incrementSponsorClicks(sponsor.id).catch(() => {});
      setSponsors((prev) =>
        prev.map((s) => (s.id === sponsor.id ? { ...s, clicks: (s.clicks || 0) + 1 } : s))
      );
    } else {
      // Persist click increment to database atomically
      incrementProductClicksDirect(productId).catch(() => {});
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          return { ...p, clicks: (p.clicks || 0) + 1, updatedAt: now };
        })
      );
    }

    const last = lastClickFeedRef.current[productId] || 0;
    if (now - last < 60_000) return;
    lastClickFeedRef.current[productId] = now;
    const targetName = sponsor?.name || products.find((p) => p.id === productId)?.name;
    if (!targetName) return;
    setLiveFeed((prev) =>
      [{ id: `visit-${now}`, productId, name: targetName, kind: 'visit', time: now }, ...prev].slice(0, 14)
    );
  };

  // Update a single product in state and database. Sponsorship is separate and
  // must never be written through a product update.
  const handleUpdateProduct = (updatedProduct: Product) => {
    updateProductDirect(updatedProduct).catch(() => {});
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === updatedProduct.id);
      const next = exists
        ? prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
        : [...prev, updatedProduct];
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(next));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(next));
      } catch { }
      saveAllProducts(next).catch(() => { });
      debouncedSyncProducts(next);
      return next;
    });
  };

  // Activate a sponsor placement (7-day free trial or 1mo / 3mo / 1yr paid).
  // The sponsor is stored in its own table and is never added to products.
  const handleActivateSponsorTrial = async (
    draft: SponsorDraft,
    tier: 'trial' | 'paid' | '1mo' | '3mo' | '1yr',
    email?: string
  ) => {
    let durationDays = 30;
    if (tier === 'trial') durationDays = 7;
    else if (tier === '1mo' || tier === 'paid') durationDays = 30;
    else if (tier === '3mo') durationDays = 90;
    else if (tier === '1yr') durationDays = 365;

    const now = Date.now();
    const expiresAt = now + durationDays * 86400 * 1000;
    const contactEmail = email || draft.contactEmail || (user ? user.email : undefined);

    const created = await createSponsor({
      ...draft,
      tier,
      status: 'active',
      startedAt: now,
      expiresAt,
      contactEmail,
      source: draft.source || (tier === 'trial' ? 'trial' : 'whop'),
    });

    if (created) {
      setSponsors((prev) => {
        const exists = prev.some((s) => s.id === created.id);
        return exists ? prev.map((s) => (s.id === created.id ? created : s)) : [created, ...prev];
      });
    }
  };

  // ── Sponsor admin handlers (dedicated sponsors table) ──
  const handleCreateSponsor = async (draft: SponsorDraft) => {
    const created = await createSponsor(draft);
    if (created) {
      setSponsors((prev) => {
        const exists = prev.some((s) => s.id === created.id);
        return exists ? prev.map((s) => (s.id === created.id ? created : s)) : [created, ...prev];
      });
    }
  };

  const handleUpdateSponsor = async (sponsor: Sponsor) => {
    setSponsors((prev) => prev.map((s) => (s.id === sponsor.id ? sponsor : s)));
    await updateSponsor(sponsor);
  };

  const handleEndSponsor = async (sponsorId: string) => {
    setSponsors((prev) =>
      prev.map((s) => (s.id === sponsorId ? { ...s, status: 'ended' } : s))
    );
    await endSponsor(sponsorId);
  };

  const handlePauseSponsor = async (sponsorId: string) => {
    const updated = await toggleSponsorPause(sponsorId);
    if (updated) {
      setSponsors((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  // Activate featured spot in directory listing (above the product cards)
  const handleActivateFeatured = async (
    product: Product,
    durationDays: number = 7,
    email?: string
  ) => {
    // 1. Remove any sponsor placement for this product so it never appears in
    //    the side rails at the same time as the featured spot.
    await endSponsorsForProduct(product.id);
    setSponsors((prev) =>
      prev.map((s) =>
        s.productId === product.id || s.id === product.id ? { ...s, status: 'ended' } : s
      )
    );

    // 2. Add product to featuredProductIds (placed first in priority order)
    const nextFeaturedIds = [product.id, ...featuredProductIds.filter((id) => id !== product.id)];
    await handleSetFeaturedProducts(nextFeaturedIds, 'active');

    // 3. Ensure placement is Top (above #1 card)
    await handleSetProductFeaturedPosition(product.id, 0);
    setFeaturedPositionState(0);
    await setFeaturedPosition(0);

    // 4. Update product state so isSponsored is strictly false
    const updatedProduct: Product = {
      ...product,
      isSponsored: false,
      sponsorTier: undefined,
      sponsorExpiresAt: undefined,
    };
    handleUpdateProduct(updatedProduct);
  };

  // Rent the side rail sponsor ad card
  const openRentSpotlight = () => {
    playSound('click', soundEnabled);
    setFeaturedModalMode('sponsor');
    if (!user) {
      setIsSignInModalOpen(true);
    } else {
      setIsFeaturedSpotModalOpen(true);
    }
  };

  // Delist a product — permanently removes it from live directory and DB
  const handleDelistProduct = async (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);

    // Any sponsor placement linked to this listing ends with it.
    await endSponsorsForProduct(productId);
    setSponsors((prev) =>
      prev.map((s) =>
        s.productId === productId || s.id === productId ? { ...s, status: 'ended' } : s
      )
    );

    setProducts((prev) => {
      const updated = prev
        .filter((p) => p.id !== productId)
        .map((p, idx) => ({
          ...p,
          rank: idx + 1,
        }));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(updated));
      } catch { }
      debouncedSyncProducts(updated);
      saveAllProducts(updated).catch(() => { });
      return updated;
    });

    if (featuredProductId === productId || featuredProductIds.includes(productId)) {
      const nextIds = featuredProductIds.filter((id) => id !== productId);
      handleSetFeaturedProducts(nextIds, nextIds.length === 0 ? 'default' : 'active');
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        console.error('Error deleting product from DB:', error.message);
        // Revert — put the product back since DB delete failed
        if (targetProduct) {
          setProducts((prev) => {
            const restored = [...prev, targetProduct].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
            try {
              localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(restored));
              localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(restored));
            } catch { }
            return restored;
          });
        }
        return;
      }
      // Listings are keyed by their deterministic id, so the delete above is the
      // whole job — there are no duplicate rows to sweep up by URL.
    } catch (err) {
      console.error('Error deleting product from DB:', err);
      // Revert on network error too
      if (targetProduct) {
        setProducts((prev) => {
          const restored = [...prev, targetProduct].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
          try {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(restored));
            localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(restored));
          } catch { }
          return restored;
        });
      }
    }
  };

  // Toggle verified badge status for any website / product
  const handleToggleVerifiedProduct = async (productId: string, verified: boolean) => {
    playSound('click', soundEnabled);
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === productId ? { ...p, verified } : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(updated));
      } catch { }
      debouncedSyncProducts(updated);
      saveAllProducts(updated).catch(() => { });
      return updated;
    });

    try {
      const { error } = await supabase
        .from('products')
        .update({ verified })
        .eq('id', productId);
      if (error) {
        console.error('Error updating product verified status in DB:', error.message);
      }
    } catch (err) {
      console.error('Error toggling product verified status:', err);
    }
  };

  // Manually assign a product to a specific rank (1-based) and immediately persist
  const handleAssignRank = (productId: string, newRank: number) => {
    setProducts((prev) => {
      const clampedRank = Math.max(1, Math.min(newRank, prev.length));
      const target = prev.find((p) => p.id === productId);
      if (!target) return prev;

      // Sort by current rank, then move the target product to the desired position
      const sorted = [...prev].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
      const withoutTarget = sorted.filter((p) => p.id !== productId);
      const insertIndex = Math.max(0, Math.min(clampedRank - 1, withoutTarget.length));
      withoutTarget.splice(insertIndex, 0, target);

      // Reassign all ranks sequentially
      const ranked = withoutTarget.map((p, idx) => ({
        ...p,
        previousRank: p.rank !== (idx + 1) ? (p.rank ?? (idx + 1)) : p.previousRank,
        rank: idx + 1,
      }));

      // Immediately sync to both localStorage and Supabase
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(ranked));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(ranked));
      } catch { }
      saveAllProducts(ranked).catch(() => { });
      debouncedSyncProducts(ranked);

      return ranked;
    });
  };

  // Automatically re-rank all products sequentially based on current community upvotes & comments
  const handleAutoRankByUpvotes = () => {
    setProducts((prev) => {
      const sorted = [...prev].sort(compareProductsByRank);
      const ranked = sorted.map((p, idx) => ({
        ...p,
        previousRank: p.rank !== (idx + 1) ? (p.rank ?? (idx + 1)) : p.previousRank,
        rank: idx + 1,
      }));
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(ranked));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(ranked));
      } catch { }
      saveAllProducts(ranked).catch(() => { });
      debouncedSyncProducts(ranked);
      return ranked;
    });
  };

  // Reset directory — clears all products
  const handleResetBoard = () => {
    if (window.confirm('Clear all products from the directory?')) {
      setProducts([]);
      playSound('click', soundEnabled);
    }
  };

  // Admin: set multiple products as featured, or change mode ('active' | 'default' | 'empty')
  const handleSetFeaturedProducts = async (
    ids: string[],
    mode: 'active' | 'default' | 'empty' = 'active'
  ) => {
    setFeaturedProductIds(ids);
    const primary = ids.length > 0 ? ids[0] : (mode === 'empty' ? 'empty' : null);
    setFeaturedProductId(primary);
    playSound('click', soundEnabled);
    await setGlobalFeaturedProducts(ids, mode);
  };

  // Admin: set any product as the featured product (backwards-compatible wrapper)
  const handleSetFeatured = (productId: string | null) => {
    if (!productId || productId === 'default') {
      handleSetFeaturedProducts([], 'default');
    } else if (productId === 'empty') {
      handleSetFeaturedProducts([], 'empty');
    } else {
      const nextIds = [productId, ...featuredProductIds.filter((id) => id !== productId)];
      handleSetFeaturedProducts(nextIds, 'active');
    }
  };

  // Save full products order to local storage and remote DB
  const handleSaveProductsOrder = async () => {
    try {
      const sorted = [...products].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
      const reNumbered = sorted.map((p, idx) => ({ ...p, rank: idx + 1, previousRank: p.rank ?? (idx + 1) }));
      setProducts(reNumbered);
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(reNumbered));
      localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(reNumbered));
      await saveProductRanksDirect(reNumbered);
      await saveAllProducts(reNumbered);
    } catch (err) {
      console.error('Error saving products order:', err);
    }
  };

  const isDefaultFeatured = featuredProductId === null || featuredProductId === 'default';
  const isEmptyFeatured = featuredProductId === '' || featuredProductId === 'empty';
  const isFeaturedExpired = Boolean(featuredExpiresAt && Date.now() > featuredExpiresAt);

  // Resolved list of all active (non-expired) featured products in order
  const featuredProducts: Product[] = (() => {
    if (isEmptyFeatured || isFeaturedExpired) return [];
    const ids = featuredProductIds.length > 0
      ? featuredProductIds
      : (featuredProductId && !isDefaultFeatured ? [featuredProductId] : []);
    return ids
      .map((id) => {
        const p = products.find((prod) => prod.id === id);
        if (p) return p;
        const sub = submissions.find((s) => s.id === id);
        if (sub) return submissionToProduct(sub, 1);
        return undefined;
      })
      .filter((p): p is Product => {
        if (!p) return false;
        if (p.sponsorExpiresAt && Date.now() > p.sponsorExpiresAt) return false;
        return true;
      });
  })();

  const explicitFeaturedProduct = featuredProducts[0] || null;

  // Only submitted directory products belong in the leaderboard/rankings table (exclude sponsor-only ads)
  const directoryProducts = products.filter((p) => !isSponsorOnlyProduct(p));
  const sortedByRankProducts = [...directoryProducts].sort(compareProductsByRank);
  const topProduct = explicitFeaturedProduct || sortedByRankProducts[0] || null;

  // Compute isUserOwned dynamically from submittedBy or myProductId
  const markOwnership = (p: Product) => ({
    ...p,
    isUserOwned: !!(
      (user && p.submittedBy && p.submittedBy === user.id) ||
      (myProductId && p.id === myProductId) ||
      p.isUserOwned
    ),
  });
  const topThreeProducts = sortedByRankProducts.slice(0, 3).map((p, idx) => ({
    ...markOwnership(p),
    rank: idx + 1,
  }));

  const pendingReviewCount = submissions.filter((s) => s.status === 'under_review').length;

  // Derived directory stats for the public homepage
  const newestListings = [...directoryProducts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 9);

  // Load comments from Supabase once on mount and derive per-product counts
  useEffect(() => {
    fetchComments().then((all) => {
      setComments(all);
      const counts: Record<string, number> = {};
      for (const c of all) {
        counts[c.productId] = (counts[c.productId] ?? 0) + 1;
      }
      setCommentCounts(counts);
    });
  }, []);

  // Post a comment (optimistic locally, persisted to Supabase when available)
  const handleAddComment = (
    productId: string,
    content: string,
    userName: string,
    userEmail?: string,
    userAvatar?: string
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const comment: Comment = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId,
      userName: userName.trim() || 'Anonymous',
      userEmail,
      userAvatar,
      content: trimmed,
      createdAt: Date.now(),
    };
    setComments((prev) => [...prev, comment]);
    setCommentCounts((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
    addComment({ productId, userName: comment.userName, userEmail, userAvatar, content: trimmed }).then((saved) => {
      if (saved) {
        setComments((prev) => prev.map((c) => (c.id === comment.id ? saved : c)));
      }
    });
  };

  // Seed the traffic rail from stored products once data is loaded
  useEffect(() => {
    if (!productsLoaded || products.length === 0) return;
    setLiveFeed((prev) => {
      if (prev.length > 0) return prev;
      const seeded = [...products]
        .filter((p) => (p.clicks ?? 0) > 0)
        .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
        .slice(0, 8)
        .map((p) => ({
          id: `seed-${p.id}`,
          productId: p.id,
          name: p.name,
          kind: 'visit' as const,
          time: p.updatedAt ?? Date.now(),
        }));
      return seeded;
    });
  }, [productsLoaded, products.length]);
  // Count matching products for a category, handling comma-separated categories (e.g. "Developer Tools, SaaS & Indie")
  const getCategoryProductCount = React.useCallback(
    (cat: Category, list: Product[]): number => {
      if (cat === 'All') return list.length;
      const target = cat.trim().toLowerCase();
      return list.filter((p) => {
        if (!p.category) return false;
        if (p.category.trim().toLowerCase() === target) return true;
        const parts = p.category.split(',').map((c) => c.trim().toLowerCase());
        return parts.includes(target);
      }).length;
    },
    []
  );

  const directoryCategories = React.useMemo(() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const p of directoryProducts) {
      if (p.category) {
        const parts = p.category.split(',').map((c) => c.trim()).filter(Boolean);
        for (const cat of parts) {
          if (!seen.has(cat)) {
            seen.add(cat);
            cats.push(cat);
          }
        }
      }
    }
    if (cats.length > 0) {
      try {
        localStorage.setItem('topsaas_directory_categories_v1', JSON.stringify(cats));
      } catch { }
      return cats;
    }
    // Fallback on initial cold load before network request finishes
    try {
      const cached = localStorage.getItem('topsaas_directory_categories_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return [
      'Developer Tools',
      'SaaS & Indie',
      'Productivity',
      'Marketing & SEO',
      'AI Tools',
      'HR & Hiring',
      'Design & UI',
    ];
  }, [directoryProducts]);

  // Weekly launch rounds: scope products to the selected week, upvote-ranked
  const weekScopedProducts = selectedWeek
    ? directoryProducts.filter((p) => {
      if (isInWeek(p.createdAt, selectedWeek)) return true;
      // Auto weekly relaunch for users who opted for $5/week weekly relaunch
      if (p.autoRelaunch) return true;
      if (p.relaunchWeeks && selectedWeek.weekNumber && p.relaunchWeeks.includes(selectedWeek.weekNumber)) return true;
      if (p.lastRelaunchedAt && isInWeek(p.lastRelaunchedAt, selectedWeek)) return true;
      return false;
    })
    : directoryProducts;

  // Helper to determine if a product has an active deal/discount/promo code
  const isProductDeal = (p: Product) =>
    Boolean(
      (p.offerDiscount && p.offerDiscount.trim().length > 0) ||
      (p.offerCode && p.offerCode.trim().length > 0) ||
      (p.offerDetails && p.offerDetails.trim().length > 0)
    );

  // Total exclusive deals across all live products
  const totalDealsCount = React.useMemo(() => {
    return directoryProducts.filter(isProductDeal).length;
  }, [directoryProducts]);

  // Filter products by category, search query, and deals filter.
  // Weekly view ranks by engagement earned that week; All Time uses cumulative engagement.
  const weekComparator = selectedWeek
    ? compareProductsForWeek(selectedWeek)
    : compareProductsByRank;
  const filteredProducts = weekScopedProducts
    .filter((p) => {
      const productCats = p.category ? p.category.split(',').map((c) => c.trim().toLowerCase()) : [];
      const matchesCat =
        selectedCategory === 'All' ||
        p.category === selectedCategory ||
        productCats.includes(selectedCategory.toLowerCase());
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.tagline.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query));
      const matchesSteals = !stealsOnly || isProductDeal(p);
      return matchesCat && matchesQuery && matchesSteals;
    })
    .map(markOwnership)
    .sort(weekComparator);

  // Featured placements shown inside the ranked feed. When a visitor filters to
  // a category, only featured products in that category stay pinned. This is
  // what "top spot when visitors filter your category" means, and it keeps
  // off-category ads out of a filtered feed.
  const feedFeaturedProducts = selectedCategory === 'All'
    ? featuredProducts
    : featuredProducts.filter((p) => {
      const productCats = p.category ? p.category.split(',').map((c) => c.trim().toLowerCase()) : [];
      return p.category === selectedCategory || productCats.includes(selectedCategory.toLowerCase());
    });

  // Promoted / featured product used in the rails and mid-board banner
  const promotedProduct = (!isFeaturedExpired && featuredProductId)
    ? products.find((p) => p.id === featuredProductId) || null
    : null;

  // Last week's best (previous completed launch round)
  const currentWeekInfo = getWeekInfo(Date.now());
  const lastWeekInfo = currentWeekInfo.weekNumber > 1
    ? getWeekByNumber(currentWeekInfo.weekNumber - 1)
    : null;
  const lastWeekBest = lastWeekInfo
    ? [...directoryProducts]
      .filter((p) => {
        if (isInWeek(p.createdAt, lastWeekInfo)) return true;
        if (p.autoRelaunch) return true;
        if (p.lastRelaunchedAt && isInWeek(p.lastRelaunchedAt, lastWeekInfo)) return true;
        return Boolean(p.relaunchWeeks?.includes(lastWeekInfo.weekNumber));
      })
      .sort(compareProductsForWeek(lastWeekInfo))
    : [];

  // Last month's best (previous calendar month)
  const nowDate = new Date();
  const lastMonthReference = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 15).getTime();
  const lastMonthKey = getMonthKey(lastMonthReference);
  const lastMonthLabel = formatMonthLabel(lastMonthReference);
  const lastMonthBest = [...directoryProducts]
    .filter((p) => isInMonth(p.createdAt, lastMonthReference))
    .sort(compareProductsForMonth(lastMonthKey));

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stealsOnly]);

  // Pagination calculation (50 per page on filtered list)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  // Keep currentPage valid if products change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, totalPages, currentPage]);

  // Global top navigation — rendered above every route
  const handleTabChange = (tab: DirectoryTab) => {
    playSound('click', soundEnabled);
    const nextRoute =
      tab === 'saas-ideas'
        ? '/ideas'
        : tab === 'mrr-calculator'
          ? '/mrr-calculator'
          : tab === 'pricing'
            ? '/pricing'
            : '/';
    const pageTitle =
      tab === 'pricing'
        ? 'Pricing'
        : tab === 'saas-ideas'
          ? 'SaaS Ideas'
          : tab === 'mrr-calculator'
            ? 'SaaS MRR Calculator'
            : 'Directory';
    setCurrentRoute(nextRoute);
    try {
      window.history.pushState({}, pageTitle, nextRoute);
    } catch { }
    if (tab === 'directory') {
      setSelectedCategory('All');
    }
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPricing = () => {
    handleTabChange('pricing');
  };

  const handleNavigateLegal = (doc: 'privacy' | 'terms') => {
    setCurrentRoute(`/${doc}`);
    try { window.history.pushState('', document.title, `/${doc}`); } catch { }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sponsors shown on the public rails are display-only adapters of sponsor
  // rows. Featured products take priority, so linked sponsors are hidden.
  const activeRailSponsors = sponsorRailsEnabled
    ? sponsors
      .filter((s) => isLiveSponsor(s))
      .filter(
        (s) =>
          !(s.productId && (featuredProductIds.includes(s.productId) || s.productId === featuredProductId))
      )
      .map(sponsorToDisplayProduct)
    : [];

  const isSubmitPage =
    currentRoute === '/submit' ||
    (typeof window !== 'undefined' &&
      (window.location.pathname === '/submit' ||
        window.location.pathname.startsWith('/submit/') ||
        window.location.hash.includes('submit')));

  const globalHeader = (
    <div className="sticky top-0 z-40 w-full">
      {/* Mobile-only Infinite Scrolling Sponsors ABOVE Top Nav - hidden on /submit page */}
      {!isSubmitPage && (
        <MobileTopSponsorTicker
          enabled={sponsorRailsEnabled}
          sponsors={activeRailSponsors}
          soundEnabled={soundEnabled}
          onTrackClick={handleTrackClick}
          onOpenProduct={handleOpenProduct}
          onOpenFeaturedSpotModal={() => {
            setFeaturedModalMode('sponsor');
            setIsFeaturedSpotModalOpen(true);
          }}
        />
      )}
      <Header
        onGoHome={handleBackToLeaderboard}
        onOpenSubmit={handleTopNavSubmit}
        onSignIn={handleSignIn}
        onGoToProfile={handleGoToProfile}
        user={user}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </div>
  );

  // Shared modals for every route. The sponsor ticker lives in the header, so
  // every route that renders the header needs the modal mounted too. Without
  // this, "Claim spot" on routes like /profile or /trending flipped the state
  // but rendered nothing until the user navigated to a route that mounted it.
  const globalModals = (
    <>
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSignIn={handleSignIn}
      />
      <FeaturedSpotModal
        isOpen={isFeaturedSpotModalOpen}
        onClose={() => setIsFeaturedSpotModalOpen(false)}
        products={products}
        user={user}
        mode={featuredModalMode}
        featuredProductIds={featuredProductIds}
        initialTier={featuredInitialTier}
        soundEnabled={soundEnabled}
        onActivateSponsor={handleActivateSponsorTrial}
        onActivateFeatured={handleActivateFeatured}
        onOpenSignInModal={() => {
          setIsFeaturedSpotModalOpen(false);
          setIsSignInModalOpen(true);
        }}
        onOpenSubmitModal={() => {
          setIsFeaturedSpotModalOpen(false);
          handleOpenSubmit();
        }}
      />
    </>
  );

  // 0. PAYMENT SUCCESS ROUTE (/payment-success)
  if (currentRoute === '/payment-success') {
    return (
      <>
        {globalHeader}
        <PaymentSuccess
          onBackToDirectory={handleBackToLeaderboard}
          soundEnabled={soundEnabled}
          onActivateFeatured={(productId) => {
            setFeaturedProductId(productId);
          }}
        />
        {globalModals}
      </>
    );
  }

  // 0.2 PRICING PAGE ROUTE (/pricing)
  if (currentRoute === '/pricing') {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-mint-500/20 selection:text-neutral-900 font-sans">
        {globalHeader}
        <PricingPage
          onOpenSubmit={(plan) => {
            if (plan === 'free_relaunch') {
              try {
                localStorage.setItem('topsaas_submit_auto_relaunch', 'true');
              } catch { }
            }
            handleOpenSubmit();
          }}
          onOpenSponsor={(tier) => {
            playSound('click', soundEnabled);
            setFeaturedModalMode('sponsor');
            if (tier) {
              setFeaturedInitialTier(tier);
            }
            setIsFeaturedSpotModalOpen(true);
          }}
          onOpenFeaturedSpot={(tier) => {
            playSound('click', soundEnabled);
            setFeaturedModalMode('featured');
            if (tier) {
              setFeaturedInitialTier(tier);
            }
            setIsFeaturedSpotModalOpen(true);
          }}
          onGoHome={handleBackToLeaderboard}
          soundEnabled={soundEnabled}
        />
        <RichFooter
          totalProducts={directoryProducts.length}
          soundEnabled={soundEnabled}
          onOpenSubmit={handleOpenSubmit}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onSelectCategory={setSelectedCategory}
          onOpenPrivacy={() => handleNavigateLegal('privacy')}
          onOpenTerms={() => handleNavigateLegal('terms')}
          onOpenPricing={handleOpenPricing}
          className="border-t border-neutral-200 bg-neutral-100"
        />

        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignIn}
        />
        <FeaturedSpotModal
          isOpen={isFeaturedSpotModalOpen}
          onClose={() => setIsFeaturedSpotModalOpen(false)}
          products={products}
          user={user}
          mode={featuredModalMode}
          featuredProductIds={featuredProductIds}
          initialTier={featuredInitialTier}
          soundEnabled={soundEnabled}
          onActivateSponsor={handleActivateSponsorTrial}
          onActivateFeatured={handleActivateFeatured}
          onOpenSignInModal={() => {
            setIsFeaturedSpotModalOpen(false);
            setIsSignInModalOpen(true);
          }}
          onOpenSubmitModal={() => {
            setIsFeaturedSpotModalOpen(false);
            handleOpenSubmit();
          }}
        />
        <HowItWorksModal
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
          onOpenSubmit={() => {
            setIsHowItWorksOpen(false);
            handleOpenSubmit();
          }}
          soundEnabled={soundEnabled}
        />
      </div>
    );
  }

  // 0.5 PROFILE PAGE ROUTE (/profile)
  if (currentRoute === '/profile') {
    if (!authLoaded) {
      return (
        <>
          {globalHeader}
          <div className="min-h-screen bg-white text-neutral-900 font-sans">
            <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-neutral-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-40 rounded bg-neutral-200 animate-pulse" />
                  <div className="h-3 w-56 rounded bg-neutral-200 animate-pulse" />
                </div>
              </div>
              <SkeletonRows count={3} />
            </div>
          </div>
          {globalModals}
        </>
      );
    }
    if (!user) {
      setIsSignInModalOpen(true);
      setCurrentRoute('/');
      return null;
    }
    return (
      <>
        {globalHeader}
        <React.Suspense fallback={<div className="mx-auto w-full max-w-4xl px-4 py-8"><SkeletonRows count={3} /></div>}>
          <ProfilePage
            user={user}
            allProducts={products}
            allSubmissions={submissions}
            onBack={handleBackToLeaderboard}
            onSignOut={handleSignOut}
            onOpenSubmit={handleOpenSubmit}
            onOpenFeaturedSpotModal={() => {
              setFeaturedModalMode('sponsor');
              setIsFeaturedSpotModalOpen(true);
            }}
            onDeleteProduct={(productId) => setProducts((prev) => prev.filter((p) => p.id !== productId))}
            onUpdateProduct={handleUpdateProduct}
            onSelectProduct={handleOpenProduct}
            soundEnabled={soundEnabled}
          />
        </React.Suspense>
        {globalModals}
      </>
    );
  }

  // 1.0 STANDALONE SVG BADGE ROUTE (/badge/:id)
  if (currentRoute === 'badge') {
    return (
      <BadgeRoute
        productId={productRouteId || ''}
        products={products}
        submissions={submissions}
      />
    );
  }

  // 1.5 PRODUCT DETAIL ROUTE (/products/:name or legacy /product/:id)
  if (currentRoute === 'product') {
    const routeId = productRouteId || '';

    // Listings are addressed by their app name or deterministic id. Both the published
    // `prod-<id>` form, bare id, and clean app name resolve, so old links keep working.
    let rawProduct = routeId
      ? products.find((p) => matchesProductIdentifier(p, routeId)) || null
      : null;

    // A submission with no published listing yet (for example an owner previewing
    // their own pending entry) renders straight from the submission, or enriches product details.
    const matchingSub = routeId ? submissions.find((s) => matchesProductIdentifier({ id: s.id, name: s.name }, routeId)) : null;
    if (!rawProduct && matchingSub) {
      rawProduct = submissionToProduct(matchingSub, products.length + 1);
    } else if (rawProduct && matchingSub) {
      const isBoilerplate = (d?: string | null) => !d || /is a high-quality product in the/i.test(d);
      const chosenDescription =
        (matchingSub.description && !isBoilerplate(matchingSub.description) ? matchingSub.description : undefined) ||
        (rawProduct.description && !isBoilerplate(rawProduct.description) ? rawProduct.description : undefined) ||
        matchingSub.description ||
        rawProduct.description;

      rawProduct = {
        ...rawProduct,
        description: chosenDescription,
        problemItSolves: matchingSub.problemItSolves || rawProduct.problemItSolves,
        solution: matchingSub.solution || rawProduct.solution,
        uniqueSellingPoint: matchingSub.uniqueSellingPoint || rawProduct.uniqueSellingPoint,
        targetAudience: matchingSub.targetAudience || rawProduct.targetAudience,
        screenshots: (rawProduct.screenshots && rawProduct.screenshots.length > 0)
          ? rawProduct.screenshots
          : (matchingSub.screenshots && matchingSub.screenshots.length > 0 ? matchingSub.screenshots : rawProduct.screenshots),
        demoVideoUrl: rawProduct.demoVideoUrl || matchingSub.demoVideoUrl,
      };
    }

    const rankIndex = rawProduct
      ? sortedByRankProducts.findIndex(
        (p) => p.id === rawProduct!.id || matchesProductIdentifier(p, rawProduct!.id)
      )
      : -1;
    const dynamicRank = rawProduct ? (rankIndex >= 0 ? rankIndex + 1 : (rawProduct.rank || 1)) : 1;
    const product = rawProduct ? { ...rawProduct, rank: dynamicRank } : null;
    if (!product) {
      if (!productsLoaded) {
        return (
          <>
            {globalHeader}
            <SkeletonProductPage onBack={handleBackToLeaderboard} />
            {globalModals}
          </>
        );
      }
      return (
        <>
          {globalHeader}
          <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-sans">
            <div className="text-center space-y-3">
              <h2 className="text-lg font-bold">Product not found</h2>
              <p className="text-sm text-neutral-400">This listing may have been removed.</p>
              <button
                onClick={() => {
                  setCurrentRoute('/');
                  try { window.history.pushState('', document.title, '/'); } catch { }
                }}
                className="mt-2 rounded-xl bg-white text-black px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
          {globalModals}
        </>
      );
    }
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between font-sans">
        {globalHeader}
        <ProductPage
          product={markOwnership(product)}
          topProduct={topProduct || product}
          allProducts={sortedByRankProducts.map((p, idx) => ({ ...markOwnership(p), rank: idx + 1 }))}
          sponsors={sponsors
            .filter((s) => isLiveSponsor(s) && s.productId !== product.id)
            .map(sponsorToDisplayProduct)}
          onOpenFeaturedSpotModal={() => {
            setFeaturedModalMode('sponsor');
            setIsFeaturedSpotModalOpen(true);
          }}
          comments={comments.filter((c) => c.productId === product.id)}
          soundEnabled={soundEnabled}
          isSignedIn={!!user}
          userId={user?.id}
          isOwner={Boolean(
            markOwnership(product).isUserOwned ||
            (user && product.submittedBy && (product.submittedBy === user.id || (user.email && product.submittedBy.toLowerCase() === user.email.toLowerCase())))
          )}
          userName={submitterName}
          userEmail={user?.email}
          userAvatar={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
          onOpenSignIn={() => setIsSignInModalOpen(true)}
          onAddComment={handleAddComment}
          onBack={() => {
            setCurrentRoute('/');
            try { window.history.pushState('', document.title, '/'); } catch { }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectProduct={(p) => {
            setCurrentRoute('product');
            const slug = getProductSlug(p);
            setProductRouteId(slug || p.id);
            try { window.history.pushState({}, p.name, `/products/${encodeURIComponent(slug || p.id)}`); } catch { }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShare={(p) => setShareProduct(p)}
          onTrackClick={handleTrackClick}
          onUpvote={handleUpvote}
          isUpvoted={isProductUpvoted(product.id, userUpvotes)}
        />
        <RichFooter
          totalProducts={directoryProducts.length}
          soundEnabled={soundEnabled}
          onOpenSubmit={handleOpenSubmit}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onSelectCategory={setSelectedCategory}
          onOpenPrivacy={() => {
            setCurrentRoute('/privacy');
            try { window.history.pushState('', document.title, '/privacy'); } catch { }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenTerms={() => {
            setCurrentRoute('/terms');
            try { window.history.pushState('', document.title, '/terms'); } catch { }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPricing={handleOpenPricing}
        />
        <ShareModal
          product={shareProduct}
          isOpen={!!shareProduct}
          onClose={() => setShareProduct(null)}
          soundEnabled={soundEnabled}
        />
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignIn}
        />
        <FeaturedSpotModal
          isOpen={isFeaturedSpotModalOpen}
          onClose={() => setIsFeaturedSpotModalOpen(false)}
          products={products}
          user={user}
          mode={featuredModalMode}
          featuredProductIds={featuredProductIds}
          initialTier={featuredInitialTier}
          soundEnabled={soundEnabled}
          onActivateSponsor={handleActivateSponsorTrial}
          onActivateFeatured={handleActivateFeatured}
          onOpenSignInModal={() => {
            setIsFeaturedSpotModalOpen(false);
            setIsSignInModalOpen(true);
          }}
          onOpenSubmitModal={() => {
            setIsFeaturedSpotModalOpen(false);
            handleOpenSubmit();
          }}
        />
      </div>
    );
  }

  // 1.6 REPO DETAIL ROUTE (/repo/:owner/:name)
  if (currentRoute === 'repo') {
    const repoId = repoRouteId || '';
    const backToHome = () => {
      setCurrentRoute('/');
      try {
        window.history.pushState('', document.title, '/');
      } catch { }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between font-sans">
        {globalHeader}
        <React.Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-8"><SkeletonRows count={4} /></div>}>
          <RepoDetailPage
            repoId={repoId}
            soundEnabled={soundEnabled}
            onBack={backToHome}
            onSelectRepo={handleOpenRepo}
            sponsors={activeRailSponsors}
            onSelectProduct={handleOpenProduct}
            onTrackClick={handleTrackClick}
            onOpenFeaturedSpotModal={() => {
              setFeaturedModalMode('sponsor');
              setIsFeaturedSpotModalOpen(true);
            }}
            onOpenFeatured={() => {
              setFeaturedModalMode('featured');
              if (!user) {
                setIsSignInModalOpen(true);
              } else {
                setIsFeaturedSpotModalOpen(true);
              }
            }}
          />
        </React.Suspense>
        {globalModals}
      </div>
    );
  }

  // 1.25 SUBMIT / LAUNCH A PRODUCT PAGE ROUTE (/submit)
  if (currentRoute === '/submit') {
    if (!authLoaded) {
      return (
        <>
          {globalHeader}
          <div className="min-h-screen bg-white text-neutral-900 flex items-center justify-center font-sans">
            <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
          </div>
          {globalModals}
        </>
      );
    }
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between font-sans">
        {globalHeader}
        <React.Suspense fallback={<div className="mx-auto w-full max-w-2xl px-4 py-8"><SkeletonRows count={4} /></div>}>
          <SubmitPage
            isSignedIn={!!user}
            defaultCreatorName={submitterName}
            defaultCreatorAvatar={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''}
            onBack={handleBackToLeaderboard}
            onSignInRequest={() => setIsSignInModalOpen(true)}
            onSubmit={handleConfirmSubmit}
            onViewListing={(productId) => {
              setCurrentRoute('product');
              const targetProd = products.find((p) => matchesProductIdentifier(p, productId));
              const slug = targetProd ? getProductSlug(targetProd) : productId;
              setProductRouteId(slug || productId);
              try {
                window.history.pushState({}, targetProd?.name || 'Product', `/products/${encodeURIComponent(slug || productId)}`);
              } catch { }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            soundEnabled={soundEnabled}
            products={products}
            submissions={submissions}
            onUpvote={handleUpvote}
            userUpvotes={userUpvotes}
          />
        </React.Suspense>
        <RichFooter
          totalProducts={directoryProducts.length}
          soundEnabled={soundEnabled}
          onOpenSubmit={handleOpenSubmit}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onSelectCategory={setSelectedCategory}
          onOpenPrivacy={() => {
            setCurrentRoute('/privacy');
            try { window.history.pushState('', document.title, '/privacy'); } catch { }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenTerms={() => {
            setCurrentRoute('/terms');
            try { window.history.pushState('', document.title, '/terms'); } catch { }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPricing={handleOpenPricing}
        />
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignIn}
        />
        <FeaturedSpotModal
          isOpen={isFeaturedSpotModalOpen}
          onClose={() => setIsFeaturedSpotModalOpen(false)}
          products={products}
          user={user}
          mode={featuredModalMode}
          featuredProductIds={featuredProductIds}
          initialTier={featuredInitialTier}
          soundEnabled={soundEnabled}
          onActivateSponsor={handleActivateSponsorTrial}
          onActivateFeatured={handleActivateFeatured}
          onOpenSignInModal={() => {
            setIsFeaturedSpotModalOpen(false);
            setIsSignInModalOpen(true);
          }}
          onOpenSubmitModal={() => {
            setIsFeaturedSpotModalOpen(false);
            handleOpenSubmit();
          }}
        />
      </div>
    );
  }

  // 1. ADMIN ACCEPT PAGE ROUTE (/accept)
  if (currentRoute === '/accept') {
    // If admin session is not unlocked, show dedicated Admin Login Gate (no main site header)
    if (!adminSessionUnlocked) {
      return (
        <AdminLoginGate
          soundEnabled={soundEnabled}
          onSuccess={() => {
            setAdminSessionUnlocked(true);
            setIsAdmin(true);
            refreshAdminSubmissions();
          }}
          onBackToHome={handleBackToLeaderboard}
        />
      );
    }
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between font-sans">
        <React.Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-8"><SkeletonRows count={6} /></div>}>
          <AdminAcceptPage
            submissions={submissions}
            products={products}
            sponsors={sponsors}
            onCreateSponsor={handleCreateSponsor}
            onUpdateSponsor={handleUpdateSponsor}
            onEndSponsor={handleEndSponsor}
            onPauseSponsor={handlePauseSponsor}
            onRefreshSubmissions={refreshAdminSubmissions}
            onAcceptSubmission={handleAcceptSubmission}
            onRejectSubmission={handleRejectSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onUpdateSubmission={handleUpdateSubmission}
            onRestoreSubmission={handleRestoreSubmission}
            onDelistProduct={handleDelistProduct}
            onAssignRank={handleAssignRank}
            onAutoRankByUpvotes={handleAutoRankByUpvotes}
            onBackToDirectory={handleBackToLeaderboard}
            onOpenSubmitModal={handleOpenSubmit}
            onSeedSampleSubmissions={handleSeedSampleSubmissions}
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            featuredProductId={featuredProductId}
            featuredExpiresAt={featuredExpiresAt}
            onSetFeatured={handleSetFeatured}
            featuredProductIds={featuredProductIds}
            onSetFeaturedProducts={handleSetFeaturedProducts}
            onSaveProductsOrder={handleSaveProductsOrder}
            onToggleVerified={handleToggleVerifiedProduct}
            onUpdateProduct={handleUpdateProduct}
            sponsorRailsEnabled={sponsorRailsEnabled}
            onToggleSponsorRails={handleToggleSponsorRails}
            featuredPosition={featuredPosition}
            onSetFeaturedPosition={handleSetFeaturedPosition}
            featuredPositions={featuredPositions}
            onSetProductFeaturedPosition={handleSetProductFeaturedPosition}
            onSignOutAdmin={() => {
              clearAdminSession();
              setAdminSessionUnlocked(false);
            }}
          />
        </React.Suspense>

        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignIn}
        />
      </div>
    );
  }

  // Legal Page Route (Privacy Policy & Terms of Service)
  if (currentRoute === '/privacy' || currentRoute === '/terms') {
    return (
      <>
        {globalHeader}
        <React.Suspense fallback={<div className="mx-auto w-full max-w-4xl px-4 py-8"><SkeletonRows count={3} /></div>}>
          <LegalPage
            initialDoc={currentRoute === '/terms' ? 'terms' : 'privacy'}
            onBack={handleBackToLeaderboard}
            onOpenSubmit={handleOpenSubmit}
            totalProducts={directoryProducts.length}
            soundEnabled={soundEnabled}
            onSelectCategory={setSelectedCategory}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            onOpenPricing={handleOpenPricing}
          />
        </React.Suspense>
        {globalModals}
      </>
    );
  }

  // Shared chrome (header + footer) for the standalone routes below.
  const routeChrome = (page: React.ReactNode) => (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-mint-500/20 selection:text-neutral-900 font-sans pb-16 lg:pb-0">
      {globalHeader}
      <React.Suspense fallback={<div className="mx-auto w-full max-w-7xl px-4 py-8"><SkeletonRows count={5} /></div>}>
        {page}
      </React.Suspense>
      <RichFooter
        totalProducts={directoryProducts.length}
        soundEnabled={soundEnabled}
        onOpenSubmit={handleOpenSubmit}
        onSelectCategory={setSelectedCategory}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenPrivacy={() => handleNavigateLegal('privacy')}
        onOpenTerms={() => handleNavigateLegal('terms')}
        onOpenPricing={handleOpenPricing}
      />
      {/* Sticky Bottom Infinite Scrolling Sponsors (Mobile Only) - hidden on /submit */}
      {!isSubmitPage && (
        <MobileBottomStickySponsorTicker
          enabled={sponsorRailsEnabled}
          sponsors={activeRailSponsors}
          soundEnabled={soundEnabled}
          onTrackClick={handleTrackClick}
          onOpenProduct={handleOpenProduct}
          onOpenFeaturedSpotModal={() => {
            setFeaturedModalMode('sponsor');
            setIsFeaturedSpotModalOpen(true);
          }}
        />
      )}
      {globalModals}
    </div>
  );

  // 1.7 TRENDING ROUTE (/trending)
  if (currentRoute === 'trending') {
    return routeChrome(<TrendingPage soundEnabled={soundEnabled} onOpenRepo={handleOpenRepo} />);
  }

  // 1.8 BUILD GUIDES LIST ROUTE (/guides)
  if (currentRoute === 'guides') {
    return routeChrome(<GuidesListPage soundEnabled={soundEnabled} />);
  }

  // 1.9 BUILD GUIDE DETAIL ROUTE (/guides/:slug)
  if (currentRoute === 'guide') {
    return routeChrome(
      <GuideDetailPage slug={guideSlug} soundEnabled={soundEnabled} onOpenRepo={handleOpenRepo} />
    );
  }

  // 1.10 SAAS MRR CALCULATOR ROUTE (/mrr-calculator)
  if (currentRoute === '/mrr-calculator') {
    return routeChrome(<MrrCalculatorPage soundEnabled={soundEnabled} />);
  }

  // 2. MAIN DIRECTORY HOMEPAGE ROUTE
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col justify-between selection:bg-mint-500/20 selection:text-neutral-900 font-sans pb-16 lg:pb-0">
      {globalHeader}
      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 space-y-4 sm:space-y-5 flex-1 pb-16 pt-4 sm:pt-6">

        {activeTab === 'saas-ideas' ? (
          <React.Suspense fallback={<SkeletonRows count={6} />}>
            <SaaSIdeas
              soundEnabled={soundEnabled}
              topProducts={topThreeProducts}
              productsLoaded={productsLoaded}
              featuredProductId={featuredProductId}
              featuredProduct={explicitFeaturedProduct}
              commentCounts={commentCounts}
              onOpenFeaturedSpotModal={() => {
                if (!user) {
                  setIsSignInModalOpen(true);
                } else {
                  setIsFeaturedSpotModalOpen(true);
                }
              }}
              onShareProduct={(p) => setShareProduct(p)}
              onTrackClick={handleTrackClick}
              onUpvote={handleUpvote}
              onOpenDetail={handleOpenProduct}
              onOpenRepo={handleOpenRepo}
              upvotedIds={userUpvotes}
            />
          </React.Suspense>
        ) : (
          <>
            {/* ── Hero: brand statement + search ── */}
            <HeroSponsorRails
              enabled={sponsorRailsEnabled}
              sponsors={activeRailSponsors}
              soundEnabled={soundEnabled}
              isLoading={!productsLoaded}
              onTrackClick={handleTrackClick}
              onOpenProduct={handleOpenProduct}
              onOpenFeaturedSpotModal={() => {
                setFeaturedModalMode('sponsor');
                if (!user) {
                  setIsSignInModalOpen(true);
                } else {
                  setIsFeaturedSpotModalOpen(true);
                }
              }}
            >
              <HomeHero
                totalProducts={directoryProducts.length}
                totalCategories={directoryCategories.length}
                searchQuery={searchQuery}
                onSearchChange={(v) => {
                  setSearchQuery(v);
                  setCurrentPage(1);
                }}
                onOpenSubmit={handleOpenSubmit}
                soundEnabled={soundEnabled}
                dealsCount={totalDealsCount}
                stealsOnly={stealsOnly}
                onToggleSteals={() => {
                  playSound('click', soundEnabled);
                  setStealsOnly((prev) => !prev);
                  setCurrentPage(1);
                }}
              />

              {/* ── Weekly launch view (horizontal): week selector ── */}
              <WeeklyLaunchView
                selectedWeek={selectedWeek}
                onSelectWeek={(w) => {
                  setSelectedWeek(w);
                  setCurrentPage(1);
                }}
                launchCount={selectedWeek ? weekScopedProducts.length : undefined}
                soundEnabled={soundEnabled}
              />

              {/* ── Directory board: centered ranked list within sponsor rails ── */}
              <section id="leaderboard-section" className="w-full pt-2">
                <div className="w-full space-y-3.5">
                  {/* Category bar + Steals Only toggle on the same line (right-side edge) */}
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Category chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none min-w-0 flex-1" role="navigation" aria-label="Browse by category">
                      {(['All', ...(selectedCategory !== 'All' && !directoryCategories.includes(selectedCategory) ? [selectedCategory] : []), ...directoryCategories] as Category[]).map((cat) => {
                        const count = getCategoryProductCount(cat, weekScopedProducts);
                        const active = selectedCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              playSound('click', soundEnabled);
                              setSelectedCategory(cat);
                              setCurrentPage(1);
                            }}
                            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${active
                              ? 'border-mint-500/60 bg-mint-500/15 text-mint-700'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-950'
                              }`}
                          >
                            <span className="whitespace-nowrap">{cat}</span>
                            {productsLoaded && (
                              <span className={`rounded-md px-1.5 py-px text-[9px] font-black font-mono-num ${active ? 'bg-mint-500/20 text-mint-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Controls on the right edge: Steals Only (hidden on mobile) */}
                    <div className="shrink-0 hidden sm:flex items-center gap-2 pl-1">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={stealsOnly}
                        onClick={(e) => {
                          playSound('click', soundEnabled);
                          if (!stealsOnly) {
                            try {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = (rect.left + rect.width / 2) / window.innerWidth;
                              const y = (rect.top + rect.height / 2) / window.innerHeight;
                              confetti({
                                particleCount: 24,
                                spread: 50,
                                origin: { x, y },
                                colors: ['#66cc88', '#f59e0b', '#38bdf8', '#fbbf24'],
                                ticks: 120,
                                gravity: 1.1,
                                scalar: 0.8,
                                disableForReducedMotion: true,
                              });
                            } catch { }
                          }
                          setStealsOnly((prev) => !prev);
                          setCurrentPage(1);
                        }}
                        title={stealsOnly ? 'Turn off Steals Only filter' : 'Show only tools with exclusive discounts (50% OFF, lifetime deals, promo codes)'}
                        className={`group hidden sm:inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer select-none ${stealsOnly
                          ? 'border-amber-400/70 bg-amber-50 text-amber-800 ring-1 ring-amber-400/40'
                          : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-950'
                          }`}
                      >
                        <Flame
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${stealsOnly ? 'text-amber-500 fill-amber-500/30 scale-110' : 'text-neutral-400 group-hover:text-amber-500'
                            }`}
                        />
                        <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                          Steals Only
                        </span>
                        {totalDealsCount > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-px text-[9px] font-black font-mono-num ${stealsOnly ? 'bg-amber-500/20 text-amber-800' : 'bg-neutral-100 text-neutral-600 group-hover:text-neutral-800'
                              }`}
                          >
                            {totalDealsCount}
                          </span>
                        )}

                        {/* Sliding switch track & knob */}
                        <span
                          className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${stealsOnly ? 'bg-amber-400' : 'bg-neutral-300 group-hover:bg-neutral-400'
                            }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-out ${stealsOnly ? 'translate-x-3' : 'translate-x-0'
                              }`}
                          />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Leaderboard Rendering */}
                  {!productsLoaded ? (
                    <div className="space-y-3">
                      {/* Top featured spot placeholder shimmer */}
                      <div className="h-[84px] sm:h-[88px] w-full rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-neutral-200 shrink-0" />
                          <div className="space-y-2">
                            <div className="h-3.5 sm:h-4 w-32 sm:w-44 rounded bg-neutral-200" />
                            <div className="h-2.5 sm:h-3 w-48 sm:w-72 rounded bg-neutral-200" />
                          </div>
                        </div>
                        <div className="h-8 sm:h-9 w-20 sm:w-24 rounded-xl bg-neutral-200 shrink-0" />
                      </div>
                      <SkeletonRows count={8} />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="space-y-3">
                      {/* Active, not expired featured products OR default open spot keep showing even when there are no other products */}
                      {currentPage === 1 && !isEmptyFeatured && (
                        <div className="space-y-3">
                          {feedFeaturedProducts.length > 0 ? (
                            feedFeaturedProducts.map((fp) => (
                              <SponsorTile
                                key={fp.id}
                                soundEnabled={soundEnabled}
                                product={fp}
                                onOpenProduct={handleOpenProduct}
                                onTrackClick={handleTrackClick}
                                onUpvote={handleUpvote}
                                upvoted={isProductUpvoted(fp.id, userUpvotes)}
                                onOpenFeaturedSpotModal={() => {
                                  setFeaturedModalMode('featured');
                                  if (!user) {
                                    setIsSignInModalOpen(true);
                                  } else {
                                    setIsFeaturedSpotModalOpen(true);
                                  }
                                }}
                              />
                            ))
                          ) : (
                            <SponsorTile
                              soundEnabled={soundEnabled}
                              product={null}
                              onOpenProduct={handleOpenProduct}
                              onTrackClick={handleTrackClick}
                              onUpvote={handleUpvote}
                              upvoted={false}
                              onOpenFeaturedSpotModal={() => {
                                setFeaturedModalMode('featured');
                                if (!user) {
                                  setIsSignInModalOpen(true);
                                } else {
                                  setIsFeaturedSpotModalOpen(true);
                                }
                              }}
                            />
                          )}
                        </div>
                      )}

                      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-12 text-center">
                        {selectedWeek && weekScopedProducts.length === 0 ? (
                          <>
                            <Trophy className="mx-auto h-10 w-10 text-neutral-700 mb-3" />
                            <h3 className="text-lg font-bold text-neutral-950">
                              {selectedWeek.isCurrent
                                ? (feedFeaturedProducts.length > 0 ? 'No other launches this week yet' : 'No launches this week yet')
                                : (feedFeaturedProducts.length > 0 ? `No other launches in ${selectedWeek.label} yet` : `No launches in ${selectedWeek.label} yet`)}
                            </h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5 font-medium">
                              The round is fresh. Be the first to launch your SaaS this week and take the #1 spot.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  setSelectedWeek(null);
                                  setCurrentPage(1);
                                }}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-neutral-200 bg-transparent px-3.5 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                              >
                                <span className="sm:hidden">All launches</span>
                                <span className="hidden sm:inline">All-time launches</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  handleOpenSubmit();
                                }}
                                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0" />
                                <span className="sm:hidden">Launch</span>
                                <span className="hidden sm:inline">Launch your SaaS</span>
                              </button>
                            </div>
                          </>
                        ) : stealsOnly ? (
                          <>
                            <Flame className="mx-auto h-10 w-10 text-amber-400 mb-3 animate-pulse" />
                            <h3 className="text-lg font-bold text-neutral-950">No exclusive deals found</h3>
                            <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 mb-5 font-medium">
                              {searchQuery.trim()
                                ? `No tools with exclusive discounts match "${searchQuery}". Try searching for another term or turn off Steals Only.`
                                : selectedCategory !== 'All'
                                  ? `No tools in "${selectedCategory}" have active promo codes or discounts right now. Check back soon or turn off Steals Only.`
                                  : 'No tools with active discounts match your current filters.'}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  setStealsOnly(false);
                                  setCurrentPage(1);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                              >
                                <span>Turn off Steals Only</span>
                              </button>
                              {(searchQuery || selectedCategory !== 'All') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playSound('click', soundEnabled);
                                    setSearchQuery('');
                                    setSelectedCategory('All');
                                    setCurrentPage(1);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-transparent px-3.5 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Clear Filters</span>
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <Trophy className="mx-auto h-10 w-10 text-neutral-700 mb-3" />
                            <h3 className="text-lg font-bold text-neutral-950">
                              {feedFeaturedProducts.length > 0 ? 'No other websites found' : 'No websites found'}
                            </h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5 font-medium">
                              {searchQuery.trim()
                                ? (feedFeaturedProducts.length > 0 ? `No other tools match "${searchQuery}". Try searching for another term or clear filters.` : `No tools match "${searchQuery}". Try searching for another term or clear filters.`)
                                : (feedFeaturedProducts.length > 0 ? 'No other websites in this category yet. Be the first to submit!' : 'No websites in this category yet. Be the first to submit!')}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  setSearchQuery('');
                                  setSelectedCategory('All');
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-transparent px-3.5 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" />
                                <span>Clear Filters</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  playSound('click', soundEnabled);
                                  handleOpenSubmit();
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>New Launch</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Featured sponsor(s) placed at Top (position 0) or default reserve spot placeholder */}
                      {currentPage === 1 && !isEmptyFeatured && (
                        feedFeaturedProducts.length > 0 ? (
                          feedFeaturedProducts.filter((fp) => (featuredPositions[fp.id] !== undefined ? featuredPositions[fp.id] : featuredPosition) === 0).length > 0 && (
                            <div className="space-y-3">
                              {feedFeaturedProducts
                                .filter((fp) => (featuredPositions[fp.id] !== undefined ? featuredPositions[fp.id] : featuredPosition) === 0)
                                .map((fp) => (
                                  <SponsorTile
                                    key={fp.id}
                                    soundEnabled={soundEnabled}
                                    product={fp}
                                    onOpenProduct={handleOpenProduct}
                                    onTrackClick={handleTrackClick}
                                    onUpvote={handleUpvote}
                                    upvoted={isProductUpvoted(fp.id, userUpvotes)}
                                    onOpenFeaturedSpotModal={() => {
                                      setFeaturedModalMode('featured');
                                      if (!user) {
                                        setIsSignInModalOpen(true);
                                      } else {
                                        setIsFeaturedSpotModalOpen(true);
                                      }
                                    }}
                                  />
                                ))}
                            </div>
                          )
                        ) : (
                          <SponsorTile
                            soundEnabled={soundEnabled}
                            product={null}
                            onOpenProduct={handleOpenProduct}
                            onTrackClick={handleTrackClick}
                            onUpvote={handleUpvote}
                            upvoted={false}
                            onOpenFeaturedSpotModal={() => {
                              setFeaturedModalMode('featured');
                              if (!user) {
                                setIsSignInModalOpen(true);
                              } else {
                                setIsFeaturedSpotModalOpen(true);
                              }
                            }}
                          />
                        )
                      )}

                      {/* Single-column row list */}
                      {paginatedProducts.map((p, index) => {
                        const currentRank = startIndex + index + 1;
                        const isLastItem = index === paginatedProducts.length - 1;

                        // Per-product featured items placed after this rank
                        const featuredAfterThis = feedFeaturedProducts.filter((fp) => {
                          const pos = featuredPositions[fp.id] !== undefined ? featuredPositions[fp.id] : featuredPosition;
                          if (pos === currentRank) return true;
                          if (isLastItem && pos > currentRank) return true;
                          return false;
                        });

                        return (
                          <React.Fragment key={p.id}>
                            <ProductRow
                              product={p}
                              rank={currentRank}
                              gradientVariant={
                                currentRank <= 3
                                  ? selectedWeek?.isCurrent
                                    ? 'amber'
                                    : selectedWeek
                                    ? 'blue'
                                    : 'none'
                                  : 'none'
                              }
                              soundEnabled={soundEnabled}
                              showVerified
                              commentCount={commentCounts[p.id] ?? 0}
                              onOpen={handleOpenProduct}
                              onUpvote={handleUpvote}
                              upvoted={isProductUpvoted(p.id, userUpvotes)}
                            />
                            {currentPage === 1 && !isEmptyFeatured && featuredAfterThis.length > 0 && (
                              <div className="pt-0.5 space-y-3">
                                {featuredAfterThis.map((fp) => (
                                  <SponsorTile
                                    key={fp.id}
                                    soundEnabled={soundEnabled}
                                    product={fp}
                                    onOpenProduct={handleOpenProduct}
                                    onTrackClick={handleTrackClick}
                                    onUpvote={handleUpvote}
                                    upvoted={isProductUpvoted(fp.id, userUpvotes)}
                                    onOpenFeaturedSpotModal={() => {
                                      setFeaturedModalMode('featured');
                                      if (!user) {
                                        setIsSignInModalOpen(true);
                                      } else {
                                        setIsFeaturedSpotModalOpen(true);
                                      }
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* Homepage Pagination */}
                      {totalPages > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={filteredProducts.length}
                          pageSize={pageSize}
                          onPageChange={(page) => {
                            setCurrentPage(page);
                            const tableSection = document.getElementById('leaderboard-section');
                            if (tableSection) {
                              tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else {
                              window.scrollTo({ top: 380, behavior: 'smooth' });
                            }
                          }}
                          soundEnabled={soundEnabled}
                        />
                      )}
                    </div>
                  )}

                </div>
              </section>

              {/* ── Period highlights ── */}
              <div className="w-full space-y-4 pb-2 pt-6">
                <BestOfSection
                  id="last-week-best"
                  title="Last Week's Best"
                  subtitle={
                    lastWeekInfo
                      ? `${lastWeekInfo.label} · ${formatWeekDateRange(lastWeekInfo, 'to')} · ranked by engagement earned that week`
                      : 'The previous launch round'
                  }
                  products={lastWeekBest}
                  emptyMessage={
                    lastWeekInfo
                      ? `No launches were ranked in ${lastWeekInfo.label}.`
                      : "Last week's round hasn't wrapped yet. Winners will appear here when this launch week ends."
                  }
                  soundEnabled={soundEnabled}
                  commentCounts={commentCounts}
                  isLoading={!productsLoaded}
                  onOpenProduct={handleOpenProduct}
                  onUpvote={handleUpvote}
                  isUpvoted={(productId) => isProductUpvoted(productId, userUpvotes)}
                />

                <BestOfSection
                  id="last-month-best"
                  title="Last Month's Best"
                  subtitle={`${lastMonthLabel} · ranked by that month's upvotes and comments`}
                  products={lastMonthBest}
                  emptyMessage="No launches were ranked last month."
                  soundEnabled={soundEnabled}
                  commentCounts={commentCounts}
                  isLoading={!productsLoaded}
                  onOpenProduct={handleOpenProduct}
                  onUpvote={handleUpvote}
                  isUpvoted={(productId) => isProductUpvoted(productId, userUpvotes)}
                />
              </div>
            </HeroSponsorRails>
          </>
        )}
      </main>

      {/* Footer */}
      <RichFooter
        totalProducts={directoryProducts.length}
        soundEnabled={soundEnabled}
        onOpenSubmit={handleOpenSubmit}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onSelectCategory={setSelectedCategory}
        onOpenPrivacy={() => {
          setCurrentRoute('/privacy');
          try { window.history.pushState('', document.title, '/privacy'); } catch { }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTerms={() => {
          setCurrentRoute('/terms');
          try { window.history.pushState('', document.title, '/terms'); } catch { }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPricing={handleOpenPricing}
      />

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
        onSignIn={handleSignIn}
      />


      {/* Share Modal */}
      <ShareModal
        product={shareProduct}
        isOpen={!!shareProduct}
        onClose={() => setShareProduct(null)}
        soundEnabled={soundEnabled}
      />

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        onOpenSubmit={() => {
          setIsHowItWorksOpen(false);
          handleOpenSubmit();
        }}
        soundEnabled={soundEnabled}
      />

      {/* Featured Spot Modal */}
      <FeaturedSpotModal
        isOpen={isFeaturedSpotModalOpen}
        onClose={() => setIsFeaturedSpotModalOpen(false)}
        products={products}
        user={user}
        mode={featuredModalMode}
        featuredProductIds={featuredProductIds}
        initialTier={featuredInitialTier}
        soundEnabled={soundEnabled}
        onActivateSponsor={handleActivateSponsorTrial}
        onActivateFeatured={handleActivateFeatured}
        onOpenSignInModal={() => {
          setIsFeaturedSpotModalOpen(false);
          setIsSignInModalOpen(true);
        }}
        onOpenSubmitModal={() => {
          setIsFeaturedSpotModalOpen(false);
          handleOpenSubmit();
        }}
      />

      {/* Sticky Bottom Infinite Scrolling Sponsor Ticker (Mobile Only) - hidden on /submit */}
      {!isSubmitPage && (
        <MobileBottomStickySponsorTicker
          enabled={sponsorRailsEnabled}
          sponsors={activeRailSponsors}
          soundEnabled={soundEnabled}
          onTrackClick={handleTrackClick}
          onOpenProduct={handleOpenProduct}
          onOpenFeaturedSpotModal={() => {
            setFeaturedModalMode('sponsor');
            setIsFeaturedSpotModalOpen(true);
          }}
        />
      )}

    </div>
  );
}
