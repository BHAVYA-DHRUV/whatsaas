'use client';

import { ThemeProvider } from '@/components/theme-provider';
import { APP_THEME_IDS } from '@/lib/themes/config';
import { Toaster } from 'sonner';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      themes={[...APP_THEME_IDS, 'system']}
      disableTransitionOnChange={false}
    >
      {children}
      <Toaster richColors closeButton position="top-right" />
    </ThemeProvider>
  );
}
