const { spawnSync } = require('child_process');
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(
  command,
  ['next', 'build', '--webpack'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      GENERATE_SOURCEMAP: 'false',
      NEXT_TELEMETRY_DISABLED: '1',
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-build-validation',
    },
  }
);

process.exit(result.status ?? 1);
