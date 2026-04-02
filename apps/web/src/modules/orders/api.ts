import type { CancelOrderInput, CloseOrderInput, CreateOrderInput, OrderRecord } from "@smarterp/contracts";

import { cancelOrder, closeOrder, createOrder, listOrders } from "../../api";

export async function loadOrders(tenantId: string): Promise<OrderRecord[]> {
  return listOrders(tenantId);
}

export async function submitOrder(input: CreateOrderInput): Promise<OrderRecord> {
  return createOrder(input);
}

export async function submitOrderCancel(input: CancelOrderInput): Promise<OrderRecord> {
  return cancelOrder(input);
}

export async function submitOrderClose(input: CloseOrderInput): Promise<OrderRecord> {
  return closeOrder(input);
}
