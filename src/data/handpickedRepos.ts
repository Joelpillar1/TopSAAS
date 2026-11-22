export interface SaaSProductIdea {
  id: string;
  title: string;
  customer: string;
  howToCharge: string; // Labeled "example to test, not a guarantee"
  youWouldNeedToAdd: string | string[];
}

export interface DetailedAlternative {
  name: string;
  domain: string;
  pricing: string;
  description: string;
  whyReplace: string;
}

export interface RepoFeature {
  title: string;
  description: string;
}

export interface HandpickedRepoDossier {
  repoFullName: string;
  repoName: string;
  logoUrl?: string;
  tagline?: string;
  replaces: {
    name: string;
    allReplaces?: string[];
    domain?: string;
    pricing?: string;
  };
  commercialAlternatives: DetailedAlternative[];
  problemItSolves: string;
  solution: string;
  whoItsFor: string[];
  features: RepoFeature[];
  licenseSpdx: string;
  badge: 'green' | 'yellow';
  licenseMeaning: string;
  caveats: string[];
  buildable: boolean;
  reviewed: boolean;
  lastVerified: string;
  isOpenCore?: boolean;
  summary: string;
  licenseWarning?: string;
  ideas: SaaSProductIdea[];
  goodFitIf: string[];
  skipIf: string[];
  quickStart: {
    clone: string;
    install?: string;
    run?: string;
    notes?: string;
  };
  tradeoffs: string[];
  builtFromThis?: Array<{
    name: string;
    url: string;
    description: string;
  }>;
}

/**
 * Handpicked & editorialized repos with deep SaaS opportunity blueprints.
 * Checked against repo pages, vendor docs, and GitHub API on 2026-11-19.
 */
