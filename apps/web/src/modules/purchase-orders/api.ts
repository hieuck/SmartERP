import type {
  ApprovalAwareMutationResult,
  CancelPurchaseOrderInput,
  ClosePurchaseOrderInput,
  CreatePurchaseOrderInput,
  PurchaseOrderRecord,
  ReceivePurchaseOrderInput,
  ReceivePurchaseOrderResult,
  UpdatePurchaseOrderInput,
} from "@smarterp/contracts";

import {
  cancelPurchaseOrder,
  closePurchaseOrder,
  createPurchaseOrder,
  listPurchaseOrders,
  receivePurchaseOrder,
  updatePurchaseOrder,
} from "../../api";

export async function loadPurchaseOrders(tenantId: string): Promise<PurchaseOrderRecord[]> {
  return listPurchaseOrders(tenantId);
}

export async function submitPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrderRecord> {
  return createPurchaseOrder(input);
}

export async function submitPurchaseOrderUpdate(
  input: UpdatePurchaseOrderInput,
): Promise<PurchaseOrderRecord> {
  return updatePurchaseOrder(input);
}

export async function submitPurchaseOrderCancel(
  input: CancelPurchaseOrderInput,
): Promise<PurchaseOrderRecord> {
  return cancelPurchaseOrder(input);
}

export async function submitPurchaseOrderClose(
  input: ClosePurchaseOrderInput,
): Promise<PurchaseOrderRecord> {
  return closePurchaseOrder(input);
}

export async function submitPurchaseOrderReceipt(
  input: ReceivePurchaseOrderInput,
): Promise<ApprovalAwareMutationResult<ReceivePurchaseOrderResult>> {
  return receivePurchaseOrder(input);
}
