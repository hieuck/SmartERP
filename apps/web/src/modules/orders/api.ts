import type { CreateOrderInput, OrderRecord } from "@smarterp/contracts";

import { createOrder, listOrders } from "../../api";

export async function loadOrders(tenantId: string): Promise<OrderRecord[]> {
  return listOrders(tenantId);
}

export async function submitOrder(input: CreateOrderInput): Promise<OrderRecord> {
  return createOrder(input);
}
