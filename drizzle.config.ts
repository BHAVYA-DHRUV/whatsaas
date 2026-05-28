import type { Config } from 'drizzle-kit';

// export default {
//   schema: './lib/db/schema.ts',
//   out: './lib/db/migrations',
//   dialect: 'postgresql',
//   dbCredentials: {
//     url: process.env.POSTGRES_URL!,
//   },
// } satisfies Config;

// drizzle.config.ts
export default {
  schema: './lib/db/schema.ts',   // ← must point to your schema file
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL || process.env.DATABASE_URL!,
  },
} satisfies Config;
