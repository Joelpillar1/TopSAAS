import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { User } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_SUBMISSIONS } from './data/initialSubmissions';
import { Category, Product, WebsiteSubmission, Comment, SubmitProductDetails } from './types';
import { HeroClaimBanner } from './components/HeroClaimBanner';
import { BorderBeam } from './components/BorderBeam';
import { HomeHero } from './components/HomeHero';
import { LeaderboardTable } from './components/LeaderboardTable';
import { ProductCard } from './components/ProductCard';
import { HowItWorksModal } from './components/HowItWorksModal';
import { ShareModal } from './components/ShareModal';
import { Pagination } from './components/Pagination';
import { AdminAcceptPage } from './components/AdminAcceptPage';
import { RichFooter } from './components/RichFooter';
import { Header, DirectoryTab } from './components/Header';
import { SignInModal } from './components/SignInModal';
import { ProfilePage } from './components/ProfilePage';
import { PaymentSuccess } from './components/PaymentSuccess';
import { SubmitPage } from './components/SubmitPage';
import { SaaSIdeas } from './components/SaaSIdeas';
import { LegalPage } from './components/LegalPage';
import { PricingPage } from './components/PricingPage';
import { LegalTab } from './components/LegalModal';
import { playSound } from './utils/sound';
import confetti from 'canvas-confetti';
import { supabase } from './utils/supabase';
import { loadProducts, enrichProductsFromSubmissions, saveAllProducts, saveProductRanksDirect, debouncedSyncProducts, toggleUpvote, getUserUpvotes, getUpvoteCounts, checkIsAdmin, getGlobalFeaturedProduct, setGlobalFeaturedProduct, insertProductDirect, fetchComments, addComment, getCachedCommentsSync, submissionToProduct, isProductUpvoted, getGuestUpvotes, saveGuestUpvotes, incrementProductUpvotesDirect } from './utils/db';
import { getRecentWeeks, isInWeek } from './utils/weeks';
import { getWebsiteFavicon } from './utils/logo';
import { LayoutGrid, List, Table as TableIcon, Trophy, X, Plus, ShieldCheck, Loader2, Star, MessageCircle, Flame } from 'lucide-react';
import { FeaturedSpotModal } from './components/FeaturedSpotModal';
import { ProductPage } from './components/ProductPage';
import { BadgeRoute } from './components/BadgeRoute';
import { SkeletonGrid } from './components/SkeletonCard';
import { SkeletonTable } from './components/SkeletonTable';
import { timeAgo } from './components/ProductRow';
import { ProductTile } from './components/ProductTile';
import { SponsorTile } from './components/SponsorTile';
import { SpotlightCard, RailCard, FeedRow, PromotedCard, SponsoredLaunchBanner } from './components/DirectoryRails';
import { ProductLogo } from './components/ProductLogo';
import { GridFillerCell, useGridColumns } from './components/GridFiller';

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
  } catch {}
  return new Set();
}

/** Record a submission ID as permanently deleted so the merge won't re-add it */
function markSubmissionDeleted(id: string) {
  try {
    const deleted = getDeletedSubmissionIds();
    deleted.add(id);
    deleted.add(id.toLowerCase().replace(/\/$/, ''));
    localStorage.setItem(STORAGE_KEYS.DELETED_SUBMISSIONS, JSON.stringify([...deleted]));
  } catch {}
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
  } catch {}
}

