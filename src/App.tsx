import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import { INITIAL_SUBMISSIONS } from './data/initialSubmissions';
import { Category, Product, WebsiteSubmission } from './types';
import { DinoGame } from './components/DinoGame';
import { HeroClaimBanner } from './components/HeroClaimBanner';
import { LeaderboardTable } from './components/LeaderboardTable';
import { ProductCard } from './components/ProductCard';
import { BidModal } from './components/BidModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { ShareModal } from './components/ShareModal';
import { Pagination } from './components/Pagination';
import { BorderBeam } from './components/BorderBeam';
import { AdminAcceptPage } from './components/AdminAcceptPage';
import { RichFooter } from './components/RichFooter';
import { Header } from './components/Header';
import { SignInModal } from './components/SignInModal';
import { ProfilePage } from './components/ProfilePage';
import { PaymentSuccess } from './components/PaymentSuccess';
import { SaaSIdeas } from './components/SaaSIdeas';
import { LegalPage } from './components/LegalPage';
import { playSound } from './utils/sound';
import { supabase } from './utils/supabase';
import { loadProducts, debouncedSyncProducts, toggleUpvote, getUserUpvotes, checkIsAdmin, getGlobalFeaturedProduct, setGlobalFeaturedProduct, submitVerifiedGameScore } from './utils/db';
import { getWebsiteFavicon } from './utils/logo';
import { LayoutGrid, Table as TableIcon, RefreshCw, Trophy, Sparkles, X, Plus, ShieldCheck, Crown, Loader2, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import { FeaturedSpotModal } from './components/FeaturedSpotModal';
import { GameOverModal } from './components/GameOverModal';
import { SkeletonCard } from './components/SkeletonCard';
import { SkeletonTable } from './components/SkeletonTable';

// Map a Supabase DB row to our WebsiteSubmission type
const mapDbSubmission = (row: Record<string, unknown>): WebsiteSubmission => ({
  id: row.id as string,
  name: row.name as string,
  tagline: row.tagline as string,
  url: row.url as string,
  logoUrl: (row.logo_url as string) || undefined,
  twitterHandle: (row.twitter_handle as string) || undefined,
  category: row.category as Category,
  backerName: (row.backer_name as string) || 'Creator',
  backerEmail: (row.backer_email as string) || undefined,
  status: row.status as WebsiteSubmission['status'],
  submittedAt: row.submitted_at as number,
  reviewedAt: (row.reviewed_at as number) || undefined,
  rejectionReason: (row.rejection_reason as string) || undefined,
  targetAudience: (row.target_audience as string) || undefined,
  pricingModel: (row.pricing_model as string) || undefined,
  submittedBy: (row.submitted_by as string) || undefined,
});

// Map a WebsiteSubmission to Supabase insert/update format
const toDbSubmission = (sub: WebsiteSubmission) => ({
  id: sub.id,
  name: sub.name,
  tagline: sub.tagline,
  url: sub.url,
  logo_url: sub.logoUrl || null,
  twitter_handle: sub.twitterHandle || null,
  category: sub.category,
  backer_name: sub.backerName,
  backer_email: sub.backerEmail || null,
  status: sub.status,
  submitted_at: sub.submittedAt,
  reviewed_at: sub.reviewedAt || null,
  rejection_reason: sub.rejectionReason || null,
  target_audience: sub.targetAudience || null,
  pricing_model: sub.pricingModel || null,
});

// Debounced sync of submissions to Supabase
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const syncSubmissionsToSupabase = (subs: WebsiteSubmission[]) => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      await supabase.from('submissions').upsert(
        subs.map(toDbSubmission),
        { onConflict: 'id' }
      );
    } catch {}
  }, 1000);
};

let idCounter = 0;
const generateUniqueId = (prefix: string = 'id') => {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
};

