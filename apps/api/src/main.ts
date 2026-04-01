import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
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
  type CreateTenantInput,
  type ImportOnboardingInput,
  type LoginInput,
  type Permission,
  type RestoreTenantSnapshotInput,
  type RestoreTenantSnapshotPreview,
  type Session,
} from "@smarterp/contracts";

import { readJson, sendEmpty, sendJson } from "./http.js";
import { getDatabasePath } from "./database.js";
import {
  handleDecideApprovalRequest,
  handleListApprovalRequests,
} from "./modules/approvals/index.js";
import {
  handleCreateCustomer,
  handleListCustomers,
  handleListCustomerStatements,
} from "./modules/customers/index.js";
import {
  handleCreateInvoice,
  handleCreateInvoicePayment,
  handleListInvoiceCollectionActivities,
  handleListInvoices,
  handleResolveInvoiceCollectionAction,
  handleUpdateInvoiceCollection,
} from "./modules/invoices/index.js";
import {
  handleCreateInventoryAdjustment,
  handleListInventory,
} from "./modules/inventory/index.js";
import { handleCreateOrder, handleListOrders } from "./modules/orders/index.js";
import { handleGetOperationsStatus } from "./modules/operations/index.js";
import {
  handleCreatePurchaseOrder,
  handleListPurchaseOrders,
  handleReceivePurchaseOrder,
} from "./modules/purchase-orders/index.js";
import {
  handleCreateProduct,
  handleListProducts,
} from "./modules/products/index.js";
import {
  handleGetReportSummary,
  handleListAccountBalances,
  handleListAuditLogs,
  handleListJournalEntries,
} from "./modules/reports/index.js";
import {
  handleCreateSupplier,
  handleListSuppliers,
} from "./modules/suppliers/index.js";
import {
  createTenant,
  exportTenantSnapshot,
  hasTenant,
  importOnboardingDataset,
  previewRestoreTenantSnapshot,
  restoreTenantSnapshot,
  listTenants,
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
      await handleGetOperationsStatus(response);
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

      handleListCustomers(response, tenantId);
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

      handleListCustomerStatements(response, tenantId);
      return;
    }

    if (request.method === "POST" && pathname === "/api/customers") {
      if (!ensurePermission(response, requestSession, "manage_customers")) {
        return;
      }

      await handleCreateCustomer(request, response, requestSession);
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

      handleListSuppliers(response, tenantId);
      return;
    }

    if (request.method === "POST" && pathname === "/api/suppliers") {
      if (!ensurePermission(response, requestSession, "manage_suppliers")) {
        return;
      }

      await handleCreateSupplier(request, response, requestSession);
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

      handleListProducts(response, tenantId);
      return;
    }

    if (request.method === "POST" && pathname === "/api/products") {
      if (!ensurePermission(response, requestSession, "manage_products")) {
        return;
      }

      await handleCreateProduct(request, response, requestSession);
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

      handleListInventory(response, tenantId);
      return;
    }

    if (request.method === "POST" && pathname === "/api/inventory/adjustments") {
      if (!ensurePermission(response, requestSession, "manage_inventory")) {
        return;
      }

      await handleCreateInventoryAdjustment(request, response, requestSession);
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

      handleListOrders(response, tenantId);
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

      handleListPurchaseOrders(response, tenantId);
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

      handleListInvoices(response, tenantId);
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

      handleListInvoiceCollectionActivities(response, tenantId);
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

      handleListApprovalRequests(response, tenantId);
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

      handleGetReportSummary(response, tenantId);
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

      handleListAccountBalances(response, tenantId);
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

      handleListJournalEntries(response, tenantId);
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

      handleListAuditLogs(response, tenantId);
      return;
    }

    if (request.method === "POST" && pathname === "/api/orders") {
      if (!ensurePermission(response, requestSession, "manage_orders")) {
        return;
      }

      await handleCreateOrder(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/purchase-orders") {
      if (!ensurePermission(response, requestSession, "manage_purchase_orders")) {
        return;
      }

      await handleCreatePurchaseOrder(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices") {
      if (!ensurePermission(response, requestSession, "issue_invoices")) {
        return;
      }

      await handleCreateInvoice(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/purchase-orders/receipts") {
      if (!ensurePermission(response, requestSession, "receive_purchase_orders")) {
        return;
      }

      await handleReceivePurchaseOrder(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/payments") {
      if (!ensurePermission(response, requestSession, "record_invoice_payments")) {
        return;
      }

      await handleCreateInvoicePayment(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/collections") {
      if (!ensurePermission(response, requestSession, "manage_collections")) {
        return;
      }

      await handleUpdateInvoiceCollection(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/collections/resolve") {
      if (!ensurePermission(response, requestSession, "manage_collections")) {
        return;
      }

      await handleResolveInvoiceCollectionAction(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/approval-requests/decision") {
      if (!ensurePermission(response, requestSession, "decide_approvals")) {
        return;
      }

      await handleDecideApprovalRequest(request, response, requestSession);
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
