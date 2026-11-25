import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Share2,
  Check,
  Copy,
  BookOpen,
  Sparkles,
  Rocket,
  ChevronRight,
  ExternalLink,
  Tag,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  Calendar,
  BarChart2,
  Link2,
  Zap,
} from 'lucide-react';
import { BLOG_POSTS, getBlogPostBySlug, BlogPost } from '../data/blogPosts';
import { applyPageSeo } from '../utils/pageSeo';
import { blogPostSeo } from '../utils/coreSeo';
import { navigateTo } from '../utils/nav';
import { playSound } from '../utils/sound';

interface BlogDetailPageProps {
  slug: string | null;
  soundEnabled?: boolean;
}

const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return text;
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      const label = match[2];
      const url = match[3];
      const isExternal = url.startsWith('http://') || url.startsWith('https://');

      if (isExternal) {
        parts.push(
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline font-semibold hover:text-blue-800 transition-colors inline-flex items-center gap-0.5"
          >
            <span>{label}</span>
            <ExternalLink className="h-3 w-3 inline ml-0.5 text-blue-500" />
          </a>
        );
      } else {
        parts.push(
          <a
            key={match.index}
            href={url}
            onClick={(e) => {
              e.preventDefault();
              navigateTo(url);
            }}
            className="text-blue-600 underline font-semibold hover:text-blue-800 transition-colors cursor-pointer"
          >
            {label}
          </a>
        );
      }
    } else if (match[4]) {
      parts.push(
        <strong key={match.index} className="font-bold text-neutral-900">
          {match[4]}
        </strong>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  slug,
  soundEnabled = false,
}) => {
  const post = getBlogPostBySlug(slug);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  // Related posts: exclude current, same category if possible
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const others = BLOG_POSTS.filter((p) => p.slug !== post.slug);
    const sameCategory = others.filter((p) => p.category === post.category);
    if (sameCategory.length >= 2) {
      return sameCategory.slice(0, 2);
    }
    return others.slice(0, 2);
  }, [post]);

  // Page SEO & Schema.org Structured Data (AEO & GEO optimized)
  useEffect(() => {
    if (!post) return;

    const seo = blogPostSeo(post);
    const postUrl = `https://www.topsaas.space/blog/${post.slug}`;

    const blogPostingSchema = {
      '@type': ['Article', 'BlogPosting'],
      '@id': `${postUrl}#article`,
      headline: post.title,
      description: post.tagline,
      datePublished: '2026-11-14T08:00:00Z',
      dateModified: '2026-11-15T12:00:00Z',
      mainEntityOfPage: postUrl,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.direct-answer-text', '.article-title'],
      },
      author: {
        '@type': 'Organization',
        name: 'TopSAAS',
        url: 'https://www.topsaas.space',
      },
      publisher: {
        '@type': 'Organization',
        name: 'TopSAAS',
        url: 'https://www.topsaas.space',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.topsaas.space/logo/TopSAAS%20-%20blue.png',
        },
      },
      keywords: post.tags.join(', '),
      articleSection: post.category,
      about: [
        { '@type': 'Thing', name: 'Software as a Service' },
        { '@type': 'Thing', name: 'Search Engine Optimization' },
        { '@type': 'Thing', name: 'Indie Hacking' },
      ],
    };

    const breadcrumbsSchema = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.topsaas.space',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://www.topsaas.space/blog',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.title,
          item: postUrl,
        },
      ],
    };

    const faqSchema =
      post.faq && post.faq.length > 0
        ? {
            '@type': 'FAQPage',
            mainEntity: post.faq.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: f.a,
              },
            })),
          }
        : null;

    const graph = [blogPostingSchema, breadcrumbsSchema];
    if (faqSchema) graph.push(faqSchema as any);

    return applyPageSeo({
      ...seo,
      jsonLdId: `blogpost-${post.slug}-jsonld`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': graph,
      },
    });
  }, [post]);

  const handleCopyLink = () => {
    playSound('click', soundEnabled);
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    if (!post) return;
    playSound('click', soundEnabled);
    const text = encodeURIComponent(
      `"${post.title}" on the TopSAAS Founder Blog: ${post.tagline}`
    );
    const url = encodeURIComponent(
      typeof window !== 'undefined'
        ? window.location.href
        : `https://www.topsaas.space/blog/${post.slug}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}&via=topsaas_space`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopySnippet = (code: string, idx: number) => {
    playSound('click', soundEnabled);
    navigator.clipboard.writeText(code);
    setCopiedSnippetIdx(idx);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
  };

  if (!post) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 pt-16 pb-24 text-center space-y-4">
        <h1 className="text-2xl font-black text-neutral-950">Article not found</h1>
        <p className="text-sm text-neutral-600">
          The requested blog article does not exist or has been moved.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              playSound('click', soundEnabled);
              navigateTo('/blog');
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <article className="w-full pb-8 pt-2 sm:pt-4">
      <div className="w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="pb-4 flex items-center gap-1.5 text-xs text-neutral-500 flex-wrap">
          <a
            href="/"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              playSound('click', soundEnabled);
              navigateTo('/');
            }}
            className="hover:text-neutral-950 transition-colors cursor-pointer"
          >
            Home
          </a>
          <span className="text-neutral-300 select-none">/</span>
          <a
            href="/blog"
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              playSound('click', soundEnabled);
              navigateTo('/blog');
            }}
            className="hover:text-neutral-950 transition-colors cursor-pointer"
          >
            Blog
          </a>
          <span className="text-neutral-300 select-none">/</span>
          <span className="font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-[320px]">
            {post.category}
          </span>
        </nav>

        {/* Article Header */}
        <header className="pb-6 border-b border-neutral-200/80">
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center rounded-md bg-mint-50 px-2.5 py-1 text-xs font-bold text-mint-700">
              {post.category}
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-neutral-400" />
              {post.publishedAt}
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-medium text-neutral-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-neutral-400" />
              {post.readTime}
            </span>
          </div>

          <h1 className="article-title text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-950 leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
            {post.tagline}
          </p>

          {/* Author Block & Share Bar */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-bold text-neutral-900">
                    By {post.author.name}
                  </p>
                  {post.author.twitter && (
                    <a
                      href={post.author.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-400 hover:text-neutral-700"
                      title="TopSAAS on X"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-neutral-500">{post.author.role}</p>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareTwitter}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
                title="Share on X (Twitter)"
              >
                <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
                title="Copy Article Link"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-mint-600" />
                    <span className="text-mint-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* AEO / AI Overview Direct Answer Box */}
        {post.directAnswer && (
          <div className="mt-8 rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold">
                AI
              </span>
              <h2 className="text-xs font-black uppercase tracking-wider text-blue-900">
                Direct Answer & Core Definition (TL;DR)
              </h2>
            </div>
            <p className="direct-answer-text text-sm sm:text-base text-blue-950 font-medium leading-relaxed">
              {post.directAnswer}
            </p>
          </div>
        )}

        {/* Key Takeaways Callout Card */}
        {post.keyTakeaways && post.keyTakeaways.length > 0 && (
          <div className="mt-6 rounded-2xl border border-mint-500/30 bg-mint-50/50 p-6 sm:p-7 shadow-2xs">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-mint-600" />
              <span>Key Takeaways for Founders</span>
            </h2>
            <ul className="space-y-2.5">
              {post.keyTakeaways.map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-500/20 text-mint-700 font-bold text-xs mt-0.5">
                    ✓
                  </span>
                  <span className="leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Table of Contents */}
        {post.sections && post.sections.length > 1 && (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-black tracking-wider uppercase text-neutral-500 mb-3 flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-neutral-400" />
              <span>Table of Contents</span>
            </h3>
            <ul className="space-y-2">
              {post.sections.map((sec, idx) => (
                <li key={sec.id}>
                  <a
                    href={`#${sec.id}`}
                    className="text-xs sm:text-sm font-semibold text-neutral-700 hover:text-blue-600 flex items-center gap-2 transition-colors"
                  >
                    <span className="text-neutral-400 font-mono text-xs">{idx + 1}.</span>
                    <span>{sec.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Article Body */}
        <div className="mt-8 space-y-12">
          {/* Intro Paragraphs */}
          <div className="space-y-4">
            {post.intro.map((para, i) => (
              <p
                key={i}
                className="text-sm sm:text-base text-neutral-700 leading-relaxed font-normal"
              >
                {renderFormattedText(para)}
              </p>
            ))}
          </div>

          {/* Sections */}
          {post.sections.map((section, sIndex) => (
            <section key={section.id} id={section.id} className="pt-2 space-y-6">
              <h2 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight border-b border-neutral-100 pb-3">
                {section.title}
              </h2>

              <div className="space-y-4">
                {section.paragraphs.map((para, pIndex) => (
                  <p
                    key={pIndex}
                    className="text-sm sm:text-base text-neutral-700 leading-relaxed font-normal"
                  >
                    {renderFormattedText(para)}
                  </p>
                ))}
              </div>

              {/* Subsections if present */}
              {section.subsections && section.subsections.length > 0 && (
                <div className="space-y-6 pt-2">
                  {section.subsections.map((sub, subIdx) => (
                    <div key={subIdx} className="space-y-2 pl-4 border-l-2 border-neutral-200">
                      <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                        {sub.title}
                      </h3>
                      {sub.paragraphs.map((subPara, spIdx) => (
                        <p
                          key={spIdx}
                          className="text-sm sm:text-base text-neutral-700 leading-relaxed font-normal"
                        >
                          {renderFormattedText(subPara)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Stat Callout */}
              {section.statCallout && (
                <div className="rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white p-5 flex items-center gap-5 shadow-2xs">
                  <div className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight shrink-0 text-mint-600">
                    {section.statCallout.number}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-0.5">
                      {section.statCallout.label}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                      {section.statCallout.context}
                    </p>
                  </div>
                </div>
              )}

              {/* Structured Comparison / Benchmark Table */}
              {section.table && (
                <div className="space-y-2">
                  {section.table.caption && (
                    <p className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5 text-neutral-400" />
                      <span>{section.table.caption}</span>
                    </p>
                  )}
                  <div className="overflow-x-auto rounded-xl border border-neutral-200">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-neutral-100 text-neutral-900 font-bold border-b border-neutral-200">
                        <tr>
                          {section.table.headers.map((h, hIdx) => (
                            <th key={hIdx} className="py-2.5 px-4 font-black">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {section.table.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-neutral-50/80 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td
                                key={cIdx}
                                className={`py-2.5 px-4 text-neutral-700 ${
                                  cIdx === 0 ? 'font-bold text-neutral-900' : ''
                                }`}
                              >
                                {renderFormattedText(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actionable Checklist if present */}
              {section.checklist && section.checklist.length > 0 && (
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Action Checklist</span>
                  </h4>
                  <ul className="space-y-2">
                    {section.checklist.map((item, cIndex) => (
                      <li
                        key={cIndex}
                        className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 mt-2 shrink-0" />
                        <span className="leading-relaxed">{renderFormattedText(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pro Tip Callout */}
              {section.proTip && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1">
                      Pro Tip
                    </h4>
                    <p className="text-xs sm:text-sm text-blue-950 leading-relaxed">
                      {renderFormattedText(section.proTip)}
                    </p>
                  </div>
                </div>
              )}

              {/* Code Snippet */}
              {section.codeSnippet && (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 text-neutral-100 overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2 bg-neutral-900 text-xs text-neutral-400">
                    <span className="font-mono text-[11px]">{section.codeSnippet.title}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopySnippet(section.codeSnippet!.code, sIndex)
                      }
                      className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedSnippetIdx === sIndex ? (
                        <>
                          <Check className="h-3 w-3 text-mint-400" />
                          <span className="text-mint-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-neutral-200 leading-relaxed">
                    <code>{section.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {/* Quote Block */}
              {section.quote && (
                <blockquote className="rounded-xl border-l-4 border-mint-500 bg-neutral-50 p-5 italic text-neutral-800 text-sm sm:text-base leading-relaxed">
                  <p>&ldquo;{section.quote.text}&rdquo;</p>
                  <footer className="mt-2 text-xs font-bold not-italic text-neutral-600">
                    — {section.quote.author}
                  </footer>
                </blockquote>
              )}
            </section>
          ))}

          {/* Tags */}
          <div className="pt-6 border-t border-neutral-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 mr-1 flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" />
              Tags:
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-lg bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Internal SEO Hub Links */}
          {post.relatedInternalLinks && post.relatedInternalLinks.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-neutral-500" />
                <span>Related TopSAAS Tools & Resources</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {post.relatedInternalLinks.map((link, lIdx) => (
                  <button
                    key={lIdx}
                    type="button"
                    onClick={() => {
                      playSound('click', soundEnabled);
                      navigateTo(link.href);
                    }}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-800 hover:border-neutral-300 hover:text-blue-600 transition-colors cursor-pointer text-left shadow-2xs"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mid-Article / End-of-Article CTA */}
          <div className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-900 to-neutral-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-mint-400">
                <Rocket className="h-3.5 w-3.5" />
                <span>TopSAAS Launchpad</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Building something cool?
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md">
                Submit your SaaS to the TopSAAS directory. Get discovered, climb the leaderboard, and earn high-authority backlinks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                playSound('click', soundEnabled);
                navigateTo('/submit');
              }}
              className="btn-primary rounded-xl px-5 py-2.5 text-xs font-bold text-white shrink-0 cursor-pointer shadow-md"
            >
              Submit Your Product
            </button>
          </div>

          {/* FAQ Section */}
          {post.faq && post.faq.length > 0 && (
            <div className="pt-4 border-t border-neutral-100 space-y-6">
              <h3 className="text-lg sm:text-xl font-black text-neutral-950 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-neutral-400" />
                <span>Frequently Asked Questions</span>
              </h3>

              <div className="space-y-4">
                {post.faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-2"
                  >
                    <h4 className="text-sm font-bold text-neutral-900">{item.q}</h4>
                    <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                      {renderFormattedText(item.a)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="mt-14 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-neutral-950">
                More Playbooks from TopSAAS
              </h3>
              <button
                type="button"
                onClick={() => {
                  playSound('click', soundEnabled);
                  navigateTo('/blog');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View all articles →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedPosts.map((rel) => (
                <div
                  key={rel.slug}
                  onClick={() => {
                    playSound('click', soundEnabled);
                    navigateTo(`/blog/${rel.slug}`);
                  }}
                  className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-2xs hover:border-neutral-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-mint-700 bg-mint-50 px-2 py-0.5 rounded-md">
                        {rel.category}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {rel.readTime}
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-neutral-950 group-hover:text-blue-600 transition-colors">
                      {rel.title}
                    </h4>

                    <p className="mt-2 text-xs text-neutral-600 line-clamp-2">
                      {rel.tagline}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-500">
                      {rel.author.name}
                    </span>
                    <span className="font-bold text-neutral-900 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex items-center gap-1">
                      Read
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
