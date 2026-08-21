import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  ExternalLink, 
  ShieldCheck, 
  Search, 
  Filter, 
  Sparkles, 
  Trash2, 
  Eye, 
  RotateCcw, 
  Globe, 
  Twitter, 
  User, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit3,
  Plus,
  Trophy,
  Crown,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ArrowUpDown,
  Star,
  LayoutList,
  Mail
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WebsiteSubmission, Category, Product } from '../types';
import { playSound } from '../utils/sound';
import { getWebsiteFavicon } from '../utils/logo';
import { BorderBeam } from './BorderBeam';

interface AdminAcceptPageProps {
  submissions: WebsiteSubmission[];
  products: Product[];
  onAcceptSubmission: (submission: WebsiteSubmission) => void;
  onRejectSubmission: (submissionId: string, reason?: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onUpdateSubmission: (updated: WebsiteSubmission) => void;
  onRestoreSubmission: (submissionId: string) => void;
  onDelistProduct: (productId: string) => void;
  onAssignRank: (productId: string, newRank: number) => void;
  onBackToDirectory: () => void;
  onOpenSubmitModal: () => void;
  onSeedSampleSubmissions: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const AdminAcceptPage: React.FC<AdminAcceptPageProps> = ({
  submissions,
  products,
  onAcceptSubmission,
  onRejectSubmission,
  onDeleteSubmission,
  onUpdateSubmission,
  onRestoreSubmission,
  onDelistProduct,
  onAssignRank,
  onBackToDirectory,
  onOpenSubmitModal,
  onSeedSampleSubmissions,
  soundEnabled,
}) => {
  // Active view tab: submissions queue vs products management
  const [activeView, setActiveView] = useState<'submissions' | 'products'>('submissions');

  // Submissions state
  const [statusFilter, setStatusFilter] = useState<'all' | 'under_review' | 'approved' | 'rejected'>('under_review');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Products management state
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [editingRankId, setEditingRankId] = useState<string | null>(null);
  const [rankInputValue, setRankInputValue] = useState<string>('');
  
  // Edit modal state
  const [editingSubmission, setEditingSubmission] = useState<WebsiteSubmission | null>(null);
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('Developer Tools');

  // Counts
  const pendingCount = submissions.filter((s) => s.status === 'under_review').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  // Filtered submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (selectedCategory !== 'All' && sub.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.name.toLowerCase().includes(q);
      const matchTagline = sub.tagline.toLowerCase().includes(q);
      const matchUrl = sub.url.toLowerCase().includes(q);
      const matchBacker = sub.backerName.toLowerCase().includes(q);
      if (!matchName && !matchTagline && !matchUrl && !matchBacker) return false;
    }
    return true;
  });

  // Sorted products for management
  const sortedProducts = [...products].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

  // Filtered products
  const filteredProducts = sortedProducts.filter((p) => {
    if (productCategoryFilter !== 'All' && p.category !== productCategoryFilter) return false;
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

  const handleAccept = (sub: WebsiteSubmission) => {
    playSound('success', soundEnabled);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#000000', '#22c55e', '#3b82f6', '#f59e0b'],
      });
    } catch {}
    onAcceptSubmission(sub);
  };

  const handleReject = (id: string) => {
    playSound('click', soundEnabled);
    onRejectSubmission(id);
  };

  const handleOpenEdit = (sub: WebsiteSubmission) => {
    setEditingSubmission(sub);
    setEditName(sub.name);
    setEditTagline(sub.tagline);
    setEditUrl(sub.url);
    setEditCategory(sub.category);
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
      logoUrl: getWebsiteFavicon(editUrl.trim() || editingSubmission.url),
    };
    onUpdateSubmission(updated);
    setEditingSubmission(null);
  };

  const handleStartRankEdit = (product: Product) => {
    setEditingRankId(product.id);
    setRankInputValue(String(product.rank ?? ''));
  };

  const handleConfirmRankEdit = (product: Product) => {
    const newRank = parseInt(rankInputValue, 10);
    if (!isNaN(newRank) && newRank >= 1 && newRank <= products.length) {
      playSound('bid', soundEnabled);
      onAssignRank(product.id, newRank);
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.5 },
          colors: ['#ffaa40', '#9c40ff', '#00d2ff'],
        });
      } catch {}
    }
    setEditingRankId(null);
    setRankInputValue('');
  };

  const handleMoveRank = (product: Product, direction: 'up' | 'down') => {
    const currentRank = product.rank ?? 0;
    const newRank = direction === 'up' ? currentRank - 1 : currentRank + 1;
    if (newRank >= 1 && newRank <= products.length) {
      playSound('click', soundEnabled);
      onAssignRank(product.id, newRank);
    }
  };

  const handleDelist = (product: Product) => {
    if (window.confirm(`Permanently delist "${product.name}" from the directory?`)) {
      playSound('outbid', soundEnabled);
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
    <div className="min-h-screen bg-neutral-100 text-neutral-900 pb-24">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-300 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 shadow-2xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToDirectory}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Directory</span>
            </button>
            <div className="h-4 w-px bg-neutral-300" />
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-black text-white font-black text-xs shadow-2xs">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-mono font-bold text-neutral-800">
                /accept
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Test New Submission</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-300 pb-0">
          <button
            type="button"
            onClick={() => { setActiveView('submissions'); playSound('click', soundEnabled); }}
            className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 ${
              activeView === 'submissions'
                ? 'bg-white border-neutral-300 text-black shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Submissions Queue</span>
            {pendingCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[9px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setActiveView('products'); playSound('click', soundEnabled); }}
            className={`flex items-center gap-1.5 rounded-t-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer border border-b-0 ${
              activeView === 'products'
                ? 'bg-white border-neutral-300 text-black shadow-2xs'
                : 'bg-transparent border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span>Live Products</span>
            <span className="ml-1 rounded-full bg-black text-white px-1.5 py-0.2 text-[9px] font-bold">
              {products.length}
            </span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* SUBMISSIONS QUEUE VIEW */}
        {/* ============================================================ */}
        {activeView === 'submissions' && (
          <>
            {/* Status Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setStatusFilter('under_review')}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'under_review'
                    ? 'border-black bg-white ring-2 ring-black'
                    : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-1">
                  <span>Under Review</span>
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">{pendingCount}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Pending approval</p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('approved')}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'approved'
                    ? 'border-black bg-white ring-2 ring-black'
                    : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
                  <span>Approved</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">{approvedCount}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Live in directory</p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('rejected')}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'rejected'
                    ? 'border-black bg-white ring-2 ring-black'
                    : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-neutral-600 mb-1">
                  <span>Rejected</span>
                  <XCircle className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">{rejectedCount}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Declined entries</p>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer shadow-2xs ${
                  statusFilter === 'all'
                    ? 'border-black bg-white ring-2 ring-black'
                    : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-1">
                  <span>All Submissions</span>
                  <Filter className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">{submissions.length}</div>
                <p className="text-[11px] text-neutral-500 mt-1">Total in database</p>
              </button>
            </div>

            {/* Filters & Search Toolbar */}
            <div className="rounded-xl border border-neutral-300 bg-white p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search submissions by name, URL, or submitter..."
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 pl-8.5 pr-3 py-1.5 text-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {(['under_review', 'approved', 'rejected', 'all'] as const).map((filter) => {
                  const labels: Record<string, string> = {
                    under_review: `Under Review (${pendingCount})`,
                    approved: `Approved (${approvedCount})`,
                    rejected: `Rejected (${rejectedCount})`,
                    all: `All (${submissions.length})`,
                  };
                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setStatusFilter(filter)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        statusFilter === filter
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      {labels[filter]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submissions List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  {statusFilter === 'under_review' && 'Submissions Awaiting Approval'}
                  {statusFilter === 'approved' && 'Approved & Active Directory Items'}
                  {statusFilter === 'rejected' && 'Rejected Submissions'}
                  {statusFilter === 'all' && 'All Submissions'}
                  <span className="ml-1.5 font-normal text-neutral-500">
                    ({filteredSubmissions.length})
                  </span>
                </h2>
                {submissions.length === 0 && (
                  <button
                    type="button"
                    onClick={onSeedSampleSubmissions}
                    className="text-xs font-bold text-neutral-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Load Sample Queue</span>
                  </button>
                )}
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 sm:p-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                    {statusFilter === 'under_review' ? (
                      <Check className="h-6 w-6 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-neutral-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-black">
                      {statusFilter === 'under_review'
                        ? 'No submissions currently under review!'
                        : 'No submissions found matching filter.'}
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      {statusFilter === 'under_review'
                        ? 'All incoming websites have been reviewed. When users submit their websites, they will appear here.'
                        : 'Try changing your search keywords or switching filters.'}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={onOpenSubmitModal}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Submit a Test Website</span>
                    </button>
                    <button
                      type="button"
                      onClick={onSeedSampleSubmissions}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-800 hover:border-black transition-all cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Load Sample Test Queue</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((sub) => {
                    const logoSrc = sub.logoUrl || getWebsiteFavicon(sub.url);
                    return (
                      <div
                        key={sub.id}
                        className={`rounded-xl border bg-white p-4 sm:p-5 transition-all shadow-2xs ${
                          sub.status === 'under_review'
                            ? 'border-amber-300 ring-1 ring-amber-200'
                            : sub.status === 'approved'
                            ? 'border-neutral-300'
                            : 'border-neutral-200 bg-neutral-50/70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xs">
                              {logoSrc ? (
                                <img
                                  src={logoSrc}
                                  alt={sub.name}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-xs font-black text-black">
                                  {sub.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-black text-black tracking-tight truncate">{sub.name}</h3>
                                <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-700">{sub.category}</span>
                                {sub.status === 'under_review' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Under Review
                                  </span>
                                )}
                                {sub.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                    <Check className="h-3 w-3 text-emerald-700" />
                                    Approved & Live
                                  </span>
                                )}
                                {sub.status === 'rejected' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200 border border-neutral-300 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                                    <X className="h-3 w-3 text-neutral-600" />
                                    Rejected
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-600 leading-normal line-clamp-2">{sub.tagline}</p>
                              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500">
                                <a href={sub.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-black font-semibold hover:underline">
                                  <Globe className="h-3 w-3 text-neutral-500" />
                                  <span className="truncate max-w-[200px]">{sub.url}</span>
                                  <ExternalLink className="h-2.5 w-2.5 text-neutral-400" />
                                </a>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-neutral-400" />
                                  <span>{sub.backerName || 'Anonymous'}</span>
                                </div>
                                {sub.twitterHandle && (
                                  <div className="flex items-center gap-1">
                                    <Twitter className="h-3 w-3 text-neutral-400" />
                                    <span>{sub.twitterHandle}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-neutral-400" />
                                  <span>{formatTimestamp(sub.submittedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                            {sub.status === 'under_review' && (
                              <>
                                <button type="button" onClick={() => handleAccept(sub)} className="flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-xs font-black text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs active:scale-[0.98]">
                                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                  <span>Accept</span>
                                </button>
                                <button type="button" onClick={() => handleReject(sub.id)} className="flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer shadow-2xs">
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                                <button type="button" onClick={() => handleOpenEdit(sub)} title="Edit details" className="rounded-xl border border-neutral-300 bg-white p-2 text-neutral-600 hover:border-black hover:text-black transition-all cursor-pointer shadow-2xs">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                            {sub.status === 'approved' && (
                              <>
                                <button type="button" onClick={onBackToDirectory} className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs">
                                  <Eye className="h-3.5 w-3.5 text-neutral-500" />
                                  <span>View Live</span>
                                </button>
                                <button type="button" onClick={() => handleReject(sub.id)} className="flex items-center gap-1 rounded-xl border border-neutral-300 bg-white px-2.5 py-2 text-xs font-bold text-neutral-600 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer shadow-2xs" title="Revoke Approval">
                                  <span>Revoke</span>
                                </button>
                              </>
                            )}
                            {sub.status === 'rejected' && (
                              <>
                                <button type="button" onClick={() => { playSound('click', soundEnabled); onRestoreSubmission(sub.id); }} className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs">
                                  <RotateCcw className="h-3.5 w-3.5 text-neutral-500" />
                                  <span>Restore to Queue</span>
                                </button>
                                <button type="button" onClick={() => { if (window.confirm(`Permanently delete "${sub.name}"?`)) { onDeleteSubmission(sub.id); } }} className="rounded-xl border border-neutral-300 bg-white p-2 text-neutral-400 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer shadow-2xs" title="Delete permanently">
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
        {/* LIVE PRODUCTS MANAGEMENT VIEW */}
        {/* ============================================================ */}
        {activeView === 'products' && (
          <>
            {/* Products Metrics */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 mb-1">
                  <span>Top 3 (Featured)</span>
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">3</div>
                <p className="text-[11px] text-neutral-500 mt-1">Auto BorderBeam enabled</p>
              </div>
              <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
                  <span>Live Products</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">{products.length}</div>
                <p className="text-[11px] text-neutral-500 mt-1">In the directory</p>
              </div>
              <div className="rounded-xl border border-neutral-300 bg-white p-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-600 mb-1">
                  <span>Total Upvotes</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-black">
                  {products.reduce((sum, p) => sum + (p.upvotes ?? 0), 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-neutral-500 mt-1">Across all products</p>
              </div>
            </div>

            {/* Products Search & Filter */}
            <div className="rounded-xl border border-neutral-300 bg-white p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search live products by name, category, or URL..."
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 pl-8.5 pr-3 py-1.5 text-xs text-black placeholder-neutral-400 focus:border-black focus:bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
                {productSearchQuery && (
                  <button type="button" onClick={() => setProductSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {(['All', 'AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      productCategoryFilter === cat
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Live Products Management
                  <span className="ml-1.5 font-normal text-neutral-500">({filteredProducts.length})</span>
                </h2>
                <p className="text-[11px] text-neutral-500 hidden sm:block">
                  Click rank to edit. Top 3 auto-receive BorderBeam on the directory.
                </p>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 sm:p-12 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-black">No products found</h3>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">Try changing your search or category filter.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProducts.map((product) => {
                    const isTopThree = (product.rank ?? 0) <= 3;
                    const logoSrc = product.logoUrl || getWebsiteFavicon(product.url);
                    const isEditingRank = editingRankId === product.id;

                    const productRow = (
                      <div
                        key={product.id}
                        className={`rounded-xl border bg-white p-4 transition-all shadow-2xs ${
                          isTopThree
                            ? 'border-amber-300 ring-1 ring-amber-200'
                            : 'border-neutral-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Rank Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-black text-sm shadow-2xs ${
                              product.rank === 1
                                ? 'bg-amber-400 text-white'
                                : product.rank === 2
                                ? 'bg-neutral-400 text-white'
                                : product.rank === 3
                                ? 'bg-orange-600 text-white'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}>
                              {product.rank === 1 ? <Crown className="h-4 w-4" /> : `#${product.rank}`}
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-2xs">
                              {logoSrc ? (
                                <img
                                  src={logoSrc}
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                />
                              ) : (
                                <span className="text-xs font-black text-black">{product.name.slice(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-black tracking-tight truncate">{product.name}</h3>
                                {product.verified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                                {isTopThree && (
                                  <span className="rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 shrink-0">
                                    FEATURED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 truncate">{product.tagline}</p>
                            </div>
                          </div>

                          {/* Meta: Category & Upvotes */}
                          <div className="flex items-center gap-3 shrink-0 text-[11px] text-neutral-500">
                            <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 font-bold text-neutral-700">
                              {product.category}
                            </span>
                            <div className="flex items-center gap-1 font-bold">
                              <ChevronUp className="h-3 w-3 text-emerald-600" />
                              <span>{(product.upvotes ?? 0).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Rank Editor */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isEditingRank ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={1}
                                  max={products.length}
                                  value={rankInputValue}
                                  onChange={(e) => setRankInputValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmRankEdit(product);
                                    if (e.key === 'Escape') { setEditingRankId(null); setRankInputValue(''); }
                                  }}
                                  autoFocus
                                  className="w-16 rounded-lg border border-black bg-white px-2 py-1 text-xs font-bold text-black text-center focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <button type="button" onClick={() => handleConfirmRankEdit(product)} className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 transition-colors cursor-pointer">
                                  <Check className="h-3 w-3" />
                                </button>
                                <button type="button" onClick={() => { setEditingRankId(null); setRankInputValue(''); }} className="rounded-lg bg-neutral-200 p-1.5 text-neutral-600 hover:bg-neutral-300 transition-colors cursor-pointer">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartRankEdit(product)}
                                title="Click to set rank manually"
                                className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-bold text-black hover:border-black hover:bg-neutral-50 transition-all cursor-pointer shadow-2xs"
                              >
                                <ArrowUpDown className="h-3 w-3 text-neutral-500" />
                                <span>Rank</span>
                              </button>
                            )}

                            {/* Move up / down */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveRank(product, 'up')}
                                disabled={(product.rank ?? 0) <= 1}
                                className="rounded-md bg-neutral-100 p-1 text-neutral-600 hover:bg-black hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveRank(product, 'down')}
                                disabled={(product.rank ?? 0) >= products.length}
                                className="rounded-md bg-neutral-100 p-1 text-neutral-600 hover:bg-black hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Move down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {/* Delist Button */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-neutral-300 bg-white p-2 text-neutral-600 hover:border-black hover:text-black transition-all cursor-pointer shadow-2xs"
                              title="Visit website"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDelist(product)}
                              className="rounded-lg border border-neutral-300 bg-white p-2 text-neutral-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer shadow-2xs"
                              title={`Delist "${product.name}" from directory`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );

                    if (isTopThree) {
                      return (
                        <BorderBeam
                          key={product.id}
                          duration={5}
                          size={200}
                          colorFrom="#ffaa40"
                          colorMid="#9c40ff"
                          colorTo="#00d2ff"
                        >
                          {productRow}
                        </BorderBeam>
                      );
                    }

                    return productRow;
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Edit Submission Modal */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-300 bg-white shadow-2xl p-5 sm:p-6 text-black animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setEditingSubmission(null)}
              className="absolute right-3.5 top-3.5 rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white font-bold text-xs shadow-2xs">
                <Edit3 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-black">Edit Submission</h3>
                <p className="text-xs text-neutral-500">Modify details before approving</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">Website Name</label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">Website URL</label>
                <input type="text" required value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">Tagline</label>
                <textarea required rows={2} value={editTagline} onChange={(e) => setEditTagline(e.target.value)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">Category</label>
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value as Category)} className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black">
                  <option value="AI Tools">AI Tools</option>
                  <option value="Developer Tools">Developer Tools</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Design & UI">Design & UI</option>
                  <option value="SaaS & Indie">SaaS & Indie</option>
                  <option value="Crypto & Web3">Crypto & Web3</option>
                </select>
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditingSubmission(null)} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-bold text-neutral-800 hover:border-black">Cancel</button>
                <button type="submit" className="rounded-xl bg-black px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
