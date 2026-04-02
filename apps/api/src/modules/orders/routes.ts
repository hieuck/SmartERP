import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleCancelOrder,
  handleCloseOrder,
  handleCreateOrder,
  handleListOrders,
  handleReopenOrder,
  handleUpdateOrder,
} from "./http.js";

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
  {
    method: "POST",
    path: "/api/orders/update",
    handle: withPermission("manage_orders", ({ request, response, session }) =>
      handleUpdateOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/orders/close",
    handle: withPermission("manage_orders", ({ request, response, session }) =>
      handleCloseOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/orders/reopen",
    handle: withPermission("manage_orders", ({ request, response, session }) =>
      handleReopenOrder(request, response, session),
    ),
  },
];
