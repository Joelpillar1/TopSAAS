import { supabase } from './supabase';
import { Product, Category, Comment, WebsiteSubmission } from '../types';

// ── Submissions ──

/** Map a Supabase DB row to our WebsiteSubmission type */
export const mapDbSubmission = (row: Record<string, unknown>): WebsiteSubmission => ({
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
  autoRelaunch: Boolean(row.auto_relaunch ?? row.autoRelaunch) || undefined,
  autoRelaunchPaid: Boolean(row.auto_relaunch_paid ?? row.autoRelaunchPaid) || undefined,
  autoRelaunchPaidAt: (row.auto_relaunch_paid_at as number) || undefined,
  verified: Boolean(row.verified) || false,
  scheduledLaunchWeek: (row.scheduled_launch_week as number) || undefined,
  scheduledLaunchDate: (row.scheduled_launch_date as number) || undefined,
});

/** Map a WebsiteSubmission to Supabase insert/update format */
export const toDbSubmission = (sub: WebsiteSubmission) => {
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
    auto_relaunch: sub.autoRelaunch || false,
    auto_relaunch_paid: sub.autoRelaunchPaid || false,
    auto_relaunch_paid_at: sub.autoRelaunchPaidAt || null,
    verified: sub.verified || false,
    scheduled_launch_week: sub.scheduledLaunchWeek || null,
    scheduled_launch_date: sub.scheduledLaunchDate || null,
  };
};

/**
 * Lightweight columns for the submissions queue list.
 * Excludes heavy base64 `screenshots` and long text to cut initial egress by ~95%.
 */
export const SUBMISSION_QUEUE_COLUMNS = [
  'id',
  'name',
  'tagline',
  'url',
  'logo_url',
  'category',
  'backer_name',
  'backer_email',
  'status',
  'submitted_at',
  'reviewed_at',
  'rejection_reason',
  'target_audience',
  'pricing_model',
  'submitted_by',
  'offer_discount',
  'offer_code',
  'offer_url',
  'offer_details',
  'auto_relaunch',
  'auto_relaunch_paid',
  'auto_relaunch_paid_at',
  'verified',
  'scheduled_launch_week',
  'scheduled_launch_date',
].join(',');

/** Fetch full submission details on-demand (e.g. when reviewing in admin modal) */
export async function loadSubmissionById(id: string): Promise<WebsiteSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapDbSubmission(data);
  } catch {
    return null;
  }
}

// ── Products ──

/** Map a Supabase row to our Product type */
export const mapDbProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  rank: row.rank as number,
  previousRank: (row.previous_rank as number) || undefined,
  name: row.name as string,
  tagline: row.tagline as string,
  url: row.url as string,
  logoUrl: (row.logo_url as string) || undefined,
  screenshots: (row.screenshots as string[]) || undefined,
  demoVideoUrl: (row.demo_video_url as string) || undefined,
  twitterHandle: (row.twitter_handle as string) || undefined,
  socials: (row.socials as Product['socials']) || undefined,
  creatorName: (row.creator_name as string) || undefined,
  creatorUsername: (row.creator_username as string) || undefined,
  creatorXHandle: (row.creator_x_handle as string) || undefined,
  creatorAvatar: (row.creator_avatar as string) || undefined,
  creatorRole: (row.creator_role as string) || undefined,
  category: row.category as Category,
  upvotes: (row.upvotes as number) || 0,
  dinoScore: (row.dino_score as number) || 0,
  totalBid: (row.total_bid as number) || 0,
  clicks: (row.clicks as number) || 0,
  createdAt: row.created_at as number,
  updatedAt: row.updated_at as number,
  isUserOwned: false,
  submittedBy: (row.submitted_by as string) || undefined,
  verified: (row.verified as boolean) || false,
  isSponsored: (row.is_sponsored as boolean) || false,
  sponsorTier: (row.sponsor_tier as Product['sponsorTier']) || undefined,
  sponsorStartedAt: (row.sponsor_started_at as number) || undefined,
  sponsorExpiresAt: (row.sponsor_expires_at as number) || undefined,
  sponsorClicks: (row.sponsor_clicks as number) || 0,
  sponsorContactEmail: (row.sponsor_contact_email as string) || undefined,
  description: (row.description as string) || undefined,
  problemItSolves: (row.problem_it_solves as string) || undefined,
  solution: (row.solution as string) || undefined,
  uniqueSellingPoint: (row.unique_selling_point as string) || undefined,
  whatItDoes: (row.what_it_does as string[]) || undefined,
  features: (row.features as Product['features']) || undefined,
  useCases: (row.use_cases as Product['useCases']) || undefined,
  targetAudience: (row.target_audience as string) || undefined,
  pricingModel: (row.pricing_model as string) || undefined,
  keyHighlights: (row.key_highlights as Product['keyHighlights']) || undefined,
  bidHistory: (row.bid_history as Product['bidHistory']) || [],
  offerDiscount: (row.offer_discount as string) || undefined,
  offerCode: (row.offer_code as string) || undefined,
  offerUrl: (row.offer_url as string) || undefined,
  offerDetails: (row.offer_details as string) || undefined,
  autoRelaunch: Boolean(row.auto_relaunch ?? row.autoRelaunch) || undefined,
  relaunchWeeks: (row.relaunch_weeks as number[]) || (row.relaunchWeeks as number[]) || undefined,
  isRelaunched: Boolean(row.is_relaunched ?? row.isRelaunched) || undefined,
  lastRelaunchedAt: (row.last_relaunched_at as number) || (row.lastRelaunchedAt as number) || undefined,
  scheduledLaunchWeek: (row.scheduled_launch_week as number) || (row.scheduledLaunchWeek as number) || undefined,
  scheduledLaunchDate: (row.scheduled_launch_date as number) || (row.scheduledLaunchDate as number) || undefined,
});

