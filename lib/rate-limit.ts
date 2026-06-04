import 'server-only';

import { z } from 'zod';
import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT_REQUESTS = 10;

const rateLimitPolicySchema = z.object({
  requests: z.coerce.number().int().positive(),
  window: z.coerce.number().int().positive(),
});

const rateLimitConfigSchema = z.object({
  auth: rateLimitPolicySchema.default({
    requests: 10,
    window: DEFAULT_RATE_LIMIT_WINDOW_MS,
  }),
  webhook: rateLimitPolicySchema.default({
    requests: 120,
    window: DEFAULT_RATE_LIMIT_WINDOW_MS,
  }),
  search: rateLimitPolicySchema.default({
    requests: 30,
    window: DEFAULT_RATE_LIMIT_WINDOW_MS,
  }),
  purchase: rateLimitPolicySchema.default({
    requests: 10,
    window: DEFAULT_RATE_LIMIT_WINDOW_MS,
  }),
});

export type RateLimitPolicy = z.infer<typeof rateLimitPolicySchema>;
export type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  auth: { requests: 10, window: DEFAULT_RATE_LIMIT_WINDOW_MS },
  webhook: { requests: 120, window: DEFAULT_RATE_LIMIT_WINDOW_MS },
  search: { requests: 30, window: DEFAULT_RATE_LIMIT_WINDOW_MS },
  purchase: { requests: 10, window: DEFAULT_RATE_LIMIT_WINDOW_MS },
};

function sanitizePolicy(policy: Partial<RateLimitPolicy> | null | undefined): RateLimitPolicy {
  const parsed = rateLimitPolicySchema.safeParse(policy);
  return parsed.success
    ? parsed.data
    : {
        requests: DEFAULT_RATE_LIMIT_REQUESTS,
        window: DEFAULT_RATE_LIMIT_WINDOW_MS,
      };
}

function parseRateLimitEnvNumber(name: string): number | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function buildRateLimitConfig(): RateLimitConfig {
  const envConfig = {
    auth: {
      requests: parseRateLimitEnvNumber('RATE_LIMIT_AUTH_REQUESTS'),
      window: parseRateLimitEnvNumber('RATE_LIMIT_AUTH_WINDOW_MS'),
    },
    webhook: {
      requests: parseRateLimitEnvNumber('RATE_LIMIT_WEBHOOK_REQUESTS'),
      window: parseRateLimitEnvNumber('RATE_LIMIT_WEBHOOK_WINDOW_MS'),
    },
    search: {
      requests: parseRateLimitEnvNumber('RATE_LIMIT_SEARCH_REQUESTS'),
      window: parseRateLimitEnvNumber('RATE_LIMIT_SEARCH_WINDOW_MS'),
    },
    purchase: {
      requests: parseRateLimitEnvNumber('RATE_LIMIT_PURCHASE_REQUESTS'),
      window: parseRateLimitEnvNumber('RATE_LIMIT_PURCHASE_WINDOW_MS'),
    },
  };

  const parsed = rateLimitConfigSchema.safeParse({
    auth: sanitizePolicy({ ...DEFAULT_RATE_LIMITS.auth, ...envConfig.auth }),
    webhook: sanitizePolicy({ ...DEFAULT_RATE_LIMITS.webhook, ...envConfig.webhook }),
    search: sanitizePolicy({ ...DEFAULT_RATE_LIMITS.search, ...envConfig.search }),
    purchase: sanitizePolicy({ ...DEFAULT_RATE_LIMITS.purchase, ...envConfig.purchase }),
  });

  if (!parsed.success) {
    return DEFAULT_RATE_LIMITS;
  }

  return parsed.data;
}

let cachedRateLimitConfig: RateLimitConfig | null = null;

export function getRateLimitConfig(): RateLimitConfig {
  if (!cachedRateLimitConfig) {
    cachedRateLimitConfig = buildRateLimitConfig();
  }

  return cachedRateLimitConfig;
}

export function validateRateLimitConfig(): RateLimitConfig {
  const config = getRateLimitConfig();
  const parsed = rateLimitConfigSchema.safeParse(config);

  if (!parsed.success) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid rate-limit configuration');
    }
    return DEFAULT_RATE_LIMITS;
  }

  return parsed.data;
}

export const RATE_LIMITS = getRateLimitConfig();

type RateLimitInput = RateLimitPolicy | number | null | undefined;

function normalizeRateLimitInput(input: RateLimitInput, maybeWindowSec?: number): RateLimitPolicy {
  if (typeof input === 'number') {
    const requests = Number.isFinite(input) && input > 0 ? input : DEFAULT_RATE_LIMIT_REQUESTS;
    const windowSec = Number.isFinite(maybeWindowSec) && maybeWindowSec && maybeWindowSec > 0
      ? maybeWindowSec
      : DEFAULT_RATE_LIMIT_WINDOW_MS / 1000;

    return {
      requests,
      window: Math.max(1, Math.floor(windowSec)) * 1000,
    };
  }

  return sanitizePolicy(input);
}

/**
 * Sliding window rate limit - Redis when available, in-memory fallback.
 * Accepts either `{ requests, window }` where window is in milliseconds,
 * or the legacy `(limit, windowSec)` numeric signature.
 */
export async function rateLimit(
  key: string,
  policyOrLimit: RateLimitInput,
  legacyWindowSec?: number
): Promise<RateLimitResult> {
  const policy = normalizeRateLimitInput(policyOrLimit, legacyWindowSec);
  const redis = getRedis();
  const now = Date.now();
  const ttlSec = Math.max(1, Math.ceil(policy.window / 1000));
  const resetAt = now + policy.window;

  if (redis) {
    try {
      const rKey = `rl:${key}`;
      const count = await redis.incr(rKey);
      if (count === 1) {
        await redis.set(rKey, String(count), 'EX', ttlSec);
      }
      if (count > policy.requests) {
        return { success: false, remaining: 0, resetAt };
      }
      return {
        success: true,
        remaining: Math.max(0, policy.requests - count),
        resetAt,
      };
    } catch {
      /* fall through to memory fallback */
    }
  }

  const bucket = memoryBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    memoryBuckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: policy.requests - 1, resetAt };
  }

  bucket.count += 1;
  if (bucket.count > policy.requests) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  return {
    success: true,
    remaining: policy.requests - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function rateLimitHeaders(
  result: RateLimitResult,
  limitOrPolicy: number | RateLimitPolicy
): Record<string, string> {
  const limit =
    typeof limitOrPolicy === 'number'
      ? limitOrPolicy
      : sanitizePolicy(limitOrPolicy).requests;

  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const candidate = forwardedFor.split(',')[0]?.trim();
    if (candidate) return candidate;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  return '127.0.0.1';
}

export async function checkRateLimit(
  key: string,
  policy: RateLimitPolicy | null | undefined
): Promise<NextResponse | null> {
  const resolvedPolicy = sanitizePolicy(policy);
  const result = await rateLimit(key, resolvedPolicy);

  if (result.success) {
    return null;
  }

  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: rateLimitHeaders(result, resolvedPolicy),
    }
  );
}
