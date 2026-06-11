// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import * as schema from './schema';
// import dotenv from 'dotenv';

// dotenv.config();

// if (!process.env.POSTGRES_URL) {
//   throw new Error('POSTGRES_URL environment variable is not set');
// }

// export const client = postgres(process.env.POSTGRES_URL);
// export const db = drizzle(client, { schema });


process.env.TZ = 'UTC';
 
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

declare global {
  var postgresClient: ReturnType<typeof postgres> | undefined;
}

const isProd = process.env.NODE_ENV === 'production';
const poolMax = Number(process.env.PG_POOL_MAX || (isProd ? 12 : 4));

const client =
  global.postgresClient ??
  postgres(process.env.POSTGRES_URL, {
    max: poolMax,
    idle_timeout: 30,
    connect_timeout: 10,
    prepare: true,
  });

if (!isProd) {
  global.postgresClient = client;
}

export const db = drizzle(client, { schema });