import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import IORedis from 'ioredis';
import { logger } from '../lib/logger';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*', // Adjust to match Next.js app host in production
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const PORT = process.env.SOCKET_PORT || 3001;
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  logger.error('[socket-server] REDIS_URL environment variable is required. Exiting...');
  process.exit(1);
}

// Dedicated subscriber connection
const redisSubscriber = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisSubscriber.on('connect', () => {
  logger.info('[socket-server] Connected to Redis subscriber channel');
});

redisSubscriber.on('error', (err) => {
  logger.error('[socket-server] Redis subscriber error:', err.message);
});

// Subscribe to the realtime event channel
redisSubscriber.subscribe('whats-saas-realtime', (err, count) => {
  if (err) {
    logger.error('[socket-server] Failed to subscribe to whats-saas-realtime channel:', err.message);
  } else {
    logger.info(`[socket-server] Successfully subscribed to ${count} channel(s)`);
  }
});

// Broadcast messages received from Redis to client rooms
redisSubscriber.on('message', (channel, message) => {
  if (channel !== 'whats-saas-realtime') return;

  try {
    const payload = JSON.parse(message);
    const { room, event, data } = payload;

    if (!room || !event) {
      logger.warn('[socket-server] Received invalid pub/sub message payload structure');
      return;
    }

    logger.info(`[socket-server] Redis broadcast: channel=${room} event=${event}`);
    
    // Emit to clients in the room
    io.to(room).emit(`${room}:${event}`, data);
  } catch (err: any) {
    logger.error('[socket-server] Error handling Redis pub/sub message:', err.message);
  }
});

io.on('connection', (socket) => {
  logger.info(`[socket-server] Client connected: socketId=${socket.id}`);

  // Allow client to join a specific tenant workspace room
  socket.on('join-room', (roomName: string) => {
    if (!roomName || typeof roomName !== 'string') return;
    
    logger.info(`[socket-server] Client joining room: socketId=${socket.id} room=${roomName}`);
    socket.join(roomName);
  });

  socket.on('disconnect', (reason) => {
    logger.info(`[socket-server] Client disconnected: socketId=${socket.id} reason=${reason}`);
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', socketConnections: io.sockets.sockets.size });
});

httpServer.listen(PORT, () => {
  logger.info(`[socket-server] Server listening on port ${PORT}`);
});
