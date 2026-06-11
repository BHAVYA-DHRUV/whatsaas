process.env.TZ = 'UTC';
import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { getSubscriberConnection, getRedisConnectionManager } from '@/lib/redis/connection-manager';
import { logger } from '@/lib/logger';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.BASE_URL,
  'http://localhost:3000',
].filter((value): value is string => Boolean(value));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 1e6,
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 1024,
    zlibDeflateOptions: {
      level: 3,
    },
  },
});

const PORT = Number(process.env.SOCKET_PORT || 3001);
const REDIS_URL = process.env.REDIS_URL;
const REDIS_CHANNEL = 'whats-saas-realtime';
const DEDUPE_TTL_MS = 5_000;

const recentEvents = new Map<string, number>();

// Socket server metrics
const serverMetrics = {
  totalConnections: 0,
  activeConnections: 0,
  totalMessages: 0,
  totalErrors: 0,
  startTime: Date.now(),
};

function buildEventKey(room: string, event: string, data: unknown) {
  const stableData =
    typeof data === 'object' && data !== null
      ? JSON.stringify(data)
      : String(data ?? '');
  return `${room}:${event}:${stableData.slice(0, 500)}`;
}

function shouldBroadcast(room: string, event: string, data: unknown) {
  const now = Date.now();

  for (const [key, ts] of recentEvents.entries()) {
    if (now - ts > DEDUPE_TTL_MS) {
      recentEvents.delete(key);
    }
  }

  const eventKey = buildEventKey(room, event, data);
  const previousTs = recentEvents.get(eventKey);
  if (previousTs && now - previousTs < DEDUPE_TTL_MS) {
    return false;
  }

  recentEvents.set(eventKey, now);
  return true;
}

function isValidRoomName(roomName: unknown): roomName is string {
  return (
    typeof roomName === 'string' &&
    /^(team[-:]\d+|instance:[\w-]+|chat:[\w-]+)$/.test(roomName)
  );
}

function setupRedisSubscriber() {
  if (!REDIS_URL) {
    logger.warn('[socket-server] REDIS_URL is not configured. Socket server started without Redis pub/sub.');
    return;
  }

  const redisSubscriber = getSubscriberConnection();
  if (!redisSubscriber) {
    logger.error('[socket-server] Failed to get Redis subscriber connection from manager');
    return;
  }

  redisSubscriber.on('ready', async () => {
    logger.info('[socket-server] Redis subscriber ready, subscribing to channel');
    
    try {
      await redisSubscriber.subscribe(REDIS_CHANNEL);
      logger.info(`[socket-server] Subscribed to Redis channel: ${REDIS_CHANNEL}`);
    } catch (err) {
      logger.error(`[socket-server] Failed to subscribe to ${REDIS_CHANNEL}:`, err);
    }
  });

  redisSubscriber.on('message', (channel, message) => {
    if (channel !== REDIS_CHANNEL) return;

    try {
      const payload = JSON.parse(message) as { room?: string; event?: string; data?: unknown };
      if (!isValidRoomName(payload.room) || !payload.event) {
        logger.warn('[socket-server] Ignoring malformed realtime payload');
        return;
      }

      if (!shouldBroadcast(payload.room, payload.event, payload.data)) {
        return;
      }

      io.to(payload.room).emit(`${payload.room}:${payload.event}`, payload.data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown Redis pub/sub processing error';
      logger.error(`[socket-server] Failed to broadcast pub/sub message: ${message}`);
    }
  });

  logger.info('[socket-server] Redis subscriber setup complete');
}

setupRedisSubscriber();

io.on('connection', (socket) => {
  serverMetrics.totalConnections++;
  serverMetrics.activeConnections++;
  logger.info(`[SOCKET_CONNECTED] Client connected: socketId=${socket.id} totalConnections=${serverMetrics.totalConnections} activeConnections=${serverMetrics.activeConnections}`);

  socket.on('join-room', (roomName: unknown, callback?: (payload: { ok: boolean }) => void) => {
    if (!isValidRoomName(roomName)) {
      logger.warn(`[socket-server] Invalid room name attempted: socketId=${socket.id} roomName=${roomName}`);
      callback?.({ ok: false });
      return;
    }

    socket.join(roomName);
    logger.debug(`[socket-server] Socket joined room: socketId=${socket.id} room=${roomName}`);
    callback?.({ ok: true });
  });

  socket.on('heartbeat', (callback?: (payload: { ok: boolean; ts: number }) => void) => {
    callback?.({ ok: true, ts: Date.now() });
  });

  socket.on('typing', (payload: any) => {
    serverMetrics.totalMessages++;
    if (payload && isValidRoomName(payload.room)) {
      socket.to(payload.room).emit(`${payload.room}:typing`, payload);
    }
  });

  socket.on('presence-update', (payload: any) => {
    serverMetrics.totalMessages++;
    if (payload && isValidRoomName(payload.room)) {
      socket.to(payload.room).emit(`${payload.room}:presence-update`, payload);
    }
  });

  socket.on('disconnect', (reason) => {
    serverMetrics.activeConnections--;
    logger.info(`[socket-server] Client disconnected: socketId=${socket.id} reason=${reason} activeConnections=${serverMetrics.activeConnections}`);
  });

  socket.on('error', (error) => {
    serverMetrics.totalErrors++;
    logger.error(`[socket-server] Socket error: socketId=${socket.id} error=${error.message}`);
  });
});

app.get('/health', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  const manager = getRedisConnectionManager();
  const redisHealth = manager.getHealthStatus();
  const uptime = Date.now() - serverMetrics.startTime;
  
  res.json({
    status: 'ok',
    uptime: Math.floor(uptime / 1000),
    socket: {
      connections: io.sockets.sockets.size,
      totalConnections: serverMetrics.totalConnections,
      activeConnections: serverMetrics.activeConnections,
      totalMessages: serverMetrics.totalMessages,
      totalErrors: serverMetrics.totalErrors,
    },
    redis: {
      configured: !!REDIS_URL,
      subscriber: redisHealth.subscriber,
      publisher: redisHealth.publisher,
      worker: redisHealth.worker,
      cache: redisHealth.cache,
    },
  });
});

app.options('/health', (req, res) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

httpServer.listen(PORT, () => {
  logger.info(`[socket-server] Listening on port ${PORT}`);
});
