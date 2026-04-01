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
  type CreatePurchaseOrderInput,
  type ReceivePurchaseOrderInput,
  type CreateProductInput,
  type CreateSupplierInput,
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
  createPurchaseOrder,
  receivePurchaseOrder,
  createProduct,
  createSupplier,
  createTenant,
  exportTenantSnapshot,
  getReportSummary,
  hasTenant,
  importOnboardingDataset,
  previewRestoreTenantSnapshot,
  restoreTenantSnapshot,
  listAccountBalances,
  listApprovalRequests,
  listAuditLogs,
  listJournalEntries,
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

      await handleCreateOrder(request, response, requestSession);
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

      await handleCreateInvoice(request, response, requestSession);
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
