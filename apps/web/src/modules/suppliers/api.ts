import type { CreateSupplierInput, SupplierRecord } from "@smarterp/contracts";

import { createSupplier, listSuppliers } from "../../api";

export async function loadSuppliers(tenantId: string): Promise<SupplierRecord[]> {
  return listSuppliers(tenantId);
}

export async function submitSupplier(input: CreateSupplierInput): Promise<SupplierRecord> {
  return createSupplier(input);
}
