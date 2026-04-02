import type { CancelOrderInput, CreateOrderInput, OrderRecord } from "@smarterp/contracts";

import { cancelOrder, createOrder, listOrders } from "../../api";

export async function loadOrders(tenantId: string): Promise<OrderRecord[]> {
  return listOrders(tenantId);
}

export async function submitOrder(input: CreateOrderInput): Promise<OrderRecord> {
  return createOrder(input);
}

export async function submitOrderCancel(input: CancelOrderInput): Promise<OrderRecord> {
  return cancelOrder(input);
}
