import PusherClient from 'pusher-js';
import { getSocketClient, type TeamChannel } from '@/lib/socket/client';

declare global {
  var __pusherClient: PusherClient | undefined;
}

export function getPusherClient(): PusherClient | null {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) return null;

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
