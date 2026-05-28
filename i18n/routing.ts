import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'en',
  /** Keep locale prefixes explicit so /en and /pt routes resolve consistently in dev and production. */
  localePrefix: 'always',
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);