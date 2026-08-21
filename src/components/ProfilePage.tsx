import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Clock, CheckCircle2, XCircle, Loader2, FileText, Globe, Mail, Calendar, Pencil, Save, X, AlertCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { WebsiteSubmission, SubmissionStatus, Category } from '../types';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
}

const CATEGORIES: Category[] = [
  'AI Tools', 'Developer Tools', 'Productivity', 'Design & UI', 'SaaS & Indie', 'Crypto & Web3',
];

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  under_review: {
    label: 'Under Review',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  approved: {
    label: 'Approved & Live',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: 'Not Approved',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

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
  status: row.status as SubmissionStatus,
  submittedAt: row.submitted_at as number,
  reviewedAt: (row.reviewed_at as number) || undefined,
  rejectionReason: (row.rejection_reason as string) || undefined,
});

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack }) => {
  const [submissions, setSubmissions] = useState<WebsiteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; tagline: string; url: string; category: Category }>({
    name: '', tagline: '', url: '', category: 'AI Tools',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchSubmissions() {
      // Fetch by submitted_by OR by matching email (for legacy submissions)
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .or(`submitted_by.eq.${user.id},backer_email.eq.${user.email || '__none__'}`)
        .order('submitted_at', { ascending: false });
      if (!error && data) {
        setSubmissions(data.map(mapDbSubmission));
      }
      setLoading(false);
    }
    fetchSubmissions();
  }, [user.id, user.email]);

  const startEditing = (sub: WebsiteSubmission) => {
    setEditingId(sub.id);
    setEditForm({ name: sub.name, tagline: sub.tagline, url: sub.url, category: sub.category });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = async (sub: WebsiteSubmission) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          name: editForm.name,
          tagline: editForm.tagline,
          url: editForm.url,
          category: editForm.category,
        })
        .eq('id', sub.id);
      if (!error) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === sub.id
              ? { ...s, name: editForm.name, tagline: editForm.tagline, url: editForm.url, category: editForm.category }
              : s
          )
        );
      }
    } catch {}
    setEditingId(null);
    setSaving(false);
  };

  const canEdit = () => true;

  const pendingCount = submissions.filter((s) => s.status === 'under_review').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-neutral-50 text-black font-sans">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-sm font-black text-black">My Submissions</h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 space-y-6">
        {/* User Info Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className="h-14 w-14 rounded-full object-cover ring-2 ring-neutral-100"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-white text-lg font-black">
                {(user.email?.[0] || 'U').toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5">
              <h2 className="text-base font-black text-black">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Mail className="h-3 w-3" />
                <span>{user.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Calendar className="h-3 w-3" />
                <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
            <div className="text-lg font-black text-amber-700">{pendingCount}</div>
            <div className="text-[10px] font-bold text-amber-600 uppercase">Pending</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
            <div className="text-lg font-black text-emerald-700">{approvedCount}</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase">Approved</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
            <div className="text-lg font-black text-red-700">{rejectedCount}</div>
            <div className="text-[10px] font-bold text-red-600 uppercase">Rejected</div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Submissions ({submissions.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
              <p className="text-sm font-bold text-neutral-600">No submissions yet</p>
              <p className="text-xs text-neutral-400 mt-1">Submit a website to see it here</p>
            </div>
          ) : (
            submissions.map((sub) => {
              const config = STATUS_CONFIG[sub.status];
              const isEditing = editingId === sub.id;
              return (
                <div
                  key={sub.id}
                  className={`rounded-xl border bg-white p-4 shadow-xs transition-shadow ${isEditing ? 'border-black ring-1 ring-black' : 'border-neutral-200 hover:shadow-sm'}`}
                >
                  {/* Status Badge + Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${config.bg} ${config.color}`}>
                      {config.icon}
                      {config.label}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {canEdit() && !isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditing(sub)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-600 hover:border-black hover:text-black transition-all cursor-pointer"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                          Edit
                        </button>
                      )}
                      {isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEdit(sub)}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-lg bg-black px-2.5 py-1 text-[10px] font-bold text-white hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Save className="h-2.5 w-2.5" />
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[10px] font-bold text-neutral-600 hover:text-red-600 transition-all cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    /* Edit Form */
                    <div className="space-y-3 mt-2">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">Tagline</label>
                        <input
                          type="text"
                          value={editForm.tagline}
                          onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">URL</label>
                        <input
                          type="url"
                          value={editForm.url}
                          onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase mb-1 block">Category</label>
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Editing will reset status to "Under Review"</span>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <>
                      <div className="flex items-start gap-3">
                        <img
                          src={sub.logoUrl || `https://www.google.com/s2/favicons?domain=${new URL(sub.url).hostname}&sz=64`}
                          alt={sub.name}
                          className="h-10 w-10 rounded-lg object-cover border border-neutral-100 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-black truncate">{sub.name}</h4>
                          <p className="text-xs text-neutral-500 truncate mt-0.5">{sub.tagline}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                              <Globe className="h-2.5 w-2.5" />
                              {sub.category}
                            </span>
                            <a
                              href={sub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-black transition-colors"
                            >
                              Visit
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {sub.status === 'rejected' && sub.rejectionReason && (
                        <div className="mt-3 rounded-lg bg-red-50 border border-red-100 p-2.5">
                          <p className="text-[11px] font-bold text-red-600 mb-0.5">Reason:</p>
                          <p className="text-[11px] text-red-500">{sub.rejectionReason}</p>
                        </div>
                      )}

                      {/* Review Date */}
                      {sub.reviewedAt && (
                        <div className="mt-2 text-[10px] text-neutral-400">
                          Reviewed {new Date(sub.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
