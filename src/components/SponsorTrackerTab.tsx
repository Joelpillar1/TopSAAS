import React, { useState } from 'react';
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
} from 'lucide-react';
import { Product } from '../types';
import { playSound } from '../utils/sound';
import { ProductLogo } from './ProductLogo';
import confetti from 'canvas-confetti';

interface SponsorTrackerTabProps {
  products: Product[];
  soundEnabled: boolean;
  onUpdateProduct: (product: Product) => void;
}

interface OutreachModalState {
  isOpen: boolean;
  product: Product | null;
  activeTemplate: 'day1' | 'day5' | 'day7';
  copied: boolean;
}

export const SponsorTrackerTab: React.FC<SponsorTrackerTabProps> = ({
  products,
  soundEnabled,
  onUpdateProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'active_trial' | 'expiring' | 'expired' | 'paid'>('all');
  const [grantSearch, setGrantSearch] = useState('');
  const [selectedGrantProduct, setSelectedGrantProduct] = useState<Product | null>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantDays, setGrantDays] = useState(7);
  const [isGranting, setIsGranting] = useState(false);

  const [outreachModal, setOutreachModal] = useState<OutreachModalState>({
    isOpen: false,
    product: null,
    activeTemplate: 'day5',
    copied: false,
  });

  const now = Date.now();

  // All products that have ever had sponsor status
  const allSponsors = products.filter(
    (p) => p.isSponsored || p.sponsorTier === 'trial' || p.sponsorTier === 'paid'
  );

  // Categorize
  const activeTrials = allSponsors.filter(
    (p) => p.sponsorTier === 'trial' && p.sponsorExpiresAt && p.sponsorExpiresAt > now
  );

  const expiringSoon = activeTrials.filter(
    (p) => p.sponsorExpiresAt && (p.sponsorExpiresAt - now) <= 2 * 86400 * 1000
  );

  const expiredTrials = allSponsors.filter(
    (p) => p.sponsorTier === 'trial' && (!p.sponsorExpiresAt || p.sponsorExpiresAt <= now)
  );

  const paidSponsors = allSponsors.filter((p) => p.sponsorTier === 'paid');

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

    if (tierFilter === 'active_trial') return p.sponsorTier === 'trial' && p.sponsorExpiresAt && p.sponsorExpiresAt > now;
    if (tierFilter === 'expiring') return p.sponsorTier === 'trial' && p.sponsorExpiresAt && (p.sponsorExpiresAt - now) <= 2 * 86400 * 1000 && p.sponsorExpiresAt > now;
    if (tierFilter === 'expired') return p.sponsorTier === 'trial' && (!p.sponsorExpiresAt || p.sponsorExpiresAt <= now);
    if (tierFilter === 'paid') return p.sponsorTier === 'paid';
    return true;
  });

  // Action handlers
  const handleExtendTrial = (product: Product, days: number = 7) => {
    playSound('success', soundEnabled);
    const currentExpiry = product.sponsorExpiresAt && product.sponsorExpiresAt > now ? product.sponsorExpiresAt : now;
    const updated: Product = {
      ...product,
      isSponsored: true,
      sponsorTier: 'trial',
      sponsorExpiresAt: currentExpiry + days * 86400 * 1000,
    };
    onUpdateProduct(updated);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  const handleConvertToPaid = (product: Product) => {
    playSound('success', soundEnabled);
    const updated: Product = {
      ...product,
      isSponsored: true,
      sponsorTier: 'paid',
      sponsorExpiresAt: now + 30 * 86400 * 1000,
    };
    onUpdateProduct(updated);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
  };

  const handleEndSponsor = (product: Product) => {
    playSound('click', soundEnabled);
    const updated: Product = {
      ...product,
      isSponsored: false,
      sponsorExpiresAt: now - 1000,
    };
    onUpdateProduct(updated);
  };

  const handleGrantSponsor = () => {
    if (!selectedGrantProduct) return;
    setIsGranting(true);
    playSound('success', soundEnabled);

    const updated: Product = {
      ...selectedGrantProduct,
      isSponsored: true,
      sponsorTier: 'trial',
      sponsorStartedAt: now,
      sponsorExpiresAt: now + grantDays * 86400 * 1000,
      sponsorContactEmail: grantEmail.trim() || selectedGrantProduct.sponsorContactEmail,
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
        subject: `Your product is now featured on TopSAAS (Free 7-Day Sponsor Slot)`,
        body: `Hi ${founderName},

Just wanted to let you know that ${productName} has been spotlighted on our top sponsor rail on TopSAAS (https://topsaas.space).

Your free 7-day placement is active starting today! You can monitor direct incoming visitors in your analytics via referral source topsaas.space or tag: utm_source=topsaas.

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

Quick check-in! Over the past 5 days, your sponsor placement on TopSAAS has generated direct interest and ${clicks > 0 ? `${clicks} direct clicks` : 'steady visibility'} to your website.

Your complimentary 7-day spot wraps up in ${daysLeft > 0 ? `${daysLeft} days` : '48 hours'}. Because you were one of our early spotlighted tools, we would love to offer you our Founder Renewal Rate to keep your top placement locked in:

👉 30-Day Pro Sponsor Spot: $79/mo (normally $99)
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

Your 7-day free sponsor spotlight for ${productName} ends today, and the slot is queued to open for our next batch of submissions tonight at midnight UTC.

If you'd like to extend your featured spot and keep the steady builder traffic coming in, you can lock it in here before the slot rotates:

👉 Extend Sponsor Spot: https://topsaas.space/pricing

Either way, your standard directory listing remains live on TopSAAS forever. Thank you for building something awesome!

Best,
TopSAAS Team
https://topsaas.space`,
    };
  };

  return (
    <div className="space-y-6">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
          <p className="text-[11px] text-neutral-500 mt-1">Ready for Day 5/7 pitch</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
            <span>Expired (Unpaid)</span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 font-mono-num">
            {expiredTrials.length}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Trial completed</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 mb-1">
            <span>Clicks Delivered</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-950 font-mono-num">
            {totalClicksDelivered}
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">Outbound visitor clicks</p>
        </div>
      </div>

      {/* ── Quick Admin Grant Section ── */}
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider">
            Grant Free Sponsor Placement to Any Product
          </h3>
        </div>
        <p className="text-xs text-neutral-600 mb-3">
          Select any published directory product to put on the top sponsor rails for free.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
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
                  .slice(0, 5)
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
                      <span className="text-[10px] text-neutral-500">{p.category}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <input
            type="email"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            placeholder="Founder email (for outreach tracking)"
            className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
          />

          <button
            type="button"
            onClick={handleGrantSponsor}
            disabled={!selectedGrantProduct || isGranting}
            className="btn-primary py-2 px-4 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Grant 7-Day Free Spot</span>
          </button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { key: 'all', label: `All (${allSponsors.length})` },
              { key: 'active_trial', label: `Active Trials (${activeTrials.length})` },
              { key: 'expiring', label: `Expiring Soon (${expiringSoon.length})` },
              { key: 'expired', label: `Expired (${expiredTrials.length})` },
              { key: 'paid', label: `Paid (${paidSponsors.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => { playSound('click', soundEnabled); setTierFilter(tab.key); }}
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
            <p className="text-[11px]">Founders who claim a free 7-day spot will show up here for tracking and outreach.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold text-neutral-500">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Founder / Email</th>
                  <th className="py-3 px-4">Status & Days Left</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4 text-right">Actions & Outreach</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSponsors.map((p) => {
                  const isPaid = p.sponsorTier === 'paid';
                  const isExpired = p.sponsorExpiresAt ? p.sponsorExpiresAt <= now : false;
                  const daysLeft = p.sponsorExpiresAt
                    ? Math.max(0, Math.ceil((p.sponsorExpiresAt - now) / (86400 * 1000)))
                    : 0;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
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

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {p.sponsorContactEmail ? (
                          <span className="text-neutral-900 font-semibold">{p.sponsorContactEmail}</span>
                        ) : (
                          <span className="text-neutral-400 italic">No email provided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Award className="h-3 w-3" />
                            <span>Paid Sponsor</span>
                          </span>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            <span>Expired (Unpaid)</span>
                          </span>
                        ) : daysLeft <= 2 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                            <Clock className="h-3 w-3" />
                            <span>{daysLeft === 0 ? 'Expires today' : `${daysLeft}d left (Soon)`}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Active Trial • {daysLeft}d left</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-950">
                        {p.sponsorClicks || p.clicks || 0}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openOutreach(p, isExpired ? 'day7' : daysLeft <= 2 ? 'day5' : 'day1')}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer shadow-2xs"
                            title="Open outreach playbook and copy customized pitch"
                          >
                            <Mail className="h-3 w-3" />
                            <span>Reach Out</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleExtendTrial(p, 7)}
                            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
                            title="Extend free trial by 7 days"
                          >
                            +7d
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConvertToPaid(p)}
                            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer"
                            title="Mark as paid 30-day sponsor"
                          >
                            Paid
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEndSponsor(p)}
                            className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                            title="Remove from sponsor placement"
                          >
                            End
                          </button>
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
                <h3 className="text-base font-bold text-neutral-950">Founder Outreach Playbook</h3>
                <p className="text-xs text-neutral-500">
                  Target: <span className="font-bold text-neutral-900">{outreachModal.product.name}</span>
                </p>
              </div>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex items-center gap-1.5 border-b border-neutral-200 pb-2 mb-3">
              {[
                { id: 'day1' as const, label: 'Day 1: Welcome & Setup' },
                { id: 'day5' as const, label: 'Day 5: Traffic & 20% Offer' },
                { id: 'day7' as const, label: 'Day 7: Expiry Urgency' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOutreachModal({ ...outreachModal, activeTemplate: t.id, copied: false })}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                    outreachModal.activeTemplate === t.id
                      ? 'bg-neutral-950 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Email Preview */}
            {(() => {
              const email = getEmailContent(outreachModal.product, outreachModal.activeTemplate);
              const recipient = outreachModal.product.sponsorContactEmail || '';

              const handleCopy = async () => {
                await navigator.clipboard.writeText(`Subject: ${email.subject}\n\n${email.body}`);
                setOutreachModal({ ...outreachModal, copied: true });
                playSound('success', soundEnabled);
                setTimeout(() => setOutreachModal((prev) => ({ ...prev, copied: false })), 2000);
              };

              const mailtoUrl = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;

              return (
                <div className="space-y-3">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between text-neutral-500 pb-1.5 border-b border-neutral-200">
                      <span><strong>To:</strong> {recipient || 'founder@product.com'}</span>
                      <span className="text-[10px] uppercase font-bold text-blue-600">
                        {outreachModal.activeTemplate.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <strong className="text-neutral-900 block mb-0.5">Subject:</strong>
                      <span className="font-semibold text-neutral-950">{email.subject}</span>
                    </div>
                    <div>
                      <strong className="text-neutral-900 block mb-0.5">Body:</strong>
                      <pre className="whitespace-pre-wrap font-sans text-neutral-700 text-[11.5px] leading-relaxed max-h-48 overflow-y-auto pr-1">
                        {email.body}
                      </pre>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex-1 btn-secondary py-2 text-xs font-bold"
                    >
                      {outreachModal.copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{outreachModal.copied ? 'Copied to Clipboard' : 'Copy Email Pitch'}</span>
                    </button>

                    <a
                      href={mailtoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-primary py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Open in Mail Client</span>
                    </a>
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
