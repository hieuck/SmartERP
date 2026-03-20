const net = require('node:net');
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
const UI_REUSE_SAFE_ARGS = new Set(['test', '--ui']);

function parseOptionValue(optionName, fallbackValue) {
  const optionIndex = normalizedArgs.findIndex((arg) => arg === optionName);
  if (optionIndex >= 0) {
    return normalizedArgs[optionIndex + 1] ?? fallbackValue;
  }

  const inlineOption = normalizedArgs.find((arg) => arg.startsWith(`${optionName}=`));
  if (inlineOption) {
    return inlineOption.split('=')[1] ?? fallbackValue;
  }

  return fallbackValue;
}

function setOptionValue(optionName, value) {
  const optionIndex = normalizedArgs.findIndex((arg) => arg === optionName);
  if (optionIndex >= 0) {
    normalizedArgs[optionIndex + 1] = value;
    return;
  }

  const inlineIndex = normalizedArgs.findIndex((arg) => arg.startsWith(`${optionName}=`));
  if (inlineIndex >= 0) {
    normalizedArgs[inlineIndex] = `${optionName}=${value}`;
    return;
  }

  normalizedArgs.push(optionName, value);
}

function spawnAndForward(cliArgs) {
  const child = spawn(process.execPath, [cliPath, ...cliArgs], {
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
}

function isUiReuseSafeInvocation(cliArgs) {
  for (let index = 0; index < cliArgs.length; index += 1) {
    const arg = cliArgs[index];

    if (UI_REUSE_SAFE_ARGS.has(arg)) {
      continue;
    }

    if (arg === '--ui-host' || arg === '--ui-port') {
      index += 1;
      continue;
    }

    if (arg.startsWith('--ui-host=') || arg.startsWith('--ui-port=')) {
      continue;
    }

    return false;
  }

  return true;
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

function isPortAvailable(host, port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.once('error', (error) => {
      if (error && error.code === 'EADDRINUSE') {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, host);
  });
}

async function servesPlaywrightUi(host, port) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2_000);
    const response = await fetch(`http://${host}:${port}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const html = await response.text();
    return html.includes('playwright-') || html.includes('Playwright');
  } catch {
    return false;
  }
}

async function findAvailablePort(host, startPort, maxAttempts = 10) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = startPort + offset;
    if (await isPortAvailable(host, port)) {
      return port;
    }
  }

  return null;
}

async function main() {
  if (isUiRequested && !isHelpRequested && !isVersionRequested) {
    if (!hasUiHost) {
      setOptionValue('--ui-host', DEFAULT_UI_HOST);
    }

    if (!hasUiPort) {
      setOptionValue('--ui-port', DEFAULT_UI_PORT);
    }
  }

  if (isHelpRequested || isVersionRequested) {
    spawnAndForward(args);
    return;
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
    const uiHost = parseOptionValue('--ui-host', DEFAULT_UI_HOST);
    let uiPort = parseOptionValue('--ui-port', DEFAULT_UI_PORT);
    const existingUiUrl = `http://${uiHost}:${uiPort}`;
    const portAvailable = await isPortAvailable(uiHost, Number(uiPort));

    if (!portAvailable) {
      const isPlaywrightUiAlreadyRunning = await servesPlaywrightUi(uiHost, uiPort);

      if (isPlaywrightUiAlreadyRunning) {
        if (!isUiReuseSafeInvocation(normalizedArgs)) {
          console.error(
            [
              `Playwright UI is already running on ${existingUiUrl}.`,
              'This launcher will not silently reuse an existing UI session when extra test arguments are provided.',
              'Stop the existing UI process or launch with a different `--ui-port` to guarantee the requested filters/projects are applied.',
            ].join('\n'),
          );
          process.exit(1);
        }

        console.error(
          [
            `Playwright UI is already running on ${existingUiUrl}.`,
            'Reusing the existing UI server instead of starting a duplicate.',
          ].join('\n'),
        );
        process.exit(0);
      }

      if (hasUiPort) {
        console.error(
          [
            `Playwright UI could not start because port ${uiPort} is already in use by another process.`,
            'Provide a different `--ui-port` value or stop the process currently using that port.',
          ].join('\n'),
        );
        process.exit(1);
      }

      const fallbackPort = await findAvailablePort(uiHost, Number(uiPort) + 1);
      if (fallbackPort === null) {
        console.error(
          [
            `Playwright UI could not find an available port starting from ${uiPort}.`,
            'Stop the process currently using the default UI port or start with an explicit `--ui-port`.',
          ].join('\n'),
        );
        process.exit(1);
      }

      uiPort = String(fallbackPort);
      setOptionValue('--ui-port', uiPort);

      console.error(
        [
          `Playwright UI default port ${DEFAULT_UI_PORT} is busy.`,
          `Starting Playwright UI on http://${uiHost}:${uiPort} instead.`,
        ].join('\n'),
      );
    } else {
      console.error(
        [
          `Starting Playwright UI on http://${uiHost}:${uiPort}`,
          'If the browser window does not open automatically, copy that URL into a normal local browser session.',
        ].join('\n'),
      );
    }
  }

  spawnAndForward(normalizedArgs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
