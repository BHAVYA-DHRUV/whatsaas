import path from 'node:path';
import fs from 'node:fs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// Automatically delete deprecated middleware.ts if proxy.ts is present
// to prevent Next.js from throwing boot conflicts.
const oldMiddlewarePath = path.resolve(__dirname, 'middleware.ts');
if (fs.existsSync(oldMiddlewarePath)) {
  try {
    fs.unlinkSync(oldMiddlewarePath);
    console.log('[Self-Healing] Successfully deleted deprecated middleware.ts to avoid Next.js boot conflicts.');
  } catch (err) {
    console.error('[Self-Healing] Error deleting deprecated middleware.ts:', err);
  }
}

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

type ExtendedNextConfig = NextConfig & {
  typescript?: {
    ignoreBuildErrors?: boolean;
  };
};

const nextConfig: ExtendedNextConfig = {
  // In dev, put Turbopack/Next cache on C: drive if project is on slow D: drive
  distDir: process.env.NEXT_DIST_DIR || (process.env.NODE_ENV === 'development' ? '.next' : '.next-prod'),
  outputFileTracingRoot: path.resolve(__dirname),
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '127.0.0.1:3000'],
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-switch',
      '@radix-ui/react-slider',
      '@radix-ui/react-separator',
      '@radix-ui/react-label',
      '@radix-ui/react-slot',
      'sonner',
      'next-themes',
    ],
    // Only enable optimizeCss in production — it slows down dev first-load significantly
    optimizeCss: process.env.NODE_ENV === 'production',
  },
  webpack(config, { dev, isServer }) {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        cacheDirectory: process.env.WEBPACK_CACHE_DIR || undefined,
        buildDependencies: {
          config: [__filename],
        },
      };
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
          '**/.git/**',
          '**/public/**',
          '**/prisma/**',
          '**/*.log',
        ],
        // Use native file watching (not poll) - poll=1000 causes massive overhead on HDD
        poll: false,
        aggregateTimeout: 500,
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
