/**
 * WhatSaaS — PM2 production ecosystem
 * pm2 start ecosystem.config.js --env production && pm2 save && pm2 startup
 */
const path = require('path');
const appDir = __dirname;

function worker(appName, scriptRel, memory = '384M', extra = {}) {
  return {
    name: appName,
    cwd: appDir,
    script: 'npx',
    args: `tsx ${scriptRel}`,
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    max_memory_restart: memory,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: path.join(appDir, `logs/pm2/${appName}-error.log`),
    out_file: path.join(appDir, `logs/pm2/${appName}-out.log`),
    env_production: { NODE_ENV: 'production' },
    ...extra,
  };
}

module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      cwd: appDir,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      max_restarts: 15,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 10000,
      watch: false,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: path.join(appDir, 'logs/pm2/nextjs-app-error.log'),
      out_file: path.join(appDir, 'logs/pm2/nextjs-app-out.log'),
      env_production: { NODE_ENV: 'production', PORT: 3000 },
    },
    worker('campaign-worker', 'workers/bullmq/campaign-worker.ts', '512M'),
    worker('ai-worker', 'workers/bullmq/ai-worker.ts', '768M'),
    worker('automation-worker', 'workers/bullmq/automation-worker.ts', '512M'),
    worker('scheduler-worker', 'workers/bullmq/scheduler-worker.ts', '256M'),
    worker('retry-worker', 'workers/bullmq/retry-worker.ts', '256M'),
    worker('websocket-worker', 'workers/health-ping.ts', '128M'),
    worker('socket-server', 'workers/socket-server.ts', '256M'),
    // Fallback HTTP cron when Redis unavailable:
    worker('campaign-worker-http', 'workers/campaign-processor.ts', '256M', {
      env_production: { NODE_ENV: 'production', USE_HTTP_CRON: '1' },
    }),
  ],
};
