import React, { useEffect } from 'react';
import {
  Clock,
  Rocket,
} from 'lucide-react';
import { BLOG_POSTS } from '../data/blogPosts';
import { applyPageSeo } from '../utils/pageSeo';
import { blogSeo } from '../utils/coreSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';

interface BlogListPageProps {
  soundEnabled?: boolean;
}

export const BlogListPage: React.FC<BlogListPageProps> = ({ soundEnabled = false }) => {
  // Page SEO & Schema.org JSON-LD (GEO / AEO optimized)
  useEffect(() => {
    const seo = blogSeo();
    return applyPageSeo({
      ...seo,
      title: 'SaaS Launch Playbooks, High-DR Backlinks & Growth Tactics | TopSAAS',
      description:
        'Actionable, data-backed playbooks for solo founders and engineering teams: launch mechanics, verified directory distribution, open-source boilerplates, and scaling to $10k+ MRR.',
      jsonLdId: 'blog-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            '@id': 'https://www.topsaas.space/blog#blog',
            name: 'SaaS Launch Playbooks, High-DR Backlinks & Growth Tactics',
            url: 'https://www.topsaas.space/blog',
            description:
              'Actionable, data-backed playbooks for solo founders and engineering teams: launch mechanics, verified directory distribution, open-source boilerplates, and scaling to $10k+ MRR.',
            inLanguage: 'en',
            publisher: {
              '@type': 'Organization',
              name: 'TopSAAS',
              url: 'https://www.topsaas.space',
              logo: 'https://www.topsaas.space/logo/TopSAAS%20-%20blue.png',
            },
          },
          {
            '@type': 'ItemList',
            itemListElement: BLOG_POSTS.map((post, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: post.title,
              url: `https://www.topsaas.space/blog/${post.slug}`,
            })),
          },
        ],
      },
    });
  }, []);

  const handleOpenPost = (slug: string) => {
    playSound('click', soundEnabled);
    navigateTo(`/blog/${slug}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24 pt-6 sm:pt-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {/* Centralized Header optimized for SEO, GEO & AEO */}
        <div className="pt-2 sm:pt-6 pb-2 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-950 max-w-3xl mx-auto leading-tight">
            SaaS Launch Playbooks, High-DR Backlinks & Growth Tactics
          </h1>

          <p className="mt-3.5 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            Actionable, data-backed playbooks for solo founders and engineering teams: launch mechanics, verified directory distribution, open-source boilerplates, and scaling to $10k+ MRR.
          </p>

          <div className="mt-8 border-b border-neutral-200" />
        </div>

        {/* Articles List */}
        <div className="divide-y divide-neutral-200/80">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.slug}
              onClick={() => handleOpenPost(post.slug)}
              className="group cursor-pointer py-7 sm:py-8 transition-colors"
            >
              <div className="flex flex-col-reverse sm:flex-row sm:items-start justify-between gap-5 sm:gap-8">
                {/* Left Column: Metadata, Title, Description */}
                <div className="flex-1 min-w-0">
                  {/* Meta: Date & Read Time */}
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] text-neutral-500 font-medium">
                    <span>{post.publishedAt}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-neutral-400" />
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 group-hover:text-blue-600 transition-colors leading-snug">
                    <a
                      href={`/blog/${post.slug}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenPost(post.slug);
                      }}
                      className="hover:underline"
                    >
                      {post.title}
                    </a>
                  </h2>

                  {/* Excerpt / Description */}
                  <p className="mt-2 text-sm sm:text-[15px] text-neutral-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {post.tagline}
                  </p>
                </div>

                {/* Right Column: Feature Image or App Theme Thumbnail Card */}
                {post.coverImage ? (
                  <div className="w-full sm:w-48 md:w-56 aspect-[16/10] shrink-0 rounded-xl sm:rounded-2xl overflow-hidden border border-neutral-200/90 shadow-2xs relative select-none group-hover:border-blue-500/50 transition-colors bg-neutral-50">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-full sm:w-48 md:w-56 aspect-[16/10] shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-[#0c1222] via-[#0f1738] to-[#1a2580]/40 border border-blue-950/60 p-3 sm:p-3.5 flex flex-col justify-between shadow-2xs relative select-none group-hover:border-blue-600/50 transition-colors">
                    {/* App theme ambient electric blue and mint glow */}
                    <div className="pointer-events-none absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-blue-600/30 blur-xl" />
                    <div className="pointer-events-none absolute right-1 top-1 h-16 w-16 rounded-full bg-mint-500/20 blur-lg" />

                    {/* Center: Title in white with blue hover highlight */}
                    <p className="relative z-10 text-[11px] sm:text-[12px] font-bold text-white leading-tight line-clamp-3 my-auto drop-shadow-xs group-hover:text-blue-100 transition-colors">
                      {post.title}
                    </p>

                    {/* Bottom: Read time & TopSAAS blue brand emblem */}
                    <div className="relative z-10 flex items-center justify-between mt-1 pt-1 border-t border-white/10">
                      <span className="text-[9px] font-medium text-blue-200/70">
                        {post.readTime}
                      </span>
                      <img
                        src="/logo/TopSAAS%20-%20blue.png"
                        alt="TopSAAS"
                        className="h-3.5 w-3.5 rounded object-contain opacity-90 shadow-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Founder Call to Action Banner */}
        <div className="mt-14 rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white mb-2.5 backdrop-blur-xs">
              <Rocket className="h-3.5 w-3.5 text-mint-400" />
              <span>Launch Your Software</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Ready to feature your product in front of 10,000+ founders?
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Submit your SaaS tool to TopSAAS. Instant AI auto-fill, verified leaderboard, high-authority dofollow backlinks, and weekly relaunches.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  navigateTo('/submit');
                }}
                className="btn-primary rounded-xl px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-md"
              >
                Submit Your SaaS Now
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  navigateTo('/pricing');
                }}
                className="rounded-xl border border-neutral-700 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                View Launch Plans ($9 Verified)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