const STORAGE_KEYS = {
  PRODUCTS: 'directory_free_products_v5',
  SOUND: 'directory_sound_enabled',
  SUBMISSIONS: 'directory_pending_submissions_v1',
  VIEW_LAYOUT: 'directory_view_layout',
};

export default function App() {
  // Navigation / Route state (/ vs /accept)
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/accept' || hash === '#accept' || hash === '#/accept') {
        return '/accept';
      }
      if (path === '/payment-success' || hash === '#payment-success' || hash === '#/payment-success') {
        return '/payment-success';
      }
      if (path === '/profile' || hash === '#profile' || hash === '#/profile') {
        return '/profile';
      }
    }
    return '/';
  });



  // Submissions queue (Under Review / Approved / Rejected)
  const [submissions, setSubmissions] = useState<WebsiteSubmission[]>(INITIAL_SUBMISSIONS);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);

  // Load submissions from Supabase on mount
  useEffect(() => {
    async function loadSubmissions() {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .order('submitted_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setSubmissions(data.map(mapDbSubmission));
        }
      } catch {}
      setSubmissionsLoaded(true);
    }
    loadSubmissions();
  }, []);

  // Load persisted live products (only user-submitted ones; seed products are removed)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((p) => !!p.submittedBy)
            .map((p) => {
              const initial = INITIAL_PRODUCTS.find((init) => init.id === p.id);
              const resolvedLogo = initial?.logoUrl || (!p.logoUrl || p.logoUrl.includes('unsplash.com') ? getWebsiteFavicon(p.url) : p.logoUrl);
              return {
                ...(initial || {}),
                ...p,
                logoUrl: resolvedLogo,
                upvotes: 0,
                totalBid: 0,
                bidHistory: [],
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

  // In-Game Arcade Sound toggle (independent)
  const [gameSoundEnabled, setGameSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('topsaas_game_sound');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true;
  });

  // Global / UI Audio SFX toggle (under the game: OFF by default, independent)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('topsaas_ui_sound');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false; // OFF by default as requested
  });

  // Active tab: directory vs SaaS ideas
  const [activeTab, setActiveTab] = useState<'directory' | 'saas-ideas'>('directory');

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

  // Pagination state for homepage (50 list per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isFeaturedSpotModalOpen, setIsFeaturedSpotModalOpen] = useState(false);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const [gameOverStats, setGameOverStats] = useState({ score: 0, highScore: 0, isNewRecord: false });
  const [playAgainTrigger, setPlayAgainTrigger] = useState(0);
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

      if (path === '/accept' || hash === '#accept' || hash === '#/accept') {
        setCurrentRoute('/accept');
      } else if (path === '/payment-success' || hash === '#payment-success' || hash === '#/payment-success') {
        setCurrentRoute('/payment-success');
      } else if (path === '/profile' || hash === '#profile' || hash === '#/profile') {
        setCurrentRoute('/profile');
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
    setIsGameOverModalOpen(false);
    setPlayAgainTrigger(0);
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

  // Persist State Changes (products + sound to localStorage, submissions to Supabase)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(STORAGE_KEYS.SOUND, soundEnabled.toString());
    } catch {}
  }, [products, soundEnabled]);

  // Persist view layout preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VIEW_LAYOUT, viewLayout);
    } catch {}
  }, [viewLayout]);

  // Sync submissions to Supabase when they change (after initial load)
  useEffect(() => {
    if (!submissionsLoaded) return;
    syncSubmissionsToSupabase(submissions);
  }, [submissions, submissionsLoaded]);

  // Subscribe to realtime changes on submissions table for live admin updates
  useEffect(() => {
    if (!submissionsLoaded) return;
    const channel = supabase
      .channel('submissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRow = payload.new as Record<string, unknown>;
          setSubmissions((prev) => {
            const mapped = mapDbSubmission(newRow);
            if (prev.some((s) => s.id === mapped.id)) return prev;
            return [mapped, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Record<string, unknown>;
          setSubmissions((prev) =>
            prev.map((s) => (s.id === updated.id ? mapDbSubmission(updated) : s))
          );
        } else if (payload.eventType === 'DELETE') {
          const deleted = payload.old as Record<string, unknown>;
          setSubmissions((prev) => prev.filter((s) => s.id !== deleted.id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [submissionsLoaded]);

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

  // Load products from Supabase on mount (only once, then local state is source of truth)
  const productsLoadedRef = React.useRef(false);
  useEffect(() => {
    async function load() {
      if (productsLoadedRef.current) return;
      productsLoadedRef.current = true;
      const dbProducts = await loadProducts();
      if (dbProducts !== null) {
        setProducts(recomputeRanks(dbProducts));
      }
      setProductsLoaded(true);
    }
    load();
  }, []);

  // Sync products to Supabase when they change (after initial load)
  useEffect(() => {
    if (!productsLoaded) return;
    debouncedSyncProducts(products);
  }, [products, productsLoaded]);

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

  // Gated submit: show sign-in modal if not logged in, otherwise open submit
  const handleOpenSubmit = () => {
    if (!user) {
      setIsSignInModalOpen(true);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  // Auth: sign out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Sign out error:', error.message);
  };

  // Re-rank helper: sorts by upvotes and assigns fresh rank numbers
  const recomputeRanks = useCallback((productList: Product[]): Product[] => {
    const sorted = [...productList].sort((a, b) => (b.dinoScore ?? 0) - (a.dinoScore ?? 0));
    return sorted.map((p, index) => {
      const newRank = index + 1;
      return {
        ...p,
        previousRank: p.rank !== newRank ? p.rank : p.previousRank ?? newRank,
        rank: newRank,
      };
    });
  }, []);

  // Upvote a product (uses Supabase RPC for per-user tracking)
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

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === product.id) {
            return { ...p, upvotes: (p.upvotes ?? 0) + (result ? 1 : -1), updatedAt: Date.now() };
          }
          return p;
        })
      );
    } else {
      // Not logged in: simple local increment
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === product.id) {
            return { ...p, upvotes: (p.upvotes ?? 0) + 1, updatedAt: Date.now() };
          }
          return p;
        })
      );
    }
  };

  // Handle User Submission (Places into "under_review" queue)
  const handleConfirmSubmit = async ({
    name,
    tagline,
    url,
    category,
  }: {
    name: string;
    tagline: string;
    url: string;
    category: Category;
  }) => {
    // Block if user already has a product
    if (user && products.some((p) => p.submittedBy === user.id)) return;

    const now = Date.now();
    const subId = generateUniqueId('sub');
    const newProdId = generateUniqueId('prod');

    const newProd: Product = {
      id: newProdId,
      rank: products.length + 1,
      previousRank: products.length + 1,
      name,
      tagline,
      url,
      logoUrl: getWebsiteFavicon(url),
      category,
      totalBid: 0,
      dinoScore: 0,
      upvotes: 0,
      clicks: 0,
      createdAt: now,
      updatedAt: now,
      verified: false,
      isUserOwned: true,
      submittedBy: user?.id || 'local_user',
      description: `${name} is a product in the ${category} ecosystem. ${tagline}.`,
      whatItDoes: [],
      features: [],
      useCases: [],
      targetAudience: '',
      pricingModel: '',
      keyHighlights: [],
      bidHistory: [],
    };

    setMyProductId(newProdId);
    try {
      localStorage.setItem('topsaas_my_product_id', newProdId);
    } catch {}

    setProducts((prev) => {
      const next = recomputeRanks([...prev, newProd]);
      debouncedSyncProducts(next);
      try {
        localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Also create an approved submission record (all submissions accepted instantly)
    const newSubmission: WebsiteSubmission = {
      id: subId,
      name,
      tagline,
      url,
      logoUrl: getWebsiteFavicon(url),
      category,
      backerName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Creator',
      backerEmail: user?.email,
      status: 'approved',
      submittedAt: now,
      reviewedAt: now,
      submittedBy: user?.id || 'local_user',
    };
    setSubmissions((prev) => [...prev, newSubmission]);
    try {
      await supabase.from('submissions').insert(toDbSubmission(newSubmission));
      await supabase.from('products').insert(toDbProduct(newProd));
    } catch {}
  };

  // Admin Acceptance Pipeline: converts a submission into a live Product on the website
  const handleAcceptSubmission = async (sub: WebsiteSubmission) => {
    // 1. Update status to approved in submissions queue + Supabase
    const reviewedAt = Date.now();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === sub.id ? { ...s, status: 'approved', reviewedAt } : s
      )
    );
    try {
      await supabase.from('submissions').update({ status: 'approved', reviewed_at: reviewedAt }).eq('id', sub.id);
    } catch {}

    // 2. Add to live products (if not already existing by URL)
    setProducts((prev) => {
      const existingIndex = prev.findIndex(
        (p) => p.url.toLowerCase().replace(/\/$/, '') === sub.url.toLowerCase().replace(/\/$/, '')
      );

      if (existingIndex >= 0) {
        return prev.map((p, idx) =>
          idx === existingIndex
            ? { ...p, name: sub.name, tagline: sub.tagline, category: sub.category, verified: true }
            : p
        );
      }

      const newProd: Product = {
        id: generateUniqueId('prod'),
        rank: prev.length + 1,
        previousRank: prev.length + 1,
        name: sub.name,
        tagline: sub.tagline,
        url: sub.url,
        logoUrl: sub.logoUrl || getWebsiteFavicon(sub.url),
        twitterHandle: sub.twitterHandle,
        category: sub.category,
        totalBid: 0,
        upvotes: 0,
        clicks: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        verified: true,
        isUserOwned: false,
        submittedBy: sub.submittedBy,
        description: `${sub.name} is a high-quality product in the ${sub.category} ecosystem. ${sub.tagline}.`,
        whatItDoes: [
          `Core Workflow Acceleration: Streamlines essential ${sub.category.toLowerCase()} tasks.`,
          `Intuitive User Interface: Clean usability and keyboard-friendly navigation.`,
          `High Reliability & Speed: Designed for scale with secure cloud infrastructure.`,
          `Integration Capabilities: Connects with your favorite web and developer workflows.`
        ],
        features: [
          { title: 'Modern Web Architecture', description: `Built with cutting-edge tech for ${sub.category.toLowerCase()} workflows.`, tag: 'Core Superpower' },
          { title: 'Instant Setup & Onboarding', description: 'Get started in seconds with zero friction.', tag: 'Usability' }
        ],
        useCases: [
          { title: 'Productivity & Flow Optimization', description: `Empowers builders to achieve higher throughput in ${sub.category.toLowerCase()}.`, audience: 'Builders & Teams' }
        ],
        targetAudience: 'Makers, software builders, and modern digital teams.',
        pricingModel: 'Free tier / Flexible plans available',
        keyHighlights: [
          { label: 'Category', value: sub.category },
          { label: 'Submitted By', value: sub.backerName || 'Community Creator' },
          { label: 'Status', value: 'Live on Directory' }
        ],
        bidHistory: [],
      };

      return recomputeRanks([...prev, newProd]);
    });
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
    setSubmissions((prev) => prev.filter((s) => s.id !== submissionId));
    try {
      await supabase.from('submissions').delete().eq('id', submissionId);
    } catch {}
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

  // Track click on a website
  const handleTrackClick = (productId: string, _url: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, clicks: p.clicks + 1 } : p))
    );
  };

  // Delist a product — removes it from the live directory
  const handleDelistProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Manually assign a product to a specific rank (1-based)
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
      return withoutTarget.map((p, idx) => ({
        ...p,
        previousRank: p.rank,
        rank: idx + 1,
      }));
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

  const topProduct = (featuredProductId ? products.find((p) => p.id === featuredProductId) : null) || products[0] || null;
  // Compute isUserOwned dynamically from submittedBy or myProductId
  const markOwnership = (p: Product) => ({
    ...p,
    isUserOwned: !!(
      (user && p.submittedBy && p.submittedBy === user.id) ||
      (myProductId && p.id === myProductId) ||
      p.isUserOwned
    ),
  });
  const topThreeProducts = products.slice(0, 3).map(markOwnership);

  const pendingReviewCount = submissions.filter((s) => s.status === 'under_review').length;

  // Filter products by category and search query
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.tagline.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  }).map(markOwnership);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

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

  // 0. PAYMENT SUCCESS ROUTE (/payment-success)
  if (currentRoute === '/payment-success') {
    return (
      <PaymentSuccess
        onBackToDirectory={handleBackToLeaderboard}
        soundEnabled={soundEnabled}
        onActivateFeatured={(productId) => {
          setFeaturedProductId(productId);
        }}
      />
    );
  }

  // 0.5 PROFILE PAGE ROUTE (/profile)
  if (currentRoute === '/profile') {
    if (!authLoaded) {
      return (
        <div className="min-h-screen bg-neutral-50 text-black flex items-center justify-center font-sans">
          <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
        </div>
      );
    }
    if (!user) {
      setIsSignInModalOpen(true);
      setCurrentRoute('/');
      return null;
    }
    return (
      <ProfilePage
        user={user}
        onBack={handleBackToLeaderboard}
        onSignOut={handleSignOut}
        onDeleteProduct={(productId) => setProducts((prev) => prev.filter((p) => p.id !== productId))}
      />
    );
  }

  // 1. ADMIN ACCEPT PAGE ROUTE (/accept)
  if (currentRoute === '/accept') {
    // Non-admins get redirected to homepage
    if (user && !isAdmin) {
      return (
        <div className="min-h-screen bg-neutral-100 text-black flex items-center justify-center font-sans">
          <div className="text-center space-y-3">
            <ShieldCheck className="mx-auto h-10 w-10 text-neutral-400" />
            <h2 className="text-lg font-bold">Admin Access Required</h2>
            <p className="text-sm text-neutral-500">You don't have admin privileges.</p>
            <button onClick={handleBackToLeaderboard} className="mt-2 rounded-xl bg-black text-white px-4 py-2 text-xs font-bold cursor-pointer">Back to Directory</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-neutral-100 text-black flex flex-col justify-between font-sans">
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
        />

        {/* Submit Website Modal */}
        <BidModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirmSubmit={handleConfirmSubmit}
          soundEnabled={soundEnabled}
          hasProduct={!!(user && products.some((p) => p.submittedBy === user.id))}
        />
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
      <LegalPage
        initialDoc={currentRoute === '/terms' ? 'terms' : 'privacy'}
        onBack={handleBackToLeaderboard}
        onOpenSubmit={handleOpenSubmit}
        onSignIn={handleSignIn}
        onGoToProfile={handleGoToProfile}
        user={user}
        totalProducts={products.length}
        totalScore={products.reduce((s, p) => s + (p.dinoScore ?? 0), 0)}
        soundEnabled={soundEnabled}
        onSelectCategory={setSelectedCategory}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />
    );
  }

  // 2. MAIN DIRECTORY HOMEPAGE ROUTE
  return (
    <div className="min-h-screen bg-neutral-50 text-black flex flex-col justify-between selection:bg-black selection:text-white font-sans">
      <Header
        onGoHome={handleBackToLeaderboard}
        onOpenSubmit={handleOpenSubmit}
        onSignIn={handleSignIn}
        onGoToProfile={handleGoToProfile}
        user={user}
      />
      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-5xl px-3.5 sm:px-6 space-y-3 sm:space-y-4 flex-1 pb-8 pt-4">
        {/* Dino Runner Game Arcade Hero */}
        <DinoGame
          soundEnabled={gameSoundEnabled}
          onToggleSound={() => {
            setGameSoundEnabled((prev) => {
              const next = !prev;
              try { localStorage.setItem('topsaas_game_sound', next.toString()); } catch {}
              return next;
            });
          }}
          playAgainTrigger={playAgainTrigger}
          featuredProduct={featuredProductId && topProduct ? topProduct : null}
          onOpenFeaturedSpotModal={() => {
            if (!user) setIsSignInModalOpen(true);
            else setIsFeaturedSpotModalOpen(true);
          }}
          onTrackClick={handleTrackClick}
          isModalOpen={
            isSubmitModalOpen ||
            isSignInModalOpen ||
            !!shareProduct ||
            isHowItWorksOpen ||
            isFeaturedSpotModalOpen ||
            isGameOverModalOpen
          }
          onGameOver={(score, highScore, isNewRecord, durationMs = 1000) => {
            setGameOverStats({ score, highScore, isNewRecord });
            setIsGameOverModalOpen(true);
            if (score <= 0) return;

            const savedMyId = myProductId || localStorage.getItem('topsaas_my_product_id');

            // Find target product
            const target = products.find(
              (p) =>
                (savedMyId && p.id === savedMyId) ||
                (user && p.submittedBy && p.submittedBy === user.id) ||
                p.isUserOwned
            );

            if (!target) return;

            // Submit verified score to Supabase anti-cheat RPC (no score cap, verified by real time velocity)
            submitVerifiedGameScore(target.id, score, durationMs).then((res) => {
              if (res.success && res.new_total_score !== undefined) {
                setProducts((prev) => {
                  const updated = prev.map((p) =>
                    p.id === target.id
                      ? { ...p, dinoScore: res.new_total_score, isUserOwned: true, updatedAt: Date.now() }
                      : p
                  );
                  const reRanked = recomputeRanks(updated);
                  try {
                    localStorage.setItem('topsaas_products_cache_v2', JSON.stringify(reRanked));
                  } catch {}
                  return reRanked;
                });
              } else if (!res.success) {
                console.warn('Score rejected by velocity verification:', res.error);
              }
            });

            // Optimistic instant UI update
            setProducts((prev) => {
              const targetIndex = prev.findIndex((p) => p.id === target.id);
              if (targetIndex === -1) return prev;
              const updatedScore = (target.dinoScore ?? 0) + score;
              const updatedProducts = prev.map((p, idx) =>
                idx === targetIndex
                  ? { ...p, dinoScore: updatedScore, isUserOwned: true, updatedAt: Date.now() }
                  : p
              );
              const reRanked = recomputeRanks(updatedProducts);
              return reRanked;
            });
          }}
        />

        {/* Under Dino Game: Tagline & Meta bar */}
        <div className="text-center space-y-1 pt-0.5 pb-1">
          <p className="text-xs sm:text-sm font-bold text-neutral-800">
            Game your way to the top.
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-neutral-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-black font-mono-num">{products.length}</span>
              <span>websites listed</span>
            </div>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                playSound('click', next);
                setSoundEnabled(next);
                try { localStorage.setItem('topsaas_ui_sound', next.toString()); } catch {}
              }}
              className="inline-flex items-center gap-1 hover:text-black transition-colors cursor-pointer"
              title={soundEnabled ? 'Disable UI sound effects' : 'Enable UI sound effects'}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span>{soundEnabled ? 'Audio on' : 'Audio off'}</span>
            </button>
            <span className="text-neutral-300">•</span>
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setIsHowItWorksOpen(true);
              }}
              className="inline-flex items-center gap-1 hover:text-black underline cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>How it works</span>
            </button>
          </div>
        </div>

        {/* Quick Access Tabs */}
        <div className="flex items-center justify-center">
          <div className="relative inline-flex rounded-xl border border-neutral-300 bg-neutral-100 p-1 shadow-2xs">
            {/* Sliding indicator */}
            <div
              className="absolute top-1 bottom-1 rounded-[9px] bg-white shadow-sm transition-all duration-300 ease-out"
              style={{
                left: activeTab === 'directory' ? '4px' : 'calc(50%)',
                right: activeTab === 'directory' ? 'calc(50%)' : '4px',
              }}
            />
            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); setActiveTab('directory'); setSelectedCategory('All'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`relative z-10 flex items-center gap-1.5 rounded-[9px] px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'directory'
                  ? 'text-black'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Startup</span>
            </button>
            <button
              type="button"
              onClick={() => { playSound('click', soundEnabled); setActiveTab('saas-ideas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`relative z-10 flex items-center gap-1.5 rounded-[9px] px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'saas-ideas'
                  ? 'text-black'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>SaaS Ideas</span>
            </button>
          </div>
        </div>

        {activeTab === 'saas-ideas' ? (
          <SaaSIdeas
            soundEnabled={soundEnabled}
            topProducts={topThreeProducts}
            featuredProductId={featuredProductId}
            featuredProduct={topProduct}
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
          />
        ) : (
        <>
        {selectedCategory === 'All' && !searchQuery.trim() ? (
          featuredProductId && topProduct ? (
            <BorderBeam
              duration={5}
              size={260}
              colorFrom="#ffaa40"
              colorMid="#9c40ff"
              colorTo="#00d2ff"
            >
              <HeroClaimBanner
                topProduct={topProduct}
                soundEnabled={soundEnabled}
                onTrackClick={handleTrackClick}
              />
            </BorderBeam>
          ) : featuredProductId === '' ? (
            /* Empty state: admin cleared featured, show nothing */
            null
          ) : (
            /* Default state: no featured assigned yet, show bid placeholder */
            <BorderBeam
              duration={5}
              size={260}
              colorFrom="#ffaa40"
              colorMid="#9c40ff"
              colorTo="#00d2ff"
            >
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  if (!user) {
                    setIsSignInModalOpen(true);
                  } else {
                    setIsFeaturedSpotModalOpen(true);
                  }
                }}
                className="w-full rounded-xl border-2 border-neutral-300 bg-white px-3 py-4 sm:px-4 sm:py-5 hover:bg-neutral-50 transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="h-4 w-4 text-neutral-300 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-neutral-400">Featured spot</p>
                    <span className="text-[10px] text-neutral-400">—</span>
                    <p className="text-[11px] text-neutral-500 font-medium">Get featured for 30 days</p>
                  </div>
                </div>
              </button>
            </BorderBeam>
          )
        ) : selectedCategory !== 'All' && topThreeProducts.length > 0 ? (
          /* When any category is selected, ALWAYS show Top 3 at the top before showing the category */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-black text-white shadow-2xs">
                  <Trophy className="h-3 w-3 fill-white stroke-white" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-wider text-black">
                  Top 3 Websites
                </h2>
                <span className="rounded-md bg-neutral-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-800">
                  Rank #1 - #3
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium hidden sm:inline">
                Highest community ranked
              </span>
            </div>

            {/* Top 3 Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {topThreeProducts.map((p, index) => (
                <ProductCard
                  key={`top-three-showcase-${p.id}`}
                  product={p}
                  rank={p.rank ?? index + 1}
                  soundEnabled={soundEnabled}
                  showVerified={(p.rank ?? index + 1) <= 5 || p.id === featuredProductId}
                  onShareProduct={(prod) => setShareProduct(prod)}
                  onTrackClick={handleTrackClick}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* View Mode Toolbar & Category Header */}
        <div className={`flex items-center justify-between gap-3 pt-1 ${selectedCategory !== 'All' ? 'border-t border-neutral-200 pt-3.5 mt-2' : ''}`}>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCategory !== 'All' ? (
              <>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-black">
                  {selectedCategory}
                </h3>
                <span className="rounded-full bg-black text-white px-2 py-0.5 text-[10px] sm:text-xs font-bold font-mono-num">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'website' : 'websites'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setSelectedCategory('All');
                  }}
                  className="text-xs font-semibold text-neutral-500 hover:text-black underline cursor-pointer ml-1"
                >
                  View All
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                <span className="font-bold text-black font-mono-num">
                  {filteredProducts.length}
                </span>
                <span>
                  {searchQuery.trim()
                    ? `of ${products.length} found`
                    : filteredProducts.length === 1
                    ? 'website'
                    : 'websites'}
                </span>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setSearchQuery('');
                    }}
                    className="ml-1 inline-flex items-center gap-0.5 text-xs font-bold text-neutral-700 hover:text-black underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Table / Cards View Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  playSound('hover', soundEnabled);
                  setViewLayout('cards');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewLayout === 'cards'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('hover', soundEnabled);
                  setViewLayout('table');
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewLayout === 'table'
                    ? 'bg-black text-white shadow-2xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
                title="Table View"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Leaderboard Rendering */}
        {!productsLoaded ? (
          /* Skeleton loading state */
          viewLayout === 'table' ? (
            <SkeletonTable />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))}
              </div>
            </div>
          )
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-xs">
            <Trophy className="mx-auto h-10 w-10 text-neutral-400 mb-3" />
            <h3 className="text-lg font-bold text-black">No websites found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4 font-medium">
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
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-black hover:bg-neutral-100 shadow-2xs cursor-pointer"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Submit Website</span>
              </button>
            </div>
          </div>
        ) : (
          <div id="leaderboard-section" className="space-y-3">
            {/* Table View */}
            {viewLayout === 'table' ? (
              <div className="overflow-x-auto">
                <LeaderboardTable
                  products={paginatedProducts}
                  soundEnabled={soundEnabled}
                  featuredProductId={featuredProductId}
                  onShareProduct={(p) => setShareProduct(p)}
                  onTrackClick={handleTrackClick}
                  
                />
              </div>
            ) : (
              /* Cards Grid View (3 columns on desktop, 2 on tablet, 1 on mobile) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                {paginatedProducts.map((p, index) => {
                  const calculatedRank = p.rank ?? (startIndex + index + 1);
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      rank={calculatedRank}
                      soundEnabled={soundEnabled}
                      showVerified={calculatedRank <= 5 || p.id === featuredProductId}
                      onShareProduct={(prod) => setShareProduct(prod)}
                      onTrackClick={handleTrackClick}
                    />
                  );
                })}
              </div>
            )}

            {/* Homepage Pagination: 50 items per page */}
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
        </>
        )}
      </main>

      {/* Footer */}
      <RichFooter
        totalProducts={products.length}
        totalScore={products.reduce((s, p) => s + (p.dinoScore ?? 0), 0)}
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

      {/* Submit Website Modal (Under Review Queue) */}
      <BidModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        soundEnabled={soundEnabled}
        hasProduct={!!(user && products.some((p) => p.submittedBy === user.id))}
        featuredProductId={featuredProductId}
        featuredProduct={topProduct}
        onOpenFeaturedSpotModal={() => {
          setIsSubmitModalOpen(false);
          setIsFeaturedSpotModalOpen(true);
        }}
        onTrackClick={handleTrackClick}
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
          setIsSubmitModalOpen(true);
        }}
      />

      {/* Game Over Details Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        onClose={() => setIsGameOverModalOpen(false)}
        score={gameOverStats.score}
        highScore={gameOverStats.highScore}
        isNewRecord={gameOverStats.isNewRecord}
        featuredProductId={featuredProductId}
        featuredProduct={topProduct}
        onOpenFeaturedSpotModal={() => {
          if (!user) {
            setIsSignInModalOpen(true);
          } else {
            setIsFeaturedSpotModalOpen(true);
          }
        }}
        onTrackClick={handleTrackClick}
        onPlayAgain={() => {
          setIsGameOverModalOpen(false);
          setPlayAgainTrigger((c) => c + 1);
        }}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
