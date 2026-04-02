import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleCancelPurchaseOrder,
  handleClosePurchaseOrder,
  handleCreatePurchaseOrder,
  handleListPurchaseOrders,
  handleReceivePurchaseOrder,
} from "./http.js";

export const purchaseOrderApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/purchase-orders",
    handle: withModuleAccess(
      "purchasing",
      withTenantQuery(({ response }, tenantId) => handleListPurchaseOrders(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/purchase-orders",
    handle: withPermission("manage_purchase_orders", ({ request, response, session }) =>
      handleCreatePurchaseOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/purchase-orders/cancel",
    handle: withPermission("manage_purchase_orders", ({ request, response, session }) =>
      handleCancelPurchaseOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/purchase-orders/close",
    handle: withPermission("manage_purchase_orders", ({ request, response, session }) =>
      handleClosePurchaseOrder(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/purchase-orders/receipts",
    handle: withPermission("receive_purchase_orders", ({ request, response, session }) =>
      handleReceivePurchaseOrder(request, response, session),
    ),
  },
];
