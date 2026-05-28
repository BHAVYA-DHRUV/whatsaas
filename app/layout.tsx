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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const branding = await getBranding()

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{branding.name}</title>
        {branding.faviconUrl && (
          <link rel="icon" href={branding.faviconUrl} />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}