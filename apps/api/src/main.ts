import fs from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { URL } from "node:url";

import {
  canAccessModule,
  demoCredentials,
  demoAccounts,
  describeApiFoundation,
  foundationModules,
  getDemoSessionByAccessToken,
  getDemoSessionByCredentials,
  hasPermission,
  rewriteMessage,
  type ApprovalDecisionInput,
  type FoundationModule,
  type CreateCustomerInput,
  type CreateInvoiceInput,
  type UpdateInvoiceCollectionInput,
  type ResolveInvoiceCollectionActionInput,
  type CreateInvoicePaymentInput,
  type CreateInventoryAdjustmentInput,
  type CreateOrderInput,
  type CreatePurchaseOrderInput,
  type ReceivePurchaseOrderInput,
  type CreateProductInput,
  type CreateSupplierInput,
  type CreateTenantInput,
  type ImportOnboardingInput,
  type LoginInput,
  type OperationsArtifactStatus,
  type OperationsReadinessCheck,
  type OperationsReadinessStatus,
  type OperationsRuntimeServiceKey,
  type OperationsRuntimeServiceStatus,
  type OperationsSmokeStatus,
  type OperationsStatusPayload,
  type Permission,
  type RestoreTenantSnapshotInput,
  type RestoreTenantSnapshotPreview,
  type Session,
} from "@smarterp/contracts";

import { readJson, sendEmpty, sendJson } from "./http.js";
import { getDatabasePath } from "./database.js";
import {
  createCustomer,
  createInventoryAdjustment,
  createInvoice,
  updateInvoiceCollection,
  resolveInvoiceCollectionAction,
  createInvoicePayment,
  createOrder,
  createPurchaseOrder,
  receivePurchaseOrder,
  createProduct,
  createSupplier,
  createTenant,
  exportTenantSnapshot,
  getOperationsTotals,
  getReportSummary,
  hasTenant,
  importOnboardingDataset,
  listOperationsTenantStatuses,
  previewRestoreTenantSnapshot,
  restoreTenantSnapshot,
  listAccountBalances,
  listApprovalRequests,
  listAuditLogs,
  listInvoiceCollectionActivities,
  listJournalEntries,
  listCustomerStatements,
  listCustomers,
  listInventory,
  listInvoices,
  listOrders,
  listPurchaseOrders,
  listProducts,
  listSuppliers,
  listTenants,
  resolveApprovalRequest,
  runWithSession,
} from "./store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

function unauthorized(response: ServerResponse): void {
  sendJson(response, 401, { error: "Invalid credentials." });
}

function authenticationRequired(response: ServerResponse): void {
  sendJson(response, 401, { error: "Authentication required." });
}

function forbidden(response: ServerResponse): void {
  sendJson(response, 403, { error: "Forbidden." });
}

