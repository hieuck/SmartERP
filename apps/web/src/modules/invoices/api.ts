import type {
  ApprovalAwareMutationResult,
  AmendInvoiceInput,
  CloseInvoiceReturnAuthorizationInput,
  CreditInvoiceInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  CreateInvoiceReturnAuthorizationInput,
  InvoiceCollectionActivityRecord,
  InvoiceReturnAuthorizationRecord,
  InvoiceRecord,
  RecordInvoiceReturnReceiptInput,
  ReopenInvoiceInput,
  ResolveInvoiceCollectionActionInput,
  UpdateInvoiceCollectionInput,
  VoidInvoiceInput,
} from "@smarterp/contracts";

import {
  amendInvoice,
  closeInvoiceReturnAuthorization,
  creditInvoice,
  createInvoice,
  createInvoicePayment,
  createInvoiceReturnAuthorization,
  listInvoiceCollectionActivities,
  listInvoiceReturnAuthorizations,
  listInvoices,
  recordInvoiceReturnReceipt,
  reopenInvoice,
  resolveInvoiceCollectionAction,
  updateInvoiceCollection,
  voidInvoice,
} from "../../api";

export async function loadInvoices(tenantId: string): Promise<InvoiceRecord[]> {
  return listInvoices(tenantId);
}

export async function loadInvoiceCollectionActivities(
  tenantId: string,
): Promise<InvoiceCollectionActivityRecord[]> {
  return listInvoiceCollectionActivities(tenantId);
}

export async function loadInvoiceReturnAuthorizationRecords(
  tenantId: string,
): Promise<InvoiceReturnAuthorizationRecord[]> {
  return listInvoiceReturnAuthorizations(tenantId);
}

export async function submitInvoiceIssue(
  input: CreateInvoiceInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  return createInvoice(input);
}

export async function submitInvoiceAmend(
  input: AmendInvoiceInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  return amendInvoice(input);
}

export async function submitInvoicePayment(
  input: CreateInvoicePaymentInput,
): Promise<ApprovalAwareMutationResult<InvoiceRecord>> {
  return createInvoicePayment(input);
}

export async function submitInvoiceCredit(input: CreditInvoiceInput): Promise<InvoiceRecord> {
  return creditInvoice(input);
}

export async function submitInvoiceReturnAuthorization(
  input: CreateInvoiceReturnAuthorizationInput,
): Promise<InvoiceRecord> {
  return createInvoiceReturnAuthorization(input);
}

export async function submitInvoiceReturnAuthorizationClose(
  input: CloseInvoiceReturnAuthorizationInput,
): Promise<InvoiceRecord> {
  return closeInvoiceReturnAuthorization(input);
}

export async function submitInvoiceReturnReceipt(
  input: RecordInvoiceReturnReceiptInput,
): Promise<InvoiceRecord> {
  return recordInvoiceReturnReceipt(input);
}

export async function submitInvoiceVoid(input: VoidInvoiceInput): Promise<InvoiceRecord> {
  return voidInvoice(input);
}

export async function submitInvoiceReopen(input: ReopenInvoiceInput): Promise<InvoiceRecord> {
  return reopenInvoice(input);
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
