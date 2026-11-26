/**
 * Copy that both the React pages and the build-time prerenderer render.
 *
 * The SPA routes below are prerendered into static HTML so crawlers and AI
 * agents see real content without executing JavaScript. Keeping the FAQ and
 * step copy here means the static page and the hydrated page cannot drift.
 */

export interface CoreFaq {
  q: string;
  a: string;
}

export interface CoreStep {
  title: string;
  body: string;
}

export const MRR_KEY_TAKEAWAYS: string[] = [
  'MRR is the predictable monthly subscription revenue from active paying customers.',
  'The core formula is average revenue per customer multiplied by the number of paying customers.',
  'Annual and quarterly plans must be converted to a monthly equivalent before they are added to MRR.',
  'One-time fees, taxes, refunds, and free or trial users do not belong in MRR.',
];

export const MRR_HOW_TO_STEPS: CoreStep[] = [
  {
    title: 'Choose a period',
    body: 'Use a calendar month so every calculation compares the same window. Most teams report MRR at the end of the month or on the first day of the next month.',
  },
  {
    title: 'List active paying customers',
    body: 'Count every customer who is currently billed on a recurring basis. Exclude trials, freemium accounts, and customers who have cancelled before the period ends.',
  },
  {
    title: 'Normalize every plan to monthly',
    body: 'Monthly plans count as billed. Annual plans are divided by 12. Quarterly plans are divided by 3. Usage and add-on revenue counts only when it repeats every month.',
  },
  {
    title: 'Add the recurring revenue together',
    body: 'Total the monthly value of every active subscription. This sum is your MRR before discounts, taxes, and one-time charges are considered.',
  },
  {
    title: 'Divide by customers to get ARPA',
    body: 'Average revenue per account (ARPA) is MRR divided by active paying customers. It tells you how much the average customer contributes each month.',
  },
];

export const MRR_FAQS: CoreFaq[] = [
  {
    q: 'What is MRR?',
    a: 'Monthly recurring revenue (MRR) is the predictable subscription revenue a SaaS business earns from active paying customers in a month, normalized to a monthly figure.',
  },
  {
    q: 'How is MRR calculated?',
    a: 'MRR = average revenue per customer × number of active paying customers. For multiple plans, add each plan price multiplied by its customer count, then divide by total customers to get the blended average used in this calculator.',
  },
  {
    q: 'What should I include in MRR?',
    a: 'Include recurring subscription fees, recurring seat charges, recurring add-ons, and recurring usage charges. Include the monthly equivalent of annual and quarterly plans at the amount actually billed after discounts.',
  },
  {
    q: 'What should I exclude from MRR?',
    a: 'Exclude one-time setup fees, professional services, consulting, taxes, refunds, hardware, and non-recurring sales. Do not count free users, trials, or cash collected in advance for a future period.',
  },
  {
    q: 'How do annual plans count toward MRR?',
    a: 'Divide the annual price by 12 to get the monthly equivalent. An annual plan billed at $1,200 contributes $100 to MRR each month, even though the cash arrives once.',
  },
  {
    q: 'What is the difference between MRR and ARR?',
    a: 'ARR is the annualized run rate: MRR × 12. It shows what the business would bill over a year at the current monthly pace. It is not the same as cash collected or recognized annual revenue.',
  },
  {
    q: 'What is ARPA and how is it different from MRR?',
    a: 'Average revenue per account (ARPA) is MRR divided by active paying customers. MRR measures the size of the recurring revenue base; ARPA measures how much the average customer contributes each month.',
  },
  {
    q: 'What is net new MRR?',
    a: 'Net new MRR is new MRR plus expansion MRR plus reactivation MRR, minus contraction MRR and churned MRR. It is the amount your recurring revenue base grew or shrank during the period.',
  },
  {
    q: 'Do free users and trials count toward MRR?',
    a: 'No. Only customers who are currently paying count toward MRR. Trials, freemium users, and cancelled accounts are excluded until billing starts.',
  },
  {
    q: 'Is MRR the same as revenue or cash?',
    a: 'No. Total revenue can include one-time payments, services, and other non-recurring income. Cash is what actually arrives, which can include annual prepayments. MRR focuses only on recurring revenue earned in the month.',
  },
  {
    q: 'How do discounts and coupons affect MRR?',
    a: 'Record MRR at the amount the customer is actually billed. A $99 plan with a permanent 20% discount contributes $79.20 to MRR. Temporary discounts can be reflected while they are active.',
  },
  {
    q: 'How do I calculate MRR for usage-based pricing?',
    a: 'Use the recurring portion of usage revenue. If usage is billed every month and is predictable enough to forecast, include a normalized monthly amount. Exclude one-off overages that will not repeat.',
  },
  {
    q: 'How often should I calculate MRR?',
    a: 'Calculate MRR at least once a month, on the same date each period. Most teams report it monthly and review the components, new, expansion, contraction, and churn, alongside the total.',
  },
  {
    q: 'What is a good MRR growth rate?',
    a: 'There is no universal number. Early-stage SaaS can grow quickly from a small base, while larger companies grow more slowly in percentage terms. Compare growth with your own previous months, your stage, and your churn rate rather than a single benchmark.',
  },
];

