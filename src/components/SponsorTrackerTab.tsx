import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Mail,
  Copy,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  Search,
  Plus,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  X,
  Send,
  RefreshCw,
  Award,
  ChevronDown,
  Pause,
  Play,
} from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import { getCountdown, formatRemainingMs } from '../utils/countdown';
import { recordSponsorPauseToggle } from '../utils/db';
import confetti from 'canvas-confetti';

interface SponsorTrackerTabProps {
  products: Product[];
  soundEnabled: boolean;
  onUpdateProduct: (product: Product) => void;
  sponsorRailsEnabled?: boolean;
  onToggleSponsorRails?: (enabled: boolean) => void;
}

interface OutreachModalState {
  isOpen: boolean;
  product: Product | null;
  activeTemplate: 'day1' | 'day5' | 'day7';
  copied: boolean;
}

type GrantTierOption = '1mo' | '3mo' | '1yr' | 'trial' | 'custom';

export const SponsorTrackerTab: React.FC<SponsorTrackerTabProps> = ({
  products,
  soundEnabled,
  onUpdateProduct,
  sponsorRailsEnabled = true,
  onToggleSponsorRails,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'active_trial' | 'paid' | 'expiring' | 'expired'>('all');
  const [grantSearch, setGrantSearch] = useState('');
  const [selectedGrantProduct, setSelectedGrantProduct] = useState<Product | null>(null);
  const [grantTier, setGrantTier] = useState<GrantTierOption>('1mo');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantDays, setGrantDays] = useState(30);
  const [isGranting, setIsGranting] = useState(false);

  const [outreachModal, setOutreachModal] = useState<OutreachModalState>({
    isOpen: false,
    product: null,
    activeTemplate: 'day5',
    copied: false,
  });

  const [now, setNow] = useState(Date.now());

  // Real-time ticking for live countdowns (updates every second)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isSponsorTier = (tier?: string) =>
    tier === 'trial' || tier === 'paid' || tier === '1mo' || tier === '3mo' || tier === '1yr';

  const isPaidSponsorTier = (tier?: string) =>
    tier === 'paid' || tier === '1mo' || tier === '3mo' || tier === '1yr';

  // All active sponsored products, paused sponsors, or active trials
  const allSponsors = products.filter(
    (p) => (Boolean(p.isSponsored) || Boolean(p.isSponsorPaused)) && (!p.sponsorExpiresAt || p.sponsorExpiresAt > now || p.isSponsorPaused)
  );

  // Categorize
  const activeTrials = allSponsors.filter(
    (p) => !p.isSponsorPaused && p.sponsorTier === 'trial' && p.sponsorExpiresAt && p.sponsorExpiresAt > now
  );

  const paidSponsors = allSponsors.filter(
    (p) => isPaidSponsorTier(p.sponsorTier) && (!p.sponsorExpiresAt || p.sponsorExpiresAt > now || p.isSponsorPaused)
  );

  const expiringSoon = allSponsors.filter(
    (p) => !p.isSponsorPaused && p.sponsorExpiresAt && p.sponsorExpiresAt > now && (p.sponsorExpiresAt - now) <= 2 * 86400 * 1000
  );

  const expiredTrials = products.filter(
    (p) => !p.isSponsored && !p.isSponsorPaused && p.sponsorTier && (!p.sponsorExpiresAt || p.sponsorExpiresAt <= now)
  );

  const totalClicksDelivered = allSponsors.reduce(
    (sum, p) => sum + (p.sponsorClicks || p.clicks || 0),
    0
  );

  // Filter list
  const filteredSponsors = allSponsors.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      (p.sponsorContactEmail || '').toLowerCase().includes(q);

    if (!matchesQuery) return false;

    if (tierFilter === 'active_trial') {
      return p.sponsorTier === 'trial' && p.sponsorExpiresAt && p.sponsorExpiresAt > now;
    }
    if (tierFilter === 'paid') {
      return isPaidSponsorTier(p.sponsorTier) && (!p.sponsorExpiresAt || p.sponsorExpiresAt > now);
    }
    if (tierFilter === 'expiring') {
      return p.sponsorExpiresAt && p.sponsorExpiresAt > now && (p.sponsorExpiresAt - now) <= 2 * 86400 * 1000;
    }
    if (tierFilter === 'expired') {
      return !p.isSponsored || (p.sponsorExpiresAt && p.sponsorExpiresAt <= now);
    }
    return true;
  });

  // Action handlers
  const handleExtendDays = (product: Product, days: number = 7) => {
    playSound('success', soundEnabled);
    const currentExpiry = product.sponsorExpiresAt && product.sponsorExpiresAt > now ? product.sponsorExpiresAt : now;
    const isPaid = isPaidSponsorTier(product.sponsorTier);
    const updated: Product = {
      ...product,
      isSponsored: true,
      sponsorTier: product.sponsorTier || (days > 7 ? '1mo' : 'trial'),
      sponsorExpiresAt: currentExpiry + days * 86400 * 1000,
      autoRelaunch: product.autoRelaunch,
    };
    onUpdateProduct(updated);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  const handleConvertToTier = (product: Product, tier: '1mo' | '3mo' | '1yr' | 'trial') => {
    playSound('success', soundEnabled);
    let days = 30;
    if (tier === 'trial') days = 7;
    else if (tier === '1mo') days = 30;
    else if (tier === '3mo') days = 90;
    else if (tier === '1yr') days = 365;

    const updated: Product = {
      ...product,
      isSponsored: true,
      sponsorTier: tier,
      sponsorStartedAt: product.sponsorStartedAt || now,
      sponsorExpiresAt: now + days * 86400 * 1000,
      autoRelaunch: product.autoRelaunch,
      lastRelaunchedAt: product.lastRelaunchedAt,
    };
    onUpdateProduct(updated);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleEndSponsor = (product: Product) => {
    playSound('click', soundEnabled);
    const updated: Product = {
      ...product,
      isSponsored: false,
      isSponsorPaused: false,
      sponsorPausedRemainingMs: undefined,
      sponsorTier: undefined,
      sponsorStartedAt: undefined,
      sponsorExpiresAt: undefined,
    };
    onUpdateProduct(updated);
  };

  const handleTogglePause = async (product: Product) => {
    playSound('click', soundEnabled);
    const updated = await recordSponsorPauseToggle(product.id);
    if (updated) {
      onUpdateProduct({
        ...product,
        isSponsored: !updated.isPaused,
        isSponsorPaused: Boolean(updated.isPaused),
        sponsorExpiresAt: updated.expiresAt,
        sponsorPausedRemainingMs: updated.pausedRemainingMs,
      });
    }
  };

  const handleGrantSponsor = () => {
    if (!selectedGrantProduct) return;
    setIsGranting(true);
    playSound('success', soundEnabled);

    let days = grantDays;
    let effectiveTier: 'trial' | 'paid' | '1mo' | '3mo' | '1yr' = '1mo';
    if (grantTier === '1mo') {
      days = 30;
      effectiveTier = '1mo';
    } else if (grantTier === '3mo') {
      days = 90;
      effectiveTier = '3mo';
    } else if (grantTier === '1yr') {
      days = 365;
      effectiveTier = '1yr';
    } else if (grantTier === 'trial') {
      days = 7;
      effectiveTier = 'trial';
    } else if (grantTier === 'custom') {
      effectiveTier = days > 7 ? '1mo' : 'trial';
    }

    const isPaid = effectiveTier !== 'trial';
    const updated: Product = {
      ...selectedGrantProduct,
      isSponsored: true,
      sponsorTier: effectiveTier,
      sponsorStartedAt: now,
      sponsorExpiresAt: now + days * 86400 * 1000,
      sponsorContactEmail: grantEmail.trim() || selectedGrantProduct.sponsorContactEmail,
      autoRelaunch: selectedGrantProduct.autoRelaunch,
      lastRelaunchedAt: selectedGrantProduct.lastRelaunchedAt,
    };

    onUpdateProduct(updated);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setSelectedGrantProduct(null);
    setGrantSearch('');
    setGrantEmail('');
    setIsGranting(false);
  };

  // Outreach Modal Logic
  const openOutreach = (product: Product, defaultTemplate: 'day1' | 'day5' | 'day7' = 'day5') => {
    playSound('click', soundEnabled);
    setOutreachModal({
      isOpen: true,
      product,
      activeTemplate: defaultTemplate,
      copied: false,
    });
  };

  const getEmailContent = (p: Product, template: 'day1' | 'day5' | 'day7') => {
    const founderName = p.creatorName || 'there';
    const productName = p.name;
    const clicks = p.sponsorClicks || p.clicks || 0;
    const daysLeft = p.sponsorExpiresAt
      ? Math.max(0, Math.ceil((p.sponsorExpiresAt - now) / (86400 * 1000)))
      : 0;

    if (template === 'day1') {
      return {
        subject: `Your product is now featured on TopSAAS (Sponsor Spotlight)`,
        body: `Hi ${founderName},

Just wanted to let you know that ${productName} has been spotlighted on our top sponsor rail on TopSAAS (https://topsaas.space).

Your sponsor placement is active starting today! You can monitor direct incoming visitors in your analytics via referral source topsaas.space or tag: utm_source=topsaas.

We're excited to help put your tool in front of our community of thousands of active builders, founders, and early adopters.

Feel free to reply if you need any adjustments to your listing or demo!

Best,
TopSAAS Team
https://topsaas.space`,
      };
    }

    if (template === 'day5') {
      return {
        subject: `Traffic update on ${productName} on TopSAAS`,
        body: `Hi ${founderName},

Quick check-in! Over the past few days, your sponsor placement on TopSAAS has generated direct interest and ${clicks > 0 ? `${clicks} direct clicks` : 'steady visibility'} to your website.

Your current placement wraps up in ${daysLeft > 0 ? `${daysLeft} days` : '48 hours'}. Because you were one of our spotlighted tools, we would love to offer you our founder rate to keep your top placement locked in:

👉 1-Month Sponsor Spot: $29/mo
👉 3-Month Sponsor Spot: $69 (Save 20%)
👉 1-Year Partner Spot: $199 (Save 42%)

Lock it in here: https://topsaas.space/pricing

Would you like to keep your placement active for another month?

Best,
TopSAAS Team
https://topsaas.space`,
      };
    }

    return {
      subject: `${productName} sponsor spotlight ending today`,
      body: `Hi ${founderName},

Your sponsor spotlight for ${productName} ends today, and the slot is queued to rotate tonight at midnight UTC.

If you'd like to extend your featured spot and keep the steady builder traffic coming in, you can lock it in here before the slot rotates:

👉 Extend Sponsor Spot ($29/mo): https://topsaas.space/pricing

Either way, your standard directory listing remains live on TopSAAS forever. Thank you for building something awesome!

Best,
TopSAAS Team
https://topsaas.space`,
    };
  };

  const getTierBadge = (p: Product) => {
    const isPaid = isPaidSponsorTier(p.sponsorTier);
    const isExpired = !p.isSponsored || (p.sponsorExpiresAt ? p.sponsorExpiresAt <= now : false);

    if (p.sponsorTier === '1mo') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          <Award className="h-3 w-3" />
          <span>1-Month ($29)</span>
        </span>
      );
    }
    if (p.sponsorTier === '3mo') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          <Award className="h-3 w-3" />
          <span>3-Month ($69)</span>
        </span>
      );
    }
    if (p.sponsorTier === '1yr') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          <Award className="h-3 w-3" />
          <span>1-Year ($199)</span>
        </span>
      );
    }
    if (p.sponsorTier === 'trial') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
          <Sparkles className="h-3 w-3" />
          <span>7-Day Trial</span>
        </span>
      );
    }
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          <Award className="h-3 w-3" />
          <span>Paid Sponsor</span>
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
          <span>Inactive / Past</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
        <span>Sponsored</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Master Homepage Sponsor Rails Switch ── */}
      <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        sponsorRailsEnabled
          ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300/80 shadow-2xs'
          : 'bg-neutral-50/90 border-neutral-200 text-neutral-500'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-colors ${
              sponsorRailsEnabled
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-neutral-200 text-neutral-500'
            }`}>
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-neutral-950">
                  Homepage Side Sponsored Rails
                </h3>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                  sponsorRailsEnabled
                    ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                    : 'bg-neutral-200 text-neutral-700'
                }`}>
                  {sponsorRailsEnabled ? 'Active (ON)' : 'Disabled (OFF)'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-600">
                Master switch to toggle off or on all homepage left &amp; right sponsor cards at once.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <span className="text-xs font-bold text-neutral-500">
              {sponsorRailsEnabled ? 'Showing on Homepage' : 'Hidden from Homepage'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={sponsorRailsEnabled}
              onClick={() => {
                playSound('click', soundEnabled);
                onToggleSponsorRails?.(!sponsorRailsEnabled);
              }}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                sponsorRailsEnabled ? 'bg-emerald-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  sponsorRailsEnabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
            <span>Paid Sponsors</span>
            <Award className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono-num">
            {paidSponsors.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">$29/mo, $69/3mo, $199/yr</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
            <span>Active Free Trials</span>
            <Megaphone className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono-num">
            {activeTrials.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Live on sponsor rails</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
            <span>Expiring Soon (≤2d)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono-num">
            {expiringSoon.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Ready for pitch/renewal</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
            <span>Clicks Delivered</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono-num">
            {totalClicksDelivered}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Outbound sponsor clicks</p>
        </div>
      </div>

      {/* ── Quick Admin Grant Section ── */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
            Grant or Manage Sponsor Placement for Any Product
          </h3>
        </div>
        <p className="text-xs text-neutral-600 mb-3.5">
          Select any published directory product to place on top sponsor rails. Automatically persists in Supabase cloud settings so reload will never wipe it.
        </p>

        {/* Tier selector pills */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Tier:</span>
          {(
            [
              { id: '1mo', label: '1 Month ($29 / 30d)', days: 30 },
              { id: '3mo', label: '3 Months ($69 / 90d)', days: 90 },
              { id: '1yr', label: '1 Year ($199 / 365d)', days: 365 },
              { id: 'trial', label: '7-Day Free Trial (7d)', days: 7 },
              { id: 'custom', label: 'Custom Days', days: grantDays },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setGrantTier(t.id);
                if (t.id !== 'custom') setGrantDays(t.days);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                grantTier === t.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Product search / select */}
          <div className="sm:col-span-5 relative">
            <input
              type="text"
              value={grantSearch}
              onChange={(e) => {
                setGrantSearch(e.target.value);
                setSelectedGrantProduct(null);
              }}
              placeholder="Search product to sponsor…"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
            />
            {grantSearch && !selectedGrantProduct && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 p-1">
                {products
                  .filter((p) => p.name.toLowerCase().includes(grantSearch.toLowerCase()))
                  .slice(0, 6)
                  .map((p) => (
                    <div
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedGrantProduct(p);
                        setGrantSearch(p.name);
                        setGrantEmail(p.sponsorContactEmail || '');
                      }}
                      className="p-2 text-xs hover:bg-neutral-100 rounded-lg cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-bold text-neutral-900">{p.name}</span>
                      <span className="text-[10px] text-neutral-500">
                        {p.category} {p.isSponsored ? '• (Already Sponsored)' : ''}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="sm:col-span-4">
            <input
              type="email"
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="Founder email (for outreach & receipts)"
              className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
            />
          </div>

          {/* Custom days input (if custom chosen) */}
          {grantTier === 'custom' && (
            <div className="sm:col-span-2">
              <input
                type="number"
                min={1}
                max={730}
                value={grantDays}
                onChange={(e) => setGrantDays(parseInt(e.target.value, 10) || 7)}
                placeholder="Days"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>
          )}

          {/* Submit button */}
          <div className={grantTier === 'custom' ? 'sm:col-span-1' : 'sm:col-span-3'}>
            <button
              type="button"
              onClick={handleGrantSponsor}
              disabled={!selectedGrantProduct || isGranting}
              className="w-full btn-primary py-2 px-3 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed justify-center"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isGranting ? 'Saving…' : 'Grant Placement'}</span>
            </button>
          </div>
        </div>

        {selectedGrantProduct && (
          <div className="mt-2.5 flex items-center gap-2 text-xs text-neutral-600 bg-white/80 border border-neutral-200 rounded-xl px-3 py-1.5">
            <span className="font-bold text-neutral-900">Target Selected:</span>
            <span>{selectedGrantProduct.name}</span>
            <span className="text-neutral-400">({selectedGrantProduct.url})</span>
            {selectedGrantProduct.isSponsored && (
              <span className="ml-auto text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                Active Sponsor
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: `All (${allSponsors.length})` },
              { key: 'paid', label: `Paid (${paidSponsors.length})` },
              { key: 'active_trial', label: `Active Trials (${activeTrials.length})` },
              { key: 'expiring', label: `Expiring Soon (${expiringSoon.length})` },
              { key: 'expired', label: `Expired (${expiredTrials.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                setTierFilter(tab.key);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                tierFilter === tab.key
                  ? 'bg-neutral-950 text-white shadow-2xs'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sponsors or email…"
            className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
          />
        </div>
      </div>

      {/* ── Sponsor Listings Table ── */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
        {filteredSponsors.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 space-y-2">
            <Megaphone className="h-8 w-8 mx-auto text-neutral-300" />
            <p className="text-xs font-bold text-neutral-900">No sponsors found in this view</p>
            <p className="text-[11px] max-w-sm mx-auto">
              Granted or paid sponsor apps will show up here. Use the tool above to grant a sponsor spot to any directory product.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-500">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Founder / Email</th>
                  <th className="py-3 px-4">Status & Expiry</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4 text-right">Actions & Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSponsors.map((p) => {
                  const isExpired = !p.isSponsored || (p.sponsorExpiresAt ? p.sponsorExpiresAt <= now : false);
                  const daysLeft = p.sponsorExpiresAt
                    ? Math.max(0, Math.ceil((p.sponsorExpiresAt - now) / (86400 * 1000)))
                    : 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ProductLogo
                            src={p.logoUrl}
                            alt={p.name}
                            containerClassName="h-8 w-8 rounded-lg border border-neutral-200 bg-white shrink-0 overflow-hidden relative flex items-center justify-center"
                            iconClassName="h-4 w-4 text-neutral-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-neutral-950 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                            >
                              <span>{p.name}</span>
                              <ExternalLink className="h-3 w-3 text-neutral-400" />
                            </a>
                            <p className="text-[10px] text-neutral-500 truncate max-w-xs">{p.tagline}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTierBadge(p)}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {p.sponsorContactEmail ? (
                          <span className="text-neutral-900 font-semibold">{p.sponsorContactEmail}</span>
                        ) : (
                          <span className="text-neutral-400 italic">No email provided</span>
                        )}
                      </td>

                      {/* Expiry & Live Countdown */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.isSponsorPaused ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <Pause className="h-3 w-3 text-amber-600" />
                            <span>Paused · {formatRemainingMs(p.sponsorPausedRemainingMs)} left</span>
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            <span>Expired</span>
                          </span>
                        ) : (() => {
                          const cd = getCountdown(p.sponsorExpiresAt, now);
                          if (cd.isUrgent) {
                            return (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700 animate-pulse">
                                <Clock className="h-3 w-3" />
                                <span>{cd.formatted} left (Soon)</span>
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active · {cd.formatted} left</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-950">
                        {p.sponsorClicks || p.clicks || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Pause / Resume Button */}
                          {(p.isSponsored || p.isSponsorPaused) && (
                            <button
                              type="button"
                              onClick={() => handleTogglePause(p)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                                p.isSponsorPaused
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                              title={
                                p.isSponsorPaused
                                  ? 'Resume sponsor placement (restores visibility to public homepage rails)'
                                  : 'Pause sponsor placement (hides from homepage rails and freezes remaining time)'
                              }
                            >
                              {p.isSponsorPaused ? (
                                <>
                                  <Play className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                                  <span>Resume</span>
                                </>
                              ) : (
                                <>
                                  <Pause className="h-3 w-3 fill-amber-600 text-amber-600" />
                                  <span>Pause</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openOutreach(p, isExpired ? 'day7' : daysLeft <= 2 ? 'day5' : 'day1')}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer shadow-2xs"
                            title="Open outreach playbook and copy customized pitch"
                          >
                            <Mail className="h-3 w-3" />
                            <span>Pitch</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExtendDays(p, 7)}
                            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                            title="Extend sponsor placement by +7 days"
                          >
                            +7d
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExtendDays(p, 30)}
                            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                            title="Extend sponsor placement by +30 days"
                          >
                            +30d
                          </button>

                          {/* Quick Convert Buttons */}
                          <button
                            type="button"
                            onClick={() => handleConvertToTier(p, '1mo')}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer"
                            title="Convert to 1-Month Paid ($29)"
                          >
                            $29/1mo
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConvertToTier(p, '3mo')}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-all cursor-pointer"
                            title="Convert to 3-Month Paid ($69)"
                          >
                            $69/3mo
                          </button>

                          {(p.isSponsored || p.isSponsorPaused) && (
                            <button
                              type="button"
                              onClick={() => handleEndSponsor(p)}
                              className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                              title="End and remove sponsor placement immediately"
                            >
                              End
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Outreach Playbook Modal ── */}
      {outreachModal.isOpen && outreachModal.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto font-sans">
          <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white shadow-2xl p-5 sm:p-6 my-4 text-neutral-900 animate-in fade-in zoom-in-95 duration-150">
            {/* Close */}
            <button
              type="button"
              onClick={() => setOutreachModal({ ...outreachModal, isOpen: false })}
              className="absolute right-3.5 top-3.5 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-950 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pr-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-950 tracking-tight">
                  Outreach Pitch & Renewal
                </h3>
                <p className="text-xs text-neutral-500">
                  {outreachModal.product.name} • {outreachModal.product.sponsorContactEmail || 'No founder email'}
                </p>
              </div>
            </div>

            {/* Template selector tabs */}
            <div className="flex items-center gap-1.5 mb-3.5 border-b border-neutral-100 pb-2">
              {(
                [
                  { id: 'day1', label: 'Day 1: Welcome Spot' },
                  { id: 'day5', label: 'Day 5: Traffic + Pitch ($29/mo)' },
                  { id: 'day7', label: 'Day 7: Final Expiry Reminder' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setOutreachModal({
                      ...outreachModal,
                      activeTemplate: tab.id,
                      copied: false,
                    });
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    outreachModal.activeTemplate === tab.id
                      ? 'bg-neutral-950 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Email subject & body preview */}
            {(() => {
              const email = getEmailContent(outreachModal.product, outreachModal.activeTemplate);
              const fullText = `Subject: ${email.subject}\n\n${email.body}`;

              const handleCopy = () => {
                navigator.clipboard.writeText(fullText);
                setOutreachModal({ ...outreachModal, copied: true });
                playSound('success', soundEnabled);
                setTimeout(() => {
                  setOutreachModal((prev) => ({ ...prev, copied: false }));
                }, 2000);
              };

              return (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Subject
                    </label>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 text-xs font-mono text-neutral-900 select-all">
                      {email.subject}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Body
                    </label>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs font-mono text-neutral-900 whitespace-pre-wrap max-h-56 overflow-y-auto select-all leading-relaxed">
                      {email.body}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-neutral-500">
                      Click copy to paste into Gmail, Superhuman, or your mail client.
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="btn-primary py-2 px-4 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      {outreachModal.copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