/** Map a Product to Supabase insert/update format */
export const toDbProduct = (p: Product) => {
  const isUuid = p.submittedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.submittedBy);
  return {
    id: p.id,
    rank: p.rank,
    previous_rank: p.previousRank || null,
    name: p.name,
    tagline: p.tagline,
    url: p.url,
    logo_url: p.logoUrl || null,
    screenshots: p.screenshots || null,
    demo_video_url: p.demoVideoUrl || null,
    twitter_handle: p.twitterHandle || null,
    socials: p.socials || null,
    creator_name: p.creatorName || null,
    creator_username: p.creatorUsername || null,
    creator_x_handle: p.creatorXHandle || null,
    creator_avatar: p.creatorAvatar || null,
    creator_role: p.creatorRole || null,
    category: p.category,
    upvotes: p.upvotes ?? 0,
    dino_score: p.dinoScore ?? 0,
    total_bid: p.totalBid ?? 0,
    clicks: p.clicks ?? 0,
    created_at: p.createdAt || Date.now(),
    updated_at: p.updatedAt || Date.now(),
    is_user_owned: false,
    submitted_by: isUuid ? p.submittedBy : null,
    verified: p.verified || false,
    scheduled_launch_week: p.scheduledLaunchWeek || null,
    scheduled_launch_date: p.scheduledLaunchDate || null,
    description: p.description || null,
    problem_it_solves: p.problemItSolves || null,
    solution: p.solution || null,
    unique_selling_point: p.uniqueSellingPoint || null,
    what_it_does: p.whatItDoes || null,
    features: p.features || null,
    use_cases: p.useCases || null,
    target_audience: p.targetAudience || null,
    pricing_model: p.pricingModel || null,
    key_highlights: p.keyHighlights || null,
    bid_history: p.bidHistory || [],
    offer_discount: p.offerDiscount || null,
    offer_code: p.offerCode || null,
    offer_url: p.offerUrl || null,
    offer_details: p.offerDetails || null,
    is_sponsored: p.isSponsored || false,
    sponsor_expires_at: p.sponsorExpiresAt || null,
    auto_relaunch: p.autoRelaunch || false,
    relaunch_weeks: p.relaunchWeeks || [],
    last_relaunched_at: p.lastRelaunchedAt || null,
  };
};

/**
 * Deterministic published-listing id: an approved submission always owns exactly
 * one product row, `prod-<submissionId>`. Both sides deliberate this id so no
 * URL matching or duplicate reconciliation is ever needed.
 */
export function publishedProductId(submissionId: string): string {
  if (!submissionId) return `prod-${Date.now()}`;
  return submissionId.startsWith('prod-') ? submissionId : `prod-${submissionId}`;
}

/** Convert a WebsiteSubmission to a live Product object */
export function submissionToProduct(sub: WebsiteSubmission, rank: number = 1): Product {
  const domain = sub.url.replace(/^https?:\/\//i, '').split('/')[0];
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  const prodId = publishedProductId(sub.id);

  const whatItDoesList: string[] = [];
  if (sub.problemItSolves) whatItDoesList.push(`Problem: ${sub.problemItSolves}`);
  if (sub.solution) whatItDoesList.push(`Solution: ${sub.solution}`);
  if (sub.uniqueSellingPoint) whatItDoesList.push(`Difference: ${sub.uniqueSellingPoint}`);

  const featuresList = [];
  if (sub.solution) {
    featuresList.push({ title: 'Core Solution', description: sub.solution, tag: 'Superpower' });
  }
  if (sub.uniqueSellingPoint) {
    featuresList.push({ title: 'Key Advantage', description: sub.uniqueSellingPoint, tag: 'Differentiator' });
  }
  if (sub.problemItSolves) {
    featuresList.push({ title: 'Problem Solved', description: sub.problemItSolves, tag: 'Value' });
  }

  return {
    id: prodId,
    rank,
    previousRank: rank,
    name: sub.name,
    tagline: sub.tagline,
    url: sub.url,
    logoUrl: sub.logoUrl || favicon,
    screenshots: sub.screenshots && sub.screenshots.length > 0 ? sub.screenshots : undefined,
    demoVideoUrl: sub.demoVideoUrl || undefined,
    twitterHandle: sub.twitterHandle || undefined,
    socials: sub.socials && sub.socials.length > 0 ? sub.socials : undefined,
    creatorName: sub.creatorName || undefined,
    creatorUsername: sub.creatorUsername || undefined,
    creatorXHandle: sub.creatorXHandle || undefined,
    creatorAvatar: sub.creatorAvatar || undefined,
    creatorRole: sub.creatorRole || undefined,
    category: sub.category,
    totalBid: 0,
    dinoScore: 0,
    upvotes: 0,
    clicks: 0,
    createdAt: sub.scheduledLaunchDate || sub.submittedAt || Date.now(),
    updatedAt: Date.now(),
    verified: Boolean(sub.verified) || false,
    autoRelaunch: sub.autoRelaunch || undefined,
    autoRelaunchPaid: sub.autoRelaunchPaid || undefined,
    autoRelaunchPaidAt: sub.autoRelaunchPaidAt || undefined,
    isUserOwned: false,
    submittedBy: sub.submittedBy,
    scheduledLaunchWeek: sub.scheduledLaunchWeek,
    scheduledLaunchDate: sub.scheduledLaunchDate,
    description: sub.description || `${sub.name} is a high-quality product in the ${sub.category} ecosystem. ${sub.tagline}.`,
    problemItSolves: sub.problemItSolves || undefined,
    solution: sub.solution || undefined,
    uniqueSellingPoint: sub.uniqueSellingPoint || undefined,
    whatItDoes: whatItDoesList,
    features: featuresList.length > 0 ? featuresList : undefined,
    useCases: sub.targetAudience ? [
      { title: 'Target Audience & Use Case', description: `Specially crafted for ${sub.targetAudience}`, audience: sub.targetAudience }
    ] : undefined,
    targetAudience: sub.targetAudience || undefined,
    pricingModel: sub.pricingModel || undefined,
    offerDiscount: sub.offerDiscount || undefined,
    offerCode: sub.offerCode || undefined,
    offerUrl: sub.offerUrl || undefined,
    offerDetails: sub.offerDetails || undefined,
    keyHighlights: [
      { label: 'Submitted By', value: sub.backerName || 'Community Creator' },
      { label: 'Status', value: 'Live on Directory' }
    ],
    bidHistory: [],
    relaunchWeeks: sub.relaunchWeeks,
    isRelaunched: sub.isRelaunched,
    lastRelaunchedAt: sub.lastRelaunchedAt,
  };
}

/**
 * Products are written through the single `toDbProduct` mapper above. A submission
 * is published exactly once, with every column present, so there is no schema
 * probing or field-stripping to do before a write.
 */

/**
 * Lightweight columns for directory & leaderboard listings.
 * Excludes heavy `screenshots` (which can contain megabytes of base64 data)
 * as well as rarely-needed raw arrays, saving ~99% of Supabase bandwidth on directory loads.
 */
export const PRODUCT_DIRECTORY_COLUMNS = [
  'id',
  'rank',
  'previous_rank',
  'name',
  'tagline',
  'url',
  'logo_url',
  'demo_video_url',
  'twitter_handle',
  'socials',
  'creator_name',
  'creator_username',
  'creator_x_handle',
  'creator_avatar',
  'creator_role',
  'category',
  'upvotes',
  'dino_score',
  'total_bid',
  'clicks',
  'created_at',
  'updated_at',
  'submitted_by',
  'verified',
  'is_sponsored',
  'sponsor_tier',
  'sponsor_started_at',
  'sponsor_expires_at',
  'sponsor_clicks',
  'pricing_model',
  'target_audience',
  'offer_discount',
  'offer_code',
  'offer_url',
  'offer_details',
  'auto_relaunch',
  'relaunch_weeks',
  'is_relaunched',
  'last_relaunched_at',
  'scheduled_launch_week',
  'scheduled_launch_date',
].join(',');

/** Load all products for the directory/homepage using lightweight columns */
export async function loadProducts(): Promise<Product[] | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_DIRECTORY_COLUMNS)
    .order('rank', { ascending: true });
  if (error || !data) return null;
  return (data as unknown as Record<string, unknown>[]).map(mapDbProduct);
}

