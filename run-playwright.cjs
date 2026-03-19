const path = require('path');
const { spawn } = require('child_process');

const cliPath = path.join(__dirname, 'node_modules', 'playwright', 'cli.js');
const ipcProbePath = path.join(__dirname, 'playwright-ipc-child.cjs');
const args = process.argv.slice(2);
const DEFAULT_UI_HOST = '127.0.0.1';
const DEFAULT_UI_PORT = '9323';
const isHelpRequested = args.includes('--help') || args.includes('-h');
const isVersionRequested = args.includes('--version') || args.includes('-v');
const isUiRequested = args.includes('--ui');
const hasUiHost = args.some((arg) => arg === '--ui-host' || arg.startsWith('--ui-host='));
const hasUiPort = args.some((arg) => arg === '--ui-port' || arg.startsWith('--ui-port='));
const normalizedArgs = [...args];

if (isUiRequested && !isHelpRequested && !isVersionRequested) {
  if (!hasUiHost) {
    normalizedArgs.push('--ui-host', DEFAULT_UI_HOST);
  }

  if (!hasUiPort) {
    normalizedArgs.push('--ui-port', DEFAULT_UI_PORT);
  }
}

if (isHelpRequested || isVersionRequested) {
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

  return;
}

function canSpawnWithIpc() {
  try {
    const child = spawn(process.execPath, [ipcProbePath], {
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      windowsHide: true,
    });

    child.on('error', () => {});
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

if (isUiRequested) {
  const uiHostIndex = normalizedArgs.findIndex((arg) => arg === '--ui-host');
  const uiPortIndex = normalizedArgs.findIndex((arg) => arg === '--ui-port');
  const uiHost =
    uiHostIndex >= 0 ? normalizedArgs[uiHostIndex + 1] : normalizedArgs.find((arg) => arg.startsWith('--ui-host='))?.split('=')[1] ?? DEFAULT_UI_HOST;
  const uiPort =
    uiPortIndex >= 0 ? normalizedArgs[uiPortIndex + 1] : normalizedArgs.find((arg) => arg.startsWith('--ui-port='))?.split('=')[1] ?? DEFAULT_UI_PORT;

  console.error(
    [
      `Starting Playwright UI on http://${uiHost}:${uiPort}`,
      'If the browser window does not open automatically, copy that URL into a normal local browser session.',
    ].join('\n'),
  );
}

const child = spawn(process.execPath, [cliPath, ...normalizedArgs], {
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
