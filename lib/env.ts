import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  POSTGRES_URL: z.string().min(1, 'POSTGRES_URL is required'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters'),
  BASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  EVOLUTION_API_URL: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let validated = false;

/** Validates required server env at boot (instrumentation). */
export function validateEnv(): ServerEnv {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    console.error('[env] Invalid configuration:', JSON.stringify(msg, null, 2));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    }
  }
  validated = true;
  return parsed.success ? parsed.data : (process.env as ServerEnv);
}

export function isEnvValidated(): boolean {
  return validated;
}

export function getClientEnv() {
  return clientSchema.parse({
    NEXT_PUBLIC_PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY,
    NEXT_PUBLIC_PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  });
}
