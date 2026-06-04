/**
 * Environment validation for production deployment
 * Ensures all required environment variables are set and valid
 */

import 'dotenv/config';

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required variables
  const required = [
    'POSTGRES_URL',
    'AUTH_SECRET',
  ];

  const optional = [
    'REDIS_URL',
    'PUSHER_APP_ID',
    'PUSHER_KEY',
    'PUSHER_SECRET',
    'PUSHER_CLUSTER',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY',
  ];

  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Check optional variables
  for (const key of optional) {
    if (!process.env[key]) {
      warnings.push(`Missing optional environment variable: ${key}`);
    }
  }

  // Validate POSTGRES_URL format
  const dbUrl = process.env.POSTGRES_URL;
  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
        errors.push('POSTGRES_URL must use postgresql protocol');
      }
    } catch {
      errors.push('POSTGRES_URL is not a valid URL');
    }
  }

  // Validate REDIS_URL format if present
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      if (url.protocol !== 'redis:') {
        errors.push('REDIS_URL must use redis protocol');
      }
    } catch {
      errors.push('REDIS_URL is not a valid URL');
    }
  }

  // Validate Evolution API configuration if present
  if (process.env.EVOLUTION_API_URL) {
    try {
      const url = new URL(process.env.EVOLUTION_API_URL);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('EVOLUTION_API_URL must use http or https protocol');
      }
    } catch {
      errors.push('EVOLUTION_API_URL is not a valid URL');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function requireValidEnvironment(): void {
  const validation = validateEnvironment();
  if (!validation.valid) {
    throw new Error(
      `Environment validation failed:\n${validation.errors.join('\n')}`
    );
  }
}
