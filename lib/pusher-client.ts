import PusherClient from 'pusher-js';
import { getSocketClient, type TeamChannel } from '@/lib/socket/client';

function isPusherConfigured(): boolean {
  const key = (process.env.NEXT_PUBLIC_PUSHER_KEY || '').trim();
  const secret = (process.env.PUSHER_SECRET || '').trim();
  const appId = (process.env.PUSHER_APP_ID || '').trim();
  const cluster = (process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '').trim();

  if (!key || !secret || !appId || !cluster) return false;

  return !/^(demo|local|placeholder|changeme)$/i.test(key) && !/^(demo|local|placeholder|changeme)$/i.test(secret);
}

declare global {
  var __pusherClient: PusherClient | undefined;
}

export function getPusherClient(): PusherClient | null {
  if (!isPusherConfigured()) return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY as string;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string;

  if (!globalThis.__pusherClient) {
    globalThis.__pusherClient = new PusherClient(key, {
      cluster,
      forceTLS: true,
    });
  }

  return globalThis.__pusherClient;
}
export function getTeamChannel(teamId: number): TeamChannel | null {
  const channelName = `team-${teamId}`;
  
  const client = getPusherClient();
  if (client) {
    return ((client as any).channel?.(channelName) || client.subscribe(channelName)) as TeamChannel;
  }

  const socketClient = getSocketClient();
  if (socketClient) {
    return socketClient.subscribe(channelName);
  }

  return null;
}
