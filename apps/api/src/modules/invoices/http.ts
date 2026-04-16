import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  AmendInvoiceInput,
  CreditInvoiceInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  ReopenInvoiceInput,
  ResolveInvoiceCollectionActionInput,
  Session,
  UpdateInvoiceCollectionInput,
  VoidInvoiceInput,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  amendInvoice,
  creditInvoice,
  createInvoice,
  createInvoicePayment,
  hasTenant,
  listInvoiceCollectionActivities,
  listInvoices,
  reopenInvoice,
  resolveInvoiceCollectionAction,
  runWithSession,
  updateInvoiceCollection,
  voidInvoice,
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

export function handleListInvoices(response: ServerResponse, tenantId: string): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listInvoices(tenantId) });
}

export function handleListInvoiceCollectionActivities(
  response: ServerResponse,
  tenantId: string,
): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listInvoiceCollectionActivities(tenantId) });
}

export async function handleCreateInvoice(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateInvoiceInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.orderId?.trim()) {
    badRequest(response, "orderId is required.");
    return;
  }

  if (!Number.isInteger(input.taxRatePercent) || input.taxRatePercent < 0 || input.taxRatePercent > 100) {
    badRequest(response, "taxRatePercent must be an integer between 0 and 100.");
    return;
  }

  if (!input.issueDate?.trim()) {
    badRequest(response, "issueDate is required.");
    return;
  }

  if (!Number.isInteger(input.paymentTermDays) || input.paymentTermDays < 0 || input.paymentTermDays > 365) {
    badRequest(response, "Payment term days must be an integer between 0 and 365.");
    return;
  }

  if (input.amendmentNote !== null && input.amendmentNote !== undefined && typeof input.amendmentNote !== "string") {
    badRequest(response, "Amendment note must be 240 characters or fewer.");
    return;
  }

  try {
    const result = runWithSession(requestSession, () => createInvoice(input));
    sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "The selected order does not exist." ||
        error.message === "Only confirmed orders can be invoiced." ||
        error.message === "An invoice already exists for the selected order."
      ) {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "Issue date must be a valid YYYY-MM-DD value.") {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "Payment term days must be an integer between 0 and 365.") {
        badRequest(response, error.message);
        return;
      }

      if (
        error.message === "Amendment note is required when reissuing an invoice." ||
        error.message === "Amendment note must be 240 characters or fewer."
      ) {
        badRequest(response, error.message);
        return;
      }

      if (isSqliteConstraintError(error)) {
        if (
          error.message.includes("invoices.order_id") ||
          error.message.includes("idx_invoices_tenant_order_active_unique")
        ) {
          badRequest(response, "An invoice already exists for the selected order.");
          return;
        }

        if (error.message.includes("invoices.invoice_number")) {
          badRequest(response, "Invoice number conflict. Please try again.");
          return;
        }
      }
    }

    throw error;
  }
}

export async function handleAmendInvoice(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<AmendInvoiceInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  if (!Number.isInteger(input.taxRatePercent) || input.taxRatePercent < 0 || input.taxRatePercent > 100) {
    badRequest(response, "taxRatePercent must be an integer between 0 and 100.");
    return;
  }

  if (!input.issueDate?.trim()) {
    badRequest(response, "issueDate is required.");
    return;
  }

  if (!Number.isInteger(input.paymentTermDays) || input.paymentTermDays < 0 || input.paymentTermDays > 365) {
    badRequest(response, "Payment term days must be an integer between 0 and 365.");
    return;
  }

  if (input.amendmentNote !== null && input.amendmentNote !== undefined && typeof input.amendmentNote !== "string") {
    badRequest(response, "Amendment note must be 240 characters or fewer.");
    return;
  }

  try {
    const result = runWithSession(requestSession, () => amendInvoice(input));
    sendJson(response, result.kind === "approval_requested" ? 202 : 200, { item: result });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === "The selected invoice does not exist." ||
        error.message === "The selected invoice can only be amended while it is active." ||
        error.message === "The selected invoice cannot be amended because payments already exist." ||
        error.message === "The selected invoice cannot be amended because a newer revision already exists." ||
        error.message === "The selected order does not exist." ||
        error.message === "Only confirmed orders can be invoiced."
      ) {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "Issue date must be a valid YYYY-MM-DD value.") {
        badRequest(response, error.message);
        return;
      }

      if (error.message === "Payment term days must be an integer between 0 and 365.") {
        badRequest(response, error.message);
        return;
      }

      if (
        error.message === "Amendment note is required when amending an active invoice." ||
        error.message === "Amendment note must be 240 characters or fewer."
      ) {
        badRequest(response, error.message);
        return;
      }
    }

    throw error;
  }
}

