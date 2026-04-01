import type {
  AccountBalanceRecord,
  AuditLogRecord,
  JournalEntryRecord,
  ReportSummary,
} from "@smarterp/contracts";

import {
  getReportSummary,
  listAccountBalances,
  listAuditLogs,
  listJournalEntries,
} from "../../api";

export async function loadReportSummary(tenantId: string): Promise<ReportSummary> {
  return getReportSummary(tenantId);
}

export async function loadAccountBalances(tenantId: string): Promise<AccountBalanceRecord[]> {
  return listAccountBalances(tenantId);
}

export async function loadJournalEntries(tenantId: string): Promise<JournalEntryRecord[]> {
  return listJournalEntries(tenantId);
}

export async function loadAuditLogs(tenantId: string): Promise<AuditLogRecord[]> {
  return listAuditLogs(tenantId);
}
