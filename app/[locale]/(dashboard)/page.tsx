import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('LandingPage');

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background">
      <span className="mb-6 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
        {t('hero.badge')}
      </span>

      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground md:text-6xl">
        {t('hero.title_part1')}{' '}
        <span className="text-transparent bg-linear-to-r from-primary to-purple-600 bg-clip-text">
          {t('hero.title_part2')}
        </span>
      </h1>

      <p className="max-w-2xl mt-6 text-lg text-muted-foreground md:text-xl">
        {t('hero.subtitle')}
      </p>

      <div className="flex flex-col gap-4 mt-10 sm:flex-row">
        <Link href="/sign-up" className="inline-flex items-center px-8 py-3 text-base font-semibold transition rounded-full shadow-lg bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90">
          {t('hero.cta_primary')} <span aria-hidden="true" className="ml-2">→</span>
        </Link>
        <Link href="/docs" className="inline-flex items-center px-8 py-3 text-base font-semibold transition border rounded-full border-border bg-background text-foreground hover:bg-muted">
          {t('hero.cta_secondary')}
        </Link>
      </div>
    </main>
  );
}
