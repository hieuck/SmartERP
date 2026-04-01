import type {
  FoundationSnapshot,
  OperationsStatusPayload,
  PilotHandoffPackage,
  Session,
  TenantExportBundle,
} from "@smarterp/contracts";

type BuildPilotHandoffPackageInput = {
  foundation: FoundationSnapshot | null;
  operationsStatus: OperationsStatusPayload;
  session: Session;
  tenantSnapshot: TenantExportBundle;
  workspaceOrigin: string;
};

export function buildPilotHandoffPackage(input: BuildPilotHandoffPackageInput): PilotHandoffPackage {
  const { foundation, operationsStatus, session, tenantSnapshot, workspaceOrigin } = input;
  const tenantStatus =
    operationsStatus.tenants.find((item) => item.tenantId === tenantSnapshot.tenant.id) ?? null;

  return {
    version: "smarterp-next-pilot-handoff-v1",
    generatedAt: new Date().toISOString(),
    workspaceOrigin,
    generatedBy: {
      displayName: session.displayName,
      email: session.email,
      role: session.role,
    },
    tenant: tenantSnapshot.tenant,
    roleAccounts: foundation?.demoAccounts ?? [],
    enabledModules: session.modules,
    snapshotSummary: {
      customerCount: tenantSnapshot.customers.length,
      supplierCount: tenantSnapshot.suppliers.length,
      productCount: tenantSnapshot.products.length,
      inventoryLineCount: tenantSnapshot.inventories.length,
      orderCount: tenantSnapshot.orders.length,
      purchaseOrderCount: tenantSnapshot.purchaseOrders.length,
      invoiceCount: tenantSnapshot.invoices.length,
      collectionActivityCount: tenantSnapshot.collectionActivities.length,
      approvalCount: tenantSnapshot.approvalRequests.length,
      auditLogCount: tenantSnapshot.auditLogs.length,
      journalEntryCount: tenantSnapshot.journalEntries.length,
      accountBalanceCount: tenantSnapshot.accountBalances.length,
    },
    operations: {
      readinessLevel: operationsStatus.readiness.level,
      smokePassed: operationsStatus.smoke?.passed ?? false,
      smokeCheckedAt: operationsStatus.smoke?.checkedAt ?? null,
      runtimeServices: operationsStatus.runtimeServices,
      artifacts: operationsStatus.artifacts,
      totals: operationsStatus.totals,
      tenantStatus,
    },
    runbook: [
      {
        key: "login-founder",
        title: "Founder login and setup context",
        description: "Sign in with the founder account, open Setup, and confirm the selected tenant matches the pilot handoff target.",
        url: `${workspaceOrigin}/dashboard/setup`,
      },
      {
        key: "verify-operations",
        title: "Verify operations readiness",
        description: "Open Operations and confirm readiness level, smoke status, runtime services, and required artifacts are all present before operator onboarding.",
        url: `${workspaceOrigin}/dashboard/operations`,
      },
      {
        key: "assign-role-accounts",
        title: "Assign role accounts",
        description: "Hand the role-based demo accounts to the pilot team so finance, sales, warehouse, purchasing, and collections can validate their own workflows safely.",
        url: `${workspaceOrigin}/login`,
      },
      {
        key: "protect-baseline",
        title: "Protect the baseline snapshot",
        description: "Store the embedded tenant snapshot in a controlled location and use it as the recovery baseline before importing or entering new pilot transactions.",
        url: null,
      },
      {
        key: "open-commercial-cockpit",
        title: "Open the commercial cockpit",
        description: "Validate that reports and collections reflect the same tenant context before the first live pilot cycle starts.",
        url: `${workspaceOrigin}/dashboard/reports`,
      },
    ],
    tenantSnapshot,
  };
}
