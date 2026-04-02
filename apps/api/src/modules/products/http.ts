import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CreateProductInput,
  DeleteProductInput,
  Session,
  UpdateProductInput,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  createProduct,
  deleteProduct,
  hasTenant,
  listProducts,
  runWithSession,
  updateProduct,
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

export function handleListProducts(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listProducts(tenantId) });
}

export async function handleCreateProduct(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateProductInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.sku?.trim() || !input.name?.trim()) {
    badRequest(response, "Product SKU and name are required.");
    return;
  }

  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    badRequest(response, "unitPrice must be a valid non-negative number.");
    return;
  }

  try {
    const product = runWithSession(requestSession, () => createProduct(input));
    sendJson(response, 201, { item: product });
  } catch (error) {
    if (isSqliteConstraintError(error) && error.message.includes("products.tenant_id, products.sku")) {
      badRequest(response, "A product with this SKU already exists for the selected tenant.");
      return;
    }

    throw error;
  }
}

export async function handleUpdateProduct(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<UpdateProductInput>(request);

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

  if (!input.sku?.trim() || !input.name?.trim()) {
    badRequest(response, "Product SKU and name are required.");
    return;
  }

  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    badRequest(response, "unitPrice must be a valid non-negative number.");
    return;
  }

  try {
    const product = runWithSession(requestSession, () => updateProduct(input));
    sendJson(response, 200, { item: product });
  } catch (error) {
    if (error instanceof Error && error.message === "The selected product does not exist.") {
      badRequest(response, error.message);
      return;
    }

    if (isSqliteConstraintError(error) && error.message.includes("products.tenant_id, products.sku")) {
      badRequest(response, "A product with this SKU already exists for the selected tenant.");
      return;
    }

    throw error;
  }
}

export async function handleDeleteProduct(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<DeleteProductInput>(request);

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

  try {
    const product = runWithSession(requestSession, () => deleteProduct(input));
    sendJson(response, 200, { item: product });
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.message === "The selected product does not exist." ||
        error.message === "The selected product cannot be deleted because sales, purchasing, or inventory already reference it."
      )
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}
