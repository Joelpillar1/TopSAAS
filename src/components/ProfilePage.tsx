import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Globe,
  Mail,
  Calendar,
  Trash2,
  LogOut,
  Pencil,
  X,
  Check,
  Video,
  User as UserIcon,
  Sparkles,
  Save,
  Upload,
  Plus,
  Clock,
  Code2,
  ChevronLeft,
  ChevronRight,
  Star,
  FileText,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Category, PricingModel, Product, ProductSocial, SocialPlatform, SUBMISSION_CATEGORIES, WebsiteSubmission } from '../types';
import { getWebsiteFavicon } from '../utils/logo';
import { mapDbProduct, mapDbSubmission, updateProductDirect, submissionToProduct } from '../utils/db';
import { ProductLogo } from './ProductLogo';
import { playSound } from '../utils/sound';
import { EmbedBadgeModal } from './EmbedBadgeModal';
import { RichTextEditor } from './RichTextEditor';
import { prepareRichText } from '../utils/richText';
import { uploadScreenshotToStorage } from '../utils/storage';
import {
  getUserDrafts,
  fetchUserDraftsFromDb,
  deleteLaunchDraft,
  loadDraftIntoActive,
  formatDraftTime,
  LaunchDraft,
} from '../utils/drafts';
import confetti from 'canvas-confetti';

interface ProfilePageProps {
  user: User;
  allProducts?: Product[];
  allSubmissions?: WebsiteSubmission[];
  onBack: () => void;
  onSignOut?: () => void;
  onOpenSubmit?: () => void;
  onOpenFeaturedSpotModal?: () => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  soundEnabled?: boolean;
}

const LOOKING_FOR_OPTIONS = [
  'Partnerships',
  'Feedback',
  'Co-founder',
  'Investors',
  'Beta testers',
  'Hiring',
];

const PRICING_OPTIONS: PricingModel[] = ['Free', 'Freemium', 'Paid', 'Open Source'];

