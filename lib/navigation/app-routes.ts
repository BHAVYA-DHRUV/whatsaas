/** First URL segments that are app routes, not locales (next-intl [locale] collision). */
export const APP_PATH_ROOTS = [
  'dashboard',
  'inbox',
  'pipeline',
  'contacts',
  'campaigns',
  'calls',
  'automation',
  'analytics',
  'templates',
  'settings',
  'pricing',
  'admin',
  'sign-in',
  'sign-up',
  'forgot-password',
  'reset-password',
  'contact',
  'docs',
  'privacy',
  'terms',
  'onboarding',
] as const;

export function isAppPathRoot(segment: string): boolean {
  return (APP_PATH_ROOTS as readonly string[]).includes(segment);
}

export const PROTECTED_APP_ROOTS = [
  'dashboard',
  'inbox',
  'pipeline',
  'contacts',
  'campaigns',
  'calls',
  'automation',
  'analytics',
  'templates',
  'settings',
  'admin',
  'onboarding',
  'pricing',
] as const;
