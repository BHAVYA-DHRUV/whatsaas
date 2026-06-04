'use client';

import { io, type Socket } from 'socket.io-client';

export type TeamChannel = {
  bind: (eventName: string, callback: (data: any) => void) => TeamChannel;
  unbind: (eventName: string, callback?: (data: any) => void) => TeamChannel;
};

declare global {
  var __whatsaasSocketClient: SocketClient | undefined;
}

class SocketChannel implements TeamChannel {
  constructor(
    private readonly channelName: string,
    private readonly socket: Socket
  ) {}

  bind(eventName: string, callback: (data: any) => void) {
    this.socket.on(`${this.channelName}:${eventName}`, callback);
    return this;
  }

  unbind(eventName: string, callback?: (data: any) => void) {
    if (callback) {
      this.socket.off(`${this.channelName}:${eventName}`, callback);
      return this;
    }

    this.socket.off(`${this.channelName}:${eventName}`);
    return this;
  }
}

class SocketClient {
  private readonly socket: Socket;
  private readonly channels = new Map<string, SocketChannel>();
  private warnedConnectError = false;

  constructor() {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      `${window.location.protocol}//${window.location.hostname}:3001`;

    this.socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 5_000,
      forceNew: true,
      upgrade: true,
    });

    this.socket.on('connect', () => {
      this.warnedConnectError = false;
      for (const roomName of this.channels.keys()) {
        this.socket.emit('join-room', roomName);
      }
    });

    this.socket.on('connect_error', (error) => {
      if (this.warnedConnectError) return;
      this.warnedConnectError = true;
      // Silently handle connection errors - socket will reconnect when available
    });
  }

  subscribe(channelName: string) {
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = new SocketChannel(channelName, this.socket);
      this.channels.set(channelName, channel);
    }

    if (!this.socket.connected && !this.socket.active) {
      this.socket.connect();
    }

    this.socket.emit('join-room', channelName);
    return channel;
  }
}

export function getSocketClient(): SocketClient | null {
  if (typeof window === 'undefined') return null;

  if (!globalThis.__whatsaasSocketClient) {
    globalThis.__whatsaasSocketClient = new SocketClient();
  }

  return globalThis.__whatsaasSocketClient;
}