/** Fetch full product details on-demand (including screenshots, features, rich description) */
export async function loadProductById(id: string): Promise<Product | null> {
  try {
    const bare = id.startsWith('prod-') ? id.replace(/^prod-/, '') : id;
    const canonical = id.startsWith('prod-') ? id : `prod-${id}`;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`id.eq.${id},id.eq.${canonical},id.eq.${bare}`)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return mapDbProduct(data);
  } catch {
    return null;
  }
}

/** Guaranteed single-request batched rank updates in Supabase — only touches rank columns */
export async function saveProductRanksDirect(products: Product[]): Promise<void> {
  if (products.length === 0) return;
  try {
    // Keep the real DB upvote counts — never write stale client zeros over them
    const rankRows = products.map((p) => ({ id: p.id, upvotes: p.upvotes ?? 0 }));
    await preserveExistingCounters(rankRows);
    // Use individual UPDATEs so we never overwrite rich columns (problem, solution, offers, etc.)
    await Promise.all(
      products.map((p, i) =>
        supabase
          .from('products')
          .update({
            rank: p.rank,
            previous_rank: p.previousRank || p.rank,
            upvotes: rankRows[i].upvotes,
            updated_at: Date.now()
          })
          .eq('id', p.id)
      )
    );
  } catch (err) {
    console.warn('saveProductRanksDirect note:', err);
  }
}

/** Save all products to Supabase in a single batched upsert */
export async function saveAllProducts(products: Product[]): Promise<void> {
  if (products.length === 0) return;
  try {
    const rows = products.map((p) => toDbProduct(p));
    // Preserve existing engagement counters so stale client state can't wipe them
    await preserveExistingCounters(rows);
    const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
    if (error) {
      await saveProductRanksDirect(products);
    }
  } catch (err) {
    console.warn('saveAllProducts fallback to rank save:', err);
    await saveProductRanksDirect(products);
  }
}

/** Insert a single product into Supabase with robust fallback */
export async function insertProductDirect(p: Product): Promise<boolean> {
  try {
    const row = toDbProduct(p);
    // Never clobber existing engagement counters (upvotes, clicks, bids, dino score)
    await preserveExistingCounters([row]);
    const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
    if (!error) return true;

    // Fallback: insert with all possible rich fields (skip columns that don't exist yet)
    console.warn('insertProductDirect primary insert failed, retrying minimal:', error.message);
    const minimal: Record<string, unknown> = {
      id: p.id,
      rank: p.rank,
      name: p.name,
      tagline: p.tagline,
      url: p.url,
      category: p.category,
      upvotes: p.upvotes ?? 0,
      dino_score: p.dinoScore ?? 0,
      total_bid: p.totalBid ?? 0,
      clicks: p.clicks ?? 0,
      created_at: p.createdAt || Date.now(),
      updated_at: p.updatedAt || Date.now(),
      verified: Boolean(p.verified) || false,
      is_user_owned: false,
    };
    if (p.logoUrl && !p.logoUrl.startsWith('data:image')) minimal.logo_url = p.logoUrl;
    if (p.twitterHandle) minimal.twitter_handle = p.twitterHandle;
    if (p.description) minimal.description = p.description;
    if (p.problemItSolves) minimal.problem_it_solves = p.problemItSolves;
    if (p.solution) minimal.solution = p.solution;
    if (p.uniqueSellingPoint) minimal.unique_selling_point = p.uniqueSellingPoint;
    if (p.targetAudience) minimal.target_audience = p.targetAudience;
    if (p.pricingModel) minimal.pricing_model = p.pricingModel;
    if (p.offerDiscount) minimal.offer_discount = p.offerDiscount;
    if (p.offerCode) minimal.offer_code = p.offerCode;
    if (p.offerUrl) minimal.offer_url = p.offerUrl;
    if (p.offerDetails) minimal.offer_details = p.offerDetails;
    if (p.creatorName) minimal.creator_name = p.creatorName;
    if (p.creatorXHandle) minimal.creator_x_handle = p.creatorXHandle;
    if (p.creatorAvatar) minimal.creator_avatar = p.creatorAvatar;
    if (p.creatorRole) minimal.creator_role = p.creatorRole;
    if (p.demoVideoUrl) minimal.demo_video_url = p.demoVideoUrl;
    if (p.submittedBy && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(p.submittedBy)) {
      minimal.submitted_by = p.submittedBy;
    }

    await preserveExistingCounters([minimal]);
    const { error: fallbackError } = await supabase.from('products').upsert(minimal, { onConflict: 'id' });
    return !fallbackError;
  } catch (err) {
    console.error('insertProductDirect failed:', err);
    return false;
  }
}

