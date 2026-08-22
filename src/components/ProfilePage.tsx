import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2, Globe, Mail, Calendar, Trash2, LogOut, Flame } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';
import { Product } from '../types';
import { getWebsiteFavicon } from '../utils/logo';
import { ProductLogo } from './ProductLogo';

interface ProfilePageProps {
  user: User;
  onBack: () => void;
  onSignOut?: () => void;
  onDeleteProduct?: (productId: string) => void;
}

const mapDbProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  rank: row.rank as number,
  previousRank: (row.previous_rank as number) || (row.rank as number),
  name: row.name as string,
  tagline: row.tagline as string,
  url: row.url as string,
  logoUrl: (row.logo_url as string) || getWebsiteFavicon(row.url as string),
  twitterHandle: (row.twitter_handle as string) || undefined,
  category: row.category as Product['category'],
  totalBid: (row.total_bid as number) || 0,
  upvotes: (row.upvotes as number) || 0,
  clicks: (row.clicks as number) || 0,
  createdAt: (row.created_at as number) || Date.now(),
  updatedAt: (row.updated_at as number) || Date.now(),
  verified: (row.verified as boolean) || false,
  isUserOwned: true,
  submittedBy: (row.submitted_by as string) || undefined,
  description: (row.description as string) || '',
  whatItDoes: (row.what_it_does as string[]) || [],
  features: (row.features as Product['features']) || [],
  useCases: (row.use_cases as Product['useCases']) || [],
  targetAudience: (row.target_audience as string) || '',
  pricingModel: (row.pricing_model as string) || '',
  keyHighlights: (row.key_highlights as Product['keyHighlights']) || [],
  bidHistory: (row.bid_history as Product['bidHistory']) || [],
});

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBack, onSignOut, onDeleteProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('submitted_by', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setProducts(data.map(mapDbProduct));
      }
      setLoading(false);
    }
    fetchProducts();
  }, [user.id]);

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Remove this product from the directory?')) return;
    setDeletingId(productId);
    try {
      await supabase.from('products').delete().eq('id', productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      onDeleteProduct?.(productId);
    } catch {}
    setDeletingId(null);
  };

  const liveCount = products.length;

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
          <h1 className="text-sm font-black text-black flex-1">My Products</h1>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          )}
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
        <div className="rounded-xl border border-neutral-200 bg-white p-3 text-center">
          <div className="text-lg font-black text-black">{liveCount}</div>
          <div className="text-[10px] font-bold text-neutral-500 uppercase">Live Products</div>
        </div>

        {/* Products List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500">
            Products ({products.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-neutral-400 animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
              <Globe className="mx-auto h-8 w-8 text-neutral-300 mb-3" />
              <p className="text-sm font-bold text-neutral-600">No products yet</p>
              <p className="text-xs text-neutral-400 mt-1">Submit a website to see it here</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <ProductLogo
                    src={product.logoUrl || getWebsiteFavicon(product.url)}
                    alt={product.name}
                    containerClassName="relative h-10 w-10 rounded-lg overflow-hidden border border-neutral-200 bg-white shrink-0 flex items-center justify-center shadow-2xs"
                    iconClassName="h-5 w-5 text-black shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-black truncate">{product.name}</h4>
                      <span className="text-[10px] font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded">
                        Live
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{product.tagline}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                        <Globe className="h-2.5 w-2.5" />
                        {product.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600 font-mono font-bold">
                        <Flame className="h-3 w-3 text-black shrink-0" />
                        <span>{product.dinoScore ?? 0} pts</span>
                      </span>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-black transition-colors"
                      >
                        Visit
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer disabled:opacity-50 shrink-0"
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};
