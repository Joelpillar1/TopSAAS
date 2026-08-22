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

export interface BidHistoryEntry {
  id: string;
  amount: number;
  newTotal: number;
  bidderName: string;
  bidderHandle?: string;
  note?: string;
  timestamp: number;
  previousRank?: number;
  newRank: number;
}

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
  twitterHandle?: string;
  category: Category;
  upvotes?: number;
  dinoScore?: number;
  totalBid?: number;
  clicks: number;
  createdAt: number;
  updatedAt: number;
  bidHistory?: BidHistoryEntry[];
  isUserOwned?: boolean;
  submittedBy?: string; // user ID of who submitted this product
  featuredQuote?: string;
  verified?: boolean;
  description?: string;
  whatItDoes?: string[];
  features?: ProductFeature[];
  useCases?: ProductUseCase[];
  targetAudience?: string;
  pricingModel?: string;
  keyHighlights?: ProductHighlight[];
}

export interface LiveActivity {
  id: string;
  productId: string;
  productName: string;
  productLogo?: string;
  type: 'outbid' | 'new_product' | 'boost' | 'claim_first';
  bidAmount: number;
  newTotal: number;
  newRank: number;
  displacedProductName?: string;
  displacedRank?: number;
  timestamp: number;
}

export type SortOption = 'rank' | 'recent' | 'clicks' | 'climb';

export type SubmissionStatus = 'under_review' | 'approved' | 'rejected';

export interface WebsiteSubmission {
  id: string;
  name: string;
  tagline: string;
  url: string;
  logoUrl?: string;
  twitterHandle?: string;
  category: Category;
  backerName: string;
  backerEmail?: string;
  status: SubmissionStatus;
  submittedAt: number;
  reviewedAt?: number;
  rejectionReason?: string;
  targetAudience?: string;
  pricingModel?: string;
  submittedBy?: string; // user ID of the submitter
}
