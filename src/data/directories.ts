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
  monthlyVisits: number;
  requiresBadge: boolean;
  steps: string[];
  requirements: string[];
  approvalTime: string;
  lastChecked: string;
}

export function formatMonthlyVisits(visits?: number): string {
  if (!visits || visits <= 0) return '—';
  if (visits >= 1_000_000) return `${(visits / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (visits >= 1_000) return `${(visits / 1_000).toFixed(0)}k`;
  return visits.toLocaleString('en-US');
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
  monthlyVisits: number,
  requiresBadge: boolean,
];

const ROWS: Row[] = [
  ["sourceforge", "SourceForge", "https://sourceforge.net", "https://sourceforge.net/software/vendors/", 93, "free", "dofollow", "saas", "A long-running software download and review platform where business software is listed by category and compared by buyers.", 3669392, false],
  ["product-hunt", "Product Hunt", "https://www.producthunt.com", "https://www.producthunt.com/posts/new", 92, "freemium", "nofollow", "launch", "The best-known daily launch board where new tech products compete for upvotes, comments, and maker attention.", 571150, false],
  ["capterra", "Capterra", "https://www.capterra.com", "https://www.capterra.com/vendors/", 91, "paid", "dofollow", "saas", "Gartner-owned software marketplace where buyers compare SaaS by category, pricing, reviews, and feature fit.", 1009336, false],
  ["crunchbase", "Crunchbase", "https://www.crunchbase.com", "https://www.crunchbase.com", 91, "free", "dofollow", "startup", "Startup and company database used by investors, journalists, and buyers to research founders, funding, and products.", 2507117, false],
  ["g2", "G2", "https://www.g2.com", "https://www.g2.com/products/new", 91, "free", "dofollow", "saas", "A major software review marketplace where buyers compare products through peer reviews, grids, and category rankings.", 1245276, false],
  ["hacker-news", "Hacker News", "https://news.ycombinator.com/", "https://news.ycombinator.com/", 91, "free", "dofollow", "launch", "Startup and developer news community where Show HN is the launch slot.", 1686724, false],
  ["proven-expert", "Proven Expert", "https://www.provenexpert.com/", "https://www.provenexpert.com/", 91, "free", "dofollow", "saas", "A platform for businesses to collect, manage, and display customer reviews and ratings.", 70842, false],
  ["indiegogo", "Indiegogo", "https://www.indiegogo.com", "https://www.indiegogo.com", 90, "free", "dofollow", "saas", "A crowdfunding platform for creative projects and entrepreneurial ventures", 55458, false],
  ["devpost", "DevPost", "https://devpost.com/software", "https://devpost.com/software", 88, "free", "dofollow", "saas", "A platform for discovering software projects from hackathons and challenges", 132908, false],
  ["wellfound", "Wellfound", "https://wellfound.com", "https://wellfound.com", 87, "free", "unknown", "startup", "A startup jobs and company directory where founders publish company profiles, product details, and hiring information.", 0, false],
  ["slashdot", "Slashdot", "https://slashdot.org", "https://slashdot.org/software/", 87, "freemium", "unknown", "saas", "A long-running technology news community with a software directory for open-source and commercial tools.", 0, false],
  ["good-firms", "Good Firms", "https://www.goodfirms.co/", "https://www.goodfirms.co/", 87, "free", "dofollow", "saas", "A platform for discovering and reviewing top B2B service providers", 143748, false],
  ["manta", "Manta", "https://www.manta.com", "https://www.manta.com", 86, "free", "dofollow", "startup", "Manta is a business directory featuring millions of small company profiles", 597920, false],
  ["fazier", "Fazier", "https://fazier.com", "https://fazier.com/submit", 85, "freemium", "dofollow", "launch", "A launch platform and product directory with daily rankings, upvotes, and featured spots.", 3164, true],
  ["yourstory", "YourStory", "https://yourstory.com/companies", "https://yourstory.com/companies", 85, "free", "dofollow", "startup", "Curated profiles of startups and companies from India's biggest startup media platform.", 237816, false],
  ["trustradius", "Trustradius", "https://www.trustradius.com/", "https://www.trustradius.com/", 85, "free", "dofollow", "saas", "A platform for verified B2B software reviews and ratings", 106694, false],
  ["startup-fame", "Startup Fame", "https://startupfa.me", "https://startupfa.me/submit", 84, "freemium", "dofollow", "startup", "A startup directory that gives new products a profile page, badges, and a launch boost.", 4563, true],
  ["merchantcircle", "Merchantcircle", "https://www.merchantcircle.com/", "https://www.merchantcircle.com/", 84, "free", "dofollow", "saas", "A social network for local business owners providing online listings, marketing tools, advertising, and business websites.", 111697, false],
  ["12tools", "12Tools", "https://twelve.tools/", "https://twelve.tools/", 84, "freemium", "dofollow", "ai", "A daily curated list of the 12 best internet tools.", 1487, false],
  ["f6s", "F6S", "https://www.f6s.com", "https://www.f6s.com", 83, "free", "dofollow", "startup", "A startup network and directory where founders create company profiles, share deals, and reach investors.", 613160, false],
  ["twelve-tools", "Twelve Tools", "https://twelve.tools", "https://twelve.tools/submit-your-tool", 83, "freemium", "dofollow", "launch", "A curated launch site that features a small set of new tools each day.", 0, false],
  ["dang-ai", "Dang.ai", "https://dang.ai", "https://dang.ai/pricing?plan=free#plan-free", 83, "freemium", "dofollow", "ai", "An AI tool directory that lists new AI products with categories, pricing, and launch dates.", 11949, false],
  ["indie-hackers", "Indie Hackers", "https://www.indiehackers.com", "https://www.indiehackers.com/products", 82, "free", "unknown", "startup", "A community of independent founders where makers share products, revenue numbers, and launch feedback.", 0, false],
  ["alternativeto", "AlternativeTo", "https://alternativeto.net", "https://alternativeto.net/software/new/", 82, "free", "dofollow", "saas", "A crowd-sourced directory for finding alternatives to software, apps, and online services.", 375957, false],
  ["findly-tools", "Findly.tools", "https://findly.tools", "https://findly.tools/submit", 82, "free", "nofollow", "saas", "A SaaS and AI tool directory that lists products by category and use case.", 26, false],
  ["saashub", "SaaSHub", "https://www.saashub.com", "https://www.saashub.com/submit", 81, "free", "dofollow", "saas", "A SaaS directory and alternatives engine that lists products by category and use case.", 90626, false],
  ["turbo0", "Turbo0", "https://turbo0.com", "https://turbo0.com/submit", 81, "free", "dofollow", "saas", "A SaaS and AI tool directory with category listings and launch visibility.", 19, true],
  ["smartcustomer", "Smartcustomer", "https://www.smartcustomer.com/", "https://www.smartcustomer.com/", 81, "free", "dofollow", "saas", "A directory of real business reviews and ratings from over 200 million customers", 129723, false],
  ["brownbook", "brownbook.net", "https://www.brownbook.net", "https://www.brownbook.net/add-business", 80, "free", "dofollow", "startup", "A global business directory that lists companies, products, and local services with contact details.", 6712, false],
  ["toolpilot", "ToolPilot", "https://www.toolpilot.ai", "https://www.toolpilot.ai/pages/submit-your-ai-tool", 79, "freemium", "dofollow", "ai", "An AI tool directory that lists products by category and use case with pricing and reviews.", 19571, false],
  ["stackshare", "StackShare", "https://stackshare.io", "https://stackshare.io/tools/new", 78, "free", "dofollow", "saas", "A developer tool directory where teams compare stacks, review tools, and discover infrastructure software.", 31645, false],
  ["peerlist-launchpad", "Peerlist Launchpad", "https://peerlist.io", "https://peerlist.io/launchpad", 78, "free", "unknown", "launch", "A professional network launchpad where makers debut products to a builder-heavy audience.", 0, false],
  ["peerlist", "Peerlist", "https://peerlist.io", "https://peerlist.io", 78, "freemium", "dofollow", "saas", "Peerlist is a professional network for builders to showcase their work and get hired.", 98268, false],
  ["wired-business", "Wired Business", "https://wired.business", "https://wired.business", 78, "freemium", "dofollow", "startup", "A website about business trends and startups", 78, false],
  ["softwaresuggest", "SoftwareSuggest", "https://www.softwaresuggest.com/", "https://www.softwaresuggest.com/", 78, "free", "dofollow", "saas", "A platform for expert reviews and free recommendations of over 50,000 business software solutions.", 418312, false],
  ["alternative-me", "Alternative.me", "https://alternative.me", "https://alternative.me/how-to/submit-software/", 77, "free", "dofollow", "saas", "A software alternatives directory for comparing apps and finding replacements by category.", 64820, false],
  ["betalist", "BetaList", "https://betalist.com", "https://betalist.com/submissions/new", 77, "free", "dofollow", "launch", "A launch platform for early-stage startups that showcases products before public release.", 16039, false],
  ["uneed", "Uneed", "https://www.uneed.best", "https://www.uneed.best/submit-a-tool", 77, "freemium", "dofollow", "launch", "A launch platform and product directory with daily rankings, upvotes, and a maker community.", 18039, false],
  ["nick-launches", "Nick Launches", "https://nicklaunches.com", "https://nicklaunches.com", 77, "freemium", "conditional", "launch", "A launch platform that features new products and gives makers a listing.", 0, false],
  ["theres-an-ai-for-that", "There's An AI For That", "https://theresanaiforthat.com/", "https://theresanaiforthat.com/", 77, "paid", "dofollow", "ai", "The leading directory for discovering AI tools for any task", 704050, false],
  ["show-me-best-ai", "Show Me Best AI", "https://showmebest.ai", "https://showmebest.ai", 77, "freemium", "dofollow", "ai", "A directory of the best AI tools for business, creativity, and productivity", 1, false],
  ["saasworthy", "SaaSworthy", "https://www.saasworthy.com", "https://www.saasworthy.com", 76, "free", "dofollow", "saas", "A SaaS discovery and review platform with category listings, comparisons, and buyer reviews.", 138608, false],
  ["submit-ai-tools", "Submit AI Tools", "https://submitaitools.org", "https://submitaitools.org/submit-your-ai-tool/", 76, "freemium", "dofollow", "ai", "An AI tools directory with free and paid submission options and category listings.", 33, false],
  ["toolfame", "Toolfame", "https://toolfame.com", "https://toolfame.com/submit", 76, "freemium", "dofollow", "startup", "A startup and tool directory that lists new products by category.", 205, false],
  ["smol-launch", "Smol Launch", "https://smollaunch.com", "https://smollaunch.com/dashboard/products/new", 76, "freemium", "dofollow", "launch", "A launch platform for small, indie products with daily listings.", 0, false],
  ["digitalagencynetwork", "DigitalAgencynetwork", "https://digitalagencynetwork.com/marketplace/", "https://digitalagencynetwork.com/marketplace/", 76, "free", "dofollow", "saas", "A marketplace where brands post digital marketing projects and get matched with top agencies.", 25079, false],
  ["pitchwall", "Pitchwall", "https://pitchwall.co", "https://pitchwall.co/submit", 75, "freemium", "dofollow", "launch", "A launch platform where founders post products, collect upvotes, and get discovered by early adopters.", 47091, false],
  ["good-ai-tools", "Good AI Tools", "https://goodaitools.com", "https://goodaitools.com/submit", 75, "freemium", "nofollow", "ai", "An AI tool directory that curates useful tools by category and task.", 3, false],
  ["launchigniter", "LaunchIgniter", "https://launchigniter.com", "https://launchigniter.com/submit", 75, "freemium", "nofollow", "launch", "A launch platform and directory for new products with community upvotes.", 507, false],
  ["startupbase", "StartupBase", "https://startupbase.io", "https://startupbase.io/launch", 75, "freemium", "dofollow", "launch", "A startup launch platform and directory with product profiles and community voting.", 377, false],
  ["neeed-directory", "Neeed Directory", "https://neeed.directory", "https://neeed.directory/submit", 75, "freemium", "dofollow", "saas", "A SaaS directory organized by use case and buyer need.", 455, true],
  ["whats-the-big-data", "What's the Big Data", "https://whatsthebigdata.com/", "https://whatsthebigdata.com/", 75, "free", "dofollow", "ai", "Hand-picked directory of 1,000+ AI tools across 142 categories, updated daily.", 30891, false],
  ["findushere", "FindUsHere", "https://www.find-us-here.com/", "https://www.find-us-here.com/", 75, "free", "dofollow", "saas", "A free business directory listing millions of businesses in Australia, Canada, New Zealand, UK, and US", 9754, false],
  ["callupcontact", "Callupcontact", "https://www.callupcontact.com/", "https://www.callupcontact.com/", 75, "free", "dofollow", "saas", "A platform for business listing and local marketing services.", 3895, false],
  ["cybo", "Cybo", "https://www.cybo.com/", "https://www.cybo.com/", 75, "free", "dofollow", "saas", "Cybo is a global business directory connecting searchers with local services and companies", 417584, false],
  ["ai-agents-directory", "AI Agents Directory", "https://aiagentsdirectory.com", "https://aiagentsdirectory.com", 75, "freemium", "dofollow", "ai", "A marketplace and directory for AI agents with filters for use case, pricing, and integrations", 8910, false],
  ["n49", "n49", "https://www.n49.com/", "https://www.n49.com/", 75, "free", "dofollow", "saas", "A Canadian platform for reading, writing, and sharing reviews of local businesses", 100169, false],
  ["aura-plus-plus", "Aura++", "https://auraplusplus.com", "https://auraplusplus.com/projects/submit", 74, "freemium", "dofollow", "launch", "A launch platform where makers submit projects and the community votes on them.", 589, false],
  ["startup-fast", "Startup Fast", "https://www.startupfa.st", "https://www.startupfa.st/submit", 74, "freemium", "dofollow", "startup", "A startup directory that lists new products and gives them a launch profile.", 134, false],
  ["tinylaunch", "TinyLaunch", "https://www.tinylaunch.com", "https://www.tinylaunch.com/submit", 74, "freemium", "dofollow", "launch", "A launch platform for indie makers with daily product listings and upvotes.", 5058, true],
  ["openhunts", "OpenHunts", "https://openhunts.com", "https://openhunts.com/projects/submit", 74, "freemium", "dofollow", "launch", "An open launch platform where makers submit products and the community votes.", 4417, false],
  ["foundrlist", "FoundrList", "https://www.foundrlist.com", "https://www.foundrlist.com/submit", 74, "freemium", "dofollow", "launch", "A launch platform and directory for founders to showcase new products.", 243, false],
  ["launch-llama", "Launch Llama", "https://tools.launchllama.co", "https://tools.launchllama.co/submit", 74, "freemium", "dofollow", "launch", "A launch platform for new tools with community upvotes and featured spots.", 470, true],
  ["scrolllaunch", "ScrollLaunch", "https://www.scrolllaunch.com", "https://www.scrolllaunch.com/dashboard/products/new", 74, "freemium", "dofollow", "launch", "A launch platform for new products with daily listings and upvotes.", 406, true],
  ["webwiki", "Webwiki", "https://www.webwiki.com/", "https://www.webwiki.com/", 74, "free", "dofollow", "saas", "Webwiki is a website search engine offering user reviews and ratings", 25, false],
  ["dofollow-tools", "Dofollow.Tools", "https://dofollow.tools", "https://dofollow.tools", 74, "freemium", "dofollow", "ai", "A curated directory of AI tools and SaaS solutions for creators and businesses", 4, false],
  ["futurepedia", "Futurepedia", "https://www.futurepedia.io", "https://www.futurepedia.io/", 73, "paid", "dofollow", "ai", "An AI tools directory with categories, pricing details, and weekly featured launches.", 90039, false],
  ["trustmrr", "TrustMRR", "https://trustmrr.com", "https://trustmrr.com", 73, "freemium", "dofollow", "startup", "A startup directory focused on revenue transparency, MRR benchmarks, and product listings.", 10068, false],
  ["deeplaunch", "DeepLaunch", "https://deeplaunch.io", "https://deeplaunch.io", 73, "freemium", "unknown", "startup", "A startup directory that lists new products with categories and launch details.", 0, false],
  ["toolify", "Toolify", "https://www.toolify.ai/", "https://www.toolify.ai/", 73, "freemium", "dofollow", "ai", "Directory of 30,000+ AI tools across 459 categories, updated daily.", 132257, false],
  ["owler", "Owler", "https://www.owler.com/corp", "https://www.owler.com/corp", 73, "free", "dofollow", "startup", "Owler provides crowd-sourced competitive intelligence and company news", 196460, false],
  ["place123", "Place123", "http://www.place123.net/", "http://www.place123.net/", 73, "free", "dofollow", "saas", "Online directory listing addresses and phone numbers for restaurants, bars, and cafes", 1398, false],
  ["orynth", "Orynth", "https://www.orynth.dev/", "https://www.orynth.dev/", 73, "free", "dofollow", "saas", "A platform to list early-stage products and earn by supporting creators and investing in their coins.", 23, false],
  ["deeplaunch-io", "DeepLaunch.io", "https://deeplaunch.io", "https://deeplaunch.io", 73, "freemium", "dofollow", "launch", "A curated directory of online tools and resources for creators and businesses", 0, false],
  ["softwareworld", "Softwareworld", "https://www.softwareworld.co/", "https://www.softwareworld.co/", 73, "paid", "dofollow", "saas", "A directory of software reviews, comparisons, and recommendations", 145512, false],
  ["activesearchresults", "ActiveSearchResults", "https://www.activesearchresults.com/addwebsite.php", "https://www.activesearchresults.com/addwebsite.php", 73, "free", "dofollow", "saas", "Independent search engine using proprietary ranking technology for website submission", 5, false],
  ["sideprojectors", "SideProjectors", "https://www.sideprojectors.com", "https://www.sideprojectors.com", 72, "free", "dofollow", "startup", "A marketplace and directory for side projects, where founders list products and projects for sale.", 6059, false],
  ["peerpush", "PeerPush", "https://peerpush.com", "https://peerpush.com/submit", 72, "freemium", "dofollow", "launch", "A launch platform and directory where makers submit products and the community upvotes them.", 266, false],
  ["saasfame", "SaaSFame", "https://saasfame.com", "https://saasfame.com/submit", 72, "freemium", "dofollow", "saas", "A SaaS directory that lists products by category and gives them a profile page.", 82, false],
  ["tekpon", "Tekpon", "https://tekpon.com/get-listed/", "https://tekpon.com/get-listed/", 72, "paid", "dofollow", "saas", "SaaS review and discovery platform connecting software vendors with buyers.", 18562, false],
  ["getlatka", "GetLatka", "https://getlatka.com/", "https://getlatka.com/", 72, "freemium", "dofollow", "startup", "Database of 90,000+ SaaS companies with founder-confirmed revenue and growth data.", 24402, false],
  ["launchit", "LaunchIt", "https://launchit.fast", "https://launchit.fast", 72, "freemium", "dofollow", "launch", "Startup launch platform with a free permanent listing, or pay to skip the queue for a dofollow backlink and badge.", 30, true],
  ["viesearch", "viesearch", "https://viesearch.com/", "https://viesearch.com/", 72, "freemium", "dofollow", "saas", "A human-curated search engine offering trusted results through editor-reviewed content", 2096, false],
  ["newtool-site", "NewTool.site", "https://newtool.site", "https://newtool.site", 72, "freemium", "dofollow", "launch", "A directory and launchpad for new web tools and startups.", 85, false],
  ["a-zbusinessfinder", "A-zbusinessfinder", "https://www.a-zbusinessfinder.com/", "https://www.a-zbusinessfinder.com/", 72, "free", "dofollow", "saas", "A global business and community directory covering Australia, Canada, New Zealand, UK, and US.", 669, false],
  ["devhunt", "DevHunt", "https://devhunt.org", "https://devhunt.org/account/tools/new", 71, "paid", "dofollow", "launch", "A launch platform for developer tools where makers submit projects and the community votes.", 18768, false],
  ["showmysites", "ShowMySites", "https://www.showmysites.com", "https://www.showmysites.com/submit/", 71, "freemium", "dofollow", "saas", "A website and product directory for submitting new sites, tools, and apps by category.", 0, false],
  ["linkcentre", "Linkcentre", "https://secure.linkcentre.com", "https://secure.linkcentre.com/", 71, "free", "dofollow", "startup", "A business and startup directory that lists companies, products, and services.", 12509, false],
  ["open-launch", "Open Launch", "https://open-launch.com", "https://open-launch.com/projects/submit", 71, "freemium", "dofollow", "launch", "An open-source launch platform where makers submit products and collect votes.", 2, false],
  ["saascity", "SaaSCity", "https://saascity.io/", "https://saascity.io/", 71, "freemium", "dofollow", "launch", "A gamified SaaS directory with a live city map for launching and discovery", 181, false],
  ["tiny-startups", "Tiny Startups", "https://www.tinystartups.com/", "https://www.tinystartups.com/", 71, "freemium", "dofollow", "launch", "A platform to discover, upvote, and launch new startups.", 1714, false],
  ["future-tools", "Future Tools", "https://futuretools.io", "https://futuretools.io/submit-a-tool", 70, "free", "dofollow", "ai", "A curated AI tools directory run by Matt Wolfe with categories, news, and featured tools.", 50109, false],
  ["acid-tools", "Acid Tools", "https://acidtools.com", "https://acidtools.com/submit", 70, "free", "unknown", "ai", "An AI tool directory with categories, pricing, and featured listings.", 0, false],
  ["better-launch", "Better Launch", "https://www.betterlaunch.co", "https://www.betterlaunch.co/submit", 70, "freemium", "dofollow", "launch", "A launch platform and directory for new products with community discovery.", 247, true],
  ["yo-directory", "yo.directory", "https://yo.directory/", "https://yo.directory/", 70, "freemium", "dofollow", "ai", "Curated discovery platform for AI, design, software and no-code tools.", 2513, false],
  ["trueen", "TRUEen", "https://trueen.com", "https://trueen.com", 70, "freemium", "dofollow", "saas", "Free local business directory and B2B lead generation tool", 3, false],
  ["nextgen-tools", "NextGen Tools", "https://nxgntools.com", "https://nxgntools.com", 70, "free", "dofollow", "ai", "An AI tools directory and launch platform for SaaS and developer tools.", 2138, false],
  ["ufind-best", "Ufind.best", "https://ufind.best", "https://ufind.best", 70, "freemium", "dofollow", "launch", "A directory for discovering and launching new digital tools and startups.", 476, false],
  ["similarlabs", "Similarlabs", "https://similarlabs.com", "https://similarlabs.com", 70, "freemium", "dofollow", "ai", "A platform to discover and launch new products daily", 729, false],
  ["acidtools-com", "acidtools.com", "https://acidtools.com", "https://acidtools.com", 70, "freemium", "dofollow", "ai", "A curated directory of practical AI tools for automation, writing, and design", 0, false],
  ["huzzler", "Huzzler", "https://huzzler.so", "https://huzzler.so/submit-product", 69, "freemium", "dofollow", "saas", "A SaaS and startup directory with product listings and community feedback.", 0, false],
  ["domainrank", "DomainRank", "https://domainrank.app/", "https://domainrank.app/", 69, "free", "dofollow", "ai", "AI tool directory paired with free domain rating and SEO analytics.", 5694, false],
  ["startupxplore", "Startupxplore", "https://startupxplore.com/", "https://startupxplore.com/", 69, "free", "dofollow", "startup", "A platform for discovering and analyzing startups and their ecosystems", 402930, false],
  ["opentools", "OpenTools", "https://opentools.ai", "https://opentools.ai/friends/launch-tool", 68, "paid", "dofollow", "ai", "An AI tool directory with categories, launch listings, and paid featured placements.", 46241, false],
  ["navfolders", "NavFolders", "https://navfolders.com", "https://navfolders.com/submit", 67, "freemium", "conditional", "startup", "A startup and product directory that organizes new tools into browsable folders.", 0, false],
  ["indiehunt", "IndieHunt", "https://indiehunt.io", "https://indiehunt.io/submit", 67, "freemium", "dofollow", "launch", "A launch platform and directory for indie makers and side projects.", 289, false],
  ["bunity", "Bunity", "https://www.bunity.com/", "https://www.bunity.com/", 67, "paid", "dofollow", "saas", "A global business directory listing over 30 million businesses across 190+ countries.", 166, false],
  ["startup-stash", "Startup Stash", "https://startupstash.com", "https://startupstash.com/add-listing/", 66, "free", "dofollow", "startup", "A curated startup resource directory where founders list products and discover tools.", 20634, false],
  ["magicbox-tools", "MagicBox.tools", "https://magicbox.tools", "https://magicbox.tools/submit", 66, "paid", "dofollow", "ai", "An AI tool directory with category browsing, featured placements, and launch listings.", 350, false],
  ["aitools-inc", "AiTools.inc", "https://aitools.inc", "https://aitools.inc/submit", 66, "freemium", "dofollow", "ai", "An AI tools directory that lists products by category with pricing and feature details.", 61667, false],
  ["dailypings", "dailypings", "https://dailypings.com", "https://dailypings.com/submit", 66, "freemium", "dofollow", "startup", "A startup directory that lists new products and sends daily discovery pings.", 0, false],
  ["earlyhunt", "EarlyHunt", "https://earlyhunt.com", "https://earlyhunt.com/submit", 66, "freemium", "dofollow", "launch", "A launch platform for early-stage products with community discovery.", 0, false],
  ["maidensail", "Maidensail", "https://maidensail.com", "https://maidensail.com", 66, "free", "dofollow", "ai", "Startup launch platform with permanent registry pages and weekly launch cohorts.", 0, true],
  ["directree", "directree", "https://www.directree.io/", "https://www.directree.io/", 66, "free", "dofollow", "ai", "Free SaaS directory that labels every fact as observed, AI-inferred or founder-verified.", 15, false],
  ["daniellaunches", "DanielLaunches", "https://daniellaunches.com", "https://daniellaunches.com", 66, "free", "dofollow", "launch", "Launch once. Keep growing.", 1, true],
  ["ai-tool-trek", "AI Tool Trek", "https://aitooltrek.com", "https://aitooltrek.com/submit", 65, "freemium", "dofollow", "ai", "An AI directory that curates new tools across writing, design, code, and productivity.", 190, true],
  ["topai-tools", "TopAI.tools", "https://topai.tools", "https://topai.tools/submit", 65, "freemium", "dofollow", "ai", "An AI tool directory with category browsing, search, and featured listings.", 28338, false],
  ["startuptrusted", "StartupTrusted", "https://startuptrusted.com", "https://startuptrusted.com/submit", 65, "paid", "dofollow", "startup", "A startup directory that lists new companies and products with trust signals.", 4, false],
  ["starter-best", "Starter Best", "https://starterbest.com", "https://starterbest.com/submit", 65, "free", "dofollow", "launch", "A launch platform and directory for new startups and products.", 0, false],
  ["saasgrow", "SaaSGrow", "https://saasgrow.app", "https://saasgrow.app", 65, "freemium", "dofollow", "ai", "A community where startups share wins, failures, and learnings for visibility and backlinks.", 43, false],
  ["launchtory", "Launchtory", "https://launchtory.com", "https://launchtory.com", 64, "freemium", "unknown", "launch", "A startup launch directory that gives new products a listing and launch visibility.", 0, false],
  ["microlaunch", "Microlaunch", "https://microlaunch.net", "https://microlaunch.net/submit", 64, "paid", "dofollow", "launch", "A launch platform for micro-SaaS and indie products with daily rankings.", 4406, false],
  ["launch-vault", "Launch Vault", "https://launchvault.dev", "https://launchvault.dev", 64, "freemium", "unknown", "launch", "A launch platform and directory for new products and indie startups.", 0, false],
  ["shinylaunch", "ShinyLaunch", "https://shinylaunch.com", "https://shinylaunch.com/submit", 64, "free", "dofollow", "launch", "A launch platform for new products with daily rankings and community votes.", 0, false],
  ["days-launch", "Days Launch", "https://dayslaunch.com", "https://dayslaunch.com", 64, "freemium", "unknown", "launch", "A launch platform that features a new product each day.", 0, false],
  ["sitelike", "Sitelike", "https://www.sitelike.org/", "https://www.sitelike.org/", 64, "free", "dofollow", "saas", "A free similar website finder that suggests related sites and alternatives.", 57557, false],
  ["toolsfine", "Toolsfine", "https://toolsfine.com", "https://toolsfine.com/submit-ai-tools-or-product", 63, "paid", "dofollow", "ai", "An AI and software directory that lists tools by category with pricing and feature summaries.", 198, false],
  ["super-launch", "Super Launch", "https://www.superlaun.ch", "https://www.superlaun.ch", 63, "freemium", "dofollow", "launch", "A launch platform and directory for new products and startups.", 0, false],
  ["saashunt", "SaasHunt", "https://saashunt.best", "https://saashunt.best/projects/submit", 63, "freemium", "dofollow", "launch", "A launch platform and SaaS directory with daily product rankings.", 0, false],
  ["launchpanda", "LaunchPanda", "https://www.launchpanda.dev/", "https://www.launchpanda.dev/", 63, "freemium", "dofollow", "launch", "A launch buddy for indie builders — save your info once and launch across 267+ directories", 18, false],
  ["toolfio", "ToolFio", "https://toolfio.com/", "https://toolfio.com/", 63, "freemium", "dofollow", "ai", "A directory of AI tools and SaaS products for builders, developers, and founders", 96, false],
  ["dododirectory", "DodoDirectory", "https://dododirectory.com", "https://dododirectory.com", 63, "freemium", "dofollow", "saas", "A web directory catalog of websites organized by category for easy browsing.", 0, false],
  ["startup-ranking", "Startup Ranking", "https://www.startupranking.com", "https://www.startupranking.com", 62, "free", "dofollow", "startup", "A startup directory that ranks companies by country, industry, and community signals.", 30216, false],
  ["saasgenius", "SaaSGenius", "https://www.saasgenius.com", "https://www.saasgenius.com", 62, "freemium", "unknown", "saas", "A SaaS directory and comparison site with category listings and buyer resources.", 0, false],
  ["whatsyourhours", "Whatsyourhours", "https://www.whatsyourhours.com/", "https://www.whatsyourhours.com/", 62, "free", "dofollow", "saas", "A free business directory offering SEO backlinks for US, UK, NZ, and Australian businesses", 569, false],
  ["techdirectory", "TechDirectory", "https://www.techdirectory.io", "https://www.techdirectory.io/get-listed", 61, "freemium", "dofollow", "saas", "A technology and SaaS directory where products are listed by category and use case.", 1435, false],
  ["openalternative", "OpenAlternative", "https://openalternative.co", "https://openalternative.co/submit", 61, "freemium", "dofollow", "saas", "An open-source alternatives directory that lists self-hosted and open products.", 3335, false],
  ["submitmysaas", "SubmitMySaas", "https://submitmysaas.com", "https://submitmysaas.com/projects/submit", 61, "freemium", "conditional", "saas", "A SaaS directory where makers submit products by category and use case.", 0, false],
  ["submissionwebdirectory", "SubmissionWebDirectory", "https://www.submissionwebdirectory.com/", "https://www.submissionwebdirectory.com/", 61, "free", "dofollow", "saas", "A marketing web directory for submitting and listing websites", 2094, false],
  ["dokeyai", "DokeyAI", "https://dokeyai.com/", "https://dokeyai.com/", 61, "paid", "dofollow", "ai", "Directory of the best AI websites and tools in 2024", 6046, false],
  ["blinx", "Blinx", "https://www.blinx.biz", "https://www.blinx.biz", 61, "free", "dofollow", "saas", "Blinx is a business directory and link exchange platform for SEO growth", 44, false],
  ["startup-inspire", "Startup Inspire", "https://www.startupinspire.com", "https://www.startupinspire.com", 60, "freemium", "dofollow", "startup", "A startup directory that lists new companies and products for inspiration.", 662, false],
  ["noonlaunch", "Noonlaunch", "https://noonlaunch.com/", "https://noonlaunch.com/", 60, "freemium", "dofollow", "ai", "A daily launch platform where products go live at noon and top finishers earn dofollow backlinks.", 165, true],
  ["publishyoursaas", "PublishYourSaaS", "https://publishyoursaas.com/", "https://publishyoursaas.com/", 60, "freemium", "dofollow", "launch", "A SaaS launchpad that publishes an indexable, crawlable listing page for every product.", 7, true],
  ["aitoolfame", "AIToolFame", "https://aitoolfame.com/", "https://aitoolfame.com/", 60, "freemium", "dofollow", "ai", "A directory of AI tools offering lifetime listings and dofollow links for founders.", 177, true],
  ["webcatalog", "Webcatalog", "https://webcatalog.io/en/", "https://webcatalog.io/en/", 60, "free", "dofollow", "saas", "A software platform for discovering, managing, and organizing apps and accounts.", 3383354, false],
  ["marketingdb", "MarketingDB", "https://marketingdb.live", "https://marketingdb.live", 59, "freemium", "dofollow", "startup", "A curated directory for SaaS and startups to browse, vote, and list products", 25, false],
  ["somuch", "SoMuch", "https://somuch.com/", "https://somuch.com/", 59, "free", "dofollow", "saas", "A free link directory for discovering and submitting web resources.", 1040, false],
  ["firsto", "Firsto", "https://firsto.co", "https://firsto.co/projects/submit", 58, "freemium", "dofollow", "launch", "A launch platform where makers submit products and the community votes.", 2071, false],
  ["aipure", "AIPURE", "https://aipure.ai/", "https://aipure.ai/", 58, "paid", "dofollow", "ai", "Discover the top AI tools of 2026 with the AI Directory!", 106468, false],
  ["ai-with-me", "AI With Me", "https://aiwith.me", "https://aiwith.me/submit/", 57, "paid", "dofollow", "ai", "An AI tool directory with category browsing and paid featured listings.", 9619, false],
  ["aixploria", "AIxploria", "https://www.aixploria.com", "https://www.aixploria.com/en/add-ai/", 57, "paid", "dofollow", "ai", "An AI tool directory with categories, descriptions, and alternative suggestions.", 102053, false],
  ["aitoptools", "AITopTools", "https://aitoptools.com", "https://aitoptools.com/claim-your-tool/", 57, "freemium", "dofollow", "ai", "An AI tool directory where makers can claim and list their tools by category.", 37325, false],
  ["awesome-tools", "Awesome Tools", "https://awesome.tools", "https://awesome.tools/submit", 57, "freemium", "nofollow", "saas", "A software and AI tool directory with category listings and product profiles.", 2049, false],
  ["launching-next", "Launching Next", "https://www.launchingnext.com", "https://www.launchingnext.com/submit/", 57, "free", "dofollow", "startup", "A startup directory that lists new and upcoming products with launch details.", 2970, false],
  ["sumodir", "SumoDir", "https://sumodir.com", "https://sumodir.com/submit", 57, "freemium", "dofollow", "saas", "A SaaS directory that lists products by category with pricing and details.", 0, false],
  ["marketinginternetdirectory", "MarketingInternetDirectory", "https://www.marketinginternetdirectory.com/", "https://www.marketinginternetdirectory.com/", 57, "free", "dofollow", "saas", "A quality directory for marketing business, promotion, webhosting, forex, and site submission", 25, false],
  ["launch-list", "Launch-list", "https://www.launch-list.org/", "https://www.launch-list.org/", 57, "free", "dofollow", "launch", "A platform to launch your startup on Product Hunt and 100+ other sites.", 4, false],
  ["appa-list", "Appa List", "https://appalist.com", "https://appalist.com/submit", 56, "freemium", "dofollow", "ai", "An AI and app directory that lists tools by category and platform.", 0, false],
  ["aichief", "AIChief", "https://aichief.com", "https://aichief.com", 56, "free", "dofollow", "ai", "Brand-safe directory of 11,000+ hand-tested AI tools across 612 categories.", 22204, false],
  ["saaspo", "Saaspo", "https://www.saaspo.com/", "https://www.saaspo.com/", 56, "free", "dofollow", "saas", "Design inspiration library of 1,400+ SaaS website pages.", 3457, false],
  ["vibecodinglist", "VibeCodingList", "https://vibecodinglist.com", "https://vibecodinglist.com", 56, "freemium", "dofollow", "saas", "Feedback community for vibe-coded apps: ask one question, get targeted reviews from builders.", 82, false],
  ["trylaunch-ai", "TryLaunch.ai", "https://trylaunch.ai", "https://trylaunch.ai", 56, "free", "dofollow", "ai", "A platform for discovering and launching new AI products with community voting", 1319, false],
  ["bizbangboom", "BizBangBoom", "https://www.BizBangBoom.com/", "https://www.BizBangBoom.com/", 56, "free", "dofollow", "saas", "An online business directory for searching and finding businesses", 39, false],
  ["buildhop", "Buildhop", "https://buildhop.io", "https://buildhop.io", 55, "free", "dofollow", "startup", "A startup directory for builders to list products, projects, and launches.", 78, false],
  ["saas-ai-tools", "SaaS AI Tools", "https://saasaitools.com", "https://saasaitools.com/submit", 55, "freemium", "nofollow", "ai", "An AI and SaaS directory that lists tools by category and use case.", 1452, false],
  ["curlship", "CurlShip", "https://curlship.com/", "https://curlship.com/", 55, "freemium", "dofollow", "ai", "A bot-friendly SaaS directory where a single curl command ships your listing, no login or approval queue.", 0, true],
  ["listmysaas", "ListMySaaS", "https://listmysaas.xyz", "https://listmysaas.xyz", 54, "freemium", "dofollow", "saas", "Curated SaaS directory with free dofollow listings.", 3, true],
  ["biztobiz", "BizToBiz", "https://www.BizToBiz.org/", "https://www.BizToBiz.org/", 54, "free", "dofollow", "saas", "A member directory for finding business professionals and companies", 190, false],
  ["shipboost", "ShipBoost", "https://shipboost.io", "https://shipboost.io", 54, "free", "dofollow", "launch", "A launch distribution platform for bootstrapped SaaS founders with weekly boards and listings.", 89, false],
  ["bizmaker", "Bizmaker", "https://www.bizmaker.org/", "https://www.bizmaker.org/", 54, "free", "dofollow", "saas", "A directory of business listings focused on IT services in the Dallas-Fort Worth area", 9, false],
  ["semfirms", "SEMfirms", "https://www.semfirms.com/", "https://www.semfirms.com/", 54, "paid", "dofollow", "saas", "A directory of reviews for top search engine marketing companies", 2425, false],
  ["startups-lab", "Startups Lab", "https://startupslab.site", "https://startupslab.site/submit-product", 53, "freemium", "dofollow", "launch", "A launch platform and directory for new startups and products.", 20, false],
  ["agentwork-tools", "AgentWork.Tools", "https://agentwork.tools/", "https://agentwork.tools/", 53, "freemium", "dofollow", "ai", "A curated directory of AI agent tools and SaaS for creators and businesses", 87, false],
  ["shipybara", "Shipybara", "https://shipybara.com", "https://shipybara.com", 53, "freemium", "dofollow", "ai", "A platform to discover and upvote the best tech products launching daily.", 83, false],
  ["ctrlalt", "Ctrlalt", "https://ctrlalt.cc/", "https://ctrlalt.cc/", 52, "freemium", "dofollow", "ai", "A daily directory to discover startup tools and products", 152, false],
  ["wayfindio", "wayfindio", "https://wayfindio.com/", "https://wayfindio.com/", 52, "freemium", "dofollow", "ai", "A curated directory of premium and free AI tools, SaaS solutions, and apps for creators and businesses", 0, false],
  ["aitoolsdirectory", "aitoolsdirectory", "https://aitoolsdirectory.com", "https://aitoolsdirectory.com/submit-tool", 51, "free", "unknown", "ai", "An AI and software directory that lists tools by category and use case.", 0, false],
  ["indietool", "IndieTool", "https://www.indietool.io/", "https://www.indietool.io/", 51, "paid", "dofollow", "ai", "A database of startups built by solopreneurs, with one-time paid listings.", 344, false],
  ["mydentify", "Mydentify", "https://mydentify.com/", "https://mydentify.com/", 50, "freemium", "dofollow", "saas", "A permanent product directory with one community-signaled leaderboard each week.", 0, false],
  ["productfame", "ProductFame", "https://productfame.com/", "https://productfame.com/", 50, "freemium", "dofollow", "launch", "A Product Hunt alternative where founders launch products for visibility, feedback, and backlinks.", 0, false],
  ["micro-saas-examples", "Micro SaaS Examples", "https://www.microsaasexamples.com", "https://www.microsaasexamples.com/submit", 49, "paid", "nofollow", "saas", "A directory of micro-SaaS products and case studies for indie founders.", 0, false],
  ["submithunt", "SubmitHunt", "https://www.submithunt.com", "https://www.submithunt.com/submit", 49, "freemium", "dofollow", "launch", "A launch platform and directory where makers submit products for discovery.", 0, true],
  ["akonter", "Akonter", "https://www.akonter.com/", "https://www.akonter.com/", 49, "free", "dofollow", "saas", "A free backlink directory for submitting websites to improve SEO", 1272, false],
  ["business-software-com", "Business-Software.com", "https://www.business-software.com/", "https://www.business-software.com/", 49, "free", "dofollow", "saas", "A business software review site covering accounting, CRM, ERP, and more", 14246, false],
  ["startups-fm", "Startups.fm", "https://startups.fm", "https://startups.fm/submit", 46, "freemium", "dofollow", "startup", "A startup directory and podcast-style showcase for new companies and products.", 53, false],
  ["buildrship", "Buildrship", "https://buildrship.xyz", "https://buildrship.xyz", 46, "freemium", "nofollow", "launch", "A launch platform for indie developers, solo founders, and makers", 0, false],
  ["find-your-saas", "Find Your SaaS", "https://findyoursaas.com", "https://findyoursaas.com", 45, "freemium", "unknown", "saas", "A SaaS directory that helps buyers discover products by category and use case.", 0, false],
  ["tinylaunchpad", "TinyLaunchpad", "https://tinylaunchpad.com/", "https://tinylaunchpad.com/", 44, "freemium", "dofollow", "launch", "A weekly curated discovery platform for new tools and apps, updated every Monday", 56, false],
  ["aitools-fyi", "aitools.fyi", "https://aitools.fyi", "https://aitools.fyi/submit", 43, "paid", "unknown", "ai", "An AI tool directory with category browsing, pricing, and paid listings.", 0, false],
  ["productivity-directory", "Productivity.Directory", "https://productivity.directory/", "https://productivity.directory/", 42, "free", "dofollow", "saas", "A curated list of productivity apps and tools with reviews and guides", 5589, false],
  ["dev-resources", "Dev Resources", "https://devresourc.es/", "https://devresourc.es/", 41, "free", "dofollow", "saas", "Community-curated list of 800+ developer tools and resources by category.", 2546, false],
  ["vantaige", "Vantaige", "https://vantaige.io", "https://vantaige.io", 40, "freemium", "dofollow", "ai", "Curated AI tools directory with 600+ reviewed tools, a prompts library and AI calculators.", 6288, true],
  ["flaex", "Flaex.ai", "https://www.flaex.ai", "https://www.flaex.ai", 39, "freemium", "dofollow", "ai", "AI builder hub for AI tools, MCP servers, agents, and workflows, with a launchpad queue and voting.", 407, true],
  ["bizoforce", "Bizoforce", "https://www.bizoforce.com/", "https://www.bizoforce.com/", 39, "free", "dofollow", "ai", "An AI-powered marketplace for comparing over 120,000 enterprise IT vendors and software.", 4592, false],
  ["superlaunch-list", "SuperLaunch List", "https://superlaunchlist.com", "https://superlaunchlist.com", 38, "freemium", "conditional", "launch", "A launch directory that lists new products and startups.", 0, false],
  ["toolfolio", "Toolfolio", "https://toolfolio.com/", "https://toolfolio.com/", 38, "paid", "dofollow", "ai", "Curated discovery platform for AI, design, no-code and productivity tools.", 21750, false],
  ["go-publicly", "Go Publicly", "https://go-publicly.com", "https://go-publicly.com", 37, "freemium", "dofollow", "ai", "Product launch platform for indie builders and SaaS founders, with daily launches and a free tier", 3, false],
  ["nextjsstarter", "Nextjsstarter", "https://nextjsstarter.com/", "https://nextjsstarter.com/", 36, "free", "dofollow", "saas", "A Next.js starter template for building modern web applications.", 65, false],
  ["businesshunt", "BusinessHunt", "https://businesshunt.co/", "https://businesshunt.co/", 36, "freemium", "dofollow", "launch", "A platform to discover and act on business opportunities", 541, false],
  ["self-hosted-software-list", "Self-Hosted Software List", "https://hostedsoftware.org/", "https://hostedsoftware.org/", 36, "freemium", "dofollow", "saas", "A curated directory of self-hosted software alternatives", 1428, false],
  ["hunt0", "HUNT0", "https://hunt0.com", "https://hunt0.com", 36, "freemium", "dofollow", "ai", "Tracks the best new AI and SaaS products across daily, weekly, and monthly leaderboards.", 99, false],
  ["osssoftware", "Osssoftware", "https://osssoftware.org/", "https://osssoftware.org/", 32, "free", "dofollow", "saas", "Osssoftware is a directory of open source software projects and resources", 388, false],
  ["indieascent", "IndieAscent", "https://indieascent.com", "https://indieascent.com", 31, "free", "dofollow", "saas", "A distribution command center for indie SaaS, with a community attached.", 19, true],
  ["udonboost", "UdonBoost", "https://udonboost.com/", "https://udonboost.com/", 30, "free", "dofollow", "saas", "Directory of independent apps for iPhone, iPad and Mac.", 0, false],
  ["toolscout", "ToolScout", "https://toolscout.ai/", "https://toolscout.ai/", 30, "free", "dofollow", "ai", "Free AI tool directory with category and pricing feeds.", 1160, false],
  ["aibloggenerators", "AIBloggenerators", "https://aibloggenerators.com/", "https://aibloggenerators.com/", 30, "free", "dofollow", "ai", "A curated directory of AI blog and text generators", 5, false],
  ["anyfp", "AnyFP", "https://anyfp.com/", "https://anyfp.com/", 30, "free", "dofollow", "ai", "A catalog of AI tools and services to simplify work and boost productivity", 0, false],
  ["microsaas-directory", "MicroSaaS Directory", "https://microsaas.directory", "https://microsaas.directory", 29, "free", "dofollow", "saas", "Directory of micro-SaaS products, structured by category and audience.", 0, false],
  ["all-low-code-platforms", "All Low Code Platforms", "https://lowcodeplatforms.org/", "https://lowcodeplatforms.org/", 29, "free", "dofollow", "ai", "A curated directory of low code platforms with advanced filters for AI, automation, and CRM", 54, false],
  ["saas-software-directory", "SaaS Software Directory", "https://saassoftware.org/", "https://saassoftware.org/", 27, "freemium", "dofollow", "saas", "A comprehensive directory of SaaS solutions for businesses, developers, and tech enthusiasts", 53, false],
  ["indiehackerstacks", "Indiehackerstacks", "https://indiehackerstacks.com/", "https://indiehackerstacks.com/", 26, "freemium", "dofollow", "saas", "A directory of tools used by indie hackers to build their products", 766, false],
  ["thehackstack", "Thehackstack", "https://thehackstack.com/", "https://thehackstack.com/", 26, "free", "dofollow", "saas", "A community-driven showcase for discovering and sharing new indie products and creative hacks", 530, false],
  ["topwebsitebuilders", "TopWebsiteBuilders", "https://topwebsitebuilders.org/", "https://topwebsitebuilders.org/", 25, "free", "dofollow", "saas", "A curated directory of website building tools for businesses, developers, and web enthusiasts", 36, false],
  ["simplifyaitools", "SimplifyAiTools", "https://simplifyaitools.com/", "https://simplifyaitools.com/", 24, "freemium", "dofollow", "ai", "A directory of AI tools with step-by-step guides and tutorials", 28102, false],
  ["startup88", "Startup88", "https://startup88.com/", "https://startup88.com/", 24, "free", "dofollow", "startup", "A platform for startups to showcase their business to a global audience", 178, false],
  ["indielogs", "Indielogs", "https://www.indielogs.com/", "https://www.indielogs.com/", 23, "free", "dofollow", "startup", "A directory for indie founders to share their building journeys", 1, false],
  ["all-top-ai-tools", "All Top AI Tools", "https://aitoolfor.org/", "https://aitoolfor.org/", 20, "freemium", "dofollow", "ai", "A curated directory of top AI tools ranked by popularity, created by John Rush", 1, false],
  ["endors", "Endors", "https://endors.me/", "https://endors.me/", 20, "free", "dofollow", "saas", "A directory of internet products ranked by verified customer endorsements", 0, false],
  ["coolpot", "Coolpot", "https://coolpot.com/", "https://coolpot.com/", 20, "free", "dofollow", "saas", "A storytelling platform where users can share and read stories", 29, false],
  ["launchwren", "LaunchWren", "https://launchwren.com", "https://launchwren.com", 10, "free", "dofollow", "launch", "A free weekly launch platform for indie builders, with peer feedback and open visitor stats.", 0, true],
];

const STEPS: Record<DirectoryKind, string[]> = {
  saas: [
    'Go to the directory and find the "Submit Software" or "Add Product" button.',
    'Create an account or claim your existing vendor profile.',
    'Fill in the product profile: product name, landing page URL, category, pricing model, logo, screenshots, and feature highlights.',
    'Submit the listing and confirm any verification email. Most SaaS directories review new products before they go live.',
  ],
  startup: [
    'Open the submit page and create a founder or company account.',
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
    const [slug, name, siteUrl, submitUrl, dr, price, link, kind, description, monthlyVisits, requiresBadge] = row;
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
      monthlyVisits: monthlyVisits || 0,
      requiresBadge: Boolean(requiresBadge),
      steps: STEPS[kind].map((step) => step.replace(/\{name\}/g, name)),
      requirements: REQUIREMENTS[kind],
      approvalTime: APPROVAL[kind],
      lastChecked: '2026-11-15',
    };
  });

const SLUG_ALIASES: Record<string, string> = {
  theresanaiforthat: 'theres-an-ai-for-that',
};

export const getDirectoryBySlug = (slug: string | null): DirectoryEntry | null => {
  if (!slug) return null;
  const canonicalSlug = SLUG_ALIASES[slug] || slug;
  return DIRECTORIES.find((directory) => directory.slug === canonicalSlug) ?? null;
};

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
    description: 'Daily and weekly launch platforms where new products compete for upvotes, comments, and rank.',
    filter: (directory) => directory.kind === 'launch',
  },
  {
    slug: 'high-dr',
    label: 'High DR',
    title: 'High DR Product Directories (2026)',
    description: 'Directories with an Ahrefs Domain Rating of 70 or higher.',
    filter: (directory) => directory.dr >= 70,
  },
  {
    slug: 'no-badge',
    label: 'No Badge Required',
    title: 'Directories That Do Not Require a Badge (2026)',
    description: 'Directories that let you submit your SaaS without forcing you to embed a backlink or badge.',
    filter: (directory) => !directory.requiresBadge,
  },
];

export const getDirectoryHub = (slug: string | null | undefined): DirectoryHub | null =>
  DIRECTORY_HUBS.find((hub) => hub.slug === slug) ?? null;

export const getDirectoryStats = (directories: DirectoryEntry[] = DIRECTORIES) => {
  const sorted = [...directories].sort((a, b) => a.dr - b.dr);
  const medianDr =
    sorted.length === 0
      ? 0
      : sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)].dr
        : Math.round(
            (sorted[sorted.length / 2 - 1].dr + sorted[sorted.length / 2].dr) / 2
          );

  return {
    total: directories.length,
    free: directories.filter((directory) => directory.price === 'free').length,
    freeToStart: directories.filter((directory) => directory.price === 'free' || directory.price === 'freemium').length,
    dofollow: directories.filter((directory) => directory.link === 'dofollow').length,
    noBadge: directories.filter((directory) => !directory.requiresBadge).length,
    medianDr,
  };
};
