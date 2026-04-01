import type {
  ApprovalAwareMutationResult,
  CreatePurchaseOrderInput,
  PurchaseOrderRecord,
  ReceivePurchaseOrderInput,
  ReceivePurchaseOrderResult,
} from "@smarterp/contracts";

import {
  createPurchaseOrder,
  listPurchaseOrders,
  receivePurchaseOrder,
} from "../../api";

export async function loadPurchaseOrders(tenantId: string): Promise<PurchaseOrderRecord[]> {
  return listPurchaseOrders(tenantId);
}

export async function submitPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrderRecord> {
  return createPurchaseOrder(input);
}

export async function submitPurchaseOrderReceipt(
  input: ReceivePurchaseOrderInput,
): Promise<ApprovalAwareMutationResult<ReceivePurchaseOrderResult>> {
  return receivePurchaseOrder(input);
}
