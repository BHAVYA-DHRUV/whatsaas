const { spawnSync } = require('child_process');
const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const args = process.argv.slice(2);

const result = spawnSync(
  command,
  ['next', 'start', ...args],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  }
);

process.exit(result.status ?? 1);
