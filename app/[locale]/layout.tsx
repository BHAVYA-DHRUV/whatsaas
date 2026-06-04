import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import { setRequestLocale } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { ColorThemeHandler } from '@/components/layout/color-theme-handler';

export const viewport: Viewport = {
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Whats SaaS',
    description:
      'Get started quickly with a WhatsApp CRM designed to manage leads, conversations, and sales in one place.',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await Promise.race([
    getMessages(),
    new Promise((resolve) => setTimeout(() => resolve({}), 2000))
  ]) as any;

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <div className="bg-background text-foreground min-h-dvh">
          {children}
        </div>
        <ColorThemeHandler />
        <Toaster richColors closeButton position="top-right" />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
