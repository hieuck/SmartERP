import type { ApiRoute } from "../route-dispatch/http.js";
import { withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleGetReportSummary,
  handleListAccountBalances,
  handleListAuditLogs,
  handleListJournalEntries,
} from "./http.js";

export const reportApiRoutes: ApiRoute[] = [
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
