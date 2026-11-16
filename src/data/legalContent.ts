/**
 * Legal copy shared by the React LegalPage and the build-time prerenderer.
 * Keeping it here means /privacy and /terms ship real, indexable HTML that
 * matches exactly what visitors see after React boots.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  definitions?: Array<{ label: string; body: string }>;
  bullets?: string[];
  note?: string;
}

export const LEGAL_EFFECTIVE = 'August 2026';

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: '1. Overview & Scope',
    paragraphs: [
      'TopSAAS ("we," "our," or "us") operates the TopSAAS directory and the TopSAAS Runner platform. We believe in open, fair, and transparent discovery for software creators. This Privacy Policy describes how we handle information collected when you access our platform, sign in, submit websites, or play the TopSAAS Runner.',
    ],
  },
  {
    heading: '2. Information We Collect',
    definitions: [
      {
        label: 'A. User Account Data:',
        body: 'When you sign in with Google OAuth, we receive your basic public profile information (name, email address, and avatar) provided by Google. This data is solely used to authenticate your session and link products you create.',
      },
      {
        label: 'B. Website Submissions:',
        body: 'Information you submit publicly to the directory, including website URLs, tool names, descriptions, categories, favicons, and social handles.',
      },
      {
        label: 'C. Gameplay & Score Verification Data:',
        body: 'When playing the TopSAAS Runner, session duration and score velocity are transmitted to our Supabase database to verify fair play and prevent automated scripts.',
      },
      {
        label: 'D. Payment Processing:',
        body: 'When purchasing a Featured Spot sponsorship, transactions are securely processed by third-party merchant of record and payment providers (Whop). TopSAAS does not process or store raw payment card data.',
      },
      {
        label: 'E. Local Storage:',
        body: "We use your browser's local storage to remember your UI preferences, such as sound FX settings, theme toggles, and view layout (grid vs. table).",
      },
    ],
  },
  {
    heading: '3. How We Use Your Data',
    paragraphs: ['We utilize the collected information strictly for legitimate operational purposes:'],
    bullets: [
      'Displaying, categorizing, and maintaining the public SaaS directory.',
      'Attributing and ranking legitimate community scores earned in the runner.',
      'Preventing bot attacks, duplicate submissions, and fraudulent leaderboard scripting.',
      'Enabling creators to manage, edit, and delist their products.',
    ],
    note: 'We never sell, lease, or monetize your personal data to third-party data brokers or advertisers.',
  },
  {
    heading: '4. Data Security & Storage',
    paragraphs: [
      'All data is secured using Supabase infrastructure with PostgreSQL Row Level Security (RLS) policies and HTTPS encrypted in-transit. Access to administrative management tools is strictly restricted to verified administrative users.',
    ],
  },
  {
    heading: '5. Your Privacy Rights & Deletion',
    paragraphs: [
      'You have the right to request the deletion of your account profile or the delisting of any submitted website at any time. Creators can manage or remove their tools directly from their profile page or contact our administration.',
    ],
  },
  {
    heading: '6. Contact & Inquiries',
    paragraphs: [
      'For any privacy inquiries, data deletion requests, or questions regarding this policy, please reach out to our team via Twitter/X or through our official community channels.',
    ],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: '1. Acceptance of Terms',
    paragraphs: [
      'By visiting, browsing, submitting content, or utilizing services on TopSAAS (the "Platform"), you agree to comply with and be bound by these Terms of Service. If you do not agree with any portion of these terms, please discontinue use of the platform.',
    ],
  },
  {
    heading: '2. Directory Submissions & Guidelines',
    paragraphs: ['By submitting a website or software product to TopSAAS:'],
    bullets: [
      'You confirm that you are the creator, owner, or authorized representative of the product.',
      'Your submitted website must be live, functional, and comply with standard web safety practices.',
      'Websites containing malicious software, phishing schemes, illegal content, or deceptive practices are strictly prohibited and will be permanently banned.',
      'TopSAAS reserves the right to review, edit category tags, approve, reject, or delist submissions to ensure quality.',
    ],
  },
  {
    heading: '3. Fair Play & Anti-Cheat Policy',
    paragraphs: ['The TopSAAS Runner is a community feature designed for authentic gameplay and organic product engagement:'],
    bullets: [
      'All scores submitted from game sessions are mathematically and velocity-verified by our anti-cheat engine.',
      'Automated botting, script injection, memory manipulation, or fake browser headless farming is strictly prohibited.',
      'Any product benefiting from fraudulent or scripted gameplay will have its scores reset or face permanent directory removal.',
    ],
  },
  {
    heading: '4. Featured Spots & Sponsorship Terms',
    paragraphs: [
      'Featured Spot placements provide guaranteed prominent display at the top of the homepage and in the TopSAAS Runner header for 30 consecutive days. As digital exposure commences immediately upon payment activation, sponsorship fees are non-refundable.',
    ],
  },
  {
    heading: '5. Trademarks & Intellectual Property',
    paragraphs: [
      'All software names, logos, screenshots, and trade names displayed on TopSAAS remain the intellectual property of their respective creators. TopSAAS indexes and showcases these assets solely for discovery, directory aggregation, and fair-use reference.',
    ],
  },
  {
    heading: '6. Limitation of Liability',
    paragraphs: [
      'TopSAAS is provided "as is" without warranties of any kind. TopSAAS does not guarantee specific traffic volume, conversion rates, or uninterrupted server availability. Under no circumstances shall TopSAAS or its operators be liable for indirect, incidental, or consequential damages resulting from platform usage.',
    ],
  },
  {
    heading: '7. Modifications to Terms',
    paragraphs: [
      'We reserve the right to modify these Terms of Service at any time. Revisions take effect immediately upon being posted on this page. Your continued use of the service constitutes agreement to updated terms.',
    ],
  },
];
