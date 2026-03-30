import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

async function runNodeScript(relativePath) {
  const scriptPath = path.join(rootDir, relativePath);
  await execFileAsync(process.execPath, [scriptPath], {
    cwd: rootDir,
    windowsHide: true,
    stdio: "inherit",
  });
}

async function main() {
  try {
    await runNodeScript("tools/runtime-next-start.mjs");
    await runNodeScript("tools/runtime-next-browser-smoke.mjs");
  } finally {
    await runNodeScript("tools/runtime-next-stop.mjs").catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
