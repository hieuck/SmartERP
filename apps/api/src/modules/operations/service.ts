import fs from "node:fs/promises";
import path from "node:path";

import {
  describeApiFoundation,
  type OperationsArtifactStatus,
  type OperationsBuildStatus,
  type OperationsReadinessCheck,
  type OperationsReadinessStatus,
  type OperationsRuntimeServiceKey,
  type OperationsRuntimeServiceStatus,
  type OperationsSmokeStatus,
  type OperationsStatusPayload,
} from "@smarterp/contracts";

import { getDatabasePath } from "../../database.js";
import { getOperationsTotals, listOperationsTenantStatuses } from "../../store.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function countVerifiedChecks(summary: Record<string, unknown>): number {
  return Object.entries(summary).filter(([key, value]) => key.endsWith("Verified") && value === true).length;
}

function didSmokePass(summary: Record<string, unknown>): boolean {
  const verifiedKeys = Object.keys(summary).filter((key) => key.endsWith("Verified"));
  const consoleWarnings = Array.isArray(summary.consoleWarnings) ? summary.consoleWarnings : [];
  const consoleErrors = Array.isArray(summary.consoleErrors) ? summary.consoleErrors : [];
  const failedRequests = Array.isArray(summary.failedRequests) ? summary.failedRequests : [];

  return (
    verifiedKeys.length > 0 &&
    verifiedKeys.every((key) => summary[key] === true) &&
    consoleWarnings.length === 0 &&
    consoleErrors.length === 0 &&
    failedRequests.length === 0
  );
}

function getOperationsOutputDir(): string {
  return path.resolve(path.dirname(getDatabasePath()), "..", "output", "playwright");
}

function getOperationsRootDir(): string {
  return path.resolve(path.dirname(getDatabasePath()), "..");
}

function getOperationsBuildSummaryPath(): string {
  return path.join(getOperationsRootDir(), "apps", "web", "build", "build-summary.json");
}

async function readOptionalFileStats(
  filePath: string,
): Promise<{ exists: boolean; sizeBytes: number; updatedAt: string | null }> {
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    return {
      exists: false,
      sizeBytes: 0,
      updatedAt: null,
    };
  }
}

