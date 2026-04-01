import type { ApiRoute } from "../route-dispatch/http.js";
import { withPermission } from "../route-dispatch/helpers.js";
import { handleGetOperationsStatus } from "./http.js";

export const operationsApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/operations/status",
    handle: withPermission("view_operations", ({ response }) => handleGetOperationsStatus(response)),
  },
];
