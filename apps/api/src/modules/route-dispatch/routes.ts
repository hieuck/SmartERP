import {
  handleDecideApprovalRequest,
  handleListApprovalRequests,
} from "../approvals/index.js";
import { handleLogin } from "../auth/index.js";
import {
  handleCreateCustomer,
  handleListCustomers,
  handleListCustomerStatements,
} from "../customers/index.js";
import {
  handleGetFoundation,
  handleGetHealth,
} from "../foundation/index.js";
import {
  handleCreateInvoice,
  handleCreateInvoicePayment,
  handleListInvoiceCollectionActivities,
  handleListInvoices,
  handleResolveInvoiceCollectionAction,
  handleUpdateInvoiceCollection,
} from "../invoices/index.js";
import {
  handleCreateInventoryAdjustment,
  handleListInventory,
} from "../inventory/index.js";
import { handleGetOperationsStatus } from "../operations/index.js";
import { handleCreateOrder, handleListOrders } from "../orders/index.js";
import {
  handleCreateProduct,
  handleListProducts,
} from "../products/index.js";
import {
  handleCreatePurchaseOrder,
  handleListPurchaseOrders,
  handleReceivePurchaseOrder,
} from "../purchase-orders/index.js";
import {
  handleGetReportSummary,
  handleListAccountBalances,
  handleListAuditLogs,
  handleListJournalEntries,
} from "../reports/index.js";
import {
  handleCreateSupplier,
  handleListSuppliers,
} from "../suppliers/index.js";
import {
  handleCreateTenant,
  handleExportTenantSnapshot,
  handleImportOnboardingDataset,
  handleListTenants,
  handlePreviewRestoreTenantSnapshot,
  handleRestoreTenantSnapshot,
} from "../tenants/index.js";
import {
  type ApiRequestContext,
  type ApiRoute,
  ensureModuleAccess,
  ensurePermission,
  getRequiredTenantId,
} from "./http.js";

type RouteHandler = (context: ApiRequestContext) => Promise<void> | void;
type TenantRouteHandler = (
  context: ApiRequestContext,
  tenantId: string,
) => Promise<void> | void;

function withPermission(permission: Parameters<typeof ensurePermission>[1], handler: RouteHandler): RouteHandler {
  return async (context) => {
    if (!ensurePermission(context, permission)) {
      return;
    }

    await handler(context);
  };
}

function withModuleAccess(
  module: Parameters<typeof ensureModuleAccess>[1],
  handler: RouteHandler,
): RouteHandler {
  return async (context) => {
    if (!ensureModuleAccess(context, module)) {
      return;
    }

    await handler(context);
  };
}

function withTenantQuery(handler: TenantRouteHandler): RouteHandler {
  return async (context) => {
    const tenantId = getRequiredTenantId(context);

    if (!tenantId) {
      return;
    }

    await handler(context, tenantId);
  };
}

