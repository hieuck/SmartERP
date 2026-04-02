import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import { handleCancelOrder, handleCreateOrder, handleListOrders } from "./http.js";

export const orderApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/orders",
    handle: withModuleAccess(
      "orders",
      withTenantQuery(({ response }, tenantId) => handleListOrders(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/orders",
    handle: withPermission("manage_orders", ({ request, response, session }) =>
      handleCreateOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/orders/cancel",
    handle: withPermission("manage_orders", ({ request, response, session }) =>
      handleCancelOrder(request, response, session),
    ),
  },
];