// Helper to process and compress images for logos and screenshots
function processImageFile(
  file: File,
  opts: { maxSide: number; format: 'image/png' | 'image/jpeg'; quality?: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file — PNG, JPG, SVG or WebP'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read that file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file could not be decoded as an image'));
      img.onload = () => {
        const scale = Math.min(1, opts.maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is not supported in this browser'));
          return;
        }
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(opts.format, opts.quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  allProducts = [],
  allSubmissions = [],
  onBack,
  onSignOut,
  onOpenSubmit,
  onOpenFeaturedSpotModal,
  onDeleteProduct,
  onUpdateProduct,
  onSelectProduct,
  soundEnabled = true,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [submissions, setSubmissions] = useState<WebsiteSubmission[]>([]);
  const [drafts, setDrafts] = useState<LaunchDraft[]>(() => getUserDrafts(user.id));
  const [activeProfileTab, setActiveProfileTab] = useState<'live' | 'drafts' | 'pending' | 'profile'>('live');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile Form States (matching user-provided design)
  const [username, setUsername] = useState<string>(() => {
    return (
      user.user_metadata?.username ||
      user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_-]/g, '') ||
      'founder'
    );
  });
  const [displayName, setDisplayName] = useState<string>(() => {
    return (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      ''
    );
  });
  const [bio, setBio] = useState<string>(() => user.user_metadata?.bio || '');
  const [lookingFor, setLookingFor] = useState<string[]>(() => {
    return Array.isArray(user.user_metadata?.looking_for) ? user.user_metadata.looking_for : [];
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [twitterUrl, setTwitterUrl] = useState<string>(() => user.user_metadata?.twitter_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState<string>(() => user.user_metadata?.linkedin_url || '');
  const [websiteUrl, setWebsiteUrl] = useState<string>(() => user.user_metadata?.website_url || '');
  const [bookingUrl, setBookingUrl] = useState<string>(() => user.user_metadata?.booking_url || '');
  const [membershipTier, setMembershipTier] = useState<string>('free');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`topsaas_profile_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.displayName) setDisplayName(parsed.displayName);
        if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        if (parsed.bio !== undefined) setBio(parsed.bio);
        if (Array.isArray(parsed.lookingFor)) setLookingFor(parsed.lookingFor);
        if (parsed.twitterUrl !== undefined) setTwitterUrl(parsed.twitterUrl);
        if (parsed.linkedinUrl !== undefined) setLinkedinUrl(parsed.linkedinUrl);
        if (parsed.websiteUrl !== undefined) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.bookingUrl !== undefined) setBookingUrl(parsed.bookingUrl);
      }
    } catch { }

    Promise.resolve(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
    )
      .then(({ data }) => {
        if (data) {
          if (data.username) setUsername(data.username);
          if (data.full_name) setDisplayName(data.full_name);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if (data.bio) setBio(data.bio);
          if (Array.isArray(data.looking_for)) setLookingFor(data.looking_for);
          if (data.twitter_url) setTwitterUrl(data.twitter_url);
          if (data.linkedin_url) setLinkedinUrl(data.linkedin_url);
          if (data.website_url) setWebsiteUrl(data.website_url);
          if (data.booking_url) setBookingUrl(data.booking_url);
          if (data.membership_tier) setMembershipTier(data.membership_tier);
        }
      })
      .catch(() => { });
  }, [user.id]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, or WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const dataUrl = await processImageFile(file, {
        maxSide: 256,
        format: 'image/jpeg',
        quality: 0.85,
      });

      const cdnUrl = await uploadScreenshotToStorage(file, `avatar-${user.id}`);
      const finalAvatar = cdnUrl || dataUrl;

      setAvatarUrl(finalAvatar);

      // Persist to Supabase auth user_metadata & profiles table immediately
      await Promise.all([
        supabase.auth.updateUser({
          data: { avatar_url: finalAvatar },
        }),
        supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: finalAvatar,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' }),
      ]).catch(() => { });

      // Cache locally
      try {
        const raw = localStorage.getItem(`topsaas_profile_${user.id}`);
        const parsed = raw ? JSON.parse(raw) : {};
        parsed.avatarUrl = finalAvatar;
        localStorage.setItem(`topsaas_profile_${user.id}`, JSON.stringify(parsed));
      } catch { }

      playSound('success', soundEnabled);
    } catch (err) {
      console.warn('Avatar upload error:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    setAvatarUrl('');
    try {
      await Promise.all([
        supabase.auth.updateUser({
          data: { avatar_url: '' },
        }),
        supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' }),
      ]).catch(() => { });

      try {
        const raw = localStorage.getItem(`topsaas_profile_${user.id}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          delete parsed.avatarUrl;
          localStorage.setItem(`topsaas_profile_${user.id}`, JSON.stringify(parsed));
        }
      } catch { }

      playSound('click', soundEnabled);
    } catch (err) {
      console.warn('Avatar remove error:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleLookingFor = (item: string) => {
    playSound('click', soundEnabled);
    setLookingFor((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    setProfileError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@+/, '');
    const cleanDisplayName = displayName.trim() || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

    // 1. Verify username uniqueness in Supabase only if explicitly changed
    const currentUsername = (user.user_metadata?.username || '').trim().toLowerCase().replace(/^@+/, '');
    if (cleanUsername && cleanUsername !== currentUsername) {
      try {
        const { data: isAvail, error: rpcErr } = await supabase.rpc('is_username_available', {
          check_username: cleanUsername,
        });

        if (!rpcErr && isAvail === false) {
          setProfileError(`@${cleanUsername} is already taken by another creator.`);
          setIsSavingProfile(false);
          return;
        }

        if (rpcErr) {
          // Fallback query if RPC isn't available yet
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', cleanUsername)
            .neq('id', user.id)
            .maybeSingle();

          if (existingUser) {
            setProfileError(`@${cleanUsername} is already taken by another creator.`);
            setIsSavingProfile(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Username check note:', err);
      }
    }

    const payload = {
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatarUrl,
      bio: bio.trim(),
      lookingFor,
      twitterUrl: twitterUrl.trim(),
      linkedinUrl: linkedinUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      bookingUrl: bookingUrl.trim(),
    };

    // 2. Cache in localStorage for instant access
    try {
      localStorage.setItem(`topsaas_profile_${user.id}`, JSON.stringify(payload));
    } catch { }

    // 3. Update Supabase Auth user_metadata
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: payload.displayName,
          username: payload.username,
          avatar_url: avatarUrl,
          bio: payload.bio,
          looking_for: payload.lookingFor,
          twitter_url: payload.twitterUrl,
          linkedin_url: payload.linkedinUrl,
          website_url: payload.websiteUrl,
          booking_url: payload.bookingUrl,
        },
      });
    } catch (err) {
      console.warn('Auth user_metadata update note:', err);
    }

    // 4. Update Supabase public.profiles table
    try {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: payload.displayName,
            username: payload.username,
            avatar_url: avatarUrl,
            bio: payload.bio,
            looking_for: payload.lookingFor,
            twitter_url: payload.twitterUrl,
            linkedin_url: payload.linkedinUrl,
            website_url: payload.websiteUrl,
            booking_url: payload.bookingUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (upsertErr) {
        if (upsertErr.code === '23505' || upsertErr.message?.toLowerCase().includes('unique')) {
          setProfileError(`@${cleanUsername} is already taken. Please choose another.`);
          setIsSavingProfile(false);
          return;
        } else {
          setProfileError(upsertErr.message || 'Failed to update profile in database.');
          setIsSavingProfile(false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Could not update profiles table:', err);
      setProfileError(err?.message || 'Network error updating profile.');
      setIsSavingProfile(false);
      return;
    }

    playSound('success', soundEnabled);
    setIsSavingProfile(false);
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 3000);
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
        await Promise.all([
          supabase.from('products').delete().eq('submitted_by', user.id),
          supabase.from('submissions').delete().eq('submitted_by', user.id),
          supabase.from('user_drafts').delete().eq('user_id', user.id),
          supabase.from('upvotes').delete().eq('user_id', user.id),
          supabase.from('comments').delete().eq('user_email', user.email),
          supabase.from('profiles').delete().eq('id', user.id),
        ]).catch(() => { });
      }
    } catch (err) {
      console.warn('Account deletion fallback triggered:', err);
    }

    try {
      localStorage.removeItem(`topsaas_profile_${user.id}`);
      localStorage.removeItem(`topsaas_user_drafts_${user.id}`);
    } catch { }

    if (onSignOut) {
      await onSignOut();
    } else {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  useEffect(() => {
    // 1. Instant local cache load
    setDrafts(getUserDrafts(user.id));

    // 2. Background sync from Supabase user_drafts table
    let isMounted = true;
    fetchUserDraftsFromDb(user.id).then((synced) => {
      if (isMounted && synced && synced.length >= 0) {
        setDrafts(synced);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user.id]);

  const handleResumeDraft = (draft: LaunchDraft) => {
    playSound('click', soundEnabled);
    loadDraftIntoActive(draft);
    if (onOpenSubmit) {
      onOpenSubmit();
    } else {
      onBack();
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    if (window.confirm('Discard this saved launch draft?')) {
      playSound('click', soundEnabled);
      deleteLaunchDraft(draftId, user.id);
      setDrafts(getUserDrafts(user.id));
    }
  };

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'details' | 'media' | 'founder' | 'socials'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isAddingShots, setIsAddingShots] = useState(false);
  const [badgeProduct, setBadgeProduct] = useState<Product | null>(null);
  const [relaunchProduct, setRelaunchProduct] = useState<Product | null>(null);
  const [isRelaunching, setIsRelaunching] = useState(false);

  // Form State for editing
  const [editForm, setEditForm] = useState<{
    name: string;
    tagline: string;
    url: string;
    category: Category | string;
    categories: Category[];
    description: string;
    pricingModel: PricingModel | '';
    targetAudience: string;
    problemItSolves: string;
    solution: string;
    uniqueSellingPoint: string;
    logoUrl: string;
    screenshots: string[];
    demoVideoUrl: string;
    creatorName: string;
    creatorXHandle: string;
    creatorRole: string;
    creatorAvatar: string;
    twitter: string;
    linkedin: string;
    github: string;
    productHunt: string;
    discord: string;
    youtube: string;
    appStore: string;
    playStore: string;
    chromeWebStore: string;
    offerDiscount: string;
    offerCode: string;
    offerUrl: string;
    offerDetails: string;
  }>({
    name: '',
    tagline: '',
    url: '',
    category: 'AI Tools',
    categories: ['AI Tools'],
    description: '',
    pricingModel: '',
    targetAudience: '',
    problemItSolves: '',
    solution: '',
    uniqueSellingPoint: '',
    logoUrl: '',
    screenshots: [],
    demoVideoUrl: '',
    creatorName: '',
    creatorXHandle: '',
    creatorRole: '',
    creatorAvatar: '',
    twitter: '',
    linkedin: '',
    github: '',
    productHunt: '',
    discord: '',
    youtube: '',
    appStore: '',
    playStore: '',
    chromeWebStore: '',
    offerDiscount: '',
    offerCode: '',
    offerUrl: '',
    offerDetails: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const founderPhotoInputRef = useRef<HTMLInputElement>(null);
  const screenshotsInputRef = useRef<HTMLInputElement>(null);
  const [draggedScreenshotIndex, setDraggedScreenshotIndex] = useState<number | null>(null);
  const [dragOverScreenshotIndex, setDragOverScreenshotIndex] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      const userEmail = user.email?.trim().toLowerCase();

      // Filter matching submissions and products strictly belonging to THIS user
      const isUserMatch = (submittedBy?: string, backerEmail?: string) => {
        if (submittedBy && submittedBy === user.id) return true;
        if (backerEmail && userEmail && backerEmail.trim().toLowerCase() === userEmail) return true;
        return false;
      };

      const matchedLocalSubs = allSubmissions.filter((s) =>
        isUserMatch(s.submittedBy, s.backerEmail)
      );
      const matchedLocalProds = allProducts.filter((p) =>
        isUserMatch(p.submittedBy)
      );

      // Immediately render local matching data to avoid blank loading screen
      if (matchedLocalProds.length > 0 || matchedLocalSubs.length > 0) {
        setProducts(matchedLocalProds);
        setSubmissions(matchedLocalSubs);
        setLoading(false);
      }

      try {
        // Single consolidated submissions query with .or() to halve network request count
        const subFilter = user.email
          ? `submitted_by.eq.${user.id},backer_email.eq.${user.email.trim().toLowerCase()}`
          : `submitted_by.eq.${user.id}`;

        const [prodRes, subRes] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('submitted_by', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('submissions')
            .select('*')
            .or(subFilter)
            .order('submitted_at', { ascending: false }),
        ]);

        const dbProds = !prodRes.error && prodRes.data ? prodRes.data.map(mapDbProduct) : [];
        const dbSubs = !subRes.error && subRes.data ? subRes.data.map(mapDbSubmission) : [];

        if (isMounted) {
          const isDbAvailable = !prodRes.error && !subRes.error;
          if (isDbAvailable) {
            // Supabase Database is authoritative: only display user's records that actually exist in DB
            const combinedSubsMap = new Map<string, WebsiteSubmission>();
            dbSubs.forEach((s) => combinedSubsMap.set(s.id, s));

            const finalSubs = Array.from(combinedSubsMap.values())
              .filter((s) => isUserMatch(s.submittedBy, s.backerEmail))
              .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));

            // A listing is owned when its own submitted_by matches, or when it is the
            // published listing (`prod-<id>`) of one of this user's submissions
            const ownedSubmissionIds = new Set(finalSubs.map((s) => s.id));
            const finalProds = dbProds.filter(
              (p) =>
                isUserMatch(p.submittedBy) ||
                ownedSubmissionIds.has(p.id) ||
                ownedSubmissionIds.has(p.id.replace(/^prod-/, ''))
            );

            setProducts(finalProds);
            setSubmissions(finalSubs);
          } else {
            // Offline / error fallback only
            setProducts(matchedLocalProds);
            setSubmissions(matchedLocalSubs);
          }
        }
      } catch {
        if (isMounted) {
          setProducts(matchedLocalProds);
          setSubmissions(matchedLocalSubs);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.email]);

  const handleConfirmRelaunch = async () => {
    if (!relaunchProduct) return;
    setIsRelaunching(true);
    try {
      const updated: Product = {
        ...relaunchProduct,
        autoRelaunch: true,
        isRelaunched: true,
        lastRelaunchedAt: Date.now(),
      };
      await updateProductDirect(updated);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      onUpdateProduct?.(updated);
      playSound('success', soundEnabled);
      try {
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
      } catch { }
      setRelaunchProduct(null);
    } catch (err) {
      console.error('Relaunch failed:', err);
    } finally {
      setIsRelaunching(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Remove this product from the directory?')) return;
    setDeletingId(productId);
    playSound('click', soundEnabled);
    try {
      await supabase.from('products').delete().eq('id', productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      onDeleteProduct?.(productId);
    } catch { }
    setDeletingId(null);
  };

  const handleOpenEdit = (p: Product) => {
    playSound('click', soundEnabled);
    setEditingProduct(p);
    setActiveEditTab('details');
    setSaveSuccess(false);
    setEditError(null);

    const getSocial = (platform: SocialPlatform) =>
      p.socials?.find((s) => s.platform === platform)?.url || '';

    const rawCats = p.category ? p.category.split(',').map((s) => s.trim()).filter(Boolean) as Category[] : ['AI Tools'];

    setEditForm({
      name: p.name || '',
      tagline: p.tagline || '',
      url: p.url || '',
      category: p.category || 'AI Tools',
      categories: rawCats.length > 0 ? rawCats : ['AI Tools'],
      description: p.description || '',
      pricingModel: (p.pricingModel as PricingModel) || '',
      targetAudience: p.targetAudience || '',
      problemItSolves: p.problemItSolves || '',
      solution: p.solution || '',
      uniqueSellingPoint: p.uniqueSellingPoint || '',
      logoUrl: p.logoUrl || '',
      screenshots: Array.isArray(p.screenshots) ? [...p.screenshots] : [],
      demoVideoUrl: p.demoVideoUrl || '',
      creatorName: p.creatorName || '',
      creatorXHandle: p.creatorXHandle || '',
      creatorRole: p.creatorRole || '',
      creatorAvatar: p.creatorAvatar || '',
      twitter: p.twitterHandle || getSocial('x'),
      linkedin: getSocial('linkedin'),
      github: getSocial('github'),
      productHunt: getSocial('product_hunt'),
      discord: getSocial('discord'),
      youtube: getSocial('youtube') || getSocial('reddit'),
      appStore: getSocial('app_store'),
      playStore: getSocial('play_store'),
      chromeWebStore: getSocial('chrome_web_store'),
      offerDiscount: p.offerDiscount || '',
      offerCode: p.offerCode || '',
      offerUrl: p.offerUrl || '',
      offerDetails: p.offerDetails || '',
    });
  };

  const handleCloseEdit = () => {
    setEditingProduct(null);
    setSaveSuccess(false);
    setEditError(null);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    if (!editForm.name.trim()) {
      setEditError('Product name is required');
      return;
    }
    if (!editForm.tagline.trim()) {
      setEditError('Tagline is required');
      return;
    }
    if (!editForm.url.trim()) {
      setEditError('Website URL is required');
      return;
    }

    setIsSaving(true);
    setEditError(null);
    playSound('click', soundEnabled);

    const socials: ProductSocial[] = [];
    const cleanUrl = (raw: string) => {
      const v = raw.trim();
      if (!v) return '';
      return /^https?:\/\//i.test(v) ? v : `https://${v}`;
    };

    if (editForm.twitter.trim()) socials.push({ platform: 'x', url: cleanUrl(editForm.twitter) });
    if (editForm.linkedin.trim()) socials.push({ platform: 'linkedin', url: cleanUrl(editForm.linkedin) });
    if (editForm.github.trim()) socials.push({ platform: 'github', url: cleanUrl(editForm.github) });
    if (editForm.productHunt.trim()) socials.push({ platform: 'product_hunt', url: cleanUrl(editForm.productHunt) });
    if (editForm.discord.trim()) socials.push({ platform: 'discord', url: cleanUrl(editForm.discord) });
    if (editForm.youtube.trim()) socials.push({ platform: 'youtube', url: cleanUrl(editForm.youtube) });
    if (editForm.appStore.trim()) socials.push({ platform: 'app_store', url: cleanUrl(editForm.appStore) });
    if (editForm.playStore.trim()) socials.push({ platform: 'play_store', url: cleanUrl(editForm.playStore) });
    if (editForm.chromeWebStore.trim()) socials.push({ platform: 'chrome_web_store', url: cleanUrl(editForm.chromeWebStore) });

    const finalCategory = editForm.categories.length > 0 ? (editForm.categories.join(', ') as Category) : editForm.category;

    const updated: Product = {
      ...editingProduct,
      name: editForm.name.trim(),
      tagline: editForm.tagline.trim(),
      url: cleanUrl(editForm.url),
      category: finalCategory,
      description: prepareRichText(editForm.description) || undefined,
      problemItSolves: prepareRichText(editForm.problemItSolves) || undefined,
      solution: prepareRichText(editForm.solution) || undefined,
      uniqueSellingPoint: prepareRichText(editForm.uniqueSellingPoint) || undefined,
      pricingModel: editForm.pricingModel || undefined,
      targetAudience: editForm.targetAudience.trim() || undefined,
      logoUrl: editForm.logoUrl.trim() || undefined,
      screenshots: editForm.screenshots && editForm.screenshots.length > 0 ? editForm.screenshots : undefined,
      demoVideoUrl: editForm.demoVideoUrl.trim() || undefined,
      creatorName: editForm.creatorName.trim() || undefined,
      creatorXHandle: editForm.creatorXHandle.trim().replace(/^@/, '') || undefined,
      creatorRole: editForm.creatorRole.trim() || undefined,
      creatorAvatar: editForm.creatorAvatar.trim() || undefined,
      twitterHandle: editForm.twitter.trim().replace(/^@/, '') || undefined,
      socials: socials.length > 0 ? socials : undefined,
      offerDiscount: editForm.offerDiscount.trim() || undefined,
      offerCode: editForm.offerCode.trim() || undefined,
      offerUrl: editForm.offerUrl.trim() ? cleanUrl(editForm.offerUrl) : undefined,
      offerDetails: editForm.offerDetails.trim() || undefined,
      whatItDoes: (editForm.problemItSolves.trim() || editForm.solution.trim() || editForm.uniqueSellingPoint.trim()) ? [
        ...(editForm.problemItSolves.trim() ? [`Problem: ${editForm.problemItSolves.trim()}`] : []),
        ...(editForm.solution.trim() ? [`Solution: ${editForm.solution.trim()}`] : []),
        ...(editForm.uniqueSellingPoint.trim() ? [`Difference: ${editForm.uniqueSellingPoint.trim()}`] : [])
      ] : editingProduct.whatItDoes,
      features: (editForm.solution.trim() || editForm.uniqueSellingPoint.trim()) ? [
        ...(editForm.solution.trim() ? [{ title: 'Core Solution', description: editForm.solution.trim(), tag: 'Superpower' }] : []),
        ...(editForm.uniqueSellingPoint.trim() ? [{ title: 'Key Advantage', description: editForm.uniqueSellingPoint.trim(), tag: 'Differentiator' }] : []),
        ...(editForm.problemItSolves.trim() ? [{ title: 'Problem Solved', description: editForm.problemItSolves.trim(), tag: 'Value' }] : [])
      ] : editingProduct.features,
      updatedAt: Date.now(),
    };

    try {
      const ok = await updateProductDirect(updated);
      if (!ok) {
        setEditError('Could not save changes to the database. Please try again.');
        setIsSaving(false);
        return;
      }

      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      onUpdateProduct?.(updated);
      playSound('success', soundEnabled);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        handleCloseEdit();
      }, 900);
    } catch {
      setEditError('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, { maxSide: 256, format: 'image/png' });
      setEditForm((prev) => ({ ...prev, logoUrl: dataUrl }));
      playSound('click', soundEnabled);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not process logo');
    }
    e.target.value = '';
  };

  const handleFounderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, { maxSide: 256, format: 'image/jpeg', quality: 0.85 });
      setEditForm((prev) => ({ ...prev, creatorAvatar: dataUrl }));
      playSound('click', soundEnabled);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not process photo');
    }
    e.target.value = '';
  };

  const applyScreenshotFiles = async (files: FileList | File[]) => {
    const current = editForm.screenshots || [];
    const remaining = 4 - current.length;
    if (remaining <= 0) {
      setEditError('You can add up to 4 screenshots.');
      return;
    }
    setIsAddingShots(true);
    setEditError(null);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        try {
          const storageUrl = await uploadScreenshotToStorage(file, editForm.name || 'product');
          if (storageUrl) {
            added.push(storageUrl);
          } else {
            added.push(await processImageFile(file, { maxSide: 1280, format: 'image/jpeg', quality: 0.75 }));
          }
        } catch (err) {
          setEditError(err instanceof Error ? err.message : 'Could not process that screenshot.');
          break;
        }
      }
      if (added.length > 0) {
        setEditForm((prev) => ({
          ...prev,
          screenshots: [...(prev.screenshots || []), ...added].slice(0, 4),
        }));
        playSound('click', soundEnabled);
      }
    } finally {
      setIsAddingShots(false);
    }
  };

  const moveScreenshot = (fromIndex: number, toIndex: number) => {
    const current = editForm.screenshots || [];
    if (toIndex < 0 || toIndex >= current.length || fromIndex === toIndex) return;
    setEditForm((prev) => {
      const updated = [...(prev.screenshots || [])];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { ...prev, screenshots: updated };
    });
    playSound('click', soundEnabled);
  };

  const removeScreenshot = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      screenshots: (prev.screenshots || []).filter((_, i) => i !== index),
    }));
    playSound('click', soundEnabled);
  };

  const inputClass =
    'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors';
  const labelClass = 'mb-1 block text-[11px] font-bold text-neutral-700';

  const liveCount = products.length;
  const pendingSubmissions = submissions.filter((s) => s.status === 'under_review');

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-black text-neutral-950 flex-1 truncate">My Products</h1>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-3.5 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* User Info Card (the way it was before) */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {avatarUrl || user.user_metadata?.avatar_url ? (
              <img
                src={avatarUrl || user.user_metadata?.avatar_url}
                alt={displayName || user.user_metadata?.full_name || 'User'}
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-neutral-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-mint-500 text-white text-base sm:text-lg font-black shadow-xs shrink-0">
                {(displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5 min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-black text-neutral-950 truncate">
                {displayName || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-400 min-w-0 truncate">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-neutral-500">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Quick Filter */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              setActiveProfileTab('live');
            }}
            className={`rounded-xl border p-2.5 sm:p-3.5 text-center transition-all cursor-pointer min-w-0 ${activeProfileTab === 'live'
              ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
              : 'border-neutral-200 bg-white text-neutral-950 hover:border-neutral-300'
              }`}
          >
            <div className={`text-lg sm:text-xl font-black ${activeProfileTab === 'live' ? 'text-white' : 'text-neutral-950'}`}>
              {liveCount}
            </div>
            <div className={`text-[10px] sm:text-[11px] font-bold truncate ${activeProfileTab === 'live' ? 'text-neutral-300' : 'text-neutral-500'}`}>
              Live Products
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              setActiveProfileTab('drafts');
            }}
            className={`rounded-xl border p-2.5 sm:p-3.5 text-center transition-all cursor-pointer min-w-0 ${activeProfileTab === 'drafts'
              ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
              : 'border-neutral-200 bg-white text-blue-600 hover:border-blue-300'
              }`}
          >
            <div className={`text-lg sm:text-xl font-black ${activeProfileTab === 'drafts' ? 'text-white' : 'text-blue-600'}`}>
              {drafts.length}
            </div>
            <div className={`text-[10px] sm:text-[11px] font-bold truncate ${activeProfileTab === 'drafts' ? 'text-blue-100' : 'text-neutral-500'}`}>
              Saved Drafts
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              setActiveProfileTab('pending');
            }}
            className={`rounded-xl border p-2.5 sm:p-3.5 text-center transition-all cursor-pointer min-w-0 ${activeProfileTab === 'pending'
              ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
              : 'border-neutral-200 bg-white text-amber-600 hover:border-amber-300'
              }`}
          >
            <div className={`text-lg sm:text-xl font-black ${activeProfileTab === 'pending' ? 'text-white' : 'text-amber-600'}`}>
              {pendingSubmissions.length}
            </div>
            <div className={`text-[10px] sm:text-[11px] font-bold truncate ${activeProfileTab === 'pending' ? 'text-amber-100' : 'text-neutral-500'}`}>
              Pending Approval
            </div>
          </button>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="border-b border-neutral-200 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5">
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveProfileTab('live');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${activeProfileTab === 'live'
                  ? 'border-neutral-950 text-neutral-950 font-black'
                  : 'border-transparent text-neutral-500 hover:text-neutral-950'
                  }`}
              >
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span>Live Products</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeProfileTab === 'live'
                    ? 'bg-neutral-950 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                    }`}
                >
                  {products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveProfileTab('drafts');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${activeProfileTab === 'drafts'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-neutral-500 hover:text-neutral-950'
                  }`}
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span>Drafts</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeProfileTab === 'drafts'
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                    }`}
                >
                  {drafts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveProfileTab('pending');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${activeProfileTab === 'pending'
                  ? 'border-amber-600 text-amber-600 font-black'
                  : 'border-transparent text-neutral-500 hover:text-neutral-950'
                  }`}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>Pending</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeProfileTab === 'pending'
                    ? 'bg-amber-600 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                    }`}
                >
                  {pendingSubmissions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setActiveProfileTab('profile');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap shrink-0 ${activeProfileTab === 'profile'
                  ? 'border-neutral-950 text-neutral-950 font-black'
                  : 'border-transparent text-neutral-500 hover:text-neutral-950'
                  }`}
              >
                <UserIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Profile</span>
              </button>
            </div>

            {onOpenSubmit && (
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  onOpenSubmit();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs mb-1 shrink-0 whitespace-nowrap ml-2"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                <span className="hidden sm:inline">Launch New SaaS</span>
                <span className="sm:hidden">Launch</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content: Live Products */}
        {activeProfileTab === 'live' && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 text-center">
                <Globe className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
                <p className="text-sm font-bold text-neutral-800">No live products yet</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  {pendingSubmissions.length > 0
                    ? 'Your submission is pending approval and will appear here once approved.'
                    : 'Submit your SaaS to the directory and start getting discoverability and traffic.'}
                </p>
                {onOpenSubmit && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onOpenSubmit();
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-neutral-950 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Launch Your SaaS
                  </button>
                )}
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-xs hover:border-neutral-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <ProductLogo
                        src={product.logoUrl || getWebsiteFavicon(product.url)}
                        alt={product.name}
                        containerClassName="relative h-11 w-11 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 flex items-center justify-center shadow-2xs"
                        iconClassName="h-5 w-5 text-neutral-500 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <h4
                            onClick={() => {
                              playSound('click', soundEnabled);
                              if (onSelectProduct) onSelectProduct(product);
                            }}
                            className="text-sm font-black text-neutral-950 truncate hover:text-mint-600 hover:underline cursor-pointer transition-colors"
                            title="Click to view details"
                          >
                            {product.name}
                          </h4>
                          <span className="text-[9px] font-bold text-mint-600 bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.5 rounded shrink-0">
                            Live
                          </span>
                          {product.autoRelaunch && !product.isSponsored && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                              <span>🚀</span>
                              <span>Weekly Relaunch Active</span>
                            </span>
                          )}
                          {product.isSponsored && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-neutral-800 bg-neutral-100 border border-neutral-300 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                              <span>Sponsor Rails</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{product.tagline}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                            <Globe className="h-2.5 w-2.5" />
                            {product.category}
                          </span>
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-500 hover:text-neutral-950 transition-colors"
                          >
                            Visit
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Relaunch, Embed Badge, Edit & Delete */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t border-neutral-100 sm:border-t-0 justify-end">
                      {!product.autoRelaunch && (
                        <button
                          type="button"
                          onClick={() => {
                            playSound('click', soundEnabled);
                            setRelaunchProduct(product);
                          }}
                          className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-2xs"
                          title="Relaunch into active weekly round ($5)"
                        >
                          <span>🚀</span>
                          <span>Relaunch ($5)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click', soundEnabled);
                          setBadgeProduct(product);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1.5 text-xs font-bold text-mint-600 hover:border-mint-500/60 hover:text-mint-700 transition-all cursor-pointer"
                        title="Get Embeddable Badge"
                      >
                        <Code2 className="h-3 w-3 text-mint-600" />
                        <span>Badge</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(product)}
                        className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100 px-2.5 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs"
                        title="Edit project"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        title="Remove product"
                      >
                        {deletingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Saved Drafts */}
        {activeProfileTab === 'drafts' && (
          <div className="space-y-3">
            {drafts.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 text-center">
                <FileText className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
                <p className="text-sm font-bold text-neutral-800">No saved drafts</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  When you start submitting a SaaS, your progress is automatically saved so you can continue anytime.
                </p>
                {onOpenSubmit && (
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      onOpenSubmit();
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Start New Launch
                  </button>
                )}
              </div>
            ) : (
              drafts.map((draft) => {
                const stepLabels = [
                  'Step 1 • Basics',
                  'Step 2 • Details',
                  'Step 3 • Media',
                  'Step 4 • Launch & Extras',
                  'Step 5 • Review',
                ];
                const stepLabel = stepLabels[draft.step] || `Step ${draft.step + 1}`;
                const hasName = Boolean(draft.name?.trim());
                const displayName = hasName
                  ? draft.name
                  : draft.url
                    ? draft.url.replace(/^https?:\/\//i, '').split('/')[0]
                    : 'Untitled SaaS Launch';

                return (
                  <div
                    key={draft.id}
                    className="rounded-xl border border-blue-200 bg-white p-4 shadow-xs hover:border-blue-300 transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <ProductLogo
                        src={draft.logoDataUrl || (draft.url ? getWebsiteFavicon(draft.url) : '')}
                        alt={displayName}
                        containerClassName="relative h-11 w-11 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-center shadow-2xs"
                        iconClassName="h-5 w-5 text-neutral-400 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            onClick={() => handleResumeDraft(draft)}
                            className="text-sm font-black text-neutral-950 truncate hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                            title="Click to resume launch draft"
                          >
                            {displayName}
                          </h4>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Sparkles className="h-2.5 w-2.5" />
                            {stepLabel}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {draft.tagline || (draft.url ? draft.url : 'Launch draft in progress — resume to complete and submit')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {draft.category && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                              <Globe className="h-2.5 w-2.5" />
                              {draft.category}
                            </span>
                          )}
                          <span className="text-[10px] text-neutral-400">
                            Saved {formatDraftTime(draft.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={() => handleDeleteDraft(draft.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Discard</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResumeDraft(draft)}
                        className="btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
                      >
                        <span>Continue Launch</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab Content: Pending Approval */}
        {activeProfileTab === 'pending' && (
          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 text-center">
                <Clock className="mx-auto h-8 w-8 text-neutral-400 mb-3" />
                <p className="text-sm font-bold text-neutral-800">No pending submissions</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  You don't have any SaaS submissions currently awaiting review.
                </p>
              </div>
            ) : (
              pendingSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-amber-500/30 bg-white p-3.5 sm:p-4 shadow-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <ProductLogo
                      src={sub.logoUrl || getWebsiteFavicon(sub.url)}
                      alt={sub.name}
                      containerClassName="relative h-11 w-11 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 flex items-center justify-center shadow-2xs"
                      iconClassName="h-5 w-5 text-neutral-500 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <h4
                          onClick={() => {
                            playSound('click', soundEnabled);
                            if (onSelectProduct) onSelectProduct(submissionToProduct(sub));
                          }}
                          className="text-sm font-black text-neutral-950 truncate hover:text-amber-600 hover:underline cursor-pointer transition-colors"
                          title="Click to view details"
                        >
                          {sub.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5 animate-pulse" />
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate mt-0.5">{sub.tagline}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                          <Globe className="h-2.5 w-2.5" />
                          {sub.category}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Content: Profile Settings */}
        {activeProfileTab === 'profile' && (
          <div className="space-y-6">
            {/* 1. Main Profile Form Card (matching user design) */}
            <form onSubmit={handleSaveProfile} className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
              {profileError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-semibold shadow-2xs">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Profile Picture / Avatar */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-800">
                  Profile picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group shrink-0">
                    {avatarUrl || user.user_metadata?.avatar_url ? (
                      <img
                        src={avatarUrl || user.user_metadata?.avatar_url}
                        alt={displayName || 'User'}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-neutral-200 shadow-2xs"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-500 text-white text-xl font-black shadow-2xs">
                        {(displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarFileChange}
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="btn-secondary px-3.5 py-1.5 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{avatarUrl ? 'Change photo' : 'Upload photo'}</span>
                      </button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Square JPG, PNG, or WebP up to 5MB. Uploads directly to your public profile.
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 shadow-2xs transition-all"
                />
              </div>

              {/* Founder Bio Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-neutral-800">
                    Founder bio
                  </label>
                  <span className="text-[11px] font-medium text-neutral-400">
                    {bio.length}/280
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 280))}
                  placeholder="What are you building and who is it for?"
                  rows={3}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 shadow-2xs resize-none transition-all"
                />
              </div>

              {/* 2x2 Links Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    Twitter / X URL
                  </label>
                  <input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    placeholder="https://twitter.com/you"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 shadow-2xs transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/you"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 shadow-2xs transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://www.myshipos.com/"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 shadow-2xs transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-800">
                    Contact / booking URL
                  </label>
                  <input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="https://calendly.com/you"
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-mint-500 focus:ring-2 focus:ring-mint-500/20 shadow-2xs transition-all"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-3 border-t border-neutral-100 flex items-center">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="btn-primary px-6 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : profileSaveSuccess ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      <span>Save profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Delete Account Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200/80 shadow-2xs">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="text-sm font-black text-neutral-950">Delete Account</h3>
              </div>
              <div className="space-y-3 pl-9.5">
                <p className="text-xs text-neutral-600">
                  Permanently delete your TopSAAS account, your listings and your profile. This can't be undone.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer shadow-2xs"
                  >
                    Delete my account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Product Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-200 bg-neutral-100 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white">
                  <Pencil className="h-4 w-4 text-mint-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-950">Edit {editingProduct.name}</h3>
                  <p className="text-[11px] font-medium text-neutral-500">Update your project details and media</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-950 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Edit Tabs */}
            <div className="flex items-center gap-1 border-b border-neutral-200 px-5 pt-2 bg-white/50 overflow-x-auto">
              {(
                [
                  { id: 'details', label: 'Basic Info' },
                  { id: 'media', label: 'Media & Video' },
                  { id: 'founder', label: 'Founder Profile' },
                  { id: 'socials', label: 'Social Links' },
                ] as const
              ).map((tab) => {
                const active = activeEditTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      setActiveEditTab(tab.id);
                    }}
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${active
                      ? 'border-mint-500 text-neutral-950'
                      : 'border-transparent text-neutral-500 hover:text-neutral-950'
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {editError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                  {editError}
                </div>
              )}

              {/* Tab 1: Basic Info */}
              {activeEditTab === 'details' && (
                <div className="space-y-3.5">
                  <div>
                    <label className={labelClass}>
                      Product Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. TopSAAS"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Tagline <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={editForm.tagline}
                      onChange={(e) => setEditForm((p) => ({ ...p, tagline: e.target.value }))}
                      className={inputClass}
                      placeholder="One-line elevator pitch"
                    />
                  </div>

                  {/* Multi-Category Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelClass}>Categories</label>
                      <span className="font-mono-num text-[11px] font-bold text-neutral-400 bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                        {editForm.categories.length}/3 selected
                      </span>
                    </div>

                    {/* Selected Categories */}
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2.5 rounded-xl border border-neutral-200 bg-white">
                      {editForm.categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500/15 border border-mint-500/40 px-2.5 py-1 text-xs font-bold text-mint-700"
                        >
                          <span>{cat}</span>
                          <button
                            type="button"
                            onClick={() => {
                              playSound('click', soundEnabled);
                              const next = editForm.categories.filter((c) => c !== cat);
                              if (next.length > 0) {
                                setEditForm((p) => ({ ...p, categories: next, category: next.join(', ') }));
                              }
                            }}
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-mint-500/30 text-mint-600 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Category Buttons */}
                    <div className="max-h-36 overflow-y-auto p-1.5 rounded-xl border border-neutral-200 bg-neutral-100 flex flex-wrap gap-1.5">
                      {SUBMISSION_CATEGORIES.map((cat) => {
                        const active = editForm.categories.includes(cat);
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              playSound('click', soundEnabled);
                              setEditForm((p) => {
                                const exists = p.categories.includes(cat);
                                let next: Category[];
                                if (exists) {
                                  if (p.categories.length === 1) return p; // keep at least 1
                                  next = p.categories.filter((c) => c !== cat);
                                } else {
                                  if (p.categories.length >= 3) return p;
                                  next = [...p.categories, cat];
                                }
                                return { ...p, categories: next, category: next.join(', ') };
                              });
                            }}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${active
                              ? 'bg-mint-500/20 text-mint-700 border border-mint-500/50'
                              : 'bg-white text-neutral-600 border border-neutral-200 hover:text-neutral-950 hover:border-neutral-300'
                              }`}
                          >
                            {active ? `✓ ${cat}` : `+ ${cat}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Pricing Model</label>
                    <select
                      value={editForm.pricingModel}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, pricingModel: e.target.value as PricingModel | '' }))
                      }
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">Select pricing...</option>
                      {PRICING_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Website URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      value={editForm.url}
                      onChange={(e) => setEditForm((p) => ({ ...p, url: e.target.value }))}
                      className={inputClass}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Target Audience</label>
                    <input
                      type="text"
                      value={editForm.targetAudience}
                      onChange={(e) => setEditForm((p) => ({ ...p, targetAudience: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. Solo developers, founders, marketing agencies"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Description / Overview</label>
                    <RichTextEditor
                      value={editForm.description}
                      onChange={(html) => setEditForm((p) => ({ ...p, description: html }))}
                      placeholder="Tell visitors what your product does and how it helps them."
                      maxLength={2000}
                      minHeightClass="min-h-[110px]"
                      ariaLabel="Description / Overview"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Problem It Solves</label>
                    <RichTextEditor
                      value={editForm.problemItSolves}
                      onChange={(html) => setEditForm((p) => ({ ...p, problemItSolves: html }))}
                      placeholder="What pain point does it address?"
                      maxLength={600}
                      minHeightClass="min-h-[80px]"
                      ariaLabel="Problem It Solves"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Your Solution</label>
                    <RichTextEditor
                      value={editForm.solution}
                      onChange={(html) => setEditForm((p) => ({ ...p, solution: html }))}
                      placeholder="How does it solve that problem?"
                      maxLength={600}
                      minHeightClass="min-h-[80px]"
                      ariaLabel="Your Solution"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>What Makes It Different</label>
                    <RichTextEditor
                      value={editForm.uniqueSellingPoint}
                      onChange={(html) => setEditForm((p) => ({ ...p, uniqueSellingPoint: html }))}
                      placeholder="What sets it apart from alternatives?"
                      maxLength={600}
                      minHeightClass="min-h-[80px]"
                      ariaLabel="What Makes It Different"
                    />
                  </div>

                  {/* Special Offer & Discount */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-950">Special Offer / Viewer Discount</span>
                        <span className="rounded bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.2 text-[9px] font-bold text-mint-600">
                          Optional
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelClass}>Discount Text / Amount</label>
                        <input
                          type="text"
                          value={editForm.offerDiscount}
                          onChange={(e) => setEditForm((p) => ({ ...p, offerDiscount: e.target.value }))}
                          className={inputClass}
                          placeholder="e.g. 20% OFF or 50% Lifetime"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Promo / Coupon Code</label>
                        <input
                          type="text"
                          value={editForm.offerCode}
                          onChange={(e) => setEditForm((p) => ({ ...p, offerCode: e.target.value.toUpperCase() }))}
                          className={`${inputClass} font-mono`}
                          placeholder="e.g. TOPSAAS20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className={labelClass}>Offer Redemption Link</label>
                        <input
                          type="url"
                          value={editForm.offerUrl}
                          onChange={(e) => setEditForm((p) => ({ ...p, offerUrl: e.target.value }))}
                          className={inputClass}
                          placeholder="https://yourwebsite.com/deal"
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Offer Details / Terms</label>
                        <input
                          type="text"
                          value={editForm.offerDetails}
                          onChange={(e) => setEditForm((p) => ({ ...p, offerDetails: e.target.value }))}
                          className={inputClass}
                          placeholder="e.g. Valid on annual plans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Media & Video */}
              {activeEditTab === 'media' && (
                <div className="space-y-4">
                  {/* Feature Screenshots Gallery Section */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-neutral-950 flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5 text-mint-600" />
                          <span>Feature Screenshots</span>
                        </label>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Upload up to 4 screenshots. Drag to reorder or use the arrow buttons. The first image (#1) is your primary listing cover.
                        </p>
                      </div>
                      <span className="font-mono-num text-[11px] font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200 shrink-0">
                        {editForm.screenshots.length}/4
                      </span>
                    </div>

                    {/* Screenshots Grid with Reordering */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {editForm.screenshots.map((src, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === editForm.screenshots.length - 1;
                        const isDragging = draggedScreenshotIndex === idx;
                        const isDragOver = dragOverScreenshotIndex === idx;

                        return (
                          <div
                            key={idx}
                            draggable
                            onDragStart={(e) => {
                              setDraggedScreenshotIndex(idx);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', String(idx));
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverScreenshotIndex !== idx) {
                                setDragOverScreenshotIndex(idx);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedScreenshotIndex !== null && draggedScreenshotIndex !== idx) {
                                moveScreenshot(draggedScreenshotIndex, idx);
                              }
                              setDraggedScreenshotIndex(null);
                              setDragOverScreenshotIndex(null);
                            }}
                            onDragEnd={() => {
                              setDraggedScreenshotIndex(null);
                              setDragOverScreenshotIndex(null);
                            }}
                            className={`group relative aspect-video overflow-hidden rounded-xl border bg-neutral-900 shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing ${isDragOver
                              ? 'border-mint-500 ring-2 ring-mint-500/50 scale-[1.02] z-10'
                              : isDragging
                                ? 'opacity-40 border-neutral-500'
                                : isFirst
                                  ? 'border-mint-500/60 hover:border-mint-500'
                                  : 'border-neutral-200 hover:border-neutral-400'
                              }`}
                          >
                            <img
                              src={src}
                              alt={`Screenshot ${idx + 1}`}
                              className="h-full w-full object-cover pointer-events-none select-none"
                            />

                            {/* Order / Cover Badge */}
                            <div className="absolute left-2 top-2 z-10">
                              {isFirst ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-mint-500 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                                  <Star className="h-3 w-3 fill-white" />
                                  <span>#1 Cover</span>
                                </span>
                              ) : (
                                <span className="rounded-md bg-black/80 backdrop-blur-xs border border-white/20 px-1.5 py-0.5 text-[10px] font-mono font-bold text-white shadow-md">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Delete Button (Top Right) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeScreenshot(idx);
                              }}
                              aria-label={`Remove screenshot ${idx + 1}`}
                              className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-black/80 text-neutral-300 hover:bg-red-600 hover:text-white border border-white/20 hover:border-red-500 transition-all cursor-pointer shadow-md opacity-90 group-hover:opacity-100"
                              title="Delete screenshot"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>

                            {/* Bottom Overlay Controls: Move Left, Make Cover, Move Right */}
                            <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                              {/* Move Left Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveScreenshot(idx, idx - 1);
                                }}
                                disabled={isFirst}
                                aria-label="Move left"
                                className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/90 border border-white/20 text-white hover:bg-mint-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Move earlier in gallery"
                              >
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>

                              {/* Quick 'Set as Cover' button for non-cover images */}
                              {!isFirst && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveScreenshot(idx, 0);
                                  }}
                                  className="rounded-md bg-neutral-800/90 border border-white/20 px-2 py-0.5 text-[9px] font-bold text-neutral-200 hover:text-mint-400 hover:border-mint-500/60 transition-all cursor-pointer"
                                  title="Set this screenshot as main cover (#1)"
                                >
                                  Set as Cover
                                </button>
                              )}

                              {/* Move Right Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveScreenshot(idx, idx + 1);
                                }}
                                disabled={isLast}
                                aria-label="Move right"
                                className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-800/90 border border-white/20 text-white hover:bg-mint-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Move later in gallery"
                              >
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {editForm.screenshots.length < 4 && (
                        <button
                          type="button"
                          onClick={() => screenshotsInputRef.current?.click()}
                          disabled={isAddingShots}
                          className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-950 disabled:opacity-60"
                        >
                          {isAddingShots ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-mint-600" />
                              <span className="text-[10px] font-bold">Processing...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              <span className="text-[10px] font-bold">Add screenshot</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <input
                      ref={screenshotsInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) applyScreenshotFiles(files);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* Logo Section */}
                  <div>
                    <label className={labelClass}>Product Logo</label>
                    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3.5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-inner">
                        {editForm.logoUrl ? (
                          <img
                            src={editForm.logoUrl}
                            alt="Logo preview"
                            className="h-full w-full object-contain p-1"
                          />
                        ) : editForm.url || editingProduct?.url ? (
                          <img
                            src={getWebsiteFavicon(editForm.url || editingProduct?.url || '', 128)}
                            alt="Website favicon"
                            className="h-full w-full object-contain p-2"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Globe className="h-7 w-7 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-950">
                          {editForm.logoUrl ? 'Custom uploaded logo' : 'Website favicon icon'}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 mb-2.5">
                          {editForm.logoUrl
                            ? 'Custom logo is active for this product'
                            : 'Automatically grabbed from your website domain'}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>{editForm.logoUrl ? 'Change Logo' : 'Upload Custom Logo'}</span>
                          </button>
                          {editForm.logoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((p) => ({ ...p, logoUrl: '' }));
                                playSound('click', soundEnabled);
                              }}
                              className="text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors px-2 py-1"
                            >
                              Reset to Favicon
                            </button>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Demo Video URL */}
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5 text-mint-600" />
                        <span>Demo Video URL (YouTube, Loom, Vimeo, MP4)</span>
                      </span>
                    </label>
                    <input
                      type="url"
                      value={editForm.demoVideoUrl}
                      onChange={(e) => setEditForm((p) => ({ ...p, demoVideoUrl: e.target.value }))}
                      className={inputClass}
                      placeholder="https://www.youtube.com/watch?v=... or Loom / Vimeo link"
                    />
                    <p className="mt-1 text-[10px] text-neutral-500">
                      Renders an embedded interactive video player on your product details page.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 3: Founder Profile */}
              {activeEditTab === 'founder' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Founder / Maker Name</label>
                      <input
                        type="text"
                        value={editForm.creatorName}
                        onChange={(e) => setEditForm((p) => ({ ...p, creatorName: e.target.value }))}
                        className={inputClass}
                        placeholder="e.g. Alex River"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Personal X (Twitter) Handle</label>
                      <input
                        type="text"
                        value={editForm.creatorXHandle}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            creatorXHandle: e.target.value.startsWith('@')
                              ? e.target.value
                              : `@${e.target.value}`,
                          }))
                        }
                        className={inputClass}
                        placeholder="@alexriver"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Role / Title</label>
                    <input
                      type="text"
                      value={editForm.creatorRole}
                      onChange={(e) => setEditForm((p) => ({ ...p, creatorRole: e.target.value }))}
                      className={inputClass}
                      placeholder="e.g. Founder & CEO, Indie Maker"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Founder Photo</label>
                    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-3.5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 shadow-inner">
                        {editForm.creatorAvatar ? (
                          <img
                            src={editForm.creatorAvatar}
                            alt="Founder photo"
                            className="h-full w-full object-cover"
                          />
                        ) : user?.user_metadata?.avatar_url ? (
                          <img
                            src={user.user_metadata.avatar_url}
                            alt="Google account photo"
                            className="h-full w-full object-cover"
                          />
                        ) : editForm.creatorName ? (
                          <span className="text-base font-bold text-neutral-500">
                            {editForm.creatorName.charAt(0)}
                          </span>
                        ) : (
                          <UserIcon className="h-6 w-6 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-neutral-950">
                          {editForm.creatorAvatar
                            ? 'Custom founder photo'
                            : user?.user_metadata?.avatar_url
                              ? 'Account profile photo'
                              : 'No photo selected'}
                        </p>
                        <p className="text-[11px] text-neutral-500 mt-0.5 mb-2.5">
                          Displayed next to your maker badge & product comments
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => founderPhotoInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-200 transition-colors cursor-pointer"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>{editForm.creatorAvatar ? 'Change Photo' : 'Upload Photo'}</span>
                          </button>
                          {user?.user_metadata?.avatar_url && editForm.creatorAvatar !== user.user_metadata.avatar_url && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((p) => ({ ...p, creatorAvatar: user.user_metadata.avatar_url }));
                                playSound('click', soundEnabled);
                              }}
                              className="text-xs font-semibold text-neutral-500 hover:text-neutral-950 transition-colors px-2 py-1"
                            >
                              Use Google Photo
                            </button>
                          )}
                          {editForm.creatorAvatar && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((p) => ({ ...p, creatorAvatar: '' }));
                                playSound('click', soundEnabled);
                              }}
                              className="text-xs font-semibold text-neutral-400 hover:text-red-400 transition-colors px-2 py-1"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                        <input
                          ref={founderPhotoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFounderPhotoUpload}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Social Links */}
              {activeEditTab === 'socials' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>X (Twitter) URL</label>
                    <input
                      type="text"
                      value={editForm.twitter}
                      onChange={(e) => setEditForm((p) => ({ ...p, twitter: e.target.value }))}
                      className={inputClass}
                      placeholder="https://x.com/yourproduct"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>LinkedIn URL</label>
                    <input
                      type="text"
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm((p) => ({ ...p, linkedin: e.target.value }))}
                      className={inputClass}
                      placeholder="https://linkedin.com/company/..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>GitHub URL</label>
                    <input
                      type="text"
                      value={editForm.github}
                      onChange={(e) => setEditForm((p) => ({ ...p, github: e.target.value }))}
                      className={inputClass}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Product Hunt URL</label>
                    <input
                      type="text"
                      value={editForm.productHunt}
                      onChange={(e) => setEditForm((p) => ({ ...p, productHunt: e.target.value }))}
                      className={inputClass}
                      placeholder="https://producthunt.com/posts/..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Discord URL</label>
                    <input
                      type="text"
                      value={editForm.discord}
                      onChange={(e) => setEditForm((p) => ({ ...p, discord: e.target.value }))}
                      className={inputClass}
                      placeholder="https://discord.gg/..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>YouTube URL</label>
                    <input
                      type="text"
                      value={editForm.youtube}
                      onChange={(e) => setEditForm((p) => ({ ...p, youtube: e.target.value }))}
                      className={inputClass}
                      placeholder="https://youtube.com/@channel or video"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Apple App Store URL</label>
                    <input
                      type="text"
                      value={editForm.appStore}
                      onChange={(e) => setEditForm((p) => ({ ...p, appStore: e.target.value }))}
                      className={inputClass}
                      placeholder="https://apps.apple.com/..."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Google Play Store URL</label>
                    <input
                      type="text"
                      value={editForm.playStore}
                      onChange={(e) => setEditForm((p) => ({ ...p, playStore: e.target.value }))}
                      className={inputClass}
                      placeholder="https://play.google.com/..."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Chrome Web Store URL</label>
                    <input
                      type="text"
                      value={editForm.chromeWebStore}
                      onChange={(e) => setEditForm((p) => ({ ...p, chromeWebStore: e.target.value }))}
                      className={inputClass}
                      placeholder="https://chromewebstore.google.com/detail/..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-3.5 bg-white">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="rounded-xl border border-neutral-200 bg-transparent px-4 py-2 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer shadow-md ${saveSuccess
                  ? 'bg-mint-500 text-white'
                  : 'bg-neutral-950 text-white hover:bg-neutral-800'
                  }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Founder Badge Modal */}
      {badgeProduct && (
        <EmbedBadgeModal
          isOpen={!!badgeProduct}
          onClose={() => setBadgeProduct(null)}
          product={badgeProduct}
          soundEnabled={soundEnabled}
        />
      )}

      {/* ── Weekly Relaunch Modal ── */}
      {relaunchProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setRelaunchProduct(null);
              }}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <ProductLogo
                src={relaunchProduct.logoUrl || getWebsiteFavicon(relaunchProduct.url)}
                alt={relaunchProduct.name}
                containerClassName="h-12 w-12 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 shrink-0 flex items-center justify-center shadow-xs"
                iconClassName="h-6 w-6 text-neutral-400 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 mb-1">
                  <span>🚀</span> Weekly Relaunch
                </span>
                <h3 className="text-base font-black text-neutral-950 truncate">
                  Relaunch {relaunchProduct.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                  {relaunchProduct.tagline}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-neutral-700">Relaunch Upgrade</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-neutral-950">$5</span>
                  <span className="text-xs font-semibold text-neutral-500">/ month</span>
                </div>
              </div>
              <ul className="space-y-2 text-xs text-neutral-700 pt-1 border-t border-blue-200/60">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Automatically enters every active weekly voting round</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Featured <span className="font-bold text-blue-700">🚀 Relaunched</span> badge on directory card</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Reach fresh homepage visitors & early adopters weekly</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  setRelaunchProduct(null);
                }}
                className="btn-secondary px-4 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRelaunch}
                disabled={isRelaunching}
                className="btn-primary bg-blue-600 hover:bg-blue-500 shadow-blue-500/25 px-5 py-2.5 text-xs font-black"
              >
                {isRelaunching ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Relaunching…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span>🚀</span>
                    <span>Confirm & Relaunch ($5)</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Delete Account Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-950">Delete Account?</h3>
                <p className="text-xs text-neutral-500">This action is permanent and cannot be reversed.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed bg-red-50/60 border border-red-200/60 rounded-xl p-3">
              Are you sure you want to permanently delete your account? All your live SaaS listings ({liveCount}), in-progress launch drafts ({drafts.length}), and profile data will be permanently erased.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Yes, delete my account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
