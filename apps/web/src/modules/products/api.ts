import type {
  CreateProductInput,
  DeleteProductInput,
  ProductRecord,
  UpdateProductInput,
} from "@smarterp/contracts";

import { createProduct, deleteProduct, listProducts, updateProduct } from "../../api";

export async function loadProducts(tenantId: string): Promise<ProductRecord[]> {
  return listProducts(tenantId);
}

export async function submitProduct(input: CreateProductInput): Promise<ProductRecord> {
  return createProduct(input);
}

export async function submitProductUpdate(input: UpdateProductInput): Promise<ProductRecord> {
  return updateProduct(input);
}

export async function submitProductDelete(input: DeleteProductInput): Promise<ProductRecord> {
  return deleteProduct(input);
}