export const apiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/health",
    public: true,
    handle: ({ response }) => handleGetHealth(response),
  },
  {
    method: "GET",
    path: "/api/foundation",
    public: true,
    handle: ({ response }) => handleGetFoundation(response),
  },
  {
    method: "POST",
    path: "/api/auth/login",
    public: true,
    handle: ({ request, response }) => handleLogin(request, response),
  },
  {
    method: "GET",
    path: "/api/operations/status",
    handle: withPermission("view_operations", ({ response }) => handleGetOperationsStatus(response)),
  },
  {
    method: "GET",
    path: "/api/tenants",
    handle: ({ response }) => handleListTenants(response),
  },
  {
    method: "POST",
    path: "/api/tenants",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handleCreateTenant(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/onboarding/import",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handleImportOnboardingDataset(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/onboarding/export",
    handle: withPermission("manage_tenants", (context) => {
      const tenantId = getRequiredTenantId(context);

      if (!tenantId) {
        return;
      }

      handleExportTenantSnapshot(context.response, tenantId);
    }),
  },
  {
    method: "POST",
    path: "/api/onboarding/restore/preview",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handlePreviewRestoreTenantSnapshot(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/onboarding/restore",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handleRestoreTenantSnapshot(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/customers",
    handle: withModuleAccess(
      "customers",
      withTenantQuery(({ response }, tenantId) => handleListCustomers(response, tenantId)),
    ),
  },
  {
    method: "GET",
    path: "/api/customers/statements",
    handle: withModuleAccess(
      "customers",
      withTenantQuery(({ response }, tenantId) => handleListCustomerStatements(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/customers",
    handle: withPermission("manage_customers", ({ request, response, session }) =>
      handleCreateCustomer(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/suppliers",
    handle: withModuleAccess(
      "suppliers",
      withTenantQuery(({ response }, tenantId) => handleListSuppliers(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/suppliers",
    handle: withPermission("manage_suppliers", ({ request, response, session }) =>
      handleCreateSupplier(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/products",
    handle: withModuleAccess(
      "products",
      withTenantQuery(({ response }, tenantId) => handleListProducts(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/products",
    handle: withPermission("manage_products", ({ request, response, session }) =>
      handleCreateProduct(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/inventory",
    handle: withModuleAccess(
      "inventory",
      withTenantQuery(({ response }, tenantId) => handleListInventory(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/inventory/adjustments",
    handle: withPermission("manage_inventory", ({ request, response, session }) =>
      handleCreateInventoryAdjustment(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/orders",
    handle: withModuleAccess(
      "orders",
      withTenantQuery(({ response }, tenantId) => handleListOrders(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/orders",
    handle: withPermission("manage_orders", ({ request, response, session }) =>
      handleCreateOrder(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/purchase-orders",
    handle: withModuleAccess(
      "purchasing",
      withTenantQuery(({ response }, tenantId) => handleListPurchaseOrders(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/purchase-orders",
    handle: withPermission("manage_purchase_orders", ({ request, response, session }) =>
      handleCreatePurchaseOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/purchase-orders/receipts",
    handle: withPermission("receive_purchase_orders", ({ request, response, session }) =>
      handleReceivePurchaseOrder(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/invoices",
    handle: withModuleAccess(
      "invoices",
      withTenantQuery(({ response }, tenantId) => handleListInvoices(response, tenantId)),
    ),
  },
  {
    method: "GET",
    path: "/api/invoices/collection-activities",
    handle: withModuleAccess(
      "invoices",
      withTenantQuery(({ response }, tenantId) =>
        handleListInvoiceCollectionActivities(response, tenantId),
      ),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleCreateInvoice(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/payments",
    handle: withPermission("record_invoice_payments", ({ request, response, session }) =>
      handleCreateInvoicePayment(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/collections",
    handle: withPermission("manage_collections", ({ request, response, session }) =>
      handleUpdateInvoiceCollection(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/collections/resolve",
    handle: withPermission("manage_collections", ({ request, response, session }) =>
      handleResolveInvoiceCollectionAction(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/approval-requests",
    handle: withModuleAccess(
      "approvals",
      withTenantQuery(({ response }, tenantId) => handleListApprovalRequests(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/approval-requests/decision",
    handle: withPermission("decide_approvals", ({ request, response, session }) =>
      handleDecideApprovalRequest(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/reports/summary",
    handle: withPermission(
      "view_reports",
      withTenantQuery(({ response }, tenantId) => handleGetReportSummary(response, tenantId)),
    ),
  },
  {
    method: "GET",
    path: "/api/accounts/balances",
    handle: withPermission(
      "view_reports",
      withTenantQuery(({ response }, tenantId) => handleListAccountBalances(response, tenantId)),
    ),
  },
  {
    method: "GET",
    path: "/api/journal-entries",
    handle: withPermission(
      "view_reports",
      withTenantQuery(({ response }, tenantId) => handleListJournalEntries(response, tenantId)),
    ),
  },
  {
    method: "GET",
    path: "/api/audit-logs",
    handle: withPermission(
      "view_reports",
      withTenantQuery(({ response }, tenantId) => handleListAuditLogs(response, tenantId)),
    ),
  },
];
