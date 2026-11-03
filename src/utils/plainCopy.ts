// Plain-text sanitizer for repo copy: strips emoji and em-dashes so rendered
// page copy stays consistent (no emoji, no em-dashes anywhere).
export const plainCopy = (text: string): string =>
  text
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\u2014/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim();
