import type { IncomingMessage, ServerResponse } from "node:http";

import type { CreateInventoryAdjustmentInput, Session } from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  createInventoryAdjustment,
  hasTenant,
  listInventory,
  runWithSession,
} from "../../store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

export function handleListInventory(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listInventory(tenantId) });
}

export async function handleCreateInventoryAdjustment(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateInventoryAdjustmentInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.productId?.trim()) {
    badRequest(response, "productId is required.");
    return;
  }

  if (input.direction !== "in" && input.direction !== "out") {
    badRequest(response, "direction must be either 'in' or 'out'.");
    return;
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    badRequest(response, "quantity must be a positive integer.");
    return;
  }

  try {
    const result = runWithSession(requestSession, () => createInventoryAdjustment(input));
    sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "The selected product does not exist.") {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "Insufficient stock for the selected product.") {
        badRequest(response, error.message);
        return;
      }
    }

    throw error;
  }
}
