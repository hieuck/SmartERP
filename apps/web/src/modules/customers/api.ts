import type {
  CreateCustomerInput,
  CustomerRecord,
  CustomerStatementRecord,
  DeleteCustomerInput,
  UpdateCustomerInput,
} from "@smarterp/contracts";

import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  listCustomerStatements,
  updateCustomer,
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

export async function submitCustomerUpdate(
  input: UpdateCustomerInput,
): Promise<CustomerRecord> {
  return updateCustomer(input);
}

export async function submitCustomerDelete(
  input: DeleteCustomerInput,
): Promise<CustomerRecord> {
  return deleteCustomer(input);
}