/** Update an existing product in Supabase */
export async function updateProductDirect(p: Product): Promise<boolean> {
  try {
    const row = toDbProduct(p);
    const { error } = await supabase.from('products').update(row).eq('id', p.id);
    return !error;
  } catch {
    return false;
  }
}

/** Delete a product from Supabase */
export async function deleteProduct(productId: string): Promise<void> {
  await supabase.from('products').delete().eq('id', productId);
}

// ── Game Scoring Anti-Cheat ──

/** Submit a verified game score to Supabase with real-time velocity validation (No maximum caps) */
export async function submitVerifiedGameScore(
  productId: string,
  score: number,
  durationMs: number
): Promise<{ success: boolean; score_added?: number; new_total_score?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('submit_verified_game_score', {
      p_product_id: productId,
      p_score: Math.floor(score),
      p_duration_ms: Math.floor(durationMs),
    });

    if (error || !data) {
      return { success: false, error: error?.message };
    }

    return data as { success: boolean; score_added?: number; new_total_score?: number; error?: string };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Network error' };
  }
}

// ── Upvotes ──

/** Toggle upvote via Supabase RPC (returns true if upvoted, false if un-upvoted) */
export async function toggleUpvote(productId: string): Promise<boolean | null> {
  const { data, error } = await supabase.rpc('toggle_upvote', { p_product_id: productId });
  if (error) {
    const altId = productId.startsWith('prod-') ? productId.replace(/^prod-/, '') : `prod-${productId}`;
    const retry = await supabase.rpc('toggle_upvote', { p_product_id: altId });
    if (!retry.error) return retry.data as boolean;
    return null;
  }
  return data as boolean;
}

/** Get current user's upvoted product IDs */
export async function getUserUpvotes(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('get_user_upvotes');
  if (error || !data) return new Set();
  const set = new Set<string>();
  for (const id of data as string[]) {
    set.add(id);
    if (id.startsWith('prod-')) {
      set.add(id.replace(/^prod-/, ''));
    } else {
      set.add(`prod-${id}`);
    }
  }
  return set;
}

/** Check if a product is upvoted, taking into account potential 'prod-' prefix variations */
export function isProductUpvoted(productId?: string | null, upvotedSet?: Set<string> | null): boolean {
  if (!upvotedSet || !productId) return false;
  if (upvotedSet.has(productId)) return true;
  if (productId.startsWith('prod-') && upvotedSet.has(productId.replace(/^prod-/, ''))) return true;
  if (!productId.startsWith('prod-') && upvotedSet.has(`prod-${productId}`)) return true;
  return false;
}

/**
 * Real upvote counts per product, derived from the `upvotes` table (the source
 * of truth for who actually upvoted). Keys are indexed under both 'prod-'
 * prefixed and raw id forms so lookups never miss due to prefix variations.
 */
export async function getUpvoteCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const { data, error } = await supabase.from('upvotes').select('product_id');
    if (error || !data) return counts;
    for (const row of data) {
      const pid = (row as { product_id?: string }).product_id;
      if (!pid) continue;
      const n = (counts.get(pid) ?? 0) + 1;
      counts.set(pid, n);
      const alt = pid.startsWith('prod-') ? pid.replace(/^prod-/, '') : `prod-${pid}`;
      counts.set(alt, n);
    }
  } catch { }
  return counts;
}

/**
 * Preserve existing DB counters (upvotes, clicks, dino_score, total_bid) when
 * upserting product rows, so stale client state can never wipe real engagement
 * data. Uses max() because these counters only ever grow in the DB via their
 * RPC paths — decrements (un-upvotes) are applied directly by toggle_upvote.
 */
async function preserveExistingCounters(rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return;
  const ids = rows.map((r) => r.id as string).filter(Boolean);
  if (ids.length === 0) return;
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, upvotes, clicks, dino_score, total_bid')
      .in('id', ids);
    if (error || !data) return;
    const existing = new Map<string, Record<string, unknown>>();
    for (const r of data) existing.set(r.id as string, r);
    for (const row of rows) {
      const cur = existing.get(row.id as string);
      if (!cur) continue;
      row.upvotes = Math.max((cur.upvotes as number) ?? 0, (row.upvotes as number) ?? 0);
      row.clicks = Math.max((cur.clicks as number) ?? 0, (row.clicks as number) ?? 0);
      row.dino_score = Math.max((cur.dino_score as number) ?? 0, (row.dino_score as number) ?? 0);
      row.total_bid = Math.max((cur.total_bid as number) ?? 0, (row.total_bid as number) ?? 0);
    }
  } catch { }
}

const GUEST_UPVOTES_KEY = 'topsaas_guest_upvotes';