export const HANDPICKED_REPOS: HandpickedRepoDossier[] = [
  {
    repoFullName: 'firecrawl/firecrawl',
    repoName: 'Firecrawl',
    logoUrl: '/images/firecrawl-logo.png',
    tagline: 'Turn any website into clean LLM-ready markdown or structured data with one API',
    replaces: {
      name: 'Bright Data & Apify',
      allReplaces: ['Bright Data', 'Apify', 'ScrapingBee', 'Diffbot', 'Zyte'],
      domain: 'brightdata.com',
      pricing: 'Bright Data starts at $500/mo commit; Apify starts at $49–$499/mo; Diffbot charges $299+/mo',
    },
    problemItSolves:
      'Traditional web scraping for AI agents and LLMs is notoriously brittle and messy. Raw HTML pages are clogged with thousands of lines of navigation menus, cookie consent popups, analytics scripts, and ads that waste model tokens, increase latency, and cause AI hallucinations.\n\nFurthermore, modern websites rely heavily on JavaScript rendering, Cloudflare/DataDome bot protection, and dynamic pagination. Writing custom Puppeteer or Playwright scrapers breaks constantly whenever target websites alter CSS classes, while enterprise data platforms like Bright Data or Diffbot demand expensive commitments ($300–$500+/mo) that price out early-stage founders.',
    solution:
      'Firecrawl provides an open-source, API-first web scraping and crawling engine built specifically for AI agents and LLM applications. With single endpoint calls (/scrape, /crawl, /map, /extract), it converts any URL or entire site into clean, token-efficient Markdown or strictly-typed JSON using schema-guided LLM extraction.\n\nIt transparently manages headless browser execution, rotating residential proxies, CAPTCHA bypasses, and embedded PDF extraction. You can self-host the core engine freely via Docker or connect to Firecrawl Cloud & Alexandria for zero-infrastructure scaling.',
    whoItsFor: [
      'AI founders & indie developers building RAG pipelines, chatbots, and autonomous agents',
      'SaaS builders needing continuous competitor intelligence, price monitoring, or content sync',
      'No-code automators looking to turn websites without public APIs into self-healing JSON endpoints',
      'Market researchers and analysts tracking industry regulatory announcements and public RFPs',
    ],
    features: [
      {
        title: 'Clean LLM-Ready Markdown Conversion',
        description: 'Strips navigation bars, ads, cookie popups, and scripts automatically, returning clean markdown that drastically lowers OpenAI/Claude token costs.',
      },
      {
        title: 'Autonomous Whole-Site Crawling (/crawl)',
        description: 'Recursively explores full domains, follows internal links, respects sitemaps, and handles pagination without requiring custom traversal logic.',
      },
      {
        title: 'Schema-Guided Structured Extraction (/extract)',
        description: 'Pass a Zod or JSON schema and let LLMs extract precise, typed data points directly from web pages with zero manual CSS selectors.',
      },
      {
        title: 'Built-in Anti-Bot & Residential Proxy Rotation',
        description: 'Bypasses Cloudflare, DataDome, and CAPTCHA challenge screens using automated headless browser sessions and proxy pools.',
      },
      {
        title: 'Sub-Second Sitemap Mapping (/map)',
        description: 'Quickly indexes all accessible URLs on a website within seconds to feed discovery agents and search indexes.',
      },
      {
        title: 'Model Context Protocol (MCP) Server',
        description: 'Native MCP integration allows AI agents and IDEs (Cursor, Claude Desktop, Antigravity) to crawl and scrape live websites as a native tool.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Bright Data',
        domain: 'brightdata.com',
        pricing: '$500+/mo minimum commitment for enterprise scraping and proxy networks',
        description: 'The legacy giant of proxy infrastructure and enterprise web scraping.',
        whyReplace: 'Prohibitively expensive minimums, steep learning curve, and returns messy HTML rather than AI-ready Markdown.',
      },
      {
        name: 'Apify',
        domain: 'apify.com',
        pricing: '$49 to $499+/mo based on compute usage credits',
        description: 'Cloud platform for web scraping and automation with a large store of pre-built scrapers (Actors).',
        whyReplace: 'Can get costly with complex crawling runs, and scrapers require maintenance when target sites change layouts.',
      },
      {
        name: 'ScrapingBee',
        domain: 'scrapingbee.com',
        pricing: '$49 to $249+/mo based on credit bundles',
        description: 'Proxy and headless browser API that handles JS rendering and proxies.',
        whyReplace: 'Focuses primarily on delivering raw HTML/screenshots rather than LLM-native markdown or autonomous schema extraction.',
      },
      {
        name: 'Diffbot',
        domain: 'diffbot.com',
        pricing: '$299 to $899+/mo',
        description: 'Knowledge graph and AI extraction platform for web data.',
        whyReplace: 'High enterprise pricing tier that is inaccessible for bootstrap founders and indie developers.',
      },
    ],
    licenseSpdx: 'AGPL-3.0',
    badge: 'yellow',
    licenseMeaning: 'Open source under AGPL-3.0 copyleft. Safe to run as an independent backend microservice via HTTP API, or use Firecrawl Cloud API for proprietary apps.',
    caveats: [
      'Core repository is licensed under AGPL-3.0. If you modify Firecrawl itself and host it as a public network service, you must release your modifications under AGPL-3.0.',
      'For proprietary SaaS products, connect to Firecrawl via standard HTTP API as an isolated microservice, or use Firecrawl Cloud / Alexandria API to avoid copyleft licensing concerns.',
      'Heavy dynamic crawling at scale requires residential proxies and bandwidth, which carry underlying operational costs.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 20, 2026',
    isOpenCore: true,
    summary:
      'Firecrawl is the premier open-source web crawler and scraper built for AI agents and LLMs. It turns any website into clean Markdown or structured JSON with schema extraction, proxy rotation, and CAPTCHA handling.',
    licenseWarning:
      'AGPL-3.0 Copyleft: Treat Firecrawl as an independent backend microservice via HTTP API, or use the official Firecrawl Cloud API when building proprietary commercial SaaS to keep your application code fully proprietary.',
    ideas: [
      {
        id: 'firecrawl-1',
        title: 'AI Competitor Price & Feature Radar',
        customer: 'Indie hackers, e-commerce stores, and small B2B SaaS teams',
        howToCharge: '$19 to $39 per month (monitor 10 to 30 competitor sites)',
        youWouldNeedToAdd: [
          'Scheduled cron worker running Firecrawl /scrape on competitor pricing URLs',
          'AI diff comparison prompt that identifies price cuts, tier limit changes, and new features',
          'Automated email alerts via Resend with side-by-side change summaries and demo counter-arguments',
        ],
      },
      {
        id: 'firecrawl-2',
        title: 'Self-Healing Webhook & REST API Builder',
        customer: 'No-code automators, Zapier/Make builders, and freelance agencies',
        howToCharge: '$15 to $35 per month (5 to 15 live monitored webhooks/APIs)',
        youWouldNeedToAdd: [
          'Simple dashboard to input any URL and specify desired output fields (e.g. stock, price, title)',
          'Firecrawl /extract pipeline that generates a permanent JSON API endpoint',
          'Self-healing LLM prompt that automatically repairs the schema if the source site updates its CSS',
        ],
      },
      {
        id: 'firecrawl-3',
        title: 'Local Government RFP & Tender Radar',
        customer: 'Small IT agencies, cleaning contractors, and local service providers',
        howToCharge: '$29 to $59 per month per region or business category',
        youWouldNeedToAdd: [
          'Curated directory of municipal, county, and state procurement URLs',
          'Firecrawl recursive crawler that parses new notices and downloads tender specification PDFs',
          'AI relevance scoring engine that texts or emails daily matches tailored to the user’s service category',
        ],
      },
      {
        id: 'firecrawl-4',
        title: 'Instant AI Knowledge Base & RAG Ingestion Pipeline',
        customer: 'AI agent developers, customer support teams, and SaaS operators',
        howToCharge: '$25 to $49 per month per synced knowledge base',
        youWouldNeedToAdd: [
          'Automated scheduler that crawls public GitBook, Zendesk, or Mintlify help centers via /crawl',
          'Markdown chunker and vector embedding pipeline syncing with Supabase pgvector or Pinecone',
          'Webhook alert notifying the team whenever documentation has been updated or deprecated',
        ],
      },
      {
        id: 'firecrawl-5',
        title: 'Regulatory & Compliance Policy Monitor',
        customer: 'Boutique legal firms, healthcare clinics, and regional financial advisors',
        howToCharge: '$39 to $79 per month (affordable alternative to $500+/mo enterprise feeds)',
        youWouldNeedToAdd: [
          'Catalog of state agency bulletin boards, healthcare commissions, and legal gazettes',
          'Firecrawl /map and /scrape watcher to detect newly published compliance guidelines',
          'Plain-English AI summarizer highlighting compliance risk level and required client contract revisions',
        ],
      },
    ],
    goodFitIf: [
      'You are building AI agents, RAG search engines, or LLM applications that need reliable live web data.',
      'You want clean Markdown without wasting model tokens on ads, cookie banners, and scripts.',
      'You want a battle-tested scraping architecture that already handles anti-bot, headless browsers, and proxies.',
    ],
    skipIf: [
      'You plan to fork and sell Firecrawl as a closed-source managed crawler without complying with AGPL-3.0.',
      'Your application only needs static public APIs and has zero web data extraction needs.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/firecrawl/firecrawl.git',
      install: 'cd firecrawl && docker compose up -d',
      run: 'curl -X POST http://localhost:3002/v1/scrape -H "Content-Type: application/json" -d \'{"url": "https://example.com"}\'',
      notes: 'Self-hosting requires Docker and Docker Compose. For managed scaling, get an API key from firecrawl.dev.',
    },
    tradeoffs: [
      'AGPL-3.0 requires caution: run as a separate API microservice or use Firecrawl Cloud to protect proprietary code.',
      'High-frequency crawling of heavy JavaScript sites consumes noticeable memory and proxy bandwidth.',
      'Commercial anti-bot protections continuously evolve, so keeping local Docker scrapers tuned requires periodic updates.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'superdesigndev/treg',
    repoName: 'Treg',
    tagline: 'OpenRouter for agent tools: one unified token for thousands of external APIs',
    replaces: {
      name: 'Composio & Toolhouse',
      allReplaces: ['Composio', 'Toolhouse', 'Arcade AI', 'Langfuse Tooling', 'Zapier Central'],
      domain: 'composio.dev',
      pricing: 'Composio starts at $29 to $199+/mo; Toolhouse charges per-execution platform fees',
    },
    problemItSolves:
      'Building autonomous AI agents that interact with real-world software is currently a logistical nightmare. Every developer must register separate developer accounts, negotiate OAuth flows, securely store customer API tokens, and maintain custom integration code for dozens of services (GitHub, Slack, Google Calendar, Notion, Stripe, Linear).\n\nWhen external APIs change schema or rate-limit requests, agents silently crash. Hosted agent tool platforms charge aggressive per-tool and per-execution markups, while handling sensitive customer API credentials in closed third-party clouds poses serious enterprise security concerns.',
    solution:
      'Treg operates as an "OpenRouter for tools"—providing a single unified endpoint and authentication token to give AI agents instant access to thousands of pre-configured external tools and actions. It handles server-side credential injection, schema conversion for OpenAI/Anthropic function calling, and automated per-call metering.\n\nBecause it can be fully self-hosted, sensitive enterprise credentials never leave your infrastructure, while agent developers get instant plug-and-play access to actions across the entire modern SaaS ecosystem.',
    whoItsFor: [
      'AI agent developers & autonomous bot creators wanting instant tool calling without custom integrations',
      'B2B SaaS teams embedding AI assistants that need to take actions inside customer software (Slack, Jira, CRM)',
      'AI agency builders deploying automated workflows for clients across multiple third-party accounts',
      'Developers building with Model Context Protocol (MCP) seeking a centralized tool registry',
    ],
    features: [
      {
        title: 'Unified Multi-Tool API Token',
        description: 'Call thousands of external actions and APIs through a single standardized endpoint with automatic credential injection.',
      },
      {
        title: 'Instant Function Calling Schemas',
        description: 'Automatically converts tool definitions into native JSON schemas for OpenAI Function Calling, Anthropic Tool Use, and LangChain.',
      },
      {
        title: 'Server-Side Credential Vault',
        description: 'Safely injects OAuth tokens and API secrets at execution time without exposing raw API keys to models or client devices.',
      },
      {
        title: 'Per-Call Metering & Cost Tracking',
        description: 'Tracks execution latency, status codes, and per-tool usage down to the penny to enable usage-based resale to end users.',
      },
      {
        title: 'Self-Hostable Architecture',
        description: 'Run entirely on your own cloud or Docker infrastructure to meet enterprise compliance, HIPAA, and SOC-2 data residency rules.',
      },
      {
        title: 'Model Context Protocol (MCP) Compatible',
        description: 'Expose any connected tool directly as an MCP server for instant use inside Cursor, Windsurf, Claude Desktop, and Antigravity.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Composio',
        domain: 'composio.dev',
        pricing: '$29 to $199+/mo based on active tool integrations and execution limits',
        description: 'Popular hosted platform providing pre-built integrations for LLM agents.',
        whyReplace: 'Proprietary hosted platform that stores sensitive customer credentials in a third-party cloud.',
      },
      {
        name: 'Toolhouse',
        domain: 'toolhouse.ai',
        pricing: 'Freemium with per-execution charges after monthly allowances',
        description: 'Cloud-based function execution infrastructure for LLMs.',
        whyReplace: 'Per-call transaction costs scale quickly as agent fleets handle high-volume automated workflows.',
      },
      {
        name: 'Arcade AI',
        domain: 'arcade-ai.com',
        pricing: '$50+/mo with enterprise custom quotes',
        description: 'Security and auth gateway connecting AI agents to user accounts.',
        whyReplace: 'Early-stage proprietary SaaS with high enterprise tiers and closed infrastructure.',
      },
    ],
    licenseSpdx: 'Apache-2.0',
    badge: 'yellow',
    licenseMeaning: 'Source-available / commercial restrictions. Inspect repository license terms for commercial hosted resale.',
    caveats: [
      'Check specific license additions in the repository: contains custom terms regarding multi-tenant commercial resale.',
      'Managing hundreds of OAuth tokens requires reliable Redis and encrypted PostgreSQL database backends.',
      'Third-party APIs (Twitter, LinkedIn, Slack) have independent rate limits and terms of service that must be respected.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 20, 2026',
    isOpenCore: true,
    summary:
      'Treg is the OpenRouter for agent tools. It provides a unified gateway, server-side credential injection, and per-call billing to connect AI agents with thousands of external APIs.',
    licenseWarning:
      'Source-available terms: Verify commercial resale boundaries before launching a public hosted multi-tenant API gateway on top.',
    ideas: [
      {
        id: 'treg-1',
        title: 'Managed Agent Tool Gateway',
        customer: 'AI indie developers, Cursor/Claude agent builders, and startup dev teams',
        howToCharge: '$19 to $39 per month (includes 50,000 tool calls + $0.0005/call thereafter)',
        youWouldNeedToAdd: [
          'Hosted multi-tenant Treg instance with Stripe subscription billing',
          'Web dashboard to toggle integrations (Slack, Linear, GitHub, Google Drive, Notion)',
          'Usage analytics, latency graphs, and rate-limiting per API key',
        ],
      },
      {
        id: 'treg-2',
        title: 'No-Code Agent Action Marketplace',
        customer: 'Non-technical founders, Zapier/Make automators, and small agencies',
        howToCharge: '$25 to $49 per month per connected agent',
        youWouldNeedToAdd: [
          'Visual connector catalog with one-click OAuth authentication wizards',
          'Pre-built tool definitions compatible with OpenAI Function Calling and Anthropic Tool Use',
          'Webhook response listener for async agent actions and background tasks',
        ],
      },
      {
        id: 'treg-3',
        title: 'Enterprise Tool Access & Credential Vault',
        customer: 'AI consultancies and software agencies managing client AI workflows',
        howToCharge: '$39 to $79 per month per agency workspace',
        youWouldNeedToAdd: [
          'Multi-tenant client workspaces with role-based access control (RBAC)',
          'Tamper-proof audit logs recording every API tool call, payload, and agent identity',
          'Client-specific credential isolation so developers never see raw API secrets',
        ],
      },
      {
        id: 'treg-4',
        title: 'Managed MCP (Model Context Protocol) Cloud',
        customer: 'Developers using Cursor, Windsurf, Claude Desktop, and Antigravity',
        howToCharge: '$15 to $29 per month',
        youWouldNeedToAdd: [
          'Cloud-hosted MCP server bridge converting Treg tool endpoints into SSE/stdio streams',
          'One-click copy/paste configuration snippet for Cursor / Claude Desktop / Antigravity',
          'Real-time connection health monitor and latency alerts',
        ],
      },
      {
        id: 'treg-5',
        title: 'Usage-Based API Monetization Gateway for Tools',
        customer: 'Developer tool authors and micro-SaaS builders wanting to sell tools to AI agents',
        howToCharge: '$29 to $59 per month + 5% platform fee on agent payments',
        youWouldNeedToAdd: [
          'Developer portal for tool creators to list endpoints and set per-call pricing',
          'Micro-billing engine that debits agent wallets and pays out creators via Stripe Connect',
          'Automated OpenAPI schema validation and uptime monitoring',
        ],
      },
    ],
    goodFitIf: [
      'You are building AI agents, autonomous bots, or copilots that need to interact with external SaaS platforms.',
      'You want to avoid building and maintaining 50 separate OAuth integrations and API wrappers.',
      'You want an open-source tool gateway that can be self-hosted to keep customer credentials private.',
    ],
    skipIf: [
      'Your AI application only does text generation and has no need to read or write external API data.',
      'You are unable to manage encrypted database storage for secure credential vaults.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/superdesigndev/treg.git',
      install: 'cd treg && pip install -r requirements.txt',
      run: 'python main.py',
      notes: 'Requires Python 3.10+ and Redis for token caching and rate limiting.',
    },
    tradeoffs: [
      'Managing third-party OAuth flows requires keeping up with provider API changes and token expirations.',
      'Self-hosting requires robust encryption-at-rest for stored API credentials and customer secrets.',
      'Source-available license requires careful review before launching commercial hosted multi-tenant variants.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'umami-software/umami',
    repoName: 'Umami',
    tagline: 'Fast, privacy-focused open source alternative to Google Analytics',
    replaces: {
      name: 'Google Analytics & Plausible',
      allReplaces: ['Google Analytics', 'Plausible Analytics', 'Fathom Analytics', 'Simple Analytics'],
      domain: 'analytics.google.com',
      pricing: 'Google Analytics 360 is $50,000+/yr; Plausible/Fathom start at $9–$15/mo',
    },
    problemItSolves:
      'Google Analytics 4 (GA4) has become notoriously bloated, confusing to navigate, and legally fraught in Europe. It requires complex consent management platforms (CMPs) and intrusive cookie banners that harm website conversion rates, inflate bounce rates, and risk GDPR/PECR fines.\n\nMeanwhile, hosted commercial privacy alternatives charge steep monthly subscription fees that scale sharply with pageviews, penalizing founders as their web traffic expands.',
    solution:
      'Umami delivers a modern, lightweight analytics engine that operates completely without tracking cookies or storing personal identifying information. The tracking script is under 3KB, respects visitor privacy by design, and requires zero cookie consent banners.\n\nBecause you retain 100% data ownership on standard PostgreSQL or MySQL, your hosting overhead remains flat while preserving full compliance and instant real-time insights.',
    whoItsFor: [
      'Solo founders & indie hackers wanting clean traffic stats without slow scripts',
      'Web agencies & freelance designers seeking to white-label monthly reports for clients',
      'E-commerce merchants who want to track purchase conversions without GDPR cookie consent drops',
      'Privacy-conscious European SaaS products requiring full compliance with EU data residency',
    ],
    features: [
      {
        title: '100% Cookie-Free & Privacy Compliant',
        description: 'Does not store cookies, collect personal data, or track users across devices. Fully compliant with GDPR, CCPA, and PECR without requiring consent banners.',
      },
      {
        title: 'Ultra-Lightweight Script (<3KB)',
        description: 'The tracking script is tiny and loads asynchronously, preserving perfect Google Core Web Vitals and 100 PageSpeed performance scores.',
      },
      {
        title: 'Multi-Tenant & Shareable Dashboards',
        description: 'Host unlimited websites under one instance. Generate public or password-protected view-only links to share live analytics with clients or stakeholders.',
      },
      {
        title: 'Custom Event & Funnel Tracking',
        description: 'Track button clicks, newsletter signups, checkout completions, and custom revenue event properties with simple one-line JavaScript triggers.',
      },
      {
        title: 'Real-Time Visitor Activity',
        description: 'Inspect live pageviews, active visitors, referrers, geographic locations, browsers, and devices in a clean, unified single-page dashboard.',
      },
      {
        title: 'Developer API & Webhooks',
        description: 'Full REST API allows you to programmatically provision websites, extract metrics, and trigger automated weekly reporting summaries.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Google Analytics (GA4)',
        domain: 'analytics.google.com',
        pricing: 'Free tier with data sampling; $50,000+/yr for Enterprise 360',
        description: 'The dominant enterprise analytics tool, heavily oriented toward programmatic ad attribution and corporate reporting.',
        whyReplace: 'Demands intrusive cookie consent banners, incurs steep compliance overhead, and tracks user data across Google ecosystems.',
      },
      {
        name: 'Plausible Analytics',
        domain: 'plausible.io',
        pricing: '$9 to $199+/mo based on monthly pageview volume',
        description: 'Popular hosted European privacy analytics SaaS with simple dashboards and cookie-free tracking.',
        whyReplace: 'Costs scale quickly as your traffic expands; you cannot white-label it or brand it for client resale on the hosted plan.',
      },
      {
        name: 'Fathom Analytics',
        domain: 'usefathom.com',
        pricing: '$15 to $270+/mo based on monthly traffic tiers',
        description: 'Canadian privacy-first analytics provider pioneered by independent creators with reliable uptime.',
        whyReplace: 'Hosted SaaS costs add up across multi-site portfolios, with no direct control over raw underlying data storage.',
      },
      {
        name: 'Simple Analytics',
        domain: 'simpleanalytics.com',
        pricing: '$9 to $99+/mo based on pageviews',
        description: 'Dutch analytics service emphasizing strict privacy, clean charts, and zero tracking cookies.',
        whyReplace: 'Proprietary cloud subscription fees with monthly event caps that penalize high-traffic applications.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'Do almost anything, including selling it closed-source or white-labeling it. Keep the copyright notice.',
    caveats: [
      'Umami Cloud starts at $20 per month for 1M events, so compete on a niche, not on price.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'Umami is a fast, privacy-focused alternative to Google Analytics. With a cookie-free script and lightweight dashboard, it is ideal for white-labeled client reporting, e-commerce traffic summaries, and bundled agency analytics.',
    licenseWarning:
      'Permissive MIT license: fully safe for commercial SaaS, private modifications, and closed-source re-selling. Keep the copyright notice.',
    ideas: [
      {
        id: 'umami-1',
        title: 'Weekly traffic reports for online shops',
        customer: 'Small e-commerce store owners',
        howToCharge: '$15 to $29 per month per store',
        youWouldNeedToAdd: [
          'Shopify and WooCommerce setup automation',
          'Plain-language automated email or WhatsApp weekly summary',
          'Conversion and checkout drop-off highlights',
        ],
      },
      {
        id: 'umami-2',
        title: 'White-label analytics for agencies',
        customer: 'Web agencies and freelance designers',
        howToCharge: '$5 to $10 per client site per month',
        youWouldNeedToAdd: [
          'Agency custom branding and custom domain routing',
          'Restricted client login portals',
          'Automated monthly branded PDF report generator',
        ],
      },
      {
        id: 'umami-3',
        title: 'Cookie-banner-free analytics hosting',
        customer: 'Bloggers and small SaaS teams with EU and UK visitors',
        howToCharge: '$9 to $19 per month',
        youWouldNeedToAdd: [
          'One-click managed onboarding and script verification',
          'Stripe recurring billing subscription flow',
          'Setup wizard with privacy policy compliance snippet',
        ],
      },
      {
        id: 'umami-4',
        title: 'Built-in analytics for site builders',
        customer: 'No-code builders and template sellers',
        howToCharge: 'Bundle at $3 to $5 per site',
        youWouldNeedToAdd: [
          'Auto-created tracking IDs per provisioned site via API',
          'Embedded dashboard iframe with team permissions',
          'Usage tracking and automatic quota alerts',
        ],
      },
      {
        id: 'umami-5',
        title: 'Campaign link tracking for freelance marketers',
        customer: 'Freelance marketers and small agencies',
        howToCharge: '$19 to $39 per month',
        youWouldNeedToAdd: [
          'Visual UTM link builder and QR code generator',
          'Per-campaign client export reports',
          'Social media ad spend ROI calculator',
        ],
      },
    ],
    goodFitIf: [
      'You want to offer cookie-banner-free analytics to European or privacy-conscious visitors.',
      'You run a web agency or freelance service and want to bundle recurring client reporting.',
      'You want a clean Next.js + PostgreSQL/MySQL stack that is lightweight and inexpensive to host.',
    ],
    skipIf: [
      'You plan to compete head-on with Umami Cloud solely on hosting price ($20/mo).',
      'You need complex product event pipelines, heatmaps, or user session recordings.',
      'You cannot manage basic database backups and VPS infrastructure.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/umami-software/umami.git',
      install: 'yarn install',
      run: 'yarn build && yarn start',
      notes: 'Requires Node.js 18+ and PostgreSQL or MySQL. Set DATABASE_URL in your .env.',
    },
    tradeoffs: [
      'High-traffic sites (>10M monthly events) require database indexing and partition management.',
      'Does not include raw behavioral heatmaps or session replay out of the box.',
      'Umami Cloud is actively improving; you must win on niche customization and client workflow, not raw hosting.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'medusajs/medusa',
    repoName: 'Medusa',
    tagline: 'The world\'s most flexible headless commerce engine for developers',
    replaces: {
      name: 'Shopify & BigCommerce',
      allReplaces: ['Shopify', 'Commerce Layer', 'BigCommerce', 'Adobe Commerce'],
      domain: 'shopify.com',
      pricing: 'Shopify starts at $39/mo + 2% per-transaction fee; Plus starts at $2,000/mo',
    },
    problemItSolves:
      'Monolithic e-commerce platforms like Shopify impose rigid checkout flows, charge aggressive transaction fee penalties when using third-party payment gateways, and force merchants into expensive proprietary app ecosystems ($50–$300/mo in app subscriptions alone).\n\nCustom B2B logic, complex regional tax schemes, or multi-currency catalogs quickly push growing merchants into enterprise tiers like Shopify Plus ($2,000+/mo).',
    solution:
      'Medusa provides a modular, headless commerce engine built on modern Node.js and TypeScript, giving you full architectural freedom to build customized storefronts and automated order workflows.\n\nIt features native multi-currency pricing, extensible tax rules, B2B wholesale pricing tiers, and direct integration with any payment processor without vendor revenue-share cuts.',
    whoItsFor: [
      'Developers building bespoke direct-to-consumer (D2C) brands with custom checkout experiences',
      'B2B wholesale merchants needing tiered pricing, credit lines, and customer-specific catalogs',
      'Multi-vendor marketplace founders requiring split payments and custom vendor dashboards',
      'International retailers requiring granular tax, currency, and multi-warehouse shipping rules',
    ],
    features: [
      {
        title: 'Modular Headless Architecture',
        description: 'Decoupled backend engine connects seamlessly to Next.js storefronts, POS terminals, mobile apps, and custom web applications.',
      },
      {
        title: 'Multi-Currency & Regional Pricing',
        description: 'Configure localized currencies, automated tax calculation, and region-specific shipping methods across worldwide markets.',
      },
      {
        title: 'Automated Workflow Orchestrator',
        description: 'Chain inventory updates, payment captures, fraud checks, and 3PL fulfillment routines with built-in rollback protection.',
      },
      {
        title: 'Rich Merchant Admin Dashboard',
        description: 'Comprehensive React-based admin interface to manage orders, inventory, products, gift cards, discounts, and customer groups.',
      },
      {
        title: 'Extensible Plugin System',
        description: 'Plug-and-play integrations for Stripe, PayPal, Algolia, Meilisearch, SendGrid, Twilio, and automated ERP sync.',
      },
      {
        title: 'B2B Wholesale Primitives',
        description: 'Built-in support for company accounts, tiered quantity pricing, order approval rules, and invoice payment terms.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Shopify',
        domain: 'shopify.com',
        pricing: '$39 to $399/mo + 0.5%–2% transaction fee; Shopify Plus starts at $2,000/mo',
        description: 'The global market leader in turnkey hosted e-commerce for retail brands.',
        whyReplace: 'Penalizes third-party payment gateways with fees, locks backend logic into closed liquid templates, and requires expensive app stacks.',
      },
      {
        name: 'Commerce Layer',
        domain: 'commercelayer.io',
        pricing: 'Starts at $649/mo; enterprise tiers scale into thousands',
        description: 'Enterprise API-first headless commerce engine designed for global fashion and luxury brands.',
        whyReplace: 'Extremely high entry pricing that puts it out of reach for solo founders and early-stage bootstrapped businesses.',
      },
      {
        name: 'BigCommerce',
        domain: 'bigcommerce.com',
        pricing: '$39 to $399/mo with mandatory plan upgrades at GMV thresholds',
        description: 'Hosted SaaS commerce platform known for native B2B functionality and multi-storefront options.',
        whyReplace: 'Forces automatic tier upgrades whenever your annual sales volume exceeds strict arbitrary revenue caps ($400k+).',
      },
      {
        name: 'Adobe Commerce (Magento)',
        domain: 'business.adobe.com',
        pricing: 'Starts at $22,000+/yr plus heavy enterprise hosting overhead',
        description: 'Legacy enterprise commerce heavyweight with extensive customizable features and complex architecture.',
        whyReplace: 'High maintenance costs, notorious PHP performance bottlenecks, and slow release cycles requiring specialized agencies.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'The core is free for commercial use, closed-source included. Keep the copyright notice.',
    caveats: [
      'RBAC enterprise materials listed in ENTERPRISE-LICENSE.md need a commercial agreement with Medusa.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: true,
    summary:
      'Medusa is a modular, headless commerce engine built with Node.js and TypeScript. It replaces monolithic platforms like Shopify by giving developers full ownership over the backend, admin dashboard, and checkout workflows.',
    licenseWarning:
      'Core engine is MIT. Note that enterprise multi-tenant RBAC listed in ENTERPRISE-LICENSE.md requires a commercial agreement with Medusa.',
    ideas: [
      {
        id: 'medusa-1',
        title: 'Done-for-you online stores for local food businesses',
        customer: 'Bakeries, restaurants, and caterers',
        howToCharge: '$99 setup + $29 to $49 per month',
        youWouldNeedToAdd: [
          'Local delivery time-slot selector and radius check',
          'Order printing integration (Star Micronics or receipt API)',
          'Pre-configured menu and catering catalog template',
        ],
      },
      {
        id: 'medusa-2',
        title: 'Wholesale B2B ordering portal for makers',
        customer: 'Small brands selling to independent retailers',
        howToCharge: '$49 to $99 per month',
        youWouldNeedToAdd: [
          'Retailer account application and approval workflow',
          'Tiered volume pricing table on product pages',
          'Invoice generation and Net-30 payment terms via Stripe',
        ],
      },
      {
        id: 'medusa-3',
        title: 'Multi-vendor craft marketplace for a city',
        customer: 'Local artisan markets and downtown associations',
        howToCharge: '$19 to $29 per vendor per month + 2% cut',
        youWouldNeedToAdd: [
          'Vendor onboarding portal and product submission',
          'Stripe Connect split payouts per vendor',
          'Central customer cart with multi-vendor checkout',
        ],
      },
      {
        id: 'medusa-4',
        title: 'Subscription box commerce engine',
        customer: 'Coffee roasters, beauty brands, and pet food makers',
        howToCharge: '$39 to $79 per month',
        youWouldNeedToAdd: [
          'Recurring billing integration (Stripe Subscriptions)',
          'Customer portal for skipping or swapping items',
          'Shipment batching and fulfillment export',
        ],
      },
      {
        id: 'medusa-5',
        title: 'Creator merchandise storefronts',
        customer: 'YouTubers, podcasters, and newsletter writers',
        howToCharge: '$0 upfront + 5% of sales or $19 per month',
        youWouldNeedToAdd: [
          'Print-on-demand fulfillment API (Printful or Printify)',
          'Creator branded theme templates',
          'Direct checkout links for social media bios',
        ],
      },
    ],
    goodFitIf: [
      'You are a developer who wants total control of your checkout, database, and business logic.',
      'You need custom commerce flows (e.g., custom bundles, B2B wholesale pricing, delivery slots).',
      'You want to escape Shopify per-transaction fees and recurring app store bills.',
    ],
    skipIf: [
      'You are a non-technical solo founder wanting a drag-and-drop store in 15 minutes.',
      'You rely heavily on the Shopify theme store and 1-click app ecosystem.',
      'You do not want to manage hosting, server updates, and database backups.',
    ],
    quickStart: {
      clone: 'npx create-medusa-app@latest',
      install: 'npm install',
      run: 'npm run dev',
      notes: 'Select Medusa v2. Requires Node.js 20+ and PostgreSQL. Ships with a pre-configured Next.js starter storefront.',
    },
    tradeoffs: [
      'Requires full-stack engineering skills to build and maintain the frontend storefront.',
      'No point-and-click app marketplace; third-party integrations must be configured via code.',
      'Must monitor your own database, Redis queue, and worker instances for scaling.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'chatwoot/chatwoot',
    repoName: 'Chatwoot',
    tagline: 'Open-source customer engagement suite and live chat alternative to Intercom',
    replaces: {
      name: 'Intercom & Zendesk',
      allReplaces: ['Intercom', 'Zendesk', 'Crisp', 'Help Scout', 'LiveChat'],
      domain: 'intercom.com',
      pricing: 'Intercom starts at $39/seat/mo; Zendesk starts at $55/seat/mo',
    },
    problemItSolves:
      'Customer support suites like Intercom and Zendesk charge exorbitant per-seat monthly fees ($39–$115/agent/month) that severely penalize growing teams as customer volumes increase.\n\nFurthermore, customer conversations are typically fragmented across disparate channels—website live chat, email, WhatsApp, Telegram, and social media—leading to lost tickets, slow resolution times, and painful vendor lock-in.',
    solution:
      'Chatwoot consolidates all live chat, email support, WhatsApp, and social messaging channels into a single unified omnichannel inbox with shared team collaboration tools.\n\nIt offers native mobile apps, automated bots, CSAT surveys, and pre-built CRM integrations, letting you deliver real-time enterprise support at a fraction of legacy SaaS pricing.',
    whoItsFor: [
      'SaaS startups wanting live website chat without punishing per-seat monthly fees',
      'Customer support agencies managing multi-brand client communication pipelines',
      'Regional businesses in Latin America, Europe, and Asia that rely heavily on WhatsApp and Telegram',
      'Enterprises with strict data residency requirements that forbid storing customer chats in US cloud silos',
    ],
    features: [
      {
        title: 'Omnichannel Unified Inbox',
        description: 'Manage website live chat, support emails, WhatsApp, Telegram, Twitter/X DMs, Facebook, and SMS from a single cohesive interface.',
      },
      {
        title: 'Collaborative Multi-Agent Routing',
        description: 'Assign conversations to specialized teams, mention teammates in private internal notes, and automate round-robin ticket assignment.',
      },
      {
        title: 'Custom AI & Chatbot Integrations',
        description: 'Easily connect OpenAI, Dialogflow, or custom webhooks to triage incoming requests and resolve repetitive FAQ queries automatically.',
      },
      {
        title: 'Canned Responses & Macros',
        description: 'Equip agents with pre-written shortcuts for frequent questions to drastically reduce first-response times and ensure consistency.',
      },
      {
        title: 'Branded Live Chat Widget',
        description: 'Lightweight, responsive web widget customizable with your brand palette, logo, welcome messages, and multilingual translations.',
      },
      {
        title: 'Comprehensive CSAT & Analytics',
        description: 'Track first response time, average resolution time, agent productivity, and automated Customer Satisfaction (CSAT) survey ratings.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Intercom',
        domain: 'intercom.com',
        pricing: '$39 to $99/agent/mo plus $0.99 per AI resolution',
        description: 'The premier conversational customer engagement platform with automated onboarding and AI bots.',
        whyReplace: 'Costs explode exponentially as your support team expands, with punitive per-resolution charges for AI responses.',
      },
      {
        name: 'Zendesk',
        domain: 'zendesk.com',
        pricing: '$55 to $115+/agent/mo billed annually',
        description: 'The enterprise standard in ticket management and helpdesk operations for corporate teams.',
        whyReplace: 'Clunky legacy user experience, rigid contracts, slow implementation times, and expensive per-seat pricing.',
      },
      {
        name: 'Crisp',
        domain: 'crisp.chat',
        pricing: '$25 to $95+/mo per workspace',
        description: 'Modern all-in-one messaging platform popular with bootstrapped SaaS founders.',
        whyReplace: 'Caps message history and integrations on entry tiers, keeping proprietary control over your customer conversation history.',
      },
      {
        name: 'Help Scout',
        domain: 'helpscout.com',
        pricing: '$22 to $40/user/mo billed annually',
        description: 'Clean shared inbox and knowledge base platform designed for customer-centric small businesses.',
        whyReplace: 'Lacks native deep multichannel messaging (WhatsApp, Telegram) and incurs per-seat licensing penalties as teams scale.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'Free for commercial use, private modifications, and closed-source re-selling. Keep the copyright notice.',
    caveats: [
      'Chatwoot Cloud starts at $19 per agent per month, so sell on specialized industry workflows or done-for-you setup.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'Chatwoot is an open-source customer engagement suite that unifies live chat, email, WhatsApp, and social messaging into one collaborative inbox. It replaces Intercom and Zendesk without per-agent seat fees.',
    licenseWarning:
      'Permissive MIT community edition: safe for commercial SaaS hosting and white-labeling. Note that enterprise SAML/audit features require a commercial license from Chatwoot.',
    ideas: [
      {
        id: 'chatwoot-1',
        title: 'WhatsApp support inbox for e-commerce stores',
        customer: 'Shopify brands in Europe and Latin America',
        howToCharge: '$49 to $99 per month',
        youWouldNeedToAdd: [
          'WhatsApp Cloud API onboarding wizard',
          'Shopify order lookup sidebar widget inside Chatwoot',
          'Automated shipping status reply bot',
        ],
      },
      {
        id: 'chatwoot-2',
        title: 'Multi-brand customer inbox for agencies',
        customer: 'Marketing and social media agencies',
        howToCharge: '$29 per client account per month',
        youWouldNeedToAdd: [
          'Agency portal managing multiple isolated client inboxes',
          'Per-client custom domain and branding',
          'Monthly response-time SLA performance reports',
        ],
      },
      {
        id: 'chatwoot-3',
        title: 'HIPAA-ready patient messaging for telehealth',
        customer: 'Private clinics and telehealth startups',
        howToCharge: '$99 to $249 per month',
        youWouldNeedToAdd: [
          'End-to-end encrypted chat storage configuration',
          'BAA (Business Associate Agreement) compliance wrapper',
          'EMR/EHR patient record lookup integration',
        ],
      },
      {
        id: 'chatwoot-4',
        title: 'AI support agent that resolves common tickets',
        customer: 'SaaS companies with 500+ tickets a month',
        howToCharge: '$79 to $199 per month',
        youWouldNeedToAdd: [
          'LLM connector searching product documentation (RAG)',
          'Draft response suggestions for human agents',
          'Automated ticket resolution and CSAT follow-up',
        ],
      },
      {
        id: 'chatwoot-5',
        title: 'Live chat for real estate agencies',
        customer: 'Independent property brokers and developers',
        howToCharge: '$39 to $79 per month',
        youWouldNeedToAdd: [
          'Property listing card previews in chat',
          'Viewing appointment booking integration (Cal.com or Calendly)',
          'Agent lead capture form with instant SMS notification',
        ],
      },
    ],
    goodFitIf: [
      'You want to offer modern live chat without paying $50+/agent/month in software licensing.',
      'You are building for regions where WhatsApp or Telegram is the primary commerce communication channel.',
      'You have basic Docker or Kubernetes experience to manage a Rails + PostgreSQL + Redis stack.',
    ],
    skipIf: [
      'You cannot manage a multi-service Ruby on Rails + Sidekiq + PostgreSQL background infrastructure.',
      'You need a complex enterprise knowledge base with multi-language versioning out of the box.',
      'You want a zero-maintenance hosted solution and do not want to handle server upgrades.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/chatwoot/chatwoot.git',
      install: 'bundle install && pnpm install',
      run: 'bin/rails db:chatwoot_prepare && foreman start -f Procfile.dev',
      notes: 'Requires Ruby 3.2+, PostgreSQL, Redis, and Node.js. For production, the official Docker Compose setup is strongly recommended.',
    },
    tradeoffs: [
      'The Ruby on Rails + Sidekiq stack consumes ~1.5GB to 2GB RAM minimum, requiring a larger VPS than simple Go/Node apps.',
      'WhatsApp integration requires registering an official Meta Business Account and managing WhatsApp Cloud API tokens.',
      'Enterprise SSO (SAML) and advanced audit logs are restricted to Chatwoot paid enterprise editions.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'TryGhost/Ghost',
    repoName: 'Ghost',
    tagline: 'The leading open source publishing platform for independent newsletters and memberships',
    replaces: {
      name: 'Substack & WordPress',
      allReplaces: ['Substack', 'Medium', 'WordPress VIP', 'Beehiiv'],
      domain: 'substack.com',
      pricing: 'Substack takes a 10% perpetual cut of your subscriber revenue; Ghost takes 0%',
    },
    problemItSolves:
      'Publishing platforms like Substack take an aggressive 10% perpetual revenue cut on every paid subscriber you acquire forever, while offering minimal branding control and no custom code injection.\n\nMeanwhile, WordPress requires an unmanageable stack of 15+ plugins for memberships, Stripe paywalls, SEO, and newsletters that bog down load speeds and create frequent security vulnerabilities.',
    solution:
      'Ghost is a purpose-built publishing platform with native subscription tiers, automated newsletter delivery, customizable member portals, and zero transaction fees on your earnings.\n\nBuilt on a blazing-fast Node.js architecture with rich SEO defaults, Ghost gives creators and media companies absolute ownership of their member lists, content archives, and billing relationships.',
    whoItsFor: [
      'Independent journalists, newsletter operators, and niche media creators building high-margin businesses',
      'SaaS founders running content-driven marketing engines with publication authority',
      'Paid community operators offering gated articles, video content, and premium subscriber updates',
      'Agencies delivering bespoke publications, corporate magazines, and executive newsletters',
    ],
    features: [
      {
        title: '0% Platform Fee Stripe Integration',
        description: 'Connect directly to your Stripe account. You keep 100% of member subscription revenue minus standard credit card fees—no 10% Substack revenue tax.',
      },
      {
        title: 'Native Newsletter Delivery',
        description: 'Compose articles once in the distraction-free Koenig card editor and dispatch them directly to reader email inboxes via Mailgun with high deliverability.',
      },
      {
        title: 'Tiered Member Paywalls',
        description: 'Configure flexible free, monthly, annual, and complimentary membership tiers. Gate entire posts or specific paragraphs behind member locks.',
      },
      {
        title: 'Blazing Fast Node.js Architecture',
        description: 'Engineered for speed, rendering pages in under 50ms and routinely achieving near-perfect 100/100 Google Core Web Vitals scores.',
      },
      {
        title: 'Automated SEO & Social Cards',
        description: 'Generates structured JSON-LD schema, canonical tags, XML sitemaps, OpenGraph metadata, and Twitter cards automatically.',
      },
      {
        title: 'Native Webmentions & ActivityPub',
        description: 'Active federation support connects your publication to the decentralized Fediverse and social web networks.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Substack',
        domain: 'substack.com',
        pricing: '10% perpetual cut of all paid subscription revenue',
        description: 'The viral consumer platform for independent writers with a centralized discovery feed.',
        whyReplace: 'Takes 10% of your earnings forever, restricts custom domains and themes, and retains leverage over your audience relationships.',
      },
      {
        name: 'Beehiiv',
        domain: 'beehiiv.com',
        pricing: '$49 to $99+/mo based on subscriber tiers',
        description: 'Growth-oriented newsletter SaaS platform featuring native ad networks and referral mechanics.',
        whyReplace: 'Proprietary hosted platform where monthly subscription costs jump as subscriber lists grow past 2,500 and 10,000 users.',
      },
      {
        name: 'Medium',
        domain: 'medium.com',
        pricing: 'Partner Program pays variable pennies per member read time',
        description: 'Centralized blogging network with a paywalled publication feed.',
        whyReplace: 'You do not own your audience, cannot collect direct subscriber email addresses, and cannot run independent branding.',
      },
      {
        name: 'WordPress',
        domain: 'wordpress.org',
        pricing: 'Free open source, but requires $30–$100/mo in membership & caching plugins',
        description: 'The veteran CMS powering 40% of the web with infinite plugin extensibility.',
        whyReplace: 'Requires a complex jigsaw puzzle of plugins for paid memberships, caching, and newsletter sending that degrade speed and security.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'Free for commercial use, private modifications, and closed-source re-selling. Keep the copyright notice.',
    caveats: [
      'Ghost(Pro) managed hosting starts at $9 to $25 per month, so compete on turnkey setup, custom themes, or bundled newsletter management.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'Ghost is an open-source publishing powerhouse for independent journalism and newsletters. It features 0% take-rate Stripe billing, native email newsletters, member paywalls, and blazing fast Node.js performance.',
    licenseWarning:
      'Permissive MIT license: safe for commercial SaaS hosting and agency deployments. Note that the "Ghost" name and logo are protected trademarks of the Ghost Foundation.',
    ideas: [
      {
        id: 'ghost-1',
        title: 'Turnkey paid newsletters for industry experts',
        customer: 'Lawyers, financial analysts, and consultants',
        howToCharge: '$49 to $99 setup + 5% of paid subscription revenue',
        youWouldNeedToAdd: [
          'Pre-designed professional Ghost themes for consulting',
          'Mailgun email delivery onboarding and DNS verification',
          'Stripe subscription checkout setup and tax collection',
        ],
      },
      {
        id: 'ghost-2',
        title: 'Managed publication hosting for agencies',
        customer: 'B2B content marketing agencies',
        howToCharge: '$29 to $49 per client publication per month',
        youWouldNeedToAdd: [
          'One-click automated Ghost instance provisioning',
          'Automated daily off-site MySQL backups to AWS S3',
          'Multi-site management dashboard with uptime monitoring',
        ],
      },
      {
        id: 'ghost-3',
        title: 'Local community news portal',
        customer: 'Local journalists and neighborhood associations',
        howToCharge: '$19 to $39 per month or revenue share on ads',
        youWouldNeedToAdd: [
          'Local business directory section inside Ghost theme',
          'Event calendar integration with ticket sales',
          'Classifieds submission form with Stripe payment',
        ],
      },
      {
        id: 'ghost-4',
        title: 'Member-gated educational resource hub',
        customer: 'Course creators, coaches, and authors',
        howToCharge: '$39 to $79 per month',
        youWouldNeedToAdd: [
          'Video player embed integration (Vimeo or Bunny.net)',
          'Progress tracking checklist for course modules',
          'Community comments section with member verification',
        ],
      },
      {
        id: 'ghost-5',
        title: 'Curated industry link digest service',
        customer: 'Venture capital funds and tech curators',
        howToCharge: '$29 to $59 per month',
        youWouldNeedToAdd: [
          'Chrome extension for 1-click bookmarking to Ghost drafts',
          'Automated weekly digest template builder',
          'Sponsor slot booking calendar with automated invoicing',
        ],
      },
    ],
    goodFitIf: [
      'You are building a newsletter or membership business and want to keep 100% of your earnings.',
      'You want the fastest possible publication speeds without managing 20 WordPress plugins.',
      'You know how to configure Mailgun for reliable transactional and bulk email sending.',
    ],
    skipIf: [
      'You need a complex e-commerce catalog with inventory tracking (use Medusa or Shopify).',
      'You want a zero-configuration newsletter and do not want to manage Mailgun API keys (use Substack).',
      'You need extensive custom database schemas and arbitrary relational objects.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/TryGhost/Ghost.git',
      install: 'yarn setup',
      run: 'yarn dev',
      notes: 'Requires Node.js 18 or 20 and MySQL 8. For production, the ghost-cli installer (npm install -g ghost-cli) on an Ubuntu VPS is the gold standard.',
    },
    tradeoffs: [
      'Ghost requires a transactional email service (Mailgun is officially recommended) for sending newsletters, adding a small variable email bill.',
      'MySQL 8 is strictly required for production; SQLite is only supported for local development.',
      'Ghost is focused strictly on publishing and memberships; it is not a general-purpose website builder like Webflow.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'wasp-lang/open-saas',
    repoName: 'Open SaaS',
    tagline: 'The free, open-source full-stack React and Node.js SaaS starter template',
    replaces: {
      name: 'ShipFast & Makerkit',
      allReplaces: ['ShipFast', 'Makerkit', 'SaaS Pegasus', 'Divjoy'],
      domain: 'shipfa.st',
      pricing: 'ShipFast is $169–$249 one-time; Makerkit is $199–$299; Open SaaS is 100% free',
    },
    problemItSolves:
      'Starting a new SaaS application from scratch requires 2–4 weeks of tedious, non-differentiating boilerplate work: wiring up Stripe billing webhooks, setting up authentication with password resets, designing responsive dashboards, and configuring email delivery.\n\nCommercial SaaS boilerplates charge $169–$299+ for closed-source codebases with no ongoing updates or community support.',
    solution:
      'Open SaaS delivers a free, open-source, production-grade full-stack React and Node.js starter kit crafted with Tailwind CSS, Stripe/Lemon Squeezy billing, Plausible/Google analytics, and end-to-end authentication.\n\nIt establishes clean architectural patterns and accessible design components out of the box, letting you ship a verified, commercially viable MVP in days rather than months.',
    whoItsFor: [
      'Solo builders and indie hackers launching an MVP over a single weekend',
      'Developers creating AI micro-SaaS products wanting pre-wired OpenAI integration',
      'Technical founders seeking production-grade Stripe webhooks and authentication boilerplate',
      'Agencies building client MVPs who need a reliable, modular, standard React codebase',
    ],
    features: [
      {
        title: 'Pre-Wired Stripe Billing & Customer Portal',
        description: 'Complete subscription management with pricing tables, checkout sessions, customer portal links, and robust webhook listeners.',
      },
      {
        title: 'Turnkey Authentication & Social Logins',
        description: 'Email and password with email verification, password reset flows, and one-click Google and GitHub OAuth authentication.',
      },
      {
        title: 'Built-in Admin Analytics Dashboard',
        description: 'Monitor total signups, active paying subscribers, churned accounts, and monthly recurring revenue (MRR) without third-party tools.',
      },
      {
        title: 'Fully Configured Transactional Email',
        description: 'Beautiful responsive email templates crafted with react-email, pre-configured for SendGrid, Mailgun, or standard SMTP.',
      },
      {
        title: 'Working AI Wrapper Demo',
        description: 'Includes a functional OpenAI API integration example with credit management and streaming UI responses out of the box.',
      },
      {
        title: 'Prisma ORM & PostgreSQL Database',
        description: 'Robust data modeling with Prisma ORM, migrations, and automatic TypeScript typing across the entire frontend and backend.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'ShipFast',
        domain: 'shipfa.st',
        pricing: '$169 to $249 one-time purchase',
        description: 'The most popular Next.js boilerplate for launching startups quickly by Marc Lou.',
        whyReplace: 'Closed-source paid download with no official Git repository sync, no continuous framework updates, and personal license constraints.',
      },
      {
        name: 'Makerkit',
        domain: 'makerkit.dev',
        pricing: '$199 to $299 one-time purchase',
        description: 'Enterprise-grade SaaS boilerplate built with Next.js, Supabase, and Tailwind CSS.',
        whyReplace: 'Expensive upfront software investment for early-stage experiments with restrictive commercial multi-app terms.',
      },
      {
        name: 'SaaS Pegasus',
        domain: 'saaspegasus.com',
        pricing: '$295 to $995 one-time license',
        description: 'The leading production SaaS starter for Python and Django applications.',
        whyReplace: 'High price barrier oriented toward corporate projects, limited to the Python ecosystem.',
      },
      {
        name: 'Divjoy',
        domain: 'divjoy.com',
        pricing: '$149 to $299 one-time fee',
        description: 'Web-based React codebase generator supporting various UI libraries and backends.',
        whyReplace: 'Outdated generator patterns that create fragmented boilerplate files rather than a cohesive opinionated stack.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'Permissive MIT: build, rebrand, launch, and monetize closed-source SaaS freely.',
    caveats: [
      'Open SaaS uses the Wasp framework for config; learn Wasp\'s main.wasp syntax for declarative routing and auth.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'Open SaaS is a 100% free, open-source React + Node.js SaaS starter template built on Wasp. It replaces expensive boilerplates like ShipFast with pre-built Stripe payments, social auth, admin metrics, and AI integration.',
    licenseWarning:
      'Permissive MIT license: fully safe for commercial SaaS, private modifications, and closed-source re-selling. Keep the copyright notice.',
    ideas: [
      {
        id: 'opensaas-1',
        title: 'Niche AI content generator for real estate agents',
        customer: 'Realtors and property managers',
        howToCharge: '$19 to $39 per month',
        youWouldNeedToAdd: [
          'Property description prompt templates (bedrooms, amenities, location)',
          'Instagram and Facebook real estate post formatters',
          'User image upload for AI staging suggestions',
        ],
      },
      {
        id: 'opensaas-2',
        title: 'Micro-SaaS for freelance invoice reminders',
        customer: 'Freelancers and small agency owners',
        howToCharge: '$9 to $19 per month',
        youWouldNeedToAdd: [
          'Invoice data entry form or PDF upload',
          'Automated polite email reminder scheduler (3, 7, 14 days overdue)',
          'Stripe payment link embedding in reminder emails',
        ],
      },
      {
        id: 'opensaas-3',
        title: 'Developer portfolio and resume builder',
        customer: 'Junior software engineers and bootcamp grads',
        howToCharge: '$12 one-time or $5 per month for hosted portfolio',
        youWouldNeedToAdd: [
          'GitHub profile repository importer via API',
          'Clean responsive portfolio theme templates',
          'Custom domain routing (e.g., yourname.dev)',
        ],
      },
      {
        id: 'opensaas-4',
        title: 'Simple client feedback widget for websites',
        customer: 'Web designers and indie SaaS makers',
        howToCharge: '$15 to $29 per month',
        youWouldNeedToAdd: [
          'Embeddable JS feedback badge with screenshot capture',
          'Client dashboard with feedback inbox and status tags',
          'Slack and Discord webhook notification alerts',
        ],
      },
      {
        id: 'opensaas-5',
        title: 'Social media bio link tool for musicians',
        customer: 'Independent musicians and podcasters',
        howToCharge: '$5 to $9 per month with free tier',
        youWouldNeedToAdd: [
          'Music platform link aggregator (Spotify, Apple Music, YouTube)',
          'Custom audio preview player on the bio page',
          'Tour dates and merch store link sections',
        ],
      },
    ],
    goodFitIf: [
      'You are a React developer who wants to launch a real, billing SaaS product this weekend.',
      'You want a pre-built Stripe billing integration that actually works without hours of debugging.',
      'You want a free alternative to $200+ paid boilerplates with clean, modern code.',
    ],
    skipIf: [
      'You want a Python, Ruby, or Go backend (Open SaaS is strictly TypeScript/React/Node.js).',
      'You prefer raw Next.js 14 App Router without the declarative Wasp compiler architecture.',
      'You need an established enterprise monorepo with multiple microservices.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/wasp-lang/open-saas.git',
      install: 'cd open-saas/template && npm install',
      run: 'wasp start',
      notes: 'Requires the Wasp CLI: curl -sSL https://get.wasp-lang.dev/installer.sh | sh. Needs Node.js 18+ and a local or cloud PostgreSQL database.',
    },
    tradeoffs: [
      'Uses Wasp as the compilation framework; while productive, you write declarative routes and auth in a main.wasp file.',
      'Best suited for greenfield projects rather than retrofitting into an existing codebase.',
      'Requires a PostgreSQL database (Prisma does not support SQLite in production for this setup).',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'pocketbase/pocketbase',
    repoName: 'PocketBase',
    tagline: 'Open source backend in 1 file with real-time SQLite, auth, and file storage',
    replaces: {
      name: 'Firebase & Supabase',
      allReplaces: ['Firebase', 'Supabase', 'Backendless', 'AWS Amplify'],
      domain: 'firebase.google.com',
      pricing: 'Firebase charges per read/write; Supabase is $25/mo per project; PocketBase is free',
    },
    problemItSolves:
      'Modern backend-as-a-service platforms like Firebase charge unpredictable fees per document read/write that spiral out of control during viral traffic spikes or runaway database loops.\n\nConversely, self-hosting alternatives like Supabase require managing 12+ separate Docker containers (Postgres, Kong, PostgREST, GoTrue, Realtime, Storage), demanding high memory overhead and complex infrastructure upkeep.',
    solution:
      'PocketBase packs an embedded SQLite database with real-time subscriptions, file storage, authentication with OAuth2, and an intuitive admin dashboard into one single portable Go binary (<15MB).\n\nIt handles thousands of concurrent requests on a $4/month VPS, making backend provisioning and database backups instantaneous for solo developers and small teams.',
    whoItsFor: [
      'Solo developers and indie hackers wanting near-zero backend infrastructure maintenance',
      'Mobile app developers (Flutter, React Native, iOS, Android) needing an instant REST/SSE API',
      'Rapid prototype builders needing a database schema and authentication in 2 minutes',
      'Edge and IoT applications requiring an embedded backend running locally on small hardware',
    ],
    features: [
      {
        title: 'Single Portable Executable Binary',
        description: 'Zero external dependencies or container bloat. Simply download the binary, run ./pocketbase serve, and your entire backend is live.',
      },
      {
        title: 'Embedded High-Performance SQLite',
        description: 'Powered by SQLite in WAL mode, handling thousands of concurrent read/write operations per second with minimal CPU and RAM usage.',
      },
      {
        title: 'Real-Time Subscriptions via SSE',
        description: 'Subscribe to collection changes instantly using Server-Sent Events (SSE) without configuring complex WebSocket clusters.',
      },
      {
        title: 'Turnkey Authentication & OAuth2',
        description: 'Built-in email/password auth, magic passwordless links, and 20+ OAuth2 providers (Google, GitHub, Apple, Discord, Twitter, Microsoft).',
      },
      {
        title: 'Intuitive Web Admin Dashboard',
        description: 'Visually create collections, inspect records, configure relations, define access rules, and upload files directly from the browser.',
      },
      {
        title: 'Extensible via Go and JavaScript',
        description: 'Extend backend business logic using simple JavaScript hooks or import PocketBase as a Go package for maximum flexibility.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Firebase (Firestore)',
        domain: 'firebase.google.com',
        pricing: 'Pay-per-operation model ($0.06 per 100k reads, $0.18 per 100k writes)',
        description: 'Google\'s cloud platform for mobile and web apps with global document replication.',
        whyReplace: 'Unpredictable billing models, vendor lock-in to Google Cloud, and complex security rule testing.',
      },
      {
        name: 'Supabase',
        domain: 'supabase.com',
        pricing: '$25/mo per project for Pro tier; enterprise plans scale higher',
        description: 'The open-source Firebase alternative powered by PostgreSQL and dedicated extensions.',
        whyReplace: 'Self-hosting requires 12+ Docker microservices with 2GB+ RAM; managed cloud costs multiply across several small side projects.',
      },
      {
        name: 'Backendless',
        domain: 'backendless.com',
        pricing: '$15 to $200+/mo per application',
        description: 'Visual low-code backend builder with visual database modeling and push notifications.',
        whyReplace: 'Proprietary cloud architecture with strict API call limits and monthly licensing fees.',
      },
      {
        name: 'AWS Amplify',
        domain: 'aws.amazon.com/amplify',
        pricing: 'Pay-as-you-go AWS service aggregation (AppSync, DynamoDB, Cognito, S3)',
        description: 'Amazon\'s developer framework unifying AWS serverless primitives.',
        whyReplace: 'Notorious configuration complexity, sluggish local mock environments, and difficult multi-service debugging.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'Free for commercial use, private modifications, and closed-source re-selling. Keep the copyright notice.',
    caveats: [
      'PocketBase is designed as an embedded single-node database. It does not natively support distributed multi-region master clustering.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'PocketBase is a single-file open-source backend with embedded SQLite, real-time subscriptions, auth, and file storage. It replaces Firebase and Supabase with zero infrastructure maintenance.',
    licenseWarning:
      'Permissive MIT license: fully safe for commercial SaaS, private modifications, and closed-source re-selling. Keep the copyright notice.',
    ideas: [
      {
        id: 'pocketbase-1',
        title: 'Micro-SaaS backend as a service for Flutter developers',
        customer: 'Mobile app developers and indie studios',
        howToCharge: '$9 to $19 per app per month',
        youWouldNeedToAdd: [
          'One-click PocketBase instance provisioning on Hetzner or Fly.io',
          'Automated daily SQLite database backups to Cloudflare R2',
          'Custom domain SSL termination with Caddy',
        ],
      },
      {
        id: 'pocketbase-2',
        title: 'Real-time collaborative whiteboard for remote teams',
        customer: 'Product designers and agile coaches',
        howToCharge: '$8 to $15 per user per month',
        youWouldNeedToAdd: [
          'Canvas UI using tldraw or Excalidraw',
          'PocketBase real-time SSE subscriptions for cursor sync',
          'Export to PDF and PNG with workspace sharing permissions',
        ],
      },
      {
        id: 'pocketbase-3',
        title: 'Internal directory and employee handbook for small business',
        customer: 'Companies with 10 to 100 employees',
        howToCharge: '$29 to $69 per month',
        youWouldNeedToAdd: [
          'Employee profile directory with department filtering',
          'Rich text company wiki and policy doc section',
          'Slack notification on new team member announcements',
        ],
      },
      {
        id: 'pocketbase-4',
        title: 'Self-hosted form backend for static websites',
        customer: 'Web developers and marketing agencies',
        howToCharge: '$7 to $15 per month for unlimited forms',
        youWouldNeedToAdd: [
          'Form submission webhook endpoints with spam filtering',
          'Email notification delivery via Resend or Postmark',
          'CSV and Google Sheets export integration',
        ],
      },
      {
        id: 'pocketbase-5',
        title: 'Event registration and check-in system',
        customer: 'Conference organizers and meetup hosts',
        howToCharge: '$39 to $99 per event or $29 per month',
        youWouldNeedToAdd: [
          'Public event registration page with QR code ticket generation',
          'Mobile-friendly QR code check-in scanner for staff',
          'Attendee badge printing template generator',
        ],
      },
    ],
    goodFitIf: [
      'You are building an app with up to 100,000 active users and want near-zero hosting maintenance.',
      'You want a complete backend that runs from a single binary on a $4/mo server without Docker.',
      'You need real-time data synchronization via simple Server-Sent Events without WebSocket complexity.',
    ],
    skipIf: [
      'You require horizontal multi-region write replication across multiple database servers.',
      'You have massive write volume exceeding thousands of write queries per second.',
      'You need native PostgreSQL-specific extensions (e.g., pgvector, PostGIS).',
    ],
    quickStart: {
      clone: 'git clone https://github.com/pocketbase/pocketbase.git',
      install: 'go build',
      run: './pocketbase serve',
      notes: 'Or download the pre-compiled binary directly from pocketbase.io. Access the admin dashboard at http://127.0.0.1:8090/_/',
    },
    tradeoffs: [
      'SQLite is inherently a single-node database; you scale vertically (faster CPU, NVMe SSD) rather than horizontally across clusters.',
      'Complex analytical SQL joins across massive datasets are slower than a dedicated analytical PostgreSQL setup.',
      'Must ensure periodic SQLite backups (litestream or S3 upload) since the whole DB resides in one file.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'appsmithorg/appsmith',
    repoName: 'Appsmith',
    tagline: 'Open-source low-code platform to build internal tools, dashboards, and admin panels',
    replaces: {
      name: 'Retool & Microsoft Power Apps',
      allReplaces: ['Retool', 'Microsoft Power Apps', 'Internal.io', 'Mendix'],
      domain: 'retool.com',
      pricing: 'Retool costs $10–$50/user/mo; Power Apps is $20/user/mo; Appsmith is open-source',
    },
    problemItSolves:
      'Every growing company needs custom internal tools—refund dashboards, customer lookup consoles, inventory management screens, and approval workflows. Building these screens from scratch eats up to 30% of engineering bandwidth.\n\nCommercial internal tool builders like Retool charge steep per-user fees ($10–$50/user/month) that penalize companies for inviting internal team members or back-office staff.',
    solution:
      'Appsmith enables engineering teams to visually drag-and-drop 45+ UI widgets and bind them directly to PostgreSQL, MySQL, MongoDB, REST endpoints, and GraphQL APIs using standard JavaScript.\n\nIt eliminates recurring per-seat fees for internal tools, supports Git version control for code review, and can be hosted entirely within your private VPC.',
    whoItsFor: [
      'Engineering teams wanting to deliver back-office tools in hours instead of weeks',
      'Operations and customer support leads needing custom CRM and refund processing consoles',
      'IT departments modernizing legacy business workflows without paying enterprise seat taxes',
      'Software agencies providing custom enterprise portal development services',
    ],
    features: [
      {
        title: '45+ Drag-and-Drop UI Widgets',
        description: 'Interactive tables with cell editing, charts, modal forms, date pickers, document viewers, and maps ready to bind to live queries.',
      },
      {
        title: 'Native Enterprise Connectors',
        description: 'Direct, secure connections to PostgreSQL, MySQL, MongoDB, Redis, Snowflake, Elasticsearch, Google Sheets, and REST/GraphQL APIs.',
      },
      {
        title: 'Standard JavaScript Everywhere',
        description: 'Write JavaScript inside double curly braces {{ ... }} anywhere in the UI to transform data, run async calls, and trigger side effects.',
      },
      {
        title: 'Role-Based Access Control (RBAC)',
        description: 'Manage granular permissions across workspaces, applications, and page actions to ensure data isolation between departments.',
      },
      {
        title: 'Git Version Control Integration',
        description: 'Connect applications directly to GitHub or GitLab for code review, branching, pull requests, and automated deployment pipelines.',
      },
      {
        title: 'Secure VPC & Air-Gapped Hosting',
        description: 'Deploy behind corporate firewalls on Kubernetes or Docker without exposing sensitive internal database ports to the public internet.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Retool',
        domain: 'retool.com',
        pricing: '$10 to $50/user/month billed annually',
        description: 'The premium commercial market leader in internal application development.',
        whyReplace: 'Costs escalate exponentially as non-technical staff across support, ops, and sales require access.',
      },
      {
        name: 'Microsoft Power Apps',
        domain: 'powerapps.microsoft.com',
        pricing: '$20/user/month per app license',
        description: 'Microsoft\'s corporate low-code platform tied deeply to the Office 365 and Dataverse ecosystem.',
        whyReplace: 'Clunky developer experience, complex proprietary formulas, and heavy enterprise vendor lock-in.',
      },
      {
        name: 'Internal.io',
        domain: 'internal.io',
        pricing: 'Acquired and shut down for new signups',
        description: 'Former commercial competitor for rapid internal tool generation.',
        whyReplace: 'Demonstrates the platform risk of relying on proprietary venture-backed internal tool SaaS vendors.',
      },
      {
        name: 'Mendix',
        domain: 'mendix.com',
        pricing: 'Enterprise plans typically exceed $2,000+/mo',
        description: 'Siemens-owned enterprise low-code development platform for massive legacy corporations.',
        whyReplace: 'Extremely costly annual licensing, slow development velocity, and heavy IT procurement overhead.',
      },
    ],
    licenseSpdx: 'Apache-2.0',
    badge: 'green',
    licenseMeaning: 'Permissive Apache 2.0: commercial use, private modification, and distribution permitted. Requires attribution.',
    caveats: [
      'Appsmith Enterprise adds SAML SSO, audit logs, and custom roles under a paid license.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: true,
    summary:
      'Appsmith is an open-source low-code platform for building internal tools, dashboards, and admin panels. It connects to any database and replaces Retool without punitive per-user seat fees.',
    licenseWarning:
      'Permissive Apache-2.0 core: safe for commercial deployments and client internal tools. Note that enterprise SAML SSO and custom RBAC are open-core paid features.',
    ideas: [
      {
        id: 'appsmith-1',
        title: 'Custom refund and dispute portal for Stripe businesses',
        customer: 'SaaS and e-commerce companies with high ticket volume',
        howToCharge: '$49 to $99 per month',
        youWouldNeedToAdd: [
          'Pre-built Stripe API connector for charges, refunds, and disputes',
          'Role-based refund authorization thresholds ($50 vs $500 approval)',
          'Slack notification on disputed charges with 1-click resolution',
        ],
      },
      {
        id: 'appsmith-2',
        title: 'Warehouse inventory and packing workstation',
        customer: 'Small 3PL warehouses and D2C brands',
        howToCharge: '$79 to $149 per month',
        youWouldNeedToAdd: [
          'Barcode scanner integration using tablet camera or USB scanner',
          'PostgreSQL order table with packing checklist validation',
          'Shipping label printing trigger (EasyPost or ShipStation API)',
        ],
      },
      {
        id: 'appsmith-3',
        title: 'Client onboarding portal for digital agencies',
        customer: 'SEO, design, and marketing agencies',
        howToCharge: '$39 to $79 per month',
        youWouldNeedToAdd: [
          'Multi-step intake questionnaire with file upload',
          'Automated project workspace creation in ClickUp, Asana, or Trello',
          'Client milestone progress dashboard with status updates',
        ],
      },
      {
        id: 'appsmith-4',
        title: 'Vendor and contractor invoice approval system',
        customer: 'Accounting departments at 20-100 person companies',
        howToCharge: '$59 to $129 per month',
        youWouldNeedToAdd: [
          'PDF invoice viewer with extracted data review',
          'Department head approval/rejection button workflow',
          'QuickBooks or Xero bill synchronization via API',
        ],
      },
      {
        id: 'appsmith-5',
        title: 'Fleet and equipment maintenance tracker',
        customer: 'Construction, delivery, and equipment rental businesses',
        howToCharge: '$49 to $99 per month',
        youWouldNeedToAdd: [
          'Vehicle inspection checklist form with photo uploads',
          'Maintenance schedule calendar with mileage threshold alerts',
          'Repair cost history and vendor work order generator',
        ],
      },
    ],
    goodFitIf: [
      'You need to deliver functional internal business apps in hours rather than dedicating months of React dev.',
      'You have existing SQL databases or REST APIs and need a clean UI on top of them.',
      'You have 10+ internal users and do not want to pay Retool $500+/month in software licenses.',
    ],
    skipIf: [
      'You are building a public-facing customer SaaS product (Appsmith is optimized for internal tooling).',
      'You need highly customized animations, pixel-perfect consumer UI, or mobile offline capabilities.',
      'You cannot host Docker containers on an internal server or cloud VM.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/appsmithorg/appsmith.git',
      install: 'cd deploy && ./install.sh',
      run: 'docker-compose up -d',
      notes: 'The official Docker image (appsmith/appsmith-ce) is the fastest way to get started. Access at http://localhost:80.',
    },
    tradeoffs: [
      'Designed primarily for desktop browser administration tools; not intended for consumer-facing mobile web apps.',
      'Requires ~2GB RAM minimum for the Java backend engine and embedded MongoDB application configuration database.',
      'Enterprise SSO (SAML/Okta) and granular audit logging are restricted to Appsmith Enterprise editions.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'calcom/cal.diy',
    repoName: 'Cal.com',
    tagline: 'Open source scheduling infrastructure for everyone',
    replaces: {
      name: 'Calendly & Acuity Scheduling',
      allReplaces: ['Calendly', 'Acuity Scheduling', 'Doodle', 'OnceHub'],
      domain: 'calendly.com',
      pricing: 'Calendly costs $10–$16/user/mo; Cal.com is open source and self-hostable',
    },
    problemItSolves:
      'Scheduling platforms like Calendly enforce rigid per-seat pricing ($10–$16/user/month), impose their own branding on your booking links, and lock meeting data in proprietary systems.\n\nOrganizations in regulated industries (healthcare HIPAA, legal, finance) cannot safely route client meeting metadata through third-party multi-tenant SaaS tools.',
    solution:
      'Cal.com provides a white-label scheduling infrastructure with customizable booking links, round-robin team distribution, timezone conversion, calendar synchronization, and Stripe payment collection.\n\nIt can be completely rebranded under your custom domain, embedded in web apps via clean React components, and hosted privately to ensure strict data compliance.',
    whoItsFor: [
      'Telehealth providers requiring HIPAA-compliant, self-hosted appointment scheduling',
      'Sales teams needing intelligent routing forms and automated round-robin lead assignment',
      'Independent consultants, coaches, and lawyers charging upfront for booked sessions',
      'Vertical SaaS builders embedding native calendar booking workflows directly into their apps',
    ],
    features: [
      {
        title: 'Complete White-Label Customization',
        description: 'Host booking pages on your own custom domain, customize fonts and branding, and eliminate third-party logos entirely.',
      },
      {
        title: 'Multi-Calendar Bi-Directional Sync',
        description: 'Real-time synchronization with Google Calendar, Microsoft Outlook/Office 365, Apple Calendar, and standard CalDAV servers.',
      },
      {
        title: 'Advanced Lead Routing Forms',
        description: 'Ask screening questions before booking to dynamically route high-value leads to senior reps based on custom qualification logic.',
      },
      {
        title: 'Upfront Payment Collection via Stripe',
        description: 'Require clients to pay for consultations or lessons upfront with native Stripe integration before the appointment is confirmed.',
      },
      {
        title: 'Team Round-Robin & Collective Meetings',
        description: 'Distribute meetings evenly across sales reps or schedule group meetings that automatically verify multiple team members are free.',
      },
      {
        title: 'Full Developer API & Webhooks',
        description: 'Extensive REST API, Next.js components, and webhook triggers to embed calendar scheduling natively into your SaaS product.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Calendly',
        domain: 'calendly.com',
        pricing: '$10 to $16/user/month billed annually',
        description: 'The market leader in hosted scheduling links and meeting booking.',
        whyReplace: 'Limits custom branding, restricts automated routing on base tiers, and incurs high monthly costs as team size grows.',
      },
      {
        name: 'Acuity Scheduling',
        domain: 'acuityscheduling.com',
        pricing: '$16 to $49/month per account',
        description: 'Squarespace-owned scheduling platform tailored to service businesses, salons, and instructors.',
        whyReplace: 'Lacks modern developer API primitives and charges higher monthly fees for multi-staff scheduling.',
      },
      {
        name: 'Doodle',
        domain: 'doodle.com',
        pricing: '$6.95 to $19.95/user/month',
        description: 'Veteran meeting poll scheduler for finding common times among groups.',
        whyReplace: 'Cluttered user experience, persistent ad placements on non-premium tiers, and dated scheduling interfaces.',
      },
      {
        name: 'OnceHub',
        domain: 'oncehub.com',
        pricing: '$10 to $30/user/month',
        description: 'Lead generation and meeting scheduling platform for marketing and sales organizations.',
        whyReplace: 'Complex legacy configuration architecture with restrictive per-seat licensing tiers.',
      },
    ],
    licenseSpdx: 'MIT',
    badge: 'green',
    licenseMeaning: 'Free for commercial use, private modification, and closed-source re-selling. Keep the copyright notice.',
    caveats: [
      'Cal.com keeps enterprise features (SAML, SCIM, orgs) in an "ee" folder with commercial licensing.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: true,
    summary:
      'Cal.com is open-source scheduling infrastructure. It replaces Calendly with white-label booking, automated lead routing, upfront Stripe payments, and full data sovereignty.',
    licenseWarning:
      'Community edition is MIT. Note that enterprise multi-tenant organizational features in the "ee" directory require a commercial license from Cal.com.',
    ideas: [
      {
        id: 'cal-1',
        title: 'HIPAA-compliant booking for private therapy practices',
        customer: 'Therapists, counselors, and psychologists',
        howToCharge: '$29 to $59 per month per practice',
        youWouldNeedToAdd: [
          'Pre-appointment intake questionnaire with digital signature',
          'HIPAA-compliant video call integration (Whereby or Daily.co)',
          'Automated SMS appointment reminders to prevent no-shows',
        ],
      },
      {
        id: 'cal-2',
        title: 'Paid consultation booking for creators and experts',
        customer: 'Industry consultants, executive coaches, and creators',
        howToCharge: '$19/mo or 5% fee on booked consultations',
        youWouldNeedToAdd: [
          'Stripe upfront payment collection before calendar booking',
          'Custom branded profile page showcasing testimonials',
          'Automated calendar event with Zoom or Google Meet link',
        ],
      },
      {
        id: 'cal-3',
        title: 'Interview scheduling engine for recruiting agencies',
        customer: 'Staffing firms and boutique recruiters',
        howToCharge: '$49 to $99 per month',
        youWouldNeedToAdd: [
          'Multi-interviewer collective availability matching',
          'Candidate resume preview attached to calendar invite',
          'Automated interviewer evaluation scorecard email after meeting',
        ],
      },
      {
        id: 'cal-4',
        title: 'Car dealership test drive booking system',
        customer: 'Auto dealerships and vehicle showrooms',
        howToCharge: '$79 to $149 per dealership location per month',
        youWouldNeedToAdd: [
          'Vehicle inventory selection dropdown during booking',
          'Driver license photo upload verification step',
          'SMS confirmation and reminder sequence for the test drive',
        ],
      },
      {
        id: 'cal-5',
        title: 'Salon and personal service appointment widget',
        customer: 'Barbershops, beauty salons, and tattoo studios',
        howToCharge: '$29 to $49 per month',
        youWouldNeedToAdd: [
          'Staff member selection with individual service menus',
          'Deposit or full-payment collection via Stripe',
          'Walk-in waitlist queue view for staff tablets',
        ],
      },
    ],
    goodFitIf: [
      'You are building a vertical SaaS application that requires an embedded scheduling workflow.',
      'You need a white-label booking link on your own domain without Calendly branding.',
      'You operate in a privacy-sensitive industry (healthcare, legal) requiring self-hosted data storage.',
    ],
    skipIf: [
      'You only need a simple, single personal booking link and don\'t mind Calendly\'s free tier.',
      'You cannot manage a Next.js + PostgreSQL + Prisma stack on your own server infrastructure.',
      'You require advanced enterprise SAML/SCIM features without paying Cal.com for their EE license.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/calcom/cal.diy.git',
      install: 'yarn install',
      run: 'yarn dx',
      notes: 'Requires Node.js 18+, PostgreSQL, and Prisma. Docker Compose setup is available for quick evaluation.',
    },
    tradeoffs: [
      'The Cal.com monorepo is substantial in size; initial builds and dependencies require adequate CPU and RAM.',
      'Google Calendar and Outlook sync require registering your own OAuth apps in Google Cloud Console and Azure.',
      'Enterprise features (multi-tenant teams, organizations, SCIM) reside in the proprietary "ee" directory.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'twentyhq/twenty',
    repoName: 'Twenty',
    tagline: 'The modern open source CRM alternative to Salesforce',
    replaces: {
      name: 'Salesforce & HubSpot CRM',
      allReplaces: ['Salesforce', 'HubSpot CRM', 'Pipedrive', 'Attio'],
      domain: 'salesforce.com',
      pricing: 'Salesforce is $25–$300/user/mo; HubSpot Sales is $20–$150/user/mo',
    },
    problemItSolves:
      'Legacy CRMs like Salesforce and HubSpot are weighed down by decades of technical debt, dated user interfaces, and punishing per-seat monthly license fees ($25–$300+/user/month).\n\nCustomizing fields or data schemas is cumbersome, and customer relationship data is locked inside closed vendor clouds with opaque export workflows.',
    solution:
      'Twenty is a modern, Notion-style CRM built on NestJS and React with a keyboard-first interface, customizable kanban boards, rich custom objects, and automated email timeline syncing.\n\nIt offers transparent GraphQL and REST APIs, letting founders tailor data models to their business without paying exorbitant seat taxes as the team expands.',
    whoItsFor: [
      'B2B sales teams wanting an agile, fast CRM without paying hundreds of dollars per seat',
      'Startups and scale-ups with complex business models requiring custom relational data objects',
      'Agencies and consultancies managing client pipelines, contracts, and communication history',
      'Privacy-conscious European companies requiring CRM data to remain on private servers',
    ],
    features: [
      {
        title: 'Modern Notion-Style Fast Interface',
        description: 'Lightning-fast keyboard navigation, flexible table views, Kanban boards, and customizable filters for high-velocity sales workflows.',
      },
      {
        title: 'Extensible Custom Objects & Fields',
        description: 'Model custom business relationships (contracts, subscriptions, onboarding tasks) with zero code directly from the UI.',
      },
      {
        title: 'Bi-Directional Email Synchronization',
        description: 'Auto-sync customer email threads, compose messages directly from contact profiles, and log interaction history automatically.',
      },
      {
        title: 'Visual Pipeline & Deal Forecasting',
        description: 'Drag and drop deals across stages, set win probabilities, and forecast monthly recurring revenue with visual progress metrics.',
      },
      {
        title: 'Complete PostgreSQL Data Sovereignty',
        description: 'All customer data is stored directly in your own PostgreSQL database, enabling direct SQL reporting and painless backups.',
      },
      {
        title: 'Modern GraphQL & REST APIs',
        description: 'Built on NestJS and React with modern APIs to integrate customer interactions into your core SaaS product.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'Salesforce Sales Cloud',
        domain: 'salesforce.com',
        pricing: '$25 to $300+/user/month billed annually',
        description: 'The enterprise standard in global CRM software with massive third-party ecosystem.',
        whyReplace: 'Extreme implementation complexity, high annual license costs, slow page rendering, and consultant lock-in.',
      },
      {
        name: 'HubSpot Sales Hub',
        domain: 'hubspot.com',
        pricing: '$20 to $150+/user/month plus steep marketing contact tier price jumps',
        description: 'Popular inbound marketing and sales CRM with unified email and deal tracking.',
        whyReplace: 'Costs jump sharply as your database of marketing contacts and sales seats grows.',
      },
      {
        name: 'Pipedrive',
        domain: 'pipedrive.com',
        pricing: '$14 to $99/user/month',
        description: 'Activity-based sales CRM favored by small teams for simple deal pipelines.',
        whyReplace: 'Restricts advanced features and two-way email sync to higher tiers with proprietary cloud storage.',
      },
      {
        name: 'Attio',
        domain: 'attio.com',
        pricing: '$29 to $119/user/month',
        description: 'Next-generation data-driven CRM featuring real-time collaboration and flexible data models.',
        whyReplace: 'Expensive per-seat pricing for early-stage teams with no option to self-host customer data.',
      },
    ],
    licenseSpdx: 'AGPL-3.0',
    badge: 'yellow',
    licenseMeaning: 'Copyleft AGPL-3.0: free for internal business use and commercial SaaS hosting. If you modify Twenty itself and offer it to users, you must publish your changes under AGPL.',
    caveats: [
      'AGPL-3.0 requires you to share modifications to Twenty if you host it for users. Safe for internal business use or if you keep your custom value-add in external API microservices.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'Twenty is a modern open-source CRM featuring a clean Notion-like UI, custom objects, and two-way email sync. It replaces Salesforce and HubSpot without per-seat taxes.',
    licenseWarning:
      'Copyleft AGPL-3.0: safe for internal company use and commercial SaaS hosting. If you modify Twenty core code and offer it as a service, those modifications must remain open source under AGPL-3.0.',
    ideas: [
      {
        id: 'twenty-1',
        title: 'Vertical CRM for venture capital and angel syndicates',
        customer: 'VC funds, angel investors, and accelerator programs',
        howToCharge: '$99 to $249 per month',
        youWouldNeedToAdd: [
          'Custom Deal Flow objects with pitch deck attachments',
          'LP (Limited Partner) communication tracker and capital call history',
          'Portfolio company metrics reporting dashboard',
        ],
      },
      {
        id: 'twenty-2',
        title: 'Client pipeline CRM for creative agencies',
        customer: 'Design studios, video production, and branding agencies',
        howToCharge: '$39 to $79 per month',
        youWouldNeedToAdd: [
          'Project proposal and scope-of-work generator',
          'Contract value milestones with deposit payment links',
          'Client milestone approval portal',
        ],
      },
      {
        id: 'twenty-3',
        title: 'Sponsorship and advertising pipeline for media brands',
        customer: 'Podcast networks, newsletters, and YouTube creators',
        howToCharge: '$29 to $69 per month',
        youWouldNeedToAdd: [
          'Sponsor booking calendar with episode availability dates',
          'Ad copy guidelines submission form for sponsors',
          'Automated invoice generation upon episode release',
        ],
      },
      {
        id: 'twenty-4',
        title: 'Commercial real estate leasing CRM',
        customer: 'Commercial property managers and leasing brokers',
        howToCharge: '$79 to $199 per month',
        youWouldNeedToAdd: [
          'Property unit inventory records with square footage and floor plans',
          'Tenant lease expiration alerts (90, 60, 30 days)',
          'Tour feedback log with instant email follow-up',
        ],
      },
      {
        id: 'twenty-5',
        title: 'B2B SaaS churn prevention and retention CRM',
        customer: 'Post-revenue SaaS companies with 100+ accounts',
        howToCharge: '$59 to $149 per month',
        youWouldNeedToAdd: [
          'Customer health score formula based on product usage events',
          'Automated at-risk account alert triggers for account managers',
          'Customer success review meeting booking link',
        ],
      },
    ],
    goodFitIf: [
      'You are building a vertical CRM tailored to a specific industry that currently overpays for Salesforce.',
      'You love modern, keyboard-friendly UI (like Notion and Linear) and want a fast CRM experience.',
      'You are comfortable with the AGPL-3.0 license requirements (keeping core modifications open or building external service plugins).',
    ],
    skipIf: [
      'You want to close-source deep internal modifications to the CRM core engine without sharing source code.',
      'You need a lightweight script (Twenty is a comprehensive NestJS + React monorepo requiring ~2GB RAM).',
      'You rely on the Salesforce AppExchange ecosystem of thousands of legacy third-party vendor plugins.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/twentyhq/twenty.git',
      install: 'yarn install',
      run: 'yarn dev',
      notes: 'Requires Node.js 20+, PostgreSQL, and Redis. The official Docker Compose setup is the recommended production path.',
    },
    tradeoffs: [
      'AGPL-3.0 requires sharing your source code if you modify the Twenty codebase itself and host it as a service.',
      'Relatively young and rapidly evolving project; schema migrations should be tested carefully before production upgrades.',
      'Requires full-stack TypeScript knowledge to extend custom server-side business logic.',
    ],
    builtFromThis: [],
  },
  {
    repoFullName: 'documenso/documenso',
    repoName: 'Documenso',
    tagline: 'The open-source DocuSign alternative for digital signatures',
    replaces: {
      name: 'DocuSign & PandaDoc',
      allReplaces: ['DocuSign', 'PandaDoc', 'Dropbox Sign (HelloSign)', 'Adobe Sign'],
      domain: 'docusign.com',
      pricing: 'DocuSign costs $10–$40/user/mo with strict 100-envelope annual caps',
    },
    problemItSolves:
      'Commercial electronic signature services like DocuSign and PandaDoc impose steep per-user monthly fees, enforce arbitrary annual caps on envelope sends (~100 envelopes/user/year), and charge excessive rates for developer API signing integrations.\n\nStoring sensitive commercial contracts on third-party clouds also raises compliance, confidentiality, and data residency concerns.',
    solution:
      'Documenso delivers a clean, open document signing platform with cryptographic verification, customizable signer workflows, audit trails, and self-hosted storage adapters.\n\nIt provides unlimited envelope sends, embeds seamlessly into existing web applications via developer-friendly APIs, and ensures sensitive business agreements remain on private infrastructure.',
    whoItsFor: [
      'Legal tech founders building tailored contract workflows for specific industries',
      'Human Resources and recruitment platforms embedding offer letter signatures',
      'Real estate agencies and property managers executing digital lease agreements',
      'Enterprises with strict data residency policies requiring contracts to remain in private storage',
    ],
    features: [
      {
        title: 'Legally Binding Cryptographic Signatures',
        description: 'Digitally signed and sealed with full cryptographic integrity compliant with global e-signature frameworks (ESIGN, eIDAS).',
      },
      {
        title: 'Reusable Document Templates',
        description: 'Design standard contracts, NDAs, and agreements with drag-and-drop signature, initials, date, and text fields.',
      },
      {
        title: 'Immutable Audit Trail Certificates',
        description: 'Generates a tamper-evident audit certificate recording recipient IP addresses, timestamps, email verification, and cryptographic hashes.',
      },
      {
        title: 'Developer-First Signing API',
        description: 'Embed document signing seamlessly into your own web applications via clean REST APIs and iframe widgets.',
      },
      {
        title: 'Unlimited Document Envelopes',
        description: 'Send and sign unlimited contracts without worrying about arbitrary annual quotas or punitive per-envelope overage penalties.',
      },
      {
        title: 'Self-Hosted Private Storage',
        description: 'Store signed documents securely in your own private AWS S3 bucket, Cloudflare R2, or local storage without third-party exposure.',
      },
    ],
    commercialAlternatives: [
      {
        name: 'DocuSign',
        domain: 'docusign.com',
        pricing: '$10 to $40/user/month with ~100 envelope annual caps; API plans start at $50/mo',
        description: 'The global market standard in corporate electronic signature management.',
        whyReplace: 'Strict annual envelope sending caps, costly API overages, and rigid corporate contract terms.',
      },
      {
        name: 'PandaDoc',
        domain: 'pandadoc.com',
        pricing: '$19 to $49/user/month billed annually',
        description: 'Proposal and contract management software popular with B2B sales teams.',
        whyReplace: 'High per-user seat fees that discourage granting contract creation access across company departments.',
      },
      {
        name: 'Dropbox Sign (HelloSign)',
        domain: 'hellosign.com',
        pricing: '$15 to $25/user/month; API plans start at $99/mo',
        description: 'Developer-friendly e-signature tool integrated with Dropbox.',
        whyReplace: 'API pricing scales aggressively based on volume, with monthly minimum thresholds.',
      },
      {
        name: 'Adobe Sign',
        domain: 'acrobat.adobe.com',
        pricing: '$13 to $20/license/month',
        description: 'Adobe\'s signature workflow tool tied into Acrobat PDF ecosystem.',
        whyReplace: 'Clunky interface, slow mobile signing experience, and Adobe Creative Cloud bundling complexity.',
      },
    ],
    licenseSpdx: 'AGPL-3.0',
    badge: 'yellow',
    licenseMeaning: 'Copyleft AGPL-3.0: free for commercial hosting and internal use. If you modify Documenso itself and offer it as a service, you must publish your changes under AGPL.',
    caveats: [
      'AGPL-3.0 applies if you modify Documenso core and host it publicly. Safe for internal business use or if extending via external API wrappers.',
    ],
    buildable: true,
    reviewed: true,
    lastVerified: 'Nov 19, 2026',
    isOpenCore: false,
    summary:
      'Documenso is an open-source digital signature platform. It replaces DocuSign with legally binding e-signatures, document templates, audit trails, and zero envelope caps.',
    licenseWarning:
      'Copyleft AGPL-3.0: safe for internal corporate signing workflows and commercial SaaS hosting. If you modify Documenso core and offer it as a service to users, those changes must remain open under AGPL-3.0.',
    ideas: [
      {
        id: 'documenso-1',
        title: '1-click NDA and contract signing for freelancers',
        customer: 'Freelancers, consultants, and independent agencies',
        howToCharge: '$9 to $19 per month for unlimited contracts',
        youWouldNeedToAdd: [
          'Pre-drafted lawyer-approved NDA and client service agreement templates',
          'One-click client signing link with SMS reminder option',
          'Signed contract PDF storage with Google Drive and Dropbox sync',
        ],
      },
      {
        id: 'documenso-2',
        title: 'Residential lease agreement signing for landlords',
        customer: 'Independent landlords and small property managers',
        howToCharge: '$15 per signed lease or $29 per month',
        youWouldNeedToAdd: [
          'State-specific residential lease template library',
          'Co-signer and multi-tenant signing order flow',
          'Rent deposit payment trigger after lease execution via Stripe',
        ],
      },
      {
        id: 'documenso-3',
        title: 'Employee onboarding document packet for startups',
        customer: 'Early-stage tech startups and HR managers',
        howToCharge: '$39 to $79 per month',
        youWouldNeedToAdd: [
          'Bundled onboarding packet (offer letter, W-9/W-4, NDA, IP assignment)',
          'New hire progress tracker showing completed signatures',
          'Slack notification when all onboarding documents are signed',
        ],
      },
      {
        id: 'documenso-4',
        title: 'Gym and fitness liability waiver kiosk',
        customer: 'CrossFit gyms, martial arts studios, and climbing centers',
        howToCharge: '$29 to $49 per month per location',
        youWouldNeedToAdd: [
          'Tablet-optimized full-screen waiver kiosk mode',
          'Parent/guardian signature flow for minors',
          'Member lookup and emergency contact database',
        ],
      },
      {
        id: 'documenso-5',
        title: 'Equipment rental agreement signing system',
        customer: 'Camera gear, tool, and party rental shops',
        howToCharge: '$39 to $89 per month',
        youWouldNeedToAdd: [
          'Rental item serial number and condition report checklist',
          'Credit card damage deposit authorization hold via Stripe',
          'Automated return date reminder with extension request link',
        ],
      },
    ],
    goodFitIf: [
      'You send 50+ contracts a month and refuse to pay DocuSign per-envelope overage fees.',
      'You are building a vertical SaaS (HR, real estate, legal) that requires embedded document signing.',
      'You want full cryptographic control and privacy over where your signed contracts are archived.',
    ],
    skipIf: [
      'You only sign 1 or 2 documents a year (use free web tools instead).',
      'You want to close-source core modifications to Documenso without contributing them back under AGPL.',
      'You cannot host a modern Next.js + Prisma + PostgreSQL + Redis application.',
    ],
    quickStart: {
      clone: 'git clone https://github.com/documenso/documenso.git',
      install: 'pnpm install',
      run: 'pnpm dev',
      notes: 'Requires Node.js 18+, PostgreSQL, and Redis. Uses Prisma ORM and Turborepo monorepo architecture.',
    },
    tradeoffs: [
      'AGPL-3.0 license requires keeping modifications to the Documenso application open source if hosted publicly.',
      'Digital certificate authorities (PKI) and advanced QES (Qualified Electronic Signatures) require third-party TSP configuration.',
      'Requires maintaining reliable background queue workers (Redis) for processing document rendering and signature stamping.',
    ],
    builtFromThis: [],
  },
];

export const getHandpickedDossier = (fullFullName: string): HandpickedRepoDossier | null => {
  const normalized = fullFullName.toLowerCase().trim();
  return (
    HANDPICKED_REPOS.find(
      (d) => d.repoFullName.toLowerCase().trim() === normalized
    ) ?? null
  );
};
