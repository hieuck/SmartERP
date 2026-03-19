const path = require('path');
const { spawn } = require('child_process');

const cliPath = path.join(__dirname, 'node_modules', 'playwright', 'cli.js');
const ipcProbePath = path.join(__dirname, 'playwright-ipc-child.cjs');
const args = process.argv.slice(2);

function canSpawnWithIpc() {
  try {
    const child = spawn(process.execPath, [ipcProbePath], {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      windowsHide: true,
    });

    child.on('error', () => {
    });
    child.kill();
    return true;
  } catch (error) {
    if (error && error.code === 'EPERM') {
      return false;
    }
    throw error;
  }
}

if (!canSpawnWithIpc()) {
  console.error(
    [
      'Playwright cannot start in this environment because child-process IPC is blocked.',
      'Use this command from a normal local terminal session instead of a restricted shell or sandbox:',
      '  node run-playwright.cjs test --ui',
      'On Windows PowerShell, prefer `playwright-ui.cmd` or `npm.cmd run test:e2e:ui` over `npx playwright test --ui` to avoid Execution Policy issues.',
    ].join('\n'),
  );
  process.exit(1);
}

const child = spawn(process.execPath, [cliPath, ...args], {
  cwd: __dirname,
  stdio: 'inherit',
  windowsHide: false,
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
