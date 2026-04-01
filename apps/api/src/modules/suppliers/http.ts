import type { IncomingMessage, ServerResponse } from "node:http";

import type { CreateSupplierInput, Session } from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import { createSupplier, hasTenant, listSuppliers, runWithSession } from "../../store.js";

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

export function handleListSuppliers(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listSuppliers(tenantId) });
}

export async function handleCreateSupplier(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateSupplierInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.supplierCode?.trim() || !input.name?.trim() || !input.email?.trim()) {
    badRequest(response, "Supplier code, name, and email are required.");
    return;
  }

  if (!Number.isInteger(input.leadTimeDays) || input.leadTimeDays < 0 || input.leadTimeDays > 180) {
    badRequest(response, "Lead time days must be an integer between 0 and 180.");
    return;
  }

  try {
    const supplier = runWithSession(requestSession, () => createSupplier(input));
    sendJson(response, 201, { item: supplier });
  } catch (error) {
    if (
      isSqliteConstraintError(error) &&
      error.message.includes("suppliers.tenant_id, suppliers.supplier_code")
    ) {
      badRequest(response, "A supplier with this code already exists for the selected tenant.");
      return;
    }

    throw error;
  }
}
