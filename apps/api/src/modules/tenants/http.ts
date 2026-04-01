import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CreateTenantInput,
  ImportOnboardingInput,
  RestoreTenantSnapshotInput,
  RestoreTenantSnapshotPreview,
  Session,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  createTenant,
  exportTenantSnapshot,
  hasTenant,
  importOnboardingDataset,
  listTenants,
  previewRestoreTenantSnapshot,
  restoreTenantSnapshot,
  runWithSession,
} from "../../store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

function isSqliteConstraintError(error: unknown): error is Error & { code?: string } {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as { code?: string }).code === "ERR_SQLITE_ERROR"
  );
}

function hasValidRestoreSnapshot(input: RestoreTenantSnapshotInput): boolean {
  return Boolean(input?.snapshot?.tenant?.name);
}

function getMissingRestoreTargetField(
  input: RestoreTenantSnapshotInput,
): string | null {
  if (!input.targetTenant?.name?.trim()) {
    return "Target tenant name is required.";
  }

  if (!input.targetTenant?.slug?.trim()) {
    return "Target tenant slug is required.";
  }

  if (!input.targetTenant?.industry?.trim()) {
    return "Target tenant industry is required.";
  }

  return null;
}

export function handleListTenants(response: ServerResponse): void {
  sendJson(response, 200, { items: listTenants() });
}

export async function handleCreateTenant(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateTenantInput>(request);

  if (!input.name?.trim() || !input.slug?.trim() || !input.industry?.trim()) {
    badRequest(response, "Tenant name, slug, and industry are required.");
    return;
  }

  try {
    const tenant = runWithSession(requestSession, () => createTenant(input));
    sendJson(response, 201, { item: tenant });
  } catch (error) {
    if (isSqliteConstraintError(error) && error.message.includes("tenants.slug")) {
      badRequest(response, "A tenant with this slug already exists.");
      return;
    }

    throw error;
  }
}

export async function handleImportOnboardingDataset(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<ImportOnboardingInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.dataset) {
    badRequest(response, "dataset is required.");
    return;
  }

  if (!input.csvText?.trim()) {
    badRequest(response, "CSV data is required.");
    return;
  }

  try {
    const result = runWithSession(requestSession, () => importOnboardingDataset(input));
    sendJson(response, 200, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export function handleExportTenantSnapshot(
  response: ServerResponse,
  tenantId: string,
): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { item: exportTenantSnapshot(tenantId) });
}

export async function handlePreviewRestoreTenantSnapshot(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<RestoreTenantSnapshotInput>(request);

  if (!hasValidRestoreSnapshot(input)) {
    badRequest(response, "Snapshot payload is invalid.");
    return;
  }

  const missingTargetField = getMissingRestoreTargetField(input);
  if (missingTargetField) {
    badRequest(response, missingTargetField);
    return;
  }

  try {
    const result: RestoreTenantSnapshotPreview = runWithSession(requestSession, () =>
      previewRestoreTenantSnapshot(input),
    );
    sendJson(response, 200, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleRestoreTenantSnapshot(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<RestoreTenantSnapshotInput>(request);

  if (!hasValidRestoreSnapshot(input)) {
    badRequest(response, "Snapshot payload is invalid.");
    return;
  }

  const missingTargetField = getMissingRestoreTargetField(input);
  if (missingTargetField) {
    badRequest(response, missingTargetField);
    return;
  }

  try {
    const result = runWithSession(requestSession, () => restoreTenantSnapshot(input));
    sendJson(response, 201, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}
