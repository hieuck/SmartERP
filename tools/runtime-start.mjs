import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'output');
const frontendDir = path.join(rootDir, 'src', 'frontend');
const backendDir = path.join(rootDir, 'src', 'backend');

const frontendUrl = 'http://127.0.0.1:5173';
const backendHealthUrl = 'http://127.0.0.1:3000/api/health';

const services = {
  frontend: {
    cwd: frontendDir,
    url: frontendUrl,
    pidFile: path.join(outputDir, 'frontend-runtime.pid'),
    stdoutFile: path.join(outputDir, 'frontend-runtime.out.log'),
    stderrFile: path.join(outputDir, 'frontend-runtime.err.log'),
    command: 'npm.cmd',
    args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
    timeoutMs: 30000,
  },
  backend: {
    cwd: backendDir,
    url: backendHealthUrl,
    pidFile: path.join(outputDir, 'backend-runtime.pid'),
    stdoutFile: path.join(outputDir, 'backend-runtime.out.log'),
    stderrFile: path.join(outputDir, 'backend-runtime.err.log'),
    command: process.execPath,
    args: ['dist/main.js'],
    timeoutMs: 45000,
  },
};

async function ensureOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isHealthy(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForHealthy(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHealthy(url)) {
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function readPid(pidFile) {
  try {
    const content = await fs.readFile(pidFile, 'utf8');
    const pid = Number(content.trim());
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(...createSpawnArgs(command, args, cwd, { stdio: 'inherit' }));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

function createSpawnArgs(command, args, cwd, options = {}) {
  if (process.platform === 'win32' && command.toLowerCase().endsWith('.cmd')) {
    const comspec = process.env.ComSpec || 'cmd.exe';
    return [
      comspec,
      ['/d', '/s', '/c', `${command} ${args.join(' ')}`],
      {
        cwd,
        windowsHide: true,
        ...options,
      },
    ];
  }

  return [
    command,
    args,
    {
      cwd,
      windowsHide: true,
      ...options,
    },
  ];
}

function stopPid(pid) {
  return new Promise((resolve, reject) => {
    const child = spawn('taskkill', ['/pid', String(pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 || code === 128 || code === 255) {
        resolve();
        return;
      }

      reject(new Error(`taskkill failed for PID ${pid} with exit code ${code}`));
    });
  });
}

async function stopIfOwned(service) {
  const pid = await readPid(service.pidFile);
  if (!pid || !isProcessAlive(pid)) {
    return;
  }

  await stopPid(pid);
  await fs.rm(service.pidFile, { force: true });
}

async function openLogs(service) {
  const stdout = await fs.open(service.stdoutFile, 'w');
  const stderr = await fs.open(service.stderrFile, 'w');
  return { stdout, stderr };
}

async function startDetached(service) {
  const logs = await openLogs(service);
  const child = spawn(
    ...createSpawnArgs(service.command, service.args, service.cwd, {
      detached: true,
      stdio: ['ignore', logs.stdout.fd, logs.stderr.fd],
    }),
  );

  child.unref();

  await logs.stdout.close();
  await logs.stderr.close();
  await fs.writeFile(service.pidFile, `${child.pid}\n`, 'utf8');

  const healthy = await waitForHealthy(service.url, service.timeoutMs);
  if (!healthy) {
    throw new Error(`Timed out waiting for ${service.url}`);
  }
}

async function ensureFrontend() {
  if (await isHealthy(services.frontend.url)) {
    return 'already-running';
  }

  await stopIfOwned(services.frontend);
  await startDetached(services.frontend);
  return 'started';
}

async function ensureBackend() {
  if (await isHealthy(services.backend.url)) {
    return 'already-running';
  }

  await stopIfOwned(services.backend);
  await runCommand('npm.cmd', ['run', 'build'], backendDir);
  await startDetached(services.backend);
  return 'started';
}

async function main() {
  await ensureOutputDir();

  const frontend = await ensureFrontend();
  const backend = await ensureBackend();

  console.log(
    JSON.stringify(
      {
        frontend,
        backend,
        frontendUrl,
        backendHealthUrl,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
