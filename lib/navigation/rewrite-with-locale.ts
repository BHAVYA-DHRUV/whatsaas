import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/request';

/** Header next-intl reads for `getRequestLocale()` on rewritten requests. */
export const NEXT_INTL_LOCALE_HEADER = 'X-NEXT-INTL-LOCALE';

type Locale = (typeof locales)[number];

export function localeFromInternalPath(internalPath: string): Locale {
  const seg = internalPath.split('/').filter(Boolean)[0] ?? '';
  return locales.includes(seg as Locale) ? (seg as Locale) : defaultLocale;
}

/** Rewrite to an internal /{locale}/… path and pass locale to Server Components. */
export function rewriteWithLocale(
  request: NextRequest,
  internalPath: string
): NextResponse {
  const locale = localeFromInternalPath(internalPath);
  const url = new URL(internalPath, request.url);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NEXT_INTL_LOCALE_HEADER, locale);

  return NextResponse.rewrite(url, {
    request: { headers: requestHeaders },
  });
}
