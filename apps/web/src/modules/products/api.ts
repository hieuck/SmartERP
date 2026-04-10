import type {
  CreateProductInput,
  CreateProductCategoryInput,
  DeleteProductCategoryInput,
  DeleteProductInput,
  ProductCategoryRecord,
  ProductRecord,
  UpdateProductCategoryInput,
  UpdateProductInput,
} from "@smarterp/contracts";

import {
  createProduct,
  createProductCategory,
  deleteProduct,
  deleteProductCategory,
  listProductCategories,
  listProducts,
  updateProduct,
  updateProductCategory,
} from "../../api";

export async function loadProducts(tenantId: string): Promise<ProductRecord[]> {
  return listProducts(tenantId);
}

export async function loadProductCategories(tenantId: string): Promise<ProductCategoryRecord[]> {
  return listProductCategories(tenantId);
}

export async function submitProductCategory(
  input: CreateProductCategoryInput,
): Promise<ProductCategoryRecord> {
  return createProductCategory(input);
}

export async function submitProductCategoryUpdate(
  input: UpdateProductCategoryInput,
): Promise<ProductCategoryRecord> {
  return updateProductCategory(input);
}

export async function submitProductCategoryDelete(
  input: DeleteProductCategoryInput,
): Promise<ProductCategoryRecord> {
  return deleteProductCategory(input);
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
