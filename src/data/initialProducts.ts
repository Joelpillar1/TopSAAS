import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    rank: 1,
    previousRank: 1,
    name: 'Cursor',
    tagline: 'The AI-first Code Editor built for software engineers',
    url: 'https://cursor.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=cursor.com&sz=128',
    twitterHandle: '@cursor_ai',
    category: 'Developer Tools',
    totalBid: 1420,
    clicks: 18450,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 1000 * 60 * 12,
    verified: true,
    featuredQuote: 'Dominating Developer Mindshare in 2026',
    description: 'Cursor is an advanced AI-native fork of VS Code engineered to make software developers radically more productive. By integrating deep codebase-wide context into foundational reasoning models like Claude 3.5 Sonnet and GPT-4o, Cursor predicts your next edit, generates entire multi-file features, debugs complex compiler traces, and references your whole repository in natural language.',
    targetAudience: 'Full-stack engineers, software architects, AI researchers, and engineering teams.',
    pricingModel: 'Freemium (Free tier + $20/mo Pro + Enterprise plans)',
    whatItDoes: [
      'Indexed Repository Search: Indexes your entire workspace with vector embeddings to answer questions about any function, module, or type across millions of lines of code.',
      'Multi-File Composer: Generates, updates, and refactors code across multiple files simultaneously with unified diff previews.',
      'Copilot++ Next-Action Prediction: Predicts where your cursor is going next and autocompletes complex refactors before you finish typing.',
      'In-line Prompting (Cmd+K): Highlight any block of code to refactor, write unit tests, fix vulnerabilities, or explain logic in-place.',
      'Terminal & Linter Auto-Fix: Reads terminal error logs and automatically proposes one-click diffs to resolve broken dependencies or build errors.'
    ],
    features: [
      {
        title: 'Full-Codebase Context (@codebase)',
        description: 'Semantic vector search across your whole repository allowing you to reference any file, docs, or web URL during generation.',
        tag: 'Core Superpower'
      },
      {
        title: 'Composer Agent',
        description: 'Autonomous multi-file code editing workspace capable of creating full features from scratch and running tests.',
        tag: 'Agentic Workflow'
      },
      {
        title: 'Instant VS Code Migration',
        description: 'One-click import for all your VS Code extensions, keybindings, themes, and settings with 100% compatibility.',
        tag: 'Developer Experience'
      },
      {
        title: 'Privacy Mode & SOC 2 Compliance',
        description: 'Zero-data retention options ensuring your proprietary company source code is never stored or used for model training.',
        tag: 'Security & Enterprise'
      }
    ],
    useCases: [
      {
        title: 'Rapid Prototyping & MVP Building',
        description: 'Build end-to-end full-stack applications in hours by prompting architectural changes and generating database schemas.',
        audience: 'Solo Founders & Builders'
      },
      {
        title: 'Legacy Code Refactoring & Migration',
        description: 'Translate legacy codebases (e.g. JavaScript to TypeScript, or React Class components to modern Hooks) safely with diff inspections.',
        audience: 'Enterprise Engineering Teams'
      },
      {
        title: 'Instant Bug Diagnosis & Root Cause Analysis',
        description: 'Paste runtime stack traces or failing test cases to instantly locate problematic logic and generate verified patches.',
        audience: 'DevOps & Maintenance'
      }
    ],
    keyHighlights: [
      { label: 'Category', value: 'AI Code Editor' },
      { label: 'Base Architecture', value: 'VS Code Fork' },
      { label: 'Top AI Models', value: 'Claude 3.5 Sonnet, GPT-4o' },
      { label: 'Security Standard', value: 'SOC 2 Type II Certified' }
    ],
    bidHistory: [
      {
        id: 'bh-1',
        amount: 250,
        newTotal: 1420,
        bidderName: 'Aman S.',
        bidderHandle: '@aman_builds',
        note: 'Reclaiming the #1 spot permanently.',
        timestamp: Date.now() - 1000 * 60 * 12,
        previousRank: 2,
        newRank: 1,
      },
      {
        id: 'bh-2',
        amount: 400,
        newTotal: 1170,
        bidderName: 'DevRel Chief',
        bidderHandle: '@devrel_hq',
        timestamp: Date.now() - 86400000 * 3,
        previousRank: 1,
        newRank: 1,
      },
      {
        id: 'bh-3',
        amount: 770,
        newTotal: 770,
        bidderName: 'Early Backer',
        timestamp: Date.now() - 86400000 * 15,
        newRank: 1,
      }
    ]
  },
  {
    id: 'prod-2',
    rank: 2,
    previousRank: 1,
    name: 'v0.dev',
    tagline: 'Generative UI system by Vercel for building React components',
    url: 'https://v0.dev',
    logoUrl: 'https://www.google.com/s2/favicons?domain=v0.dev&sz=128',
    twitterHandle: '@v0',
    category: 'AI Tools',
    totalBid: 1350,
    clicks: 14920,
    createdAt: Date.now() - 86400000 * 28,
    updatedAt: Date.now() - 1000 * 60 * 45,
    verified: true,
    featuredQuote: 'From prompt to production in seconds',
    description: 'v0 by Vercel is a generative user interface platform powered by AI that creates clean, accessible, modern React components, complete dashboards, and full applications using Tailwind CSS and shadcn/ui. Users can iterate on layouts conversationally, preview rendered output in real-time, and copy production-ready code directly into their Next.js repositories with the Vercel CLI.',
    targetAudience: 'Frontend developers, product designers, full-stack builders, and founders.',
    pricingModel: 'Freemium (Free tier + $20/mo Premium credits)',
    whatItDoes: [
      'Prompt-to-React Generation: Converts natural language descriptions and wireframe sketches into clean React component trees.',
      'Tailwind CSS & shadcn/ui Standards: Generates standard-compliant design code that directly integrates with modern design systems without lock-in.',
      'Visual Canvas & Live Preview: Inspect UI states, test responsiveness across mobile/desktop viewports, and edit styles interactively.',
      'CLI Direct Installation: Run `npx v0 add <id>` to instantly inject generated components directly into your local project codebase.',
      'Design Token Synchronizer: Adapts colors, typography scales, and border radii to match your existing brand theme.'
    ],
    features: [
      {
        title: 'Interactive Visual Sandbox',
        description: 'Instant sandbox rendering with hot reload, responsive device toggles, and live interactive state inspection.',
        tag: 'Prototyping'
      },
      {
        title: 'shadcn/ui Native Integration',
        description: 'Built-in primitives using Radix UI headless components styled with Tailwind CSS for perfect WCAG AA compliance.',
        tag: 'Design System'
      },
      {
        title: 'Figma & Screenshot Vision Import',
        description: 'Upload screenshots of existing websites or design specs to produce pixel-matched responsive React code.',
        tag: 'Vision AI'
      },
      {
        title: 'One-Click Vercel Deployment',
        description: 'Deploy prototypes directly to a live public URL on Vercel with a single click to share with clients or team members.',
        tag: 'Deployment'
      }
    ],
    useCases: [
      {
        title: 'Building Landing Pages & Marketing Funnels',
        description: 'Generate high-converting hero sections, pricing matrices, testimonials, and feature grids in minutes.',
        audience: 'Marketers & Growth Engineers'
      },
      {
        title: 'Complex SaaS Analytics Dashboards',
        description: 'Create multi-view dashboards with charts, data tables, metrics cards, and filters ready for backend API hooks.',
        audience: 'SaaS Founders'
      },
      {
        title: 'Design-to-Code Handoff Acceleration',
        description: 'Eliminate tedious UI boilerplate creation during sprints so engineers can focus purely on business logic.',
        audience: 'Product Engineering Teams'
      }
    ],
    keyHighlights: [
      { label: 'Created By', value: 'Vercel' },
      { label: 'Stack Output', value: 'React, Next.js, Tailwind CSS' },
      { label: 'Component Lib', value: 'shadcn/ui & Radix UI' },
      { label: 'CLI Tool', value: 'npx v0' }
    ],
    bidHistory: [
      {
        id: 'bh-4',
        amount: 300,
        newTotal: 1350,
        bidderName: 'Guillermo Fan',
        bidderHandle: '@vercel_fanatic',
        note: 'Pushing v0 right back into contention.',
        timestamp: Date.now() - 1000 * 60 * 45,
        previousRank: 2,
        newRank: 2,
      },
      {
        id: 'bh-5',
        amount: 1050,
        newTotal: 1050,
        bidderName: 'Vercel Army',
        timestamp: Date.now() - 86400000 * 10,
        newRank: 1,
      }
    ]
  },
  {
    id: 'prod-3',
    rank: 3,
    previousRank: 4,
    name: 'Raycast',
    tagline: 'An extendable launcher made for ultra-fast productivity',
    url: 'https://raycast.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=raycast.com&sz=128',
    twitterHandle: '@raycastapp',
    category: 'Productivity',
    totalBid: 980,
    clicks: 11200,
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 1000 * 60 * 140,
    verified: true,
    description: 'Raycast is a blazingly fast, extensible desktop launcher for macOS and Windows that consolidates your daily workflow. It replaces default system search with an ecosystem of thousands of community extensions, AI assistant prompts, clipboard history, window management, snippet expansion, and direct integration with tools like GitHub, Linear, Jira, and Slack.',
    targetAudience: 'Product designers, software engineers, knowledge workers, and keyboard power users.',
    pricingModel: 'Free forever for core features + $8/mo Pro for Raycast AI',
    whatItDoes: [
      'Universal Command Palette: Access files, apps, system controls, and web bookmarks in sub-millisecond keystrokes.',
      'Extensible Store Ecosystem: Install open-source extensions built with TypeScript and React by the global developer community.',
      'Raycast AI Assistant: Ask questions, translate text, write code, and summarize clipboard items without leaving your current app.',
      'Persistent Clipboard History: Search and pin text, images, code snippets, and hex colors with automatic sensitive data detection.',
      'Tile Window Management: Snap and arrange desktop windows with clean customizable keyboard shortcuts.'
    ],
    features: [
      {
        title: 'Open Extension API',
        description: 'Build custom extensions in React, Node.js, and TypeScript with full access to native UI components.',
        tag: 'Ecosystem'
      },
      {
        title: 'Quick AI Commands',
        description: 'Execute custom system-wide AI macros such as explaining selected code, fixing grammar, or drafting replies.',
        tag: 'Raycast AI'
      },
      {
        title: 'Snippet Expander',
        description: 'Dynamic text replacement with variables, timestamps, and cursor positioning to speed up repetitive typing.',
        tag: 'Speed'
      },
      {
        title: 'Team Sync & Organization Vaults',
        description: 'Share extensions, snippets, and quick links across your entire company seamlessly.',
        tag: 'Collaboration'
      }
    ],
    useCases: [
      {
        title: 'Keyboard-First Workflows',
        description: 'Control everything from Spotify playback to pulling GitHub PRs and creating Linear issues without touching the mouse.',
        audience: 'Software Engineers'
      },
      {
        title: 'Meeting & Calendar Quick Joins',
        description: 'View your daily schedule in the menu bar and join Google Meet / Zoom calls with a single keypress.',
        audience: 'Remote Teams & Managers'
      }
    ],
    keyHighlights: [
      { label: 'Platform', value: 'macOS & Windows' },
      { label: 'Extensions Count', value: '1,500+ Public Plugins' },
      { label: 'Framework', value: 'React + TypeScript' },
      { label: 'Performance', value: '<5ms response time' }
    ],
    bidHistory: [
      {
        id: 'bh-6',
        amount: 280,
        newTotal: 980,
        bidderName: 'Thomas P.',
        bidderHandle: '@thomaspaul',
        note: 'Speed is everything.',
        timestamp: Date.now() - 1000 * 60 * 140,
        previousRank: 4,
        newRank: 3,
      },
      {
        id: 'bh-7',
        amount: 700,
        newTotal: 700,
        bidderName: 'Extension Dev',
        timestamp: Date.now() - 86400000 * 8,
        newRank: 3,
      }
    ]
  },
  {
    id: 'prod-4',
    rank: 4,
    previousRank: 3,
    name: 'Linear',
    tagline: 'The issue tracking tool you will actually enjoy using',
    url: 'https://linear.app',
    logoUrl: 'https://www.google.com/s2/favicons?domain=linear.app&sz=128',
    twitterHandle: '@linear',
    category: 'Productivity',
    totalBid: 920,
    clicks: 9840,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 1000 * 60 * 220,
    verified: true,
    description: 'Linear is the purpose-built project and issue management tool designed for modern high-performance product teams. Engineered with extreme attention to aesthetic craft, sub-50ms latency, and keyboard-first shortcuts, Linear streamlines sprints, roadmaps, customer support triage, and automated GitHub/GitLab pull request workflows.',
    targetAudience: 'Product managers, startup founders, agile teams, and modern engineering organizations.',
    pricingModel: 'Free tier for up to 250 issues + $8/user/mo Standard + Enterprise',
    whatItDoes: [
      'Linear Method Sprints & Cycles: Automated agile planning with uninterrupted velocity tracking and burndown insights.',
      'Instant Keyboard Navigation: Create, assign, prioritize, and filter hundreds of issues in milliseconds with global shortcuts.',
      'Bidirectional Git Automation: Automatically transition issue states when PRs are opened, reviewed, merged, or reverted.',
      'Customer Requests & Triage Inbox: Connect customer feedback from Zendesk, Intercom, and Slack into actionable backlog items.',
      'Interactive Roadmaps & Project Milestones: High-level visual timelines that keep executive stakeholders and engineers aligned.'
    ],
    features: [
      {
        title: 'Offline-First Synchronization',
        description: 'Work seamlessly on airplanes or poor WiFi connections; all changes sync instantly upon reconnecting.',
        tag: 'Architecture'
      },
      {
        title: 'Linear Asks & Slack Integration',
        description: 'Turn any Slack message or support ticket directly into a prioritized Linear issue without leaving chat.',
        tag: 'Integrations'
      },
      {
        title: 'Custom Workflows & Sub-Issues',
        description: 'Define multi-tiered project hierarchies, custom statuses, and automated SLA rules for bug tracking.',
        tag: 'Flexibility'
      }
    ],
    useCases: [
      {
        title: 'Startup Product Sprints',
        description: 'Ship weekly release cycles with automated tracking and zero bureaucratic project overhead.',
        audience: 'Early Stage Startups'
      },
      {
        title: 'Engineering Bug Triage',
        description: 'Capture stack traces, repro steps, and assign engineers with automated SLAs and PR links.',
        audience: 'Engineering Teams'
      }
    ],
    keyHighlights: [
      { label: 'Design Philosophy', value: 'Craft & Speed First' },
      { label: 'Sync Engine', value: 'Local-First Architecture' },
      { label: 'VCS Support', value: 'GitHub, GitLab, Bitbucket' }
    ],
    bidHistory: [
      {
        id: 'bh-8',
        amount: 920,
        newTotal: 920,
        bidderName: 'Karri Saarinen',
        note: 'Craft and precision over everything.',
        timestamp: Date.now() - 1000 * 60 * 220,
        newRank: 3,
      }
    ]
  },
  {
    id: 'prod-5',
    rank: 5,
    previousRank: 6,
    name: 'Supabase',
    tagline: 'The open source Firebase alternative with PostgreSQL & Auth',
    url: 'https://supabase.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=supabase.com&sz=128',
    twitterHandle: '@supabase',
    category: 'Developer Tools',
    totalBid: 780,
    clicks: 8640,
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 1000 * 60 * 310,
    verified: true,
    description: 'Supabase is an open-source Firebase alternative that gives developers a complete PostgreSQL backend suite in seconds. It provides relational database scalability, user authentication with Row Level Security (RLS), instant REST and GraphQL APIs, real-time WebSocket subscriptions, vector embeddings with pgvector for AI, and scalable file storage.',
    targetAudience: 'Full-stack developers, mobile app developers, AI builders, and enterprise architects.',
    pricingModel: 'Free tier with 2 free projects + $25/mo Pro + Enterprise',
    whatItDoes: [
      'Dedicated PostgreSQL Database: Every project gets a full, dedicated PostgreSQL instance with extensions like PostGIS and pgvector.',
      'User Authentication & RBAC: Built-in OAuth providers (Google, GitHub, Apple), magic links, SMS logins, and Row Level Security.',
      'Auto-Generated APIs: Instant CRUD endpoints with TypeScript types generated directly from your database schema.',
      'Realtime Subscriptions: Listen to database changes over WebSockets for live collaborative feeds, chats, and multiplayer apps.',
      'Edge Functions & File Storage: Serverless Deno functions deployed globally with integrated CDN media asset storage.'
    ],
    features: [
      {
        title: 'pgvector AI Embeddings',
        description: 'Store vector embeddings directly alongside your relational business data for lightning-fast semantic search.',
        tag: 'AI Infrastructure'
      },
      {
        title: 'Row Level Security (RLS)',
        description: 'Protect sensitive user records directly at the database engine layer with standard SQL security policies.',
        tag: 'Security'
      },
      {
        title: 'Zero Vendor Lock-in',
        description: '100% open source; self-host via Docker or deploy to the managed global cloud infrastructure.',
        tag: 'Open Source'
      }
    ],
    useCases: [
      {
        title: 'AI RAG & Vector Applications',
        description: 'Store document chunks, generate embeddings, and execute hybrid cosine similarity searches at scale.',
        audience: 'AI Engineers'
      },
      {
        title: 'Mobile & Web App Backends',
        description: 'Ship mobile apps in days with React Native / Flutter SDKs handling auth, storage, and real-time syncing.',
        audience: 'Full-stack Developers'
      }
    ],
    keyHighlights: [
      { label: 'Database Engine', value: 'PostgreSQL' },
      { label: 'License', value: 'Apache 2.0 Open Source' },
      { label: 'AI Support', value: 'Native pgvector' },
      { label: 'Global Latency', value: '<50ms via Edge' }
    ],
    bidHistory: [
      {
        id: 'bh-9',
        amount: 180,
        newTotal: 780,
        bidderName: 'Kiwi Postgres Fan',
        timestamp: Date.now() - 1000 * 60 * 310,
        previousRank: 6,
        newRank: 5,
      },
      {
        id: 'bh-10',
        amount: 600,
        newTotal: 600,
        bidderName: 'Ant Wilson',
        timestamp: Date.now() - 86400000 * 5,
        newRank: 5,
      }
    ]
  },
  {
    id: 'prod-6',
    rank: 6,
    previousRank: 5,
    name: 'Lovable',
    tagline: 'Fullstack autonomous software engineering with human collaboration',
    url: 'https://lovable.dev',
    logoUrl: 'https://www.google.com/s2/favicons?domain=lovable.dev&sz=128',
    twitterHandle: '@Lovable_dev',
    category: 'AI Tools',
    totalBid: 740,
    clicks: 7210,
    createdAt: Date.now() - 86400000 * 16,
    updatedAt: Date.now() - 1000 * 60 * 420,
    verified: true,
    description: 'Lovable is an autonomous fullstack AI software engineer that turns ideas, Figma files, and prompt descriptions into fully functioning web applications with React, Supabase databases, authentication, and payment integrations. It writes production code, iterates based on visual chat feedback, and deploys to production automatically.',
    targetAudience: 'Indie makers, non-technical founders, product managers, and rapid prototypers.',
    pricingModel: 'Freemium with monthly builder credit plans',
    whatItDoes: [
      'Full-Stack App Generation: Generates frontend UI, database schemas, backend tables, and authentication in one flow.',
      'Natural Language Modification: Chat with the AI engineer to tweak layout, add payment flows, or implement complex algorithms.',
      'Supabase Native Integration: Auto-provisions database tables, handles user authorization, and sets up cloud storage.',
      'GitHub Export & Sync: Push clean TypeScript code directly to your GitHub repository with zero proprietary lock-in.'
    ],
    features: [
      {
        title: 'Autonomous Code Architect',
        description: 'Understands full-stack software architecture principles, writing robust modular React components and database policies.',
        tag: 'Agent'
      },
      {
        title: 'One-Click Live Publishing',
        description: 'Instant SSL hosting and custom domain connection so your customers can start using your product immediately.',
        tag: 'Hosting'
      }
    ],
    useCases: [
      {
        title: 'Launching Micro-SaaS Startups',
        description: 'Go from an idea sketch on Friday to a launched, paying customer web app by Sunday evening.',
        audience: 'Indie Hackers'
      }
    ],
    keyHighlights: [
      { label: 'Output Code', value: 'React + TypeScript' },
      { label: 'Database Partner', value: 'Supabase' },
      { label: 'Hosting', value: 'Instant Cloud Edge' }
    ],
    bidHistory: [
      {
        id: 'bh-11',
        amount: 740,
        newTotal: 740,
        bidderName: 'Anton O.',
        note: 'Building the next evolution of product creation.',
        timestamp: Date.now() - 1000 * 60 * 420,
        newRank: 5,
      }
    ]
  },
  {
    id: 'prod-7',
    rank: 7,
    previousRank: 7,
    name: 'PostHog',
    tagline: 'Open-source product analytics, session recording, feature flags and surveys',
    url: 'https://posthog.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=posthog.com&sz=128',
    twitterHandle: '@PostHog',
    category: 'SaaS & Indie',
    totalBid: 560,
    clicks: 5390,
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 1000 * 60 * 540,
    verified: true,
    description: 'PostHog is the all-in-one open-source product analytics and developer platform. Rather than stitching together Mixpanel, LaunchDarkly, Hotjar, and Datadog, PostHog combines event tracking, session replays, feature flags, A/B testing experiments, user surveys, and data warehouse synchronization into a single unified dashboard.',
    targetAudience: 'Product managers, growth engineers, CTOs, and dev teams.',
    pricingModel: 'Generous free tier (1M events/mo free) + usage-based billing',
    whatItDoes: [
      'Event Auto-Capture & Analytics: Track user page views, clicks, conversions, and retention funnels with zero manual tracking tags.',
      'Session Replays with Console Logs: Watch exact video recordings of how users interact with your app alongside network requests.',
      'Feature Flags & Multivariate Testing: Safely roll out new features to cohorts and measure statistical conversion uplift.',
      'In-App User Surveys: Trigger targeted micro-surveys and NPS questionnaires based on user actions.'
    ],
    features: [
      {
        title: 'Single Platform Integration',
        description: 'Replace 5+ disparate SaaS subscriptions with one lightweight JS snippet or mobile SDK.',
        tag: 'Cost Efficiency'
      },
      {
        title: 'SQL-Based HogQL Queries',
        description: 'Query raw events directly using direct ClickHouse SQL syntax inside custom dashboards.',
        tag: 'Power Users'
      }
    ],
    useCases: [
      {
        title: 'Debugging Onboarding Drop-offs',
        description: 'Identify where users get stuck during sign-up using session replay filters and conversion funnel breakdowns.',
        audience: 'Growth & UX Designers'
      }
    ],
    keyHighlights: [
      { label: 'Database', value: 'ClickHouse' },
      { label: 'Free Tier', value: '1 Million Events/mo' },
      { label: 'Deployment', value: 'Cloud & Self-Hosted' }
    ],
    bidHistory: [
      {
        id: 'bh-12',
        amount: 560,
        newTotal: 560,
        bidderName: 'Hedgehog Fanatic',
        timestamp: Date.now() - 1000 * 60 * 540,
        newRank: 7,
      }
    ]
  },
  {
    id: 'prod-8',
    rank: 8,
    previousRank: 8,
    name: 'shadcn/ui',
    tagline: 'Beautifully designed components that you can copy and paste into your apps',
    url: 'https://ui.shadcn.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=ui.shadcn.com&sz=128',
    twitterHandle: '@shadcn',
    category: 'Design & UI',
    totalBid: 490,
    clicks: 16800,
    createdAt: Date.now() - 86400000 * 22,
    updatedAt: Date.now() - 1000 * 60 * 620,
    verified: true,
    description: 'shadcn/ui revolutionized frontend design by providing accessible, customizable React components that you copy and paste directly into your codebase rather than installing as an immutable npm dependency. Built on top of Radix UI primitives and styled with Tailwind CSS, developers have 100% control over the markup, styles, and animation behaviors.',
    targetAudience: 'Frontend developers, design systems engineers, and React builders.',
    pricingModel: '100% Free & Open Source (MIT License)',
    whatItDoes: [
      'Copy-Paste Architecture: You own the component code in your src/components directory, allowing seamless modifications.',
      'Radix UI Primitives: Fully keyboard accessible, screen-reader tested, and WCAG AA compliant out of the box.',
      'Tailwind CSS Styling: Beautiful default theme tokens with light/dark mode support and simple CSS variable customization.',
      'CLI Scaffolding: Run `npx shadcn@latest add button dialog sheet` to scaffold files instantly.'
    ],
    features: [
      {
        title: 'Zero Runtime Overhead',
        description: 'No bloated monolithic npm package; compile only the exact primitives you use in your application.',
        tag: 'Performance'
      },
      {
        title: 'Theme & Token Generator',
        description: 'Generate customized color palettes, border radius presets, and fonts with immediate preview.',
        tag: 'Customization'
      }
    ],
    useCases: [
      {
        title: 'Modern SaaS App Scaffolding',
        description: 'Create production-grade modals, popovers, dropdowns, calendars, and command palettes in seconds.',
        audience: 'Full-Stack Developers'
      }
    ],
    keyHighlights: [
      { label: 'License', value: 'MIT Open Source' },
      { label: 'Foundations', value: 'Radix UI & Tailwind CSS' },
      { label: 'Frameworks', value: 'Next.js, Vite, Remix, Astro' }
    ],
    bidHistory: [
      {
        id: 'bh-13',
        amount: 490,
        newTotal: 490,
        bidderName: 'Open Source Community',
        timestamp: Date.now() - 1000 * 60 * 620,
        newRank: 8,
      }
    ]
  },
  {
    id: 'prod-9',
    rank: 9,
    previousRank: 10,
    name: 'Tailwind CSS v4',
    tagline: 'A utility-first CSS framework packed with classes like flex, pt-4, and text-center',
    url: 'https://tailwindcss.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=128',
    twitterHandle: '@tailwindcss',
    category: 'Developer Tools',
    totalBid: 430,
    clicks: 6420,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 1000 * 60 * 700,
    verified: true,
    description: 'Tailwind CSS v4 is a groundbreaking rewrite of the world’s most popular utility-first CSS framework. Engineered in Rust with the Oxide engine, it is up to 10x faster, requires zero configuration files by default, natively supports modern CSS features like cascade layers and container queries, and integrates seamlessly via pure `@import "tailwindcss";`.',
    targetAudience: 'Web designers, software engineers, UI/UX developers, and web development agencies.',
    pricingModel: '100% Free & Open Source',
    whatItDoes: [
      'Oxide High-Speed Engine: Rust-powered engine compiling utility classes in microseconds with near-zero memory footprint.',
      'CSS-First Configuration: Configure fonts, custom themes, and colors directly inside CSS variables without tailwind.config.js.',
      'Native Container Queries & 3D Transforms: Support for `@container`, subgrid, and modern browser layout specifications.',
      'Automatic Source Detection: Discovers and scans template files automatically without complex content glob arrays.'
    ],
    features: [
      {
        title: '10x Faster Build Times',
        description: 'Compiled with native Rust for instant HMR refreshes across massive production projects.',
        tag: 'Speed'
      }
    ],
    useCases: [
      {
        title: 'Design-System Scalability',
        description: 'Standardize spacing, typography scales, and responsive variants across large multi-team web applications.',
        audience: 'Web Developers'
      }
    ],
    keyHighlights: [
      { label: 'Engine', value: 'Rust Oxide' },
      { label: 'Setup', value: 'Zero Config Required' },
      { label: 'Compatibility', value: 'Modern CSS 2026+' }
    ],
    bidHistory: [
      {
        id: 'bh-14',
        amount: 430,
        newTotal: 430,
        bidderName: 'Adam Wathan Supporter',
        timestamp: Date.now() - 1000 * 60 * 700,
        newRank: 9,
      }
    ]
  },
  {
    id: 'prod-10',
    rank: 10,
    previousRank: 9,
    name: 'Perplexity AI',
    tagline: 'Where knowledge begins. An interactive conversational answer engine with citations',
    url: 'https://perplexity.ai',
    logoUrl: 'https://www.google.com/s2/favicons?domain=perplexity.ai&sz=128',
    twitterHandle: '@perplexity_ai',
    category: 'AI Tools',
    totalBid: 390,
    clicks: 9100,
    createdAt: Date.now() - 86400000 * 11,
    updatedAt: Date.now() - 1000 * 60 * 820,
    verified: true,
    description: 'Perplexity AI is a conversational search and discovery engine that replaces traditional list-of-links search with synthesized, factual answers backed by verifiable live web citations. With Pro Search, Pages research synthesis, and multimodal attachments, users get comprehensive answers to complex questions in seconds.',
    targetAudience: 'Researchers, journalists, students, founders, and knowledge seekers.',
    pricingModel: 'Free tier + $20/mo Pro subscription',
    whatItDoes: [
      'Grounded Citation Answers: Queries the live internet and synthesizes answers with clickable direct source citations.',
      'Pro Guided Search: Performs multi-step reasoning, asks clarifying questions, and aggregates data from dozens of academic and news databases.',
      'Perplexity Pages: Turns deep research threads into beautifully structured, shareable web articles and knowledge guides.',
      'File Analysis & Multimodal: Upload PDFs, spreadsheets, and images for instant summarization and data extraction.'
    ],
    features: [
      {
        title: 'Multi-Model Selection',
        description: 'Toggle between Claude 3.5 Sonnet, GPT-4o, Sonar, and open-source models for customized reasoning.',
        tag: 'Model Choice'
      }
    ],
    useCases: [
      {
        title: 'Academic & Market Research',
        description: 'Conduct comprehensive competitive analysis and literature reviews in minutes with cited sources.',
        audience: 'Researchers & Analysts'
      }
    ],
    keyHighlights: [
      { label: 'Type', value: 'Conversational Answer Engine' },
      { label: 'Accuracy', value: 'Real-time Live Citations' }
    ],
    bidHistory: [
      {
        id: 'bh-15',
        amount: 390,
        newTotal: 390,
        bidderName: 'Aravind S.',
        timestamp: Date.now() - 1000 * 60 * 820,
        newRank: 10,
      }
    ]
  },
  {
    id: 'prod-11',
    rank: 11,
    previousRank: 11,
    name: 'Cal.com',
    tagline: 'Scheduling infrastructure for everyone. Open source and customizable.',
    url: 'https://cal.com',
    logoUrl: 'https://www.google.com/s2/favicons?domain=cal.com&sz=128',
    twitterHandle: '@calcom',
    category: 'Productivity',
    totalBid: 310,
    clicks: 3420,
    createdAt: Date.now() - 86400000 * 9,
    updatedAt: Date.now() - 1000 * 60 * 900,
    verified: true,
    description: 'Cal.com is the open-source scheduling infrastructure platform that connects personal, team, and enterprise calendars. From booking links to routing forms, round-robin team dispatch, payment collection via Stripe, and white-labeled embed APIs, Cal.com lets you manage bookings on your own terms.',
    targetAudience: 'Consultants, sales teams, medical practices, recruiting agencies, and software developers.',
    pricingModel: 'Free forever for individuals + $12/user/mo Teams',
    whatItDoes: [
      'Universal Calendar Sync: Connect Google Calendar, Outlook, Apple Calendar, and CalDAV simultaneously to prevent double bookings.',
      'Routing Forms & Lead Qualification: Qualify prospects with custom form questions before routing them to the right team member.',
      'Built-in Payments: Collect deposits or hourly consultation fees upfront using Stripe integration.',
      'Embeddable SDK: Embed booking modals or inline scheduling widgets directly into your React, Vue, or HTML app.'
    ],
    features: [
      {
        title: 'Open Source & Self-Hostable',
        description: 'Complete data ownership and privacy compliance with enterprise-ready Docker and Kubernetes templates.',
        tag: 'Privacy'
      }
    ],
    useCases: [
      {
        title: 'Sales Demo Booking',
        description: 'Qualify inbound website visitors and book demos instantly into sales rep calendars.',
        audience: 'B2B Sales Teams'
      }
    ],
    keyHighlights: [
      { label: 'License', value: 'Open Source (AGPLv3)' },
      { label: 'Integrations', value: 'Zoom, Meet, Stripe, Salesforce' }
    ],
    bidHistory: [
      {
        id: 'bh-16',
        amount: 310,
        newTotal: 310,
        bidderName: 'Peer Richelsen',
        timestamp: Date.now() - 1000 * 60 * 900,
        newRank: 11,
      }
    ]
  },
  {
    id: 'prod-12',
    rank: 12,
    previousRank: 12,
    name: 'Dub.co',
    tagline: 'Open-source link management infrastructure for modern marketing teams',
    url: 'https://dub.co',
    logoUrl: 'https://www.google.com/s2/favicons?domain=dub.co&sz=128',
    twitterHandle: '@dubdotco',
    category: 'SaaS & Indie',
    totalBid: 260,
    clicks: 4210,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 1000 * 60 * 1050,
    verified: true,
    description: 'Dub.co is the modern open-source link management platform for marketing, creator, and engineering teams. It offers custom short domains, detailed geo/device analytics, dynamic QR codes, password-protected links, programmatic link generation API, and conversion tracking.',
    targetAudience: 'Growth marketers, content creators, affiliate managers, and SaaS founders.',
    pricingModel: 'Free tier with up to 3 custom domains + $24/mo Pro',
    whatItDoes: [
      'Custom Branded Short Links: Shorten URLs using your own company domain name (e.g. brand.link/deal).',
      'Granular Click Analytics: Track clicks by country, city, referrer, device, browser, and UTM campaigns in real time.',
      'Programmatic Link API: Generate millions of customized referral and campaign links with sub-50ms API latency.',
      'Dynamic QR Code Generator: Create customizable SVG QR codes with logo overlays for physical and digital campaigns.'
    ],
    features: [
      {
        title: 'Edge-Redirect Engine',
        description: 'Sub-10ms redirect speeds powered by global Cloudflare edge caching.',
        tag: 'Speed'
      }
    ],
    useCases: [
      {
        title: 'Influencer & Affiliate Tracking',
        description: 'Assign unique trackable links to creators and monitor conversion return on ad spend (ROAS).',
        audience: 'Marketing Teams'
      }
    ],
    keyHighlights: [
      { label: 'Edge Latency', value: '<10ms' },
      { label: 'Custom Domains', value: 'Unlimited' },
      { label: 'API SDK', value: 'TypeScript, Python' }
    ],
    bidHistory: [
      {
        id: 'bh-17',
        amount: 260,
        newTotal: 260,
        bidderName: 'Steven Tey',
        timestamp: Date.now() - 1000 * 60 * 1050,
        newRank: 12,
      }
    ]
  }
];

export const MOCK_RIVAL_BIDDERS = [
  { name: 'Alex Rivera', handle: '@alex_builds', products: ['v0.dev', 'Cursor', 'Lovable'] },
  { name: 'Sarah Chen', handle: '@sarahcodes', products: ['Raycast', 'Linear', 'PostHog'] },
  { name: 'CryptoWhale.eth', handle: '@whale_alpha', products: ['Cursor', 'Tailwind CSS v4'] },
  { name: 'Indie Hacker 99', handle: '@indiehacker99', products: ['Dub.co', 'Cal.com', 'Supabase'] },
  { name: 'Sammy Tech', handle: '@sammy_ai', products: ['Perplexity AI', 'v0.dev'] }
];
