export interface CuratedRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  category: RepoCategory;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export type RepoCategory =
  | 'All'
  | 'SaaS Starters'
  | 'Auth & Identity'
  | 'Databases'
  | 'AI & ML'
  | 'DevOps & Infra'
  | 'UI Components'
  | 'CMS & Content'
  | 'Payments & Billing'
  | 'Analytics'
  | 'Email & Communication'
  | 'Deployment'
  | 'Mobile'
  | 'API & Backend'
  | 'Monitoring'
  | 'Forms & Surveys'
  | 'Search'
  | 'File Storage'
  | 'Design & UI';

let idCounter = 0;
const repo = (
  name: string,
  full_name: string,
  description: string,
  url: string,
  stars: number,
  forks: number,
  language: string | null,
  category: RepoCategory,
  ownerLogin: string,
  ownerAvatar: string,
): CuratedRepo => ({
  id: ++idCounter,
  name,
  full_name,
  description,
  html_url: url,
  stargazers_count: stars,
  forks_count: forks,
  language,
  category,
  owner: { login: ownerLogin, avatar_url: ownerAvatar },
});

const av = (login: string) => `https://avatars.githubusercontent.com/${login}`;

// All star/fork counts verified against GitHub on August 21, 2026
export const CURATED_REPOS: CuratedRepo[] = [
  // ── SaaS Starters ──
  repo('Next-js-Boilerplate', 'ixartz/Next-js-Boilerplate', '🚀🎉📚 Nextjs Boilerplate and Starter with App Router and Page Router support, Tailwind CSS 4 and TypeScript', 'https://github.com/ixartz/Next-js-Boilerplate', 13050, 2406, 'TypeScript', 'SaaS Starters', 'ixartz', av('ixartz')),
  repo('cal.com', 'calcom/cal.com', 'Scheduling infrastructure for everyone', 'https://github.com/calcom/cal.com', 47836, 14888, 'TypeScript', 'SaaS Starters', 'calcom', av('calcom')),
  repo('saasfly', 'nextify-limited/saasfly', 'Your Next SaaS Template or Boilerplate!', 'https://github.com/nextify-limited/saasfly', 2894, 416, 'TypeScript', 'SaaS Starters', 'nextify-limited', av('nextify-limited')),
  repo('next-saas-stripe-starter', 'mickasmt/next-saas-stripe-starter', 'Open-source SaaS Starter with User Roles & Admin Panel', 'https://github.com/mickasmt/next-saas-stripe-starter', 3001, 631, 'TypeScript', 'SaaS Starters', 'mickasmt', av('mickasmt')),
  repo('medusa', 'medusajs/medusa', 'The world\'s most flexible commerce platform for agents and developers', 'https://github.com/medusajs/medusa', 35926, 5114, 'TypeScript', 'SaaS Starters', 'medusajs', av('medusajs')),
  repo('documenso', 'documenso/documenso', 'The Open Source DocuSign Alternative', 'https://github.com/documenso/documenso', 14640, 3097, 'TypeScript', 'SaaS Starters', 'documenso', av('documenso')),
  repo('budibase', 'Budibase/budibase', 'AI agents, automations and apps that run your operations', 'https://github.com/Budibase/budibase', 28227, 2195, 'TypeScript', 'SaaS Starters', 'Budibase', av('Budibase')),
  repo('twenty', 'twentyhq/twenty', 'The modern open source CRM', 'https://github.com/twentyhq/twenty', 55211, 8611, 'TypeScript', 'SaaS Starters', 'twentyhq', av('twentyhq')),
  repo('appsmith', 'appsmithorg/appsmith', 'Low code project to build admin panels, internal tools, and dashboards', 'https://github.com/appsmithorg/appsmith', 40713, 4732, 'TypeScript', 'SaaS Starters', 'appsmithorg', av('appsmithorg')),

  // ── Auth & Identity ──
  repo('next-auth', 'nextauthjs/next-auth', 'Authentication for the Web', 'https://github.com/nextauthjs/next-auth', 28331, 4042, 'TypeScript', 'Auth & Identity', 'nextauthjs', av('nextauthjs')),
  repo('supabase-auth-helpers', 'supabase/auth-helpers', 'Subscription Auth Helpers for Supabase', 'https://github.com/supabase/auth-helpers', 898, 215, 'TypeScript', 'Auth & Identity', 'supabase', av('supabase')),
  repo('logto', 'logto-io/logto', '🧑‍🚀 The better auth and identity infrastructure for SaaS', 'https://github.com/logto-io/logto', 14403, 1172, 'TypeScript', 'Auth & Identity', 'logto-io', av('logto-io')),
  repo('keycloak', 'keycloak/keycloak', 'Open Source Identity and Access Management', 'https://github.com/keycloak/keycloak', 36315, 8829, 'Java', 'Auth & Identity', 'keycloak', av('keycloak')),
  repo('Lucia', 'lucia-auth/lucia', 'Authentication, simple and clean', 'https://github.com/lucia-auth/lucia', 10449, 519, 'TypeScript', 'Auth & Identity', 'lucia-auth', av('lucia-auth')),
  repo('clerk-js', 'clerk/javascript', 'Official Clerk JavaScript SDKs', 'https://github.com/clerk/javascript', 1737, 468, 'TypeScript', 'Auth & Identity', 'clerk', av('clerk')),
  repo('zitadel', 'zitadel/zitadel', 'Best of Open Source IAM and Access Mgmt', 'https://github.com/zitadel/zitadel', 14804, 1241, 'Go', 'Auth & Identity', 'zitadel', av('zitadel')),

  // ── Databases ──
  repo('supabase', 'supabase/supabase', 'The open source Firebase alternative', 'https://github.com/supabase/supabase', 108221, 13592, 'TypeScript', 'Databases', 'supabase', av('supabase')),
  repo('pocketbase', 'pocketbase/pocketbase', 'Open Source backend in 1 file', 'https://github.com/pocketbase/pocketbase', 60746, 3655, 'Go', 'Databases', 'pocketbase', av('pocketbase')),
  repo('n8n', 'n8n-io/n8n', 'Free and open fair-code licensed automation tool', 'https://github.com/n8n-io/n8n', 201396, 60252, 'TypeScript', 'Databases', 'n8n-io', av('n8n-io')),
  repo('appwrite', 'appwrite/appwrite', 'Your backend, reimagined', 'https://github.com/appwrite/appwrite', 57066, 5660, 'TypeScript', 'Databases', 'appwrite', av('appwrite')),
  repo('directus', 'directus/directus', 'The Modern Data Stack', 'https://github.com/directus/directus', 37461, 4899, 'TypeScript', 'Databases', 'directus', av('directus')),
  repo('strapi', 'strapi/strapi', '🚀 Strapi is the leading open-source headless CMS', 'https://github.com/strapi/strapi', 72982, 9847, 'JavaScript', 'Databases', 'strapi', av('strapi')),
  repo('drizzle-orm', 'drizzle-team/drizzle-orm', 'Headless TypeScript ORM', 'https://github.com/drizzle-team/drizzle-orm', 35538, 1542, 'TypeScript', 'Databases', 'drizzle-team', av('drizzle-team')),
  repo('nocodb', 'nocodb/nocodb', '🔥 A Free & Self-hostable Airtable Alternative', 'https://github.com/nocodb/nocodb', 64603, 5000, 'TypeScript', 'Databases', 'nocodb', av('nocodb')),

  // ── AI & ML ──
  repo('langchain', 'langchain-ai/langchain', '🦜🔗 Build context-aware reasoning applications', 'https://github.com/langchain-ai/langchain', 144665, 24102, 'Python', 'AI & ML', 'langchain-ai', av('langchain-ai')),
  repo('open-webui', 'open-webui/open-webui', 'ChatGPT on steroids — Open WebUI', 'https://github.com/open-webui/open-webui', 149401, 21787, 'Svelte', 'AI & ML', 'open-webui', av('open-webui')),
  repo('lobe-chat', 'lobehub/lobe-chat', '🤖 Lobe Chat — an open-source, modern-design ChatGPT/LLMs UI', 'https://github.com/lobehub/lobe-chat', 81865, 15811, 'TypeScript', 'AI & ML', 'lobehub', av('lobehub')),
  repo('flowise', 'FlowiseAI/Flowise', 'Drag & drop UI to build your customized LLM flow', 'https://github.com/FlowiseAI/Flowise', 55384, 24931, 'TypeScript', 'AI & ML', 'FlowiseAI', av('FlowiseAI')),
  repo('dify', 'langgenius/dify', 'Open-source LLM app development platform', 'https://github.com/langgenius/dify', 153065, 24166, 'Python', 'AI & ML', 'langgenius', av('langgenius')),
  repo('vllm', 'vllm-project/vllm', 'A high-throughput and memory-efficient inference engine for LLMs', 'https://github.com/vllm-project/vllm', 89574, 20976, 'Python', 'AI & ML', 'vllm-project', av('vllm-project')),
  repo('ollama', 'ollama/ollama', 'Get up and running with Llama 3, Mistral, Gemma 2, and other large language models', 'https://github.com/ollama/ollama', 179067, 17486, 'Go', 'AI & ML', 'ollama', av('ollama')),
  repo('whisper', 'openai/whisper', 'Robust Speech Recognition via Large-Scale Weak Supervision', 'https://github.com/openai/whisper', 107684, 13066, 'Python', 'AI & ML', 'openai', av('openai')),
  repo('stable-diffusion-webui', 'AUTOMATIC1111/stable-diffusion-webui', 'Stable Diffusion web UI', 'https://github.com/AUTOMATIC1111/stable-diffusion-webui', 164592, 30548, 'Python', 'AI & ML', 'AUTOMATIC1111', av('AUTOMATIC1111')),
  repo('anything-llm', 'Mintplex-Labs/anything-llm', 'All-in-one Desktop & Docker AI application with built-in RAG, AI agents, and more', 'https://github.com/Mintplex-Labs/anything-llm', 64986, 7160, 'JavaScript', 'AI & ML', 'Mintplex-Labs', av('Mintplex-Labs')),
  repo('firecrawl', 'firecrawl/firecrawl', 'The context API to search, scrape, and interact with the web at scale', 'https://github.com/firecrawl/firecrawl', 170126, 9473, 'TypeScript', 'AI & ML', 'firecrawl', av('firecrawl')),
  repo('awesome-oss-alternatives', 'RunaCapital/awesome-oss-alternatives', 'Awesome list of open-source startup alternatives to well-known SaaS products 🚀', 'https://github.com/RunaCapital/awesome-oss-alternatives', 19512, 1104, 'Python', 'AI & ML', 'RunaCapital', av('RunaCapital')),

  // ── DevOps & Infra ──
  repo('docker', 'docker/compose', 'Define and run multi-container applications with Docker', 'https://github.com/docker/compose', 38050, 5786, 'Go', 'DevOps & Infra', 'docker', av('docker')),
  repo('kubernetes', 'kubernetes/kubernetes', 'Production-Grade Container Scheduling and Management', 'https://github.com/kubernetes/kubernetes', 124631, 43887, 'Go', 'DevOps & Infra', 'kubernetes', av('kubernetes')),
  repo('terraform', 'hashicorp/terraform', 'Terraform enables you to safely and predictably create, change, and improve infrastructure', 'https://github.com/hashicorp/terraform', 49498, 10611, 'Go', 'DevOps & Infra', 'hashicorp', av('hashicorp')),
  repo('coolify', 'coollabsio/coolify', 'An open-source & self-hostable Heroku / Netlify / Vercel alternative', 'https://github.com/coollabsio/coolify', 60823, 5314, 'PHP', 'DevOps & Infra', 'coollabsio', av('coollabsio')),
  repo('dockge', 'louislam/dockge', 'A Docker compose.yaml stacking tool', 'https://github.com/louislam/dockge', 24115, 803, 'JavaScript', 'DevOps & Infra', 'louislam', av('louislam')),
  repo('verdaccio', 'verdaccio/verdaccio', 'A lightweight Node.js private proxy registry', 'https://github.com/verdaccio/verdaccio', 17831, 1475, 'TypeScript', 'DevOps & Infra', 'verdaccio', av('verdaccio')),
  repo('gitness', 'harness/gitness', 'Open Source Developer Platform with Source Control Management, CI/CD Pipelines, and more', 'https://github.com/harness/gitness', 38051, 3354, 'Go', 'DevOps & Infra', 'harness', av('harness')),

  // ── UI Components ──
  repo('shadcn-ui', 'shadcn-ui/ui', 'Beautifully designed components built with Radix UI and Tailwind CSS', 'https://github.com/shadcn-ui/ui', 121737, 9924, 'TypeScript', 'UI Components', 'shadcn-ui', av('shadcn-ui')),
  repo('daisyui', 'saadeghi/daisyui', 'The most popular component library for Tailwind CSS', 'https://github.com/saadeghi/daisyui', 42153, 1674, 'JavaScript', 'UI Components', 'saadeghi', av('saadeghi')),
  repo('headless-ui', 'tailwindlabs/headlessui', 'Completely unstyled, fully accessible UI components', 'https://github.com/tailwindlabs/headlessui', 28715, 1202, 'TypeScript', 'UI Components', 'tailwindlabs', av('tailwindlabs')),
  repo('radix', 'radix-ui/primitives', 'An open-source UI component library for building accessible design systems', 'https://github.com/radix-ui/primitives', 19193, 1232, 'TypeScript', 'UI Components', 'radix-ui', av('radix-ui')),
  repo('chakra-ui', 'chakra-ui/chakra-ui', 'Simple, Modular & Accessible UI Components for React', 'https://github.com/chakra-ui/chakra-ui', 40581, 3640, 'TypeScript', 'UI Components', 'chakra-ui', av('chakra-ui')),
  repo('mantine', 'mantinedev/mantine', 'React components library with native dark theme support', 'https://github.com/mantinedev/mantine', 31585, 2355, 'TypeScript', 'UI Components', 'mantinedev', av('mantinedev')),
  repo('vaul', 'emilkowalski/vaul', 'An unstyled, accessible, drawer component for React', 'https://github.com/emilkowalski/vaul', 8561, 363, 'TypeScript', 'UI Components', 'emilkowalski', av('emilkowalski')),
  repo('sonner', 'emilkowalski/sonner', 'An opinionated toast component for React', 'https://github.com/emilkowalski/sonner', 12872, 459, 'TypeScript', 'UI Components', 'emilkowalski', av('emilkowalski')),
  repo('cmdk', 'pacocoursey/cmdk', 'Fast, composable, unstyled command menu for React', 'https://github.com/pacocoursey/cmdk', 12903, 378, 'TypeScript', 'UI Components', 'pacocoursey', av('pacocoursey')),

  // ── CMS & Content ──
  repo('payload', 'payloadcms/payload', 'The best way to build a modern backend + admin UI', 'https://github.com/payloadcms/payload', 44294, 4072, 'TypeScript', 'CMS & Content', 'payloadcms', av('payloadcms')),
  repo('keystonejs', 'keystonejs/keystone', 'The most powerful headless CMS for Node.js', 'https://github.com/keystonejs/keystone', 9961, 1261, 'TypeScript', 'CMS & Content', 'keystonejs', av('keystonejs')),
  repo('sanity', 'sanity-io/sanity', 'The Structured Content Platform', 'https://github.com/sanity-io/sanity', 6281, 548, 'TypeScript', 'CMS & Content', 'sanity-io', av('sanity-io')),
  repo('ghost', 'TryGhost/Ghost', 'Independent technology for modern publishing', 'https://github.com/TryGhost/Ghost', 54830, 11897, 'JavaScript', 'CMS & Content', 'TryGhost', av('TryGhost')),
  repo('TinaCMS', 'tinacms/tinacms', 'A fully extendable Git-based CMS', 'https://github.com/tinacms/tinacms', 13745, 742, 'TypeScript', 'CMS & Content', 'tinacms', av('tinacms')),
  repo('outline', 'outline/outline', 'The fastest knowledge base for growing teams', 'https://github.com/outline/outline', 40264, 3500, 'TypeScript', 'CMS & Content', 'outline', av('outline')),
  repo('appflowy', 'AppFlowy-IO/AppFlowy', 'Bring projects, wikis, and teams together with AI', 'https://github.com/AppFlowy-IO/AppFlowy', 75792, 5894, 'Rust', 'CMS & Content', 'AppFlowy-IO', av('AppFlowy-IO')),

  // ── Payments & Billing ──
  repo('stripe-node', 'stripe/stripe-node', 'The Stripe Node.js library', 'https://github.com/stripe/stripe-node', 4485, 928, 'TypeScript', 'Payments & Billing', 'stripe', av('stripe')),
  repo('lemon-squeezy', 'lmsqueezy/lemonsqueezy.js', 'The official Lemon Squeezy JavaScript SDK', 'https://github.com/lmsqueezy/lemonsqueezy.js', 535, 39, 'TypeScript', 'Payments & Billing', 'lmsqueezy', av('lmsqueezy')),
  repo('dub', 'dubinc/dub', 'Open-source link management infrastructure for modern marketing teams', 'https://github.com/dubinc/dub', 24541, 3244, 'TypeScript', 'Payments & Billing', 'dubinc', av('dubinc')),

  // ── Analytics ──
  repo('posthog', 'PostHog/posthog', 'Open source product analytics, session recording, feature flags & surveys', 'https://github.com/PostHog/posthog', 38020, 3217, 'Python', 'Analytics', 'PostHog', av('PostHog')),
  repo('umami', 'umami-software/umami', 'Umami is a simple, fast, privacy-focused alternative to Google Analytics', 'https://github.com/umami-software/umami', 38291, 7807, 'TypeScript', 'Analytics', 'umami-software', av('umami-software')),
  repo('plausible', 'plausible/analytics', 'Simple, open source, lightweight and privacy-friendly web analytics', 'https://github.com/plausible/analytics', 28686, 1807, 'Elixir', 'Analytics', 'plausible', av('plausible')),
  repo('fathom', 'usefathom/fathom', 'Fathom Analytics — simple, private, lightweight website analytics', 'https://github.com/usefathom/fathom', 8014, 383, 'Go', 'Analytics', 'usefathom', av('usefathom')),
  repo('maybe', 'maybe-finance/maybe', 'Your personal finance assistant', 'https://github.com/maybe-finance/maybe', 54321, 5681, 'Ruby', 'Analytics', 'maybe-finance', av('maybe-finance')),

  // ── Email & Communication ──
  repo('react-email', 'resend/react-email', '📣 The best way to build responsive emails with React', 'https://github.com/resend/react-email', 19638, 1076, 'TypeScript', 'Email & Communication', 'resend', av('resend')),
  repo('resend', 'resend/resend-node', 'The best API to reach humans instead of spam folders', 'https://github.com/resend/resend-node', 945, 87, 'TypeScript', 'Email & Communication', 'resend', av('resend')),
  repo('chatwoot', 'chatwoot/chatwoot', 'Open-source customer engagement suite', 'https://github.com/chatwoot/chatwoot', 36025, 8661, 'Ruby', 'Email & Communication', 'chatwoot', av('chatwoot')),
  repo('activepieces', 'activepieces/activepieces', 'Open-source alternative to Zapier — AI Agents, MCPs & AI Workflow Automation', 'https://github.com/activepieces/activepieces', 23935, 4068, 'TypeScript', 'Email & Communication', 'activepieces', av('activepieces')),
  repo('listmonk', 'knadh/listmonk', 'High performance, self-hosted newsletter and mailing list manager', 'https://github.com/knadh/listmonk', 23017, 2541, 'Go', 'Email & Communication', 'knadh', av('knadh')),

  // ── Deployment ──
  repo('coolify-deploy', 'coollabsio/coolify', 'An open-source & self-hostable Heroku / Netlify / Vercel alternative', 'https://github.com/coollabsio/coolify', 60823, 5314, 'PHP', 'Deployment', 'coollabsio', av('coollabsio')),
  repo('dokploy', 'Dokploy/dokploy', 'Open Source Alternative to Vercel, Heroku and Netlify', 'https://github.com/Dokploy/dokploy', 36744, 2886, 'TypeScript', 'Deployment', 'Dokploy', av('Dokploy')),
  repo('opennextjs-aws', 'opennextjs/opennextjs-aws', 'Open-source Next.js adapter for AWS', 'https://github.com/opennextjs/opennextjs-aws', 5019, 225, 'TypeScript', 'Deployment', 'opennextjs', av('opennextjs')),

  // ── Mobile ──
  repo('expo', 'expo/expo', 'An open-source platform for making universal native apps', 'https://github.com/expo/expo', 51720, 13547, 'TypeScript', 'Mobile', 'expo', av('expo')),
  repo('react-native', 'facebook/react-native', 'A framework for building native applications using React', 'https://github.com/facebook/react-native', 126369, 25218, 'JavaScript', 'Mobile', 'facebook', av('facebook')),
  repo('capacitor', 'ionic-team/capacitor', 'Cross-platform Native Runtime for Web Apps', 'https://github.com/ionic-team/capacitor', 16361, 1231, 'TypeScript', 'Mobile', 'ionic-team', av('ionic-team')),
  repo('tauri', 'tauri-apps/tauri', 'Build smaller, faster, and more secure desktop applications with a web frontend', 'https://github.com/tauri-apps/tauri', 110409, 3869, 'Rust', 'Mobile', 'tauri-apps', av('tauri-apps')),
  repo('gitbutler', 'gitbutlerapp/gitbutler', 'The GitButler version control client', 'https://github.com/gitbutlerapp/gitbutler', 21540, 1012, 'Rust', 'Mobile', 'gitbutlerapp', av('gitbutlerapp')),

  // ── API & Backend ──
  repo('hono', 'honojs/hono', 'Web framework built on Web Standards', 'https://github.com/honojs/hono', 31747, 1232, 'TypeScript', 'API & Backend', 'honojs', av('honojs')),
  repo('trpc', 'trpc/trpc', '🦜 End-to-end typesafe APIs made easy', 'https://github.com/trpc/trpc', 40527, 1651, 'TypeScript', 'API & Backend', 'trpc', av('trpc')),
  repo('fastify', 'fastify/fastify', 'Fast and low overhead web framework for Node.js', 'https://github.com/fastify/fastify', 37015, 2985, 'JavaScript', 'API & Backend', 'fastify', av('fastify')),
  repo('gin', 'gin-gonic/gin', 'Gin is a HTTP web framework written in Go', 'https://github.com/gin-gonic/gin', 89089, 8669, 'Go', 'API & Backend', 'gin-gonic', av('gin-gonic')),
  repo('hoppscotch', 'hoppscotch/hoppscotch', 'Open-Source API Development Ecosystem', 'https://github.com/hoppscotch/hoppscotch', 80065, 6044, 'TypeScript', 'API & Backend', 'hoppscotch', av('hoppscotch')),

  // ── Monitoring ──
  repo('gatus', 'TwiN/gatus', 'Automated service health dashboard', 'https://github.com/TwiN/gatus', 11870, 804, 'Go', 'Monitoring', 'TwiN', av('TwiN')),
  repo('uptime-kuma', 'louislam/uptime-kuma', 'A simple self-hosted monitoring tool', 'https://github.com/louislam/uptime-kuma', 90415, 8275, 'JavaScript', 'Monitoring', 'louislam', av('louislam')),
  repo('healthchecks', 'healthchecks/healthchecks', 'Uptime monitoring & check alerts for cron jobs, daemons, and websites', 'https://github.com/healthchecks/healthchecks', 10266, 998, 'Python', 'Monitoring', 'healthchecks', av('healthchecks')),
  repo('plane', 'makeplane/plane', '🔥 Open-source Jira, Linear, Monday, and ClickUp alternative', 'https://github.com/makeplane/plane', 56533, 5398, 'TypeScript', 'Monitoring', 'makeplane', av('makeplane')),

  // ── Forms & Surveys ──
  repo('formbricks', 'formbricks/formbricks', 'Open Source Survey Platform', 'https://github.com/formbricks/formbricks', 12795, 2478, 'TypeScript', 'Forms & Surveys', 'formbricks', av('formbricks')),

  // ── Search ──
  repo('meilisearch', 'meilisearch/meilisearch', '⚡ Lightning-fast, hyper-relevant search engine', 'https://github.com/meilisearch/meilisearch', 59033, 2672, 'Rust', 'Search', 'meilisearch', av('meilisearch')),
  repo('typesense', 'typesense/typesense', 'Lightning-fast, open source alternative to Algolia & Elasticsearch', 'https://github.com/typesense/typesense', 26461, 962, 'C++', 'Search', 'typesense', av('typesense')),
  repo('algolia-docsearch', 'algolia/docsearch', 'Instant search for your documentation', 'https://github.com/algolia/docsearch', 4369, 437, 'TypeScript', 'Search', 'algolia', av('algolia')),

  // ── File Storage ──
  repo('minio', 'minio/minio', 'High Performance, Kubernetes Native Object Storage', 'https://github.com/minio/minio', 61384, 7781, 'Go', 'File Storage', 'minio', av('minio')),
  repo('filebrowser', 'filebrowser/filebrowser', '📂 Web File Browser', 'https://github.com/filebrowser/filebrowser', 35915, 4019, 'Go', 'File Storage', 'filebrowser', av('filebrowser')),
  repo('uploadthing', 'pingdotgg/uploadthing', 'File uploads for modern web devs', 'https://github.com/pingdotgg/uploadthing', 5309, 444, 'TypeScript', 'File Storage', 'pingdotgg', av('pingdotgg')),
  repo('immich', 'immich-app/immich', 'Self-hosted photo and video backup solution', 'https://github.com/immich-app/immich', 112176, 6652, 'TypeScript', 'File Storage', 'immich-app', av('immich-app')),

  // ── Design & UI ──
  repo('penpot', 'penpot/penpot', 'The open-source design tool', 'https://github.com/penpot/penpot', 58950, 3976, 'Clojure', 'Design & UI', 'penpot', av('penpot')),

  // ── any-sync ──
  repo('any-sync', 'anyproto/any-sync', 'Open source local-first sync engine', 'https://github.com/anyproto/any-sync', 1693, 110, 'Go', 'Databases', 'anyproto', av('anyproto')),
  repo('hono-middleware', 'honojs/middleware', 'Core middlewares for Hono', 'https://github.com/honojs/middleware', 975, 367, 'TypeScript', 'API & Backend', 'honojs', av('honojs')),

  // ═══════════════════════════════════════════════
  // ── NEW ADDITIONS: Screen, Voice, AI Coding, etc. ──
  // ═══════════════════════════════════════════════

  // ── Screen Recording / Demo Tools ──
  repo('openscreen', 'siddharthvaddem/openscreen', '🎬 Create stunning demos for free — open-source alternative to Screen Studio, no watermarks, free for commercial use', 'https://github.com/siddharthvaddem/openscreen', 39874, 3032, 'TypeScript', 'AI & ML', 'siddharthvaddem', av('siddharthvaddem')),
  repo('Recordly', 'webadderallorg/Recordly', '🎥 Create polished demo videos without editing skills — Mac/Windows/Linux', 'https://github.com/webadderallorg/Recordly', 21687, 1575, 'TypeScript', 'AI & ML', 'webadderallorg', av('webadderallorg')),
  repo('screenpipe', 'screenpipe/screenpipe', 'YC (S26) | Open Computer History — Record your screen continuously locally and provide context to your agents', 'https://github.com/screenpipe/screenpipe', 21137, 2121, 'Rust', 'AI & ML', 'screenpipe', av('screenpipe')),

  // ── Speech-to-Speech ──
  repo('speech-to-speech', 'huggingface/speech-to-speech', '🗣️ Build voice agents with open-source models — by Hugging Face', 'https://github.com/huggingface/speech-to-speech', 12712, 1564, 'Python', 'AI & ML', 'huggingface', av('huggingface')),

  // ── Voice / Speech AI (Speech-to-Speech & TTS) ──
  repo('TTS', 'coqui-ai/TTS', '🐸💬 A deep learning toolkit for Text-to-Speech, battle-tested in research and production', 'https://github.com/coqui-ai/TTS', 45924, 6149, 'Python', 'AI & ML', 'coqui-ai', av('coqui-ai')),
  repo('bark', 'suno-ai/bark', '🔊 Text-Prompted Generative Audio Model', 'https://github.com/suno-ai/bark', 39244, 4672, 'Python', 'AI & ML', 'suno-ai', av('suno-ai')),
  repo('ChatTTS', '2noise/ChatTTS', '🗣️ A generative speech model for daily dialogue — speech-to-speech', 'https://github.com/2noise/ChatTTS', 39774, 4259, 'Python', 'AI & ML', '2noise', av('2noise')),
  repo('OpenVoice', 'myshell-ai/OpenVoice', '🎤 Instant voice cloning by MIT and MyShell — speech-to-speech', 'https://github.com/myshell-ai/OpenVoice', 37163, 4149, 'Python', 'AI & ML', 'myshell-ai', av('myshell-ai')),
  repo('fish-speech', 'fishaudio/fish-speech', '🐟 SOTA Open Source TTS — speech-to-speech voice conversion', 'https://github.com/fishaudio/fish-speech', 32301, 2782, 'Python', 'AI & ML', 'fishaudio', av('fishaudio')),
  repo('CosyVoice', 'FunAudioLLM/CosyVoice', '🌐 Multi-lingual large voice generation model — speech-to-speech', 'https://github.com/FunAudioLLM/CosyVoice', 22835, 2631, 'Python', 'AI & ML', 'FunAudioLLM', av('FunAudioLLM')),
  repo('RVC', 'RVC-Project/Retrieval-based-Voice-Conversion-WebUI', '🎵 Easily train a good voice conversion model with voice data <= 10 mins — speech-to-speech', 'https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI', 37710, 5231, 'Python', 'AI & ML', 'RVC-Project', av('RVC-Project')),
  repo('livekit', 'livekit/livekit', 'End-to-end realtime stack for connecting humans and AI', 'https://github.com/livekit/livekit', 20459, 2268, 'Go', 'AI & ML', 'livekit', av('livekit')),
  repo('spleeter', 'deezer/spleeter', '🎵 Deezer source separation library including pretrained models', 'https://github.com/deezer/spleeter', 28395, 3058, 'Python', 'AI & ML', 'deezer', av('deezer')),

  // ── AI Coding Agents ──
  repo('claude-code', 'anthropics/claude-code', 'Claude Code — an agentic coding tool that lives in your terminal', 'https://github.com/anthropics/claude-code', 142163, 22800, 'TypeScript', 'AI & ML', 'anthropics', av('anthropics')),
  repo('codex', 'openai/codex', 'Lightweight coding agent that runs in your terminal', 'https://github.com/openai/codex', 107965, 16451, 'TypeScript', 'AI & ML', 'openai', av('openai')),
  repo('AutoGPT', 'Significant-Gravitas/AutoGPT', 'AutoGPT — the vision of accessible AI for everyone, to use and to build on', 'https://github.com/Significant-Gravitas/AutoGPT', 186689, 46045, 'Python', 'AI & ML', 'Significant-Gravitas', av('Significant-Gravitas')),

  // ── ML Frameworks ──
  repo('transformers', 'huggingface/transformers', '🤗 Transformers: state-of-the-art ML models in text, vision, audio, and more', 'https://github.com/huggingface/transformers', 164287, 34302, 'Python', 'AI & ML', 'huggingface', av('huggingface')),
  repo('pytorch', 'pytorch/pytorch', 'Tensors and Dynamic neural networks in Python with strong GPU acceleration', 'https://github.com/pytorch/pytorch', 102504, 28937, 'Python', 'AI & ML', 'pytorch', av('pytorch')),

  // ── PDF / Document Tools ──
  repo('Stirling-PDF', 'Stirling-Tools/Stirling-PDF', '#1 PDF Application on GitHub — edit PDFs on any device anywhere', 'https://github.com/Stirling-Tools/Stirling-PDF', 89944, 8132, 'Java', 'SaaS Starters', 'Stirling-Tools', av('Stirling-Tools')),

  // ── Business / ERP ──
  repo('odoo', 'odoo/odoo', 'Odoo — Open Source Apps To Grow Your Business', 'https://github.com/odoo/odoo', 53828, 33482, 'Python', 'SaaS Starters', 'odoo', av('odoo')),

  // ── Billing ──
  repo('lago', 'getlago/lago', 'Open Source Metering and Usage Based Billing API', 'https://github.com/getlago/lago', 10371, 722, 'Ruby', 'Payments & Billing', 'getlago', av('getlago')),

  // ── Business Intelligence ──
  repo('metabase', 'metabase/metabase', 'The easy-to-use open source Business Intelligence and Embedded Analytics tool', 'https://github.com/metabase/metabase', 48856, 6759, 'Clojure', 'Analytics', 'metabase', av('metabase')),
  repo('grafana', 'grafana/grafana', 'The open and composable observability and data visualization platform', 'https://github.com/grafana/grafana', 76332, 14595, 'TypeScript', 'Monitoring', 'grafana', av('grafana')),
  repo('prometheus', 'prometheus/prometheus', 'The Prometheus monitoring system and time series database', 'https://github.com/prometheus/prometheus', 65768, 10779, 'Go', 'Monitoring', 'prometheus', av('prometheus')),

  // ── Docker / Container Management ──
  repo('portainer', 'portainer/portainer', 'Making Docker and Kubernetes management easy', 'https://github.com/portainer/portainer', 38294, 2880, 'TypeScript', 'DevOps & Infra', 'portainer', av('portainer')),

  // ── IFTTT / Automation ──
  repo('huginn', 'huginn/huginn', 'Create agents that monitor and act on your behalf', 'https://github.com/huginn/huginn', 49826, 4292, 'Ruby', 'Email & Communication', 'huginn', av('huginn')),

  // ── IoT / Hardware ──
  repo('esphome', 'esphome/esphome', 'ESPHome is a system to control your ESP32, ESP8266, BK72xx, RP2040', 'https://github.com/esphome/esphome', 11569, 5561, 'C++', 'DevOps & Infra', 'esphome', av('esphome')),

  // ── Communication / Messaging ──
  repo('element-web', 'element-hq/element-web', 'A glossy Matrix collaboration client for the web', 'https://github.com/element-hq/element-web', 13393, 2732, 'TypeScript', 'Email & Communication', 'element-hq', av('element-hq')),

  // ── UI / Layout ──
  repo('clay', 'nicbarker/clay', 'High performance UI layout library in C', 'https://github.com/nicbarker/clay', 17942, 712, 'C', 'UI Components', 'nicbarker', av('nicbarker')),

  // ── Self-hosting Lists ──
  repo('awesome-selfhosted', 'awesome-selfhosted/awesome-selfhosted', 'A list of Free Software network services and web apps which can be self-hosted', 'https://github.com/awesome-selfhosted/awesome-selfhosted', 313987, 14747, null, 'DevOps & Infra', 'awesome-selfhosted', av('awesome-selfhosted')),

  // ── AI / Web Tools ──
  repo('reader', 'jina-ai/reader', '📄 Convert any URL to an LLM-friendly input with a simple prefix https://r.jina.ai/', 'https://github.com/jina-ai/reader', 11890, 872, 'TypeScript', 'AI & ML', 'jina-ai', av('jina-ai')),

  // ── Newsletter ──
  repo('mailtrain', 'mailtrain-org/mailtrain', 'Self hosted newsletter app', 'https://github.com/mailtrain-org/mailtrain', 5745, 705, 'JavaScript', 'Email & Communication', 'mailtrain-org', av('mailtrain-org')),
];
