// Product and launch directories where a SaaS can be listed.
// Domain Rating values are Ahrefs DR3 (the current model), checked November 2026.
// Every entry points at the directory's public submission page where one exists,
// otherwise at its homepage. Descriptions are original TopSAAS copy.

export type DirectoryKind = 'saas' | 'startup' | 'ai' | 'launch';
export type DirectoryPrice = 'free' | 'freemium' | 'paid';
export type DirectoryLink = 'dofollow' | 'nofollow' | 'conditional' | 'unknown';

export interface DirectoryEntry {
  rank: number;
  slug: string;
  name: string;
  siteUrl: string;
  submitUrl: string;
  dr: number;
  price: DirectoryPrice;
  link: DirectoryLink;
  kind: DirectoryKind;
  description: string;
  steps: string[];
  requirements: string[];
  approvalTime: string;
  lastChecked: string;
}

type Row = [
  slug: string,
  name: string,
  siteUrl: string,
  submitUrl: string,
  dr: number,
  price: DirectoryPrice,
  link: DirectoryLink,
  kind: DirectoryKind,
  description: string,
];

const ROWS: Row[] = [
  ['sourceforge', 'SourceForge', 'https://sourceforge.net', 'https://sourceforge.net/software/vendors/', 93, 'freemium', 'dofollow', 'saas', 'A long-running software download and review platform where business software is listed by category and compared by buyers.'],
  ['capterra', 'Capterra', 'https://www.capterra.com', 'https://www.capterra.com/vendors/', 91, 'freemium', 'nofollow', 'saas', 'Gartner-owned software marketplace where buyers compare SaaS by category, pricing, reviews, and feature fit.'],
  ['crunchbase', 'Crunchbase', 'https://www.crunchbase.com', 'https://www.crunchbase.com', 91, 'freemium', 'nofollow', 'startup', 'Startup and company database used by investors, journalists, and buyers to research founders, funding, and products.'],
  ['g2', 'G2', 'https://www.g2.com', 'https://www.g2.com/products/new', 91, 'freemium', 'nofollow', 'saas', 'A major software review marketplace where buyers compare products through peer reviews, grids, and category rankings.'],
  ['product-hunt', 'Product Hunt', 'https://www.producthunt.com', 'https://www.producthunt.com/posts/new', 91, 'free', 'nofollow', 'launch', 'The best-known daily launch board where new tech products compete for upvotes, comments, and maker attention.'],
  ['wellfound', 'Wellfound', 'https://wellfound.com', 'https://wellfound.com', 87, 'free', 'unknown', 'startup', 'A startup jobs and company directory where founders publish company profiles, product details, and hiring information.'],
  ['slashdot', 'Slashdot', 'https://slashdot.org', 'https://slashdot.org/software/', 87, 'freemium', 'unknown', 'saas', 'A long-running technology news community with a software directory for open-source and commercial tools.'],
  ['f6s', 'F6S', 'https://www.f6s.com', 'https://www.f6s.com', 83, 'free', 'unknown', 'startup', 'A startup network and directory where founders create company profiles, share deals, and reach investors.'],
  ['brownbook', 'brownbook.net', 'https://www.brownbook.net', 'https://www.brownbook.net/add-business', 80, 'free', 'unknown', 'startup', 'A global business directory that lists companies, products, and local services with contact details.'],
  ['indie-hackers', 'Indie Hackers', 'https://www.indiehackers.com', 'https://www.indiehackers.com/products', 82, 'free', 'unknown', 'startup', 'A community of independent founders where makers share products, revenue numbers, and launch feedback.'],
  ['alternativeto', 'AlternativeTo', 'https://alternativeto.net', 'https://alternativeto.net/software/new/', 81, 'free', 'unknown', 'saas', 'A crowd-sourced directory for finding alternatives to software, apps, and online services.'],
  ['stackshare', 'StackShare', 'https://stackshare.io', 'https://stackshare.io/tools/new', 78, 'free', 'dofollow', 'saas', 'A developer tool directory where teams compare stacks, review tools, and discover infrastructure software.'],
  ['twelve-tools', 'Twelve Tools', 'https://twelve.tools', 'https://twelve.tools/submit-your-tool', 83, 'freemium', 'dofollow', 'launch', 'A curated launch site that features a small set of new tools each day.'],
  ['saashub', 'SaaSHub', 'https://www.saashub.com', 'https://www.saashub.com/submit', 80, 'free', 'dofollow', 'saas', 'A SaaS directory and alternatives engine that lists products by category and use case.'],
  ['dang-ai', 'Dang.ai', 'https://dang.ai', 'https://dang.ai/pricing?plan=free#plan-free', 83, 'freemium', 'unknown', 'ai', 'An AI tool directory that lists new AI products with categories, pricing, and launch dates.'],
  ['alternative-me', 'Alternative.me', 'https://alternative.me', 'https://alternative.me/how-to/submit-software/', 76, 'free', 'unknown', 'saas', 'A software alternatives directory for comparing apps and finding replacements by category.'],
  ['startup-fame', 'Startup Fame', 'https://startupfa.me', 'https://startupfa.me/submit', 85, 'freemium', 'dofollow', 'startup', 'A startup directory that gives new products a profile page, badges, and a launch boost.'],
  ['saasworthy', 'SaaSworthy', 'https://www.saasworthy.com', 'https://www.saasworthy.com', 75, 'freemium', 'unknown', 'saas', 'A SaaS discovery and review platform with category listings, comparisons, and buyer reviews.'],
  ['futurepedia', 'Futurepedia', 'https://www.futurepedia.io', 'https://www.futurepedia.io/submit-tool', 73, 'paid', 'dofollow', 'ai', 'An AI tools directory with categories, pricing details, and weekly featured launches.'],
  ['peerlist-launchpad', 'Peerlist Launchpad', 'https://peerlist.io', 'https://peerlist.io/launchpad', 78, 'free', 'unknown', 'launch', 'A professional network launchpad where makers debut products to a builder-heavy audience.'],
  ['theresanaiforthat', "There's An AI For That", 'https://theresanaiforthat.com', 'https://theresanaiforthat.com/submit/', 78, 'paid', 'unknown', 'ai', 'A large AI tool directory organized by task, with search, categories, and paid featured placements.'],
  ['toolpilot', 'ToolPilot', 'https://www.toolpilot.ai', 'https://www.toolpilot.ai/pages/submit-your-ai-tool', 79, 'freemium', 'dofollow', 'ai', 'An AI tool directory that lists products by category and use case with pricing and reviews.'],
  ['ai-tool-trek', 'AI Tool Trek', 'https://aitooltrek.com', 'https://aitooltrek.com/submit', 63, 'freemium', 'dofollow', 'ai', 'An AI directory that curates new tools across writing, design, code, and productivity.'],
  ['ai-with-me', 'AI With Me', 'https://aiwith.me', 'https://aiwith.me/submit/', 58, 'paid', 'dofollow', 'ai', 'An AI tool directory with category browsing and paid featured listings.'],
  ['fazier', 'Fazier', 'https://fazier.com', 'https://fazier.com/submit', 84, 'freemium', 'dofollow', 'launch', 'A launch platform and product directory with daily rankings, upvotes, and featured spots.'],
  ['betalist', 'BetaList', 'https://betalist.com', 'https://betalist.com/submissions/new', 77, 'paid', 'dofollow', 'launch', 'A launch platform for early-stage startups that showcases products before public release.'],
  ['devhunt', 'DevHunt', 'https://devhunt.org', 'https://devhunt.org/account/tools/new', 68, 'freemium', 'dofollow', 'launch', 'A launch platform for developer tools where makers submit projects and the community votes.'],
  ['toolsfine', 'Toolsfine', 'https://toolsfine.com', 'https://toolsfine.com/submit-ai-tools-or-product', 63, 'paid', 'dofollow', 'ai', 'An AI and software directory that lists tools by category with pricing and feature summaries.'],
  ['sideprojectors', 'SideProjectors', 'https://www.sideprojectors.com', 'https://www.sideprojectors.com', 72, 'free', 'unknown', 'startup', 'A marketplace and directory for side projects, where founders list products and projects for sale.'],
  ['showmysites', 'ShowMySites', 'https://www.showmysites.com', 'https://www.showmysites.com/submit/', 71, 'freemium', 'dofollow', 'saas', 'A website and product directory for submitting new sites, tools, and apps by category.'],
  ['pitchwall', 'Pitchwall', 'https://pitchwall.co', 'https://pitchwall.co/submit', 72, 'freemium', 'dofollow', 'launch', 'A launch platform where founders post products, collect upvotes, and get discovered by early adopters.'],
  ['launchtory', 'Launchtory', 'https://launchtory.com', 'https://launchtory.com', 64, 'freemium', 'unknown', 'launch', 'A startup launch directory that gives new products a listing and launch visibility.'],
  ['startup-ranking', 'Startup Ranking', 'https://www.startupranking.com', 'https://www.startupranking.com', 62, 'free', 'unknown', 'startup', 'A startup directory that ranks companies by country, industry, and community signals.'],
  ['peerpush', 'PeerPush', 'https://peerpush.com', 'https://peerpush.com/submit', 78, 'freemium', 'dofollow', 'launch', 'A launch platform and directory where makers submit products and the community upvotes them.'],
  ['submit-ai-tools', 'Submit AI Tools', 'https://submitaitools.org', 'https://submitaitools.org/submit-your-ai-tool/', 76, 'free', 'unknown', 'ai', 'An AI tools directory with free and paid submission options and category listings.'],
  ['startup-stash', 'Startup Stash', 'https://startupstash.com', 'https://startupstash.com/add-listing/', 66, 'free', 'unknown', 'startup', 'A curated startup resource directory where founders list products and discover tools.'],
  ['magicbox-tools', 'MagicBox.tools', 'https://magicbox.tools', 'https://magicbox.tools/submit', 67, 'paid', 'dofollow', 'ai', 'An AI tool directory with category browsing, featured placements, and launch listings.'],
  ['future-tools', 'Future Tools', 'https://futuretools.io', 'https://futuretools.io/submit-a-tool', 70, 'free', 'unknown', 'ai', 'A curated AI tools directory run by Matt Wolfe with categories, news, and featured tools.'],
  ['uneed', 'Uneed', 'https://www.uneed.best', 'https://www.uneed.best/submit-a-tool', 76, 'freemium', 'conditional', 'launch', 'A launch platform and product directory with daily rankings, upvotes, and a maker community.'],
  ['aitools-inc', 'AiTools.inc', 'https://aitools.inc', 'https://aitools.inc/submit', 68, 'freemium', 'unknown', 'ai', 'An AI tools directory that lists products by category with pricing and feature details.'],
  ['micro-saas-examples', 'Micro SaaS Examples', 'https://www.microsaasexamples.com', 'https://www.microsaasexamples.com/submit', 49, 'paid', 'nofollow', 'saas', 'A directory of micro-SaaS products and case studies for indie founders.'],
  ['trustmrr', 'TrustMRR', 'https://trustmrr.com', 'https://trustmrr.com', 72, 'freemium', 'unknown', 'startup', 'A startup directory focused on revenue transparency, MRR benchmarks, and product listings.'],
  ['opentools', 'OpenTools', 'https://opentools.ai', 'https://opentools.ai/friends/launch-tool', 68, 'paid', 'unknown', 'ai', 'An AI tool directory with categories, launch listings, and paid featured placements.'],
  ['findly-tools', 'Findly.tools', 'https://findly.tools', 'https://findly.tools/submit', 82, 'freemium', 'unknown', 'saas', 'A SaaS and AI tool directory that lists products by category and use case.'],
  ['saasgenius', 'SaaSGenius', 'https://www.saasgenius.com', 'https://www.saasgenius.com', 62, 'freemium', 'unknown', 'saas', 'A SaaS directory and comparison site with category listings and buyer resources.'],
  ['techdirectory', 'TechDirectory', 'https://www.techdirectory.io', 'https://www.techdirectory.io/get-listed', 62, 'free', 'dofollow', 'saas', 'A technology and SaaS directory where products are listed by category and use case.'],
  ['good-ai-tools', 'Good AI Tools', 'https://goodaitools.com', 'https://goodaitools.com/submit', 75, 'free', 'unknown', 'ai', 'An AI tool directory that curates useful tools by category and task.'],
  ['topai-tools', 'TopAI.tools', 'https://topai.tools', 'https://topai.tools/submit', 65, 'freemium', 'dofollow', 'ai', 'An AI tool directory with category browsing, search, and featured listings.'],
  ['turbo0', 'Turbo0', 'https://turbo0.com', 'https://turbo0.com/submit', 81, 'freemium', 'dofollow', 'saas', 'A SaaS and AI tool directory with category listings and launch visibility.'],
  ['aura-plus-plus', 'Aura++', 'https://auraplusplus.com', 'https://auraplusplus.com/projects/submit', 73, 'freemium', 'conditional', 'launch', 'A launch platform where makers submit projects and the community votes on them.'],
  ['aixploria', 'AIxploria', 'https://www.aixploria.com', 'https://www.aixploria.com/en/add-ai/', 57, 'free', 'unknown', 'ai', 'An AI tool directory with categories, descriptions, and alternative suggestions.'],
  ['aitoptools', 'AITopTools', 'https://aitoptools.com', 'https://aitoptools.com/claim-your-tool/', 57, 'free', 'unknown', 'ai', 'An AI tool directory where makers can claim and list their tools by category.'],
  ['launchigniter', 'LaunchIgniter', 'https://launchigniter.com', 'https://launchigniter.com/submit', 75, 'freemium', 'unknown', 'launch', 'A launch platform and directory for new products with community upvotes.'],
  ['startup-fast', 'Startup Fast', 'https://www.startupfa.st', 'https://www.startupfa.st/submit', 74, 'freemium', 'unknown', 'startup', 'A startup directory that lists new products and gives them a launch profile.'],
  ['tinylaunch', 'TinyLaunch', 'https://www.tinylaunch.com', 'https://www.tinylaunch.com/submit', 74, 'freemium', 'dofollow', 'launch', 'A launch platform for indie makers with daily product listings and upvotes.'],
  ['openalternative', 'OpenAlternative', 'https://openalternative.co', 'https://openalternative.co/submit', 61, 'free', 'unknown', 'saas', 'An open-source alternatives directory that lists self-hosted and open products.'],
  ['startups-fm', 'Startups.fm', 'https://startups.fm', 'https://startups.fm/submit', 48, 'paid', 'dofollow', 'startup', 'A startup directory and podcast-style showcase for new companies and products.'],
  ['startupbase', 'StartupBase', 'https://startupbase.io', 'https://startupbase.io/launch', 75, 'freemium', 'dofollow', 'launch', 'A startup launch platform and directory with product profiles and community voting.'],
  ['openhunts', 'OpenHunts', 'https://openhunts.com', 'https://openhunts.com/projects/submit', 73, 'freemium', 'conditional', 'launch', 'An open launch platform where makers submit products and the community votes.'],
  ['microlaunch', 'Microlaunch', 'https://microlaunch.net', 'https://microlaunch.net/submit', 64, 'freemium', 'dofollow', 'launch', 'A launch platform for micro-SaaS and indie products with daily rankings.'],
  ['buildhop', 'Buildhop', 'https://buildhop.io', 'https://buildhop.io', 52, 'free', 'unknown', 'startup', 'A startup directory for builders to list products, projects, and launches.'],
  ['deeplaunch', 'DeepLaunch', 'https://deeplaunch.io', 'https://deeplaunch.io', 73, 'freemium', 'unknown', 'startup', 'A startup directory that lists new products with categories and launch details.'],
  ['awesome-tools', 'Awesome Tools', 'https://awesome.tools', 'https://awesome.tools/submit', 53, 'freemium', 'nofollow', 'saas', 'A software and AI tool directory with category listings and product profiles.'],
  ['launch-vault', 'Launch Vault', 'https://launchvault.dev', 'https://launchvault.dev', 64, 'freemium', 'unknown', 'launch', 'A launch platform and directory for new products and indie startups.'],
  ['nick-launches', 'Nick Launches', 'https://nicklaunches.com', 'https://nicklaunches.com', 77, 'freemium', 'conditional', 'launch', 'A launch platform that features new products and gives makers a listing.'],
  ['navfolders', 'NavFolders', 'https://navfolders.com', 'https://navfolders.com/submit', 67, 'freemium', 'conditional', 'startup', 'A startup and product directory that organizes new tools into browsable folders.'],
  ['aitools-fyi', 'aitools.fyi', 'https://aitools.fyi', 'https://aitools.fyi/submit', 43, 'paid', 'unknown', 'ai', 'An AI tool directory with category browsing, pricing, and paid listings.'],
  ['aitoolsdirectory', 'aitoolsdirectory', 'https://aitoolsdirectory.com', 'https://aitoolsdirectory.com/submit-tool', 51, 'free', 'unknown', 'ai', 'An AI and software directory that lists tools by category and use case.'],
  ['dailypings', 'dailypings', 'https://dailypings.com', 'https://dailypings.com/submit', 66, 'free', 'unknown', 'startup', 'A startup directory that lists new products and sends daily discovery pings.'],
  ['indiehunt', 'IndieHunt', 'https://indiehunt.io', 'https://indiehunt.io/submit', 66, 'freemium', 'dofollow', 'launch', 'A launch platform and directory for indie makers and side projects.'],
  ['toolfame', 'Toolfame', 'https://toolfame.com', 'https://toolfame.com/submit', 76, 'freemium', 'conditional', 'startup', 'A startup and tool directory that lists new products by category.'],
  ['foundrlist', 'FoundrList', 'https://www.foundrlist.com', 'https://www.foundrlist.com/submit', 73, 'freemium', 'unknown', 'launch', 'A launch platform and directory for founders to showcase new products.'],
  ['launching-next', 'Launching Next', 'https://www.launchingnext.com', 'https://www.launchingnext.com/submit/', 55, 'freemium', 'dofollow', 'startup', 'A startup directory that lists new and upcoming products with launch details.'],
  ['saas-ai-tools', 'SaaS AI Tools', 'https://saasaitools.com', 'https://saasaitools.com/submit', 54, 'free', 'unknown', 'ai', 'An AI and SaaS directory that lists tools by category and use case.'],
  ['launch-llama', 'Launch Llama', 'https://tools.launchllama.co', 'https://tools.launchllama.co/submit', 74, 'freemium', 'dofollow', 'launch', 'A launch platform for new tools with community upvotes and featured spots.'],
  ['super-launch', 'Super Launch', 'https://www.superlaun.ch', 'https://www.superlaun.ch', 63, 'freemium', 'dofollow', 'launch', 'A launch platform and directory for new products and startups.'],
  ['submitmysaas', 'SubmitMySaas', 'https://submitmysaas.com', 'https://submitmysaas.com/projects/submit', 61, 'freemium', 'conditional', 'saas', 'A SaaS directory where makers submit products by category and use case.'],
  ['appa-list', 'Appa List', 'https://appalist.com', 'https://appalist.com/submit', 56, 'freemium', 'dofollow', 'ai', 'An AI and app directory that lists tools by category and platform.'],
  ['scrolllaunch', 'ScrollLaunch', 'https://www.scrolllaunch.com', 'https://www.scrolllaunch.com/dashboard/products/new', 73, 'freemium', 'dofollow', 'launch', 'A launch platform for new products with daily listings and upvotes.'],
  ['saasfame', 'SaaSFame', 'https://saasfame.com', 'https://saasfame.com/submit', 72, 'freemium', 'conditional', 'saas', 'A SaaS directory that lists products by category and gives them a profile page.'],
  ['shinylaunch', 'ShinyLaunch', 'https://shinylaunch.com', 'https://shinylaunch.com/submit', 59, 'free', 'dofollow', 'launch', 'A launch platform for new products with daily rankings and community votes.'],
  ['linkcentre', 'Linkcentre', 'https://secure.linkcentre.com', 'https://secure.linkcentre.com/', 71, 'free', 'unknown', 'startup', 'A business and startup directory that lists companies, products, and services.'],
  ['earlyhunt', 'EarlyHunt', 'https://earlyhunt.com', 'https://earlyhunt.com/submit', 66, 'freemium', 'dofollow', 'launch', 'A launch platform for early-stage products with community discovery.'],
  ['startuptrusted', 'StartupTrusted', 'https://startuptrusted.com', 'https://startuptrusted.com/submit', 62, 'freemium', 'conditional', 'startup', 'A startup directory that lists new companies and products with trust signals.'],
  ['firsto', 'Firsto', 'https://firsto.co', 'https://firsto.co/projects/submit', 57, 'freemium', 'unknown', 'launch', 'A launch platform where makers submit products and the community votes.'],
  ['startups-lab', 'Startups Lab', 'https://startupslab.site', 'https://startupslab.site/submit-product', 53, 'freemium', 'conditional', 'launch', 'A launch platform and directory for new startups and products.'],
  ['open-launch', 'Open Launch', 'https://open-launch.com', 'https://open-launch.com/projects/submit', 71, 'freemium', 'unknown', 'launch', 'An open-source launch platform where makers submit products and collect votes.'],
  ['acid-tools', 'Acid Tools', 'https://acidtools.com', 'https://acidtools.com/submit', 70, 'free', 'unknown', 'ai', 'An AI tool directory with categories, pricing, and featured listings.'],
  ['find-your-saas', 'Find Your SaaS', 'https://findyoursaas.com', 'https://findyoursaas.com', 45, 'freemium', 'unknown', 'saas', 'A SaaS directory that helps buyers discover products by category and use case.'],
  ['smol-launch', 'Smol Launch', 'https://smollaunch.com', 'https://smollaunch.com/dashboard/products/new', 76, 'freemium', 'dofollow', 'launch', 'A launch platform for small, indie products with daily listings.'],
  ['huzzler', 'Huzzler', 'https://huzzler.so', 'https://huzzler.so/submit-product', 69, 'freemium', 'dofollow', 'saas', 'A SaaS and startup directory with product listings and community feedback.'],
  ['saashunt', 'SaasHunt', 'https://saashunt.best', 'https://saashunt.best/projects/submit', 63, 'freemium', 'dofollow', 'launch', 'A launch platform and SaaS directory with daily product rankings.'],
  ['startup-inspire', 'Startup Inspire', 'https://www.startupinspire.com', 'https://www.startupinspire.com', 60, 'freemium', 'unknown', 'startup', 'A startup directory that lists new companies and products for inspiration.'],
  ['sumodir', 'SumoDir', 'https://sumodir.com', 'https://sumodir.com/submit', 57, 'freemium', 'dofollow', 'saas', 'A SaaS directory that lists products by category with pricing and details.'],
  ['submithunt', 'SubmitHunt', 'https://www.submithunt.com', 'https://www.submithunt.com/submit', 47, 'freemium', 'dofollow', 'launch', 'A launch platform and directory where makers submit products for discovery.'],
  ['superlaunch-list', 'SuperLaunch List', 'https://superlaunchlist.com', 'https://superlaunchlist.com', 38, 'freemium', 'conditional', 'launch', 'A launch directory that lists new products and startups.'],
  ['neeed-directory', 'Neeed Directory', 'https://neeed.directory', 'https://neeed.directory/submit', 74, 'freemium', 'conditional', 'saas', 'A SaaS directory organized by use case and buyer need.'],
  ['days-launch', 'Days Launch', 'https://dayslaunch.com', 'https://dayslaunch.com', 64, 'freemium', 'unknown', 'launch', 'A launch platform that features a new product each day.'],
  ['starter-best', 'Starter Best', 'https://starterbest.com', 'https://starterbest.com/submit', 64, 'freemium', 'conditional', 'launch', 'A launch platform and directory for new startups and products.'],
  ['better-launch', 'Better Launch', 'https://www.betterlaunch.co', 'https://www.betterlaunch.co/submit', 68, 'freemium', 'conditional', 'launch', 'A launch platform and directory for new products with community discovery.'],
];

