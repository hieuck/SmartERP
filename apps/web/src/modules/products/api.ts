import type { CreateProductInput, ProductRecord } from "@smarterp/contracts";

import { createProduct, listProducts } from "../../api";

export async function loadProducts(tenantId: string): Promise<ProductRecord[]> {
  return listProducts(tenantId);
}

export async function submitProduct(input: CreateProductInput): Promise<ProductRecord> {
  return createProduct(input);
}