/** Retrieve guest upvotes from localStorage */
export function getGuestUpvotes(): Set<string> {
  try {
    const raw = localStorage.getItem(GUEST_UPVOTES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      const set = new Set<string>();
      for (const id of arr) {
        if (typeof id === 'string') {
          set.add(id);
          if (id.startsWith('prod-')) {
            set.add(id.replace(/^prod-/, ''));
          } else {
            set.add(`prod-${id}`);
          }
        }
      }
      return set;
    }
  } catch { }
  return new Set();
}

/** Persist guest upvotes to localStorage */
export function saveGuestUpvotes(upvotes: Set<string>): void {
  try {
    const list = Array.from(upvotes);
    localStorage.setItem(GUEST_UPVOTES_KEY, JSON.stringify(list));
  } catch { }
}

/** Direct increment or decrement of product upvotes in Supabase (fallback or guest) */
export async function incrementProductUpvotesDirect(productId: string, delta: number): Promise<boolean> {
  try {
    const { error: rpcError } = await supabase.rpc('increment_product_upvotes', {
      p_product_id: productId,
      p_delta: delta
    });
    if (!rpcError) return true;

    // Fallback: fetch current upvotes and update directly
    const { data: current } = await supabase
      .from('products')
      .select('id, upvotes')
      .or(`id.eq.${productId},id.eq.prod-${productId}`)
      .limit(1)
      .maybeSingle();

    if (current) {
      const nextCount = Math.max(0, (current.upvotes ?? 0) + delta);
      const { error: updateError } = await supabase
        .from('products')
        .update({ upvotes: nextCount, updated_at: Date.now() })
        .eq('id', current.id);
      return !updateError;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Comments (with Caching & DB Sync) ──

const COMMENTS_CACHE_KEY = 'topsaas_comments_cache_v2';
const COMMENTS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache validity

let commentsMemoryCache: { timestamp: number; data: Comment[] } | null = null;

function getStoredCommentsCache(): { timestamp: number; data: Comment[] } | null {
  if (commentsMemoryCache) return commentsMemoryCache;
  try {
    const raw = localStorage.getItem(COMMENTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.data)) {
      commentsMemoryCache = parsed;
      return parsed;
    }
  } catch { }
  return null;
}

function persistCommentsCache(comments: Comment[]): void {
  const cacheObj = { timestamp: Date.now(), data: comments };
  commentsMemoryCache = cacheObj;
  try {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cacheObj));
  } catch { }
}

/** Get currently cached comments synchronously without network roundtrip */
export function getCachedCommentsSync(): Comment[] {
  const cache = getStoredCommentsCache();
  return cache ? cache.data : [];
}

/** Load comments from cache if fresh, otherwise fetch from Supabase and update cache */
export async function fetchComments(forceFresh = false): Promise<Comment[]> {
  const cache = getStoredCommentsCache();
  const isFresh = cache && Date.now() - cache.timestamp < COMMENTS_CACHE_TTL_MS;

  if (!forceFresh && isFresh && cache.data.length > 0) {
    return cache.data;
  }

  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      // Fallback to cache if network fails
      return cache ? cache.data : [];
    }

    const mapped: Comment[] = (data || []).map((row) => ({
      id: row.id as string,
      productId: row.product_id as string,
      userName: row.user_name as string,
      userEmail: (row.user_email as string) || undefined,
      userAvatar: (row.user_avatar as string) || undefined,
      content: row.content as string,
      createdAt: Number(row.created_at) || Date.now(),
    }));

    // Merge remote comments with any local/cached comments
    const localComments = cache ? cache.data : [];
    const merged = [...mapped];
    for (const loc of localComments) {
      if (!merged.some((m) => m.id === loc.id)) {
        merged.push(loc);
      }
    }

    persistCommentsCache(merged);
    return merged;
  } catch {
    return cache ? cache.data : [];
  }
}

