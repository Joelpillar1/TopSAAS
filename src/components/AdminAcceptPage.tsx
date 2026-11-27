import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowUpDown, Check, X, Clock, ExternalLink, ShieldCheck, Search, Trash2, Eye, RotateCcw, Globe, Twitter, User, Calendar, CheckCircle2, XCircle, AlertCircle, Edit3, Plus, Trophy, Crown, ChevronUp, ChevronDown, Star, LayoutList, Mail, Flame, Tag, Play, Pause, Video, Copy, Image as ImageIcon, MessageSquareQuote, Target, Layers, Info, Sparkles, BadgeCheck, Megaphone, Award, LogOut, Rocket
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WebsiteSubmission, Category, Product, Sponsor, SponsorDraft } from '../types';
import { playSound } from '../utils/sound';
import { getWebsiteFavicon } from '../utils/logo';
import { publishedProductId, loadSubmissionById, isSponsorOnlyProduct, getProductSlug } from '../utils/db';
import { getWeekByNumber, getWeekInfo, formatWeekDateRange, getWeekNumber, getWeeksRange } from '../utils/weeks';
import { getCountdown, formatRemainingMs } from '../utils/countdown';
import { RichText } from './RichText';
import { ProductLogo } from './ProductLogo';
import { RankMedal } from './RankMedal';
import { VerifiedBadge } from './VerifiedBadge';
import { SponsorTrackerTab } from './SponsorTrackerTab';

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