export const PRICING_FAQS: CoreFaq[] = [
  {
    q: 'What is the difference between Free and the $9 Verified Launch?',
    a: 'Free submissions enter a manual queue that takes 7–14 days, with a standard nofollow backlink. The $9 Verified Launch (normally $15) gives you fast-track review within 24 hours, permanent high-authority DoFollow backlink, official Verified Mint Badge on card & profile, category top-3 pinned spot (7 Days), a dedicated 1,000+ word story on /blog, and /llms.txt AI search inclusion (ChatGPT, Perplexity and more).',
  },
  {
    q: 'Is the $9 Verified Launch a recurring subscription?',
    a: 'No! The Verified Launch is a simple one-time payment of $9 per product (limited offer from $15). You get permanent lifetime directory listing, verified badge, and dofollow backlink with zero recurring subscription fees.',
  },
  {
    q: 'What is the difference between Featured Spot and Sidebar Sponsor?',
    a: 'Featured Spot ($15/week or $39/month) pins your product card directly at the top of the main product feed above normal listings for maximum visibility while visitors browse and upvote. Sidebar Sponsor ($10/week or $29/month) places your product on the 24/7 sticky side rails across the Homepage and Product Details pages for sustained peripheral awareness.',
  },
  {
    q: 'What is a DoFollow backlink?',
    a: 'Free listings receive a nofollow link. Paid plans receive a permanent dofollow link, passing search engine authority from TopSAAS to your website to help your domain rank higher in Google over time.',
  },
  {
    q: 'How does the llms.txt / AI ingestion work?',
    a: 'Verified listings are indexed in our /llms.txt file with structured JSON metadata. When AI tools like ChatGPT, Perplexity, Claude, and emergent AI agents crawl TopSAAS for software recommendations, your product is directly readable by their engines.',
  },
  {
    q: 'What is the verified badge?',
    a: 'Verified listings receive a mint rosette badge on the TopSAAS directory card and details page. You also get embeddable SVG code to display your verified TopSAAS status on your landing page.',
  },
];

export const SUBMIT_STEPS: Array<{ title: string; body: string }> = [
  {
    title: 'Website',
    body: 'Paste your product URL and let AI auto-fill the name, tagline, description and category. Adjust anything the autofill gets wrong before you continue.',
  },
  {
    title: 'Media',
    body: 'Upload a square logo and optional screenshots, then add a demo video link if you have one. Listings with real screenshots get noticeably more clicks.',
  },
  {
    title: 'Founder',
    body: 'Add the maker behind the product: your name, X handle and social profiles. Founder details build trust with voters and help us verify ownership.',
  },
  {
    title: 'Launch',
    body: 'Choose a launch week, pick free or the $9 Verified Launch, and submit. Free reviews take 7–14 days; Verified Launch reviews are fast-tracked within 24 hours.',
  },
];
