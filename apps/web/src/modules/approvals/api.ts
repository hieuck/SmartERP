import type {
  ApprovalDecisionInput,
  ApprovalRequestRecord,
} from "@smarterp/contracts";

import {
  decideApprovalRequest,
  listApprovalRequests,
} from "../../api";

export async function loadApprovalRequests(tenantId: string): Promise<ApprovalRequestRecord[]> {
  return listApprovalRequests(tenantId);
}

export async function submitApprovalDecision(
  input: ApprovalDecisionInput,
): Promise<ApprovalRequestRecord> {
  return decideApprovalRequest(input);
}
