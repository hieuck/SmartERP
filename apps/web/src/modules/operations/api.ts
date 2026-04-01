import type { OperationsStatusPayload } from "@smarterp/contracts";

import { getOperationsStatus } from "../../api";

export async function loadOperationsStatus(): Promise<OperationsStatusPayload> {
  return getOperationsStatus();
}