interface AdminAcceptPageProps {
  submissions: WebsiteSubmission[];
  products: Product[];
  sponsors: Sponsor[];
  onCreateSponsor: (draft: SponsorDraft) => Promise<void> | void;
  onUpdateSponsor: (sponsor: Sponsor) => Promise<void> | void;
  onEndSponsor: (sponsorId: string) => Promise<void> | void;
  onPauseSponsor: (sponsorId: string) => Promise<void> | void;
  onAcceptSubmission: (submission: WebsiteSubmission) => void;
  onRejectSubmission: (submissionId: string, reason?: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onUpdateSubmission: (updated: WebsiteSubmission) => void;
  onRestoreSubmission: (submissionId: string) => void;
  onDelistProduct: (productId: string) => void;
  onAssignRank?: (productId: string, newRank: number) => void;
  onAutoRankByUpvotes?: () => void;
  onSaveProductsOrder?: () => void;
  onBackToDirectory: () => void;
  onOpenSubmitModal: () => void;
  onSeedSampleSubmissions: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  featuredProductId: string | null;
  featuredExpiresAt?: number | null;
  onSetFeatured: (productId: string | null) => void;
  featuredProductIds?: string[];
  onSetFeaturedProducts?: (productIds: string[], mode?: 'active' | 'default' | 'empty') => void;
  onToggleVerified?: (productId: string, verified: boolean) => void;
  onUpdateProduct?: (product: Product) => void;
  sponsorRailsEnabled?: boolean;
  onToggleSponsorRails?: (enabled: boolean) => void;
  sponsorOrderIds?: string[];
  onSetSponsorOrder?: (ids: string[]) => void;
  featuredPosition?: number;
  onSetFeaturedPosition?: (position: number) => void;
  featuredPositions?: Record<string, number>;
  onSetProductFeaturedPosition?: (productId: string, position: number) => void;
  onSignOutAdmin?: () => void;
  onRefreshSubmissions?: () => Promise<void>;
}

export const AdminAcceptPage: React.FC<AdminAcceptPageProps> = ({
  submissions,
  products,
  sponsors,
  onCreateSponsor,
  onUpdateSponsor,
  onEndSponsor,
  onPauseSponsor,
  onAcceptSubmission,
  onRejectSubmission,
  onDeleteSubmission,
  onUpdateSubmission,
  onRestoreSubmission,
  onDelistProduct,
  onAssignRank,
  onAutoRankByUpvotes,
  onBackToDirectory,
  onOpenSubmitModal,
  onSeedSampleSubmissions,
  soundEnabled,
  featuredProductId,
  featuredExpiresAt,
  onSetFeatured,
  featuredProductIds = [],
  onSetFeaturedProducts,
  onToggleVerified,
  onUpdateProduct,
  sponsorRailsEnabled = true,
  onToggleSponsorRails,
  sponsorOrderIds = [],
  onSetSponsorOrder,
  featuredPosition = 0,
  onSetFeaturedPosition,
  featuredPositions = {},
  onSetProductFeaturedPosition,
  onSignOutAdmin,
  onRefreshSubmissions,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (isRefreshing || !onRefreshSubmissions) return;
    setIsRefreshing(true);
    playSound('click', soundEnabled);
    try {
      await onRefreshSubmissions();
      playSound('success', soundEnabled);
    } catch { }
    finally {
      setIsRefreshing(false);
    }
  };

  // Counts
  const pendingCount = submissions.filter((s) => (s.status || 'under_review') === 'under_review').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Launch state helpers: determine whether a project has launched live or is scheduled in the future
  const isLaunched = (p: { scheduledLaunchWeek?: number; scheduledLaunchDate?: number; createdAt?: number }, now = Date.now()): boolean => {
    if (p.scheduledLaunchWeek != null) {
      return getWeekByNumber(Number(p.scheduledLaunchWeek)).start <= now;
    }
    if (p.scheduledLaunchDate != null) {
      return Number(p.scheduledLaunchDate) <= now;
    }
    if (p.createdAt && Number(p.createdAt) > now) {
      return false;
    }
    return true;
  };

  const getTargetLaunchMs = (item: { scheduledLaunchWeek?: number; scheduledLaunchDate?: number; createdAt?: number }): number => {
    if (item.scheduledLaunchWeek != null) {
      return getWeekByNumber(Number(item.scheduledLaunchWeek)).start;
    }
    if (item.scheduledLaunchDate != null) {
      return Number(item.scheduledLaunchDate);
    }
    if (item.createdAt && Number(item.createdAt) > Date.now()) {
      return Number(item.createdAt);
    }
    return Date.now();
  };

  // Live products: directory products whose launch date/week has arrived
  const liveDirectoryProducts = products.filter((p) => !isSponsorOnlyProduct(p) && isLaunched(p));
  // Queued future products: directory products whose launch date/week is in the future
  const queuedDirectoryProducts = products.filter((p) => !isSponsorOnlyProduct(p) && !isLaunched(p));
  // Keep directoryProducts referencing liveDirectoryProducts so existing table logic only affects live products
  const directoryProducts = liveDirectoryProducts;

  const activeSponsorsCount = sponsors.filter(
    (s) => s.status === 'active' && s.expiresAt > Date.now()
  ).length;

  // Active view tab: submissions queue vs future launches vs products management vs featured vs sponsors
  const [activeView, setActiveView] = useState<'submissions' | 'future' | 'products' | 'featured' | 'sponsors'>('submissions');

  // Unified future launches (products & submissions scheduled for future dates/weeks, arranged chronologically)
  const allFutureLaunches = React.useMemo(() => {
    const list: Array<{
      id: string;
      sourceType: 'product' | 'submission';
      productRef?: Product;
      submissionRef?: WebsiteSubmission;
      name: string;
      tagline: string;
      url: string;
      category: string;
      logoUrl?: string;
      scheduledLaunchWeek?: number;
      scheduledLaunchDate?: number;
      targetLaunchMs: number;
      targetWeekNumber: number;
      isApproved: boolean;
      status: 'scheduled' | 'under_review';
      pricingModel?: string;
      twitterHandle?: string;
      creatorName?: string;
      creatorUsername?: string;
      creatorAvatar?: string;
      submittedBy?: string;
      userEmail?: string;
      screenshots?: string[];
      demoVideoUrl?: string;
      offerDiscount?: string;
      offerCode?: string;
      autoRelaunch?: boolean;
      createdAt: number;
    }> = [];

    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();

    // 1. Add queued directory products (approved products whose launch timestamp is in the future)
    for (const p of queuedDirectoryProducts) {
      const targetMs = getTargetLaunchMs(p);
      const targetWeek = p.scheduledLaunchWeek != null ? Number(p.scheduledLaunchWeek) : getWeekInfo(targetMs).weekNumber;
      list.push({
        id: p.id,
        sourceType: 'product',
        productRef: p,
        name: p.name,
        tagline: p.tagline,
        url: p.url,
        category: p.category,
        logoUrl: p.logoUrl,
        scheduledLaunchWeek: p.scheduledLaunchWeek,
        scheduledLaunchDate: p.scheduledLaunchDate,
        targetLaunchMs: targetMs,
        targetWeekNumber: targetWeek,
        isApproved: true,
        status: 'scheduled',
        pricingModel: p.pricingModel,
        twitterHandle: p.twitterHandle,
        creatorName: p.creatorName,
        creatorUsername: p.creatorUsername,
        creatorAvatar: p.creatorAvatar,
        submittedBy: p.submittedBy,
        screenshots: p.screenshots,
        demoVideoUrl: p.demoVideoUrl,
        offerDiscount: p.offerDiscount,
        offerCode: p.offerCode,
        autoRelaunch: p.autoRelaunch || p.autoRelaunchPaid,
        createdAt: p.createdAt || Date.now(),
      });
      seenIds.add(p.id);
      if (p.url) seenUrls.add(p.url.toLowerCase());
    }

    // 2. Add future launch submissions that are not already live or queued
    for (const s of submissions) {
      if (s.status === 'rejected') continue;
      const pubId = publishedProductId(s.id);
      const urlKey = (s.url || '').toLowerCase();

      // Check if already in live directory products
      const isLive = liveDirectoryProducts.some((p) => p.id === pubId || (p.url && p.url.toLowerCase() === urlKey));
      if (isLive) continue;

      if (seenIds.has(pubId) || seenIds.has(s.id) || (urlKey && seenUrls.has(urlKey))) {
        const match = list.find((it) => it.id === pubId || it.id === s.id || (urlKey && it.url.toLowerCase() === urlKey));
        if (match && !match.submissionRef) {
          match.submissionRef = s;
          match.userEmail = s.userEmail;
        }
        continue;
      }

      // Check if future scheduled
      if (!isLaunched(s)) {
        const targetMs = getTargetLaunchMs(s);
        const targetWeek = s.scheduledLaunchWeek != null ? Number(s.scheduledLaunchWeek) : getWeekInfo(targetMs).weekNumber;
        list.push({
          id: s.id,
          sourceType: 'submission',
          submissionRef: s,
          name: s.name,
          tagline: s.tagline,
          url: s.url,
          category: s.category,
          logoUrl: s.logoUrl,
          scheduledLaunchWeek: s.scheduledLaunchWeek,
          scheduledLaunchDate: s.scheduledLaunchDate,
          targetLaunchMs: targetMs,
          targetWeekNumber: targetWeek,
          isApproved: s.status === 'approved',
          status: s.status === 'approved' ? 'scheduled' : 'under_review',
          pricingModel: s.pricingModel,
          twitterHandle: s.twitterHandle,
          creatorName: s.creatorName || s.backerName,
          creatorUsername: s.creatorUsername,
          creatorAvatar: s.creatorAvatar,
          submittedBy: s.submittedBy,
          userEmail: s.userEmail,
          screenshots: s.screenshots,
          demoVideoUrl: s.demoVideoUrl,
          offerDiscount: s.offerDiscount,
          offerCode: s.offerCode,
          autoRelaunch: s.autoRelaunch || s.autoRelaunchPaid,
          createdAt: s.createdAt || Date.now(),
        });
        seenIds.add(s.id);
        seenIds.add(pubId);
        if (urlKey) seenUrls.add(urlKey);
      }
    }

    // Arranged chronologically by date: soonest launch first
    return list.sort((a, b) => a.targetLaunchMs - b.targetLaunchMs);
  }, [queuedDirectoryProducts, liveDirectoryProducts, submissions]);

  // Future Launches filter & sort state
  const [futureSearchQuery, setFutureSearchQuery] = useState('');
  const [futureCategoryFilter, setFutureCategoryFilter] = useState<string>('All');
  const [futureStatusFilter, setFutureStatusFilter] = useState<'all' | 'scheduled' | 'under_review'>('all');
  const [futureSortOrder, setFutureSortOrder] = useState<'date_asc' | 'date_desc' | 'name'>('date_asc');
  const [reschedulingItem, setReschedulingItem] = useState<(typeof allFutureLaunches)[0] | null>(null);
  const [rescheduleWeekChoice, setRescheduleWeekChoice] = useState<number | 'now' | null>(null);
  const [futureLaunchToast, setFutureLaunchToast] = useState<string | null>(null);

  const filteredFutureLaunches = React.useMemo(() => {
    return allFutureLaunches
      .filter((item) => {
        if (futureStatusFilter === 'scheduled' && !item.isApproved) return false;
        if (futureStatusFilter === 'under_review' && item.isApproved) return false;
        if (futureCategoryFilter !== 'All' && item.category !== futureCategoryFilter) return false;
        if (futureSearchQuery.trim()) {
          const q = futureSearchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchTagline = item.tagline.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          const matchUrl = item.url.toLowerCase().includes(q);
          if (!matchName && !matchTagline && !matchCategory && !matchUrl) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (futureSortOrder === 'date_asc') return a.targetLaunchMs - b.targetLaunchMs;
        if (futureSortOrder === 'date_desc') return b.targetLaunchMs - a.targetLaunchMs;
        return a.name.localeCompare(b.name);
      });
  }, [allFutureLaunches, futureStatusFilter, futureCategoryFilter, futureSearchQuery, futureSortOrder]);

  // Only auto-switch to submissions on initial mount if pending items exist
  const hasInitializedTab = React.useRef(false);
  React.useEffect(() => {
    if (!hasInitializedTab.current) {
      hasInitializedTab.current = true;
      if (pendingCount > 0) {
        setActiveView('submissions');
      }
    }
  }, [pendingCount]);

  // Submissions state
  const [statusFilter, setStatusFilter] = useState<'all' | 'under_review' | 'approved' | 'rejected'>('under_review');
  const [showOnlyAutoRelaunch, setShowOnlyAutoRelaunch] = useState(false);
  const autoRelaunchCount = submissions.filter((s) => s.autoRelaunch || s.autoRelaunchPaid).length;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Products management state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [productVerifiedFilter, setProductVerifiedFilter] = useState<'all' | 'verified' | 'unverified' | 'relaunch'>('all');

  // Edit modal state
  const [editingSubmission, setEditingSubmission] = useState<WebsiteSubmission | null>(null);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Developer Tools');
  const [editOfferDiscount, setEditOfferDiscount] = useState('');
  const [editOfferCode, setEditOfferCode] = useState('');
  const [editOfferUrl, setEditOfferUrl] = useState('');
  const [editOfferDetails, setEditOfferDetails] = useState('');

  // Details modal state & Lightbox state
  const [viewingDetailsSubmission, setViewingDetailsSubmission] = useState<WebsiteSubmission | null>(null);
  const [copiedOfferCode, setCopiedOfferCode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Lazy-load full submission details (including screenshots) when reviewing a submission
  useEffect(() => {
    if (viewingDetailsSubmission?.id && (!viewingDetailsSubmission.screenshots || viewingDetailsSubmission.screenshots.length === 0)) {
      loadSubmissionById(viewingDetailsSubmission.id).then((fullSub) => {
        if (fullSub && fullSub.screenshots && fullSub.screenshots.length > 0) {
          setViewingDetailsSubmission((prev) => (prev?.id === fullSub.id ? { ...prev, ...fullSub } : prev));
        }
      });
    }
  }, [viewingDetailsSubmission?.id]);

  const handleCopyOfferCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedOfferCode(true);
      playSound('click', soundEnabled);
      setTimeout(() => setCopiedOfferCode(false), 2000);
    } catch { }
  };

  // Revoke confirmation modal state
  const [revokeTarget, setRevokeTarget] = useState<WebsiteSubmission | null>(null);

  // Filtered submissions (sorted newest submitted first)
  const filteredSubmissions = submissions
    .filter((sub) => {
      if (showOnlyAutoRelaunch && !sub.autoRelaunch && !sub.autoRelaunchPaid) return false;
      const currentStatus = sub.status || 'under_review';
      if (statusFilter !== 'all' && currentStatus !== statusFilter) return false;
      if (selectedCategory !== 'All' && !sub.category?.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (sub.name || '').toLowerCase().includes(q);
        const matchTagline = (sub.tagline || '').toLowerCase().includes(q);
        const matchUrl = (sub.url || '').toLowerCase().includes(q);
        const matchBacker = (sub.backerName || '').toLowerCase().includes(q);
        if (!matchName && !matchTagline && !matchUrl && !matchBacker) return false;
      }
      return true;
    })
    .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));

  // Sorted products for management (sponsors are not products)
  const sortedProducts = [...directoryProducts].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  // Read-only lookup: which live sponsor placement is linked to each product.
  // Sponsor grants and revokes only happen in the Sponsors tab.
  const sponsorByProductId = new Map<string, Sponsor>();
  sponsors.forEach((s) => {
    if (s.productId && s.status !== 'ended' && s.status !== 'expired') {
      sponsorByProductId.set(s.productId, s);
    }
  });

  // Filtered products
  const filteredProducts = sortedProducts.filter((p) => {
    if (productCategoryFilter !== 'All' && p.category !== productCategoryFilter) return false;
    if (productVerifiedFilter === 'verified' && !p.verified) return false;
    if (productVerifiedFilter === 'unverified' && p.verified) return false;
    if (productVerifiedFilter === 'relaunch' && !p.autoRelaunch && !p.autoRelaunchPaid) return false;
    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchTagline = p.tagline.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchUrl = p.url.toLowerCase().includes(q);
      if (!matchName && !matchTagline && !matchCategory && !matchUrl) return false;
    }
    return true;
  });

  const isDefaultBannerId = (id: string) => id === 'default' || id.startsWith('default_banner_');

  // Current featured items (multiple products + multiple default banners supported)
  const isDefaultFeatured = featuredProductId === null || featuredProductId === 'default';
  const isEmptyFeatured = featuredProductId === '' || featuredProductId === 'empty';

  const activeFeaturedIds = featuredProductIds.length > 0
    ? featuredProductIds
    : (!isDefaultFeatured && !isEmptyFeatured && featuredProductId ? [featuredProductId] : []);

  type ActiveFeaturedItem =
    | { kind: 'product'; id: string; product: Product }
    | { kind: 'banner'; id: string };

  const activeFeaturedItems: ActiveFeaturedItem[] = activeFeaturedIds
    .map((id): ActiveFeaturedItem | null => {
      if (isDefaultBannerId(id)) {
        return { kind: 'banner', id };
      }
      const prod = products.find((p) => p.id === id);
      return prod ? { kind: 'product', id, product: prod } : null;
    })
    .filter((item): item is ActiveFeaturedItem => item !== null);

  const activeFeaturedProducts: Product[] = activeFeaturedItems
    .filter((item): item is { kind: 'product'; id: string; product: Product } => item.kind === 'product')
    .map((item) => item.product);

  const activeBannerCount = activeFeaturedItems.filter((item) => item.kind === 'banner').length;

  const featuredProduct = activeFeaturedProducts[0] || null;

  // Search state for Add Featured Product dropdown
  const [featuredSearchQuery, setFeaturedSearchQuery] = useState('');
  const [isFeaturedSearchOpen, setIsFeaturedSearchOpen] = useState(false);

  // Quick Assign Sponsor modal state (from Live Products tab)
  const [sponsorAssignProduct, setSponsorAssignProduct] = useState<Product | null>(null);
  const [sponsorAssignTier, setSponsorAssignTier] = useState<'trial' | '1mo' | '3mo' | '1yr'>('1mo');
  const [sponsorAssignEmail, setSponsorAssignEmail] = useState('');
  const [isAssigningSponsor, setIsAssigningSponsor] = useState(false);

  const openAssignSponsorModal = (product: Product) => {
    playSound('click', soundEnabled);
    const matchingSub = submissions.find(
      (s) => publishedProductId(s.id) === product.id || s.id === product.id
    );
    setSponsorAssignEmail(product.sponsorContactEmail || matchingSub?.backerEmail || '');
    setSponsorAssignTier('1mo');
    setSponsorAssignProduct(product);
  };

  const handleConfirmAssignSponsor = async () => {
    if (!sponsorAssignProduct || isAssigningSponsor) return;
    setIsAssigningSponsor(true);
    const now = Date.now();
    const days =
      sponsorAssignTier === 'trial'
        ? 7
        : sponsorAssignTier === '3mo'
          ? 90
          : sponsorAssignTier === '1yr'
            ? 365
            : 30;
    const p = sponsorAssignProduct;
    await onCreateSponsor({
      id: `spn_${now}_${Math.random().toString(36).slice(2, 8)}`,
      productId: p.id,
      name: p.name,
      tagline: p.tagline,
      url: p.url,
      logoUrl: p.logoUrl,
      category: p.category,
      contactEmail: sponsorAssignEmail.trim() || undefined,
      tier: sponsorAssignTier,
      status: 'active',
      startedAt: now,
      expiresAt: now + days * 86400 * 1000,
      clicks: 0,
      source: 'admin_grant',
    });
    playSound('success', soundEnabled);
    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch { }
    setIsAssigningSponsor(false);
    setSponsorAssignProduct(null);
  };

  const handleAddFeatured = (productId: string) => {
    if (activeFeaturedIds.includes(productId)) return;
    const nextIds = [...activeFeaturedIds, productId];
    if (onSetFeaturedProducts) {
      onSetFeaturedProducts(nextIds, 'active');
    } else {
      onSetFeatured(nextIds[0]);
    }
    playSound('success', soundEnabled);
    try {
      confetti({
        particleCount: 20,
        spread: 45,
        origin: { y: 0.6 },
      });
    } catch { }
  };

  const handleAddDefaultBanner = () => {
    const newBannerId = `default_banner_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nextIds = [...activeFeaturedIds, newBannerId];
    if (onSetFeaturedProducts) {
      onSetFeaturedProducts(nextIds, 'active');
    }
    playSound('success', soundEnabled);
  };

  const handleRemoveFeatured = (productId: string) => {
    const nextIds = activeFeaturedIds.filter((id) => id !== productId);
    const nextMode = nextIds.length === 0 ? 'default' : 'active';
    if (onSetFeaturedProducts) {
      onSetFeaturedProducts(nextIds, nextMode);
    } else {
      onSetFeatured(nextIds.length > 0 ? nextIds[0] : null);
    }
    playSound('click', soundEnabled);
  };

  const handleMoveFeaturedUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...activeFeaturedIds];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    if (onSetFeaturedProducts) {
      onSetFeaturedProducts(copy, 'active');
    } else {
      onSetFeatured(copy[0]);
    }
    playSound('click', soundEnabled);
  };

  const handleMoveFeaturedDown = (index: number) => {
    if (index >= activeFeaturedIds.length - 1) return;
    const copy = [...activeFeaturedIds];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    if (onSetFeaturedProducts) {
      onSetFeaturedProducts(copy, 'active');
    } else {
      onSetFeatured(copy[0]);
    }
    playSound('click', soundEnabled);
  };

  const handleSetFeaturedMode = (mode: 'default' | 'empty') => {
    if (onSetFeaturedProducts) {
      onSetFeaturedProducts([], mode);
    }
    onSetFeatured(mode);
    playSound('click', soundEnabled);
  };

  const handleMoveUp = (product: Product) => {
    if (!onAssignRank) return;
    const currentIndex = sortedProducts.findIndex((p) => p.id === product.id);
    if (currentIndex <= 0) return;
    playSound('click', soundEnabled);
    onAssignRank(product.id, currentIndex);
  };

  const handleMoveDown = (product: Product) => {
    if (!onAssignRank) return;
    const currentIndex = sortedProducts.findIndex((p) => p.id === product.id);
    if (currentIndex < 0 || currentIndex >= sortedProducts.length - 1) return;
    playSound('click', soundEnabled);
    onAssignRank(product.id, currentIndex + 2);
  };

  const handleAccept = (sub: WebsiteSubmission) => {
    playSound('success', soundEnabled);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#000000', '#22c55e', '#3b82f6', '#f59e0b'],
      });
    } catch { }

    const isFuture = !isLaunched(sub);
    onAcceptSubmission(sub);

    if (isFuture) {
      const targetMs = getTargetLaunchMs(sub);
      const targetWeek = sub.scheduledLaunchWeek != null ? `Week ${sub.scheduledLaunchWeek}` : new Date(targetMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      setFutureLaunchToast(`"${sub.name}" approved! It has been scheduled for ${targetWeek} and added to the Future Launches tab.`);
      setTimeout(() => setFutureLaunchToast(null), 6000);
    }
  };

  const handlePublishFutureItemLive = (item: (typeof allFutureLaunches)[0]) => {
    if (!window.confirm(`Publish "${item.name}" live to the public directory right now?`)) return;
    playSound('success', soundEnabled);
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#000000', '#22c55e', '#3b82f6', '#f59e0b'],
      });
    } catch { }

    const now = Date.now();
    if (item.productRef) {
      const updated: Product = {
        ...item.productRef,
        scheduledLaunchWeek: undefined,
        scheduledLaunchDate: now,
        createdAt: now,
      };
      onUpdateProduct?.(updated);
    }
    if (item.submissionRef) {
      const updatedSub: WebsiteSubmission = {
        ...item.submissionRef,
        scheduledLaunchWeek: undefined,
        scheduledLaunchDate: now,
        status: 'approved',
      };
      onAcceptSubmission(updatedSub);
    }
    setFutureLaunchToast(`"${item.name}" is now published LIVE in the directory!`);
    setTimeout(() => setFutureLaunchToast(null), 5000);
  };

  const handleOpenReschedule = (item: (typeof allFutureLaunches)[0]) => {
    setReschedulingItem(item);
    setRescheduleWeekChoice(item.scheduledLaunchWeek != null ? item.scheduledLaunchWeek : getWeekNumber());
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingItem || rescheduleWeekChoice === null) return;
    playSound('click', soundEnabled);

    if (rescheduleWeekChoice === 'now') {
      handlePublishFutureItemLive(reschedulingItem);
      setReschedulingItem(null);
      return;
    }

    const weekNum = Number(rescheduleWeekChoice);
    const weekStart = getWeekByNumber(weekNum).start;

    if (reschedulingItem.productRef) {
      const updated: Product = {
        ...reschedulingItem.productRef,
        scheduledLaunchWeek: weekNum,
        scheduledLaunchDate: weekStart,
      };
      onUpdateProduct?.(updated);
    }
    if (reschedulingItem.submissionRef) {
      const updatedSub: WebsiteSubmission = {
        ...reschedulingItem.submissionRef,
        scheduledLaunchWeek: weekNum,
        scheduledLaunchDate: weekStart,
      };
      onUpdateSubmission(updatedSub);
    }
    setFutureLaunchToast(`"${reschedulingItem.name}" rescheduled for Week ${weekNum}!`);
    setTimeout(() => setFutureLaunchToast(null), 4000);
    setReschedulingItem(null);
  };

  const handleDelistFutureItem = (item: (typeof allFutureLaunches)[0]) => {
    if (item.productRef) {
      handleDelist(item.productRef);
    } else if (item.submissionRef) {
      handleReject(item.submissionRef.id);
    }
  };

  const handleViewFutureDetails = (item: (typeof allFutureLaunches)[0]) => {
    if (item.submissionRef) {
      setViewingDetailsSubmission(item.submissionRef);
    } else if (item.productRef) {
      const p = item.productRef;
      const syntheticSub: WebsiteSubmission = {
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        url: p.url,
        category: p.category as Category,
        logoUrl: p.logoUrl,
        problemItSolves: p.problemItSolves || '',
        solution: p.solution || '',
        uniqueSellingPoint: p.uniqueSellingPoint || '',
        screenshots: p.screenshots,
        demoVideoUrl: p.demoVideoUrl,
        twitterHandle: p.twitterHandle,
        socials: p.socials,
        creatorName: p.creatorName,
        creatorUsername: p.creatorUsername,
        creatorAvatar: p.creatorAvatar,
        submittedBy: p.submittedBy,
        offerDiscount: p.offerDiscount,
        offerCode: p.offerCode,
        offerUrl: p.offerUrl,
        offerDetails: p.offerDetails,
        autoRelaunch: p.autoRelaunch,
        autoRelaunchPaid: p.autoRelaunchPaid,
        scheduledLaunchWeek: p.scheduledLaunchWeek,
        scheduledLaunchDate: p.scheduledLaunchDate,
        status: 'approved',
        submittedAt: p.createdAt || Date.now(),
      };
      setViewingDetailsSubmission(syntheticSub);
    }
  };

  const handleReject = (id: string) => {
    const target = submissions.find((s) => s.id === id);
    const targetName = target ? `"${target.name}"` : 'this submission';
    if (!window.confirm(`Are you sure you want to reject ${targetName}?`)) return;
    playSound('click', soundEnabled);
    onRejectSubmission(id);
  };

  const handleDeleteSubmission = (sub: WebsiteSubmission) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${sub.name}"? This action cannot be undone.`)) return;
    playSound('click', soundEnabled);
    onDeleteSubmission(sub.id);
  };

  const handleOpenEdit = (sub: WebsiteSubmission) => {
    setEditingSubmission(sub);
    setEditName(sub.name);
    setEditTagline(sub.tagline);
    setEditUrl(sub.url);
    setEditCategory(sub.category);
    setEditOfferDiscount(sub.offerDiscount || '');
    setEditOfferCode(sub.offerCode || '');
    setEditOfferUrl(sub.offerUrl || '');
    setEditOfferDetails(sub.offerDetails || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;
    const updated: WebsiteSubmission = {
      ...editingSubmission,
      name: editName.trim() || editingSubmission.name,
      tagline: editTagline.trim() || editingSubmission.tagline,
      url: editUrl.trim() || editingSubmission.url,
      category: editCategory,
      logoUrl: editingSubmission.logoUrl || getWebsiteFavicon(editUrl.trim() || editingSubmission.url),
      offerDiscount: editOfferDiscount.trim() || undefined,
      offerCode: editOfferCode.trim().toUpperCase() || undefined,
      offerUrl: editOfferUrl.trim() || undefined,
      offerDetails: editOfferDetails.trim() || undefined,
    };
    onUpdateSubmission(updated);
    setEditingSubmission(null);
  };

  const handleDelist = (product: Product) => {
    if (window.confirm(`Permanently delist "${product.name}" from the directory?`)) {
      playSound('click', soundEnabled);
      onDelistProduct(product.id);
    }
  };

  const formatTimestamp = (time: number) => {
    const diffMs = Date.now() - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 pb-24">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDirectory}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-300 hover:border-mint-500/60 hover:bg-neutral-100 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </button>
            <div className="h-4 w-px bg-neutral-700" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-mint-500 text-white font-black text-xs shadow-2xs">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs font-mono font-bold text-neutral-300">
                /accept
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-black hover:bg-neutral-200 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Test New Submission</span>
            </button>

            {onSignOutAdmin && (
              <button
                type="button"
                onClick={onSignOutAdmin}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                title="Lock admin session and sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Lock Admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* View Switcher Tabs & Master Sponsor Rails Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 pb-0">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => { setActiveView('submissions'); playSound('click', soundEnabled); }}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 whitespace-nowrap ${activeView === 'submissions'
                ? 'bg-neutral-950 border-neutral-950 text-white shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-950 hover:bg-neutral-800/60'
                }`}
            >
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Submissions Queue</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${pendingCount > 0 ? 'bg-amber-400 text-black font-black animate-pulse' : 'bg-neutral-700 text-neutral-300'
                }`}>
                {pendingCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveView('future'); playSound('click', soundEnabled); }}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 whitespace-nowrap ${activeView === 'future'
                ? 'bg-neutral-950 border-neutral-950 text-white shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-950 hover:bg-neutral-800/60'
                }`}
            >
              <Rocket className="h-3.5 w-3.5 text-sky-400" />
              <span>Future Launches</span>
              <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${allFutureLaunches.length > 0 ? 'bg-sky-500 text-white font-black' : 'bg-neutral-700 text-neutral-300'
                }`}>
                {allFutureLaunches.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveView('products'); playSound('click', soundEnabled); }}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 whitespace-nowrap ${activeView === 'products'
                ? 'bg-neutral-950 border-neutral-950 text-white shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-950 hover:bg-neutral-800/60'
                }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span>Live Products</span>
              <span className="ml-1 rounded-full bg-mint-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                {directoryProducts.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveView('featured'); playSound('click', soundEnabled); }}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 whitespace-nowrap ${activeView === 'featured'
                ? 'bg-neutral-950 border-neutral-950 text-white shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-950 hover:bg-neutral-800/60'
                }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>Featured</span>
              {activeFeaturedProducts.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                  {activeFeaturedProducts.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setActiveView('sponsors'); playSound('click', soundEnabled); }}
              className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 whitespace-nowrap ${activeView === 'sponsors'
                ? 'bg-neutral-950 border-neutral-950 text-white shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-950 hover:bg-neutral-800/60'
                }`}
            >
              <Megaphone className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sponsors &amp; Trials</span>
              <span className="ml-1 rounded-full bg-emerald-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                {activeSponsorsCount}
              </span>
            </button>
          </div>

          {/* Quick Master Sponsor Rails Toggle */}
          <div className="flex items-center gap-2 pb-2 sm:pb-1.5 px-1 shrink-0 self-start sm:self-center">
            <span className="text-[11px] font-bold text-neutral-400 hidden md:inline">
              Homepage Rails:
            </span>
            <button
              type="button"
              role="switch"
              title="Master toggle: switch on or off all homepage side sponsor cards at once"
              aria-checked={sponsorRailsEnabled}
              onClick={() => {
                playSound('click', soundEnabled);
                onToggleSponsorRails?.(!sponsorRailsEnabled);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs ${sponsorRailsEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-neutral-800 bg-neutral-800/80 text-neutral-400 hover:bg-neutral-700/80'
                }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${sponsorRailsEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
              <span>Side Sponsors: {sponsorRailsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Refresh Queue Button */}
            {onRefreshSubmissions && (
              <button
                type="button"
                disabled={isRefreshing}
                onClick={handleManualRefresh}
                title="Fetch latest pending and approved submissions from Supabase"
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-mint-400' : 'text-neutral-400'}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Future Launch Feedback Toast */}
        {futureLaunchToast && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 text-xs text-sky-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-sky-600 shrink-0" />
              <span className="font-semibold">{futureLaunchToast}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeView !== 'future' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('future');
                    setFutureLaunchToast(null);
                  }}
                  className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-sky-700 cursor-pointer"
                >
                  View Future Launches &rarr;
                </button>
              )}
              <button
                type="button"
                onClick={() => setFutureLaunchToast(null)}
                className="text-sky-600 hover:text-sky-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUBMISSIONS QUEUE & REVIEW VIEW */}
        {/* ============================================================ */}
        {activeView === 'submissions' && (
          <>
            {/* Submissions Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-amber-500 mb-1">
                  <span>Pending Approval</span>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900">{pendingCount}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Awaiting approval</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 mb-1">
                  <span>Approved Submissions</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900">{approvedCount}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Active on live directory</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-red-500 mb-1">
                  <span>Rejected Submissions</span>
                  <XCircle className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-900">{rejectedCount}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Declined listings</p>
              </div>
              <div
                onClick={() => {
                  setShowOnlyAutoRelaunch((prev) => !prev);
                  playSound('click', soundEnabled);
                }}
                className={`rounded-xl border p-4 shadow-2xs cursor-pointer transition-all ${showOnlyAutoRelaunch
                  ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                  : 'border-neutral-200 bg-white hover:border-blue-300'
                  }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-blue-600 mb-1">
                  <span>Auto-Relaunch Paid</span>
                  <Rocket className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-950">{autoRelaunchCount}</div>
                <p className="text-[11px] text-blue-700 font-semibold mt-1">
                  {showOnlyAutoRelaunch ? '✓ Filter active (Click to clear)' : 'Click to monitor subscribers'}
                </p>
              </div>
            </div>

            {/* Submissions Filter & Search */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search submissions by name, tagline, URL..."
                    className="w-full rounded-lg border border-neutral-200 bg-white pl-8.5 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500/30"
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-950">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('under_review'); playSound('click', soundEnabled); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'under_review' && !showOnlyAutoRelaunch
                      ? 'bg-amber-400 text-black font-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                  >
                    <span>Pending Approval</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[9px]">{pendingCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('approved'); playSound('click', soundEnabled); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'approved' && !showOnlyAutoRelaunch
                      ? 'bg-emerald-500 text-black font-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                  >
                    <span>Approved</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[9px]">{approvedCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('rejected'); playSound('click', soundEnabled); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'rejected' && !showOnlyAutoRelaunch
                      ? 'bg-red-500 text-white font-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                  >
                    <span>Rejected</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[9px]">{rejectedCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatusFilter('all'); playSound('click', soundEnabled); }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'all' && !showOnlyAutoRelaunch
                      ? 'bg-white text-black font-black'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                  >
                    <span>All</span>
                    <span className="rounded-full bg-black/20 px-1.5 py-0.2 text-[9px]">{submissions.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOnlyAutoRelaunch((prev) => !prev);
                      playSound('click', soundEnabled);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${showOnlyAutoRelaunch
                      ? 'bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-400/40'
                      : 'bg-neutral-800 text-blue-300 hover:bg-neutral-700'
                      }`}
                  >
                    <Rocket className="h-3 w-3 text-blue-400" />
                    <span>Auto-Relaunch Paid</span>
                    <span className={`rounded-full px-1.5 py-0.2 text-[9px] ${showOnlyAutoRelaunch ? 'bg-white/20 text-white' : 'bg-black/20 text-blue-200'}`}>
                      {autoRelaunchCount}
                    </span>
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-neutral-200 pt-2.5">
                {(['All', 'AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${selectedCategory === cat
                      ? 'bg-mint-500 text-white'
                      : 'bg-neutral-100 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-700'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold  text-neutral-400">
                  Submissions Queue
                  <span className="ml-1.5 font-normal text-neutral-500">({filteredSubmissions.length})</span>
                </h2>
                <span className="text-[11px] text-neutral-500">
                  Approve submissions to add them immediately to the live directory.
                </span>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-neutral-950">No submissions found</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      {submissions.length > 0
                        ? 'No submissions match your current filters (status or category).'
                        : 'All pending launches have been reviewed! New submissions will appear here.'}
                    </p>
                    {submissions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setSelectedCategory('All');
                          setSearchQuery('');
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-mint-500 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-mint-600 active:scale-95 transition-all cursor-pointer"
                      >
                        Reset Filters ({submissions.length} total)
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((sub) => {
                    const logoSrc = sub.logoUrl || getWebsiteFavicon(sub.url);
                    const isUnderReview = sub.status === 'under_review';
                    const isApproved = sub.status === 'approved';
                    const isRejected = sub.status === 'rejected';
                    // A submission's listing is always `prod-<id>` — an id lookup, not a URL match.
                    const liveProduct = products.find((p) => p.id === publishedProductId(sub.id));

                    return (
                      <div
                        key={sub.id}
                        className={`rounded-xl border bg-white p-4 sm:p-5 transition-all space-y-3 ${isUnderReview
                          ? 'border-amber-500/50 shadow-md shadow-amber-500/5'
                          : isApproved
                            ? 'border-neutral-200'
                            : 'border-red-900/40 opacity-80'
                          }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Left: Info */}
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingDetailsSubmission(sub);
                                playSound('click', soundEnabled);
                              }}
                              className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm hover:border-mint-500/60 transition-all cursor-pointer group"
                              title="Click to view full details"
                            >
                              <ProductLogo
                                src={logoSrc}
                                alt={sub.name}
                                containerClassName="h-full w-full flex items-center justify-center"
                                iconClassName="h-5 w-5 text-neutral-400 shrink-0 group-hover:scale-110 transition-transform"
                              />
                            </button>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingDetailsSubmission(sub);
                                    playSound('click', soundEnabled);
                                  }}
                                  className="text-base font-black text-neutral-950 tracking-tight truncate hover:text-mint-600 text-left cursor-pointer transition-colors"
                                >
                                  {sub.name}
                                </button>

                                {/* Status Pill */}
                                {isUnderReview && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                    <Clock className="h-3 w-3" /> Pending Approval
                                  </span>
                                )}
                                {isApproved && (
                                  isLaunched(sub) ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span>Approved & Live {liveProduct?.rank ? `(Rank #${liveProduct.rank})` : ''}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                                      <Rocket className="h-3 w-3" />
                                      <span>Approved &amp; In Future Queue ({sub.scheduledLaunchWeek ? `Week ${sub.scheduledLaunchWeek}` : 'Scheduled'})</span>
                                    </span>
                                  )
                                )}
                                {isRejected && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold text-red-300">
                                    <XCircle className="h-3 w-3" /> Rejected
                                  </span>
                                )}

                                <span className="rounded-md bg-neutral-800 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                                  {sub.category}
                                </span>

                                {(sub.autoRelaunch || sub.autoRelaunchPaid) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                                    <Rocket className="h-3 w-3 text-blue-600" />
                                    <span>Auto-Relaunch Paid ($5/week)</span>
                                  </span>
                                )}

                                {sub.offerDiscount && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-mint-500/15 border border-mint-500/40 px-2 py-0.5 text-[10px] font-bold text-mint-600">
                                    <Tag className="h-3 w-3" />
                                    <span>Offer: {sub.offerDiscount}</span>
                                    {sub.offerCode && <span className="font-mono text-mint-700">({sub.offerCode})</span>}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-neutral-300 font-medium line-clamp-2">{sub.tagline}</p>

                              {/* Submitter & URL Meta */}
                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-400">
                                <a
                                  href={sub.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-mint-600 font-semibold hover:underline"
                                >
                                  <Globe className="h-3 w-3 text-neutral-400" />
                                  <span className="truncate max-w-[200px]">{sub.url}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>

                                {sub.backerName && (
                                  <span className="inline-flex items-center gap-1 text-neutral-400">
                                    <User className="h-3 w-3" />
                                    <span>{sub.backerName}</span>
                                  </span>
                                )}

                                {sub.backerEmail && (
                                  <span className="inline-flex items-center gap-1 text-neutral-500">
                                    <Mail className="h-3 w-3" />
                                    <span>{sub.backerEmail}</span>
                                  </span>
                                )}

                                <span className="text-neutral-500">
                                  Submitted {formatTimestamp(sub.submittedAt)}
                                </span>

                                {(sub.scheduledLaunchWeek != null || sub.scheduledLaunchDate != null) && (() => {
                                  const weekInfo = sub.scheduledLaunchWeek != null
                                    ? getWeekByNumber(Number(sub.scheduledLaunchWeek))
                                    : getWeekInfo(Number(sub.scheduledLaunchDate!));
                                  return (
                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                      <Calendar className="h-3 w-3" />
                                      <span>Launch: {formatWeekDateRange(weekInfo, '–')} ({weekInfo.label})</span>
                                    </span>
                                  );
                                })()}

                                {(sub.autoRelaunch || sub.autoRelaunchPaid) && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10.5px] font-bold text-blue-800">
                                    <Rocket className="h-3 w-3 text-blue-600" />
                                    <span>Auto-Relaunch: Active ($5/week)</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                            {/* View Details Button (Always accessible) */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewingDetailsSubmission(sub);
                                playSound('click', soundEnabled);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-mint-500/60 hover:text-mint-700 hover:bg-mint-50/30 transition-all cursor-pointer shadow-2xs"
                              title="View full submission details, media, and pitch"
                            >
                              <Eye className="h-3.5 w-3.5 text-mint-600" />
                              <span>Details</span>
                            </button>

                            {isUnderReview && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAccept(sub)}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-400 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                                  title="Approve and publish to live directory"
                                >
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  <span>Approve & Go Live</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(sub)}
                                  className="rounded-xl border border-neutral-200 bg-neutral-100 p-2 text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
                                  title="Edit details before approving"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(sub.id)}
                                  className="rounded-xl border border-neutral-200 bg-neutral-100 p-2 text-neutral-400 hover:text-red-400 hover:border-red-400/60 hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="Reject submission"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <>
                                <a
                                  href={`/products/${getProductSlug(liveProduct) || getProductSlug(sub) || liveProduct?.id || sub.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-mint-500/60 hover:text-mint-700 hover:bg-mint-50/30 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  <span>View Page</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(sub)}
                                  className="rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Edit3 className="h-3 w-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRevokeTarget(sub)}
                                  className="rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-red-400 hover:border-red-400/60 hover:bg-red-500/10 transition-all cursor-pointer"
                                >
                                  Revoke Approval
                                </button>
                              </>
                            )}

                            {isRejected && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleAccept(sub)}
                                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  <span>Restore & Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubmission(sub)}
                                  className="rounded-xl border border-neutral-200 bg-neutral-100 p-2 text-neutral-400 hover:text-red-400 hover:border-red-400/60 hover:bg-red-500/10 transition-all cursor-pointer"
                                  title="Delete submission record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* FUTURE LAUNCHES VIEW */}
        {/* ============================================================ */}
        {activeView === 'future' && (
          <>
            {/* Future Launches Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-sky-500 mb-1">
                  <span>Total Scheduled</span>
                  <Rocket className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                  {allFutureLaunches.length}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Pending future launches</p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-500 mb-1">
                  <span>Next Launch</span>
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="text-sm sm:text-base font-black text-neutral-950 truncate">
                  {allFutureLaunches.length > 0
                    ? `Week ${allFutureLaunches[0].targetWeekNumber}`
                    : 'None queued'}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 truncate">
                  {allFutureLaunches.length > 0
                    ? `${formatRemainingMs(Math.max(0, allFutureLaunches[0].targetLaunchMs - Date.now()))} remaining`
                    : 'No upcoming launches'}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-mint-600 mb-1">
                  <span>Approved &amp; Scheduled</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-mint-600">
                  {allFutureLaunches.filter((x) => x.isApproved).length}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Ready for automatic release</p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-amber-500 mb-1">
                  <span>Under Review</span>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-amber-500">
                  {allFutureLaunches.filter((x) => !x.isApproved).length}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Future date submissions</p>
              </div>
            </div>

            {/* Explanation Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-sky-50/30 p-3.5">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white shadow-xs">
                  <Rocket className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Future Launches Pipeline
                  </h4>
                  <p className="text-[11px] text-neutral-600">
                    Projects here are scheduled for future launch weeks and are automatically sorted by their launch date. When their launch week begins, they publish live to the public leaderboard automatically.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <span className="text-[11px] font-medium text-neutral-500">
                  Sorted: Soonest first
                </span>
              </div>
            </div>

            {/* Future Launches Search & Filters */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={futureSearchQuery}
                    onChange={(e) => setFutureSearchQuery(e.target.value)}
                    placeholder="Search future launches by name, category, or URL..."
                    className="w-full rounded-lg border border-neutral-200 bg-white pl-8.5 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500/30"
                  />
                  {futureSearchQuery && (
                    <button type="button" onClick={() => setFutureSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-950">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Status Filter */}
                  <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-1 border border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setFutureStatusFilter('all')}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${futureStatusFilter === 'all'
                        ? 'bg-neutral-950 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-950'
                        }`}
                    >
                      All ({allFutureLaunches.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFutureStatusFilter('scheduled')}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${futureStatusFilter === 'scheduled'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-950'
                        }`}
                    >
                      Approved ({allFutureLaunches.filter((x) => x.isApproved).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFutureStatusFilter('under_review')}
                      className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${futureStatusFilter === 'under_review'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-950'
                        }`}
                    >
                      Under Review ({allFutureLaunches.filter((x) => !x.isApproved).length})
                    </button>
                  </div>

                  {/* Sort Order Selector */}
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700">
                    <ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" />
                    <select
                      value={futureSortOrder}
                      onChange={(e) => setFutureSortOrder(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-neutral-900 focus:outline-none cursor-pointer"
                    >
                      <option value="date_asc">Launch Date (Soonest first)</option>
                      <option value="date_desc">Launch Date (Furthest first)</option>
                      <option value="name">Product Name (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-1 sm:pb-0">
                {(['All', 'AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFutureCategoryFilter(cat)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${futureCategoryFilter === cat
                      ? 'bg-sky-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Future Launches List (Arranged by Date) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold text-neutral-600 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-sky-500" />
                  <span>Scheduled Future Launches</span>
                  <span className="font-normal text-neutral-400">({filteredFutureLaunches.length})</span>
                </h2>
                <span className="text-[11px] text-neutral-500">
                  Arranged chronologically by launch date
                </span>
              </div>

              {filteredFutureLaunches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-neutral-950">No future launches found</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      {allFutureLaunches.length > 0
                        ? 'No launches match your current filters. Try resetting search or category.'
                        : 'When you approve a submission scheduled for a future week or date, it will automatically appear here sorted by launch date.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFutureLaunches.map((item) => {
                    const logoSrc = item.logoUrl || getWebsiteFavicon(item.url);
                    const weekInfo = getWeekByNumber(item.targetWeekNumber);
                    const dateRangeStr = formatWeekDateRange(weekInfo);
                    const remainingMs = Math.max(0, item.targetLaunchMs - Date.now());
                    const targetDateStr = new Date(item.targetLaunchMs).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-sky-300 transition-all space-y-3"
                      >
                        {/* Top Timing & Status Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-2.5 py-1 text-xs font-black text-sky-800">
                              <Calendar className="h-3.5 w-3.5 text-sky-600" />
                              <span>Week {item.targetWeekNumber} ({dateRangeStr})</span>
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                              <Clock className="h-3 w-3 text-neutral-400" />
                              <span>Launches in {formatRemainingMs(remainingMs)}</span>
                            </span>
                          </div>

                          <div>
                            {item.isApproved ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Approved &amp; Scheduled</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                <Clock className="h-3 w-3 text-amber-600" />
                                <span>Pending Approval (Future)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Project Info & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleViewFutureDetails(item);
                                playSound('click', soundEnabled);
                              }}
                              className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs hover:border-sky-400 transition-all cursor-pointer group"
                            >
                              <ProductLogo
                                src={logoSrc}
                                alt={item.name}
                                containerClassName="h-full w-full flex items-center justify-center"
                                iconClassName="h-5 w-5 text-neutral-400 group-hover:scale-110 transition-transform"
                              />
                            </button>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleViewFutureDetails(item);
                                    playSound('click', soundEnabled);
                                  }}
                                  className="text-base font-black text-neutral-950 tracking-tight hover:text-sky-600 cursor-pointer transition-colors text-left"
                                >
                                  {item.name}
                                </button>
                                <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                                  {item.category}
                                </span>
                                {item.pricingModel && (
                                  <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                                    {item.pricingModel}
                                  </span>
                                )}
                                {item.autoRelaunch && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                    <Rocket className="h-2.5 w-2.5" /> Auto-Relaunch
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-neutral-600 line-clamp-2">
                                {item.tagline}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500">
                                <a
                                  href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sky-600 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Globe className="h-3 w-3" />
                                  <span className="truncate max-w-[200px]">{item.url.replace(/^https?:\/\//i, '')}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>

                                <span className="text-neutral-300">•</span>
                                <span>Target Launch: {targetDateStr}</span>

                                {item.creatorName && (
                                  <>
                                    <span className="text-neutral-300">•</span>
                                    <span className="inline-flex items-center gap-1">
                                      <User className="h-3 w-3 text-neutral-400" />
                                      {item.creatorName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-start sm:self-center">
                            {/* Publish Live Now */}
                            <button
                              type="button"
                              onClick={() => handlePublishFutureItemLive(item)}
                              title="Override schedule and launch immediately to live directory"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
                            >
                              <Rocket className="h-3.5 w-3.5" />
                              <span>Publish Live Now</span>
                            </button>

                            {/* Reschedule Date/Week */}
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(item)}
                              title="Change scheduled launch week"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50 active:scale-95 px-3 py-1.5 text-xs font-bold text-neutral-700 transition-all cursor-pointer"
                            >
                              <Calendar className="h-3.5 w-3.5 text-sky-600" />
                              <span>Reschedule</span>
                            </button>

                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => {
                                handleViewFutureDetails(item);
                                playSound('click', soundEnabled);
                              }}
                              title="Inspect full details, screenshots, and pitch"
                              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 p-2 text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Delist / Reject */}
                            <button
                              type="button"
                              onClick={() => handleDelistFutureItem(item)}
                              title="Remove or reject from future queue"
                              className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white hover:border-red-300 hover:bg-red-50 p-2 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* LIVE PRODUCTS MANAGEMENT VIEW */}
        {/* ============================================================ */}
        {activeView === 'products' && (
          <>
            {/* Products Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-1">
                  <span>Top 3</span>
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">3</div>
                <p className="text-[11px] text-neutral-400 mt-1">Top 3 ranking products</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-500 mb-1">
                  <span>Live Products</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{products.filter((p) => !isSponsorOnlyProduct(p)).length}</div>
                <p className="text-[11px] text-neutral-400 mt-1">In the directory</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-mint-600 mb-1">
                  <span>Verified Startups</span>
                  <VerifiedBadge className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-mint-600">
                  {products.filter((p) => p.verified).length}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Verified with badge</p>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-1">
                  <span>Total Upvotes</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {products.reduce((sum, p) => sum + (p.upvotes ?? 0), 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">Across all products</p>
              </div>
            </div>

            {/* Featured Spotlight Summary Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/50 via-amber-50/20 to-white p-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
                  <Crown className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-neutral-950">
                    Featured Spotlight: {activeFeaturedProducts.length > 0 ? `${activeFeaturedProducts.length} tool${activeFeaturedProducts.length > 1 ? 's' : ''} active` : isEmptyFeatured ? 'Empty (Hidden)' : 'Default Open Spotlight Banner'}
                  </span>
                  <p className="text-[11px] text-neutral-500">
                    {activeFeaturedProducts.length > 0
                      ? activeFeaturedProducts.map((p) => p.name).join(', ')
                      : 'You can feature any product below using the "Feature" button.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveView('featured');
                  playSound('click', soundEnabled);
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <span>Manage Featured</span>
                <Crown className="h-3 w-3" />
              </button>
            </div>

            {/* Products Search & Filter */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    placeholder="Search live products by name, category, or URL..."
                    className="w-full rounded-lg border border-neutral-200 bg-white pl-8.5 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-mint-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-mint-500/30"
                  />
                  {productSearchQuery && (
                    <button type="button" onClick={() => setProductSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-950">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Verified Filter Toggles */}
                <div className="flex items-center gap-1 w-full sm:w-auto shrink-0 rounded-lg bg-neutral-100 p-1 border border-neutral-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setProductVerifiedFilter('all')}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${productVerifiedFilter === 'all'
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                      }`}
                  >
                    All ({products.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductVerifiedFilter('verified')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${productVerifiedFilter === 'verified'
                      ? 'bg-mint-500 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                      }`}
                  >
                    <VerifiedBadge className="h-3 w-3" />
                    <span>Verified ({products.filter((p) => p.verified).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductVerifiedFilter('unverified')}
                    className={`rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${productVerifiedFilter === 'unverified'
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                      }`}
                  >
                    Unverified ({products.filter((p) => !p.verified).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductVerifiedFilter(productVerifiedFilter === 'relaunch' ? 'all' : 'relaunch')}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${productVerifiedFilter === 'relaunch'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-950'
                      }`}
                  >
                    <Rocket className="h-3 w-3" />
                    <span>Auto-Relaunch ({products.filter((p) => p.autoRelaunch || p.autoRelaunchPaid).length})</span>
                  </button>
                </div>
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 w-full overflow-x-auto pb-1 sm:pb-0">
                {(['All', 'AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${productCategoryFilter === cat
                      ? 'bg-mint-500 text-white'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1">
                <div>
                  <h2 className="text-xs font-bold  text-neutral-400 flex items-center gap-1.5">
                    <span>Live Products Management</span>
                    <span className="font-normal text-neutral-500">({filteredProducts.length})</span>
                  </h2>
                  <p className="text-[11px] text-neutral-500 hidden sm:block mt-0.5">
                    Products ranked sequentially. Use ▲/▼ buttons to reorder rankings directly on the live leaderboard.
                  </p>
                </div>
                {onAutoRankByUpvotes && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Re-rank all products sequentially based on community upvotes and comments?')) {
                        onAutoRankByUpvotes();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 transition-colors cursor-pointer"
                    title="Automatically re-index all products based on upvote standings"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 text-mint-600" />
                    <span>Auto-Rank by Upvotes</span>
                  </button>
                )}
              </div>
              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 sm:p-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-800 text-neutral-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-neutral-950">No products found</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">Try changing your search or category filter.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const isTopThree = (product.rank ?? 0) <= 3;
                    const logoSrc = product.logoUrl || getWebsiteFavicon(product.url);

                    const productRow = (
                      <div
                        key={product.id}
                        className="rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Rank Badge + Move Up/Down Controls */}
                          {(() => {
                            const currentIndex = sortedProducts.findIndex((p) => p.id === product.id);
                            const displayRank = product.rank || (currentIndex >= 0 ? currentIndex + 1 : 1);
                            const canMoveUp = currentIndex > 0;
                            const canMoveDown = currentIndex >= 0 && currentIndex < sortedProducts.length - 1;

                            return (
                              <div className="flex items-center gap-2 shrink-0">
                                {displayRank === 1 || displayRank === 2 || displayRank === 3 ? (
                                  <RankMedal rank={displayRank as 1 | 2 | 3} className="h-9 w-9" />
                                ) : (
                                  <div className="flex h-9 w-9 items-center justify-center rounded-lg font-black text-sm shadow-2xs bg-neutral-800 text-neutral-300">
                                    #{displayRank}
                                  </div>
                                )}

                                {onAssignRank && (
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleMoveUp(product)}
                                      disabled={!canMoveUp}
                                      className={`rounded p-1 text-xs transition-colors cursor-pointer ${!canMoveUp
                                        ? 'text-neutral-600 cursor-not-allowed'
                                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                        }`}
                                      title="Move Up in Rank"
                                    >
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveDown(product)}
                                      disabled={!canMoveDown}
                                      className={`rounded p-1 text-xs transition-colors cursor-pointer ${!canMoveDown
                                        ? 'text-neutral-600 cursor-not-allowed'
                                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                        }`}
                                      title="Move Down in Rank"
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Product Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <ProductLogo
                              src={logoSrc}
                              alt={product.name}
                              containerClassName="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs"
                              iconClassName="h-5 w-5 text-black shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-neutral-950 tracking-tight truncate">{product.name}</h3>
                                {product.verified && <VerifiedBadge className="h-4 w-4 shrink-0" title="Verified Startup" />}
                                {isTopThree && (
                                  <span className="rounded-md bg-white/10 border border-white/30 px-1.5 py-0.5 text-[9px] font-bold text-white shrink-0">
                                    Top {product.rank}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">{product.tagline}</p>
                            </div>
                          </div>

                          {/* Meta: Category & Upvotes & Score */}
                          <div className="flex items-center gap-3 shrink-0 text-[11px] text-neutral-500">
                            <span className="rounded-md bg-neutral-800 border border-neutral-200 px-2 py-0.5 font-bold text-neutral-300">
                              {product.category}
                            </span>

                            <div className="flex items-center gap-1 font-bold">
                              <ChevronUp className="h-3.5 w-3.5 text-mint-500 shrink-0" />
                              <span className="font-mono-num">{product.upvotes ?? 0}</span>
                              <span className="text-neutral-400">upvotes</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                            {(() => {
                              const linkedSponsor = sponsorByProductId.get(product.id);
                              if (!linkedSponsor) return null;
                              const isPaused = linkedSponsor.status === 'paused';
                              const remainingMs = isPaused
                                ? linkedSponsor.pausedRemainingMs ?? Math.max(0, linkedSponsor.expiresAt - Date.now())
                                : Math.max(0, linkedSponsor.expiresAt - Date.now());
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    playSound('click', soundEnabled);
                                    setActiveView('sponsors');
                                  }}
                                  className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs ${isPaused
                                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                    }`}
                                  title={`Sponsor placements are managed in the Sponsors tab. This product has a ${linkedSponsor.status} ${linkedSponsor.tier} placement.`}
                                >
                                  {isPaused ? (
                                    <Pause className="h-3 w-3 text-amber-600" />
                                  ) : (
                                    <Award className="h-3 w-3" />
                                  )}
                                  <span>
                                    {isPaused ? 'Sponsor paused' : `Sponsored (${linkedSponsor.tier})`}
                                    {' · '}
                                    {formatRemainingMs(remainingMs)} left
                                  </span>
                                </button>
                              );
                            })()}

                            {/* Featured Spotlight Toggle */}
                            {(() => {
                              const isFeat = activeFeaturedIds.includes(product.id);
                              const featRank = isFeat ? activeFeaturedIds.indexOf(product.id) + 1 : null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isFeat) {
                                      handleRemoveFeatured(product.id);
                                    } else {
                                      handleAddFeatured(product.id);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${isFeat
                                    ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-2xs hover:bg-amber-100 hover:border-amber-500'
                                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-amber-400 hover:text-amber-700 hover:bg-amber-50/50'
                                    }`}
                                  title={
                                    isFeat
                                      ? `"${product.name}" is #${featRank} Featured — click to remove`
                                      : `Click to add "${product.name}" to Featured spotlight`
                                  }
                                >
                                  <Crown className={`h-3.5 w-3.5 shrink-0 ${isFeat ? 'text-amber-500 fill-amber-500' : 'text-neutral-400'}`} />
                                  <span>{isFeat ? `Featured (#${featRank})` : 'Feature'}</span>
                                </button>
                              );
                            })()}

                            {(() => {
                              const activeSponsor = sponsors.find(
                                (s) => s.productId === product.id && s.status === 'active' && s.expiresAt > Date.now()
                              );
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeSponsor) {
                                      playSound('click', soundEnabled);
                                      onEndSponsor(activeSponsor.id);
                                    } else {
                                      openAssignSponsorModal(product);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${activeSponsor
                                    ? 'border-blue-500/50 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-2xs'
                                    : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/60'
                                    }`}
                                  title={
                                    activeSponsor
                                      ? `"${product.name}" is Sponsored — click to end sponsor placement`
                                      : `Assign "${product.name}" to Sidebar Sponsor rail`
                                  }
                                >
                                  <Megaphone className={`h-3.5 w-3.5 shrink-0 ${activeSponsor ? 'text-blue-600' : 'text-neutral-400'}`} />
                                  <span>{activeSponsor ? 'Sponsored' : 'Sponsor'}</span>
                                </button>
                              );
                            })()}

                            {onToggleVerified && (
                              <button
                                type="button"
                                onClick={() => onToggleVerified(product.id, !product.verified)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${product.verified
                                  ? 'border-mint-500/50 bg-mint-500/10 text-mint-600 hover:bg-mint-500/20 hover:border-mint-400 shadow-2xs'
                                  : 'border-neutral-200 bg-neutral-100 text-neutral-500 hover:border-mint-500/60 hover:text-mint-700'
                                  }`}
                                title={product.verified ? `"${product.name}" is verified — click to remove verification` : `Click to verify "${product.name}"`}
                              >
                                {product.verified ? (
                                  <>
                                    <VerifiedBadge className="h-3.5 w-3.5 shrink-0" />
                                    <span>Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <BadgeCheck className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                                    <span>Verify</span>
                                  </>
                                )}
                              </button>
                            )}
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-400 hover:border-mint-500/60 hover:text-white transition-all cursor-pointer"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelist(product)}
                              className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-400 hover:text-red-400 hover:border-red-400/70 hover:bg-red-500/10 transition-all cursor-pointer"
                              title={`Delist "${product.name}" from directory`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );

                    return productRow;
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* FEATURED MANAGEMENT VIEW (MULTIPLE FEATURED PRODUCTS) */}
        {/* ============================================================ */}
        {activeView === 'featured' && (
          <div className="space-y-6">
            {/* Featured Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-amber-500 mb-1">
                  <span>Active Featured Tools</span>
                  <Crown className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                  {activeFeaturedProducts.length}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {activeFeaturedProducts.length === 1
                    ? `1 tool featured: ${activeFeaturedProducts[0].name}`
                    : activeFeaturedProducts.length > 1
                      ? `${activeFeaturedProducts.length} tools featured in priority order`
                      : isEmptyFeatured
                        ? 'Featured spotlight is completely hidden'
                        : 'Showing default reserve spot banner'}
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
                  <span>Spotlight Status</span>
                  <Star className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-neutral-950">
                  {activeFeaturedProducts.length > 0
                    ? `${activeFeaturedProducts.length} Active Website${activeFeaturedProducts.length > 1 ? 's' : ''}`
                    : isEmptyFeatured
                      ? 'Cleared / Empty'
                      : 'Default Placeholder'}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {activeFeaturedProducts.length > 0
                    ? 'Custom spotlight card(s) visible on directory'
                    : isEmptyFeatured
                      ? 'No featured cards displayed'
                      : 'Reserve spot card visible'}
                </p>
                {featuredExpiresAt && activeFeaturedProducts.length > 0 && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span>Countdown: {getCountdown(featuredExpiresAt).formatted} left</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
                  <span>Directory Placement</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-neutral-950 truncate">
                  {featuredPosition === 0 ? 'Top (Above #1)' : `After Rank #${featuredPosition}`}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Homepage directory placement location
                </p>
              </div>
            </div>

            {/* Add Featured Product Card */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 border border-amber-300">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-neutral-950">Add Product to Featured Spotlight</h3>
                    <p className="text-xs text-neutral-500">Search and feature any product from your live directory</p>
                  </div>
                </div>

                {/* Quick Presets / Mode Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddDefaultBanner}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer"
                    title="Add a default open spotlight banner (can add multiple, even alongside featured products)"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Default Banner{activeBannerCount > 0 ? ` (${activeBannerCount})` : ''}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetFeaturedMode('empty')}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${isEmptyFeatured
                      ? 'border-neutral-950 bg-neutral-950 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    title="Hide featured spotlight cards completely from directory"
                  >
                    <span>Hide (Empty)</span>
                  </button>
                  {activeFeaturedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Remove all items from the featured spotlight?')) {
                          handleSetFeaturedMode('default');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                      title="Clear all featured products and banners"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Add Picker */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    value={featuredSearchQuery}
                    onChange={(e) => {
                      setFeaturedSearchQuery(e.target.value);
                      setIsFeaturedSearchOpen(true);
                    }}
                    onFocus={() => setIsFeaturedSearchOpen(true)}
                    placeholder="Search by name, category, or tagline to feature..."
                    className="w-full rounded-xl border border-neutral-200 bg-white pl-10 pr-9 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950/20"
                  />
                  {featuredSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setFeaturedSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {isFeaturedSearchOpen && (
                  <div className="mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl divide-y divide-neutral-100 z-20">
                    <div className="p-2 bg-neutral-50 text-[11px] font-bold text-neutral-500 flex items-center justify-between">
                      <span>Click any product to add to Featured Spotlight</span>
                      <button
                        type="button"
                        onClick={() => setIsFeaturedSearchOpen(false)}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        Close
                      </button>
                    </div>

                    {products
                      .filter((p) => {
                        if (!featuredSearchQuery.trim()) return true;
                        const q = featuredSearchQuery.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.tagline.toLowerCase().includes(q) ||
                          p.category.toLowerCase().includes(q)
                        );
                      })
                      .slice(0, 20)
                      .map((p) => {
                        const isFeat = activeFeaturedIds.includes(p.id);
                        const featRank = isFeat ? activeFeaturedIds.indexOf(p.id) + 1 : null;

                        return (
                          <div
                            key={p.id}
                            className={`flex items-center justify-between gap-3 p-3 transition-colors ${isFeat ? 'bg-amber-50/50' : 'hover:bg-neutral-50 cursor-pointer'
                              }`}
                            onClick={() => {
                              if (!isFeat) {
                                handleAddFeatured(p.id);
                                setFeaturedSearchQuery('');
                              }
                            }}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ProductLogo
                                src={p.logoUrl}
                                alt={p.name}
                                containerClassName="h-9 w-9 rounded-lg border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-neutral-950 truncate">{p.name}</span>
                                  {p.verified && <CheckCircle2 className="h-3.5 w-3.5 text-mint-600 shrink-0" />}
                                  <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                                    {p.category}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-500 truncate">{p.tagline}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isFeat ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <Crown className="h-3 w-3 text-amber-600" />
                                    <span>#{featRank} Featured</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveFeatured(p.id);
                                    }}
                                    className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                                    title="Remove from featured"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddFeatured(p.id);
                                    setFeaturedSearchQuery('');
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-neutral-950 px-2.5 py-1 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Feature</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Active Featured Items List (Products + Default Banners) */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-black text-neutral-950">
                    Active Featured Spotlight ({activeFeaturedItems.length})
                  </h3>
                </div>
                {activeFeaturedItems.length > 1 && (
                  <span className="text-[11px] text-neutral-400">
                    Use arrows to reorder priority on homepage
                  </span>
                )}
              </div>

              {activeFeaturedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center bg-neutral-50/50">
                  <Crown className="mx-auto h-8 w-8 text-neutral-300 mb-2" />
                  <h4 className="text-xs font-bold text-neutral-700">No Custom Featured Items</h4>
                  <p className="text-[11px] text-neutral-400 mt-1 max-w-sm mx-auto">
                    {isEmptyFeatured
                      ? 'The featured spotlight is currently set to Empty (hidden from directory).'
                      : 'The homepage is displaying 1 default "Reserve Spot" banner. Click "Add Default Banner" or search for products above to add multiple.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeFeaturedItems.map((item, index) => {
                    const isFirst = index === 0;
                    const isLast = index === activeFeaturedItems.length - 1;

                    if (item.kind === 'banner') {
                      const curPos = featuredPositions[item.id] !== undefined ? featuredPositions[item.id] : featuredPosition;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/30 p-4 shadow-2xs transition-all hover:border-blue-400"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black text-white shadow-xs">
                                  <Crown className="h-3 w-3" />
                                  <span>#{index + 1}</span>
                                </span>

                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFeaturedUp(index)}
                                    disabled={isFirst}
                                    className={`rounded p-1 text-xs transition-colors cursor-pointer ${isFirst ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'}`}
                                    title={isFirst ? 'Already top priority' : 'Move Up in Priority'}
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFeaturedDown(index)}
                                    disabled={isLast}
                                    className={`rounded p-1 text-xs transition-colors cursor-pointer ${isLast ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'}`}
                                    title={isLast ? 'Already lowest priority' : 'Move Down in Priority'}
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="h-12 w-12 rounded-xl border border-dashed border-blue-300 bg-white shrink-0 flex items-center justify-center text-blue-600 shadow-2xs">
                                <Plus className="h-5 w-5" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-black text-neutral-950 truncate">Default Open Spotlight Banner</h4>
                                  <span className="rounded-md bg-blue-100 border border-blue-200 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                                    Open Spot CTA
                                  </span>
                                </div>
                                <p className="text-xs text-neutral-500 truncate mt-0.5">
                                  Shows the &ldquo;The featured spot is open · Reserve spot&rdquo; banner
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFeatured(item.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                                title="Remove this default banner"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-blue-200/70">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-neutral-800">
                                <ArrowUpDown className="h-3 w-3 text-blue-600" />
                                <span>Listing Position:</span>
                              </span>
                              <span className="rounded-md bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-black text-blue-900 shadow-2xs">
                                {curPos === 0 ? 'Top (Above #1)' : `After Rank #${curPos}`}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {[
                                { pos: 0, label: 'Top' },
                                { pos: 1, label: 'After #1' },
                                { pos: 2, label: 'After #2' },
                                { pos: 3, label: 'After #3' },
                                { pos: 4, label: 'After #4' },
                                { pos: 5, label: 'After #5' },
                                { pos: 10, label: 'After #10' },
                              ].map(({ pos, label }) => {
                                const isActive = curPos === pos;
                                return (
                                  <button
                                    key={pos}
                                    type="button"
                                    onClick={() => onSetProductFeaturedPosition?.(item.id, pos)}
                                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${isActive
                                      ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-blue-400 hover:bg-blue-50/50'
                                      }`}
                                  >
                                    {label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const p = item.product;

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col gap-3 rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-50/40 via-amber-50/15 to-white p-4 shadow-2xs transition-all hover:border-amber-400"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                          {/* Left: Priority Badge & Move Controls */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-black text-white shadow-xs">
                                <Crown className="h-3 w-3" />
                                <span>#{index + 1}</span>
                              </span>

                              <div className="flex flex-col gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleMoveFeaturedUp(index)}
                                  disabled={isFirst}
                                  className={`rounded p-1 text-xs transition-colors cursor-pointer ${isFirst ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                                    }`}
                                  title={isFirst ? 'Already top priority' : 'Move Up in Priority'}
                                >
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveFeaturedDown(index)}
                                  disabled={isLast}
                                  className={`rounded p-1 text-xs transition-colors cursor-pointer ${isLast ? 'text-neutral-300 cursor-not-allowed' : 'text-neutral-600 hover:bg-neutral-100 hover:text-black'
                                    }`}
                                  title={isLast ? 'Already lowest priority' : 'Move Down in Priority'}
                                >
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <ProductLogo
                              src={p.logoUrl}
                              alt={p.name}
                              containerClassName="h-12 w-12 rounded-xl border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center shadow-2xs"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-neutral-950 truncate">{p.name}</h4>
                                {p.verified && <CheckCircle2 className="h-3.5 w-3.5 text-mint-600 shrink-0" />}
                                <span className="rounded-md bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
                                  {p.category}
                                </span>
                                {featuredExpiresAt && (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    <span>{getCountdown(featuredExpiresAt).formatted} left</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 truncate mt-0.5">{p.tagline}</p>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                                <span className="font-bold text-neutral-600">{p.upvotes ?? 0} upvotes</span>
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-neutral-500 hover:text-black font-semibold hover:underline"
                                >
                                  <Globe className="h-3 w-3" />
                                  <span className="truncate max-w-[180px]">{p.url.replace(/^https?:\/\//, '')}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 hover:border-neutral-400 hover:text-neutral-950 transition-all cursor-pointer"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeatured(p.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer"
                              title="Remove from featured spotlight"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>

                        {/* Directory Position Controls on Card */}
                        {(() => {
                          const curPos = featuredPositions[p.id] !== undefined ? featuredPositions[p.id] : featuredPosition;
                          return (
                            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t border-amber-200/70">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-neutral-800">
                                  <ArrowUpDown className="h-3 w-3 text-amber-600" />
                                  <span>Listing Position:</span>
                                </span>

                                <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 shadow-2xs">
                                  {curPos === 0 ? 'Top (Above #1)' : `After Rank #${curPos}`}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Quick Preset Buttons */}
                                {[
                                  { pos: 0, label: 'Top' },
                                  { pos: 1, label: 'After #1' },
                                  { pos: 2, label: 'After #2' },
                                  { pos: 3, label: 'After #3' },
                                  { pos: 4, label: 'After #4' },
                                  { pos: 5, label: 'After #5' },
                                  { pos: 10, label: 'After #10' },
                                ].map(({ pos, label }) => {
                                  const isActive = curPos === pos;
                                  return (
                                    <button
                                      key={pos}
                                      type="button"
                                      onClick={() => onSetProductFeaturedPosition?.(p.id, pos)}
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer border ${isActive
                                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-amber-400 hover:bg-amber-50/50'
                                        }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}

                                {/* Stepper & Custom Rank Input */}
                                <div className="flex items-center gap-1 pl-1">
                                  <div className="flex items-center rounded-lg border border-neutral-200 bg-white shadow-2xs overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => onSetProductFeaturedPosition?.(p.id, Math.max(0, curPos - 1))}
                                      className="px-2 py-0.5 text-xs font-black text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                                      title="Decrease position"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={curPos}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val >= 0) {
                                          onSetProductFeaturedPosition?.(p.id, val);
                                        }
                                      }}
                                      className="w-10 text-center text-xs font-black text-neutral-900 outline-none py-0.5"
                                      title="Custom position index"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => onSetProductFeaturedPosition?.(p.id, curPos + 1)}
                                      className="px-2 py-0.5 text-xs font-black text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                                      title="Increase position"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Featured Card Placement Position */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-amber-500" />
                  <h3 className="text-sm font-black text-neutral-950">Featured Card Position in Listing</h3>
                </div>
                <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                  Live on Homepage: {featuredPosition === 0 ? 'Top (Above #1)' : `After Rank #${featuredPosition}`}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mb-3.5">
                Choose where the featured spotlight card(s) appear on the homepage directory listing.
              </p>

              <div className="space-y-3">
                {/* Preset Position Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { pos: 0, label: 'Top (Above #1)' },
                    { pos: 1, label: 'After #1' },
                    { pos: 2, label: 'After #2' },
                    { pos: 3, label: 'After #3' },
                    { pos: 4, label: 'After #4' },
                    { pos: 5, label: 'After #5' },
                    { pos: 10, label: 'After #10' },
                  ].map(({ pos, label }) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => {
                        playSound('click', soundEnabled);
                        onSetFeaturedPosition?.(pos);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${featuredPosition === pos
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Custom Rank Input */}
                <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-neutral-100">
                  <span className="text-xs font-semibold text-neutral-600">
                    Or custom position (after rank #):
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={featuredPosition}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 0) {
                          onSetFeaturedPosition?.(val);
                        }
                      }}
                      className="w-20 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-bold text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950/20"
                    />
                    <span className="text-[11px] text-neutral-400">
                      (0 = Top/Above #1, 1 = After #1, 2 = After #2, etc.)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* How Multiple Featured Works Guide */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h4 className="text-xs font-bold text-neutral-950 mb-2">How Featured Spotlights Work</h4>
              <ul className="space-y-1.5 text-xs text-neutral-500">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-neutral-700">1.</span>
                  <span>You can feature multiple products simultaneously. Each appears as a full-width featured card on the directory listing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-neutral-700">2.</span>
                  <span>Use the priority arrows (Up/Down) to reorder which featured card appears first, second, etc.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-neutral-700">3.</span>
                  <span>You can also feature or unfeature any product with one click from the Live Products tab using the &quot;Feature&quot; button.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-neutral-700">4.</span>
                  <span>Use &quot;Default Banner&quot; to show the open spotlight card, or &quot;Hide (Empty)&quot; to remove the spotlight section completely.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SPONSORS & OUTREACH TRACKER VIEW */}
        {/* ============================================================ */}
        {activeView === 'sponsors' && (
          <SponsorTrackerTab
            sponsors={sponsors}
            products={directoryProducts}
            soundEnabled={soundEnabled}
            onCreateSponsor={onCreateSponsor}
            onUpdateSponsor={onUpdateSponsor}
            onEndSponsor={onEndSponsor}
            onPauseSponsor={onPauseSponsor}
            sponsorRailsEnabled={sponsorRailsEnabled}
            onToggleSponsorRails={onToggleSponsorRails}
            sponsorOrderIds={sponsorOrderIds}
            onSetSponsorOrder={onSetSponsorOrder}
          />
        )}
      </main>

      {/* Edit Submission Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-2xl p-5 sm:p-6 text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingSubmission(null)}
              className="absolute right-3.5 top-3.5 rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-mint-600 border border-neutral-200 font-bold text-xs shadow-2xs">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-950">Edit Submission</h3>
                <p className="text-xs text-neutral-400">Modify details before approving</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Website Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-white focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Website URL</label>
                <input type="text" required value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-white focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Tagline</label>
                <textarea required rows={2} value={editTagline} onChange={(e) => setEditTagline(e.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-white focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as Category)} className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-white focus:border-mint-500 focus:outline-none focus:ring-1 focus:ring-mint-500">
                  <option value="AI Tools">AI Tools</option>
                  <option value="Developer Tools">Developer Tools</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Design & UI">Design & UI</option>
                  <option value="SaaS & Indie">SaaS & Indie</option>
                  <option value="Crypto & Web3">Crypto & Web3</option>
                </select>
              </div>

              {/* Offer / Discount Details */}
              <div className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Offer / Discount Details (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-400 mb-0.5">Discount Offer</label>
                    <input
                      type="text"
                      placeholder="e.g. 20% OFF"
                      value={editOfferDiscount}
                      onChange={(e) => setEditOfferDiscount(e.target.value)}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-mint-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-neutral-400 mb-0.5">Promo / Coupon Code</label>
                    <input
                      type="text"
                      placeholder="e.g. TOPSAAS20"
                      value={editOfferCode}
                      onChange={(e) => setEditOfferCode(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-mono text-neutral-900 placeholder-neutral-400 focus:border-mint-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-400 mb-0.5">Redeem URL (if different)</label>
                  <input
                    type="url"
                    placeholder="https://example.com/pricing?code=TOPSAAS"
                    value={editOfferUrl}
                    onChange={(e) => setEditOfferUrl(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-mint-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-neutral-400 mb-0.5">Offer Terms / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. First 3 months for early adopters"
                    value={editOfferDetails}
                    onChange={(e) => setEditOfferDetails(e.target.value)}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:border-mint-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditingSubmission(null)} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50">Cancel</button>
                <button type="submit" className="rounded-xl bg-white px-4 py-2 text-xs font-black text-black hover:bg-neutral-200">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-sm rounded-2xl border border-neutral-200 bg-white shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-150 text-white">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/40 border border-red-800/60 mb-4">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <h3 className="text-base font-black text-neutral-950 mb-1">Revoke Approval?</h3>
            <p className="text-xs text-neutral-400 mb-5">
              <span className="font-bold text-white">{revokeTarget.name}</span> will be removed from the live directory. This action can be undone by restoring the submission.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReject(revokeTarget.id);
                  setRevokeTarget(null);
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-neutral-950 hover:bg-red-700 transition-all cursor-pointer active:scale-[0.98]"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBMISSION DETAILS MODAL (PREVIEW BEFORE & AFTER APPROVAL) */}
      {/* ============================================================ */}
      {viewingDetailsSubmission && (() => {
        const sub = viewingDetailsSubmission;
        const logoSrc = sub.logoUrl || getWebsiteFavicon(sub.url);
        const isUnderReview = (sub.status || 'under_review') === 'under_review';
        const isApproved = sub.status === 'approved';
        const isRejected = sub.status === 'rejected';
        const liveProduct = products.find((p) => p.id === publishedProductId(sub.id));
        const videoData = getVideoEmbedUrl(sub.demoVideoUrl);

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto font-sans"
            onClick={() => setViewingDetailsSubmission(null)}
          >
            <div
              className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-neutral-200 bg-[#242424]">
                <div className="flex items-start gap-4 min-w-0">
                  <ProductLogo
                    src={logoSrc}
                    alt={sub.name}
                    containerClassName="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-md"
                    iconClassName="h-7 w-7 text-neutral-400 shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{sub.name}</h2>

                      {isUnderReview && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-bold text-amber-300">
                          <Clock className="h-3.5 w-3.5" /> Pending Approval
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Live {liveProduct?.rank ? `(#${liveProduct.rank})` : ''}
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-xs font-bold text-red-300">
                          <XCircle className="h-3.5 w-3.5" /> Rejected
                        </span>
                      )}

                      <span className="rounded-lg bg-neutral-800 border border-neutral-200 px-2.5 py-0.5 text-xs font-bold text-neutral-300">
                        {sub.category}
                      </span>
                    </div>

                    <p className="text-sm text-neutral-300 font-medium">{sub.tagline}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-neutral-400">
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-mint-600 font-bold hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5 text-mint-600" />
                        <span>{sub.url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <span>Submitted: {new Date(sub.submittedAt).toLocaleString()} ({formatTimestamp(sub.submittedAt)})</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingDetailsSubmission(null)}
                  className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-500 hover:text-neutral-950 hover:bg-neutral-700 transition-all cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Action Toolbar Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-neutral-200 bg-neutral-100">
                <span className="text-xs font-bold text-neutral-400">
                  Admin Actions for this Launch:
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {isUnderReview && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleAccept(sub);
                          setViewingDetailsSubmission({ ...sub, status: 'approved' });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-white hover:bg-emerald-400 active:scale-[0.98] transition-all cursor-pointer shadow-md"
                      >
                        <Check className="h-4 w-4 stroke-[3]" />
                        <span>Approve & Go Live</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEdit(sub);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleReject(sub.id);
                          setViewingDetailsSubmission({ ...sub, status: 'rejected' });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {isApproved && (
                    <>
                      {liveProduct && onToggleVerified && (
                        <button
                          type="button"
                          onClick={() => onToggleVerified(liveProduct.id, !liveProduct.verified)}
                          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${liveProduct.verified
                            ? 'border-mint-500/50 bg-mint-500/10 text-mint-600 hover:bg-mint-500/20 shadow-2xs'
                            : 'border-neutral-200 bg-white text-neutral-300 hover:border-mint-500/50 hover:text-white'
                            }`}
                          title={liveProduct.verified ? 'Verified Startup — click to remove verification' : 'Click to mark as Verified Startup'}
                        >
                          {liveProduct.verified ? (
                            <>
                              <VerifiedBadge className="h-4 w-4 shrink-0" />
                              <span>Verified Startup</span>
                            </>
                          ) : (
                            <>
                              <BadgeCheck className="h-4 w-4 text-neutral-400 shrink-0" />
                              <span>Mark Verified</span>
                            </>
                          )}
                        </button>
                      )}
                      <a
                        href={`/products/${getProductSlug(liveProduct) || getProductSlug(sub) || liveProduct?.id || sub.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2 text-xs font-black text-white hover:bg-mint-400 transition-all cursor-pointer shadow-md"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View Live Product Page</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEdit(sub);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(sub)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all cursor-pointer"
                      >
                        Revoke Approval
                      </button>
                    </>
                  )}

                  {isRejected && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleAccept(sub);
                          setViewingDetailsSubmission({ ...sub, status: 'approved' });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Restore & Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteSubmission(sub);
                          setViewingDetailsSubmission(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-bold text-red-400 hover:border-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Record</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable Body Details */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(92vh-160px)]">
                {/* Auto-Relaunch Subscriber Card */}
                {(sub.autoRelaunch || sub.autoRelaunchPaid) && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2 text-neutral-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-black text-blue-950">Auto Weekly Relaunch Subscribed</span>
                      </div>
                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        Paid ($5 / mo)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-neutral-700">
                      <div>
                        <span className="text-neutral-500 font-medium">Subscriber: </span>
                        <span className="font-bold text-neutral-900">{sub.backerName}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium">Billing Email: </span>
                        <span className="font-bold text-neutral-900">{sub.backerEmail || 'Not provided'}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 font-medium">Relaunch Schedule: </span>
                        <span className="font-bold text-blue-700">Every Sunday 00:00</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* 1. All Links & Distribution Channels */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-mint-600" />
                      <h3 className="text-xs font-black  text-neutral-950">All Submitted Links & Socials</h3>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {(sub.socials?.length || 0) + 1} distribution channels
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {/* Primary Website */}
                    <a
                      href={sub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-mint-600 hover:border-mint-500 hover:text-mint-700 transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe className="h-3.5 w-3.5 text-neutral-400 group-hover:text-mint-600 shrink-0" />
                        <span className="truncate">Website: {sub.url.replace(/^https?:\/\//, '')}</span>
                      </div>
                      <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                    </a>

                    {/* Twitter Handle fallback */}
                    {sub.twitterHandle && !sub.socials?.some((s) => s.platform === 'x') && (
                      <a
                        href={`https://x.com/${sub.twitterHandle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Twitter className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                          <span className="truncate">X: @{sub.twitterHandle.replace('@', '')}</span>
                        </div>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </a>
                    )}

                    {/* All Socials */}
                    {sub.socials?.map((s, idx) => {
                      const getLabel = (platform: string) => {
                        switch (platform) {
                          case 'x': return 'X (Twitter)';
                          case 'linkedin': return 'LinkedIn';
                          case 'youtube': return 'YouTube';
                          case 'reddit': return 'Reddit';
                          case 'product_hunt': return 'Product Hunt';
                          case 'github': return 'GitHub';
                          case 'discord': return 'Discord';
                          case 'app_store': return 'Apple App Store';
                          case 'play_store': return 'Google Play Store';
                          case 'chrome_web_store': return 'Chrome Extension';
                          default: return platform;
                        }
                      };

                      return (
                        <a
                          key={`${s.platform}-${idx}`}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:border-mint-500/60 hover:text-mint-700 hover:bg-mint-50/30 transition-all group"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-2 w-2 rounded-full bg-mint-400 shrink-0" />
                            <span className="truncate">{getLabel(s.platform)}</span>
                          </div>
                          <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Special Promo Offer / Discount Deal */}
                {(sub.offerDiscount || sub.offerCode || sub.offerUrl || sub.offerDetails) && (
                  <div className="rounded-xl border border-mint-500/40 bg-[#1a2a25] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-mint-500/30 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-mint-600" />
                        <h3 className="text-xs font-black  text-mint-600">Exclusive TopSAAS Offer</h3>
                      </div>
                      {sub.offerDiscount && (
                        <span className="rounded-full bg-mint-500 text-white px-2.5 py-0.5 text-xs font-black">
                          {sub.offerDiscount}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {sub.offerCode && (
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400  mb-1">Promo / Discount Code</label>
                          <button
                            type="button"
                            onClick={() => handleCopyOfferCode(sub.offerCode!)}
                            className="w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-mint-400/80 bg-neutral-100 px-3 py-2 text-xs font-mono font-bold text-mint-600 hover:bg-mint-400/10 transition-all cursor-pointer"
                          >
                            <span>{sub.offerCode}</span>
                            {copiedOfferCode ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-sans font-black text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                                <Check className="h-3 w-3" /> Copied!
                              </span>
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-neutral-400" />
                            )}
                          </button>
                        </div>
                      )}

                      {sub.offerUrl && (
                        <div>
                          <label className="block text-[10px] font-bold text-neutral-400  mb-1">Redeem Deal URL</label>
                          <a
                            href={sub.offerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-xs font-medium text-mint-600 hover:underline"
                          >
                            <span className="truncate">{sub.offerUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        </div>
                      )}
                    </div>

                    {sub.offerDetails && (
                      <div className="text-xs text-neutral-300 pt-1">
                        <span className="font-bold text-neutral-400">Offer Terms: </span>
                        {sub.offerDetails}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Demo Video Player */}
                {videoData && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-mint-600" />
                        <h3 className="text-xs font-black  text-neutral-950">Product Demo Video</h3>
                      </div>
                      <a
                        href={sub.demoVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-mint-600 hover:text-mint-700"
                      >
                        <span>Open Video URL</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>

                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 bg-black">
                      {videoData.type === 'iframe' ? (
                        <iframe
                          src={videoData.embedUrl}
                          title={`${sub.name} Demo Video`}
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
                          <Play className="h-10 w-10 text-mint-600" />
                          <p className="text-xs text-neutral-300">Click below to watch the demo video.</p>
                          <a
                            href={videoData.embedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-mint-500 px-4 py-2 text-xs font-black text-white"
                          >
                            <span>Open Demo</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Screenshots Gallery */}
                {sub.screenshots && sub.screenshots.length > 0 && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-mint-600" />
                        <h3 className="text-xs font-black  text-neutral-950">Product Screenshots</h3>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-medium">
                        {sub.screenshots.length} {sub.screenshots.length === 1 ? 'image' : 'images'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {sub.screenshots.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setLightboxImage(src)}
                          className="group relative aspect-video overflow-hidden rounded-xl border border-neutral-200 bg-white cursor-pointer hover:border-mint-500 transition-all"
                        >
                          <img
                            src={src}
                            alt={`${sub.name} preview ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Pitch & Specifications */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-2.5">
                    <Sparkles className="h-4 w-4 text-mint-600" />
                    <h3 className="text-xs font-black  text-neutral-950">Pitch Copy & Detailed Information</h3>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    {sub.description && (
                      <div>
                        <span className="block font-bold text-[10px] tracking-wider text-neutral-400 mb-1">Executive Description</span>
                        <div className="bg-white p-3 rounded-lg border border-neutral-200">
                          <RichText html={sub.description} className="text-neutral-700 text-xs leading-relaxed" />
                        </div>
                      </div>
                    )}

                    {sub.problemItSolves && (
                      <div>
                        <span className="block font-bold text-[10px] tracking-wider text-neutral-400 mb-1">Problem It Solves</span>
                        <div className="bg-white p-3 rounded-lg border border-neutral-200">
                          <RichText html={sub.problemItSolves} className="text-neutral-700 text-xs leading-relaxed" />
                        </div>
                      </div>
                    )}

                    {sub.solution && (
                      <div>
                        <span className="block font-bold text-[10px] tracking-wider text-neutral-400 mb-1">Solution Offered</span>
                        <div className="bg-white p-3 rounded-lg border border-neutral-200">
                          <RichText html={sub.solution} className="text-neutral-700 text-xs leading-relaxed" />
                        </div>
                      </div>
                    )}

                    {sub.uniqueSellingPoint && (
                      <div>
                        <span className="block font-bold text-[10px] tracking-wider text-neutral-400 mb-1">Unique Selling Point (USP)</span>
                        <div className="bg-white p-3 rounded-lg border border-neutral-200">
                          <RichText html={sub.uniqueSellingPoint} className="text-neutral-700 text-xs leading-relaxed" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {sub.targetAudience && (
                        <div>
                          <span className="block font-bold text-[10px] tracking-wider text-neutral-400 mb-1">Target Audience</span>
                          <p className="text-neutral-200 bg-white p-2.5 rounded-lg border border-neutral-200">{sub.targetAudience}</p>
                        </div>
                      )}
                      {sub.pricingModel && (
                        <div>
                          <span className="block font-bold text-[10px] tracking-wider text-neutral-400 mb-1">Pricing Model</span>
                          <p className="text-neutral-200 bg-white p-2.5 rounded-lg border border-neutral-200">{sub.pricingModel}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 6. Founder Profile & Submitter Metadata */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-2.5">
                    <User className="h-4 w-4 text-mint-600" />
                    <h3 className="text-xs font-black  text-neutral-950">Founder & Submitter Details</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-neutral-200">
                      {sub.creatorAvatar ? (
                        <img src={sub.creatorAvatar} alt={sub.creatorName || 'Founder'} className="h-10 w-10 rounded-full object-cover border border-neutral-600" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-500 text-white font-black text-sm">
                          {(sub.creatorName || sub.backerName || 'F')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{sub.creatorName || sub.backerName || 'Maker'}</div>
                        <div className="text-[11px] text-neutral-400">{sub.creatorRole || 'Founder / Maker'}</div>
                        {sub.creatorXHandle && (
                          <div className="text-[10px] text-sky-400">@{sub.creatorXHandle.replace('@', '')}</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3 rounded-lg border border-neutral-200 text-neutral-300">
                      <div><span className="text-neutral-500">Submitter Backer:</span> {sub.backerName || 'Community Creator'}</div>
                      {sub.backerEmail && <div><span className="text-neutral-500">Contact Email:</span> {sub.backerEmail}</div>}
                      <div><span className="text-neutral-500">Submission ID:</span> <span className="font-mono text-[10px]">{sub.id}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t border-neutral-200 bg-[#242424]">
                <span className="text-xs text-neutral-400">
                  Status: <span className="font-bold text-white capitalize">{sub.status || 'under_review'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setViewingDetailsSubmission(null)}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick Assign Sponsor Modal */}
      {sponsorAssignProduct && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSponsorAssignProduct(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-2xl text-neutral-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
                  <Megaphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-neutral-950 truncate">
                    Assign Sponsor: {sponsorAssignProduct.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Place on the 24/7 sidebar sponsor rails
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSponsorAssignProduct(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Duration / Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'trial', label: '7-Day Trial' },
                      { id: '1mo', label: '1 Month (30d)' },
                      { id: '3mo', label: '3 Months (90d)' },
                      { id: '1yr', label: '1 Year (365d)' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSponsorAssignTier(opt.id)}
                      className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${sponsorAssignTier === opt.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Founder / Contact Email (optional)
                </label>
                <input
                  type="email"
                  value={sponsorAssignEmail}
                  onChange={(e) => setSponsorAssignEmail(e.target.value)}
                  placeholder="founder@company.com"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  If provided, they&apos;ll automatically receive a Sponsor Live email.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSponsorAssignProduct(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignSponsor}
                disabled={isAssigningSponsor}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-black text-white shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isAssigningSponsor ? 'Assigning...' : 'Activate Sponsor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Future Launch Modal */}
      {reschedulingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setReschedulingItem(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">
                    Reschedule Launch
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {reschedulingItem.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReschedulingItem(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl bg-neutral-50 p-3 border border-neutral-200 text-xs text-neutral-600">
                <span className="font-bold text-neutral-900">Current Schedule: </span>
                Week {reschedulingItem.targetWeekNumber} ({formatWeekDateRange(getWeekByNumber(reschedulingItem.targetWeekNumber))})
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-2">
                  Select New Launch Week / Timing:
                </label>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {/* Immediate option */}
                  <button
                    type="button"
                    onClick={() => setRescheduleWeekChoice('now')}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${rescheduleWeekChoice === 'now'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
                      }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Rocket className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold">Publish Live Immediately</div>
                        <div className="text-[11px] text-neutral-500 font-normal">Go live right now today</div>
                      </div>
                    </div>
                    {rescheduleWeekChoice === 'now' && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>

                  {/* Upcoming weeks range */}
                  {getWeeksRange(getWeekNumber(), 8).map((w) => {
                    const isSelected = rescheduleWeekChoice === w.weekNumber;
                    const isCurrent = w.isCurrent;
                    return (
                      <button
                        key={w.weekNumber}
                        type="button"
                        onClick={() => setRescheduleWeekChoice(w.weekNumber)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                          ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-bold ring-1 ring-sky-500'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800'
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar className="h-4 w-4 text-sky-600 shrink-0" />
                          <div>
                            <div className="text-xs font-bold flex items-center gap-2">
                              <span>Week {w.weekNumber}</span>
                              {isCurrent && (
                                <span className="rounded bg-mint-500 text-white text-[9px] px-1.5 py-0.2 font-black">
                                  Current Week
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-normal">
                              {formatWeekDateRange(w)}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setReschedulingItem(null)}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="rounded-xl bg-sky-600 hover:bg-sky-700 px-4 py-2 text-xs font-black text-white shadow-xs cursor-pointer"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Screenshots */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Screenshot Preview"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl border border-neutral-200"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 border border-neutral-600 text-white hover:bg-neutral-700 cursor-pointer shadow-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

