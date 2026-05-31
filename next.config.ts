import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

type ExtendedNextConfig = NextConfig & {
  typescript?: {
    ignoreBuildErrors?: boolean;
  };
};

const nextConfig: ExtendedNextConfig = {
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next' : '.next-prod'),
  outputFileTracingRoot: path.resolve(__dirname),
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-popover'],
  },
  webpack(config, { dev, isServer }) {
    if (dev) {
      config.cache = true;
      config.devtool = false;
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.next/**',
          '**/node_modules/**',
          '**/evolution-api/**',
          '**/workers/**',
          '**/docker/**',
          '**/logs/**',
          '**/dist/**',
        ],
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default withNextIntl(nextConfig);
