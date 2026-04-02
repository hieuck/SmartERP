import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CreateCustomerInput,
  DeleteCustomerInput,
  Session,
  UpdateCustomerInput,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  createCustomer,
  deleteCustomer,
  hasTenant,
  listCustomers,
  listCustomerStatements,
  runWithSession,
  updateCustomer,
} from "../../store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

export function handleListCustomers(
  response: ServerResponse,
  tenantId: string,
): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listCustomers(tenantId) });
}

export function handleListCustomerStatements(
  response: ServerResponse,
  tenantId: string,
): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listCustomerStatements(tenantId) });
}

export async function handleCreateCustomer(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateCustomerInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.name?.trim() || !input.email?.trim()) {
    badRequest(response, "Customer name and email are required.");
    return;
  }

  const customer = runWithSession(requestSession, () => createCustomer(input));
  sendJson(response, 201, { item: customer });
}

export async function handleUpdateCustomer(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<UpdateCustomerInput>(request);

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

  if (!input.name?.trim() || !input.email?.trim()) {
    badRequest(response, "Customer name and email are required.");
    return;
  }

  try {
    const customer = runWithSession(requestSession, () => updateCustomer(input));
    sendJson(response, 200, { item: customer });
  } catch (error) {
    if (error instanceof Error && error.message === "The selected customer does not exist.") {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleDeleteCustomer(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<DeleteCustomerInput>(request);

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

  try {
    const customer = runWithSession(requestSession, () => deleteCustomer(input));
    sendJson(response, 200, { item: customer });
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.message === "The selected customer does not exist." ||
        error.message === "The selected customer cannot be deleted because orders or invoices already reference it."
      )
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}
