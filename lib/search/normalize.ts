/**
 * lib/search/normalize.ts
 *
 * Shared search normalization utilities used by:
 * - /api/chats/search
 * - /api/search
 * - HighlightMatch (client-side)
 *
 * WhatsApp Web-like behavior:
 *  • Case-insensitive
 *  • Strips symbols: - _ . + ( ) [ ] spaces (leading/trailing/multiple)
 *  • Phone numbers matched digit-only (strip all non-digits)
 *  • Partial matching on names, phones, message content
 */

/**
 * Normalize a text search query:
 * 1. Trim leading/trailing whitespace
 * 2. Collapse multiple internal spaces to one
 * 3. Strip common punctuation/symbols: - _ . + ( ) [ ] { }
 * 4. Lowercase
 *
 * Examples:
 *   " john " → "john"
 *   "john.doe" → "john doe"
 *   "90160-61520" → "90160 61520"
 *   "+91 9016 61520" → "91 9016 61520"
 *   " KRUTIK " → "krutik"
 */
export function normalizeQuery(q: string): string {
  return q
    .trim()
    .replace(/[-_.+()[\]{}]/g, ' ') // replace symbols with space
    .replace(/\s+/g, ' ')           // collapse multiple spaces
    .trim()
    .toLowerCase();
}

/**
 * Strip ALL non-digit characters from a string.
 * Used to normalize phone numbers for digit-only comparison.
 *
 * Examples:
 *   "+91 90160 61520" → "919016061520"
 *   "90160-61520"     → "9016061520"
 *   "9016"            → "9016"
 */
export function normalizePhone(p: string): string {
  return p.replace(/\D/g, '');
}

/**
 * Returns true when a string contains only digits (after trimming).
 * Used to detect phone-number-only queries.
 */
export function isDigitOnlyQuery(q: string): boolean {
  return /^\d+$/.test(q.trim());
}

/**
 * Build a PostgreSQL ILIKE pattern from a normalized query.
 * Wraps value in % wildcards for partial matching.
 *
 * Example: "john" → "%john%"
 */
export function likePattern(normalized: string): string {
  return `%${normalized}%`;
}

/**
 * Check whether a candidate text string matches the search query
 * using the same normalization rules — for CLIENT-SIDE filtering.
 *
 * Supports:
 *  - Case-insensitive
 *  - Symbol stripping
 *  - Partial match
 *
 * @param text     The text to search within (e.g. chat name, message)
 * @param query    The raw user-typed query
 */
export function matchesQuery(text: string | null | undefined, query: string): boolean {
  if (!text || !query) return false;
  const normText = normalizeQuery(text);
  const normQuery = normalizeQuery(query);
  if (!normQuery) return false;
  return normText.includes(normQuery);
}

/**
 * Check whether a phone string matches a digit-only query.
 * Strips all non-digits from both sides, then does substring check.
 *
 * Example:
 *   matchesPhone("+91 90160 61520", "9016") → true
 *   matchesPhone("+91 90160 61520", "61520") → true
 */
export function matchesPhone(phone: string | null | undefined, query: string): boolean {
  if (!phone || !query) return false;
  const normPhone = normalizePhone(phone);
  const normQuery = normalizePhone(query);
  if (!normQuery) return false;
  return normPhone.includes(normQuery);
}
