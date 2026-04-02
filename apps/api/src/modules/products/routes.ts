import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleCreateProduct,
  handleDeleteProduct,
  handleListProducts,
  handleUpdateProduct,
} from "./http.js";

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
  {
    method: "POST",
    path: "/api/products/update",
    handle: withPermission("manage_products", ({ request, response, session }) =>
      handleUpdateProduct(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/products/delete",
    handle: withPermission("manage_products", ({ request, response, session }) =>
      handleDeleteProduct(request, response, session),
    ),
  },
];