const STEPS: Record<DirectoryKind, string[]> = {
  saas: [
    'Create a vendor or maker account on {name} and open the product submission form.',
    'Add the product name, tagline, description, logo, screenshots, categories, and pricing details.',
    'Submit the listing and confirm any verification email. Most SaaS directories review new products before they go live.',
  ],
  startup: [
    'Create a company profile on {name} and choose the product or startup listing type.',
    'Add the company website, founder details, logo, short description, category, and location.',
    'Submit the profile and complete any email or domain verification the directory asks for.',
  ],
  ai: [
    'Open the submit page on {name} and sign in or create a maker account.',
    'Add the tool name, use case, category, pricing model, logo, screenshots, and website link.',
    'Submit for review. AI directories usually check that the product is live and genuinely uses AI.',
  ],
  launch: [
    'Create a maker account on {name} and prepare the launch assets before submitting.',
    'Add the product name, tagline, description, logo, screenshots, categories, and a first comment or launch story.',
    'Schedule or publish the launch, then reply to comments and upvotes on launch day.',
  ],
};

const REQUIREMENTS: Record<DirectoryKind, string[]> = {
  saas: ['A live product website', 'Logo and two or three screenshots', 'A clear one-line tagline', 'Category and pricing details'],
  startup: ['A company or product website', 'Founder and company details', 'Logo and a short description', 'Category and location'],
  ai: ['A live AI product', 'Logo and screenshots', 'Pricing and category details', 'A short explanation of the use case'],
  launch: ['A launch date or scheduled launch', 'Logo, screenshots, and a short demo', 'A maker profile and social links', 'A clear first comment or launch story'],
};

