import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import { handleCreateProduct, handleListProducts } from "./http.js";

export const productApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/products",
    handle: withModuleAccess(
      "products",
      withTenantQuery(({ response }, tenantId) => handleListProducts(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/products",
    handle: withPermission("manage_products", ({ request, response, session }) =>
      handleCreateProduct(request, response, session),
    ),
  },
];
