import { locales, defaultLocale } from '@/i18n/request';
import { isAppPathRoot } from '@/lib/navigation/app-routes';
import { pathWithoutLocale } from '@/lib/navigation/path-utils';

type Locale = (typeof locales)[number];

/**
 * App routes like /dashboard collide with [locale].
 * Map public URL → internal /{locale}/dashboard via rewrite (avoids next-intl 307 loops).
 */
export function resolveInternalAppPath(pathname: string): string | null {
  const pathNoLocale = pathWithoutLocale(pathname);
  const segments = pathNoLocale.split('/').filter(Boolean);
  const appRoot = segments[0];

  if (!appRoot || !isAppPathRoot(appRoot)) {
    return null;
  }

  const firstSeg = pathname.split('/').filter(Boolean)[0] ?? '';
  const locale: Locale = locales.includes(firstSeg as Locale)
    ? (firstSeg as Locale)
    : defaultLocale;

  return `/${locale}${pathNoLocale}`;
}
