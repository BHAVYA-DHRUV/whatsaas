'use client';

/**
 * HighlightMatch — WhatsApp Web-style text highlight component.
 *
 * Features:
 *  - Case-insensitive matching
 *  - Symbol-stripping normalization (john.doe highlights in "John Doe")
 *  - Phone digit-only matching (9016 highlights in "+91 90160 61520")
 *  - Multi-word highlight support
 *  - Renders original text with highlight spans at correct offsets
 */

import React from 'react';
import { normalizeQuery, normalizePhone, isDigitOnlyQuery } from '@/lib/search/normalize';

type Props = {
  text: string | null | undefined;
  query: string;
};

/**
 * Find all character ranges [start, end) in `text` where `query` (normalized)
 * appears, accounting for symbol stripping. Returns ranges in the ORIGINAL text.
 *
 * Strategy for text queries:
 *   Normalize both text and query → find matches in normalized text →
 *   map positions back to original text character positions.
 *
 * Strategy for phone-only queries:
 *   Strip all non-digits from text → find digit positions → highlight
 *   the corresponding original characters.
 */
function findMatchRanges(
  text: string,
  query: string
): Array<[number, number]> {
  if (!text || !query.trim()) return [];

  const isPhone = isDigitOnlyQuery(query.trim());

  if (isPhone) {
    return findPhoneMatchRanges(text, query.trim());
  }

  return findTextMatchRanges(text, query);
}

/**
 * For digit-only queries: find substrings in `text` whose digit sequence
 * contains the query digits as a contiguous substring.
 */
function findPhoneMatchRanges(text: string, digitQuery: string): Array<[number, number]> {
  const normDigitQuery = normalizePhone(digitQuery);
  if (!normDigitQuery) return [];

  // Build a map from digit-index → original char index
  const digitPositions: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) {
      digitPositions.push(i);
    }
  }

  const digitStr = digitPositions.map((pos) => text[pos]).join('');

  const ranges: Array<[number, number]> = [];
  let searchFrom = 0;

  while (searchFrom < digitStr.length) {
    const idx = digitStr.indexOf(normDigitQuery, searchFrom);
    if (idx === -1) break;

    // Map digit positions back to original character positions
    const origStart = digitPositions[idx];
    const origEnd = digitPositions[idx + normDigitQuery.length - 1] + 1;

    if (origStart !== undefined && origEnd !== undefined) {
      ranges.push([origStart, origEnd]);
    }
    searchFrom = idx + 1;
  }

  return ranges;
}

/**
 * For text queries: normalize both text and query, find matches in
 * normalized space, then map back to original character positions.
 *
 * Normalization used: lowercase + strip symbols (- _ . + ( ) [ ] { })
 * into spaces, collapse spaces. We track a char-map: normIdx → origIdx.
 */
function findTextMatchRanges(text: string, query: string): Array<[number, number]> {
  const normQueryStr = normalizeQuery(query);
  if (!normQueryStr) return [];

  // Build normalized version of text while keeping a map
  // normIndex → origIndex for each character in the normalized string.
  const normChars: string[] = [];
  const normToOrig: number[] = [];

  let prevWasSpace = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const isSymbol = /[-_.+()[\]{}]/.test(ch);
    const isWhitespace = /\s/.test(ch);

    if (isSymbol || isWhitespace) {
      // Collapse into single space
      if (!prevWasSpace && normChars.length > 0) {
        normChars.push(' ');
        normToOrig.push(i);
        prevWasSpace = true;
      }
    } else {
      normChars.push(ch.toLowerCase());
      normToOrig.push(i);
      prevWasSpace = false;
    }
  }

  // Trim trailing space from normalized
  let normText = normChars.join('');
  // also strip leading space
  let startOffset = 0;
  if (normText.startsWith(' ')) {
    normText = normText.slice(1);
    startOffset = 1;
  }

  const ranges: Array<[number, number]> = [];
  let searchFrom = 0;

  while (searchFrom <= normText.length - normQueryStr.length) {
    const idx = normText.indexOf(normQueryStr, searchFrom);
    if (idx === -1) break;

    const normStartIdx = startOffset + idx;
    const normEndIdx = startOffset + idx + normQueryStr.length - 1;

    if (normStartIdx < normToOrig.length && normEndIdx < normToOrig.length) {
      const origStart = normToOrig[normStartIdx];
      const origEnd = normToOrig[normEndIdx] + 1;
      ranges.push([origStart, origEnd]);
    }

    searchFrom = idx + 1;
  }

  return ranges;
}

/**
 * Merge overlapping or adjacent ranges.
 */
function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1]);
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HighlightMatch({ text, query }: Props) {
  if (!text) return null;
  if (!query?.trim()) return <span>{text}</span>;

  const rawRanges = findMatchRanges(text, query);
  const ranges = mergeRanges(rawRanges);

  if (ranges.length === 0) {
    // No highlight found — render plain text (still show it)
    return <span>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const [start, end] of ranges) {
    if (cursor < start) {
      parts.push(<span key={`plain-${cursor}`}>{text.slice(cursor, start)}</span>);
    }
    parts.push(
      <mark
        key={`mark-${start}`}
        className="bg-yellow-200 dark:bg-yellow-800/80 dark:text-yellow-100 rounded-[2px] px-[1px] not-italic"
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  }

  if (cursor < text.length) {
    parts.push(<span key={`plain-end`}>{text.slice(cursor)}</span>);
  }

  return <span>{parts}</span>;
}
