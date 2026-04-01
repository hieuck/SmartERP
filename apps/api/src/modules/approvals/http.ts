import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  ApprovalDecisionInput,
  Session,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";
import {
  hasTenant,
  listApprovalRequests,
  resolveApprovalRequest,
  runWithSession,
} from "../../store.js";

function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

export function handleListApprovalRequests(
  response: ServerResponse,
  tenantId: string,
): void {
  if (!hasTenant(tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  sendJson(response, 200, { items: listApprovalRequests(tenantId) });
}

export async function handleDecideApprovalRequest(
  request: IncomingMessage,
  response: ServerResponse,
  requestSession: Session | null,
): Promise<void> {
  const input = await readJson<ApprovalDecisionInput>(request);

  if (!input.tenantId?.trim()) {
    badRequest(response, "tenantId is required.");
    return;
  }

  if (!hasTenant(input.tenantId)) {
    badRequest(response, "The selected tenant does not exist.");
    return;
  }

  if (!input.approvalRequestId?.trim()) {
    badRequest(response, "approvalRequestId is required.");
    return;
  }

  if (input.decision !== "approved" && input.decision !== "rejected") {
    badRequest(response, "approval decision is invalid.");
    return;
  }

  try {
    const approvalRequest = runWithSession(requestSession, () =>
      resolveApprovalRequest(input),
    );
    sendJson(response, 200, { item: approvalRequest });
  } catch (error) {
    if (
      error instanceof Error &&
      [
        "The selected approval request does not exist.",
        "The selected approval request has already been resolved.",
        "The selected approval request type is not supported.",
      ].includes(error.message)
    ) {
      badRequest(response, error.message);
      return;
    }

    throw error;
  }
}
