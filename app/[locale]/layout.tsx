import '../globals.css';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/request';
import { setRequestLocale } from 'next-intl/server';

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

  if (!locales.includes(locale as any)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <div className="bg-background text-foreground min-h-dvh">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
