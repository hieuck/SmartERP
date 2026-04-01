import type {
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
  TenantExportBundle,
  TenantRecord,
} from "@smarterp/contracts";

export type RecoveryDrillCheck = {
  key: string;
  passed: boolean;
  detail: string;
};

export type RecoveryDrillReport = {
  version: "smarterp-next-recovery-drill-v1";
  generatedAt: string;
  sourceTenant: Pick<TenantRecord, "name" | "slug">;
  restoredTenant: Pick<TenantRecord, "name" | "slug" | "industry">;
  baselineCounts: {
    customers: number;
    suppliers: number;
    products: number;
    inventoryLines: number;
    deferredScopes: number;
  };
  restoredCounts: {
    customers: number;
    suppliers: number;
    products: number;
    inventoryLines: number;
  };
  pendingScopes: string[];
  checks: RecoveryDrillCheck[];
  passCount: number;
  totalCount: number;
};

const recoveryDrillStorageKey = "smarterp.next.recoveryDrill";

export function buildRecoveryDrillReport(args: {
  snapshot: TenantExportBundle;
  preview: RestoreTenantSnapshotPreview;
  result: RestoreTenantSnapshotResult;
}): RecoveryDrillReport {
  const { snapshot, preview, result } = args;

  const checks: RecoveryDrillCheck[] = [
    {
      key: "slug-available",
      passed: preview.slugAvailable,
      detail: preview.slugAvailable
        ? "Restore target slug stayed available through preview."
        : "Target slug conflicted during preview.",
    },
    {
      key: "customers-restored",
      passed: result.restoredCustomers === snapshot.customers.length,
      detail: `${result.restoredCustomers}/${snapshot.customers.length} customers restored into the baseline.`,
    },
    {
      key: "suppliers-restored",
      passed: result.restoredSuppliers === snapshot.suppliers.length,
      detail: `${result.restoredSuppliers}/${snapshot.suppliers.length} suppliers restored into the baseline.`,
    },
    {
      key: "products-restored",
      passed: result.restoredProducts === snapshot.products.length,
      detail: `${result.restoredProducts}/${snapshot.products.length} products restored into the baseline.`,
    },
    {
      key: "inventory-restored",
      passed: result.restoredInventoryLines === snapshot.inventories.length,
      detail: `${result.restoredInventoryLines}/${snapshot.inventories.length} inventory lines restored into the baseline.`,
    },
    {
      key: "deferred-scopes-acknowledged",
      passed: preview.pendingScopes.length > 0,
      detail:
        preview.pendingScopes.length > 0
          ? `${preview.pendingScopes.length} scopes intentionally remain deferred for later replay.`
          : "No deferred scope remained after preview.",
    },
  ];

  const passCount = checks.filter((check) => check.passed).length;

  return {
    version: "smarterp-next-recovery-drill-v1",
    generatedAt: new Date().toISOString(),
    sourceTenant: {
      name: snapshot.tenant.name,
      slug: snapshot.tenant.slug,
    },
    restoredTenant: {
      name: result.tenant.name,
      slug: result.tenant.slug,
      industry: result.tenant.industry,
    },
    baselineCounts: {
      customers: snapshot.customers.length,
      suppliers: snapshot.suppliers.length,
      products: snapshot.products.length,
      inventoryLines: snapshot.inventories.length,
      deferredScopes: preview.pendingScopes.length,
    },
    restoredCounts: {
      customers: result.restoredCustomers,
      suppliers: result.restoredSuppliers,
      products: result.restoredProducts,
      inventoryLines: result.restoredInventoryLines,
    },
    pendingScopes: [...preview.pendingScopes],
    checks,
    passCount,
    totalCount: checks.length,
  };
}

export function loadRecoveryDrillReport(): RecoveryDrillReport | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(recoveryDrillStorageKey);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as RecoveryDrillReport;
  } catch {
    return null;
  }
}

export function saveRecoveryDrillReport(report: RecoveryDrillReport): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(recoveryDrillStorageKey, JSON.stringify(report));
}
