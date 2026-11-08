export type Category = 
  | 'All'
  | 'AI Tools'
  | 'Developer Tools'
  | 'Productivity'
  | 'Design & UI'
  | 'SaaS & Indie'
  | 'Social Media & Community'
  | 'X / Twitter Tools'
  | 'LinkedIn Tools'
  | 'YouTube & Video'
  | 'Discord & Telegram'
  | 'Instagram & TikTok'
  | 'Marketing & SEO'
  | 'Analytics & Data'
  | 'Finance & Fintech'
  | 'E-commerce'
  | 'Security & Privacy'
  | 'Communication & Social'
  | 'Sales & CRM'
  | 'No-Code & Low-Code'
  | 'Education & Learning'
  | 'Cloud & DevOps'
  | 'Content & Media'
  | 'Automation & Workflows'
  | 'Open Source'
  | 'Crypto & Web3'
  | 'HR & Hiring'
  | 'Customer Support'
  | 'Health & Wellness'
  | (string & {});

export const SUBMISSION_CATEGORIES: Category[] = [
  'AI Tools',
  'Developer Tools',
  'Productivity',
  'Design & UI',
  'SaaS & Indie',
  'Social Media & Community',
  'X / Twitter Tools',
  'LinkedIn Tools',
  'YouTube & Video',
  'Discord & Telegram',
  'Instagram & TikTok',
  'Marketing & SEO',
  'Analytics & Data',
  'Finance & Fintech',
  'E-commerce',
  'Security & Privacy',
  'Communication & Social',
  'Sales & CRM',
  'No-Code & Low-Code',
  'Education & Learning',
  'Cloud & DevOps',
  'Content & Media',
  'Automation & Workflows',
  'Open Source',
  'Crypto & Web3',
  'HR & Hiring',
  'Customer Support',
  'Health & Wellness',
];

export interface ProductFeature {
  title: string;
  description: string;
  tag?: string;
}

export interface ProductUseCase {
  title: string;
  description: string;
  audience: string;
}

export interface ProductHighlight {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  rank: number;
  previousRank?: number;
  name: string;
  tagline: string;
  url: string;
  logoUrl?: string;
  /** Up to 4 feature screenshots shown in a gallery on the listing page */
  screenshots?: string[];
  demoVideoUrl?: string;
  twitterHandle?: string;
  /** Creator links (X, GitHub, Product Hunt, Discord, LinkedIn, stores, …) */
  socials?: ProductSocial[];
  creatorName?: string;
  creatorUsername?: string;
  creatorXHandle?: string;
  creatorAvatar?: string;
  creatorRole?: string;
  category: Category;
  upvotes?: number;
  dinoScore?: number;
  clicks: number;
  createdAt: number;
  updatedAt: number;
  isUserOwned?: boolean;
  submittedBy?: string; // user ID of who submitted this product
  featuredQuote?: string;
  verified?: boolean;
  isSponsored?: boolean;
  /** True if this item is only an ad sponsor and was NOT submitted to the directory */
  isSponsorOnly?: boolean;
  sponsorTier?: 'trial' | 'paid' | '1mo' | '3mo' | '1yr' | 'none';
  sponsorStartedAt?: number;
  sponsorExpiresAt?: number;
  sponsorClicks?: number;
  sponsorContactEmail?: string;
  isSponsorPaused?: boolean;
  sponsorPausedRemainingMs?: number;
  description?: string;
  whatItDoes?: string[];
  features?: ProductFeature[];
  useCases?: ProductUseCase[];
  targetAudience?: string;
  pricingModel?: string;
  keyHighlights?: ProductHighlight[];
  offerDiscount?: string;
  offerCode?: string;
  offerUrl?: string;
  offerDetails?: string;
  problemItSolves?: string;
  solution?: string;
  uniqueSellingPoint?: string;
  autoRelaunch?: boolean;
  autoRelaunchPaid?: boolean;
  autoRelaunchPaidAt?: number;
  autoRelaunchOrderId?: string;
  scheduledLaunchWeek?: number;
  scheduledLaunchDate?: number;
  relaunchWeeks?: number[];
  isRelaunched?: boolean;
  lastRelaunchedAt?: number;
}

