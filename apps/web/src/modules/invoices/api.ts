import type {
  ApprovalAwareMutationResult,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  InvoiceCollectionActivityRecord,
  InvoiceRecord,
  ResolveInvoiceCollectionActionInput,
  UpdateInvoiceCollectionInput,
} from "@smarterp/contracts";

import {
  createInvoice,
  createInvoicePayment,
  listInvoiceCollectionActivities,
  listInvoices,
  resolveInvoiceCollectionAction,
  updateInvoiceCollection,
} from "../../api";

export async function loadInvoices(tenantId: string): Promise<InvoiceRecord[]> {
  return listInvoices(tenantId);
}

export async function loadInvoiceCollectionActivities(
  tenantId: string,
): Promise<InvoiceCollectionActivityRecord[]> {
  return listInvoiceCollectionActivities(tenantId);
}

export async function submitInvoiceIssue(
  input: CreateInvoiceInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  return createInvoice(input);
}

export async function submitInvoicePayment(
  input: CreateInvoicePaymentInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  return createInvoicePayment(input);
}

export async function submitInvoiceCollectionUpdate(
  input: UpdateInvoiceCollectionInput,
): Promise<InvoiceRecord> {
  return updateInvoiceCollection(input);
}

export async function submitInvoiceCollectionResolution(
  input: ResolveInvoiceCollectionActionInput,
): Promise<InvoiceRecord> {
  return resolveInvoiceCollectionAction(input);
}
