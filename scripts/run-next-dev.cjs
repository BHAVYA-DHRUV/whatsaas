const { spawn } = require('node:child_process');
const path = require('node:path');

const env = {};
for (const [key, value] of Object.entries(process.env)) {
  env[key] = value;
}

env.NEXT_TELEMETRY_DISABLED = env.NEXT_TELEMETRY_DISABLED || '1';
env.GENERATE_SOURCEMAP = env.GENERATE_SOURCEMAP || 'false';
env.NODE_OPTIONS = env.NODE_OPTIONS || '--max-old-space-size=4096';
env.NEXT_DISABLE_TURBOPACK = env.NEXT_DISABLE_TURBOPACK || '1';
env.NEXT_DIST_DIR = env.NEXT_DIST_DIR || '.next-webpack';

const nextBin = require.resolve('next/dist/bin/next');
const cwd = path.resolve(__dirname, '..');

const child = spawn(process.execPath, [nextBin, 'dev', '--webpack'], {
  stdio: 'inherit',
  env,
  cwd,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
