import type {
  CreateCustomerInput,
  CustomerRecord,
  CustomerStatementRecord,
} from "@smarterp/contracts";

import {
  createCustomer,
  listCustomers,
  listCustomerStatements,
} from "../../api";

export async function loadCustomers(tenantId: string): Promise<CustomerRecord[]> {
  return listCustomers(tenantId);
}

export async function loadCustomerStatements(
  tenantId: string,
): Promise<CustomerStatementRecord[]> {
  return listCustomerStatements(tenantId);
}

export async function submitCustomer(
  input: CreateCustomerInput,
): Promise<CustomerRecord> {
  return createCustomer(input);
}
