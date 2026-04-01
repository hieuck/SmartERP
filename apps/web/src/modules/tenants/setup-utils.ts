import type { TenantExportBundle } from "@smarterp/contracts";

export function downloadJsonFile(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}

export function parseRestoreSnapshot(snapshotJson: string): TenantExportBundle | null {
  try {
    const snapshot = JSON.parse(snapshotJson) as TenantExportBundle;
    if (
      !snapshot?.tenant?.name ||
      !Array.isArray(snapshot.customers) ||
      !Array.isArray(snapshot.suppliers) ||
      !Array.isArray(snapshot.products) ||
      !Array.isArray(snapshot.inventories) ||
      !Array.isArray(snapshot.orders) ||
      !Array.isArray(snapshot.purchaseOrders) ||
      !Array.isArray(snapshot.invoices) ||
      !Array.isArray(snapshot.collectionActivities) ||
      !Array.isArray(snapshot.approvalRequests) ||
      !Array.isArray(snapshot.auditLogs) ||
      !Array.isArray(snapshot.accountBalances) ||
      !Array.isArray(snapshot.journalEntries)
    ) {
      return null;
    }

    return snapshot;
  } catch {
    return null;
  }
}
