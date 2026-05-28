import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import IORedis from 'ioredis';
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
  pingInterval: 10_000,
  pingTimeout: 5_000,
});

const PORT = Number(process.env.SOCKET_PORT || 3001);
const REDIS_URL = process.env.REDIS_URL;
const REDIS_CHANNEL = 'whats-saas-realtime';
const DEDUPE_TTL_MS = 5_000;

const recentEvents = new Map<string, number>();

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
  return typeof roomName === 'string' && /^team-\d+$/.test(roomName);
}

let redisSubscriber: IORedis | null = null;

if (REDIS_URL) {
  redisSubscriber = new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redisSubscriber.on('connect', () => {
    logger.info('[socket-server] Connected to Redis subscriber channel');
  });

  redisSubscriber.on('error', (err) => {
    logger.error(`[socket-server] Redis subscriber error: ${err.message}`);
  });

  redisSubscriber.subscribe(REDIS_CHANNEL, (err, count) => {
    if (err) {
      logger.error(`[socket-server] Failed to subscribe to ${REDIS_CHANNEL}: ${err.message}`);
      return;
    }

    logger.info(`[socket-server] Subscribed to ${count} Redis channel(s)`);
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
} else {
  logger.warn('[socket-server] REDIS_URL is not configured. Socket server started without Redis pub/sub.');
}

io.on('connection', (socket) => {
  logger.info(`[socket-server] Client connected: socketId=${socket.id}`);

  socket.on('join-room', (roomName: unknown, callback?: (payload: { ok: boolean }) => void) => {
    if (!isValidRoomName(roomName)) {
      callback?.({ ok: false });
      return;
    }

    socket.join(roomName);
    callback?.({ ok: true });
  });

  socket.on('heartbeat', (callback?: (payload: { ok: boolean; ts: number }) => void) => {
    callback?.({ ok: true, ts: Date.now() });
  });

  socket.on('disconnect', (reason) => {
    logger.info(`[socket-server] Client disconnected: socketId=${socket.id} reason=${reason}`);
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    socketConnections: io.sockets.sockets.size,
    redis: redisSubscriber ? 'connected' : 'disabled',
  });
});

httpServer.listen(PORT, () => {
  logger.info(`[socket-server] Listening on port ${PORT}`);
});