/** Post a comment; saves to Supabase and immediately updates local cache */
export async function addComment(input: {
  productId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  content: string;
}): Promise<Comment | null> {
  const now = Date.now();

  // Try inserting with user_avatar first
  let payload: Record<string, unknown> = {
    product_id: input.productId,
    user_name: input.userName,
    user_email: input.userEmail || null,
    user_avatar: input.userAvatar || null,
    content: input.content,
    created_at: now,
  };

  let { data, error } = await supabase
    .from('comments')
    .insert(payload)
    .select()
    .single();

  // If column doesn't exist yet in Supabase schema, fall back without user_avatar
  if (error && (error.message?.includes('user_avatar') || error.code === 'PGRST204')) {
    payload = {
      product_id: input.productId,
      user_name: input.userName,
      user_email: input.userEmail || null,
      content: input.content,
      created_at: now,
    };
    const retry = await supabase
      .from('comments')
      .insert(payload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  const savedComment: Comment = data
    ? {
      id: data.id as string,
      productId: data.product_id as string,
      userName: data.user_name as string,
      userEmail: (data.user_email as string) || undefined,
      userAvatar: (data.user_avatar as string) || input.userAvatar || undefined,
      content: data.content as string,
      createdAt: Number(data.created_at) || now,
    }
    : {
      id: `local-${now}-${Math.random().toString(36).slice(2, 7)}`,
      productId: input.productId,
      userName: input.userName,
      userEmail: input.userEmail,
      userAvatar: input.userAvatar,
      content: input.content,
      createdAt: now,
    };

  // Update memory and localStorage cache immediately
  const existing = getStoredCommentsCache()?.data || [];
  const updatedList = [...existing.filter((c) => c.id !== savedComment.id), savedComment];
  persistCommentsCache(updatedList);

  if (error && !data) {
    console.warn('Could not persist comment to Supabase, stored locally in cache', error);
  }

  return savedComment;
}

// ── Admin ──

/** Check if current user is admin or moderator */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data as boolean;
}

// ── Debounced sync ──

let productsSyncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Debounced full sync of products to Supabase */
export function debouncedSyncProducts(products: Product[]): void {
  if (productsSyncTimeout) clearTimeout(productsSyncTimeout);
  productsSyncTimeout = setTimeout(() => {
    saveAllProducts(products).catch(() => { });
  }, 2000);
}

// ── Global Featured Spot Settings ──

export interface FeaturedProductConfig {
  productId: string | null;
  productIds: string[];
  positions: Record<string, number>;
  expiresAt: number | null;
  position?: number;
}

export const FEATURED_POSITION_KEY = 'featured_position';
export const LOCAL_FEATURED_POSITION_KEY = 'topsaas_featured_position';
export const FEATURED_PRODUCTS_KEY = 'featured_product_ids';
export const LOCAL_FEATURED_PRODUCTS_KEY = 'topsaas_featured_product_ids';
export const FEATURED_POSITIONS_MAP_KEY = 'featured_product_positions';
export const LOCAL_FEATURED_POSITIONS_MAP_KEY = 'topsaas_featured_product_positions';

/** Get whether a custom position is set for the featured card in the listing (default: 0 = top above #1) */
export async function getFeaturedPosition(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', FEATURED_POSITION_KEY)
      .maybeSingle();

    if (!error && data && data.value !== undefined && data.value !== null) {
      const parsed = parseInt(data.value, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        try {
          localStorage.setItem(LOCAL_FEATURED_POSITION_KEY, parsed.toString());
        } catch { }
        return parsed;
      }
    }
  } catch { }

  try {
    const local = localStorage.getItem(LOCAL_FEATURED_POSITION_KEY);
    if (local !== null) {
      const parsed = parseInt(local, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch { }

  return 0; // Default: 0 (top, above rank 1)
}

/** Set position for the featured card in the directory listing */
export async function setFeaturedPosition(position: number): Promise<void> {
  const pos = Math.max(0, position);
  try {
    localStorage.setItem(LOCAL_FEATURED_POSITION_KEY, pos.toString());
  } catch { }

  try {
    await supabase.from('site_settings').upsert({
      key: FEATURED_POSITION_KEY,
      value: pos.toString(),
      description: 'Position index of the featured spotlight card in the listing (0 = top, N = after rank N)',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('setFeaturedPosition note:', err);
  }
}

/** Get global featured product from Supabase (with fallback to localStorage) */
export async function getGlobalFeaturedProduct(): Promise<FeaturedProductConfig> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['featured_product_id', 'featured_expires_at', FEATURED_POSITION_KEY, FEATURED_PRODUCTS_KEY, FEATURED_POSITIONS_MAP_KEY]);

    if (!error && data && data.length > 0) {
      const idRow = data.find((r) => r.key === 'featured_product_id');
      const expRow = data.find((r) => r.key === 'featured_expires_at');
      const posRow = data.find((r) => r.key === FEATURED_POSITION_KEY);
      const idsRow = data.find((r) => r.key === FEATURED_PRODUCTS_KEY);
      const positionsRow = data.find((r) => r.key === FEATURED_POSITIONS_MAP_KEY);

      const rawVal = idRow?.value;
      const expiresAt = expRow?.value ? parseInt(expRow.value, 10) : null;
      const posVal = posRow?.value ? parseInt(posRow.value, 10) : 0;
      const position = !isNaN(posVal) && posVal >= 0 ? posVal : 0;

      let productIds: string[] = [];
      if (idsRow?.value) {
        try {
          const parsed = JSON.parse(idsRow.value);
          if (Array.isArray(parsed)) {
            productIds = parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
          }
        } catch { }
      }

      let positions: Record<string, number> = {};
      if (positionsRow?.value) {
        try {
          const parsed = JSON.parse(positionsRow.value);
          if (parsed && typeof parsed === 'object') {
            positions = parsed;
          }
        } catch { }
      }

      if (posRow?.value) {
        try { localStorage.setItem(LOCAL_FEATURED_POSITION_KEY, position.toString()); } catch { }
      }
      if (idsRow?.value) {
        try { localStorage.setItem(LOCAL_FEATURED_PRODUCTS_KEY, JSON.stringify(productIds)); } catch { }
      }
      if (positionsRow?.value) {
        try { localStorage.setItem(LOCAL_FEATURED_POSITIONS_MAP_KEY, JSON.stringify(positions)); } catch { }
      }

      if (rawVal === 'empty' || rawVal === '') {
        return { productId: 'empty', productIds: [], positions, expiresAt: null, position };
      }
      if (rawVal === 'default' || !rawVal) {
        if (productIds.length > 0) {
          return { productId: productIds[0], productIds, positions, expiresAt: null, position };
        }
        return { productId: null, productIds: [], positions, expiresAt: null, position };
      }

      // If expired, clear it
      if (expiresAt && expiresAt < Date.now()) {
        return { productId: null, productIds: [], positions, expiresAt: null, position };
      }

      if (productIds.length === 0 && rawVal) {
        productIds = [rawVal];
      }

      return { productId: rawVal, productIds, positions, expiresAt, position };
    }
  } catch { }

  // Fallback to local storage
  try {
    const localId = localStorage.getItem('topsaas_featured_product');
    const localExp = localStorage.getItem('topsaas_featured_expiry');
    const localPos = localStorage.getItem(LOCAL_FEATURED_POSITION_KEY);
    const localIdsRaw = localStorage.getItem(LOCAL_FEATURED_PRODUCTS_KEY);
    const localPositionsRaw = localStorage.getItem(LOCAL_FEATURED_POSITIONS_MAP_KEY);
    const exp = localExp ? parseInt(localExp, 10) : null;
    const pos = localPos ? parseInt(localPos, 10) : 0;
    const position = !isNaN(pos) && pos >= 0 ? pos : 0;

    let productIds: string[] = [];
    if (localIdsRaw) {
      try {
        const parsed = JSON.parse(localIdsRaw);
        if (Array.isArray(parsed)) {
          productIds = parsed.filter((id) => typeof id === 'string' && id.trim().length > 0);
        }
      } catch { }
    }

    let positions: Record<string, number> = {};
    if (localPositionsRaw) {
      try {
        const parsed = JSON.parse(localPositionsRaw);
        if (parsed && typeof parsed === 'object') {
          positions = parsed;
        }
      } catch { }
    }

    if (localId === 'empty' || localId === '') {
      return { productId: 'empty', productIds: [], positions, expiresAt: null, position };
    }
    if (localId === 'default' || !localId) {
      if (productIds.length > 0) {
        return { productId: productIds[0], productIds, positions, expiresAt: null, position };
      }
      return { productId: null, productIds: [], positions, expiresAt: null, position };
    }

    if (exp && exp < Date.now()) {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
      return { productId: null, productIds: [], positions, expiresAt: null, position };
    }

    if (productIds.length === 0 && localId) {
      productIds = [localId];
    }

    return { productId: localId, productIds, positions, expiresAt: exp, position };
  } catch {
    return { productId: null, productIds: [], positions: {}, expiresAt: null, position: 0 };
  }
}

/** Set global featured products (multiple) in Supabase and localStorage */
export async function setGlobalFeaturedProducts(
  productIds: string[],
  mode: 'active' | 'default' | 'empty' = 'active',
  positions?: Record<string, number>
): Promise<void> {
  const normalizedIds = Array.from(new Set(productIds.filter(Boolean)));
  const primaryId = normalizedIds.length > 0
    ? normalizedIds[0]
    : (mode === 'empty' ? 'empty' : 'default');

  // 1. Sync to local storage
  try {
    localStorage.setItem(LOCAL_FEATURED_PRODUCTS_KEY, JSON.stringify(normalizedIds));
    if (positions) {
      localStorage.setItem(LOCAL_FEATURED_POSITIONS_MAP_KEY, JSON.stringify(positions));
    }
    if (primaryId === 'default') {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
    } else {
      localStorage.setItem('topsaas_featured_product', primaryId);
    }
  } catch { }

  // 2. Sync to Supabase site_settings
  try {
    const upserts: Array<{ key: string; value: string; description?: string }> = [
      { key: FEATURED_PRODUCTS_KEY, value: JSON.stringify(normalizedIds), description: 'List of featured product IDs in priority order' },
      { key: 'featured_product_id', value: primaryId, description: 'Primary featured product ID or default/empty' },
    ];
    if (positions) {
      upserts.push({
        key: FEATURED_POSITIONS_MAP_KEY,
        value: JSON.stringify(positions),
        description: 'Per-product listing position map for featured cards',
      });
    }
    await supabase.from('site_settings').upsert(upserts);
  } catch (err) {
    console.warn('setGlobalFeaturedProducts error:', err);
  }
}

/** Set per-product listing position for a featured product */
export async function setProductFeaturedPosition(
  productId: string,
  position: number
): Promise<Record<string, number>> {
  let positions: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(LOCAL_FEATURED_POSITIONS_MAP_KEY);
    if (raw) positions = JSON.parse(raw);
  } catch { }
  positions[productId] = Math.max(0, position);
  try {
    localStorage.setItem(LOCAL_FEATURED_POSITIONS_MAP_KEY, JSON.stringify(positions));
    await supabase.from('site_settings').upsert({
      key: FEATURED_POSITIONS_MAP_KEY,
      value: JSON.stringify(positions),
      description: 'Per-product listing position for featured cards',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('setProductFeaturedPosition note:', err);
  }
  return positions;
}

/** Set global featured product in Supabase and localStorage */
export async function setGlobalFeaturedProduct(
  productId: string | null,
  durationDays: number = 30
): Promise<void> {
  const normalizedId = (!productId || productId === 'default')
    ? 'default'
    : (productId === 'empty' || productId === '')
      ? 'empty'
      : productId;

  const isCustomProduct = normalizedId !== 'default' && normalizedId !== 'empty';
  const expiresAt = isCustomProduct ? Date.now() + durationDays * 86400000 : 0;
  const productIds = isCustomProduct ? [normalizedId] : [];

  // 1. Sync to local storage
  try {
    localStorage.setItem(LOCAL_FEATURED_PRODUCTS_KEY, JSON.stringify(productIds));
    if (normalizedId === 'default') {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
    } else {
      localStorage.setItem('topsaas_featured_product', normalizedId);
      localStorage.setItem('topsaas_featured_expiry', expiresAt.toString());
    }
  } catch { }

  // 2. Sync to Supabase site_settings
  try {
    await supabase.from('site_settings').upsert([
      { key: FEATURED_PRODUCTS_KEY, value: JSON.stringify(productIds), description: 'List of featured product IDs' },
      { key: 'featured_product_id', value: normalizedId },
      { key: 'featured_expires_at', value: expiresAt.toString() },
    ]);
  } catch { }
}

// ── Global Sponsor Rails Enabled Toggle ──

export const SPONSOR_RAILS_ENABLED_KEY = 'sponsor_rails_enabled';
export const LOCAL_SPONSOR_RAILS_KEY = 'topsaas_sponsor_rails_enabled';

/** Get whether homepage side sponsor rails are enabled (default: false) */
export async function getSponsorRailsEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', SPONSOR_RAILS_ENABLED_KEY)
      .maybeSingle();

    if (!error && data && data.value !== undefined && data.value !== null) {
      const isEnabled = data.value === 'true';
      try {
        localStorage.setItem(LOCAL_SPONSOR_RAILS_KEY, isEnabled ? 'true' : 'false');
      } catch { }
      return isEnabled;
    }
  } catch { }

  try {
    const local = localStorage.getItem(LOCAL_SPONSOR_RAILS_KEY);
    if (local !== null) {
      return local === 'true';
    }
  } catch { }

  return false; // Default OFF so it never flashes open ad spots when disabled
}

/** Set whether homepage side sponsor rails are enabled */
export async function setSponsorRailsEnabled(enabled: boolean): Promise<void> {
  try {
    localStorage.setItem(LOCAL_SPONSOR_RAILS_KEY, enabled ? 'true' : 'false');
  } catch { }

  try {
    await supabase.from('site_settings').upsert({
      key: SPONSOR_RAILS_ENABLED_KEY,
      value: enabled ? 'true' : 'false',
      description: 'Master toggle to enable or disable homepage side sponsor rails',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('setSponsorRailsEnabled note:', err);
  }
}

// ── Global Sponsor Settings (Persisted via site_settings) ──

export interface ActiveSponsorConfig {
  productId: string;
  tier: 'trial' | 'paid' | '1mo' | '3mo' | '1yr' | 'none';
  startedAt: number;
  expiresAt: number;
  contactEmail?: string;
  clicks?: number;
  ended?: boolean;
}

export const ACTIVE_SPONSORS_KEY = 'active_sponsors_v1';
export const LOCAL_SPONSORS_KEY = 'topsaas_active_sponsors_v1';

/** Fetch active sponsors from Supabase site_settings, falling back to localStorage */
export async function getActiveSponsors(): Promise<ActiveSponsorConfig[]> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', ACTIVE_SPONSORS_KEY)
      .maybeSingle();

    if (!error && data && data.value) {
      const parsed = JSON.parse(data.value) as ActiveSponsorConfig[];
      if (Array.isArray(parsed)) {
        try {
          localStorage.setItem(LOCAL_SPONSORS_KEY, JSON.stringify(parsed));
        } catch { }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('getActiveSponsors note:', err);
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem(LOCAL_SPONSORS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { }

  return [];
}

/** Save active sponsors list to Supabase site_settings and localStorage */
export async function saveActiveSponsors(sponsors: ActiveSponsorConfig[]): Promise<void> {
  // Sync to local storage first for instant responsiveness
  try {
    localStorage.setItem(LOCAL_SPONSORS_KEY, JSON.stringify(sponsors));
  } catch { }

  // Sync to Supabase site_settings
  try {
    await supabase.from('site_settings').upsert({
      key: ACTIVE_SPONSORS_KEY,
      value: JSON.stringify(sponsors),
      description: 'Active and tracked sponsors',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('saveActiveSponsors note:', err);
  }
}

/** Update or add a sponsor configuration into site_settings */
export async function recordSponsorUpdate(config: ActiveSponsorConfig): Promise<ActiveSponsorConfig[]> {
  const current = await getActiveSponsors();
  const index = current.findIndex(
    (s) => s.productId === config.productId ||
      s.productId === `prod-${config.productId}` ||
      `prod-${s.productId}` === config.productId
  );

  let next: ActiveSponsorConfig[];
  if (index >= 0) {
    next = [...current];
    next[index] = {
      ...next[index],
      ...config,
      ended: false,
    };
  } else {
    next = [config, ...current];
  }

  await saveActiveSponsors(next);
  return next;
}

/** Remove or end a sponsor configuration in site_settings */
export async function recordSponsorEnd(productId: string): Promise<ActiveSponsorConfig[]> {
  const current = await getActiveSponsors();
  const now = Date.now();
  const next = current.map((s) => {
    if (s.productId === productId || s.productId === `prod-${productId}` || `prod-${s.productId}` === productId) {
      return { ...s, ended: true, expiresAt: now - 1000 };
    }
    return s;
  });
  await saveActiveSponsors(next);
  return next;
}

/** Merge active sponsors configs into loaded products */
export function mergeSponsorsIntoProducts(products: Product[], sponsors: ActiveSponsorConfig[]): Product[] {
  if (!sponsors || sponsors.length === 0) return products;
  const now = Date.now();

  const sponsorMap = new Map<string, ActiveSponsorConfig>();
  for (const s of sponsors) {
    sponsorMap.set(s.productId, s);
    if (!s.productId.startsWith('prod-')) {
      sponsorMap.set(`prod-${s.productId}`, s);
    } else {
      sponsorMap.set(s.productId.replace(/^prod-/, ''), s);
    }
  }

  return products.map((p) => {
    const s = sponsorMap.get(p.id);
    if (!s) return p;

    const isStillActive = !s.ended && s.expiresAt > now;
    return {
      ...p,
      isSponsored: isStillActive,
      sponsorTier: s.tier,
      sponsorStartedAt: s.startedAt,
      sponsorExpiresAt: s.expiresAt,
      sponsorContactEmail: s.contactEmail || p.sponsorContactEmail,
      sponsorClicks: s.clicks !== undefined ? s.clicks : (p.sponsorClicks || 0),
      autoRelaunch: p.autoRelaunch,
    };
  });
}

/** Helper to set or remove sponsorship on a product with automatic cloud sync */
export async function setProductSponsorship(
  product: Product,
  isSponsored: boolean,
  tier: 'trial' | 'paid' | '1mo' | '3mo' | '1yr' | 'none' = '1mo',
  durationDays: number = 30,
  email?: string
): Promise<Product> {
  const now = Date.now();
  const expiresAt = now + durationDays * 86400 * 1000;

  if (isSponsored) {
    await recordSponsorUpdate({
      productId: product.id,
      tier,
      startedAt: now,
      expiresAt,
      contactEmail: email || product.sponsorContactEmail,
      clicks: product.sponsorClicks || 0,
      ended: false,
    });
  } else {
    await recordSponsorEnd(product.id);
  }

  return {
    ...product,
    isSponsored,
    sponsorTier: isSponsored ? tier : product.sponsorTier,
    sponsorStartedAt: isSponsored ? now : product.sponsorStartedAt,
    sponsorExpiresAt: isSponsored ? expiresAt : (now - 1000),
    sponsorContactEmail: email || product.sponsorContactEmail,
    autoRelaunch: product.autoRelaunch,
  };
}
