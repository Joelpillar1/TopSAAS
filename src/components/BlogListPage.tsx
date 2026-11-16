import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  Sparkles,
  Rocket,
  Tag,
  Share2,
  TrendingUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { BLOG_POSTS, BlogPost, getBlogCategories } from '../data/blogPosts';
import { applyPageSeo } from '../utils/pageSeo';
import { blogSeo } from '../utils/coreSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';
import { GridPattern } from './ui/grid-pattern';

interface BlogListPageProps {
  soundEnabled?: boolean;
}

export const BlogListPage: React.FC<BlogListPageProps> = ({ soundEnabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Categories list
  const categories = useMemo(() => getBlogCategories(), []);

  // Filter posts based on category and search query
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter((post) => {
      const matchesCategory =
        selectedCategory === 'All' || post.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchTitle = post.title.toLowerCase().includes(query);
      const matchTagline = post.tagline.toLowerCase().includes(query);
      const matchTags = post.tags.some((t) => t.toLowerCase().includes(query));
      const matchAuthor = post.author.name.toLowerCase().includes(query);

      return matchTitle || matchTagline || matchTags || matchAuthor;
    });
  }, [selectedCategory, searchQuery]);

  // Featured post (first featured post or first item)
  const featuredPost = useMemo(() => {
    return BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];
  }, []);

  // Non-featured posts for the main grid (or all matching if filtering)
  const gridPosts = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== 'All') {
      return filteredPosts;
    }
    return filteredPosts.filter((p) => p.slug !== featuredPost?.slug);
  }, [filteredPosts, searchQuery, selectedCategory, featuredPost]);

  // Page SEO & Schema.org JSON-LD
  useEffect(() => {
    const seo = blogSeo();
    return applyPageSeo({
      ...seo,
      jsonLdId: 'blog-jsonld',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Blog',
            '@id': 'https://www.topsaas.space/blog#blog',
            name: 'TopSAAS Founder & Indie Hacker Blog',
            url: 'https://www.topsaas.space/blog',
            description: seo.description,
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
    <div className="relative min-h-screen bg-neutral-50/50 pb-20 pt-4">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-35">
        <GridPattern className="stroke-neutral-300/60 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header Hero */}
        <div className="mx-auto max-w-3xl pt-8 pb-10 text-center sm:pt-12 sm:pb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-blue-50/40 p-1 pr-3.5 text-xs shadow-2xs">
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
              Playbooks
            </span>
            <span className="font-semibold text-neutral-800 text-[12px]">
              TopSAAS Founder & Growth Guides
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-neutral-950">
            Tactics, Playbooks & Guides for SaaS Founders
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto">
            Battle-tested strategies for launch mechanics, verified backlink distribution, open-source boilerplate stacks, and scaling recurring revenue.
          </p>

          {/* Search Bar */}
          <div className="relative mt-8 max-w-lg mx-auto">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search playbooks, topics, or keywords..."
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-11 pr-10 text-sm font-medium text-neutral-900 shadow-xs placeholder:text-neutral-400 focus:border-neutral-950 focus:outline-hidden focus:ring-1 focus:ring-neutral-950"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    playSound('click', soundEnabled);
                    setSelectedCategory(cat);
                  }}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-neutral-950 text-white shadow-xs'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Post Card (Only shown when no search is active) */}
        {!searchQuery.trim() && selectedCategory === 'All' && featuredPost && (
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-black tracking-wider uppercase text-neutral-500">
                Featured Playbook
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <div
              onClick={() => handleOpenPost(featuredPost.slug)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all hover:border-neutral-300 hover:shadow-md"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Visual side banner */}
                <div
                  className={`lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-gradient-to-br ${featuredPost.coverGradient} p-8 flex flex-col justify-between text-white overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5" />
                      {featuredPost.category}
                    </span>
                    <span className="text-xs font-medium text-white/80 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <div className="relative z-10 my-6">
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      <a
                        href={`/blog/${featuredPost.slug}`}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenPost(featuredPost.slug);
                        }}
                        className="hover:underline"
                      >
                        {featuredPost.title}
                      </a>
                    </h3>
                  </div>

                  <div className="relative z-10">
                    <p className="text-xs font-bold text-white leading-none">
                      By {featuredPost.author.name}
                    </p>
                    <p className="text-[11px] text-white/75 mt-0.5">
                      {featuredPost.author.role}
                    </p>
                  </div>
                </div>

                {/* Content Side */}
                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {featuredPost.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600"
                        >
                          #{tag}
                        </span>
                      ))}
                      <span className="text-xs text-neutral-400 ml-auto">
                        {featuredPost.publishedAt}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-neutral-950 group-hover:text-blue-600 transition-colors">
                      {featuredPost.title}
                    </h2>

                    <p className="mt-3 text-sm text-neutral-600 leading-relaxed line-clamp-3">
                      {featuredPost.tagline}
                    </p>

                    {/* Key Takeaways preview */}
                    <div className="mt-5 rounded-xl border border-neutral-100 bg-neutral-50/80 p-4">
                      <p className="text-xs font-bold text-neutral-900 mb-2 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-mint-600" />
                        Inside this guide:
                      </p>
                      <ul className="space-y-1.5">
                        {featuredPost.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-neutral-600 flex items-start gap-2"
                          >
                            <span className="text-mint-600 font-bold leading-none mt-0.5">✓</span>
                            <span>{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-neutral-100">
                    <span className="text-xs font-semibold text-neutral-500">
                      Free Community Guide
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-black text-neutral-950 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                      Read full article
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-neutral-950">
              {searchQuery.trim()
                ? `Search results (${filteredPosts.length})`
                : selectedCategory === 'All'
                ? 'Latest Playbooks & Articles'
                : `${selectedCategory} (${filteredPosts.length})`}
            </h2>
            <span className="text-xs font-medium text-neutral-500">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
            </span>
          </div>

          {gridPosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center my-6">
              <BookOpen className="mx-auto h-10 w-10 text-neutral-400" />
              <h3 className="mt-3 text-base font-bold text-neutral-900">
                No articles found
              </h3>
              <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
                No blog posts matched your search criteria. Try a different query or reset the filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <article
                  key={post.slug}
                  onClick={() => handleOpenPost(post.slug)}
                  className="group flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-2xs transition-all hover:border-neutral-300 hover:shadow-md cursor-pointer"
                >
                  <div>
                    {/* Header: Category & Read Time */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-1 text-[11px] font-bold text-neutral-800 group-hover:bg-mint-50 group-hover:text-mint-700 transition-colors">
                        {post.category}
                      </span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-neutral-950 group-hover:text-blue-600 transition-colors leading-snug">
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
                    </h3>

                    {/* Tagline */}
                    <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed line-clamp-3">
                      {post.tagline}
                    </p>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 border border-neutral-100"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Author & Link */}
                  <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-600">
                      By {post.author.name}
                    </span>

                    <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-900 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all">
                      Read
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Founder Call to Action: Submit SaaS Banner */}
        <div className="mt-16 rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-8 sm:p-10 text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white mb-3 backdrop-blur-xs">
              <Rocket className="h-3.5 w-3.5 text-mint-400" />
              <span>Launch Your Software</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Ready to feature your product in front of 10,000+ founders?
            </h3>
            <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
              Submit your SaaS tool to TopSAAS. Instant AI auto-fill, verified community leaderboard, high-authority dofollow backlinks, and weekly relaunches.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  navigateTo('/submit');
                }}
                className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold text-white cursor-pointer shadow-md"
              >
                Submit Your SaaS Now
              </button>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  navigateTo('/pricing');
                }}
                className="rounded-xl border border-neutral-700 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                View Launch Plans ($5 Verified)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