export interface Comment {
  id: string;
  productId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
}

export interface LiveActivity {
  id: string;
  productId: string;
  productName: string;
  productLogo?: string;
  type: 'new_product' | 'boost' | 'claim_first';
  newRank: number;
  displacedProductName?: string;
  displacedRank?: number;
  timestamp: number;
}

export type SortOption = 'rank' | 'recent' | 'clicks' | 'climb';

export type SubmissionStatus = 'under_review' | 'approved' | 'rejected';

export type SocialPlatform =
  | 'x'
  | 'github'
  | 'product_hunt'
  | 'discord'
  | 'linkedin'
  | 'youtube'
  | 'reddit'
  | 'app_store'
  | 'play_store'
  | 'chrome_web_store';

export interface ProductSocial {
  platform: SocialPlatform;
  url: string;
}

export type PricingModel = 'Free' | 'Freemium' | 'Paid' | 'Open Source';

/** Rich payload collected by the Launch a Product page */
export interface SubmitProductDetails {
  name: string;
  tagline: string;
  url: string;
  category: Category;
  description?: string;
  logoUrl?: string;
  screenshots?: string[];
  demoVideoUrl?: string;
  twitterHandle?: string;
  socials?: ProductSocial[];
  creatorName?: string;
  creatorUsername?: string;
  creatorXHandle?: string;
  creatorAvatar?: string;
  creatorRole?: string;
  targetAudience?: string;
  pricingModel?: PricingModel;
  problemItSolves?: string;
  solution?: string;
  uniqueSellingPoint?: string;
  offerDiscount?: string;
  offerCode?: string;
  offerUrl?: string;
  offerDetails?: string;
  autoRelaunch?: boolean;
  autoRelaunchPaid?: boolean;
  autoRelaunchPaidAt?: number;
  scheduledLaunchWeek?: number;
  scheduledLaunchDate?: number;
}

export interface WebsiteSubmission {
  id: string;
  name: string;
  tagline: string;
  url: string;
  logoUrl?: string;
  screenshots?: string[];
  demoVideoUrl?: string;
  twitterHandle?: string;
  socials?: ProductSocial[];
  creatorName?: string;
  creatorUsername?: string;
  creatorXHandle?: string;
  creatorAvatar?: string;
  creatorRole?: string;
  category: Category;
  backerName: string;
  backerEmail?: string;
  status: SubmissionStatus;
  submittedAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
  verified?: boolean;
  targetAudience?: string;
  pricingModel?: string;
  submittedBy?: string; // user ID of the submitter
  offerDiscount?: string;
  offerCode?: string;
  offerUrl?: string;
  offerDetails?: string;
  description?: string;
  problemItSolves?: string;
  solution?: string;
  uniqueSellingPoint?: string;
  autoRelaunch?: boolean;
  autoRelaunchPaid?: boolean;
  autoRelaunchPaidAt?: number;
  autoRelaunchOrderId?: string;
  scheduledLaunchWeek?: number;
  scheduledLaunchDate?: number;
  relaunchWeeks?: number[];
  isRelaunched?: boolean;
  lastRelaunchedAt?: number;
}

declare global {
  interface Window {
    trackkit?: ((cmd: 'goal' | 'identify' | 'pageview', a?: any, b?: any) => void) & {
      attribution?: () => { ml_visitor_id?: string; ml_session_id?: string };
    };
    minilytics?: ((cmd: 'goal' | 'identify' | 'pageview', a?: any, b?: any) => void) & {
      attribution?: () => { ml_visitor_id?: string; ml_session_id?: string };
    };
  }
}
