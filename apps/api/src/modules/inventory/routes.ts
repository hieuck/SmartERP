import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import { handleCreateInventoryAdjustment, handleListInventory } from "./http.js";

export const inventoryApiRoutes: ApiRoute[] = [
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
];
