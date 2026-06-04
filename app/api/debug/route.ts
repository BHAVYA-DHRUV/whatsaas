import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { channelConfigs, evolutionInstances } from '@/lib/db/schema';
import { getEvolutionConfig } from '@/lib/whatsapp/config';
import { getTeamForUser } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const migrationResult = 'Applied';
    const config = await getEvolutionConfig();
    const rows = await db.select().from(channelConfigs);
    
    // Dump chats and contacts to diagnose 404
    const allDbChats = await db.select().from(require('@/lib/db/schema').chats);
    const allDbContacts = await db.select().from(require('@/lib/db/schema').contacts);
    
    let fetchInstancesResult: any = null;
    try {
      const res = await fetch(`${config.apiUrl.replace(/\/$/, '')}/instance/fetchInstances`, {
        headers: { apikey: config.apiKey || '' },
        signal: AbortSignal.timeout(5000),
      });
      fetchInstancesResult = {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        body: res.ok ? await res.json() : await res.text(),
      };
    } catch (err: any) {
      fetchInstancesResult = { error: err.message };
    }

    const dbInstances = await db.select().from(evolutionInstances);

    let chatsTest: any = null;
    let messagesTest: any = null;
    let contactsTest: any = null;

    try {
      const { chats: chatsTable } = await import('@/lib/db/schema');
      chatsTest = { success: true, count: (await db.select().from(chatsTable).limit(1)).length };
    } catch (err: any) {
      chatsTest = { success: false, error: err.message, detail: err.detail, hint: err.hint, code: err.code, stack: err.stack };
    }

    try {
      const { messages: messagesTable } = await import('@/lib/db/schema');
      messagesTest = { success: true, count: (await db.select().from(messagesTable).limit(1)).length };
    } catch (err: any) {
      messagesTest = { success: false, error: err.message, detail: err.detail, hint: err.hint, code: err.code, stack: err.stack };
    }

    try {
      const { contacts: contactsTable } = await import('@/lib/db/schema');
      contactsTest = { success: true, count: (await db.select().from(contactsTable).limit(1)).length };
    } catch (err: any) {
      contactsTest = { success: false, error: err.message, detail: err.detail, hint: err.hint, code: err.code, stack: err.stack };
    }

    const team = await getTeamForUser();

    return NextResponse.json({
      success: true,
      migrationResult,
      testDeleteResult: null,
      chatsTest,
      messagesTest,
      contactsTest,
      resolvedConfig: {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey ? `${config.apiKey.slice(0, 4)}...${config.apiKey.slice(-4)}` : 'missing',
        webhookUrl: config.webhookUrl,
        webhookToken: config.webhookToken,
        isActive: config.isActive,
      },
      envConfig: {
        EVOLUTION_API_URL: process.env.EVOLUTION_API_URL,
        AUTHENTICATION_API_KEY: process.env.AUTHENTICATION_API_KEY ? 'present' : 'missing',
        EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY ? 'present' : 'missing',
      },
      dbRows: rows.map(r => ({
        id: r.id,
        channel: r.channel,
        apiUrl: r.apiUrl,
        apiKey: r.apiKey ? `${r.apiKey.slice(0, 4)}...${r.apiKey.slice(-4)}` : 'missing',
        isActive: r.isActive,
      })),
      evolutionInstances: dbInstances,
      allDbChats,
      allDbContacts,
      teamDetails: team ? {
        id: team.id,
        name: team.name,
        instancesCount: team.evolutionInstances?.length || 0,
        instances: team.evolutionInstances?.map((i: any) => ({
          id: i.id,
          instanceName: i.instanceName,
          status: i.status,
          evolutionInstanceId: i.evolutionInstanceId,
        })),
      } : 'No team',
      fetchInstancesResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
