import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Check,
  Copy,
  BookOpen,
  Rocket,
  ChevronRight,
  ExternalLink,
  Tag,
  CheckCircle2,
  HelpCircle,
  Calendar,
  BarChart2,
  Link2,
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
          {renderFormattedText(match[4])}
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

    const toIsoDate = (dateStr: string) => {
      const parsed = Date.parse(dateStr);
      return Number.isNaN(parsed) ? '2026-11-28T08:00:00Z' : new Date(parsed).toISOString();
    };

    const blogPostingSchema = {
      '@type': ['Article', 'BlogPosting'],
      '@id': `${postUrl}#article`,
      headline: post.title,
      description: post.tagline,
      ...(post.coverImage ? { image: `https://www.topsaas.space${post.coverImage}` } : {}),
      datePublished: toIsoDate(post.publishedAt),
      dateModified: toIsoDate(post.updatedAt),
      mainEntityOfPage: postUrl,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.direct-answer-text', '.article-title'],
      },
      author: {
        '@type': 'Person',
        name: post.author.name,
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
      `"${post.title}" by Joel Pillar on TopSAAS: ${post.tagline}`
    );
    const url = encodeURIComponent(
      typeof window !== 'undefined'
        ? window.location.href
        : `https://www.topsaas.space/blog/${post.slug}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}&via=joelpillar51`,
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
    <article className="w-full pb-16 pt-2 sm:pt-4">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
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

        {/* Article Header (Outside Global Body Frame) */}
        <header className="pb-6 border-b border-neutral-200/80">
          <div className="mb-4">
            <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/80 px-3 py-0.5 text-xs font-bold text-blue-700">
              {post.category}
            </span>
          </div>

          <h1 className="article-title text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-neutral-950 leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
            {post.tagline}
          </p>

          {/* Author & Share Block */}
          <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-neutral-950">
                  By {post.author.name}
                </p>
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 shrink-0 text-blue-600"
                  aria-label="Verified author"
                  role="img"
                >
                  <path
                    fill="currentColor"
                    d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"
                  />
                </svg>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs font-medium text-neutral-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-neutral-400" />
                  {post.publishedAt}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-neutral-400" />
                  {post.readTime}
                </span>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareTwitter}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
                title="Share on X"
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
                    <Check className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-blue-600">Copied!</span>
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

        {/* Feature Image (if provided) */}
        {post.coverImage && (
          <div className="mt-8 rounded-2xl border border-neutral-200/90 overflow-hidden shadow-xs bg-white">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full aspect-[16/9] object-cover"
            />
          </div>
        )}

        {/* Global Frame for the Entire Blog Body */}
        <div className="mt-8 rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-10">
          {/* AEO / AI Overview Direct Answer (Unframed, no icon) */}
          {post.directAnswer && (
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                Direct Answer & Core Definition (TL;DR)
              </h2>
              <p className="direct-answer-text text-sm sm:text-base text-neutral-800 font-medium leading-relaxed">
                {renderFormattedText(post.directAnswer)}
              </p>
            </div>
          )}

          {/* Key Takeaways (Unframed, no heading icon, app theme blue bullet checkmarks) */}
          {post.keyTakeaways && post.keyTakeaways.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-neutral-900">
                Key Takeaways for Founders
              </h2>
              <ul className="space-y-2.5">
                {post.keyTakeaways.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm sm:text-base text-neutral-700"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-bold text-xs mt-0.5">
                      ✓
                    </span>
                    <span className="leading-relaxed">{renderFormattedText(point)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table of Contents */}
          {post.sections && post.sections.length > 1 && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 shadow-2xs">
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
                      <span className="text-blue-600 font-mono text-xs font-bold">{idx + 1}.</span>
                      <span>{sec.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

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
          <div className="space-y-12">
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
                      <div key={subIdx} className="space-y-2 pl-4 border-l-2 border-blue-200">
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

                {/* Stat Callout (Clean neutral border, removed loud colored gradient) */}
                {section.statCallout && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 flex items-center gap-5 shadow-2xs">
                    <div className="text-3xl sm:text-4xl font-black text-blue-600 tracking-tight shrink-0">
                      {section.statCallout.number}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-0.5">
                        {section.statCallout.label}
                      </h4>
                      <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
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
                                  className={`py-2.5 px-4 text-neutral-700 ${cIdx === 0 ? 'font-bold text-neutral-900' : ''
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

                {/* Actionable Checklist (App theme bullet indicator in blue) */}
                {section.checklist && section.checklist.length > 0 && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <span>Action Checklist</span>
                    </h4>
                    <ul className="space-y-2">
                      {section.checklist.map((item, cIndex) => (
                        <li
                          key={cIndex}
                          className="flex items-start gap-2.5 text-sm sm:text-base text-neutral-700"
                        >
                          <span className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0 ring-4 ring-blue-50" />
                          <span className="leading-relaxed">{renderFormattedText(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pro Tip Callout (Clean neutral border, no icon) */}
                {section.proTip && (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5">
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider mb-1">
                      Pro Tip
                    </h4>
                    <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                      {renderFormattedText(section.proTip)}
                    </p>
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
                            <Check className="h-3 w-3 text-blue-400" />
                            <span className="text-blue-400">Copied</span>
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

                {/* Quote Block (App theme blue border) */}
                {section.quote && (
                  <blockquote className="rounded-xl border-l-4 border-blue-600 bg-neutral-50/50 p-5 italic text-neutral-800 text-sm sm:text-base leading-relaxed">
                    <p>&ldquo;{section.quote.text}&rdquo;</p>
                    <footer className="mt-2 text-xs font-bold not-italic text-neutral-600">
                      — {section.quote.author}
                    </footer>
                  </blockquote>
                )}
              </section>
            ))}
          </div>

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
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3">
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
                    <p className="text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                      {renderFormattedText(item.a)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sections outside the global frame: Launchpad CTA & Related Articles */}
        <div className="mt-12 space-y-12">
          {/* Mid-Article / End-of-Article CTA */}
          <div className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="space-y-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-400">
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

          {/* Related Articles */}
          {relatedPosts.length > 0 && (
            <div className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedPosts.map((related) => (
                  <div
                    key={related.slug}
                    onClick={() => {
                      playSound('click', soundEnabled);
                      navigateTo(`/blog/${related.slug}`);
                    }}
                    className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs hover:border-neutral-300 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {related.category}
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-neutral-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                        {related.title}
                      </h4>
                      <p className="mt-1.5 text-xs text-neutral-500 line-clamp-2">
                        {related.tagline}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{related.readTime}</span>
                      <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                        Read →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
