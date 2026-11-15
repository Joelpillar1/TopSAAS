import {
  DIRECTORIES,
  DIRECTORY_LINK_LABELS,
  DIRECTORY_PRICE_LABELS,
  type DirectoryEntry,
  type DirectoryHub,
} from '../data/directories';

export const DIRECTORY_SITE_URL = 'https://www.topsaas.space';

export interface DirectorySeo {
  title: string;
  description: string;
  canonical: string;
}

export interface DirectoryFaq {
  q: string;
  a: string;
}

/** Shared FAQ copy for the ranked directory list. */
export const DIRECTORY_FAQS: DirectoryFaq[] = [
  {
    q: 'What is a product directory?',
    a: 'A product directory is a website that lists software by category, use case, or launch date. A listing gives your SaaS a permanent profile, a backlink, and a place for buyers to discover it.',
  },
  {
    q: 'Are these directories free?',
    a: 'Many are. The table shows free, freemium, and paid listings separately. Freemium means a basic listing is free and faster review or featured placement costs money. Paid means the directory charges for a listing.',
  },
  {
    q: 'What is Domain Rating?',
    a: "Domain Rating is Ahrefs' 0 to 100 score for the strength of a website's backlink profile. A link from a higher DR site usually carries more SEO value, especially when the link is dofollow.",
  },
  {
    q: 'What is the difference between dofollow and nofollow?',
    a: 'A dofollow link passes ranking value to your site. A nofollow link can still send visitors and referrals, but search engines do not count it toward your rankings. Conditional means the link type depends on the plan or placement.',
  },
  {
    q: 'How many directories should I submit to?',
    a: 'Start with the free, high DR directories that fit your product, then add niche directories where your buyers already look. Ten to twenty well-matched listings usually beat a hundred irrelevant ones.',
  },
  {
    q: 'How often is this list updated?',
    a: "The list is reviewed regularly. Domain Ratings, prices, and link types can change, so check the directory's own submission page before you pay for a placement. The last review date is shown on every page.",
  },
  {
    q: 'How do I submit my SaaS to TopSAAS?',
    a: 'Use the submit page to add your product to the TopSAAS directory. Submission is free, takes about 30 seconds with AI prefill, and gives you a crawlable product page plus a shot at the weekly leaderboard.',
  },
];

/** Per-directory FAQ copy, shared by the page body and its FAQPage schema. */
export const directoryFaqs = (directory: DirectoryEntry): DirectoryFaq[] => {
  const priceAnswer =
    directory.price === 'free'
      ? `Yes. ${directory.name} does not charge for a listing.`
      : directory.price === 'freemium'
        ? `${directory.name} has a free basic listing. Faster review, featured placement, or extra promotion may cost money.`
        : `${directory.name} charges for a listing. Check the current price on its submission page before you start.`;
  const linkAnswer =
    directory.link === 'dofollow'
      ? `Yes. ${directory.name} gives a dofollow link, so the listing can pass SEO value to your site.`
      : directory.link === 'nofollow'
        ? `No. ${directory.name} gives a nofollow link. It can still send visitors and referrals, but search engines do not count it toward your rankings.`
        : directory.link === 'conditional'
          ? `It depends. ${directory.name} uses conditional links, so the link type can change with the plan or placement you choose.`
          : `It varies. ${directory.name} does not publish a consistent link type, so check the live listing after approval.`;
  return [
    { q: `Is ${directory.name} free?`, a: priceAnswer },
    { q: `Does ${directory.name} give a dofollow link?`, a: linkAnswer },
    {
      q: `What is ${directory.name}'s Domain Rating?`,
      a: `${directory.name} has an Ahrefs Domain Rating of ${directory.dr}. DR changes over time, so re-check it before you pay for a placement.`,
    },
    {
      q: `How do I submit to ${directory.name}?`,
      a: `${directory.steps[0]} ${directory.steps[1]} ${directory.steps[2]}`,
    },
    {
      q: `How long does ${directory.name} take to approve a listing?`,
      a: `${directory.approvalTime}. Review times vary with queue size and how complete your submission is.`,
    },
  ];
};

/** Head metadata for the ranked list and its hub variants. */
export const directoryListSeo = (hub: DirectoryHub | null): DirectorySeo => {
  const title = hub ? hub.title : `${DIRECTORIES.length} Product Directories Ranked by DR (2026)`;
  const description = hub
    ? hub.description
    : `A ranked list of ${DIRECTORIES.length} SaaS directories and launch platforms, with Domain Rating, price, link type, and step-by-step submission pages.`;
  return {
    title: `${title} | TopSAAS`,
    description: description.slice(0, 157),
    canonical: hub
      ? `${DIRECTORY_SITE_URL}/product-directory/${hub.slug}`
      : `${DIRECTORY_SITE_URL}/product-directory`,
  };
};

/** Head metadata for one directory submission guide. */
export const directoryDetailSeo = (directory: DirectoryEntry): DirectorySeo => ({
  title: `How to Submit to ${directory.name} (2026) | TopSAAS`,
  description: `${directory.name}: Ahrefs DR ${directory.dr}, ${DIRECTORY_PRICE_LABELS[directory.price].toLowerCase()} listing, ${DIRECTORY_LINK_LABELS[directory.link].toLowerCase()} link. Step-by-step submission guide and requirements.`.slice(0, 157),
  canonical: `${DIRECTORY_SITE_URL}/product-directory/${directory.slug}`,
});

export const directoryListJsonLd = (
  hub: DirectoryHub | null,
  directories: DirectoryEntry[],
  faqs: DirectoryFaq[] = DIRECTORY_FAQS
): Record<string, unknown> => {
  const seo = directoryListSeo(hub);
  const heading = hub ? hub.title : `${DIRECTORIES.length} Product Directories Ranked by DR (2026)`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${seo.canonical}#webpage`,
        url: seo.canonical,
        name: heading,
        description: seo.description,
        inLanguage: 'en',
        dateModified: '2026-11-12',
        isPartOf: {
          '@type': 'WebSite',
          name: 'TopSAAS',
          url: `${DIRECTORY_SITE_URL}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: 'TopSAAS',
          url: `${DIRECTORY_SITE_URL}/`,
        },
      },
      {
        '@type': 'ItemList',
        name: heading,
        numberOfItems: directories.length,
        itemListElement: directories.map((directory, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: directory.name,
          url: `${DIRECTORY_SITE_URL}/product-directory/${directory.slug}`,
          description: directory.description,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${DIRECTORY_SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Product Directory', item: `${DIRECTORY_SITE_URL}/product-directory` },
          ...(hub
            ? [
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: hub.label,
                  item: `${DIRECTORY_SITE_URL}/product-directory/${hub.slug}`,
                },
              ]
            : []),
        ],
      },
    ],
  };
};

export const directoryDetailJsonLd = (
  directory: DirectoryEntry,
  faqs: DirectoryFaq[]
): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HowTo',
      name: `How to submit to ${directory.name}`,
      description: directory.description,
      totalTime: 'PT15M',
      step: directory.steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: `Step ${index + 1}`,
        text: step,
      })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${DIRECTORY_SITE_URL}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Product Directory',
          item: `${DIRECTORY_SITE_URL}/product-directory`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: directory.name,
          item: `${DIRECTORY_SITE_URL}/product-directory/${directory.slug}`,
        },
      ],
    },
  ],
});