async function readPidFile(pidFilePath: string): Promise<number | null> {
  try {
    const raw = await fs.readFile(pidFilePath, "utf8");
    const pid = Number.parseInt(raw.trim(), 10);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number | null): boolean {
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

async function isUrlHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function getOperationsDatabaseStatus(): Promise<OperationsStatusPayload["database"]> {
  const databasePath = getDatabasePath();

  try {
    const stats = await fs.stat(databasePath);
    return {
      path: databasePath,
      exists: true,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
    };
  } catch {
    return {
      path: databasePath,
      exists: false,
      sizeBytes: 0,
      updatedAt: null,
    };
  }
}

async function readOperationsBuildStatus(): Promise<OperationsBuildStatus | null> {
  const summaryPath = getOperationsBuildSummaryPath();

  try {
    const raw = await fs.readFile(summaryPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (
      !isRecord(parsed) ||
      typeof parsed.checkedAt !== "string" ||
      typeof parsed.summaryPath !== "string" ||
      typeof parsed.distPath !== "string" ||
      typeof parsed.totalAssetCount !== "number" ||
      typeof parsed.totalAssetBytes !== "number" ||
      typeof parsed.totalJavaScriptBytes !== "number" ||
      typeof parsed.totalCssBytes !== "number" ||
      !isRecord(parsed.budget)
    ) {
      return null;
    }

    return parsed as OperationsBuildStatus;
  } catch {
    return null;
  }
}

async function readOperationsSmokeStatus(): Promise<OperationsSmokeStatus | null> {
  const summaryPath = path.join(getOperationsOutputDir(), "runtime-next-smoke-summary.json");

  try {
    const raw = await fs.readFile(summaryPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    if (!isRecord(parsed) || typeof parsed.checkedAt !== "string") {
      return null;
    }

    const consoleWarnings = Array.isArray(parsed.consoleWarnings) ? parsed.consoleWarnings : [];
    const consoleErrors = Array.isArray(parsed.consoleErrors) ? parsed.consoleErrors : [];
    const failedRequests = Array.isArray(parsed.failedRequests) ? parsed.failedRequests : [];

    return {
      checkedAt: parsed.checkedAt,
      passed: didSmokePass(parsed),
      tenantName: typeof parsed.tenantName === "string" ? parsed.tenantName : null,
      verifiedCheckCount: countVerifiedChecks(parsed),
      consoleWarningCount: consoleWarnings.length,
      consoleErrorCount: consoleErrors.length,
      failedRequestCount: failedRequests.length,
      screenshotPath: typeof parsed.screenshotPath === "string" ? parsed.screenshotPath : null,
      summaryPath,
    };
  } catch {
    return null;
  }
}

async function getOperationsRuntimeServiceStatus(
  key: OperationsRuntimeServiceKey,
  label: string,
  url: string,
): Promise<OperationsRuntimeServiceStatus> {
  const outputDir = getOperationsOutputDir();
  const pidFilePath = path.join(outputDir, `runtime-next-${key}.pid`);
  const stdoutPath = path.join(outputDir, `runtime-next-${key}.out.log`);
  const stderrPath = path.join(outputDir, `runtime-next-${key}.err.log`);
  const pid = await readPidFile(pidFilePath);
  const [stdoutStats, stderrStats, healthy] = await Promise.all([
    readOptionalFileStats(stdoutPath),
    readOptionalFileStats(stderrPath),
    isUrlHealthy(url),
  ]);
  const lastLogUpdateAt =
    [stdoutStats.updatedAt, stderrStats.updatedAt].filter((value): value is string => Boolean(value)).sort().at(-1) ??
    null;

  return {
    key,
    label,
    url,
    healthy,
    pid: isProcessAlive(pid) ? pid : null,
    pidFilePath,
    stdoutPath,
    stderrPath,
    stdoutExists: stdoutStats.exists,
    stderrExists: stderrStats.exists,
    lastLogUpdateAt,
  };
}

async function getOperationsArtifacts(
  database: OperationsStatusPayload["database"],
  build: OperationsBuildStatus | null,
  smoke: OperationsSmokeStatus | null,
): Promise<OperationsArtifactStatus[]> {
  const outputDir = getOperationsOutputDir();
  const smokeSummaryPath = smoke?.summaryPath ?? path.join(outputDir, "runtime-next-smoke-summary.json");
  const smokeScreenshotPath = smoke?.screenshotPath ?? path.join(outputDir, "runtime-next-smoke.png");
  const buildSummaryPath = build?.summaryPath ?? getOperationsBuildSummaryPath();
  const [summaryStats, screenshotStats, buildSummaryStats] = await Promise.all([
    readOptionalFileStats(smokeSummaryPath),
    readOptionalFileStats(smokeScreenshotPath),
    readOptionalFileStats(buildSummaryPath),
  ]);

  return [
    {
      key: "database",
      label: "SQLite database",
      path: database.path,
      exists: database.exists,
      sizeBytes: database.sizeBytes,
      updatedAt: database.updatedAt,
    },
    {
      key: "smoke-summary",
      label: "Smoke summary",
      path: smokeSummaryPath,
      exists: summaryStats.exists,
      sizeBytes: summaryStats.sizeBytes,
      updatedAt: summaryStats.updatedAt,
    },
    {
      key: "smoke-screenshot",
      label: "Smoke screenshot",
      path: smokeScreenshotPath,
      exists: screenshotStats.exists,
      sizeBytes: screenshotStats.sizeBytes,
      updatedAt: screenshotStats.updatedAt,
    },
    {
      key: "build-summary",
      label: "Web build summary",
      path: buildSummaryPath,
      exists: buildSummaryStats.exists,
      sizeBytes: buildSummaryStats.sizeBytes,
      updatedAt: buildSummaryStats.updatedAt,
    },
  ];
}

function buildOperationsReadinessStatus(
  runtimeServices: OperationsRuntimeServiceStatus[],
  database: OperationsStatusPayload["database"],
  build: OperationsBuildStatus | null,
  smoke: OperationsSmokeStatus | null,
): OperationsReadinessStatus {
  const apiService = runtimeServices.find((service) => service.key === "api") ?? null;
  const webService = runtimeServices.find((service) => service.key === "web") ?? null;
  const checks: OperationsReadinessCheck[] = [
    {
      key: "api-health",
      label: "API health",
      passed: Boolean(apiService?.healthy),
      severity: "critical",
      detail: apiService?.url ?? "http://127.0.0.1:4000/api/health",
    },
    {
      key: "web-health",
      label: "Web shell",
      passed: Boolean(webService?.healthy),
      severity: "critical",
      detail: webService?.url ?? "http://127.0.0.1:3000",
    },
    {
      key: "database-file",
      label: "Database file",
      passed: database.exists,
      severity: "critical",
      detail: database.path,
    },
    {
      key: "build-summary",
      label: "Build summary",
      passed: Boolean(build),
      severity: "warning",
      detail: build?.summaryPath ?? "No build summary captured yet.",
    },
    {
      key: "build-budget",
      label: "Build budget",
      passed: build?.budget.passed ?? false,
      severity: "warning",
      detail: build?.largestJavaScriptAsset
        ? `${build.largestJavaScriptAsset.fileName} | ${build.largestJavaScriptAsset.sizeBytes} B`
        : "No JavaScript assets were captured.",
    },
    {
      key: "smoke-gate",
      label: "Latest smoke gate",
      passed: Boolean(smoke?.passed),
      severity: "warning",
      detail: smoke?.summaryPath ?? "No smoke summary captured yet.",
    },
    {
      key: "api-logs",
      label: "API runtime logs",
      passed: Boolean(apiService?.stdoutExists && apiService.stderrExists),
      severity: "warning",
      detail: apiService ? `${apiService.stdoutPath} | ${apiService.stderrPath}` : "Runtime log paths unavailable.",
    },
    {
      key: "web-logs",
      label: "Web runtime logs",
      passed: Boolean(webService?.stdoutExists && webService.stderrExists),
      severity: "warning",
      detail: webService ? `${webService.stdoutPath} | ${webService.stderrPath}` : "Runtime log paths unavailable.",
    },
  ];
  const failedChecks = checks.filter((check) => !check.passed);
  const hasCriticalFailure = failedChecks.some((check) => check.severity === "critical");

  return {
    level: hasCriticalFailure ? "blocked" : failedChecks.length > 0 ? "warning" : "ready",
    passedCheckCount: checks.filter((check) => check.passed).length,
    warningCheckCount: failedChecks.filter((check) => check.severity === "warning").length,
    failedCheckCount: failedChecks.length,
    checks,
  };
}

export async function buildOperationsStatusPayload(): Promise<OperationsStatusPayload> {
  const database = await getOperationsDatabaseStatus();
  const build = await readOperationsBuildStatus();
  const smoke = await readOperationsSmokeStatus();
  const runtimeServices = await Promise.all([
    getOperationsRuntimeServiceStatus("api", "API", "http://127.0.0.1:4000/api/health"),
    getOperationsRuntimeServiceStatus("web", "Web", "http://127.0.0.1:3000"),
  ]);
  const artifacts = await getOperationsArtifacts(database, build, smoke);

  return {
    service: "smarterp-api",
    status: "ok",
    foundation: describeApiFoundation(),
    generatedAt: new Date().toISOString(),
    database,
    build,
    runtimeServices,
    artifacts,
    readiness: buildOperationsReadinessStatus(runtimeServices, database, build, smoke),
    smoke,
    totals: getOperationsTotals(),
    tenants: listOperationsTenantStatuses(),
  };
}
