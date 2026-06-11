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
  private connectionMetrics = {
    connectCount: 0,
    disconnectCount: 0,
    errorCount: 0,
    lastConnectTime: 0,
    lastDisconnectTime: 0,
  };

  constructor() {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      `${window.location.protocol}//${window.location.hostname}:3001`;

    this.socket = io(socketUrl, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10_000,
      forceNew: false,
      upgrade: true,
    });

    this.socket.on('connect', () => {
      this.warnedConnectError = false;
      this.connectionMetrics.connectCount++;
      this.connectionMetrics.lastConnectTime = Date.now();
      console.log('[SocketClient] Connected', {
        connectCount: this.connectionMetrics.connectCount,
        socketId: this.socket.id,
      });
      
      // Re-join all rooms after reconnection
      for (const roomName of this.channels.keys()) {
        this.socket.emit('join-room', roomName);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionMetrics.disconnectCount++;
      this.connectionMetrics.lastDisconnectTime = Date.now();
      console.log('[SocketClient] Disconnected', {
        reason,
        disconnectCount: this.connectionMetrics.disconnectCount,
      });
    });

    this.socket.on('connect_error', (error) => {
      this.connectionMetrics.errorCount++;
      if (this.warnedConnectError) return;
      this.warnedConnectError = true;
      console.warn('[SocketClient] Connection error:', error.message);
    });

    this.socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('[SocketClient] Reconnection attempt:', attemptNumber);
    });

    this.socket.io.on('reconnect_failed', () => {
      console.error('[SocketClient] Reconnection failed after all attempts');
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

  getConnectionHealth() {
    return {
      connected: this.socket.connected,
      active: this.socket.active,
      ...this.connectionMetrics,
      uptime: this.connectionMetrics.lastConnectTime > 0 
        ? Date.now() - this.connectionMetrics.lastConnectTime 
        : 0,
    };
  }

  async performHealthCheck(): Promise<boolean> {
    if (!this.socket.connected) {
      return false;
    }
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);
      this.socket.emit('heartbeat', (response: { ok: boolean }) => {
        clearTimeout(timeout);
        resolve(response.ok);
      });
    });
  }
}

export function getSocketClient(): SocketClient | null {
  if (typeof window === 'undefined') return null;

  if (!globalThis.__whatsaasSocketClient) {
    globalThis.__whatsaasSocketClient = new SocketClient();
  }

  return globalThis.__whatsaasSocketClient;
}
