import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { isNull } from 'drizzle-orm';
import { chats, messages, users, evolutionInstances } from '@/lib/db/schema';
import { count } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startDb = Date.now();
    
    // Parallel count queries for low latency metrics generation
    const [
      [chatsCount],
      [messagesCount],
      [usersCount],
      [instancesCount]
    ] = await Promise.all([
      db.select({ count: count() }).from(chats).where(isNull(chats.deletedAt)),
      db.select({ count: count() }).from(messages).where(isNull(messages.deletedAt)),
      db.select({ count: count() }).from(users).where(isNull(users.deletedAt)),
      db.select({ count: count() }).from(evolutionInstances),
    ]);

    const dbQueryMs = Date.now() - startDb;

    const metrics = {
      timestamp: new Date().toISOString(),
      database_latency_ms: dbQueryMs,
      app_metrics: {
        total_chats: chatsCount.count,
        total_messages: messagesCount.count,
        total_users: usersCount.count,
        total_instances: instancesCount.count,
      },
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('Failed to query metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics', details: error.message },
      { status: 500 }
    );
  }
}
