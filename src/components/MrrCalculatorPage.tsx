import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  Calculator,
  ChevronDown,
  HelpCircle,
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

const MRR_FAQS = [
  {
    q: 'What is MRR?',
    a: 'Monthly recurring revenue (MRR) is the predictable subscription revenue your SaaS earns from active paying customers in a month, normalized to a monthly figure.',
  },
  {
    q: 'How is MRR calculated?',
    a: 'MRR = average revenue per customer × number of active paying customers. If you have several plans, add up each plan price × its customer count, then divide by your total customers to get the blended average used here.',
  },
  {
    q: 'What should I include in MRR?',
    a: 'Include recurring subscription fees, recurring add-ons, and recurring usage charges. Leave out one-time setup fees, consulting or services, refunds, and taxes.',
  },
  {
    q: 'How do annual plans count toward MRR?',
    a: 'Divide the annual price by 12 to get the monthly equivalent. An annual plan billed at $1,200 contributes $100 to MRR each month, even though the cash arrives once.',
  },
  {
    q: 'What is the difference between MRR and ARR?',
    a: 'ARR is your annualized run rate: MRR × 12. It shows what the business would bill over a year at the current monthly pace. It is not the same as cash collected.',
  },
  {
    q: 'Do free users and trials count?',
    a: 'No. Only customers who are currently paying count toward MRR. Trials, freemium users, and cancelled accounts are excluded until billing starts.',
  },
  {
    q: 'What is ARPA?',
    a: 'Average revenue per account (ARPA) is MRR ÷ active customers. It tells you how much recurring revenue the average paying customer brings in each month.',
  },
  {
    q: 'Is MRR the same as total revenue?',
    a: 'No. Total revenue can include one-time payments, services, and other non-recurring income. MRR focuses only on revenue that repeats every month.',
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

export const MrrCalculatorPage: React.FC<MrrCalculatorPageProps> = ({ soundEnabled }) => {
  const [config, setConfig] = useState<CalculatorConfig>(loadConfig);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const { avgRevenue, customers: customerInput, currency } = config;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch { }
  }, [config]);

  useEffect(() => {
    return applyPageSeo({
      title: 'SaaS MRR Calculator — Calculate Monthly Recurring Revenue | TopSAAS',
      description:
        'Free SaaS MRR calculator. Enter your average revenue per customer and active customer count to instantly calculate MRR and ARR, with a full MRR FAQ.',
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
              'Calculate monthly recurring revenue from your average revenue per customer and active customer count.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
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
    <div className="mx-auto w-full max-w-7xl px-3.5 sm:px-6 pt-6 pb-16 space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint-500/15 text-mint-600">
            <Calculator className="h-4 w-4" />
          </span>
          <h1 className="text-lg font-black text-neutral-950 sm:text-xl">SaaS MRR Counter</h1>
        </div>
        <p className="max-w-3xl text-sm font-medium text-neutral-500">
          Enter your average monthly revenue per customer and how many paying customers you have.
          Your MRR and ARR update instantly.
        </p>
      </div>

      {/* Calculator */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="mrr-inputs-heading"
          className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-6"
        >
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

          <p className="mt-4 text-[11px] font-medium text-neutral-500">
            Only recurring subscription revenue counts. For annual plans, use the yearly price ÷
            12, and exclude one-time fees, trials, and free users.
          </p>
        </section>

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
              {customerCount === 1 ? '' : 's'} × {formatMoney(averageRevenue)}/mo
            </div>
          </div>
        </aside>
      </div>

      {/* FAQ */}
      <section
        aria-labelledby="mrr-faq-heading"
        className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-6"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-mint-500/15 text-mint-600">
            <HelpCircle className="h-4 w-4" />
          </span>
          <h2 id="mrr-faq-heading" className="text-sm font-black text-neutral-950">
            MRR FAQ
          </h2>
        </div>

        <div className="mt-3 divide-y divide-neutral-200">
          {MRR_FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className="py-3">
                <button
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setOpenFaq(isOpen ? null : index);
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`mrr-faq-panel-${index}`}
                  className="flex w-full items-center justify-between gap-3 text-left text-xs font-bold text-neutral-900 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p
                    id={`mrr-faq-panel-${index}`}
                    className="mt-2 max-w-3xl text-[11.5px] font-medium leading-relaxed text-neutral-500"
                  >
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <div className="flex flex-col gap-3 rounded-2xl border border-mint-500/30 bg-mint-500/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
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
