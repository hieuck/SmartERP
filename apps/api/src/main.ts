import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

import {
  canAccessModule,
  hasPermission,
  type ApprovalDecisionInput,
  type FoundationModule,
  type CreateTenantInput,
  type ImportOnboardingInput,
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
  authenticationRequired,
  getRequestSession,
  handleLogin,
  isPublicRoute,
} from "./modules/auth/index.js";
import {
  handleCreateCustomer,
  handleListCustomers,
  handleListCustomerStatements,
} from "./modules/customers/index.js";
import {
  handleGetFoundation,
  handleGetHealth,
} from "./modules/foundation/index.js";
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
  handleCreateTenant,
  handleExportTenantSnapshot,
  handleImportOnboardingDataset,
  handleListTenants,
  handlePreviewRestoreTenantSnapshot,
  handleRestoreTenantSnapshot,
} from "./modules/tenants/index.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

function forbidden(response: ServerResponse): void {
  sendJson(response, 403, { error: "Forbidden." });
}

function internalServerError(response: ServerResponse): void {
  sendJson(response, 500, { error: "Internal server error." });
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
      handleGetHealth(response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/foundation") {
      handleGetFoundation(response);
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
      await handleLogin(request, response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/tenants") {
      handleListTenants(response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/tenants") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      await handleCreateTenant(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/onboarding/import") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      await handleImportOnboardingDataset(request, response, requestSession);
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

      handleExportTenantSnapshot(response, tenantId);
      return;
    }

    if (request.method === "POST" && pathname === "/api/onboarding/restore/preview") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      await handlePreviewRestoreTenantSnapshot(request, response, requestSession);
      return;
    }

    if (request.method === "POST" && pathname === "/api/onboarding/restore") {
      if (!ensurePermission(response, requestSession, "manage_tenants")) {
        return;
      }

      await handleRestoreTenantSnapshot(request, response, requestSession);
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
