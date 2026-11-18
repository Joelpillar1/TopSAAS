// Plain-text sanitizer for repo copy: strips emoji and em-dashes so rendered
// page copy stays consistent (no emoji, no em-dashes anywhere).
export const plainCopy = (text: string): string =>
  text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\u2014/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: ' - ',
  ndash: ' - ',
  hellip: '...',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
};

/**
 * Strips HTML tags and decodes common entities. Product descriptions come from
 * the submission form and can contain rich text, so every place that renders
 * them as plain copy (meta description, FAQ answers, intro paragraph) needs
 * this first.
 */
export const stripMarkup = (text: string): string =>
  text
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
      const key = code.toLowerCase();
      if (key.startsWith('#x')) return String.fromCharCode(parseInt(key.slice(2), 16));
      if (key.startsWith('#')) return String.fromCharCode(parseInt(key.slice(1), 10));
      return NAMED_ENTITIES[key] ?? match;
    })
    .replace(/\s+/g, ' ')
    .trim();

/** Cuts plain text at a sentence boundary near the requested length. */
export const firstSentences = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  const window = text.slice(0, maxLength);
  const cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '));
  if (cut > maxLength * 0.4) return window.slice(0, cut + 1).trim();
  const lastSpace = window.lastIndexOf(' ');
  const safe = lastSpace > maxLength * 0.6 ? window.slice(0, lastSpace) : window;
  return `${safe.trim()}...`;
};
