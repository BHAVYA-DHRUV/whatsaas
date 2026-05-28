    import { sql } from 'drizzle-orm';
    import { drizzle } from 'drizzle-orm/node-postgres';
    import { Pool } from 'pg';
    import * as dotenv from 'dotenv';

    // dotenv.config({ path: '.env.local' });
    dotenv.config({ path: '.env' });

    const pool = new Pool({ connectionString: process.env.POSTGRES_URL });
    const db = drizzle(pool);

    // async function fix() {
    //   // Combine all statements into a single migration query
    //   const migrationQuery = `
    //     ALTER TABLE plans 
    //       ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0,
    //       ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'usd',
    //       ADD COLUMN IF NOT EXISTS interval VARCHAR(20) NOT NULL DEFAULT 'month',
    //       ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0,
    //       ADD COLUMN IF NOT EXISTS max_users INTEGER NOT NULL DEFAULT 1,
    //       ADD COLUMN IF NOT EXISTS max_contacts INTEGER NOT NULL DEFAULT 1000,
    //       ADD COLUMN IF NOT EXISTS max_instances INTEGER NOT NULL DEFAULT 1,
    //       ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN NOT NULL DEFAULT false,
    //       ADD COLUMN IF NOT EXISTS is_flow_builder_enabled BOOLEAN NOT NULL DEFAULT false,
    //       ADD COLUMN IF NOT EXISTS is_campaigns_enabled BOOLEAN NOT NULL DEFAULT false,
    //       ADD COLUMN IF NOT EXISTS is_templates_enabled BOOLEAN NOT NULL DEFAULT false,
    //       ADD COLUMN IF NOT EXISTS is_voice_calls_enabled BOOLEAN NOT NULL DEFAULT false;
    //   `;

    //   console.log('⏳ Running migration...');
    
    //   // Single network round-trip
    //   await db.execute(sql.raw(migrationQuery));

    //   console.log('✅ All columns added successfully!');
    //   await pool.end();
    // }

    // fix().catch(async (error) => {
    //   console.error('❌ Migration failed:', error);
    //   await pool.end();
    // });



    async function fix() {
  const migrationQuery = `
    ALTER TABLE plans 
      ADD COLUMN IF NOT EXISTS amount INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'usd',
      ADD COLUMN IF NOT EXISTS interval VARCHAR(20) NOT NULL DEFAULT 'month',
      ADD COLUMN IF NOT EXISTS trial_days INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS max_users INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS max_contacts INTEGER NOT NULL DEFAULT 1000,
      ADD COLUMN IF NOT EXISTS max_instances INTEGER NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS is_ai_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_flow_builder_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_campaigns_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_templates_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS is_voice_calls_enabled BOOLEAN NOT NULL DEFAULT false;
  `;

  // Create branding table if it doesn't exist, then add any missing columns
  const brandingQuery = `
    CREATE TABLE IF NOT EXISTS branding (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL DEFAULT 'WhatsSaaS',
      logo_url TEXT,
      favicon_url TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
    ALTER TABLE branding ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE branding ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
  `;

  console.log('⏳ Running migration...');
  await db.execute(sql.raw(migrationQuery));
  await db.execute(sql.raw(brandingQuery));
  console.log('✅ All done!');
  await pool.end();
}

fix().catch(async (error) => {
  console.error('❌ Migration failed:', error);
  await pool.end();
});