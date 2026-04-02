import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleCreateSupplier,
  handleDeleteSupplier,
  handleListSuppliers,
  handleUpdateSupplier,
} from "./http.js";

export const supplierApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/suppliers",
    handle: withModuleAccess(
      "suppliers",
      withTenantQuery(({ response }, tenantId) => handleListSuppliers(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/suppliers",
    handle: withPermission("manage_suppliers", ({ request, response, session }) =>
      handleCreateSupplier(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/suppliers/update",
    handle: withPermission("manage_suppliers", ({ request, response, session }) =>
      handleUpdateSupplier(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/suppliers/delete",
    handle: withPermission("manage_suppliers", ({ request, response, session }) =>
      handleDeleteSupplier(request, response, session),
    ),
  },
];
