import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CancelPurchaseOrderInput,
  CreatePurchaseOrderInput,
  ReceivePurchaseOrderInput,
  Session,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  hasTenant,
  listPurchaseOrders,
  receivePurchaseOrder,
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

export function handleListPurchaseOrders(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listPurchaseOrders(tenantId) });
}

export async function handleCreatePurchaseOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreatePurchaseOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.supplierId?.trim()) {
    badRequest(response, "supplierId is required.");
    return;
  }

  if (!input.productId?.trim()) {
    badRequest(response, "productId is required.");
    return;
  }

  if (!Number.isInteger(input.quantityOrdered) || input.quantityOrdered <= 0) {
    badRequest(response, "Quantity ordered must be a positive integer.");
    return;
  }

  if (!Number.isInteger(input.unitCost) || input.unitCost < 0) {
    badRequest(response, "Unit cost must be a valid non-negative integer.");
    return;
  }

  if (!input.expectedReceiptDate?.trim()) {
    badRequest(response, "Expected receipt date is required.");
    return;
  }

  try {
    const purchaseOrder = runWithSession(requestSession, () => createPurchaseOrder(input));
    sendJson(response, 201, { item: purchaseOrder });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected supplier does not exist.",
        "The selected product does not exist.",
        "Expected receipt date must be a valid YYYY-MM-DD value.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    if (isSqliteConstraintError(error) && error.message.includes("purchase_orders.purchase_order_number")) {
      badRequest(response, "Purchase order number conflict. Please try again.");
      return;
    }

    throw error;
  }
}

export async function handleCancelPurchaseOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CancelPurchaseOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.purchaseOrderId?.trim()) {
    badRequest(response, "purchaseOrderId is required.");
    return;
  }

  try {
    const purchaseOrder = runWithSession(requestSession, () => cancelPurchaseOrder(input));
    sendJson(response, 200, { item: purchaseOrder });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected purchase order does not exist.",
        "The selected purchase order has already been canceled.",
        "The selected purchase order cannot be canceled because receipts already exist.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleReceivePurchaseOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<ReceivePurchaseOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.purchaseOrderId?.trim()) {
    badRequest(response, "purchaseOrderId is required.");
    return;
  }

  if (!Number.isInteger(input.quantityReceived) || input.quantityReceived <= 0) {
    badRequest(response, "Received quantity must be a positive integer.");
    return;
  }

  if (!input.receivedDate?.trim()) {
    badRequest(response, "Received date is required.");
    return;
  }

  try {
    const result = runWithSession(requestSession, () => receivePurchaseOrder(input));
    sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "The selected purchase order does not exist." ||
        error.message === "The selected purchase order has been canceled." ||
        error.message === "The selected product does not exist." ||
        error.message === "Received quantity must be a positive integer." ||
        error.message === "Received date must be a valid YYYY-MM-DD value." ||
        error.message === "The selected purchase order is already fully received." ||
        error.message === "Received quantity cannot exceed the outstanding quantity."
      ) {
        badRequest(response, error.message);
        return;
      }
    }

    throw error;
  }
}
