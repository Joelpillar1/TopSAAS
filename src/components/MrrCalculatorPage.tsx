import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { applyPageSeo } from '../utils/pageSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';

interface MrrCalculatorPageProps {
  soundEnabled: boolean;
}

interface CalculatorConfig {
  avgRevenue: string;
  customers: string;
  currency: string;
}

const STORAGE_KEY = 'topsaas_mrr_calculator_v2';
const LAST_UPDATED = 'November 7, 2026';

const SAMPLE_CONFIG: CalculatorConfig = {
  avgRevenue: '99',
  customers: '20',
  currency: 'USD',
};

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
] as const;

const KEY_TAKEAWAYS = [
  'MRR is the predictable monthly subscription revenue from active paying customers.',
  'The core formula is average revenue per customer multiplied by the number of paying customers.',
  'Annual and quarterly plans must be converted to a monthly equivalent before they are added to MRR.',
  'One-time fees, taxes, refunds, and free or trial users do not belong in MRR.',
];

const HOW_TO_STEPS = [
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

const MRR_COMPONENTS = [
  {
    name: 'New MRR',
    direction: 'Adds',
    description: 'Recurring revenue from customers who started paying during the period.',
    example: '10 new customers at $49 per month adds $490.',
  },
  {
    name: 'Expansion MRR',
    direction: 'Adds',
    description: 'Additional recurring revenue from existing customers who upgrade, add seats, or buy recurring add-ons.',
    example: 'A customer upgrades from $49 to $99, adding $50.',
  },
  {
    name: 'Reactivation MRR',
    direction: 'Adds',
    description: 'Recurring revenue from previously churned customers who return and start paying again.',
    example: 'A returning customer on a $99 plan adds $99.',
  },
  {
    name: 'Contraction MRR',
    direction: 'Subtracts',
    description: 'Lost recurring revenue when an existing customer downgrades or removes seats or add-ons.',
    example: 'A customer downgrades from $99 to $49, removing $50.',
  },
  {
    name: 'Churned MRR',
    direction: 'Subtracts',
    description: 'Recurring revenue lost when a customer cancels completely.',
    example: 'A $149 plan is cancelled, removing $149.',
  },
];

const METRIC_COMPARISON = [
  {
    metric: 'MRR',
    formula: 'Average revenue per customer × paying customers',
    answers: 'How much recurring revenue the business earns each month.',
  },
  {
    metric: 'ARR',
    formula: 'MRR × 12',
    answers: 'The annualized run rate at the current monthly pace.',
  },
  {
    metric: 'ARPA',
    formula: 'MRR ÷ active paying customers',
    answers: 'How much recurring revenue the average customer brings in each month.',
  },
  {
    metric: 'ACV',
    formula: 'Annual contract value ÷ contract length in years',
    answers: 'The yearly value of a single customer contract.',
  },
  {
    metric: 'Net new MRR',
    formula: 'New + expansion + reactivation − contraction − churn',
    answers: 'How much MRR the business gained or lost in a period.',
  },
  {
    metric: 'Quick ratio',
    formula: '(New MRR + expansion MRR) ÷ (churned MRR + contraction MRR)',
    answers: 'How efficiently growth offsets revenue lost to churn and downgrades.',
  },
];

const ANNUAL_PLAN_ROWS = [
  { annual: '$120', monthly: '$10.00' },
  { annual: '$299', monthly: '$24.92' },
  { annual: '$599', monthly: '$49.92' },
  { annual: '$1,200', monthly: '$100.00' },
  { annual: '$2,400', monthly: '$200.00' },
  { annual: '$12,000', monthly: '$1,000.00' },
];

const INCLUDE_ITEMS = [
  'Monthly subscription fees',
  'Recurring seat charges',
  'Recurring add-ons and integrations',
  'Recurring usage charges that repeat each month',
  'Monthly equivalents of annual and quarterly plans',
  'Discounted recurring revenue, recorded at the amount actually billed',
];

const EXCLUDE_ITEMS = [
  'One-time setup and onboarding fees',
  'Professional services and consulting',
  'Taxes and VAT',
  'Refunds and credits',
  'Free, trial, and freemium users',
  'Hardware, shipping, and other non-recurring sales',
  'Cash collected in advance for a future period',
];

const MISTAKES = [
  {
    title: 'Counting annual plans at their full annual value',
    body: 'An annual plan billed at $1,200 contributes $100 to MRR, not $1,200. Divide the annual price by 12 so every plan is measured on the same monthly basis.',
  },
  {
    title: 'Including one-time revenue',
    body: 'Setup fees, consulting, and services inflate the number and hide the health of the subscription business. Keep them in total revenue, not MRR.',
  },
  {
    title: 'Counting trials and free users',
    body: 'A trial is not recurring revenue until billing starts. Including free accounts overstates MRR and distorts ARPA.',
  },
  {
    title: 'Ignoring downgrades and churn',
    body: 'MRR is a net number. New customers can mask contraction and churn, so track the components separately as well as the total.',
  },
  {
    title: 'Using cash collected instead of revenue earned',
    body: 'Annual prepayments create a cash spike that is not MRR. Recognize the revenue month by month and keep cash flow reporting separate.',
  },
  {
    title: 'Changing the definition every month',
    body: 'Pick a definition, document it, and apply it consistently. Otherwise month-over-month growth becomes impossible to compare.',
  },
];

const GROWTH_LEVERS = [
  {
    title: 'Acquire more paying customers',
    body: 'Improve acquisition through clearer positioning, better landing pages, and channels where your buyers already spend time. New MRR is the most direct lever.',
  },
  {
    title: 'Convert more trials and free users',
    body: 'Shorten time to value, add activation milestones, and remove friction from checkout. A higher trial-to-paid rate raises MRR without more traffic.',
  },
  {
    title: 'Expand existing accounts',
    body: 'Seat growth, usage tiers, and recurring add-ons increase expansion MRR. Expansion is usually cheaper than acquiring a new logo.',
  },
  {
    title: 'Reduce churn and contraction',
    body: 'Track churned MRR and contraction MRR separately. Onboarding quality, support response time, and annual commitments all protect recurring revenue.',
  },
  {
    title: 'Raise prices with better packaging',
    body: 'A price increase applies to every new and renewing customer. Test packaging and annual discounts carefully so the change does not increase churn.',
  },
];

const MRR_FAQS = [
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

const TOC = [
  { id: 'calculator', label: 'MRR calculator' },
  { id: 'what-is-mrr', label: 'What is MRR?' },
  { id: 'how-to-calculate', label: 'How to calculate MRR' },
  { id: 'formula', label: 'MRR formula' },
  { id: 'examples', label: 'Worked examples' },
  { id: 'annual-plans', label: 'Annual plan conversion' },
  { id: 'mrr-vs-arr', label: 'MRR vs ARR vs ARPA' },
  { id: 'include-exclude', label: 'What counts in MRR' },
  { id: 'types-of-mrr', label: 'Types of MRR' },
  { id: 'mistakes', label: 'Common mistakes' },
  { id: 'growth', label: 'How to grow MRR' },
  { id: 'faq', label: 'FAQ' },
  { id: 'sources', label: 'Sources' },
];

const RELATED_TOOLS = [
  {
    title: 'SaaS directory',
    body: 'Browse the full TopSAAS directory and see what founders are launching right now.',
    route: '/',
  },
  {
    title: 'SaaS ideas',
    body: 'Explore open-source starters and product ideas you can build on.',
    route: '/ideas',
  },
  {
    title: 'Trending projects',
    body: 'See which repositories and products are gaining attention this week.',
    route: '/trending',
  },
  {
    title: 'Build guides',
    body: 'Step-by-step walkthroughs for shipping a real product on a curated repo.',
    route: '/guides',
  },
  {
    title: 'Pricing',
    body: 'Compare TopSAAS launch and featured placement options.',
    route: '/pricing',
  },
  {
    title: 'Submit your SaaS',
    body: 'Launch your product and get discovered by founders and early adopters.',
    route: '/submit',
  },
];

const SOURCES = [
  {
    label: 'Investopedia: Recurring revenue',
    href: 'https://www.investopedia.com/terms/r/recurringrevenue.asp',
  },
  {
    label: 'Stripe: What is monthly recurring revenue (MRR)?',
    href: 'https://stripe.com/resources/more/what-is-monthly-recurring-revenue',
  },
  {
    label: 'Baremetrics Academy: MRR',
    href: 'https://baremetrics.com/academy/mrr',
  },
  {
    label: 'ChartMogul: Monthly Recurring Revenue (MRR)',
    href: 'https://chartmogul.com/saas-metrics/mrr',
  },
  {
    label: 'SaaS Capital: SaaS research and benchmarks',
    href: 'https://www.saas-capital.com/research/',
  },
];

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-base font-bold text-neutral-950 outline-none transition-colors placeholder:font-medium placeholder:text-neutral-300 focus:border-mint-500 focus:ring-2 focus:ring-mint-500/15';

const toAmount = (value: string) => Math.max(0, Number(value) || 0);
const toCustomerCount = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

const cleanAmount = (value: unknown) =>
  typeof value === 'string' && /^\d*(\.\d{0,2})?$/.test(value) ? value : '';
const cleanCustomers = (value: unknown) =>
  typeof value === 'string' && /^\d*$/.test(value) ? value : '';

const loadConfig = (): CalculatorConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Record<string, unknown>;
      const currency =
        typeof parsed.currency === 'string' &&
        CURRENCIES.some((c) => c.code === parsed.currency)
          ? parsed.currency
          : 'USD';
      return {
        avgRevenue: cleanAmount(parsed.avgRevenue),
        customers: cleanCustomers(parsed.customers),
        currency,
      };
    }
  } catch { }

  return { ...SAMPLE_CONFIG };
};

