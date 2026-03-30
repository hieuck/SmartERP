import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputDir = path.join(rootDir, "output", "playwright");

const pidFiles = [
  path.join(outputDir, "runtime-next-api.pid"),
  path.join(outputDir, "runtime-next-web.pid"),
];

async function readPid(pidFile) {
  try {
    const content = await fs.readFile(pidFile, "utf8");
    const pid = Number.parseInt(content.trim(), 10);
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

async function main() {
  for (const pidFile of pidFiles) {
    const pid = await readPid(pidFile);
    if (pid) {
      await stopPid(pid).catch(() => {});
    }

    await fs.rm(pidFile, { force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
