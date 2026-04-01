import {
  handleDecideApprovalRequest,
  handleListApprovalRequests,
} from "../approvals/index.js";
import {
  handleCreateInvoice,
  handleCreateInvoicePayment,
  handleListInvoiceCollectionActivities,
  handleListInvoices,
  handleResolveInvoiceCollectionAction,
  handleUpdateInvoiceCollection,
} from "../invoices/index.js";
import { handleGetOperationsStatus } from "../operations/index.js";
import {
  handleGetReportSummary,
  handleListAccountBalances,
  handleListAuditLogs,
  handleListJournalEntries,
} from "../reports/index.js";
import type { ApiRoute } from "./http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "./helpers.js";

export const controlApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/operations/status",
    handle: withPermission("view_operations", ({ response }) => handleGetOperationsStatus(response)),
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
