import type {
  CreateTenantInput,
  ImportOnboardingInput,
  ImportOnboardingResult,
  RestoreTenantSnapshotInput,
  RestoreTenantSnapshotPreview,
  RestoreTenantSnapshotResult,
  TenantExportBundle,
  TenantRecord,
} from "@smarterp/contracts";

import {
  createTenant,
  exportTenantSnapshot,
  importOnboardingDataset,
  listTenants,
  previewRestoreTenantSnapshot,
  restoreTenantSnapshot,
} from "../../api";

export async function loadTenants(): Promise<TenantRecord[]> {
  return listTenants();
}

export async function submitTenant(input: CreateTenantInput): Promise<TenantRecord> {
  return createTenant(input);
}

export async function submitOnboardingImport(
  input: ImportOnboardingInput,
): Promise<ImportOnboardingResult> {
  return importOnboardingDataset(input);
}

export async function exportTenantSnapshotBundle(
  tenantId: string,
): Promise<TenantExportBundle> {
  return exportTenantSnapshot(tenantId);
}

export async function previewTenantSnapshotRestore(
  input: RestoreTenantSnapshotInput,
): Promise<RestoreTenantSnapshotPreview> {
  return previewRestoreTenantSnapshot(input);
}

export async function restoreTenantSnapshotBundle(
  input: RestoreTenantSnapshotInput,
): Promise<RestoreTenantSnapshotResult> {
  return restoreTenantSnapshot(input);
}
