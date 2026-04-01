import type { ServerResponse } from "node:http";

import { sendJson } from "../../http.js";
import {
  getReportSummary,
  hasTenant,
  listAccountBalances,
  listAuditLogs,
  listJournalEntries,
} from "../../store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

export function handleGetReportSummary(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { item: getReportSummary(tenantId) });
}

export function handleListAccountBalances(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listAccountBalances(tenantId) });
}

export function handleListJournalEntries(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listJournalEntries(tenantId) });
}

export function handleListAuditLogs(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listAuditLogs(tenantId) });
}
