import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db/drizzle';

const DEFAULT_BRANDING = {
  id: 0,
  name: 'WhatsSaaS',
  logoUrl: null as string | null,
  faviconUrl:
    'https://img.magnific.com/premium-vector/whatsapp-vector-logo-icon-logotype-vector-social-media_901408-406.jpg?semt=ais_hybrid&w=740&q=80',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const loadBranding = unstable_cache(
  async () => {
    try {
      const branding = await db.query.branding.findFirst();
      return branding ?? DEFAULT_BRANDING;
    } catch (error) {
      console.error('Branding Query Error:', error);
      return DEFAULT_BRANDING;
    }
  },
  ['site-branding'],
  { revalidate: 600, tags: ['branding'] }
);

export async function getBranding() {
  return loadBranding();
}
