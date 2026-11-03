// Build Guides — original walkthroughs that show how to ship something real on
// top of a curated open-source project. This is the site's written moat: the
// catalog data is copyable, the guides are not. Each guide links back to its
// repo's detail page (/repo/:owner/:name) and is cross-linked from it.

export interface BuildGuide {
  slug: string;
  /** curated repo full_name — cross-links to /repo/{owner}/{name} */
  repoFullName: string;
  title: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeEstimate: string;
  /** ISO-8601 duration for HowTo structured data, e.g. 'PT8H' */
  totalTime: string;
  stack: string[];
  /** Paragraphs, separated by blank lines */
  intro: string;
  steps: { title: string; body: string; code?: string }[];
  customize: string[];
  checklist: string[];
  faq: { q: string; a: string }[];
}

export const BUILD_GUIDES: BuildGuide[] = [
  {
    slug: 'refine-admin-dashboard',
    repoFullName: 'refinedev/refine',
    title: 'Ship an internal admin dashboard with refine',
    tagline:
      'CRUD pages, auth, routing, and data tables: from empty folder to a deployed back-office in a weekend.',
    difficulty: 'Beginner',
    timeEstimate: 'A weekend (8-12 hours)',
    totalTime: 'PT10H',
    stack: ['React 18', 'TypeScript', 'Vite or Next.js', 'Any REST / GraphQL API'],
    intro:
      'Most SaaS products need the same unglamorous surface: an admin panel where your team sees users, edits records, and resolves tickets. Building that from scratch eats the first week of every project. refine is an open-source React framework built exactly for this: it hands you CRUD pages, routing, auth hooks, and data providers while staying out of your UI\u2019s way. There is no styling lock-in \u2014 you bring Tailwind, MUI, Ant Design, or your own components.\n\nBy the end of this guide you will have a running dashboard wired to real data, login gating on every route, and a deployment target. Every step is a command you can copy.',
    steps: [
      {
        title: 'Scaffold the project',
        body: 'refine ships a CLI that asks three short questions (UI framework, data provider, auth provider) and writes a working app. Run it in an empty folder, then start it.',
        code: 'npm create refine-app@latest admin-dashboard\ncd admin-dashboard\nnpm install\nnpm run dev',
      },
      {
        title: 'Point it at your data',
        body: 'A data provider maps four verbs (getList, getOne, create, update) onto your API. For a simple REST API, one import is enough. Already on Supabase? Swap in @refinedev/supabase-client and the same pages talk to Postgres directly. If your API shapes differ from the defaults, you override only the individual methods \u2014 nothing else in the app changes.',
        code: 'import dataProvider from "@refinedev/simple-rest";\n\nconst API_URL = "https://api.example.com";\n\n<Refine dataProvider={dataProvider(API_URL)}>',
      },
      {
        title: 'Add login gating',
        body: 'authProvider controls login, logout, session checks, and permissions. refine calls authProvider.check() on every navigation: return { ok: false, redirectTo: "/login" } when the session is dead, and wrap your admin routes in <Authenticated> so anonymous visitors never see a single row of data.',
      },
      {
        title: 'Model your resources',
        body: 'One <Resource> per entity: its name (the route), plus list, edit, create, and show components. refine generates the query keys and cache invalidation for you, so your components stay presentational.',
        code: '<Resource\n  name="customers"\n  list={CustomerList}\n  edit={CustomerEdit}\n  create={CustomerCreate}\n/>',
      },
      {
        title: 'Make the list view real',
        body: 'The useTable hook wires sorting, filtering, and pagination for you, and syncWithLocation puts the table state in the URL so a colleague can share the exact view they are looking at.',
        code: 'const { tableProps } = useTable({\n  resource: "orders",\n  syncWithLocation: true,\n});',
      },
      {
        title: 'Wire mutations and notifications',
        body: 'Mutations are one hook each: useUpdate, useCreate, useDelete. Every successful mutation invalidates the affected queries automatically, so lists refresh without manual cache surgery. Add your toast component to the notification provider and you have finished feedback loops.',
      },
      {
        title: 'Deploy',
        body: 'The Vite build is a static bundle: run the production build and drop dist/ on Vercel, Netlify, or Cloudflare Pages. Keep API_URL in environment variables \u2014 the build never embeds secrets.',
        code: 'npm run build\n# deploy dist/ to your host of choice',
      },
    ],
    customize: [
      'Bring your own UI: the core is headless, so plain Tailwind components work as well as Ant Design.',
      'Multi-tenant: wrap the data provider once and scope every getList call by tenant id.',
      'Permissions: map roles in authProvider.canAccess to hide entire resources per role.',
      'Audit trail: mutations funnel through a handful of functions \u2014 log them in one wrapper.',
      'Dark mode is your CSS; refine has no opinion about it.',
    ],
    checklist: [
      'API_URL and secrets come from environment variables, never committed files',
      'Auth check runs on every route, not only at login time',
      'Destructive actions confirm before the mutation fires',
      'Tables paginate server-side (never load 10k rows into the browser)',
      '401 and 403 responses redirect to login instead of blank screens',
    ],
    faq: [
      {
        q: 'Is refine free for commercial use?',
        a: 'Yes. refine is MIT-licensed: unlimited private and commercial use, no per-seat fee.',
      },
      {
        q: 'Do I have to use a specific UI library?',
        a: 'No. The core is headless. Ant Design and MUI are popular starting points, but the official Tailwind example proves you can ship with zero component library.',
      },
      {
        q: 'How much time does this actually save?',
        a: 'Routing, data fetching, auth plumbing, and table state are the slowest part of an internal tool. Most teams save several days per tool versus building the same surface from raw React.',
      },
    ],
  },
  {
    slug: 'n8n-automation-mvp',
    repoFullName: 'n8n-io/n8n',
    title: 'Automate your SaaS operations with n8n',
    tagline:
      'Webhooks, email, Slack, billing events: build the glue that runs your product while you sleep.',
    difficulty: 'Beginner',
    timeEstimate: 'An afternoon (4-6 hours)',
    totalTime: 'PT6H',
    stack: ['Docker', 'HTTP webhooks', 'Node.js services', 'Any SaaS API'],
    intro:
      'Every SaaS accumulates repetitive operations: welcome emails, Slack alerts on new signups, syncing paying customers into a CRM, dunning reminders. Writing this as code buries it in cron jobs and retry logic you will never look at again. n8n is a fair-code licensed, self-hostable workflow engine with 400+ integrations and a visual editor your whole team can read.\n\nYou will run n8n with Docker, build your first webhook-driven workflow, add retries and error handling, and know exactly what to expose publicly.',
    steps: [
      {
        title: 'Run n8n locally',
        body: 'One command and a named volume is all it takes. Open localhost:5678 and create the owner account. WEBHOOK_URL matters later: it is the public base address n8n uses for incoming webhooks once you are in production.',
        code: 'docker volume create n8n_data\ndocker run -it --rm --name n8n \\\n  -p 5678:5678 \\\n  -v n8n_data:/home/node/.n8n \\\n  -e WEBHOOK_URL=https://your-domain.com/ \\\n  docker.n8n.io/n8nio/n8n',
      },
      {
        title: 'Trigger: your product calls n8n',
        body: 'Drop a Webhook node on the canvas and activate the workflow. It gives you a URL like /webhook/new-signup. Point your app at it with the events you already emit.',
        code: 'POST https://your-domain.com/webhook/new-signup\n{ "email": "ada@example.com", "plan": "pro" }',
      },
      {
        title: 'Actions: branch and deliver',
        body: 'Chain an If node on plan, an HTTP Request node to your CRM or billing API, a Send Email node over SMTP, and a Slack node for the team channel. Each node is just configuration \u2014 no deploy step when you change logic.',
      },
      {
        title: 'Credentials and secrets',
        body: 'Store API keys as n8n credentials (encrypted at rest), never inline in nodes. Set N8N_ENCRYPTION_KEY as an environment variable so credentials survive container rebuilds \u2014 without it, a fresh container cannot read your old credentials.',
      },
      {
        title: 'Make it resilient',
        body: 'Enable retry-on-fail per node with a sensible maxTries, then add one Error Trigger workflow that posts to #ops whenever anything fails. Pin HTTP node versions in production so an upstream UI change cannot break a running flow.',
      },
      {
        title: 'Ship it',
        body: 'Run the same Docker command on your VPS or inside Coolify/Kamal behind an HTTPS reverse proxy, keep the n8n_data volume on persistent disk, and schedule backups of it. When workflow volume grows, switch to queue mode with Redis.',
      },
    ],
    customize: [
      'Start from a community template, then delete everything you do not need.',
      'Add header auth to the webhook node so only your app can call it.',
      'Deduplicate notifications: one workflow owns customer-facing email, another owns team alerts.',
      'Version-pin HTTP request nodes in any flow that touches money.',
      'Split long flows into sub-workflows so failures are easier to read.',
    ],
    checklist: [
      'n8n sits behind HTTPS with authentication enabled',
      'N8N_ENCRYPTION_KEY is set and credentials are backed up',
      'Every production workflow has an error workflow attached',
      'Webhook URLs are treated as secrets (header auth or token check)',
      'The n8n_data volume is on a scheduled backup',
    ],
    faq: [
      {
        q: 'Is n8n free to self-host?',
        a: 'The fair-code license is free for internal automation and most self-hosted use. Read the license once if you plan to resell workflows as a service \u2014 that is the main boundary.',
      },
      {
        q: 'Why not just write cron scripts?',
        a: 'Cron gives you execution; n8n gives you execution plus visual history, built-in retries, credential vaulting, and an interface non-engineers can safely edit. The retry and audit story alone justifies it.',
      },
      {
        q: 'Where do my API keys live?',
        a: 'Encrypted in n8n\u2019s own database using your N8N_ENCRYPTION_KEY. They are never written into workflow JSON you export or share.',
      },
    ],
  },
  {
    slug: 'create-t3-app-fullstack-saas',
    repoFullName: 't3-oss/create-t3-app',
    title: 'Launch a full-stack SaaS starter with create-t3-app',
    tagline:
      'Next.js, tRPC, Prisma, and auth with end-to-end type safety: the empty repo your SaaS deserves.',
    difficulty: 'Intermediate',
    timeEstimate: 'A weekend',
    totalTime: 'PT12H',
    stack: ['Next.js', 'tRPC', 'Prisma or Drizzle', 'Tailwind CSS', 'Auth.js'],
    intro:
      'The first day of a new SaaS is usually spent wiring the same boring pipes: API routes, validation, a database client, auth, and environment checks. create-t3-app generates all of it pre-connected with end-to-end types \u2014 change a Prisma model and your React pages light up with type errors until you fix them. That feedback loop is the entire point.\n\nYou will scaffold the project, learn the structure, model real data, gate it behind auth, and deploy it with a database that survives serverless.',
    steps: [
      {
        title: 'Scaffold the project',
        body: 'Run the CLI and pick your pieces (tRPC, Prisma or Drizzle, Tailwind, Auth.js, ESLint). Use --CI to accept the defaults and go straight to code.',
        code: 'npx create-t3-app@latest\n# or: npx create-t3-app@latest --CI\nnpm run dev',
      },
      {
        title: 'Understand the map',
        body: 'Four directories matter: src/server/api/trpc holds your routers, src/server/auth holds Auth.js configuration, src/db holds the Prisma client, and src/env.js validates environment variables so a missing key fails at boot instead of at 2am. tRPC procedures are your API routes \u2014 with types all the way through.',
      },
      {
        title: 'Model your data',
        body: 'Edit the Prisma schema, migrate, then expose the model through a router. Migration history is committed with your repo, so every checkout can replay it.',
        code: 'npx prisma migrate dev --name init\n\n// prisma/schema.prisma\nmodel Project {\n  id        String   @id @default(cuid())\n  name      String\n  userId    String\n  user      User     @relation(fields: [userId], references: [id])\n}',
      },
      {
        title: 'Expose it safely',
        body: 'Split procedures into public and protected, and validate every input with zod. The input type flows from the server straight into your React call sites \u2014 autocomplete included, invalid payloads become compile errors.',
        code: 'postProject: protectedProcedure\n  .input(z.object({ name: z.string().min(3) }))\n  .mutation(async ({ ctx, input }) =>\n    ctx.db.project.create({\n      data: { name: input.name, userId: ctx.session.user.id },\n    })\n  ),',
      },
      {
        title: 'Consume it in React',
        body: 'Query and mutate with hooks, then invalidate the router cache so lists refresh themselves. Because the router is the single source of truth, there is no second types file to keep in sync.',
        code: 'const utils = api.useUtils();\nconst create = api.post.create.useMutation({\n  onSuccess: () => utils.post.list.invalidate(),\n});',
      },
      {
        title: 'Auth that fits',
        body: 'Auth.js ships with GitHub, Google, and credentials providers. Once configured, ctx.session.user is available inside protected procedures \u2014 authorization lives on the server, next to the data, never in the UI.',
      },
      {
        title: 'Deploy',
        body: 'Push to GitHub and import into Vercel. Use a pooled database URL (Neon, Supabase, or PlanetScale poolers) for serverless connections, set NEXTAUTH_SECRET and your auth provider keys, and run migrations during the build.',
        code: '{\n  "scripts": {\n    "build": "prisma generate && prisma migrate deploy && next build"\n  }\n}',
      },
    ],
    customize: [
      'Choose Drizzle at scaffold time if you prefer writing SQL over a schema DSL.',
      'Stripe in three moves: a webhook route, a Subscription model, and an isPro check on your procedures.',
      'Feature flags: one procedure returns them, React caches with staleTime \u2014 no flag service needed.',
      'Transactional email via Resend fired from a mutation, never blocking the response.',
      'Background jobs: add BullMQ with Redis once webhooks outgrow the request lifecycle.',
    ],
    checklist: [
      'env.js rejects the production build when required variables are missing',
      'Every user-scoped procedure reads the id from the session, never from the client',
      'The serverless pooler URL is used for database connections',
      'prisma migrate deploy runs as part of the release, not by hand',
      'Stripe webhooks verify the signature before trusting the payload',
    ],
    faq: [
      {
        q: 'Prisma or Drizzle?',
        a: 'Both are first-class at scaffold time. Prisma wins on migration ergonomics and generated types; Drizzle wins on SQL control and a lighter runtime. Pick by team taste, not capability.',
      },
      {
        q: 'Is the stack production-proven?',
        a: 'Yes \u2014 each piece (Next.js, tRPC, Prisma, Auth.js) runs in production at scale independently, and create-t3-app is maintained by an active community. After generation the code is entirely yours.',
      },
      {
        q: 'How is this different from the plain Next.js starter?',
        a: 'The default starter gives you pages. This gives you pages plus a typed API layer, a database client, auth, and validated env \u2014 the four things every SaaS adds in week one anyway.',
      },
    ],
  },
];

export const getGuideBySlug = (slug: string | null): BuildGuide | null =>
  (slug && BUILD_GUIDES.find((g) => g.slug === slug)) || null;

export const getGuideForRepo = (fullFullName: string): BuildGuide | null =>
  BUILD_GUIDES.find((g) => g.repoFullName === fullFullName) || null;
