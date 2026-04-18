import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CreateProductInput,
  CreateProductCategoryInput,
  DeleteProductCategoryInput,
  DeleteProductInput,
  Session,
  UpdateProductCategoryInput,
  UpdateProductInput,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  createProduct,
  createProductCategory,
  deleteProduct,
  deleteProductCategory,
  hasTenant,
  listProductCategories,
  listProducts,
  runWithSession,
  updateProductCategory,
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

function isValidProductImageUrl(value: string | null | undefined): boolean {
  const normalized = value?.trim() ?? "";
  if (!normalized) {
    return true;
  }

  return (
    normalized.startsWith("data:image/") ||
    normalized.startsWith("/") ||
    /^https?:\/\//i.test(normalized)
  );
}

export function handleListProducts(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listProducts(tenantId) });
}

export function handleListProductCategories(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listProductCategories(tenantId) });
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

  if (!input.categoryId?.trim()) {
    badRequest(response, "productCategoryId is required.");
    return;
  }

  if (!input.name?.trim()) {
    badRequest(response, "Product category and name are required.");
    return;
  }

  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    badRequest(response, "unitPrice must be a valid non-negative number.");
    return;
  }

  if (!isValidProductImageUrl(input.imageUrl)) {
    badRequest(response, "Product image URL must be an absolute URL, root-relative path, or data image URL.");
    return;
  }

  try {
    const product = runWithSession(requestSession, () => createProduct(input));
    sendJson(response, 201, { item: product });
  } catch (error) {
    if (error instanceof Error && error.message === "The selected product category does not exist.") {
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

  if (!input.categoryId?.trim()) {
    badRequest(response, "productCategoryId is required.");
    return;
  }

  if (!input.name?.trim()) {
    badRequest(response, "Product category and name are required.");
    return;
  }

  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    badRequest(response, "unitPrice must be a valid non-negative number.");
    return;
  }

  if (!isValidProductImageUrl(input.imageUrl)) {
    badRequest(response, "Product image URL must be an absolute URL, root-relative path, or data image URL.");
    return;
  }

  try {
    const product = runWithSession(requestSession, () => updateProduct(input));
    sendJson(response, 200, { item: product });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "The selected product does not exist." ||
        error.message === "The selected product category does not exist.")
    ) {
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

export async function handleCreateProductCategory(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateProductCategoryInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.name?.trim()) {
    badRequest(response, "Product category name is required.");
    return;
  }

  const item = runWithSession(requestSession, () => createProductCategory(input));
  sendJson(response, 201, { item });
}

export async function handleUpdateProductCategory(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<UpdateProductCategoryInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.categoryId?.trim()) {
    badRequest(response, "productCategoryId is required.");
    return;
  }

  if (!input.name?.trim()) {
    badRequest(response, "Product category name is required.");
    return;
  }

  try {
    const item = runWithSession(requestSession, () => updateProductCategory(input));
    sendJson(response, 200, { item });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "The selected product category does not exist." ||
        error.message === "Product category name is required.")
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleDeleteProductCategory(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<DeleteProductCategoryInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.categoryId?.trim()) {
    badRequest(response, "productCategoryId is required.");
    return;
  }

  try {
    const item = runWithSession(requestSession, () => deleteProductCategory(input));
    sendJson(response, 200, { item });
  } catch (error) {
    if (
      error instanceof Error &&
      (
        error.message === "The selected product category does not exist." ||
        error.message === "The selected product category cannot be deleted because products still reference it." ||
        error.message === "The default product category cannot be deleted."
      )
    ) {
      badRequest(response, error.message);
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
