import type {
  ApprovalAwareMutationResult,
  CreateInventoryAdjustmentInput,
  InventoryRecord,
} from "@smarterp/contracts";

import { createInventoryAdjustment, listInventory } from "../../api";

export async function loadInventory(tenantId: string): Promise<InventoryRecord[]> {
  return listInventory(tenantId);
}

export async function submitInventoryAdjustment(
  input: CreateInventoryAdjustmentInput,
): Promise<ApprovalAwareMutationResult<InventoryRecord>> {
  return createInventoryAdjustment(input);
}