const APPROVAL: Record<DirectoryKind, string> = {
  saas: 'Typically 1 to 5 business days',
  startup: 'Typically 1 to 7 business days',
  ai: 'Typically 1 to 7 business days',
  launch: 'Often same day to 3 days',
};

export const DIRECTORIES: DirectoryEntry[] = [...ROWS]
  .sort((a, b) => b[4] - a[4])
  .map((row, index) => {
    const [slug, name, siteUrl, submitUrl, dr, price, link, kind, description] = row;
    return {
      rank: index + 1,
      slug,
      name,
      siteUrl,
      submitUrl,
      dr,
      price,
      link,
      kind,
      description,
      steps: STEPS[kind].map((step) => step.replace(/\{name\}/g, name)),
      requirements: REQUIREMENTS[kind],
      approvalTime: APPROVAL[kind],
      lastChecked: '2026-11-12',
    };
  });

export const getDirectoryBySlug = (slug: string | null): DirectoryEntry | null =>
  DIRECTORIES.find((directory) => directory.slug === slug) ?? null;

export const getRelatedDirectories = (directory: DirectoryEntry, limit = 6): DirectoryEntry[] =>
  DIRECTORIES.filter((item) => item.slug !== directory.slug)
    .sort((a, b) => {
      const sameKindA = a.kind === directory.kind ? 1 : 0;
      const sameKindB = b.kind === directory.kind ? 1 : 0;
      if (sameKindA !== sameKindB) return sameKindB - sameKindA;
      return Math.abs(a.dr - directory.dr) - Math.abs(b.dr - directory.dr);
    })
    .slice(0, limit);

