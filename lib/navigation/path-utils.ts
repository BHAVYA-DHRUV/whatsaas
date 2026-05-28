/** Strip optional locale prefix from pathname (next-intl). */
export function pathWithoutLocale(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|pt|es)(?=\/|$)/, '');
  if (!stripped || stripped === '') return '/';
  return stripped.startsWith('/') ? stripped : `/${stripped}`;
}
