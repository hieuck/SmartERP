import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CancelOrderInput,
  CloseOrderInput,
  CreateOrderInput,
  ReopenOrderInput,
  Session,
  UpdateOrderInput,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  cancelOrder,
  closeOrder,
  createOrder,
  hasTenant,
  listOrders,
  reopenOrder,
  runWithSession,
  updateOrder,
} from "../../store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

export function handleListOrders(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listOrders(tenantId) });
}

export async function handleCreateOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.customerId?.trim()) {
    badRequest(response, "customerId is required.");
    return;
  }

  if (!input.productId?.trim()) {
    badRequest(response, "productId is required.");
    return;
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    badRequest(response, "quantity must be a positive integer.");
    return;
  }

  try {
    const order = runWithSession(requestSession, () => createOrder(input));
    sendJson(response, 201, { item: order });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "The selected customer does not exist.") {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "The selected product does not exist.") {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "Insufficient stock for the selected product.") {
        badRequest(response, error.message);
        return;
      }
    }

    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code?: string }).code === "ERR_SQLITE_ERROR" &&
      error.message.includes("orders.order_number")
    ) {
      badRequest(response, "Order number conflict. Please try again.");
      return;
    }

    throw error;
  }
}

export async function handleCancelOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CancelOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.orderId?.trim()) {
    badRequest(response, "orderId is required.");
    return;
  }

  try {
    const order = runWithSession(requestSession, () => cancelOrder(input));
    sendJson(response, 200, { item: order });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected order does not exist.",
        "The selected order has already been canceled.",
        "The selected order has already been closed.",
        "The selected order has already been returned.",
        "The selected order cannot be canceled because an invoice already references it.",
        "The selected product does not exist.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleUpdateOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<UpdateOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.orderId?.trim()) {
    badRequest(response, "orderId is required.");
    return;
  }

  if (!input.customerId?.trim()) {
    badRequest(response, "customerId is required.");
    return;
  }

  if (!input.productId?.trim()) {
    badRequest(response, "productId is required.");
    return;
  }

  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    badRequest(response, "quantity must be a positive integer.");
    return;
  }

  try {
    const order = runWithSession(requestSession, () => updateOrder(input));
    sendJson(response, 200, { item: order });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected order does not exist.",
        "The selected order has already been canceled.",
        "The selected order has already been closed.",
        "The selected order has already been returned.",
        "The selected order can only be edited while it is still confirmed.",
        "The selected order cannot be edited because an invoice already references it.",
        "The selected customer does not exist.",
        "The selected product does not exist.",
        "Insufficient stock for the selected product.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleCloseOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CloseOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.orderId?.trim()) {
    badRequest(response, "orderId is required.");
    return;
  }

  try {
    const order = runWithSession(requestSession, () => closeOrder(input));
    sendJson(response, 200, { item: order });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected order does not exist.",
        "The selected order has already been canceled.",
        "The selected order has already been closed.",
        "The selected order has already been returned.",
        "The selected order can only be closed after its active invoice is fully paid.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleReopenOrder(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<ReopenOrderInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.orderId?.trim()) {
    badRequest(response, "orderId is required.");
    return;
  }

  try {
    const order = runWithSession(requestSession, () => reopenOrder(input));
    sendJson(response, 200, { item: order });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected order does not exist.",
        "The selected order has already been canceled.",
        "The selected order has already been returned.",
        "The selected order can only be reopened after it has been closed.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}
