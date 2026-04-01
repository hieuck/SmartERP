import {
  handleCreateInventoryAdjustment,
  handleListInventory,
} from "../inventory/index.js";
import { handleCreateOrder, handleListOrders } from "../orders/index.js";
import {
  handleCreatePurchaseOrder,
  handleListPurchaseOrders,
  handleReceivePurchaseOrder,
} from "../purchase-orders/index.js";
import type { ApiRoute } from "./http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "./helpers.js";

export const fulfillmentApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/inventory",
    handle: withModuleAccess(
      "inventory",
      withTenantQuery(({ response }, tenantId) => handleListInventory(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/inventory/adjustments",
    handle: withPermission("manage_inventory", ({ request, response, session }) =>
      handleCreateInventoryAdjustment(request, response, session),
    ),
  },
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
    path: "/api/purchase-orders/receipts",
    handle: withPermission("receive_purchase_orders", ({ request, response, session }) =>
      handleReceivePurchaseOrder(request, response, session),
    ),
  },
];
