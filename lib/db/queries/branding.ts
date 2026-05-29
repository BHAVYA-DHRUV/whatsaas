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

const queryWithTimeout = <T>(promise: Promise<T>, ms = 2500): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Database query timed out after ${ms}ms`)), ms);

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => clearTimeout(timer));
  });
};

const loadBranding = unstable_cache(
  async () => {
    try {
      const branding = await queryWithTimeout(db.query.branding.findFirst(), 2500);
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
