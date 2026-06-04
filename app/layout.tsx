// import './globals.css';

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en" suppressHydrationWarning>
//       <body>{children}</body>
//     </html>
//   );
// }

import './globals.css'
import { getBranding } from '@/lib/db/queries/branding'

const DEFAULT_BRANDING = {
  name: 'WhatsSaaS',
  faviconUrl: 'https://img.magnific.com/premium-vector/whatsapp-vector-logo-icon-logotype-vector-social-media_901408-406.jpg?semt=ais_hybrid&w=740&q=80',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Non-blocking: fetch branding with timeout, use default on error
  let branding = DEFAULT_BRANDING
  try {
    branding = await Promise.race([
      getBranding(),
      new Promise((resolve) => setTimeout(() => resolve(DEFAULT_BRANDING), 1000))
    ]) as typeof branding
  } catch (error) {
    console.error('[RootLayout] Branding fetch failed, using default:', error)
    branding = DEFAULT_BRANDING
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{branding.name || DEFAULT_BRANDING.name}</title>
        <link rel="icon" href={branding.faviconUrl || DEFAULT_BRANDING.faviconUrl} />
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const saved = localStorage.getItem('color-theme') || 'default';
            document.documentElement.classList.add('theme-' + saved);
          } catch (e) {}
        `}} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}