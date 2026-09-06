import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { User } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_SUBMISSIONS } from './data/initialSubmissions';
import { Category, Product, WebsiteSubmission, Comment, SubmitProductDetails } from './types';
import { HeroClaimBanner } from './components/HeroClaimBanner';
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
import { LegalTab } from './components/LegalModal';
import { playSound } from './utils/sound';
import { supabase } from './utils/supabase';
import { loadProducts, saveAllProducts, saveProductRanksDirect, debouncedSyncProducts, toggleUpvote, getUserUpvotes, checkIsAdmin, getGlobalFeaturedProduct, setGlobalFeaturedProduct, insertProductDirect, fetchComments, addComment, getCachedCommentsSync, submissionToProduct } from './utils/db';
import { getRecentWeeks, isInWeek } from './utils/weeks';
import { getWebsiteFavicon } from './utils/logo';
import { LayoutGrid, Table as TableIcon, Trophy, X, Plus, ShieldCheck, Loader2, Star, MessageCircle } from 'lucide-react';
import { FeaturedSpotModal } from './components/FeaturedSpotModal';
import { ProductPage } from './components/ProductPage';
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
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
          const dbIdSet = new Set(dbSubs.map((s) => s.id));
          const dbUrlSet = new Set(dbSubs.map((s) => s.url.toLowerCase().replace(/\/$/, '')));
          const deletedIds = getDeletedSubmissionIds();

          setSubmissions((prev) => {
            // All database rows are authoritative and preserved with full up-to-date fields.
            // Only keep un-synced pending items that were submitted locally and not yet in DB or deleted.
            const unSyncedPending = prev.filter((localSub) => {
              const urlKey = localSub.url.toLowerCase().replace(/\/$/, '');
              const inDb = dbIdSet.has(localSub.id) || dbUrlSet.has(urlKey);
              if (inDb) return false; // Already in DB -> use DB record!
              const isDeleted = deletedIds.has(localSub.id) || deletedIds.has(urlKey);
              if (isDeleted) return false;
              return (localSub.status || 'under_review') === 'under_review';
            });

            const combined = [...dbSubs, ...unSyncedPending].sort(
              (a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0)
            );
            saveSubmissionsToStorage(combined);

            // Automatically ensure any approved submission exists in the live products directory and has all details
            const approvedSubs = combined.filter((s) => s.status === 'approved');
            if (approvedSubs.length > 0) {
              setProducts((currProducts) => {
                const existingUrls = new Set(currProducts.map((p) => p.url.toLowerCase().replace(/\/$/, '')));
                const missingApprovedProds: Product[] = [];

                // Enrich any existing products with rich metadata from approved submissions
                const updatedExisting = currProducts.map((existingProd) => {
                  const matchingSub = approvedSubs.find(
                    (s) =>
                      s.url.toLowerCase().replace(/\/$/, '') === existingProd.url.toLowerCase().replace(/\/$/, '') ||
                      s.id === existingProd.id ||
                      `prod-${s.id}` === existingProd.id
                  );
                  if (matchingSub) {
                    return {
                      ...existingProd,
                      name: matchingSub.name || existingProd.name,
                      tagline: matchingSub.tagline || existingProd.tagline,
                      category: matchingSub.category || existingProd.category,
                      description: matchingSub.description || existingProd.description,
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
                  }
                  return existingProd;
                });

                for (const appSub of approvedSubs) {
                  const urlKey = appSub.url.toLowerCase().replace(/\/$/, '');
                  if (!existingUrls.has(urlKey)) {
                    const newProd = submissionToProduct(appSub, currProducts.length + missingApprovedProds.length + 1);
                    missingApprovedProds.push(newProd);
                    existingUrls.add(urlKey);
                    // Silently sync to Supabase products table in background
                    insertProductDirect(newProd);
                  }
                }

                const next = [...updatedExisting, ...missingApprovedProds].map((p, idx) => ({ ...p, rank: p.rank ?? (idx + 1) }));
                if (missingApprovedProds.length > 0 || JSON.stringify(next) !== JSON.stringify(currProducts)) {
                  debouncedSyncProducts(next);
                  return next;
                }
                return currProducts;
              });
            }

            return combined;
          });
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
            .filter((p) => !!p.submittedBy)
            .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999))
            .map((p, idx) => {
              const initial = INITIAL_PRODUCTS.find((init) => init.id === p.id);
              const resolvedLogo = initial?.logoUrl || (!p.logoUrl || p.logoUrl.includes('unsplash.com') ? getWebsiteFavicon(p.url) : p.logoUrl);
              return {
                ...(initial || {}),
                ...p,
                rank: p.rank ?? (idx + 1),
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

  // Active tab: derived from currentRoute so /ideas survives reload
  const activeTab: 'directory' | 'saas-ideas' = currentRoute === '/ideas' ? 'saas-ideas' : 'directory';

  // View layout
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VIEW_LAYOUT);
      if (saved === 'cards') return saved;
    } catch {}
    return 'cards';
  });

  // Search and Category filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

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

  // Product detail route state — resolved from /product/:id
  const [productRouteId, setProductRouteId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const m = window.location.pathname.match(/^\/product\/(.+)$/);
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

      const productMatch = path.match(/^\/product\/(.+)$/);
      if (productMatch) {
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

  // Load products from Supabase on mount (preserving rank order)
  const productsLoadedRef = React.useRef(false);
  useEffect(() => {
    async function load() {
      if (productsLoadedRef.current) return;
      productsLoadedRef.current = true;
      const dbProducts = await loadProducts();
      if (dbProducts !== null && dbProducts.length > 0) {
        const sorted = [...dbProducts].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
        setProducts(sorted.map((p, idx) => ({ ...p, rank: p.rank ?? (idx + 1) })));
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
    }
    load();
  }, []);

  // Check admin status and load user upvotes when signed in
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setUserUpvotes(new Set());
      return;
    }
    checkIsAdmin().then(setIsAdmin);
    getUserUpvotes().then(setUserUpvotes);
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

  // Re-rank helper: dynamically sorts and ranks products by upvotes descending
  // (Higher upvotes = higher rank (#1, #2, #3...). Products overtake others whenever they receive more upvotes)
  const recomputeRanks = useCallback((productList: Product[]): Product[] => {
    return [...productList]
      .sort((a, b) => {
        const upvoteDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
        if (upvoteDiff !== 0) return upvoteDiff;
        return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      })
      .map((p, index) => {
        const newRank = index + 1;
        return {
          ...p,
          previousRank: p.rank !== newRank ? (p.rank ?? newRank) : p.previousRank ?? newRank,
          rank: newRank,
        };
      });
  }, []);

  // Upvote a product (uses Supabase RPC for per-user tracking and dynamically updates ranks)
  const handleUpvote = async (product: Product) => {
    playSound('upvote', soundEnabled);

    if (user) {
      // Logged in: use Supabase RPC (one upvote per user per product)
      const result = await toggleUpvote(product.id);
      if (result === null) return; // error

      // Update local state based on RPC result
      setUserUpvotes((prev) => {
        const next = new Set(prev);
        if (result) next.add(product.id); else next.delete(product.id);
        return next;
      });

      setProducts((prev) => {
        const updated = prev.map((p) => {
          if (p.id === product.id) {
            const nextUpvotes = Math.max(0, (p.upvotes ?? 0) + (result ? 1 : -1));
            return { ...p, upvotes: nextUpvotes, updatedAt: Date.now() };
          }
          return p;
        });
        debouncedSyncProducts(updated);
        return updated;
      });
    } else {
      // Not logged in: simple local increment without destroying custom rank
      setProducts((prev) => {
        const updated = prev.map((p) => {
          if (p.id === product.id) {
            return { ...p, upvotes: (p.upvotes ?? 0) + 1, updatedAt: Date.now() };
          }
          return p;
        });
        debouncedSyncProducts(updated);
        return updated;
      });
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
      submittedBy: user?.id || 'local_user',
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
        (p) => p.url.toLowerCase().replace(/\/$/, '') === sub.url.toLowerCase().replace(/\/$/, '')
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
                description: sub.description || p.description,
                targetAudience: sub.targetAudience || p.targetAudience,
                pricingModel: sub.pricingModel || p.pricingModel,
                twitterHandle: sub.twitterHandle || p.twitterHandle,
                offerDiscount: sub.offerDiscount || p.offerDiscount,
                offerCode: sub.offerCode || p.offerCode,
                offerUrl: sub.offerUrl || p.offerUrl,
                offerDetails: sub.offerDetails || p.offerDetails,
                logoUrl: sub.logoUrl || p.logoUrl,
                screenshots: sub.screenshots && sub.screenshots.length > 0 ? sub.screenshots : p.screenshots,
                demoVideoUrl: sub.demoVideoUrl || p.demoVideoUrl,
                creatorName: sub.creatorName || p.creatorName,
                creatorUsername: sub.creatorUsername || p.creatorUsername,
                creatorXHandle: sub.creatorXHandle || p.creatorXHandle,
                creatorAvatar: sub.creatorAvatar || p.creatorAvatar,
                creatorRole: sub.creatorRole || p.creatorRole,
                socials: sub.socials && sub.socials.length > 0 ? sub.socials : p.socials,
              }
            : p
        );
        productToSync = nextProducts[existingIndex];
      } else {
        const newProd = submissionToProduct(approvedSub, prev.length + 1);
        productToSync = newProd;
        nextProducts = [...prev, newProd];
      }
      debouncedSyncProducts(nextProducts);
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
      const updated = prev.filter((p) => p.id !== productId);
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(updated));
      } catch {}
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
      withoutTarget.splice(insertIndex, 0, { ...target, rank: clampedRank });

      // Reassign all ranks sequentially
      const ranked = withoutTarget.map((p, idx) => ({
        ...p,
        previousRank: p.rank,
        rank: idx + 1,
      }));

      // Immediately sync to both localStorage and Supabase
      try {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(ranked));
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
  // Automatic ranking comparator: (upvotes * 2) + comments, tie-broken by upvotes, comments, then recency
  const compareProductsByRank = useCallback((a: Product, b: Product) => {
    const scoreA = (a.upvotes ?? 0) * 2 + (commentCounts[a.id] ?? 0);
    const scoreB = (b.upvotes ?? 0) * 2 + (commentCounts[b.id] ?? 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    const upvoteDiff = (b.upvotes ?? 0) - (a.upvotes ?? 0);
    if (upvoteDiff !== 0) return upvoteDiff;
    const commentDiff = (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0);
    if (commentDiff !== 0) return commentDiff;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  }, [commentCounts]);

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

  // Filter products by category and search query (within the selected week, strictly honoring rank order)
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
      return matchesCat && matchesQuery;
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
  }, [searchQuery, selectedCategory]);

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
    const nextRoute = tab === 'saas-ideas' ? '/ideas' : '/';
    setCurrentRoute(nextRoute);
    try {
      window.history.pushState({}, tab === 'saas-ideas' ? 'SaaS Ideas' : 'Directory', nextRoute);
    } catch {}
    if (tab === 'directory') {
      setSelectedCategory('All');
    }
    setCurrentPage(1);
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
          onBack={handleBackToLeaderboard}
          onSignOut={handleSignOut}
          onDeleteProduct={(productId) => setProducts((prev) => prev.filter((p) => p.id !== productId))}
          onUpdateProduct={(updated) => setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
          soundEnabled={soundEnabled}
        />
      </>
    );
  }

  // 1.5 PRODUCT DETAIL ROUTE (/product/:id)
  if (currentRoute === 'product') {
    const rawProduct = (productRouteId ? products.find((p) => p.id === productRouteId) : null) || null;
    const dynamicRank = rawProduct ? products.findIndex((p) => p.id === rawProduct.id) + 1 : 1;
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
          allProducts={products.map(markOwnership)}
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
          isUpvoted={userUpvotes.has(product.id)}
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
          onBackToDirectory={handleBackToLeaderboard}
          onOpenSubmitModal={handleOpenSubmit}
          onSeedSampleSubmissions={handleSeedSampleSubmissions}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          featuredProductId={featuredProductId}
          onSetFeatured={handleSetFeatured}
          onSaveProductsOrder={handleSaveProductsOrder}
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
        {/* Category chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none" role="navigation" aria-label="Browse by category">
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
                    verified={p.verified && (calculatedRank <= 5 || p.id === featuredProductId)}
                    commentCount={commentCounts[p.id] ?? 0}
                    onOpen={handleOpenProduct}
                    onUpvote={handleUpvote}
                    upvoted={userUpvotes.has(p.id)}
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
