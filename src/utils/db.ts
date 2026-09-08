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
  };
};

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
  };
};

/** Convert a WebsiteSubmission to a live Product object */
export function submissionToProduct(sub: WebsiteSubmission, rank: number = 1): Product {
  const domain = sub.url.replace(/^https?:\/\//i, '').split('/')[0];
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  const prodId = sub.id ? (sub.id.startsWith('prod-') ? sub.id : `prod-${sub.id}`) : `prod-${Date.now()}`;

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
    createdAt: sub.submittedAt || Date.now(),
    updatedAt: Date.now(),
    verified: true,
    isUserOwned: false,
    submittedBy: sub.submittedBy,
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
  };
}

/**
 * Whether the remote `products` table has the `screenshots` column yet.
 * Probed once so the app keeps working until the 013 migration is applied.
 */
let screenshotsColumnAvailablePromise: Promise<boolean> | null = null;
export function screenshotsColumnAvailable(): Promise<boolean> {
  if (!screenshotsColumnAvailablePromise) {
    screenshotsColumnAvailablePromise = (async () => {
      try {
        const { error } = await supabase.from('products').select('screenshots').limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return screenshotsColumnAvailablePromise;
}

/** Whether the remote `products` table has the socials / creator columns yet (needs migration 014) */
let socialsColumnsAvailablePromise: Promise<boolean> | null = null;
export function socialsColumnsAvailable(): Promise<boolean> {
  if (!socialsColumnsAvailablePromise) {
    socialsColumnsAvailablePromise = (async () => {
      try {
        const { error } = await supabase
          .from('products')
          .select('socials,creator_name,creator_username,creator_x_handle')
          .limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return socialsColumnsAvailablePromise;
}

/** Whether the remote `products` table has the offer discount/code columns yet (needs migration 019) */
let offersColumnsAvailablePromise: Promise<boolean> | null = null;
export function offersColumnsAvailable(): Promise<boolean> {
  if (!offersColumnsAvailablePromise) {
    offersColumnsAvailablePromise = (async () => {
      try {
        const { error } = await supabase
          .from('products')
          .select('offer_code')
          .limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return offersColumnsAvailablePromise;
}

/** Whether the remote `products` table has the demo_video_url column yet (needs migration 017) */
let demoVideoColumnAvailablePromise: Promise<boolean> | null = null;
export function demoVideoColumnAvailable(): Promise<boolean> {
  if (!demoVideoColumnAvailablePromise) {
    demoVideoColumnAvailablePromise = (async () => {
      try {
        const { error } = await supabase
          .from('products')
          .select('demo_video_url')
          .limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return demoVideoColumnAvailablePromise;
}

/** Whether the remote `products` table has the creator_avatar / creator_role columns yet (needs migration 016) */
let creatorAvatarColumnAvailablePromise: Promise<boolean> | null = null;
export function creatorAvatarColumnAvailable(): Promise<boolean> {
  if (!creatorAvatarColumnAvailablePromise) {
    creatorAvatarColumnAvailablePromise = (async () => {
      try {
        const { error } = await supabase
          .from('products')
          .select('creator_avatar,creator_role')
          .limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return creatorAvatarColumnAvailablePromise;
}

/** Whether the remote `products` table has problem_it_solves / solution / unique_selling_point columns */
let detailsColumnsAvailablePromise: Promise<boolean> | null = null;
export function detailsColumnsAvailable(): Promise<boolean> {
  if (!detailsColumnsAvailablePromise) {
    detailsColumnsAvailablePromise = (async () => {
      try {
        const { error } = await supabase
          .from('products')
          .select('problem_it_solves')
          .limit(1);
        return !error;
      } catch {
        return false;
      }
    })();
  }
  return detailsColumnsAvailablePromise;
}

/** Prepares a DB product row by stripping fields whose columns don't yet exist on the remote database */
export async function prepareDbProductRow(p: Product): Promise<Record<string, unknown>> {
  const [includeScreenshots, includeSocials, includeOffers, includeDemoVideo, includeCreatorAvatar, includeDetails] = await Promise.all([
    screenshotsColumnAvailable(),
    socialsColumnsAvailable(),
    offersColumnsAvailable(),
    demoVideoColumnAvailable(),
    creatorAvatarColumnAvailable(),
    detailsColumnsAvailable(),
  ]);

  const row = { ...toDbProduct(p) } as Record<string, unknown>;
  if (!includeScreenshots) delete row.screenshots;
  if (!includeSocials) {
    delete row.socials;
    delete row.creator_name;
    delete row.creator_username;
    delete row.creator_x_handle;
  }
  if (!includeOffers) {
    delete row.offer_discount;
    delete row.offer_code;
    delete row.offer_url;
    delete row.offer_details;
  }
  if (!includeDemoVideo) {
    delete row.demo_video_url;
  }
  if (!includeCreatorAvatar) {
    delete row.creator_avatar;
    delete row.creator_role;
  }
  if (!includeDetails) {
    delete row.problem_it_solves;
    delete row.solution;
    delete row.unique_selling_point;
  }
  return row;
}

/** Load all products from Supabase */
export async function loadProducts(): Promise<Product[] | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('rank', { ascending: true });
  if (error || !data) return null;
  return data.map(mapDbProduct);
}

/**
 * Merge rich submission data into loaded products.
 * This ensures that even if the products table row was saved before
 * columns like problem_it_solves / offer_code / socials existed,
 * the data from the submissions table (which always has it) gets applied.
 */
export async function enrichProductsFromSubmissions(products: Product[]): Promise<Product[]> {
  if (products.length === 0) return products;
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'approved');
    if (error || !data || data.length === 0) return products;

    const subs = data.map(mapDbSubmission);
    return products.map((prod) => {
      const match = subs.find(
        (s) =>
          s.url.toLowerCase().replace(/\/$/, '') === prod.url.toLowerCase().replace(/\/$/, '') ||
          prod.id === s.id ||
          prod.id === `prod-${s.id}`
      );
      if (!match) return prod;
      // Merge: submission fields win when product row is missing them
      return {
        ...prod,
        description: prod.description || match.description,
        problemItSolves: prod.problemItSolves || match.problemItSolves,
        solution: prod.solution || match.solution,
        uniqueSellingPoint: prod.uniqueSellingPoint || match.uniqueSellingPoint,
        targetAudience: prod.targetAudience || match.targetAudience,
        pricingModel: prod.pricingModel || match.pricingModel,
        offerDiscount: prod.offerDiscount || match.offerDiscount,
        offerCode: prod.offerCode || match.offerCode,
        offerUrl: prod.offerUrl || match.offerUrl,
        offerDetails: prod.offerDetails || match.offerDetails,
        socials: (prod.socials && prod.socials.length > 0) ? prod.socials : match.socials,
        screenshots: (prod.screenshots && prod.screenshots.length > 0) ? prod.screenshots : match.screenshots,
        demoVideoUrl: prod.demoVideoUrl || match.demoVideoUrl,
        logoUrl: prod.logoUrl || match.logoUrl,
        creatorName: prod.creatorName || match.creatorName,
        creatorXHandle: prod.creatorXHandle || match.creatorXHandle,
        creatorAvatar: prod.creatorAvatar || match.creatorAvatar,
        creatorRole: prod.creatorRole || match.creatorRole,
        twitterHandle: prod.twitterHandle || match.twitterHandle,
        submittedBy: prod.submittedBy || match.submittedBy,
      };
    });
  } catch {
    return products;
  }
}


/** Guaranteed single-request batched rank updates in Supabase — only touches rank columns */
export async function saveProductRanksDirect(products: Product[]): Promise<void> {
  if (products.length === 0) return;
  try {
    // Use individual UPDATEs so we never overwrite rich columns (problem, solution, offers, etc.)
    await Promise.all(
      products.map((p) =>
        supabase
          .from('products')
          .update({
            rank: p.rank,
            previous_rank: p.previousRank || p.rank,
            upvotes: p.upvotes ?? 0,
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
    const rows = await Promise.all(products.map((p) => prepareDbProductRow(p)));
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
    const row = await prepareDbProductRow(p);
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
      verified: true,
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
    const row = await prepareDbProductRow(p);
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
  } catch {}
  return new Set();
}

/** Persist guest upvotes to localStorage */
export function saveGuestUpvotes(upvotes: Set<string>): void {
  try {
    const list = Array.from(upvotes);
    localStorage.setItem(GUEST_UPVOTES_KEY, JSON.stringify(list));
  } catch {}
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
  } catch {}
  return null;
}

function persistCommentsCache(comments: Comment[]): void {
  const cacheObj = { timestamp: Date.now(), data: comments };
  commentsMemoryCache = cacheObj;
  try {
    localStorage.setItem(COMMENTS_CACHE_KEY, JSON.stringify(cacheObj));
  } catch {}
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
    saveAllProducts(products).catch(() => {});
  }, 2000);
}

// ── Global Featured Spot Settings ──

export interface FeaturedProductConfig {
  productId: string | null;
  expiresAt: number | null;
}

/** Get global featured product from Supabase (with fallback to localStorage) */
export async function getGlobalFeaturedProduct(): Promise<FeaturedProductConfig> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['featured_product_id', 'featured_expires_at']);

    if (!error && data && data.length > 0) {
      const idRow = data.find((r) => r.key === 'featured_product_id');
      const expRow = data.find((r) => r.key === 'featured_expires_at');

      const rawVal = idRow?.value;
      const expiresAt = expRow?.value ? parseInt(expRow.value, 10) : null;

      if (rawVal === 'empty' || rawVal === '') {
        return { productId: 'empty', expiresAt: null };
      }
      if (rawVal === 'default' || !rawVal) {
        return { productId: null, expiresAt: null };
      }

      // If expired, clear it
      if (expiresAt && expiresAt < Date.now()) {
        return { productId: null, expiresAt: null };
      }

      return { productId: rawVal, expiresAt };
    }
  } catch {}

  // Fallback to local storage
  try {
    const localId = localStorage.getItem('topsaas_featured_product');
    const localExp = localStorage.getItem('topsaas_featured_expiry');
    const exp = localExp ? parseInt(localExp, 10) : null;

    if (localId === 'empty' || localId === '') {
      return { productId: 'empty', expiresAt: null };
    }
    if (localId === 'default' || !localId) {
      return { productId: null, expiresAt: null };
    }

    if (exp && exp < Date.now()) {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
      return { productId: null, expiresAt: null };
    }
    return { productId: localId, expiresAt: exp };
  } catch {
    return { productId: null, expiresAt: null };
  }
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

  // 1. Sync to local storage
  try {
    if (normalizedId === 'default') {
      localStorage.removeItem('topsaas_featured_product');
      localStorage.removeItem('topsaas_featured_expiry');
    } else {
      localStorage.setItem('topsaas_featured_product', normalizedId);
      localStorage.setItem('topsaas_featured_expiry', expiresAt.toString());
    }
  } catch {}

  // 2. Sync to Supabase site_settings
  try {
    await supabase.from('site_settings').upsert([
      { key: 'featured_product_id', value: normalizedId },
      { key: 'featured_expires_at', value: expiresAt.toString() },
    ]);
  } catch {}
}
