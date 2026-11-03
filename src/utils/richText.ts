/**
 * Rich-text helpers used by the submission editor, the profile editor and the
 * public product page.
 *
 * Content is stored as sanitized HTML. Because the same HTML is rendered on
 * the live listing page, every producer/consumer must go through these helpers
 * so the editor preview and the published page look identical.
 */

const TAG_RE = /<\/?[a-z][^>]*>/i;

/** Tags that are allowed to survive sanitization. */
const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'S',
  'STRIKE',
  'DEL',
  'H2',
  'H3',
  'H4',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'CODE',
  'PRE',
  'A',
]);

/** Dangerous / unsupported tags are removed together with their content. */
const BLOCKED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'FORM',
  'INPUT',
  'TEXTAREA',
  'BUTTON',
  'SELECT',
  'OPTION',
  'SVG',
  'MATH',
  'IMG',
  'VIDEO',
  'AUDIO',
  'SOURCE',
  'LINK',
  'META',
  'BASE',
  'TITLE',
]);

const SAFE_HREF_RE = /^(https?:\/\/|mailto:|tel:|\/|#)/i;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Turn plain text into paragraphs while preserving line breaks. */
const plainTextToHtml = (value: string): string =>
  value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => escapeHtml(line))
    .join('<br>');

const hasDom = (): boolean =>
  typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined';

const sanitizeNode = (node: Node, doc: Document): void => {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) continue;
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.parentNode?.removeChild(child);
      continue;
    }

    const el = child as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (BLOCKED_TAGS.has(tag)) {
      el.remove();
      continue;
    }

    sanitizeNode(el, doc);

    if (!ALLOWED_TAGS.has(tag)) {
      // Unknown tags (span, font, mark, div…) are unwrapped so their text and
      // formatting children are kept without leaking classes/styles.
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
      continue;
    }

    // Strip every attribute except safe link attributes.
    for (const attr of Array.from(el.attributes)) {
      const keep = tag === 'A' && (attr.name === 'href' || attr.name === 'title');
      if (!keep) el.removeAttribute(attr.name);
    }

    if (tag === 'A') {
      const href = (el.getAttribute('href') || '').trim();
      if (href && SAFE_HREF_RE.test(href)) {
        el.setAttribute('href', href);
      } else {
        el.removeAttribute('href');
      }
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  }
};

/**
 * Sanitize stored editor HTML. Plain text (legacy submissions) is escaped and
 * its newlines are preserved, so old listings keep rendering correctly.
 */
export function sanitizeRichText(input?: string | null): string {
  if (!input) return '';
  const value = String(input);
  if (!value.trim()) return '';

  if (!TAG_RE.test(value)) return plainTextToHtml(value);

  if (!hasDom()) return plainTextToHtml(value);

  const doc = new window.DOMParser().parseFromString(value, 'text/html');
  sanitizeNode(doc.body, doc);

  const cleaned = doc.body.innerHTML.trim();
  // Treat formatting-only markup (e.g. "<p><br></p>") as empty.
  if (!doc.body.textContent?.trim()) {
    const hasStructure = /<(ul|ol|blockquote|pre|h2|h3|h4)[\s>]/i.test(cleaned);
    if (!hasStructure) return '';
  }
  return cleaned;
}

/** Plain-text projection used for counters, validation and previews. */
export function richTextToPlain(input?: string | null): string {
  if (!input) return '';
  const value = String(input);
  if (!TAG_RE.test(value)) return value;
  if (!hasDom()) {
    return value
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  const doc = new window.DOMParser().parseFromString(value, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Value persisted to the database: sanitized HTML, or an empty string when the
 * user only left blank formatting behind.
 */
export function prepareRichText(input?: string | null): string {
  const cleaned = sanitizeRichText(input);
  if (!cleaned) return '';
  if (!richTextToPlain(cleaned).trim()) return '';
  return cleaned;
}
