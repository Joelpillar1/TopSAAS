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
  Clock
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Category, PricingModel, Product, ProductSocial, SocialPlatform, WebsiteSubmission } from '../types';
import { getWebsiteFavicon } from '../utils/logo';
import { mapDbProduct, mapDbSubmission, updateProductDirect } from '../utils/db';
import { SUBMISSION_CATEGORIES } from './BidModal';
import { ProductLogo } from './ProductLogo';
import { playSound } from '../utils/sound';

interface ProfilePageProps {
  user: User;
  allProducts?: Product[];
  allSubmissions?: WebsiteSubmission[];
  onBack: () => void;
  onSignOut?: () => void;
  onDeleteProduct?: (productId: string) => void;
  onUpdateProduct?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  soundEnabled?: boolean;
}

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
  onDeleteProduct,
  onUpdateProduct,
  onSelectProduct,
  soundEnabled = true,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [submissions, setSubmissions] = useState<WebsiteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<'details' | 'media' | 'founder' | 'socials'>('details');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isAddingShots, setIsAddingShots] = useState(false);

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

      try {
        const [prodRes, subResById, subResByEmail] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('submitted_by', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('submissions')
            .select('*')
            .eq('submitted_by', user.id)
            .order('submitted_at', { ascending: false }),
          user.email
            ? supabase
                .from('submissions')
                .select('*')
                .eq('backer_email', user.email)
                .order('submitted_at', { ascending: false })
            : Promise.resolve({ data: null, error: null }),
        ]);

        const dbProds = !prodRes.error && prodRes.data ? prodRes.data.map(mapDbProduct) : [];
        const dbSubs1 = !subResById.error && subResById.data ? subResById.data.map(mapDbSubmission) : [];
        const dbSubs2 = !subResByEmail.error && subResByEmail.data ? subResByEmail.data.map(mapDbSubmission) : [];

        if (isMounted) {
          const isDbAvailable = !prodRes.error && !subResById.error;
          if (isDbAvailable) {
            // Supabase Database is authoritative: only display user's records that actually exist in DB
            const combinedSubsMap = new Map<string, WebsiteSubmission>();
            dbSubs1.forEach((s) => combinedSubsMap.set(s.id, s));
            dbSubs2.forEach((s) => combinedSubsMap.set(s.id, s));

            const finalSubs = Array.from(combinedSubsMap.values())
              .filter((s) => isUserMatch(s.submittedBy, s.backerEmail))
              .sort((a, b) => (b.submittedAt ?? 0) - (a.submittedAt ?? 0));

            const finalProds = dbProds.filter((p) => isUserMatch(p.submittedBy));

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
  }, [user.id, user.email, allProducts, allSubmissions]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Remove this product from the directory?')) return;
    setDeletingId(productId);
    playSound('click', soundEnabled);
    try {
      await supabase.from('products').delete().eq('id', productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      onDeleteProduct?.(productId);
    } catch {}
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
      description: editForm.description.trim() || undefined,
      problemItSolves: editForm.problemItSolves.trim() || undefined,
      solution: editForm.solution.trim() || undefined,
      uniqueSellingPoint: editForm.uniqueSellingPoint.trim() || undefined,
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
    const remaining = 10 - current.length;
    if (remaining <= 0) {
      setEditError('You can add up to 10 screenshots.');
      return;
    }
    setIsAddingShots(true);
    setEditError(null);
    const added: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        try {
          added.push(await processImageFile(file, { maxSide: 1280, format: 'image/jpeg', quality: 0.75 }));
        } catch (err) {
          setEditError(err instanceof Error ? err.message : 'Could not process that screenshot.');
          break;
        }
      }
      if (added.length > 0) {
        setEditForm((prev) => ({
          ...prev,
          screenshots: [...(prev.screenshots || []), ...added].slice(0, 10),
        }));
        playSound('click', soundEnabled);
      }
    } finally {
      setIsAddingShots(false);
    }
  };

  const removeScreenshot = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      screenshots: (prev.screenshots || []).filter((_, i) => i !== index),
    }));
    playSound('click', soundEnabled);
  };

  const inputClass =
    'w-full rounded-xl border border-neutral-700 bg-[#222222] px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-colors';
  const labelClass = 'mb-1 block text-[11px] font-bold text-neutral-300';

  const liveCount = products.length;

  return (
    <div className="min-h-screen bg-[#222222] text-neutral-100 font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-neutral-800 bg-[#222222]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 bg-[#2a2a2a] text-neutral-300 hover:border-neutral-500 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-black text-white flex-1">My Products</h1>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-[#2a2a2a] px-3 py-1.5 text-xs font-bold text-neutral-400 hover:border-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
        {/* User Info Card */}
        <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-5 shadow-xs">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-neutral-700"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint-500 text-[#0b0f14] text-lg font-black">
                {(user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <h2 className="text-base font-black text-white">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Mail className="h-3 w-3" />
                <span>{user.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Calendar className="h-3 w-3" />
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3 text-center">
            <div className="text-lg font-black text-white">{liveCount}</div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase">Live Products</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-3 text-center">
            <div className="text-lg font-black text-amber-400">
              {submissions.filter((s) => s.status === 'under_review').length}
            </div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase">Pending Approval</div>
          </div>
        </div>

        {/* Pending Approval Submissions Section */}
        {submissions.filter((s) => s.status === 'under_review').length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Pending Approval ({submissions.filter((s) => s.status === 'under_review').length})
              </h3>
              <span className="text-[10px] text-neutral-400">Awaiting approval</span>
            </div>
            {submissions
              .filter((s) => s.status === 'under_review')
              .map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-amber-500/30 bg-[#2a2a2a] p-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <ProductLogo
                      src={sub.logoUrl || getWebsiteFavicon(sub.url)}
                      alt={sub.name}
                      containerClassName="relative h-11 w-11 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 shrink-0 flex items-center justify-center shadow-2xs"
                      iconClassName="h-5 w-5 text-neutral-400 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4
                          onClick={() => {
                            playSound('click', soundEnabled);
                            if (onSelectProduct) onSelectProduct(submissionToProduct(sub));
                          }}
                          className="text-sm font-black text-white truncate hover:text-amber-300 hover:underline cursor-pointer transition-colors"
                          title="Click to view details"
                        >
                          {sub.name}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <Clock className="h-2.5 w-2.5 animate-pulse" />
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{sub.tagline}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
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
              ))}
          </div>
        )}

        {/* Live Products List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400">
            Live Products ({products.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-[#2a2a2a] p-10 text-center">
              <Globe className="mx-auto h-8 w-8 text-neutral-600 mb-3" />
              <p className="text-sm font-bold text-neutral-300">No live products yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                {submissions.filter((s) => s.status === 'under_review').length > 0
                  ? 'Your submission is pending approval and will appear here once approved.'
                  : 'Submit a website to see it here.'}
              </p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-neutral-800 bg-[#2a2a2a] p-4 shadow-xs hover:border-neutral-700 transition-all"
              >
                <div className="flex items-start gap-3">
                  <ProductLogo
                    src={product.logoUrl || getWebsiteFavicon(product.url)}
                    alt={product.name}
                    containerClassName="relative h-11 w-11 rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900 shrink-0 flex items-center justify-center shadow-2xs"
                    iconClassName="h-5 w-5 text-neutral-400 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        onClick={() => {
                          playSound('click', soundEnabled);
                          if (onSelectProduct) onSelectProduct(product);
                        }}
                        className="text-sm font-black text-white truncate hover:text-mint-300 hover:underline cursor-pointer transition-colors"
                        title="Click to view details"
                      >
                        {product.name}
                      </h4>
                      <span className="text-[9px] font-bold text-mint-300 bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.5 rounded">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 truncate mt-0.5">{product.tagline}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-[10px] font-bold text-neutral-300">
                        <Globe className="h-2.5 w-2.5" />
                        {product.category}
                      </span>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-white transition-colors"
                      >
                        Visit
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-[#343434] px-2.5 py-1.5 text-xs font-bold text-neutral-200 hover:border-neutral-500 hover:text-white transition-all cursor-pointer shadow-2xs"
                      title="Edit project"
                    >
                      <Pencil className="h-3 w-3" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingId === product.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 bg-[#343434] text-neutral-400 hover:border-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
      </div>

      {/* ── Edit Product Modal ── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-[#262626] shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-700 bg-[#222222]">
                  <Pencil className="h-4 w-4 text-mint-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Edit {editingProduct.name}</h3>
                  <p className="text-[11px] font-medium text-neutral-400">Update your project details and media</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEdit}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Edit Tabs */}
            <div className="flex items-center gap-1 border-b border-neutral-800 px-5 pt-2 bg-[#222222]/50 overflow-x-auto">
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
                    className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'border-mint-400 text-white'
                        : 'border-transparent text-neutral-400 hover:text-neutral-200'
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
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-bold text-red-400">
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
                      <span className="font-mono-num text-[11px] font-bold text-neutral-400 bg-[#222222] px-2 py-0.5 rounded-md border border-neutral-700">
                        {editForm.categories.length}/3 selected
                      </span>
                    </div>

                    {/* Selected Categories */}
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2.5 rounded-xl border border-neutral-800 bg-[#222222]">
                      {editForm.categories.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-mint-500/15 border border-mint-500/40 px-2.5 py-1 text-xs font-bold text-mint-200"
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
                            className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-mint-500/30 text-mint-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Category Buttons */}
                    <div className="max-h-36 overflow-y-auto p-1.5 rounded-xl border border-neutral-800 bg-[#1c1c1c] flex flex-wrap gap-1.5">
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
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                              active
                                ? 'bg-mint-500/20 text-mint-200 border border-mint-500/50'
                                : 'bg-[#2a2a2a] text-neutral-400 border border-neutral-700 hover:text-white hover:border-neutral-500'
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
                    <textarea
                      rows={3}
                      value={editForm.description}
                      onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      className={`${inputClass} resize-y`}
                      placeholder="Tell visitors what your product does and how it helps them."
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Problem It Solves</label>
                    <textarea
                      rows={2}
                      value={editForm.problemItSolves}
                      onChange={(e) => setEditForm((p) => ({ ...p, problemItSolves: e.target.value }))}
                      className={`${inputClass} resize-y`}
                      placeholder="What pain point does it address?"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Your Solution</label>
                    <textarea
                      rows={2}
                      value={editForm.solution}
                      onChange={(e) => setEditForm((p) => ({ ...p, solution: e.target.value }))}
                      className={`${inputClass} resize-y`}
                      placeholder="How does it solve that problem?"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>What Makes It Different</label>
                    <textarea
                      rows={2}
                      value={editForm.uniqueSellingPoint}
                      onChange={(e) => setEditForm((p) => ({ ...p, uniqueSellingPoint: e.target.value }))}
                      className={`${inputClass} resize-y`}
                      placeholder="What sets it apart from alternatives?"
                    />
                  </div>

                  {/* Special Offer & Discount */}
                  <div className="rounded-xl border border-neutral-700/80 bg-[#1e1e1e] p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Special Offer / Viewer Discount</span>
                        <span className="rounded bg-mint-500/15 border border-mint-500/30 px-1.5 py-0.2 text-[9px] font-black text-mint-300 uppercase">
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
                          className={`${inputClass} font-mono uppercase`}
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
                  <div className="rounded-xl border border-neutral-800 bg-[#222222] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Upload className="h-3.5 w-3.5 text-mint-400" />
                          <span>Feature Screenshots</span>
                        </label>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Upload up to 10 screenshots to showcase your UI, features, and app in the listing gallery.
                        </p>
                      </div>
                      <span className="font-mono-num text-[11px] font-bold text-neutral-400 bg-[#2a2a2a] px-2.5 py-0.5 rounded-full border border-neutral-700 shrink-0">
                        {editForm.screenshots.length}/10
                      </span>
                    </div>

                    {/* Screenshots Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                      {editForm.screenshots.map((src, idx) => (
                        <div
                          key={idx}
                          className="group relative aspect-video overflow-hidden rounded-xl border border-neutral-700 bg-[#1a1a1a]"
                        >
                          <img
                            src={src}
                            alt={`Screenshot ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeScreenshot(idx)}
                            aria-label={`Remove screenshot ${idx + 1}`}
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
                            title="Remove screenshot"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}

                      {editForm.screenshots.length < 10 && (
                        <button
                          type="button"
                          onClick={() => screenshotsInputRef.current?.click()}
                          disabled={isAddingShots}
                          className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-neutral-700 bg-[#2a2a2a] text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-60"
                        >
                          {isAddingShots ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin text-mint-400" />
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
                    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-[#222222] p-3.5">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-inner">
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
                        <p className="text-xs font-semibold text-white">
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
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-[#343434] px-3 py-1.5 text-xs font-bold text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
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
                        <Video className="h-3.5 w-3.5 text-mint-400" />
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
                    <div className="flex items-center gap-4 rounded-xl border border-neutral-800 bg-[#222222] p-3.5">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900 shadow-inner">
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
                          <span className="text-base font-bold text-neutral-400 uppercase">
                            {editForm.creatorName.charAt(0)}
                          </span>
                        ) : (
                          <UserIcon className="h-6 w-6 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white">
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
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-[#343434] px-3 py-1.5 text-xs font-bold text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
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
                              className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors px-2 py-1"
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
            <div className="flex items-center justify-between border-t border-neutral-800 px-5 py-3.5 bg-[#222222]">
              <button
                type="button"
                onClick={handleCloseEdit}
                disabled={isSaving}
                className="rounded-xl border border-neutral-700 bg-transparent px-4 py-2 text-xs font-bold text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer shadow-md ${
                  saveSuccess
                    ? 'bg-mint-500 text-[#0b0f14]'
                    : 'bg-white text-[#0b0f14] hover:bg-neutral-200'
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
    </div>
  );
};
