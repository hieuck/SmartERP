import fs from "node:fs/promises";
import path from "node:path";
import { execFile, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");
const apiDir = path.join(rootDir, "apps", "api");
const webDir = path.join(rootDir, "apps", "web");
const execFileAsync = promisify(execFile);

const services = {
  api: {
    cwd: apiDir,
    url: "http://127.0.0.1:4000/api/health",
    port: 4000,
    pidFile: path.join(outputDir, "runtime-next-api.pid"),
    stdoutFile: path.join(outputDir, "runtime-next-api.out.log"),
    stderrFile: path.join(outputDir, "runtime-next-api.err.log"),
    command: "npm.cmd",
    args: ["run", "dev"],
    timeoutMs: 45000,
  },
  web: {
    cwd: webDir,
    url: "http://127.0.0.1:3000",
    port: 3000,
    pidFile: path.join(outputDir, "runtime-next-web.pid"),
    stdoutFile: path.join(outputDir, "runtime-next-web.out.log"),
    stderrFile: path.join(outputDir, "runtime-next-web.err.log"),
    command: "npm.cmd",
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", "3000"],
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
    const content = await fs.readFile(pidFile, "utf8");
    const pid = Number.parseInt(content.trim(), 10);
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

async function findListeningPid(port) {
  if (process.platform !== "win32") {
    return null;
  }

  try {
    const { stdout } = await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        [
          `$listenerPid = (Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)`,
          "if ($listenerPid) { Write-Output $listenerPid }",
        ].join("; "),
      ],
      { windowsHide: true },
    );

    const pid = Number.parseInt(stdout.trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function stopPid(pid) {
  return new Promise((resolve, reject) => {
    const child = spawn("taskkill", ["/pid", String(pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0 || code === 128 || code === 255) {
        resolve();
        return;
      }

      reject(new Error(`taskkill failed for PID ${pid} with exit code ${code}`));
    });
  });
}

function createSpawnArgs(command, args, cwd, options = {}) {
  if (process.platform === "win32" && command.toLowerCase().endsWith(".cmd")) {
    const comspec = process.env.ComSpec || "cmd.exe";
    return [
      comspec,
      ["/d", "/s", "/c", `${command} ${args.join(" ")}`],
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

async function stopIfOwned(service) {
  const pid = await readPid(service.pidFile);
  if (!pid || !isProcessAlive(pid)) {
    return;
  }

  await stopPid(pid).catch(() => {});
  await fs.rm(service.pidFile, { force: true });
}

async function openLogs(service) {
  const stdout = await fs.open(service.stdoutFile, "w");
  const stderr = await fs.open(service.stderrFile, "w");
  return { stdout, stderr };
}

async function startDetached(service) {
  const logs = await openLogs(service);
  const child = spawn(
    ...createSpawnArgs(service.command, service.args, service.cwd, {
      detached: true,
      stdio: ["ignore", logs.stdout.fd, logs.stderr.fd],
    }),
  );

  child.unref();

  await logs.stdout.close();
  await logs.stderr.close();
  await fs.writeFile(service.pidFile, `${child.pid}\n`, "utf8");

  const healthy = await waitForHealthy(service.url, service.timeoutMs);
  if (!healthy) {
    throw new Error(`Timed out waiting for ${service.url}`);
  }
}

async function ensureService(service) {
  if (await isHealthy(service.url)) {
    const listenerPid = await findListeningPid(service.port);
    if (listenerPid) {
      await fs.writeFile(service.pidFile, `${listenerPid}\n`, "utf8");
    }
    return "already-running";
  }

  await stopIfOwned(service);
  await startDetached(service);
  return "started";
}

async function main() {
  await ensureOutputDir();

  const api = await ensureService(services.api);
  const web = await ensureService(services.web);

  console.log(
    JSON.stringify(
      {
        api,
        web,
        apiUrl: services.api.url,
        webUrl: services.web.url,
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