export const DIRECTORY_KIND_LABELS: Record<DirectoryKind, string> = {
  saas: 'SaaS directory',
  startup: 'Startup directory',
  ai: 'AI directory',
  launch: 'Launch platform',
};

export const DIRECTORY_PRICE_LABELS: Record<DirectoryPrice, string> = {
  free: 'Free',
  freemium: 'Freemium',
  paid: 'Paid',
};

export const DIRECTORY_LINK_LABELS: Record<DirectoryLink, string> = {
  dofollow: 'Dofollow',
  nofollow: 'Nofollow',
  conditional: 'Conditional',
  unknown: 'Unknown',
};

export interface DirectoryHub {
  slug: string;
  label: string;
  title: string;
  description: string;
  filter: (directory: DirectoryEntry) => boolean;
}

export const DIRECTORY_HUBS: DirectoryHub[] = [
  {
    slug: 'free',
    label: 'Free',
    title: 'Free Product Directories (2026)',
    description: 'Directories and launch platforms where listing a SaaS costs nothing.',
    filter: (directory) => directory.price === 'free',
  },
  {
    slug: 'dofollow',
    label: 'Dofollow',
    title: 'Dofollow Product Directories (2026)',
    description: 'Directories that give your product a dofollow link, so the listing can pass SEO value.',
    filter: (directory) => directory.link === 'dofollow',
  },
  {
    slug: 'ai',
    label: 'AI directories',
    title: 'AI Tool Directories (2026)',
    description: 'Directories built for AI tools, agents, and AI-powered SaaS products.',
    filter: (directory) => directory.kind === 'ai',
  },
  {
    slug: 'saas',
    label: 'SaaS directories',
    title: 'SaaS Directories (2026)',
    description: 'Software directories where buyers compare SaaS products by category, reviews, and pricing.',
    filter: (directory) => directory.kind === 'saas',
  },
  {
    slug: 'startup',
    label: 'Startup directories',
    title: 'Startup Directories (2026)',
    description: 'Directories where founders list companies, products, and startup profiles.',
    filter: (directory) => directory.kind === 'startup',
  },
  {
    slug: 'launch-platforms',
    label: 'Launch platforms',
    title: 'SaaS Launch Platforms (2026)',
    description: 'Launch platforms where makers debut a product, collect upvotes, and meet early adopters.',
    filter: (directory) => directory.kind === 'launch',
  },
  {
    slug: 'high-dr',
    label: 'DR 70+',
    title: 'High DR Product Directories (2026)',
    description: 'Directories with an Ahrefs Domain Rating of 70 or higher.',
    filter: (directory) => directory.dr >= 70,
  },
];

export const getDirectoryHub = (slug: string | null): DirectoryHub | null =>
  DIRECTORY_HUBS.find((hub) => hub.slug === slug) ?? null;

export const getDirectoryStats = (directories: DirectoryEntry[] = DIRECTORIES) => {
  const sorted = [...directories].sort((a, b) => a.dr - b.dr);
  const middle = Math.floor(sorted.length / 2);
  const medianDr =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 0
        ? Math.round((sorted[middle - 1].dr + sorted[middle].dr) / 2)
        : sorted[middle].dr;

  return {
    total: directories.length,
    free: directories.filter((directory) => directory.price === 'free').length,
    freeToStart: directories.filter((directory) => directory.price === 'free' || directory.price === 'freemium').length,
    dofollow: directories.filter((directory) => directory.link === 'dofollow').length,
    medianDr,
  };
};
