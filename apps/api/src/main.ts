import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

import {
  demoAccessToken,
  demoCredentials,
  describeApiFoundation,
  foundationModules,
  rewriteMessage,
  type CreateCustomerInput,
  type CreateInvoiceInput,
  type CreateInvoicePaymentInput,
  type CreateInventoryAdjustmentInput,
  type CreateOrderInput,
  type CreateProductInput,
  type CreateTenantInput,
  type LoginInput,
} from "@smarterp/contracts";

import { readJson, sendEmpty, sendJson } from "./http.js";
import { getDatabasePath } from "./database.js";
import {
  createCustomer,
  createInventoryAdjustment,
  createInvoice,
  createInvoicePayment,
  createOrder,
  createProduct,
  createTenant,
  getReportSummary,
  getSession,
  hasTenant,
  listCustomerStatements,
  listCustomers,
  listInventory,
  listInvoices,
  listOrders,
  listProducts,
  listTenants,
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

function hasAuthorizedSession(request: IncomingMessage): boolean {
  return request.headers.authorization === `Bearer ${demoAccessToken}`;
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

    if (!isPublicRoute(request.method, pathname) && !hasAuthorizedSession(request)) {
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
      });
      return;
    }

    if (request.method === "POST" && pathname === "/api/auth/login") {
      const input = await readJson<LoginInput>(request);

      if (input.email !== demoCredentials.email || input.password !== demoCredentials.password) {
        unauthorized(response);
        return;
      }

      sendJson(response, 200, { session: getSession() });
      return;
    }

    if (request.method === "GET" && pathname === "/api/tenants") {
      sendJson(response, 200, { items: listTenants() });
      return;
    }

    if (request.method === "POST" && pathname === "/api/tenants") {
      const input = await readJson<CreateTenantInput>(request);

      if (!input.name?.trim() || !input.slug?.trim() || !input.industry?.trim()) {
        badRequest(response, "Tenant name, slug, and industry are required.");
        return;
      }

      try {
        const tenant = createTenant(input);
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

    if (request.method === "GET" && pathname === "/api/customers") {
      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listCustomers(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/customers/statements") {
      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listCustomerStatements(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/customers") {
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

      const customer = createCustomer(input);
      sendJson(response, 201, { item: customer });
      return;
    }

    if (request.method === "GET" && pathname === "/api/products") {
      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listProducts(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/products") {
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
        const product = createProduct(input);
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
      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listInventory(tenantId) });
      return;
    }

    if (request.method === "POST" && pathname === "/api/inventory/adjustments") {
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
        const item = createInventoryAdjustment(input);
        sendJson(response, 201, { item });
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
      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listOrders(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/invoices") {
      const tenantId = url.searchParams.get("tenantId");

      if (!tenantId) {
        badRequest(response, "tenantId is required.");
        return;
      }

      sendJson(response, 200, { items: listInvoices(tenantId) });
      return;
    }

    if (request.method === "GET" && pathname === "/api/reports/summary") {
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

    if (request.method === "POST" && pathname === "/api/orders") {
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
        const order = createOrder(input);
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

    if (request.method === "POST" && pathname === "/api/invoices") {
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
        const invoice = createInvoice(input);
        sendJson(response, 201, { item: invoice });
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

        throw error;
      }

      return;
    }

    if (request.method === "POST" && pathname === "/api/invoices/payments") {
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
        const invoice = createInvoicePayment(input);
        sendJson(response, 201, { item: invoice });
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
