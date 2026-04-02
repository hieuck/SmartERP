import type {
  CreateSupplierInput,
  DeleteSupplierInput,
  SupplierRecord,
  UpdateSupplierInput,
} from "@smarterp/contracts";

import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from "../../api";

export async function loadSuppliers(tenantId: string): Promise<SupplierRecord[]> {
  return listSuppliers(tenantId);
}

export async function submitSupplier(input: CreateSupplierInput): Promise<SupplierRecord> {
  return createSupplier(input);
}

export async function submitSupplierUpdate(input: UpdateSupplierInput): Promise<SupplierRecord> {
  return updateSupplier(input);
}

export async function submitSupplierDelete(input: DeleteSupplierInput): Promise<SupplierRecord> {
  return deleteSupplier(input);
}
