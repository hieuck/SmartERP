import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import { handleDecideApprovalRequest, handleListApprovalRequests } from "./http.js";

export const approvalApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/approval-requests",
    handle: withModuleAccess(
      "approvals",
      withTenantQuery(({ response }, tenantId) => handleListApprovalRequests(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/approval-requests/decision",
    handle: withPermission("decide_approvals", ({ request, response, session }) =>
      handleDecideApprovalRequest(request, response, session),
    ),
  },
];