export async function handleCreateInvoicePayment(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreateInvoicePaymentInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    badRequest(response, "Payment amount must be a positive integer.");
    return;
  }

  if (!["bank_transfer", "cash", "card"].includes(input.method)) {
    badRequest(response, "Payment method is invalid.");
    return;
  }

  try {
    const result = runWithSession(requestSession, () => createInvoicePayment(input));
    sendJson(response, result.kind === "approval_requested" ? 202 : 201, { item: result });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected invoice does not exist.",
        "The selected invoice has been voided.",
        "The selected invoice has been credited.",
        "The selected invoice is already settled.",
        "Payment amount cannot exceed the outstanding balance.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleCreditInvoice(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<CreditInvoiceInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  if (!["bank_transfer", "cash", "card"].includes(input.method)) {
    badRequest(response, "Payment method is invalid.");
    return;
  }

  if (!Number.isInteger(input.creditQuantity) || input.creditQuantity <= 0) {
    badRequest(response, "Credit quantity must be a positive integer.");
    return;
  }

  if (input.creditNote !== null && input.creditNote !== undefined && typeof input.creditNote !== "string") {
    badRequest(response, "Credit note must be 240 characters or fewer.");
    return;
  }

  try {
    const invoice = runWithSession(requestSession, () => creditInvoice(input));
    sendJson(response, 200, { item: invoice });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected invoice does not exist.",
          "The selected invoice has already been credited.",
          "The selected invoice has been voided.",
          "The selected invoice can only be credited after it has been fully paid.",
          "Credit quantity must be a positive integer.",
          "Credit quantity cannot exceed the remaining uncredited quantity.",
          "Credit note is required when crediting a paid invoice.",
          "Credit note must be 240 characters or fewer.",
          "Payment method is invalid.",
        ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleUpdateInvoiceCollection(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<UpdateInvoiceCollectionInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  if (!["new", "contacted", "promised", "escalated"].includes(input.followUpStatus)) {
    badRequest(response, "Follow-up status is invalid.");
    return;
  }

  if (!["monitor", "call_customer", "confirm_payment", "escalate_founder"].includes(input.actionRequired)) {
    badRequest(response, "Collection action is invalid.");
    return;
  }

  try {
    const invoice = runWithSession(requestSession, () => updateInvoiceCollection(input));
    sendJson(response, 200, { item: invoice });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected invoice does not exist.",
        "The selected invoice has been voided.",
        "The selected invoice has been credited.",
        "Promised payment date must be a valid YYYY-MM-DD value.",
        "Next action date must be a valid YYYY-MM-DD value.",
        "Promised payment date is required when status is promised.",
        "Next action date is required when an action is assigned.",
        "Collection note must be 240 characters or fewer.",
        "Follow-up status is invalid.",
        "Collection action is invalid.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleResolveInvoiceCollectionAction(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<ResolveInvoiceCollectionActionInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  try {
    const invoice = runWithSession(requestSession, () => resolveInvoiceCollectionAction(input));
    sendJson(response, 200, { item: invoice });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected invoice does not exist.",
        "The selected invoice has been voided.",
        "The selected invoice has been credited.",
        "There is no assigned collection action to resolve.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleVoidInvoice(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<VoidInvoiceInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  try {
    const invoice = runWithSession(requestSession, () => voidInvoice(input));
    sendJson(response, 200, { item: invoice });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected invoice does not exist.",
        "The selected invoice has already been voided.",
        "The selected invoice has already been credited.",
        "The selected invoice cannot be voided because payments already exist.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}

export async function handleReopenInvoice(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<ReopenInvoiceInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.invoiceId?.trim()) {
    badRequest(response, "invoiceId is required.");
    return;
  }

  try {
    const invoice = runWithSession(requestSession, () => reopenInvoice(input));
    sendJson(response, 200, { item: invoice });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected invoice does not exist.",
        "The selected invoice can only be reopened after it has been voided.",
        "The selected invoice cannot be reopened because a newer revision already exists.",
        "The selected invoice cannot be reopened because an active revision already exists.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}
