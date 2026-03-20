import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import pg from '../src/backend/node_modules/pg/lib/index.js';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const execFileAsync = promisify(execFile);

const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5173';
const backendLiveUrl = process.env.BACKEND_LIVE_URL || 'http://127.0.0.1:3000/api/health/live';
const backendReadyUrl = process.env.BACKEND_HEALTH_URL || 'http://127.0.0.1:3000/api/health';
const runtimeLogMaxAgeMs = Number(process.env.RUNTIME_LOG_MAX_AGE_MS || 5 * 60 * 1000);
const dbConfig = {
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'erp_production',
};
const pidFiles = {
  frontend: path.join(rootDir, 'output', 'frontend-runtime.pid'),
  backend: path.join(rootDir, 'output', 'backend-runtime.pid'),
};

const manufacturingTables = ['work_centers', 'boms', 'bom_lines', 'work_orders'];

async function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
}

async function checkHttp(url) {
  const startedAt = Date.now();
  try {
    const response = await withTimeout(fetch(url), 10000);
    return {
      ok: response.ok,
      status: response.status,
      durationMs: Date.now() - startedAt,
      url,
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      durationMs: Date.now() - startedAt,
      url,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function tailFile(relativePath, lines = 10) {
  const absolutePath = path.join(rootDir, relativePath);
  try {
    const content = await fs.readFile(absolutePath, 'utf8');
    return content.split(/\r?\n/).filter(Boolean).slice(-lines);
  } catch (error) {
    return [`<unavailable: ${error instanceof Error ? error.message : String(error)}>`];
  }
}

async function tailRecentFile(relativePath, lines = 10) {
  const absolutePath = path.join(rootDir, relativePath);

  try {
    const stats = await fs.stat(absolutePath);
    if (Date.now() - stats.mtimeMs > runtimeLogMaxAgeMs) {
      return [];
    }
  } catch (error) {
    return [`<unavailable: ${error instanceof Error ? error.message : String(error)}>`];
  }

  return tailFile(relativePath, lines);
}

async function readTrackedPid(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const pid = Number.parseInt(content.trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

async function findListeningPid(port) {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        [
          `$listenerPid = (Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty OwningProcess)`,
          'if ($listenerPid) { Write-Output $listenerPid }',
        ].join('; '),
      ],
      { windowsHide: true },
    );

    const pid = Number.parseInt(stdout.trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

async function collectProcessState() {
  const [frontendTrackedPid, backendTrackedPid, frontendListenerPid, backendListenerPid] = await Promise.all([
    readTrackedPid(pidFiles.frontend),
    readTrackedPid(pidFiles.backend),
    findListeningPid(5173),
    findListeningPid(3000),
  ]);

  return {
    frontend: {
      trackedPid: frontendTrackedPid,
      listenerPid: frontendListenerPid,
      pidDrift:
        frontendTrackedPid !== null &&
        frontendListenerPid !== null &&
        frontendTrackedPid !== frontendListenerPid,
    },
    backend: {
      trackedPid: backendTrackedPid,
      listenerPid: backendListenerPid,
      pidDrift:
        backendTrackedPid !== null &&
        backendListenerPid !== null &&
        backendTrackedPid !== backendListenerPid,
    },
  };
}

async function checkDatabase() {
  const client = new Client(dbConfig);
  try {
    await withTimeout(client.connect(), 10000);
    const dbMeta = await client.query('select current_database() as database, current_user as username');
    const tablesResult = await client.query(
      `select table_name from information_schema.tables where table_schema = 'public' and table_name = any($1::text[]) order by table_name`,
      [manufacturingTables],
    );

    const counts = {};
    for (const tableName of manufacturingTables) {
      const countResult = await client.query(`select count(*)::int as count from ${tableName}`);
      counts[tableName] = countResult.rows[0].count;
    }

    return {
      ok: true,
      database: dbMeta.rows[0],
      tables: tablesResult.rows.map((row) => row.table_name),
      counts,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const [frontend, backendLive, backendReady, database, backendErrTail, frontendErrTail, processes] = await Promise.all([
    checkHttp(frontendUrl),
    checkHttp(backendLiveUrl),
    checkHttp(backendReadyUrl),
    checkDatabase(),
    tailRecentFile('output/backend-runtime.err.log'),
    tailRecentFile('output/frontend-runtime.err.log'),
    collectProcessState(),
  ]);

  const report = {
    checkedAt: new Date().toISOString(),
    frontend,
    backend: {
      live: backendLive,
      ready: backendReady,
    },
    database,
    logTails: {
      backendErrTail,
      frontendErrTail,
    },
    processes,
    runtimeLogMaxAgeMs,
  };

  console.log(JSON.stringify(report, null, 2));

  const hasFailure = !frontend.ok || !backendLive.ok || !database.ok;
  process.exitCode = hasFailure ? 1 : 0;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