export default function App() {
  // Navigation / Route state (/ vs /accept)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (/^\/product\//.test(path)) {
        return 'product';
      }
      if (/^\/badge\//.test(path)) {
        return 'badge';
      }
      if (path === '/accept' || hash === '#accept' || hash === '#/accept') {
        return '/accept';
      }
      if (path === '/payment-success' || hash === '#payment-success' || hash === '#/payment-success') {
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
    } catch {}
    return INITIAL_SUBMISSIONS;
  });
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);

  // Load submissions from Supabase on mount (Supabase DB is the authoritative source of truth)
  useEffect(() => {
    async function loadSubmissions() {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });
        if (!error && data) {
          const dbSubs = data.map(mapDbSubmission);
          setSubmissions(dbSubs);
          // Persist to localStorage inline (saveSubmissionsToStorage declared later)
          try {
            if (dbSubs.length === 0) {
              localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
            } else {
              localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(dbSubs));
            }
          } catch {}

          // Enrich live products with approved submission metadata
          const approvedSubs = dbSubs.filter((s) => s.status === 'approved');
          if (approvedSubs.length > 0) {
            // Real upvote counts so freshly converted submissions never show 0
            const upvoteCounts = await getUpvoteCounts();
            setProducts((currProducts) => {
              const existingUrls = new Set(currProducts.map((p) => p.url.toLowerCase().replace(/\/$/, '')));
              const missingApprovedProds: Product[] = [];

              const updatedExisting = currProducts.map((existingProd) => {
                const matchingSub = approvedSubs.find(
                  (s) =>
                    s.url.toLowerCase().replace(/\/$/, '') === existingProd.url.toLowerCase().replace(/\/$/, '') ||
                    s.id === existingProd.id ||
                    `prod-${s.id}` === existingProd.id
                );
                if (!matchingSub) return existingProd;
                return {
                  ...existingProd,
                  name: matchingSub.name || existingProd.name,
                  tagline: matchingSub.tagline || existingProd.tagline,
                  category: matchingSub.category || existingProd.category,
                  logoUrl: matchingSub.logoUrl || existingProd.logoUrl,
                  description: matchingSub.description || existingProd.description,
                  problemItSolves: matchingSub.problemItSolves || existingProd.problemItSolves,
                  solution: matchingSub.solution || existingProd.solution,
                  uniqueSellingPoint: matchingSub.uniqueSellingPoint || existingProd.uniqueSellingPoint,
                  targetAudience: matchingSub.targetAudience || existingProd.targetAudience,
                  pricingModel: matchingSub.pricingModel || existingProd.pricingModel,
                  twitterHandle: matchingSub.twitterHandle || existingProd.twitterHandle,
                  socials: matchingSub.socials && matchingSub.socials.length > 0 ? matchingSub.socials : existingProd.socials,
                  screenshots: matchingSub.screenshots && matchingSub.screenshots.length > 0 ? matchingSub.screenshots : existingProd.screenshots,
                  demoVideoUrl: matchingSub.demoVideoUrl || existingProd.demoVideoUrl,
                  creatorName: matchingSub.creatorName || existingProd.creatorName,
                  creatorUsername: matchingSub.creatorUsername || existingProd.creatorUsername,
                  creatorXHandle: matchingSub.creatorXHandle || existingProd.creatorXHandle,
                  creatorAvatar: matchingSub.creatorAvatar || existingProd.creatorAvatar,
                  creatorRole: matchingSub.creatorRole || existingProd.creatorRole,
                  offerDiscount: matchingSub.offerDiscount || existingProd.offerDiscount,
                  offerCode: matchingSub.offerCode || existingProd.offerCode,
                  offerUrl: matchingSub.offerUrl || existingProd.offerUrl,
                  offerDetails: matchingSub.offerDetails || existingProd.offerDetails,
                };
              });

              for (const appSub of approvedSubs) {
                const urlKey = appSub.url.toLowerCase().replace(/\/$/, '');
                if (!existingUrls.has(urlKey)) {
                  const newProd = submissionToProduct(appSub, currProducts.length + missingApprovedProds.length + 1);
                  missingApprovedProds.push(newProd);
                  existingUrls.add(urlKey);
                  insertProductDirect(newProd);
                }
              }

              const next = [...updatedExisting, ...missingApprovedProds].map((p, idx) => ({ ...p, rank: idx + 1 }));
              // Apply real upvote counts from the upvotes table
              const reconciled = next.map((p) => {
                const real = upvoteCounts.get(p.id);
                return real !== undefined ? { ...p, upvotes: real } : p;
              });
              if (missingApprovedProds.length > 0 || JSON.stringify(reconciled) !== JSON.stringify(currProducts)) {
                debouncedSyncProducts(reconciled);
                return reconciled;
              }
              return currProducts;
            });
          }
        }
      } catch {}
      setSubmissionsLoaded(true);
    }
    loadSubmissions();
  }, []);

  // Load persisted live products (sorted by rank)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
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
    } catch {}

    // Start with empty directory — no seed products
    return [];
  });

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Featured product (admin can set any product as featured, or user paid for it)
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

  // Load global featured product from Supabase on mount and check periodically
  useEffect(() => {
    getGlobalFeaturedProduct().then((config) => {
      if (config.productId !== undefined) {
        setFeaturedProductId(config.productId);
      }
    });

    const interval = setInterval(() => {
      getGlobalFeaturedProduct().then((config) => {
        setFeaturedProductId(config.productId);
      });
    }, 60_000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Submitter name auto-filled from Google profile
  const submitterName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || '';

  // Global / UI Audio SFX toggle (under the game: OFF by default, independent)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('topsaas_ui_sound');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false; // OFF by default as requested
  });

  // Active tab: derived from currentRoute so /ideas and /pricing survive reload
  const activeTab: DirectoryTab =
    currentRoute === '/ideas' ? 'saas-ideas' : currentRoute === '/pricing' ? 'pricing' : 'directory';

  // View layout
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEW_LAYOUT);
      if (saved === 'cards' || saved === 'table') return saved;
    } catch {}
    return 'cards';
  });

  // Search and Category filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  // One-Click Deals filter state ("Steals Only")
  const [stealsOnly, setStealsOnly] = useState<boolean>(false);

  // Pagination state for homepage (50 list per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const directoryGridColumns = useGridColumns();

  // Modals
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isFeaturedSpotModalOpen, setIsFeaturedSpotModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');

  // Live activity feed shown in the directory side rails
  const [liveFeed, setLiveFeed] = useState<FeedEvent[]>([]);
  const lastClickFeedRef = React.useRef<Record<string, number>>({});

  // Weekly launch board state (0 = current week, higher = older weeks)
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  // Default to the full directory so the page never opens on an empty round
  const [showAllTime, setShowAllTime] = useState<boolean>(true);
  const weekPickedByUserRef = React.useRef(false);

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

  // Product detail route state — resolved from /product/:id or /badge/:id
  const [productRouteId, setProductRouteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/^\/(?:product|badge)\/(.+)$/);
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
      const productMatch = path.match(/^\/product\/(.+)$/);
      if (badgeMatch) {
        setCurrentRoute('badge');
        setProductRouteId(decodeURIComponent(badgeMatch[1]));
      } else if (productMatch) {
        setCurrentRoute('product');
        setProductRouteId(decodeURIComponent(productMatch[1]));
      } else if (path === '/accept' || hash === '#accept' || hash === '#/accept') {
        setCurrentRoute('/accept');
      } else if (path === '/payment-success' || hash === '#payment-success' || hash === '#/payment-success') {
        setCurrentRoute('/payment-success');
      } else if (path === '/profile' || hash === '#profile' || hash === '#/profile') {
        setCurrentRoute('/profile');
      } else if (path === '/submit' || hash === '#submit' || hash === '#/submit') {
        setCurrentRoute('/submit');
      } else if (path === '/ideas' || hash === '#ideas' || hash === '#/ideas') {
        setCurrentRoute('/ideas');
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

  // Navigation handlers
  const handleBackToLeaderboard = () => {
    setCurrentRoute('/');
    try {
      window.history.pushState('', document.title, '/');
    } catch {}
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

  // Navigate to a product's detail page
  const handleOpenProduct = (product: Product) => {
    setCurrentRoute('product');
    setProductRouteId(product.id);
    try {
      window.history.pushState({}, product.name, `/product/${encodeURIComponent(product.id)}`);
    } catch {}
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
      } catch {}
    }
  };

  // Persist State Changes (products + sound + submissions to localStorage)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
      saveSubmissionsToStorage(submissions);
    } catch {}
  }, [products, soundEnabled, submissions]);

  // Persist view layout preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_LAYOUT, viewLayout);
    } catch {}
  }, [viewLayout]);

  // Subscribe to realtime changes on submissions table only when on admin accept review page
  useEffect(() => {
    if (!submissionsLoaded || !isAdmin || (currentRoute !== '/accept' && currentRoute !== 'accept')) return;
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

  // Auth: listen for session changes, get initial session, and save profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
      if (session?.user) saveUserProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        saveUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
        updated.forEach((sub) => {
          if (sub.submittedBy === user.id) {
            try {
              supabase.from('submissions').update({ submitted_by: user.id, backer_email: user.email }).eq('id', sub.id);
            } catch {}
          }
        });
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
      const dbProducts = await loadProducts();
      // Real upvote counts from the upvotes table (source of truth) — the stored
      // products.upvotes count can lag or be wiped by stale client syncs.
      const upvoteCounts = await getUpvoteCounts();

      // Repair the products table whenever a stored count is lower than reality.
      // Uses the security-definer increment RPC so even anonymous visitors can heal
      // counts (direct UPDATEs are RLS-restricted to signed-in users).
      const repairStoredUpvoteCounts = async (list: Product[]) => {
        for (const p of list) {
          const real = upvoteCounts.get(p.id);
          const stored = p.upvotes ?? 0;
          if (real === undefined || real <= stored) continue;
          try {
            const { error: rpcError } = await supabase.rpc('increment_product_upvotes', {
              p_product_id: p.id,
              p_delta: real - stored,
            });
            if (rpcError) {
              await supabase.from('products').update({ upvotes: real, updated_at: Date.now() }).eq('id', p.id);
            }
          } catch {}
        }
      };

      // The upvotes table is the authoritative record — display its count directly
      const applyRealUpvoteCounts = (list: Product[]): Product[] =>
        list.map((p) => {
          const real = upvoteCounts.get(p.id);
          return real !== undefined ? { ...p, upvotes: real } : p;
        });

      if (dbProducts !== null && dbProducts.length > 0) {
        let cachedSubs: WebsiteSubmission[] = [];
        try {
          const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
          if (raw) cachedSubs = JSON.parse(raw);
        } catch {}

        const sorted = [...dbProducts].sort((a, b) => {
          const rA = a.rank ?? 9999;
          const rB = b.rank ?? 9999;
          if (rA !== rB) return rA - rB;
          const upvoteDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
          if (upvoteDiff !== 0) return upvoteDiff;
          return (a.createdAt ?? 0) - (b.createdAt ?? 0);
        });

        const normalized = sorted.map((p, idx) => {
          const matchingSub = cachedSubs.find(
            (s) =>
              s.url.toLowerCase().replace(/\/$/, '') === p.url.toLowerCase().replace(/\/$/, '') ||
              s.id === p.id ||
              `prod-${s.id}` === p.id
          );
          if (!matchingSub) return { ...p, rank: idx + 1 };
          return {
            ...p,
            rank: idx + 1,
            name: p.name || matchingSub.name,
            tagline: p.tagline || matchingSub.tagline,
            category: p.category || matchingSub.category,
            logoUrl: p.logoUrl || matchingSub.logoUrl,
            description: p.description || matchingSub.description,
            problemItSolves: p.problemItSolves || matchingSub.problemItSolves,
            solution: p.solution || matchingSub.solution,
            uniqueSellingPoint: p.uniqueSellingPoint || matchingSub.uniqueSellingPoint,
            targetAudience: p.targetAudience || matchingSub.targetAudience,
            pricingModel: p.pricingModel || matchingSub.pricingModel,
            twitterHandle: p.twitterHandle || matchingSub.twitterHandle,
            socials: p.socials && p.socials.length > 0 ? p.socials : matchingSub.socials,
            screenshots: p.screenshots && p.screenshots.length > 0 ? p.screenshots : matchingSub.screenshots,
            demoVideoUrl: p.demoVideoUrl || matchingSub.demoVideoUrl,
            creatorName: p.creatorName || matchingSub.creatorName,
            creatorUsername: p.creatorUsername || matchingSub.creatorUsername,
            creatorXHandle: p.creatorXHandle || matchingSub.creatorXHandle,
            creatorAvatar: p.creatorAvatar || matchingSub.creatorAvatar,
            creatorRole: p.creatorRole || matchingSub.creatorRole,
            offerDiscount: p.offerDiscount || matchingSub.offerDiscount,
            offerCode: p.offerCode || matchingSub.offerCode,
            offerUrl: p.offerUrl || matchingSub.offerUrl,
            offerDetails: p.offerDetails || matchingSub.offerDetails,
          };
        });

        const normalizedWithCounts = applyRealUpvoteCounts(normalized);
        repairStoredUpvoteCounts(normalized); // heal DB rows whose stored counts lag reality
        setProducts(normalizedWithCounts);
        try {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(normalizedWithCounts));
          localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(normalizedWithCounts));
        } catch {}
      } else if (dbProducts !== null) {
        // Supabase is reachable but returned zero products — clear stale localStorage
        setProducts([]);
        try {
          localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
          localStorage.removeItem('topsaas_products_cache_v2');
        } catch {}
      }
      // If dbProducts is null (network/RLS error), keep localStorage as fallback
      setProductsLoaded(true);

      // Second pass: enrich products from the submissions table to restore any
      // fields that weren't saved to the products table (problem, solution, offers, socials…)
      if (dbProducts && dbProducts.length > 0) {
        const enriched = await enrichProductsFromSubmissions(dbProducts.sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)));
        if (enriched && enriched.length > 0) {
          const finalEnriched = applyRealUpvoteCounts(enriched.map((p, idx) => ({ ...p, rank: idx + 1 })));
          setProducts(finalEnriched);
          try {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(finalEnriched));
            localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(finalEnriched));
          } catch {}
        }
      }
    }
    load();
  }, []);

  // Check admin status and load user upvotes when signed in
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setUserUpvotes(new Set());
      try { localStorage.removeItem('topsaas_guest_upvotes'); } catch {}
      return;
    }
    checkIsAdmin().then(setIsAdmin);
    getUserUpvotes().then((dbVotes) => {
      setUserUpvotes(dbVotes);
    });
  }, [user]);

  // Save user profile to Supabase profiles table
  const saveUserProfile = async (u: User) => {
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: u.id,
        email: u.email || null,
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || null,
        avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
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

  // Submit now lives on its own page — every "New Launch" CTA routes there
  const handleOpenSubmit = () => {
    playSound('click', soundEnabled);
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }
    setCurrentRoute('/submit');
    try {
      window.history.pushState({}, 'Launch a product', '/submit');
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auth: sign out
  const handleSignOut = async () => {
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

  // Upvote a product (requires an account)
  const handleUpvote = async (product: Product) => {
    if (!user) {
      playSound('click', soundEnabled);
      setIsSignInModalOpen(true);
      return;
    }

    playSound('upvote', soundEnabled);

    const currentlyUpvoted = isProductUpvoted(product.id, userUpvotes);
    const willBeUpvoted = !currentlyUpvoted;
    const delta = willBeUpvoted ? 1 : -1;
    const altId = product.id.startsWith('prod-') ? product.id.replace(/^prod-/, '') : `prod-${product.id}`;

    // 1. Instant optimistic update for userUpvotes state
    setUserUpvotes((prev) => {
      const next = new Set(prev);
      if (willBeUpvoted) {
        next.add(product.id);
        next.add(altId);
      } else {
        next.delete(product.id);
        next.delete(altId);
      }
      return next;
    });

    // 2. Instant optimistic update of products count & live dynamic re-ranking
    let reRankedProducts: Product[] = [];
    setProducts((prev) => {
      const updated = prev.map((p) => {
        const isMatch =
          p.id === product.id ||
          p.id === altId ||
          (product.url && p.url && p.url.toLowerCase().replace(/\/$/, '') === product.url.toLowerCase().replace(/\/$/, ''));
        if (isMatch) {
          const nextUpvotes = Math.max(0, (p.upvotes ?? 0) + delta);
          return { ...p, upvotes: nextUpvotes, updatedAt: Date.now() };
        }
        return p;
      });

      const reRanked = [...updated].sort(compareProductsByRank).map((p, idx) => ({
        ...p,
        previousRank: p.rank !== (idx + 1) ? (p.rank ?? (idx + 1)) : p.previousRank,
        rank: idx + 1,
      }));
      reRankedProducts = reRanked;

      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(reRanked));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(reRanked));
      } catch {}

      return reRanked;
    });

    // 3. Background persistence to Supabase via toggleUpvote RPC
    toggleUpvote(product.id).then((rpcResult) => {
      if (rpcResult === null) {
        // If RPC returned null (e.g. constraints/network), fallback to direct increment or debounced sync
        incrementProductUpvotesDirect(product.id, delta).catch(() => {
          debouncedSyncProducts(reRankedProducts);
        });
      } else if (rpcResult !== willBeUpvoted) {
        // Reconcile state if remote RPC returned opposite
        setUserUpvotes((prev) => {
          const synced = new Set(prev);
          if (rpcResult) {
            synced.add(product.id);
            synced.add(altId);
          } else {
            synced.delete(product.id);
            synced.delete(altId);
          }
          return synced;
        });
      }
    }).catch(() => {
      debouncedSyncProducts(reRankedProducts);
    });
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
      screenshots: details.screenshots && details.screenshots.length > 0 ? details.screenshots.slice(0, 10) : undefined,
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

    try {
      const payload = toDbSubmission(newSubmission);
      const { error } = await supabase.from('submissions').insert(payload);
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
        if (payload.logo_url && !String(payload.logo_url).startsWith('data:image')) {
          minimal.logo_url = payload.logo_url;
        }
        if (payload.twitter_handle) minimal.twitter_handle = payload.twitter_handle;
        if (payload.target_audience) minimal.target_audience = payload.target_audience;
        if (payload.pricing_model) minimal.pricing_model = payload.pricing_model;
        await supabase.from('submissions').insert(minimal);
      }
    } catch (err) {
      console.warn('Error syncing submission to remote DB (stored locally):', err);
    }

    return subId;
  };

  // Admin Acceptance Pipeline: converts a submission into a live Product on the website
  const handleAcceptSubmission = async (sub: WebsiteSubmission) => {
    // 1. Update status to approved in submissions queue + Supabase
    const reviewedAt = Date.now();
    const approvedSub: WebsiteSubmission = { ...sub, status: 'approved', reviewedAt };

    setSubmissions((prev) => {
      const updated = prev.map((s) => (s.id === sub.id ? approvedSub : s));
      saveSubmissionsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('submissions').update({ status: 'approved', reviewed_at: reviewedAt }).eq('id', sub.id);
    } catch {}

    // 2. Add or update in live products
    let productToSync: Product | null = null;
    setProducts((prev) => {
      const existingIndex = prev.findIndex(
        (p) =>
          p.id === sub.id ||
          p.id === `prod-${sub.id}` ||
          `prod-${p.id}` === sub.id ||
          p.url.toLowerCase().replace(/\/$/, '') === sub.url.toLowerCase().replace(/\/$/, '')
      );

      let nextProducts: Product[];
      if (existingIndex >= 0) {
        nextProducts = prev.map((p, idx) =>
          idx === existingIndex
            ? {
                ...p,
                name: sub.name,
                tagline: sub.tagline,
                category: sub.category,
                verified: true,
                logoUrl: sub.logoUrl || p.logoUrl,
                description: sub.description || p.description,
                problemItSolves: sub.problemItSolves || p.problemItSolves,
                solution: sub.solution || p.solution,
                uniqueSellingPoint: sub.uniqueSellingPoint || p.uniqueSellingPoint,
                targetAudience: sub.targetAudience || p.targetAudience,
                pricingModel: sub.pricingModel || p.pricingModel,
                twitterHandle: sub.twitterHandle || p.twitterHandle,
                offerDiscount: sub.offerDiscount || p.offerDiscount,
                offerCode: sub.offerCode || p.offerCode,
                offerUrl: sub.offerUrl || p.offerUrl,
                offerDetails: sub.offerDetails || p.offerDetails,
                screenshots: sub.screenshots && sub.screenshots.length > 0 ? sub.screenshots : p.screenshots,
                demoVideoUrl: sub.demoVideoUrl || p.demoVideoUrl,
                creatorName: sub.creatorName || p.creatorName,
                creatorUsername: sub.creatorUsername || p.creatorUsername,
                creatorXHandle: sub.creatorXHandle || p.creatorXHandle,
                creatorAvatar: sub.creatorAvatar || p.creatorAvatar,
                creatorRole: sub.creatorRole || p.creatorRole,
                socials: sub.socials && sub.socials.length > 0 ? sub.socials : p.socials,
                whatItDoes: (sub.problemItSolves || sub.solution || sub.uniqueSellingPoint) ? [
                  ...(sub.problemItSolves ? [`Problem: ${sub.problemItSolves}`] : []),
                  ...(sub.solution ? [`Solution: ${sub.solution}`] : []),
                  ...(sub.uniqueSellingPoint ? [`Difference: ${sub.uniqueSellingPoint}`] : [])
                ] : p.whatItDoes,
                features: (sub.solution || sub.uniqueSellingPoint) ? [
                  ...(sub.solution ? [{ title: 'Core Solution', description: sub.solution, tag: 'Superpower' }] : []),
                  ...(sub.uniqueSellingPoint ? [{ title: 'Key Advantage', description: sub.uniqueSellingPoint, tag: 'Differentiator' }] : []),
                  ...(sub.problemItSolves ? [{ title: 'Problem Solved', description: sub.problemItSolves, tag: 'Value' }] : [])
                ] : p.features,
              }
            : p
        );
        productToSync = nextProducts[existingIndex];
      } else {
        const newProd = submissionToProduct(approvedSub, prev.length + 1);
        productToSync = newProd;
        nextProducts = [...prev, newProd];
      }

      // Re-normalize all ranks sequentially 1..N to guarantee no duplicates or gaps
      nextProducts = nextProducts.map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));

      debouncedSyncProducts(nextProducts);
      saveAllProducts(nextProducts).catch(() => {});
      try {
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(nextProducts));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(nextProducts));
      } catch {}
      return nextProducts;
    });

    setLiveFeed((prev) =>
      [{ id: `listing-${Date.now()}`, productId: productToSync?.id || sub.id, name: sub.name, kind: 'listing', time: Date.now() }, ...prev].slice(0, 14)
    );

    if (productToSync) {
      try {
        await insertProductDirect(productToSync);
      } catch {}
    }
  };

  // Admin Reject Pipeline
  const handleRejectSubmission = async (submissionId: string, reason?: string) => {
    const reviewedAt = Date.now();
    const rejectionReason = reason || 'Did not meet current directory guidelines';
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, status: 'rejected', reviewedAt, rejectionReason } : s
      )
    );
    try {
      await supabase.from('submissions').update({ status: 'rejected', reviewed_at: reviewedAt, rejection_reason: rejectionReason }).eq('id', submissionId);
    } catch {}
  };

  // Admin Delete Permanent
  const handleDeleteSubmission = async (submissionId: string) => {
    const targetSub = submissions.find((s) => s.id === submissionId);
    markSubmissionDeleted(submissionId);
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
        await supabase.from('submissions').delete().eq('url', targetSub.url);
        await supabase.from('products').delete().eq('url', targetSub.url);
      }
    } catch (err) {
      console.error('Error deleting submission from DB:', err);
    }
  };

  // Admin Update Submission Details
  const handleUpdateSubmission = async (updated: WebsiteSubmission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    try {
      await supabase.from('submissions').update(toDbSubmission(updated)).eq('id', updated.id);
    } catch {}
  };

  // Admin Restore Submission to Queue
  const handleRestoreSubmission = async (submissionId: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: 'under_review' } : s))
    );
    try {
      await supabase.from('submissions').update({ status: 'under_review', reviewed_at: null }).eq('id', submissionId);
    } catch {}
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
    } catch {}
  };

  // Track click on a website (counts the visit + pushes a live traffic event)
  const handleTrackClick = (productId: string, _url: string) => {
    const now = Date.now();
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, clicks: p.clicks + 1, updatedAt: now } : p))
    );
    const last = lastClickFeedRef.current[productId] || 0;
    if (now - last < 60_000) return;
    lastClickFeedRef.current[productId] = now;
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    setLiveFeed((prev) =>
      [{ id: `visit-${now}`, productId, name: target.name, kind: 'visit', time: now }, ...prev].slice(0, 14)
    );
  };

  // Rent the featured spotlight (side rail ad card)
  const openRentSpotlight = () => {
    playSound('click', soundEnabled);
    if (!user) {
      setIsSignInModalOpen(true);
    } else {
      setIsFeaturedSpotModalOpen(true);
    }
  };

  // Delist a product — permanently removes it from live directory and DB
  const handleDelistProduct = async (productId: string) => {
    const targetProduct = products.find((p) => p.id === productId);
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
      } catch {}
      debouncedSyncProducts(updated);
      saveAllProducts(updated).catch(() => {});
      return updated;
    });

    if (featuredProductId === productId) {
      handleSetFeatured(null);
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
            } catch {}
            return restored;
          });
        }
        return;
      }
      // Also delete by URL in case duplicates exist
      if (targetProduct) {
        await supabase.from('products').delete().eq('url', targetProduct.url);
      }
    } catch (err) {
      console.error('Error deleting product from DB:', err);
      // Revert on network error too
      if (targetProduct) {
        setProducts((prev) => {
          const restored = [...prev, targetProduct].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
          try {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(restored));
            localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(restored));
          } catch {}
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
      } catch {}
      debouncedSyncProducts(updated);
      saveAllProducts(updated).catch(() => {});
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
      } catch {}
      saveAllProducts(ranked).catch(() => {});
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
      } catch {}
      saveAllProducts(ranked).catch(() => {});
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

  // Admin: set any product as the featured product (null = default/placeholder, '' = empty, 'prod-X' = specific product)
  const handleSetFeatured = (productId: string | null) => {
    setFeaturedProductId(productId);
    setGlobalFeaturedProduct(productId);
    playSound('click', soundEnabled);
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
  const explicitFeaturedProduct = (!isDefaultFeatured && !isEmptyFeatured && featuredProductId)
    ? products.find((p) => p.id === featuredProductId) || null
    : null;

  const sortedByRankProducts = [...products].sort(compareProductsByRank);
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
  const newestListings = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 9);

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
  const directoryCategories = (() => {
    const seen = new Set<string>();
    const cats: string[] = [];
    for (const p of products) {
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
    return cats;
  })();

  // Weekly launch rounds: scope products to the selected week, upvote-ranked
  const weeks = getRecentWeeks(6);
  const selectedWeek = showAllTime
    ? null
    : weeks[weeks.length - 1 - Math.min(Math.max(selectedWeekOffset, 0), weeks.length - 1)];
  const weekScopedProducts = selectedWeek
    ? products.filter((p) => isInWeek(p.createdAt, selectedWeek))
    : products;

  // Helper to determine if a product has an active deal/discount/promo code
  const isProductDeal = (p: Product) =>
    Boolean(
      (p.offerDiscount && p.offerDiscount.trim().length > 0) ||
      (p.offerCode && p.offerCode.trim().length > 0) ||
      (p.offerDetails && p.offerDetails.trim().length > 0)
    );

  // Total exclusive deals across all live products
  const totalDealsCount = React.useMemo(() => {
    return products.filter(isProductDeal).length;
  }, [products]);

  // Filter products by category, search query, and deals filter (within the selected week, strictly honoring rank order)
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
    .sort(compareProductsByRank);

  // Promoted / featured product used in the rails and mid-board banner
  const promotedProduct = featuredProductId
    ? products.find((p) => p.id === featuredProductId) || null
    : null;

  // Last week's best (right rail archive — top upvoted launches from the previous week)
  const lastWeek = weeks[weeks.length - 2];
  const lastWeekBest = (() => {
    if (!lastWeek) return [];
    return [...products]
      .filter((p) => isInWeek(p.createdAt, lastWeek))
      .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0))
      .slice(0, 5);
  })();

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stealsOnly]);

  // Pagination calculation (50 per page on filtered list)
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  // Striped cells that complete the last row of the bento grid
  const totalGridCards = paginatedProducts.length + (currentPage === 1 ? 1 : 0);
  const directoryGridFillerCount =
    (directoryGridColumns - (totalGridCards % directoryGridColumns)) % directoryGridColumns;

  // Keep currentPage valid if products change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredProducts.length, totalPages, currentPage]);

  // Global top navigation — rendered above every route
  const handleTabChange = (tab: DirectoryTab) => {
    playSound('click', soundEnabled);
    const nextRoute = tab === 'saas-ideas' ? '/ideas' : tab === 'pricing' ? '/pricing' : '/';
    setCurrentRoute(nextRoute);
    try {
      window.history.pushState({}, tab === 'saas-ideas' ? 'SaaS Ideas' : tab === 'pricing' ? 'Pricing' : 'Directory', nextRoute);
    } catch {}
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
    try { window.history.pushState('', document.title, `/${doc}`); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const globalHeader = (
    <Header
      onGoHome={handleBackToLeaderboard}
      onOpenSubmit={handleOpenSubmit}
      onSignIn={handleSignIn}
      onGoToProfile={handleGoToProfile}
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
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
      </>
    );
  }

  // 0.2 PRICING PAGE ROUTE (/pricing)
  if (currentRoute === '/pricing') {
    return (
      <div className="min-h-screen bg-[#222222] text-neutral-100 flex flex-col justify-between selection:bg-mint-500 selection:text-[#0b0f14] font-sans">
        {globalHeader}
        <PricingPage
          onOpenSubmit={(plan) => {
            handleOpenSubmit();
          }}
          onGoHome={handleBackToLeaderboard}
          soundEnabled={soundEnabled}
        />
        <RichFooter
          totalProducts={products.length}
          soundEnabled={soundEnabled}
          onOpenSubmit={handleOpenSubmit}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onSelectCategory={setSelectedCategory}
          onOpenPrivacy={() => handleNavigateLegal('privacy')}
          onOpenTerms={() => handleNavigateLegal('terms')}
          onOpenPricing={handleOpenPricing}
          className="border-t border-neutral-800 bg-[#1c1c1c]"
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
          <div className="min-h-screen bg-[#222222] text-neutral-100 flex items-center justify-center font-sans">
            <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
          </div>
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
        <ProfilePage
          user={user}
          allProducts={products}
          allSubmissions={submissions}
          onBack={handleBackToLeaderboard}
          onSignOut={handleSignOut}
          onDeleteProduct={(productId) => setProducts((prev) => prev.filter((p) => p.id !== productId))}
          onUpdateProduct={(updated) => setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
          onSelectProduct={handleOpenProduct}
          soundEnabled={soundEnabled}
        />
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

  // 1.5 PRODUCT DETAIL ROUTE (/product/:id)
  if (currentRoute === 'product') {
    let rawProduct = (productRouteId ? products.find((p) =>
      p.id === productRouteId ||
      p.id === `prod-${productRouteId}` ||
      `prod-${p.id}` === productRouteId ||
      p.url.toLowerCase().replace(/\/$/, '') === productRouteId.toLowerCase().replace(/\/$/, '')
    ) : null) || null;

    // Check if matching submission exists in state or local storage to enrich fields
    let matchingSub: WebsiteSubmission | undefined;
    if (productRouteId) {
      matchingSub = submissions.find(
        (s) =>
          s.id === productRouteId ||
          `prod-${s.id}` === productRouteId ||
          s.url.toLowerCase().replace(/\/$/, '') === productRouteId.toLowerCase().replace(/\/$/, '')
      );
      if (!matchingSub && rawProduct) {
        matchingSub = submissions.find(
          (s) =>
            s.url.toLowerCase().replace(/\/$/, '') === rawProduct!.url.toLowerCase().replace(/\/$/, '') ||
            s.id === rawProduct!.id ||
            `prod-${s.id}` === rawProduct!.id
        );
      }
    }

    if (!rawProduct && matchingSub) {
      // If product hasn't synced into products array yet, generate live product preview from submission!
      rawProduct = submissionToProduct(matchingSub, products.length + 1);
    } else if (rawProduct && matchingSub) {
      // Merge rich submission fields into rawProduct
      rawProduct = {
        ...rawProduct,
        name: rawProduct.name || matchingSub.name,
        tagline: rawProduct.tagline || matchingSub.tagline,
        category: rawProduct.category || matchingSub.category,
        logoUrl: rawProduct.logoUrl || matchingSub.logoUrl,
        description: rawProduct.description || matchingSub.description,
        problemItSolves: rawProduct.problemItSolves || matchingSub.problemItSolves,
        solution: rawProduct.solution || matchingSub.solution,
        uniqueSellingPoint: rawProduct.uniqueSellingPoint || matchingSub.uniqueSellingPoint,
        targetAudience: rawProduct.targetAudience || matchingSub.targetAudience,
        pricingModel: rawProduct.pricingModel || matchingSub.pricingModel,
        twitterHandle: rawProduct.twitterHandle || matchingSub.twitterHandle,
        socials: rawProduct.socials && rawProduct.socials.length > 0 ? rawProduct.socials : matchingSub.socials,
        screenshots: rawProduct.screenshots && rawProduct.screenshots.length > 0 ? rawProduct.screenshots : matchingSub.screenshots,
        demoVideoUrl: rawProduct.demoVideoUrl || matchingSub.demoVideoUrl,
        creatorName: rawProduct.creatorName || matchingSub.creatorName,
        creatorUsername: rawProduct.creatorUsername || matchingSub.creatorUsername,
        creatorXHandle: rawProduct.creatorXHandle || matchingSub.creatorXHandle,
        creatorAvatar: rawProduct.creatorAvatar || matchingSub.creatorAvatar,
        creatorRole: rawProduct.creatorRole || matchingSub.creatorRole,
        offerDiscount: rawProduct.offerDiscount || matchingSub.offerDiscount,
        offerCode: rawProduct.offerCode || matchingSub.offerCode,
        offerUrl: rawProduct.offerUrl || matchingSub.offerUrl,
        offerDetails: rawProduct.offerDetails || matchingSub.offerDetails,
        whatItDoes: (rawProduct.whatItDoes && rawProduct.whatItDoes.length > 0) ? rawProduct.whatItDoes : (
          (matchingSub.problemItSolves || matchingSub.solution || matchingSub.uniqueSellingPoint) ? [
            ...(matchingSub.problemItSolves ? [`Problem: ${matchingSub.problemItSolves}`] : []),
            ...(matchingSub.solution ? [`Solution: ${matchingSub.solution}`] : []),
            ...(matchingSub.uniqueSellingPoint ? [`Difference: ${matchingSub.uniqueSellingPoint}`] : [])
          ] : undefined
        ),
        features: (rawProduct.features && rawProduct.features.length > 0) ? rawProduct.features : (
          (matchingSub.solution || matchingSub.uniqueSellingPoint) ? [
            ...(matchingSub.solution ? [{ title: 'Core Solution', description: matchingSub.solution, tag: 'Superpower' }] : []),
            ...(matchingSub.uniqueSellingPoint ? [{ title: 'Key Advantage', description: matchingSub.uniqueSellingPoint, tag: 'Differentiator' }] : []),
            ...(matchingSub.problemItSolves ? [{ title: 'Problem Solved', description: matchingSub.problemItSolves, tag: 'Value' }] : [])
          ] : undefined
        ),
      };
    }

    const rankIndex = sortedByRankProducts.findIndex(
      (p) =>
        p.id === rawProduct.id ||
        p.id === `prod-${rawProduct.id}` ||
        `prod-${p.id}` === rawProduct.id ||
        p.url.toLowerCase().replace(/\/$/, '') === rawProduct.url.toLowerCase().replace(/\/$/, '')
    );
    const dynamicRank = rankIndex >= 0 ? rankIndex + 1 : (rawProduct.rank || 1);
    const product = rawProduct ? { ...rawProduct, rank: dynamicRank } : null;
    if (!product) {
      if (!productsLoaded) {
        return (
          <>
            {globalHeader}
            <div className="min-h-screen bg-[#222222] text-neutral-100 flex items-center justify-center font-sans">
              <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
            </div>
          </>
        );
      }
      return (
        <>
          {globalHeader}
          <div className="min-h-screen bg-[#222222] text-neutral-100 flex items-center justify-center font-sans">
            <div className="text-center space-y-3">
              <h2 className="text-lg font-bold">Product not found</h2>
            <p className="text-sm text-neutral-400">This listing may have been removed.</p>
            <button
              onClick={() => {
                setCurrentRoute('/');
                try { window.history.pushState('', document.title, '/'); } catch {}
              }}
              className="mt-2 rounded-xl bg-white text-black px-4 py-2 text-xs font-bold cursor-pointer"
            >
                Back to Directory
              </button>
            </div>
          </div>
        </>
      );
    }
    return (
      <div className="min-h-screen bg-[#222222] text-neutral-100 flex flex-col justify-between font-sans">
        {globalHeader}
        <ProductPage
          product={product}
          topProduct={topProduct || product}
          allProducts={sortedByRankProducts.map((p, idx) => ({ ...markOwnership(p), rank: idx + 1 }))}
          comments={comments.filter((c) => c.productId === product.id)}
          soundEnabled={soundEnabled}
          isSignedIn={!!user}
          userName={submitterName}
          userEmail={user?.email}
          userAvatar={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
          onOpenSignIn={() => setIsSignInModalOpen(true)}
          onAddComment={handleAddComment}
          onBack={() => {
            setCurrentRoute('/');
            try { window.history.pushState('', document.title, '/'); } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onSelectProduct={(p) => {
            setCurrentRoute('product');
            setProductRouteId(p.id);
            try { window.history.pushState({}, p.name, `/product/${encodeURIComponent(p.id)}`); } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onShare={(p) => setShareProduct(p)}
          onTrackClick={handleTrackClick}
          onUpvote={handleUpvote}
          isUpvoted={isProductUpvoted(product.id, userUpvotes)}
        />
        <RichFooter
          totalProducts={products.length}
          soundEnabled={soundEnabled}
          onOpenSubmit={handleOpenSubmit}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onSelectCategory={setSelectedCategory}
          onOpenPrivacy={() => {
            setCurrentRoute('/privacy');
            try { window.history.pushState('', document.title, '/privacy'); } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenTerms={() => {
            setCurrentRoute('/terms');
            try { window.history.pushState('', document.title, '/terms'); } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
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
      </div>
    );
  }

  // 1.25 SUBMIT / LAUNCH A PRODUCT PAGE ROUTE (/submit)
  if (currentRoute === '/submit') {
    if (!authLoaded) {
      return (
        <>
          {globalHeader}
          <div className="min-h-screen bg-[#222222] text-neutral-100 flex items-center justify-center font-sans">
            <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
          </div>
        </>
      );
    }
    return (
      <div className="min-h-screen bg-[#222222] text-neutral-100 flex flex-col justify-between font-sans">
        {globalHeader}
        <SubmitPage
          isSignedIn={!!user}
          defaultCreatorName={submitterName}
          defaultCreatorAvatar={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || ''}
          onBack={handleBackToLeaderboard}
          onSignInRequest={() => setIsSignInModalOpen(true)}
          onSubmit={handleConfirmSubmit}
          onViewListing={(productId) => {
            setCurrentRoute('product');
            setProductRouteId(productId);
            try {
              window.history.pushState({}, 'Product', `/product/${encodeURIComponent(productId)}`);
            } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          soundEnabled={soundEnabled}
        />
        <RichFooter
          totalProducts={products.length}
          soundEnabled={soundEnabled}
          onOpenSubmit={handleOpenSubmit}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onSelectCategory={setSelectedCategory}
          onOpenPrivacy={() => {
            setCurrentRoute('/privacy');
            try { window.history.pushState('', document.title, '/privacy'); } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenTerms={() => {
            setCurrentRoute('/terms');
            try { window.history.pushState('', document.title, '/terms'); } catch {}
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignIn}
        />
      </div>
    );
  }

  // 1. ADMIN ACCEPT PAGE ROUTE (/accept)
  if (currentRoute === '/accept') {
    // Non-admins get redirected to homepage
    if (user && !isAdmin) {
      return (
        <>
          {globalHeader}
          <div className="min-h-screen bg-[#222222] text-neutral-100 flex items-center justify-center font-sans">
            <div className="text-center space-y-3">
              <ShieldCheck className="mx-auto h-10 w-10 text-neutral-500" />
            <h2 className="text-lg font-bold">Admin Access Required</h2>
            <p className="text-sm text-neutral-400">You don't have admin privileges.</p>
            <button onClick={handleBackToLeaderboard} className="mt-2 rounded-xl bg-white text-black px-4 py-2 text-xs font-bold cursor-pointer">Back to Directory</button>
            </div>
          </div>
        </>
      );
    }
    return (
      <>
        {globalHeader}
        <div className="min-h-screen bg-[#222222] text-neutral-100 flex flex-col justify-between font-sans">
          <AdminAcceptPage
          submissions={submissions}
          products={products}
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
          onSetFeatured={handleSetFeatured}
          onSaveProductsOrder={handleSaveProductsOrder}
          onToggleVerified={handleToggleVerifiedProduct}
        />

        <SignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignIn}
        />
        </div>
      </>
    );
  }

  // Legal Page Route (Privacy Policy & Terms of Service)
  if (currentRoute === '/privacy' || currentRoute === '/terms') {
    return (
      <>
        {globalHeader}
        <LegalPage
          initialDoc={currentRoute === '/terms' ? 'terms' : 'privacy'}
          onBack={handleBackToLeaderboard}
          onOpenSubmit={handleOpenSubmit}
          totalProducts={products.length}
          soundEnabled={soundEnabled}
          onSelectCategory={setSelectedCategory}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          onOpenPricing={handleOpenPricing}
        />
      </>
    );
  }

  // 2. MAIN DIRECTORY HOMEPAGE ROUTE
  return (
    <div className="min-h-screen bg-[#222222] text-neutral-100 flex flex-col justify-between selection:bg-mint-500 selection:text-[#0b0f14] font-sans">
      {globalHeader}
      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 space-y-4 sm:space-y-5 flex-1 pb-16 pt-4 sm:pt-6">

        {activeTab === 'saas-ideas' ? (
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
            upvotedIds={userUpvotes}
          />
        ) : (
        <>
        {/* ── Hero: brand statement + search ── */}
        <HomeHero
          totalProducts={products.length}
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

        {/* ── Directory board: side rails + ranked center column ── */}
        <div id="leaderboard-section" className="grid grid-cols-1 gap-5">
          {/* Left rail (retired in the bento layout) */}
          <aside className="hidden" aria-hidden="true">
            <SpotlightCard soundEnabled={soundEnabled} onRent={openRentSpotlight} />
            <RailCard title="Live Traffic" dot="red">
              {liveFeed.length === 0 ? (
                <p className="px-4 py-3 text-[10px] font-medium text-neutral-400">
                  Visits and new listings appear here live.
                </p>
              ) : (
                liveFeed.map((ev) => {
                  const p = products.find((prod) => prod.id === ev.productId);
                  return (
                    <FeedRow
                      key={ev.id}
                      soundEnabled={soundEnabled}
                      onClick={p ? () => handleOpenProduct(p) : undefined}
                      logo={
                        <ProductLogo
                          src={p?.logoUrl}
                          alt={p?.name || ev.name}
                          containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs relative"
                          iconClassName="h-3.5 w-3.5 text-neutral-400 shrink-0"
                        />
                      }
                      name={ev.name}
                      sub={ev.kind === 'visit' ? `got a click ${timeAgo(ev.time)}` : `joined ${timeAgo(ev.time)}`}
                      right={
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          LIVE
                        </span>
                      }
                    />
                  );
                })
              )}
            </RailCard>
          </aside>

          {/* Center column */}
          <div className="min-w-0 space-y-3.5">
        {/* Category bar + Steals Only toggle on the same line (right-side edge) */}
        <div className="flex items-center justify-between gap-2.5">
          {/* Category chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none min-w-0 flex-1" role="navigation" aria-label="Browse by category">
            {(['All', ...(selectedCategory !== 'All' && !directoryCategories.includes(selectedCategory) ? [selectedCategory] : []), ...directoryCategories] as Category[]).map((cat) => {
              const count = cat === 'All' ? products.length : products.filter((p) => p.category === cat).length;
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
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                    active
                      ? 'border-mint-500/60 bg-mint-500/15 text-mint-200'
                      : 'border-neutral-800 bg-[#2a2a2a] text-neutral-400 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`rounded-full px-1.5 py-px text-[9px] font-black font-mono-num ${active ? 'bg-mint-500/20 text-mint-200' : 'bg-neutral-800 text-neutral-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Controls on the right edge: Steals Only + Card/List view switcher */}
          <div className="shrink-0 flex items-center gap-2 pl-1">
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
                  } catch {}
                }
                setStealsOnly((prev) => !prev);
                setCurrentPage(1);
              }}
              title={stealsOnly ? 'Turn off Steals Only filter' : 'Show only tools with exclusive discounts (50% OFF, lifetime deals, promo codes)'}
              className={`group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer select-none ${
                stealsOnly
                  ? 'border-amber-400/60 bg-gradient-to-r from-amber-500/20 to-amber-500/10 text-amber-200 shadow-[0_0_16px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/30'
                  : 'border-neutral-800 bg-[#2a2a2a] text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              <Flame
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  stealsOnly ? 'text-amber-300 fill-amber-300/30 scale-110 animate-pulse' : 'text-neutral-500 group-hover:text-amber-400'
                }`}
              />
              <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
                Steals Only
              </span>
              {totalDealsCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-px text-[9px] font-black font-mono-num ${
                    stealsOnly ? 'bg-amber-400/30 text-amber-100' : 'bg-neutral-800 text-neutral-500 group-hover:text-neutral-300'
                  }`}
                >
                  {totalDealsCount}
                </span>
              )}

              {/* Sliding switch track & knob */}
              <span
                className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${
                  stealsOnly ? 'bg-amber-400' : 'bg-neutral-700 group-hover:bg-neutral-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-out ${
                    stealsOnly ? 'translate-x-3 bg-neutral-950' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>

            {/* View Layout Switcher (Card vs List) */}
            <div className="flex items-center gap-1 bg-[#2a2a2a] p-1 rounded-full border border-neutral-800 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setViewLayout('cards');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'cards'
                    ? 'bg-[#3a3a3a] text-white shadow-2xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Card View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Card</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setViewLayout('table');
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-[#3a3a3a] text-white shadow-2xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Rendering */}
        {!productsLoaded ? (
          viewLayout === 'table' ? (
            <SkeletonTable />
          ) : (
            <SkeletonGrid />
          )
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-12 text-center">
            {selectedWeek && weekScopedProducts.length === 0 ? (
              <>
                <Trophy className="mx-auto h-10 w-10 text-neutral-700 mb-3" />
                <h3 className="text-lg font-bold text-white">No launches in {selectedWeek.label} yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5 font-medium">
                  The round is fresh. Be the first to launch your SaaS this week and take the #1 spot.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      weekPickedByUserRef.current = true;
                      setShowAllTime(true);
                      setCurrentPage(1);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-transparent px-3.5 py-2 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <span>See all launches</span>
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
                    <span>Launch your SaaS</span>
                  </button>
                </div>
              </>
            ) : stealsOnly ? (
              <>
                <Flame className="mx-auto h-10 w-10 text-amber-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white">No exclusive deals found</h3>
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
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
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
                      className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-transparent px-3.5 py-2 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
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
                <h3 className="text-lg font-bold text-white">No websites found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-5 font-medium">
                  {searchQuery.trim()
                    ? `No tools match "${searchQuery}". Try searching for another term or clear filters.`
                    : 'No websites in this category yet. Be the first to submit!'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-transparent px-3.5 py-2 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
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
        ) : viewLayout === 'table' ? (
          <div className="space-y-4">
            <LeaderboardTable
              products={paginatedProducts}
              soundEnabled={soundEnabled}
              featuredProductId={featuredProductId}
              onShareProduct={(p) => setShareProduct(p)}
              onTrackClick={handleTrackClick}
              onOpenDetail={handleOpenProduct}
              onUpvote={handleUpvote}
              upvotedIds={userUpvotes}
              startIndex={startIndex}
              commentCounts={commentCounts}
              showSponsor={currentPage === 1 && !isEmptyFeatured}
              sponsorProduct={explicitFeaturedProduct}
              onOpenFeaturedSpotModal={() => {
                if (!user) {
                  setIsSignInModalOpen(true);
                } else {
                  setIsFeaturedSpotModalOpen(true);
                }
              }}
            />

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
        ) : (
          <div className="space-y-4">
            {/* Bento-style grid of product tiles */}
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentPage === 1 && !isEmptyFeatured && (
                <SponsorTile
                  soundEnabled={soundEnabled}
                  product={explicitFeaturedProduct}
                  onOpenProduct={handleOpenProduct}
                  onOpenFeaturedSpotModal={() => {
                    if (!user) {
                      setIsSignInModalOpen(true);
                    } else {
                      setIsFeaturedSpotModalOpen(true);
                    }
                  }}
                />
              )}
              {paginatedProducts.map((p, index) => {
                const calculatedRank = startIndex + index + 1;
                return (
                  <ProductTile
                    key={p.id}
                    product={{ ...p, rank: calculatedRank }}
                    rank={calculatedRank}
                    soundEnabled={soundEnabled}
                    verified={Boolean(p.verified)}
                    commentCount={commentCounts[p.id] ?? 0}
                    onOpen={handleOpenProduct}
                    onUpvote={handleUpvote}
                    upvoted={isProductUpvoted(p.id, userUpvotes)}
                  />
                );
              })}
              {Array.from({ length: directoryGridFillerCount }).map((_, i) => (
                <GridFillerCell key={`grid-filler-${i}`} />
              ))}
            </div>

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

          {/* Right rail (retired in the bento layout) */}
          <aside className="hidden" aria-hidden="true">
            <PromotedCard
              product={promotedProduct}
              soundEnabled={soundEnabled}
              onOpen={handleOpenProduct}
              onRent={openRentSpotlight}
            />
            <RailCard title="Last Week's Best">
              {lastWeekBest.length === 0 ? (
                <p className="px-4 py-3 text-[10px] font-medium text-neutral-400">
                  No launches last week — the board is fresh.
                </p>
              ) : (
                lastWeekBest.map((p) => (
                  <FeedRow
                    key={p.id}
                    soundEnabled={soundEnabled}
                    onClick={() => handleOpenProduct(p)}
                    logo={
                      <ProductLogo
                        src={p.logoUrl}
                        alt={p.name}
                        containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs relative"
                        iconClassName="h-3.5 w-3.5 text-neutral-400 shrink-0"
                      />
                    }
                    name={p.name}
                    sub={p.tagline}
                    right={
                      <span className="inline-flex items-center gap-1 font-mono-num text-[10px] font-bold text-neutral-500">
                        <MessageCircle className="h-3 w-3 text-neutral-400" />
                        {commentCounts[p.id] ?? 0}
                      </span>
                    }
                  />
                ))
              )}
            </RailCard>
            <RailCard title="Just Listed">
              {newestListings.length === 0 ? (
                <p className="px-4 py-3 text-[10px] font-medium text-neutral-400">
                  New products appear here as they launch.
                </p>
              ) : (
                newestListings.map((p) => (
                  <FeedRow
                    key={p.id}
                    soundEnabled={soundEnabled}
                    onClick={() => handleOpenProduct(p)}
                    logo={
                      <ProductLogo
                        src={p.logoUrl}
                        alt={p.name}
                        containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs relative"
                        iconClassName="h-3.5 w-3.5 text-neutral-400 shrink-0"
                      />
                    }
                    name={p.name}
                    sub={timeAgo(p.createdAt)}
                  />
                ))
              )}
            </RailCard>
          </aside>

          {/* Mobile rails (retired in the bento layout) */}
          <div className="hidden" aria-hidden="true">
            <SpotlightCard soundEnabled={soundEnabled} onRent={openRentSpotlight} />
            {promotedProduct && (
              <PromotedCard
                product={promotedProduct}
                soundEnabled={soundEnabled}
                onOpen={handleOpenProduct}
                onRent={openRentSpotlight}
              />
            )}
            <RailCard title="Last Week's Best">
              {lastWeekBest.length === 0 ? (
                <p className="px-4 py-3 text-[10px] font-medium text-neutral-400">
                  No launches last week — the board is fresh.
                </p>
              ) : (
                lastWeekBest.slice(0, 6).map((p) => (
                  <FeedRow
                    key={p.id}
                    soundEnabled={soundEnabled}
                    onClick={() => handleOpenProduct(p)}
                    logo={
                      <ProductLogo
                        src={p.logoUrl}
                        alt={p.name}
                        containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs relative"
                        iconClassName="h-3.5 w-3.5 text-neutral-400 shrink-0"
                      />
                    }
                    name={p.name}
                    sub={p.tagline}
                    right={
                      <span className="inline-flex items-center gap-1 font-mono-num text-[10px] font-bold text-neutral-500">
                        <MessageCircle className="h-3 w-3 text-neutral-400" />
                        {commentCounts[p.id] ?? 0}
                      </span>
                    }
                  />
                ))
              )}
            </RailCard>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RailCard title="Live Traffic" dot="red">
                {liveFeed.length === 0 ? (
                  <p className="px-4 py-3 text-[10px] font-medium text-neutral-400">
                    Visits and new listings appear here live.
                  </p>
                ) : (
                  liveFeed.map((ev) => {
                    const p = products.find((prod) => prod.id === ev.productId);
                    return (
                      <FeedRow
                        key={ev.id}
                        soundEnabled={soundEnabled}
                        onClick={p ? () => handleOpenProduct(p) : undefined}
                        logo={
                          <ProductLogo
                            src={p?.logoUrl}
                            alt={p?.name || ev.name}
                            containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs relative"
                            iconClassName="h-3.5 w-3.5 text-neutral-400 shrink-0"
                          />
                        }
                        name={ev.name}
                        sub={ev.kind === 'visit' ? `got a click ${timeAgo(ev.time)}` : `joined ${timeAgo(ev.time)}`}
                      />
                    );
                  })
                )}
              </RailCard>
              <RailCard title="Just Listed">
                {newestListings.length === 0 ? (
                  <p className="px-4 py-3 text-[10px] font-medium text-neutral-400">
                    New products appear here as they launch.
                  </p>
                ) : (
                  newestListings.slice(0, 6).map((p) => (
                    <FeedRow
                      key={p.id}
                      soundEnabled={soundEnabled}
                      onClick={() => handleOpenProduct(p)}
                      logo={
                        <ProductLogo
                          src={p.logoUrl}
                          alt={p.name}
                          containerClassName="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs relative"
                          iconClassName="h-3.5 w-3.5 text-neutral-400 shrink-0"
                        />
                      }
                      name={p.name}
                      sub={timeAgo(p.createdAt)}
                    />
                  ))
                )}
              </RailCard>
            </div>
          </div>

          </div>
          </div>
        </>
        )}
      </main>

      {/* Footer */}
      <RichFooter
        totalProducts={products.length}
        soundEnabled={soundEnabled}
        onOpenSubmit={handleOpenSubmit}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onSelectCategory={setSelectedCategory}
        onOpenPrivacy={() => {
          setCurrentRoute('/privacy');
          try { window.history.pushState('', document.title, '/privacy'); } catch {}
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTerms={() => {
          setCurrentRoute('/terms');
          try { window.history.pushState('', document.title, '/terms'); } catch {}
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
        onStartBidding={() => {
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
        soundEnabled={soundEnabled}
        onOpenSubmitModal={() => {
          setIsFeaturedSpotModalOpen(false);
          handleOpenSubmit();
        }}
      />


    </div>
  );
}
