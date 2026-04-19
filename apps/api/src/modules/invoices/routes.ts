import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleAmendInvoice,
  handleCloseInvoiceReturnAuthorization,
  handleCreditInvoice,
  handleCreateInvoice,
  handleCreateInvoicePayment,
  handleCreateInvoiceReturnAuthorization,
  handleListInvoiceCollectionActivities,
  handleListInvoices,
  handleRecordInvoiceReturnReceipt,
  handleReopenInvoice,
  handleResolveInvoiceCollectionAction,
  handleUpdateInvoiceCollection,
  handleVoidInvoice,
} from "./http.js";

export const invoiceApiRoutes: ApiRoute[] = [
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
    path: "/api/invoices/amend",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleAmendInvoice(request, response, session),
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
    path: "/api/invoices/credit",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleCreditInvoice(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/return-authorizations",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleCreateInvoiceReturnAuthorization(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/return-authorizations/close",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleCloseInvoiceReturnAuthorization(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/return-receipts",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleRecordInvoiceReturnReceipt(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/void",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleVoidInvoice(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/invoices/reopen",
    handle: withPermission("issue_invoices", ({ request, response, session }) =>
      handleReopenInvoice(request, response, session),
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
];
