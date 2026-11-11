/**
 * App-name URL slug utilities
 * Uses concise, clean app names instead of long slugs or taglines.
 * e.g. "Cvarchitect" -> "cvarchitect"
 *      "TopSAAS" -> "topsaas"
 *      "Linear: Issue Tracker" -> "linear"
 *      "Notion — All-in-one workspace" -> "notion"
 */

/**
 * Extracts the primary app name, stripping any promotional tagline or subtitle
 * separated by colons, pipes, em-dashes, en-dashes, or " - ".
 */
export function getAppName(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  const split = trimmed.split(/\s*[:|–—]\s*|\s+-\s+/);
  return split[0]?.trim() || trimmed;
}

/**
 * Converts a string into a clean, concise app-name slug.
 * e.g. "Cvarchitect" -> "cvarchitect"
 *      "TopSAAS" -> "topsaas"
 */
export function slugify(text: string | null | undefined): string {
  if (!text) return '';
  const appName = getAppName(text);
  return appName
    .normalize('NFKD') // decompose diacritics
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[\s_.]+/g, '-') // spaces, underscores, dots to single hyphen
    .replace(/[^a-z0-9-]/g, '') // remove non-alphanumeric chars
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, ''); // strip leading/trailing hyphens
}

/**
 * Returns the app-name slug for any product or submission.
 * Falls back to item.id if no clean name is available.
 */
export function getProductSlug(item?: { id: string; name?: string; title?: string } | null): string {
  if (!item) return '';
  const rawName = item.name || (item as { title?: string }).title;
  const slug = slugify(rawName);
  return slug || item.id;
}

/**
 * Checks whether an incoming identifier (from URL pathname /products/:name or route param)
 * matches a product by its ID, canonical ID, bare ID, app name, or slug.
 * Works universally across all products.
 */
export function matchesProductIdentifier(
  product: { id: string; name?: string } | null | undefined,
  identifier: string | null | undefined
): boolean {
  if (!product || !identifier) return false;

  const rawIdent = decodeURIComponent(identifier).trim().toLowerCase();
  if (!rawIdent) return false;

  const prodId = product.id.toLowerCase().trim();
  const prodBare = prodId.startsWith('prod-') ? prodId.replace(/^prod-/, '') : prodId;
  const identBare = rawIdent.startsWith('prod-') ? rawIdent.replace(/^prod-/, '') : rawIdent;

  // 1. Direct ID match (canonical or bare)
  if (prodId === rawIdent || prodBare === identBare || prodId === `prod-${identBare}` || `prod-${prodBare}` === rawIdent) {
    return true;
  }

  // 2. Name & Slug matches
  if (product.name) {
    const prodNameLower = product.name.toLowerCase().trim();
    const appNameLower = getAppName(product.name).toLowerCase().trim();
    const prodSlug = slugify(product.name);
    const identSlug = slugify(rawIdent);

    // Exact slug match (e.g. 'cvarchitect', 'topsaas')
    if (prodSlug && (prodSlug === identSlug || prodSlug === rawIdent)) {
      return true;
    }

    // Direct name match (e.g. 'Cvarchitect', 'TopSAAS')
    if (prodNameLower === rawIdent || prodNameLower === identBare) {
      return true;
    }

    // Short app name match
    if (appNameLower && (appNameLower === rawIdent || appNameLower === identSlug)) {
      return true;
    }

    // Spaced name matching hyphenated identifier (e.g. 'my-cool-app' matching 'my cool app')
    const unhyphenatedIdent = rawIdent.replace(/-/g, ' ');
    if (prodNameLower === unhyphenatedIdent || appNameLower === unhyphenatedIdent) {
      return true;
    }
  }

  return false;
}
