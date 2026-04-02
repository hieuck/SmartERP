import type {
  CancelOrderInput,
  CloseOrderInput,
  CreateOrderInput,
  OrderRecord,
  UpdateOrderInput,
} from "@smarterp/contracts";

import { cancelOrder, closeOrder, createOrder, listOrders, updateOrder } from "../../api";

export async function loadOrders(tenantId: string): Promise<OrderRecord[]> {
  return listOrders(tenantId);
}

export async function submitOrder(input: CreateOrderInput): Promise<OrderRecord> {
  return createOrder(input);
}

export async function submitOrderUpdate(input: UpdateOrderInput): Promise<OrderRecord> {
  return updateOrder(input);
}

export async function submitOrderCancel(input: CancelOrderInput): Promise<OrderRecord> {
  return cancelOrder(input);
}

export async function submitOrderClose(input: CloseOrderInput): Promise<OrderRecord> {
  return closeOrder(input);
}