const DirectAnswer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="rounded-r-xl border-l-2 border-mint-500 bg-neutral-50 px-4 py-3 text-sm font-medium leading-relaxed text-neutral-700">
    {children}
  </p>
);

export const MrrCalculatorPage: React.FC<MrrCalculatorPageProps> = ({ soundEnabled }) => {
  const [config, setConfig] = useState<CalculatorConfig>(loadConfig);

  const { avgRevenue, customers: customerInput, currency } = config;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch { }
  }, [config]);

  useEffect(() => {
    return applyPageSeo({
      title: 'SaaS MRR Calculator: Free Monthly Recurring Revenue Tool | TopSAAS',
      description:
        'Calculate SaaS MRR and ARR instantly from average revenue per customer and paying customers. Includes formulas, worked examples, annual plan conversion, and an MRR FAQ.',
      canonical: '/mrr-calculator',
      jsonLdId: 'mrr-calculator-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            name: 'SaaS MRR Calculator',
            url: 'https://www.topsaas.space/mrr-calculator',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Any',
            description:
              'Free monthly recurring revenue calculator for SaaS businesses. Enter average revenue per customer and active paying customers to calculate MRR and ARR.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            featureList: [
              'Calculate SaaS MRR from average revenue per customer',
              'Convert MRR to annualized ARR',
              'Multi-currency support',
              'Worked MRR examples and annual plan conversion',
            ],
          },
          {
            '@type': 'FAQPage',
            mainEntity: MRR_FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          },
          {
            '@type': 'HowTo',
            name: 'How to calculate monthly recurring revenue (MRR)',
            description:
              'Calculate SaaS MRR by normalizing recurring revenue to a monthly figure and dividing by active paying customers.',
            step: HOW_TO_STEPS.map((step, index) => ({
              '@type': 'HowToStep',
              position: index + 1,
              name: step.title,
              text: step.body,
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.topsaas.space/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'SaaS MRR Calculator',
                item: 'https://www.topsaas.space/mrr-calculator',
              },
            ],
          },
        ],
      },
    });
  }, []);

  const currencyMeta = useMemo(
    () => CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0],
    [currency]
  );

  const averageRevenue = toAmount(avgRevenue);
  const customerCount = toCustomerCount(customerInput);
  const mrr = averageRevenue * customerCount;
  const arr = mrr * 12;

  const formatMoney = (value: number, digits?: number) => {
    const decimals = digits ?? (Number.isInteger(value) ? 0 : 2);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const clearValues = () => {
    playSound('click', soundEnabled);
    setConfig((prev) => ({ ...prev, avgRevenue: '', customers: '' }));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-3.5 sm:px-6 pt-5 pb-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[11px] font-semibold text-neutral-500">
        <button
          type="button"
          onClick={() => navigateTo('/')}
          className="transition-colors hover:text-neutral-950 cursor-pointer"
        >
          Home
        </button>
        <span className="px-1.5 text-neutral-300">/</span>
        <span aria-current="page" className="text-neutral-700">
          MRR Calculator
        </span>
      </nav>

      {/* Hero */}
      <header className="mx-auto mt-6 max-w-3xl text-center">
        <h1 className="text-3xl font-black leading-[1.1] tracking-tight text-neutral-950 sm:text-4xl">
          SaaS MRR Calculator
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-relaxed text-neutral-500 sm:text-base">
          Calculate monthly recurring revenue and annual run rate in seconds. Enter your average
          revenue per customer and active paying customers, then read the formula, worked examples,
          and the full MRR FAQ below.
        </p>

        <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-mint-500/30 bg-mint-500/[0.06] px-5 py-4 text-left">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-mint-700">
            Quick answer
          </p>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-neutral-700">
            MRR is the recurring revenue your SaaS earns from active paying customers in a month.
            Calculate it as <strong className="font-black text-neutral-950">average revenue per customer × number of paying customers</strong>.
            The calculator below returns MRR and ARR instantly.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-neutral-500">
          <span>Last updated: {LAST_UPDATED}</span>
          <span className="text-neutral-300">·</span>
          <span>Free, no sign-up required</span>
          <span className="text-neutral-300">·</span>
          <span>Runs in your browser</span>
        </div>
      </header>

      {/* Calculator */}
      <section id="calculator" aria-labelledby="mrr-inputs-heading" className="mt-8 scroll-mt-24">
        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="mrr-inputs-heading" className="text-sm font-black text-neutral-950">
                  Your numbers
                </h2>
                <p className="mt-0.5 max-w-md text-[11px] font-medium text-neutral-500">
                  Use your blended monthly average across every plan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="mrr-currency" className="sr-only">
                  Currency
                </label>
                <select
                  id="mrr-currency"
                  value={currency}
                  onChange={(e) => setConfig((prev) => ({ ...prev, currency: e.target.value }))}
                  className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-700 outline-none transition-colors focus:border-mint-500 focus:ring-2 focus:ring-mint-500/15"
                >
                  {CURRENCIES.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={clearValues}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-neutral-600 transition-colors hover:border-neutral-400 hover:text-neutral-950 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="mrr-avg" className="block text-sm font-bold text-neutral-900">
                  Average MRR per customer
                </label>
                <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
                  How much recurring revenue do you get from a customer in a month, on average?
                </p>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                    {currencyMeta.symbol}
                  </span>
                  <input
                    id="mrr-avg"
                    type="text"
                    inputMode="decimal"
                    value={avgRevenue}
                    onChange={(e) => {
                      const next = e.target.value;
                      if (/^\d*(\.\d{0,2})?$/.test(next)) {
                        setConfig((prev) => ({ ...prev, avgRevenue: next }));
                      }
                    }}
                    placeholder="99"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mrr-customers" className="block text-sm font-bold text-neutral-900">
                  Number of customers
                </label>
                <p className="mt-0.5 text-[11px] font-medium text-neutral-500">
                  How many active paying customers do you have right now?
                </p>
                <input
                  id="mrr-customers"
                  type="text"
                  inputMode="numeric"
                  value={customerInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (/^\d*$/.test(next)) {
                      setConfig((prev) => ({ ...prev, customers: next }));
                    }
                  }}
                  placeholder="20"
                  className={`${inputClass} mt-2`}
                />
              </div>
            </div>

            <p className="mt-4 text-[11px] font-medium leading-relaxed text-neutral-500">
              Only recurring subscription revenue counts. For annual plans, use the yearly price
              divided by 12, and exclude one-time fees, trials, and free users.
            </p>
          </div>

          {/* Results */}
          <aside
            aria-label="Your MRR results"
            className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-100 p-5 sm:p-6 lg:sticky lg:top-20"
          >
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              <Wallet className="h-4 w-4 text-mint-600" />
              Your MRR is
            </div>
            <p
              aria-live="polite"
              className="mt-2 text-4xl font-black tracking-tight tabular-nums text-neutral-950 sm:text-5xl"
            >
              {formatMoney(mrr)}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-neutral-500">per month</p>

            <div className="mt-6 border-t border-neutral-200 pt-5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">
                <CalendarDays className="h-4 w-4 text-mint-600" />
                Your annualized ARR is
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight tabular-nums text-neutral-950 sm:text-4xl">
                {formatMoney(arr)}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-neutral-500">per year</p>
            </div>

            <div className="mt-auto pt-6">
              <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-neutral-500">
                {customerCount.toLocaleString()} active customer
                {customerCount === 1 ? '' : 's'} × {formatMoney(averageRevenue)}/mo ={' '}
                {formatMoney(mrr)} MRR
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-3 text-center text-[11px] font-medium text-neutral-400">
          Your inputs stay in this browser. Nothing is sent to a server.
        </p>
      </section>

      {/* Article */}
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px]">
        <article className="min-w-0 space-y-10">
          {/* Key takeaways */}
          <section aria-labelledby="key-takeaways-heading" className="scroll-mt-24">
            <h2 id="key-takeaways-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              Key takeaways
            </h2>
            <ul className="mt-4 space-y-2.5">
              {KEY_TAKEAWAYS.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm font-medium leading-relaxed text-neutral-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* What is MRR */}
          <section id="what-is-mrr" aria-labelledby="what-is-mrr-heading" className="scroll-mt-24 space-y-4">
            <h2 id="what-is-mrr-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              What is MRR?
            </h2>
            <DirectAnswer>
              Monthly recurring revenue (MRR) is the predictable subscription revenue a SaaS
              business earns from active paying customers in a month, normalized to a monthly
              figure. It excludes one-time fees, services, taxes, and free users.
            </DirectAnswer>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              MRR answers a simple question: if nothing changed, how much revenue would the business
              earn next month from customers who are already paying? That makes it the most useful
              top-line metric for subscription businesses, because it removes the noise of annual
              prepayments, one-off projects, and seasonal cash swings.
            </p>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              Investors, operators, and founders use MRR to track growth, forecast runway, and compare
              performance across months. It is also the base for related metrics such as ARR, ARPA,
              net new MRR, and the SaaS quick ratio. If you only track one recurring metric, track
              MRR, then break it down into new, expansion, contraction, and churn every month.
            </p>
          </section>

          {/* How to calculate */}
          <section id="how-to-calculate" aria-labelledby="how-to-calculate-heading" className="scroll-mt-24 space-y-4">
            <h2 id="how-to-calculate-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              How to calculate MRR
            </h2>
            <DirectAnswer>
              To calculate MRR, add the monthly recurring revenue from every active paying customer,
              then normalize annual and quarterly plans to their monthly equivalent. The result is
              your MRR for the period.
            </DirectAnswer>
            <ol className="space-y-4">
              {HOW_TO_STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-xs font-black text-neutral-700">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-950">{step.title}</h3>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Formula */}
          <section id="formula" aria-labelledby="formula-heading" className="scroll-mt-24 space-y-4">
            <h2 id="formula-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              MRR formula
            </h2>
            <DirectAnswer>
              MRR = average revenue per customer × number of active paying customers. For a
              multi-plan business, add each plan price multiplied by its customer count to get total
              MRR.
            </DirectAnswer>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-center font-mono text-base font-bold text-neutral-950 sm:text-lg">
                MRR = ARPA × active paying customers
              </p>
              <p className="mt-2 text-center font-mono text-sm font-semibold text-neutral-600">
                ARR = MRR × 12
              </p>
              <p className="mt-2 text-center font-mono text-sm font-semibold text-neutral-600">
                ARPA = MRR ÷ active paying customers
              </p>
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              The formula looks simple because the work is in the definition. A customer on an annual
              plan must be converted to a monthly value. A discounted plan must be recorded at the
              amount actually billed. A usage-based plan must be normalized to a recurring monthly
              amount. Once every active subscription is on the same monthly basis, the addition is
              straightforward.
            </p>
          </section>

          {/* Examples */}
          <section id="examples" aria-labelledby="examples-heading" className="scroll-mt-24 space-y-5">
            <h2 id="examples-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              Worked MRR examples
            </h2>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              These examples show how the same formula handles a single plan, a blended multi-plan
              business, and annual contracts.
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-sm font-black text-neutral-950">Example 1: single-plan indie SaaS</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
                  A product charges $29 per month and has 120 paying customers.
                </p>
                <p className="mt-2 font-mono text-sm font-bold text-neutral-950">
                  $29 × 120 = $3,480 MRR
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-neutral-600">
                  $3,480 × 12 = $41,760 ARR
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-sm font-black text-neutral-950">Example 2: blended multi-plan SaaS</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
                  A product has 80 customers on $19, 40 on $49, and 10 on $199.
                </p>
                <p className="mt-2 font-mono text-sm font-bold text-neutral-950">
                  (80 × $19) + (40 × $49) + (10 × $199) = $5,470 MRR
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-neutral-600">
                  $5,470 ÷ 130 customers = $42.08 ARPA
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-neutral-600">
                  $5,470 × 12 = $65,640 ARR
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-sm font-black text-neutral-950">Example 3: annual contracts</h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">
                  A product sells an annual plan at $1,200 to 40 customers.
                </p>
                <p className="mt-2 font-mono text-sm font-bold text-neutral-950">
                  $1,200 ÷ 12 = $100 monthly equivalent
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-neutral-600">
                  40 × $100 = $4,000 MRR
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-neutral-600">
                  $4,000 × 12 = $48,000 ARR
                </p>
              </div>
            </div>
          </section>

          {/* Annual plans */}
          <section id="annual-plans" aria-labelledby="annual-plans-heading" className="scroll-mt-24 space-y-4">
            <h2 id="annual-plans-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              Annual plan to monthly MRR conversion
            </h2>
            <DirectAnswer>
              Divide the annual price by 12 to get the monthly MRR contribution. A $1,200 annual
              plan contributes $100 to MRR each month, even though the customer pays once.
            </DirectAnswer>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Annual price</th>
                    <th scope="col" className="px-4 py-3">Monthly MRR equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  {ANNUAL_PLAN_ROWS.map((row) => (
                    <tr key={row.annual}>
                      <td className="px-4 py-2.5 font-semibold">{row.annual} per year</td>
                      <td className="px-4 py-2.5 font-mono font-bold text-neutral-950">{row.monthly} per month</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              The same logic applies to quarterly and multi-year contracts. Divide the contract value
              by the number of months in the term. If a customer receives a multi-month discount,
              spread the discounted total across the term rather than recording the list price.
            </p>
          </section>

          {/* MRR vs ARR vs ARPA */}
          <section id="mrr-vs-arr" aria-labelledby="mrr-vs-arr-heading" className="scroll-mt-24 space-y-4">
            <h2 id="mrr-vs-arr-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              MRR vs ARR vs ARPA vs ACV
            </h2>
            <DirectAnswer>
              MRR measures monthly recurring revenue. ARR is MRR multiplied by 12. ARPA is MRR divided
              by active paying customers. ACV is the annual value of a single contract.
            </DirectAnswer>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Metric</th>
                    <th scope="col" className="px-4 py-3">Formula</th>
                    <th scope="col" className="px-4 py-3">What it answers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  {METRIC_COMPARISON.map((row) => (
                    <tr key={row.metric}>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-neutral-950">{row.metric}</td>
                      <td className="px-4 py-3 font-mono text-[12px] font-semibold">{row.formula}</td>
                      <td className="px-4 py-3 font-medium">{row.answers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              A useful habit is to report MRR and its components together. A rising MRR total can hide
              a high churn rate if new sales are masking lost revenue. New, expansion, reactivation,
              contraction, and churned MRR explain why the total moved, while ARR and ARPA make the
              business comparable across periods.
            </p>
          </section>

          {/* Include / exclude */}
          <section id="include-exclude" aria-labelledby="include-exclude-heading" className="scroll-mt-24 space-y-4">
            <h2 id="include-exclude-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              What counts in MRR and what does not
            </h2>
            <DirectAnswer>
              Include recurring subscription fees, seats, add-ons, and recurring usage charges.
              Exclude one-time fees, services, taxes, refunds, free users, trials, and non-recurring
              sales.
            </DirectAnswer>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-sm font-black text-neutral-950">Include</h3>
                <ul className="mt-3 space-y-2">
                  {INCLUDE_ITEMS.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-medium leading-relaxed text-neutral-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mint-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <h3 className="text-sm font-black text-neutral-950">Exclude</h3>
                <ul className="mt-3 space-y-2">
                  {EXCLUDE_ITEMS.map((item) => (
                    <li key={item} className="flex gap-2 text-sm font-medium leading-relaxed text-neutral-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Types of MRR */}
          <section id="types-of-mrr" aria-labelledby="types-of-mrr-heading" className="scroll-mt-24 space-y-4">
            <h2 id="types-of-mrr-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              Types of MRR and how net new MRR works
            </h2>
            <DirectAnswer>
              Net new MRR = new MRR + expansion MRR + reactivation MRR − contraction MRR − churned
              MRR. It shows whether the recurring revenue base grew or shrank during the period.
            </DirectAnswer>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] font-black uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-3">Component</th>
                    <th scope="col" className="px-4 py-3">Effect</th>
                    <th scope="col" className="px-4 py-3">What it captures</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-700">
                  {MRR_COMPONENTS.map((row) => (
                    <tr key={row.name}>
                      <td className="whitespace-nowrap px-4 py-3 font-bold text-neutral-950">{row.name}</td>
                      <td className={`whitespace-nowrap px-4 py-3 font-mono text-[12px] font-bold ${row.direction === 'Adds' ? 'text-mint-700' : 'text-red-600'}`}>
                        {row.direction === 'Adds' ? '+' : '−'}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {row.description}
                        <span className="mt-1 block text-[12px] text-neutral-500">{row.example}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              For example, if a business adds $2,000 of new MRR, earns $500 of expansion, loses $400
              to churn, and loses $100 to contraction, net new MRR is $2,000. Its quick ratio is
              (2,000 + 500) ÷ (400 + 100) = 5.0. A quick ratio above 4 is generally considered strong,
              but the right target depends on stage and market.
            </p>
          </section>

          {/* Mistakes */}
          <section id="mistakes" aria-labelledby="mistakes-heading" className="scroll-mt-24 space-y-4">
            <h2 id="mistakes-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              Common MRR calculation mistakes
            </h2>
            <DirectAnswer>
              The most common MRR mistakes are counting annual plans at their full annual value,
              including one-time revenue, counting trials, ignoring churn, and mixing cash with
              revenue.
            </DirectAnswer>
            <div className="space-y-3">
              {MISTAKES.map((item) => (
                <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-neutral-950">{item.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Growth */}
          <section id="growth" aria-labelledby="growth-heading" className="scroll-mt-24 space-y-4">
            <h2 id="growth-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              How to grow MRR
            </h2>
            <DirectAnswer>
              MRR grows through five levers: more new customers, higher trial conversion, expansion
              revenue, lower churn and contraction, and better pricing and packaging.
            </DirectAnswer>
            <div className="space-y-3">
              {GROWTH_LEVERS.map((item) => (
                <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <h3 className="text-sm font-bold text-neutral-950">{item.title}</h3>
                  <p className="mt-1 text-sm font-medium leading-relaxed text-neutral-600">{item.body}</p>
                </div>
              ))}
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              Use the calculator to model a target. If you want to reach a specific MRR, divide the
              target by your ARPA to see how many paying customers you need, then compare that number
              with your current customer count and realistic monthly growth.
            </p>
          </section>

          {/* FAQ */}
          <section id="faq" aria-labelledby="mrr-faq-heading" className="mx-auto w-full max-w-2xl scroll-mt-24 pt-2">
            <h2
              id="mrr-faq-heading"
              className="text-center text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
            >
              MRR Calculator FAQ
            </h2>

            <div className="mt-8 space-y-8">
              {MRR_FAQS.map((faq) => (
                <div key={faq.q}>
                  <h3 className="text-base font-bold text-neutral-950 sm:text-lg">{faq.q}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-500">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Sources */}
          <section id="sources" aria-labelledby="sources-heading" className="scroll-mt-24 space-y-4">
            <h2 id="sources-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
              Sources and further reading
            </h2>
            <p className="text-sm font-medium leading-relaxed text-neutral-600">
              Definitions and formulas on this page follow standard SaaS subscription accounting.
              These external references are useful if you want to go deeper into MRR, ARR, and
              subscription analytics.
            </p>
            <ul className="space-y-2.5">
              {SOURCES.map((source) => (
                <li key={source.href}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-700 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-950 hover:decoration-neutral-950"
                  >
                    {source.label}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </li>
              ))}
            </ul>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
                Cite this page
              </p>
              <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-neutral-600">
                TopSAAS. &ldquo;SaaS MRR Calculator.&rdquo; https://www.topsaas.space/mrr-calculator.
                Last updated {LAST_UPDATED}.
              </p>
            </div>
            <p className="text-[11px] font-medium leading-relaxed text-neutral-500">
              This calculator is a planning tool, not financial advice. Use your own billing data for
              reporting and consult an accountant for tax and revenue recognition questions.
            </p>
          </section>
        </article>

        {/* Table of contents */}
        <aside className="hidden lg:block">
          <nav
            aria-label="On this page"
            className="sticky top-24 rounded-2xl border border-neutral-200 bg-white p-4"
          >
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-neutral-500">
              On this page
            </p>
            <ul className="mt-3 space-y-2 text-xs font-semibold text-neutral-600">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="transition-colors hover:text-neutral-950"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      {/* Related tools */}
      <section aria-labelledby="related-tools-heading" className="mt-14">
        <h2 id="related-tools-heading" className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl">
          Keep exploring on TopSAAS
        </h2>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-neutral-600">
          The calculator helps you measure recurring revenue. These pages help you launch, position,
          and grow the product behind it.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RELATED_TOOLS.map((tool) => (
            <button
              key={tool.route}
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                navigateTo(tool.route);
              }}
              className="group flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 text-left transition-all hover:border-neutral-300 hover:bg-neutral-50/70 cursor-pointer"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-neutral-950">{tool.title}</span>
                <ArrowUpRight className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-neutral-950" />
              </span>
              <span className="mt-2 text-xs font-medium leading-relaxed text-neutral-600">
                {tool.body}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-mint-500/30 bg-mint-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-neutral-950">Ready to grow that MRR?</h2>
          <p className="mt-0.5 text-xs font-medium text-neutral-600">
            Launch your SaaS on TopSAAS and get discovered by founders, builders, and early
            adopters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            playSound('click', soundEnabled);
            navigateTo('/submit');
          }}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-neutral-800 cursor-pointer"
        >
          Launch your SaaS
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
