import { NextResponse, NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { PROTECTED_APP_ROOTS } from '@/lib/navigation/app-routes';
import { resolveInternalAppPath } from '@/lib/navigation/resolve-internal-path';
import { pathWithoutLocale } from '@/lib/navigation/path-utils';
import { rewriteWithLocale } from '@/lib/navigation/rewrite-with-locale';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

function isProtectedPath(pathWithoutLocaleValue: string): boolean {
  return PROTECTED_APP_ROOTS.some(
    (root) =>
      pathWithoutLocaleValue === `/${root}` ||
      pathWithoutLocaleValue.startsWith(`/${root}/`)
  );
}

function attachPathHeader(response: NextResponse, pathname: string) {
  response.headers.set('x-pathname', pathname);
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathNoLocale = pathWithoutLocale(pathname);
  const sessionCookie = request.cookies.get('session');

  if (isProtectedPath(pathNoLocale) && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  const internalPath = resolveInternalAppPath(pathname);
  const response = internalPath
    ? rewriteWithLocale(request, internalPath)
    : intlMiddleware(request);

  return attachPathHeader(response, pathname);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads|sounds).*)'],
};