function internalServerError(response: ServerResponse): void {
  sendJson(response, 500, { error: "Internal server error." });
}

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
  smoke: OperationsSmokeStatus | null,
): Promise<OperationsArtifactStatus[]> {
  const outputDir = getOperationsOutputDir();
  const smokeSummaryPath = smoke?.summaryPath ?? path.join(outputDir, "runtime-next-smoke-summary.json");
  const smokeScreenshotPath = smoke?.screenshotPath ?? path.join(outputDir, "runtime-next-smoke.png");
  const [summaryStats, screenshotStats] = await Promise.all([
    readOptionalFileStats(smokeSummaryPath),
    readOptionalFileStats(smokeScreenshotPath),
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
  ];
}

function buildOperationsReadinessStatus(
  runtimeServices: OperationsRuntimeServiceStatus[],
  database: OperationsStatusPayload["database"],
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

function isSqliteConstraintError(error: unknown): error is Error & { code?: string } {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_SQLITE_ERROR"
  );
}

function isPublicRoute(method: string, pathname: string): boolean {
  return (
    (method === "GET" && pathname === "/api/health") ||
    (method === "GET" && pathname === "/api/foundation") ||
    (method === "POST" && pathname === "/api/auth/login")
  );
}

function getRequestSession(request: IncomingMessage): Session | null {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return getDemoSessionByAccessToken(authorization.slice("Bearer ".length).trim());
}

function ensureModuleAccess(
  response: ServerResponse,
  session: Session | null,
  module: FoundationModule,
): boolean {
  if (!session) {
    authenticationRequired(response);
    return false;
  }

  if (canAccessModule(session, module)) {
    return true;
  }

  forbidden(response);
  return false;
}

function ensurePermission(
  response: ServerResponse,
  session: Session | null,
  permission: Permission,
): boolean {
  if (!session) {
    authenticationRequired(response);
    return false;
  }

  if (hasPermission(session, permission)) {
    return true;
  }

  forbidden(response);
  return false;
}

const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
  try {
    if (!request.url || !request.method) {
      sendJson(response, 400, { error: "Invalid request." });
      return;
    }

    if (request.method === "OPTIONS") {
      sendEmpty(response);
      return;
    }

    const url = new URL(request.url, "http://localhost:4000");
    const pathname = url.pathname;
    const requestSession = getRequestSession(request);

    if (!isPublicRoute(request.method, pathname) && !requestSession) {
      authenticationRequired(response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/health") {
      sendJson(response, 200, {
        service: "smarterp-api",
        status: "ok",
        foundation: describeApiFoundation(),
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/foundation") {
      sendJson(response, 200, {
        modules: foundationModules,
        message: rewriteMessage,
        demoCredentials,
        demoAccounts: demoAccounts.map(({ email, password, displayName, role }) => ({
          email,
          password,
          displayName,
          role,
        })),
      });
      return;
    }

    if (request.method === "GET" && pathname === "/api/operations/status") {
      if (!ensurePermission(response, requestSession, "view_operations")) {
        return;
      }

      const database = await getOperationsDatabaseStatus();
      const smoke = await readOperationsSmokeStatus();
      const runtimeServices = await Promise.all([
        getOperationsRuntimeServiceStatus("api", "API", "http://127.0.0.1:4000/api/health"),
        getOperationsRuntimeServiceStatus("web", "Web", "http://127.0.0.1:3000"),
      ]);
      const artifacts = await getOperationsArtifacts(database, smoke);

      const item: OperationsStatusPayload = {
        service: "smarterp-api",
        status: "ok",
        foundation: describeApiFoundation(),
        generatedAt: new Date().toISOString(),
        database,
        runtimeServices,
        artifacts,
        readiness: buildOperationsReadinessStatus(runtimeServices, database, smoke),
        smoke,
        totals: getOperationsTotals(),
        tenants: listOperationsTenantStatuses(),
      };

      sendJson(response, 200, { item });
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const input = await readJson<LoginInput>(request);
      const session = getDemoSessionByCredentials(input);

      if (!session) {
        unauthorized(response);
        return;
      }

      sendJson(response, 200, { session });
      return;
    }

    if (request.method === "GET" && pathname === "/api/tenants") {
      sendJson(response, 200, { items: listTenants() });
      return;
    }

    if (request.method === "POST" && pathname === "/api/tenants") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      const input = await readJson<CreateTenantInput>(request);

      if (!input.name?.trim() || !input.slug?.trim() || !input.industry?.trim()) {
        badRequest(response, "Tenant name, slug, and industry are required.");
        return;
      }

      try {
        const tenant = runWithSession(requestSession, () => createTenant(input));
        sendJson(response, 201, { item: tenant });
      } catch (error) {
        if (isSqliteConstraintError(error) && error.message.includes("tenants.slug")) {
          badRequest(response, "A tenant with this slug already exists.");
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/onboarding/import") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      const input = await readJson<ImportOnboardingInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.dataset) {
        badRequest(response, "dataset is required.");
        return;
      }

      if (!input.csvText?.trim()) {
        badRequest(response, "CSV data is required.");
        return;
      }

      try {
        const result = runWithSession(requestSession, () => importOnboardingDataset(input));
        sendJson(response, 200, { item: result });
      } catch (error) {
        if (error instanceof Error) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "GET" && pathname === "/api/onboarding/export") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      sendJson(response, 200, { item: exportTenantSnapshot(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/onboarding/restore/preview") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      const input = await readJson<RestoreTenantSnapshotInput>(request);

      if (!input?.snapshot?.tenant?.name) {
        badRequest(response, "Snapshot payload is invalid.");
        return;
      }

      if (!input.targetTenant?.name?.trim()) {
        badRequest(response, "Target tenant name is required.");
        return;
      }

      if (!input.targetTenant?.slug?.trim()) {
        badRequest(response, "Target tenant slug is required.");
        return;
      }

      if (!input.targetTenant?.industry?.trim()) {
        badRequest(response, "Target tenant industry is required.");
        return;
      }

      try {
        const result: RestoreTenantSnapshotPreview = runWithSession(requestSession, () =>
          previewRestoreTenantSnapshot(input),
        );
        sendJson(response, 200, { item: result });
      } catch (error) {
        if (error instanceof Error) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/onboarding/restore") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      const input = await readJson<RestoreTenantSnapshotInput>(request);

      if (!input?.snapshot?.tenant?.name) {
        badRequest(response, "Snapshot payload is invalid.");
        return;
      }

      if (!input.targetTenant?.name?.trim()) {
        badRequest(response, "Target tenant name is required.");
        return;
      }

      if (!input.targetTenant?.slug?.trim()) {
        badRequest(response, "Target tenant slug is required.");
        return;
      }

      if (!input.targetTenant?.industry?.trim()) {
        badRequest(response, "Target tenant industry is required.");
        return;
      }

      try {
        const result = runWithSession(requestSession, () => restoreTenantSnapshot(input));
        sendJson(response, 201, { item: result });
      } catch (error) {
        if (error instanceof Error) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "GET" && pathname === "/api/customers") {
      if (!ensureModuleAccess(response, requestSession, "customers")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listCustomers(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/customers/statements") {
      if (!ensureModuleAccess(response, requestSession, "customers")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listCustomerStatements(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/customers") {
      if (!ensurePermission(response, requestSession, "manage_customers")) {
        return;
      }

      const input = await readJson<CreateCustomerInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.name?.trim() || !input.email?.trim()) {
        badRequest(response, "Customer name and email are required.");
        return;
      }

      const customer = runWithSession(requestSession, () => createCustomer(input));
      sendJson(response, 201, { item: customer });
      return;
    }

    if (request.method === "GET" && pathname === "/api/suppliers") {
      if (!ensureModuleAccess(response, requestSession, "suppliers")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listSuppliers(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/suppliers") {
      if (!ensurePermission(response, requestSession, "manage_suppliers")) {
        return;
      }

      const input = await readJson<CreateSupplierInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.supplierCode?.trim() || !input.name?.trim() || !input.email?.trim()) {
        badRequest(response, "Supplier code, name, and email are required.");
        return;
      }

      if (!Number.isInteger(input.leadTimeDays) || input.leadTimeDays < 0 || input.leadTimeDays > 180) {
        badRequest(response, "Lead time days must be an integer between 0 and 180.");
        return;
      }

      try {
        const supplier = runWithSession(requestSession, () => createSupplier(input));
        sendJson(response, 201, { item: supplier });
      } catch (error) {
        if (
          isSqliteConstraintError(error) &&
          error.message.includes("suppliers.tenant_id, suppliers.supplier_code")
        ) {
          badRequest(response, "A supplier with this code already exists for the selected tenant.");
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "GET" && pathname === "/api/products") {
      if (!ensureModuleAccess(response, requestSession, "products")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listProducts(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/products") {
      if (!ensurePermission(response, requestSession, "manage_products")) {
        return;
      }

      const input = await readJson<CreateProductInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.sku?.trim() || !input.name?.trim()) {
        badRequest(response, "Product SKU and name are required.");
        return;
      }

      if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
        badRequest(response, "unitPrice must be a valid non-negative number.");
        return;
      }

      try {
        const product = runWithSession(requestSession, () => createProduct(input));
        sendJson(response, 201, { item: product });
      } catch (error) {
        if (isSqliteConstraintError(error) && error.message.includes("products.tenant_id, products.sku")) {
          badRequest(response, "A product with this SKU already exists for the selected tenant.");
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "GET" && pathname === "/api/inventory") {
      if (!ensureModuleAccess(response, requestSession, "inventory")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listInventory(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/inventory/adjustments") {
      if (!ensurePermission(response, requestSession, "manage_inventory")) {
        return;
      }

      const input = await readJson<CreateInventoryAdjustmentInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.productId?.trim()) {
        badRequest(response, "productId is required.");
        return;
      }

      if (input.direction !== "in" && input.direction !== "out") {
        badRequest(response, "direction must be either 'in' or 'out'.");
        return;
      }

      if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
        badRequest(response, "quantity must be a positive integer.");
        return;
      }

      try {
        const result = runWithSession(requestSession, () => createInventoryAdjustment(input));
        sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "The selected product does not exist.") {
            badRequest(response, error.message);
            return;
          }

          if (error.message === "Insufficient stock for the selected product.") {
            badRequest(response, error.message);
            return;
          }
        }

        throw error;
      }

      return;
    }

    if (request.method === "GET" && pathname === "/api/orders") {
      if (!ensureModuleAccess(response, requestSession, "orders")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listOrders(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/purchase-orders") {
      if (!ensureModuleAccess(response, requestSession, "purchasing")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listPurchaseOrders(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/invoices") {
      if (!ensureModuleAccess(response, requestSession, "invoices")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listInvoices(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/invoices/collection-activities") {
      if (!ensureModuleAccess(response, requestSession, "invoices")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listInvoiceCollectionActivities(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/approval-requests") {
      if (!ensureModuleAccess(response, requestSession, "approvals")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      sendJson(response, 200, { items: listApprovalRequests(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/reports/summary") {
      if (!ensurePermission(response, requestSession, "view_reports")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      sendJson(response, 200, { item: getReportSummary(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/accounts/balances") {
      if (!ensurePermission(response, requestSession, "view_reports")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      sendJson(response, 200, { items: listAccountBalances(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/journal-entries") {
      if (!ensurePermission(response, requestSession, "view_reports")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      sendJson(response, 200, { items: listJournalEntries(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/audit-logs") {
      if (!ensurePermission(response, requestSession, "view_reports")) {
        return;
      }

      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      sendJson(response, 200, { items: listAuditLogs(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/orders") {
      if (!ensurePermission(response, requestSession, "manage_orders")) {
        return;
      }

      const input = await readJson<CreateOrderInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.customerId?.trim()) {
        badRequest(response, "customerId is required.");
        return;
      }

      if (!input.productId?.trim()) {
        badRequest(response, "productId is required.");
        return;
      }

      if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
        badRequest(response, "quantity must be a positive integer.");
        return;
      }

      try {
        const order = runWithSession(requestSession, () => createOrder(input));
        sendJson(response, 201, { item: order });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "The selected customer does not exist.") {
            badRequest(response, error.message);
            return;
          }

          if (error.message === "The selected product does not exist.") {
            badRequest(response, error.message);
            return;
          }

          if (error.message === "Insufficient stock for the selected product.") {
            badRequest(response, error.message);
            return;
          }
        }

        if (isSqliteConstraintError(error) && error.message.includes("orders.order_number")) {
          badRequest(response, "Order number conflict. Please try again.");
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/purchase-orders") {
      if (!ensurePermission(response, requestSession, "manage_purchase_orders")) {
        return;
      }

      const input = await readJson<CreatePurchaseOrderInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.supplierId?.trim()) {
        badRequest(response, "supplierId is required.");
        return;
      }

      if (!input.productId?.trim()) {
        badRequest(response, "productId is required.");
        return;
      }

      if (!Number.isInteger(input.quantityOrdered) || input.quantityOrdered <= 0) {
        badRequest(response, "Quantity ordered must be a positive integer.");
        return;
      }

      if (!Number.isInteger(input.unitCost) || input.unitCost < 0) {
        badRequest(response, "Unit cost must be a valid non-negative integer.");
        return;
      }

      if (!input.expectedReceiptDate?.trim()) {
        badRequest(response, "Expected receipt date is required.");
        return;
      }

      try {
        const purchaseOrder = runWithSession(requestSession, () => createPurchaseOrder(input));
        sendJson(response, 201, { item: purchaseOrder });
      } catch (error) {
        if (
          error instanceof Error &&
          [
            "The selected supplier does not exist.",
            "The selected product does not exist.",
            "Expected receipt date must be a valid YYYY-MM-DD value.",
          ].includes(error.message)
        ) {
          badRequest(response, error.message);
          return;
        }

        if (isSqliteConstraintError(error) && error.message.includes("purchase_orders.purchase_order_number")) {
          badRequest(response, "Purchase order number conflict. Please try again.");
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices") {
      if (!ensurePermission(response, requestSession, "issue_invoices")) {
        return;
      }

      const input = await readJson<CreateInvoiceInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.orderId?.trim()) {
        badRequest(response, "orderId is required.");
        return;
      }

      if (!Number.isInteger(input.taxRatePercent) || input.taxRatePercent < 0 || input.taxRatePercent > 100) {
        badRequest(response, "taxRatePercent must be an integer between 0 and 100.");
        return;
      }

      if (!input.issueDate?.trim()) {
        badRequest(response, "issueDate is required.");
        return;
      }

      if (!Number.isInteger(input.paymentTermDays) || input.paymentTermDays < 0 || input.paymentTermDays > 365) {
        badRequest(response, "Payment term days must be an integer between 0 and 365.");
        return;
      }

      try {
        const result = runWithSession(requestSession, () => createInvoice(input));
        sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "The selected order does not exist.") {
            badRequest(response, error.message);
            return;
          }

          if (error.message === "Issue date must be a valid YYYY-MM-DD value.") {
            badRequest(response, error.message);
            return;
          }

          if (error.message === "Payment term days must be an integer between 0 and 365.") {
            badRequest(response, error.message);
            return;
          }

          if (isSqliteConstraintError(error)) {
            if (error.message.includes("invoices.order_id")) {
              badRequest(response, "An invoice already exists for the selected order.");
              return;
            }

            if (error.message.includes("invoices.invoice_number")) {
              badRequest(response, "Invoice number conflict. Please try again.");
              return;
            }
          }
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/purchase-orders/receipts") {
      if (!ensurePermission(response, requestSession, "receive_purchase_orders")) {
        return;
      }

      const input = await readJson<ReceivePurchaseOrderInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.purchaseOrderId?.trim()) {
        badRequest(response, "purchaseOrderId is required.");
        return;
      }

      if (!Number.isInteger(input.quantityReceived) || input.quantityReceived <= 0) {
        badRequest(response, "Received quantity must be a positive integer.");
        return;
      }

      if (!input.receivedDate?.trim()) {
        badRequest(response, "Received date is required.");
        return;
      }

      try {
        const result = runWithSession(requestSession, () => receivePurchaseOrder(input));
        sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message === "The selected purchase order does not exist." ||
            error.message === "The selected product does not exist." ||
            error.message === "Received quantity must be a positive integer." ||
            error.message === "Received date must be a valid YYYY-MM-DD value." ||
            error.message === "The selected purchase order is already fully received." ||
            error.message === "Received quantity cannot exceed the outstanding quantity."
          ) {
            badRequest(response, error.message);
            return;
          }
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/payments") {
      if (!ensurePermission(response, requestSession, "record_invoice_payments")) {
        return;
      }

      const input = await readJson<CreateInvoicePaymentInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.invoiceId?.trim()) {
        badRequest(response, "invoiceId is required.");
        return;
      }

      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        badRequest(response, "Payment amount must be a positive integer.");
        return;
      }

      if (!["bank_transfer", "cash", "card"].includes(input.method)) {
        badRequest(response, "Payment method is invalid.");
        return;
      }

      try {
        const result = runWithSession(requestSession, () => createInvoicePayment(input));
        sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
      } catch (error) {
        if (
          error instanceof Error &&
          [
            "The selected invoice does not exist.",
            "The selected invoice is already settled.",
            "Payment amount cannot exceed the outstanding balance.",
          ].includes(error.message)
        ) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/collections") {
      if (!ensurePermission(response, requestSession, "manage_collections")) {
        return;
      }

      const input = await readJson<UpdateInvoiceCollectionInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.invoiceId?.trim()) {
        badRequest(response, "invoiceId is required.");
        return;
      }

      if (!["new", "contacted", "promised", "escalated"].includes(input.followUpStatus)) {
        badRequest(response, "Follow-up status is invalid.");
        return;
      }

      if (!["monitor", "call_customer", "confirm_payment", "escalate_founder"].includes(input.actionRequired)) {
        badRequest(response, "Collection action is invalid.");
        return;
      }

      try {
        const invoice = runWithSession(requestSession, () => updateInvoiceCollection(input));
        sendJson(response, 200, { item: invoice });
      } catch (error) {
        if (
          error instanceof Error &&
          [
            "The selected invoice does not exist.",
            "Promised payment date must be a valid YYYY-MM-DD value.",
            "Next action date must be a valid YYYY-MM-DD value.",
            "Promised payment date is required when status is promised.",
            "Next action date is required when an action is assigned.",
            "Collection note must be 240 characters or fewer.",
            "Follow-up status is invalid.",
            "Collection action is invalid.",
          ].includes(error.message)
        ) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/collections/resolve") {
      if (!ensurePermission(response, requestSession, "manage_collections")) {
        return;
      }

      const input = await readJson<ResolveInvoiceCollectionActionInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.invoiceId?.trim()) {
        badRequest(response, "invoiceId is required.");
        return;
      }

      try {
        const invoice = runWithSession(requestSession, () => resolveInvoiceCollectionAction(input));
        sendJson(response, 200, { item: invoice });
      } catch (error) {
        if (
          error instanceof Error &&
          [
            "The selected invoice does not exist.",
            "There is no assigned collection action to resolve.",
          ].includes(error.message)
        ) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/approval-requests/decision") {
      if (!ensurePermission(response, requestSession, "decide_approvals")) {
        return;
      }

      const input = await readJson<ApprovalDecisionInput>(request);

      if (!input.tenantId?.trim()) {
        badRequest(response, "tenantId is required.");
        return;
      }

      if (!hasTenant(input.tenantId)) {
        badRequest(response, "The selected tenant does not exist.");
        return;
      }

      if (!input.approvalRequestId?.trim()) {
        badRequest(response, "approvalRequestId is required.");
        return;
      }

      if (input.decision !== "approved" && input.decision !== "rejected") {
        badRequest(response, "approval decision is invalid.");
        return;
      }

      try {
        const approvalRequest = runWithSession(requestSession, () => resolveApprovalRequest(input));
        sendJson(response, 200, { item: approvalRequest });
      } catch (error) {
        if (
          error instanceof Error &&
          [
            "The selected approval request does not exist.",
            "The selected approval request has already been resolved.",
            "The selected approval request type is not supported.",
          ].includes(error.message)
        ) {
          badRequest(response, error.message);
          return;
        }

        throw error;
      }

      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    console.error("Unhandled API error", error);
    internalServerError(response);
  }
});

const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  console.log(`SmartERP API foundation listening on http://localhost:${port}`);
  console.log(`SmartERP API persistence ready at ${getDatabasePath()}`);
});
