import {
  handleCreateCustomer,
  handleListCustomers,
  handleListCustomerStatements,
} from "../customers/index.js";
import {
  handleCreateProduct,
  handleListProducts,
} from "../products/index.js";
import {
  handleCreateSupplier,
  handleListSuppliers,
} from "../suppliers/index.js";
import type { ApiRoute } from "./http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "./helpers.js";

export const masterDataApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/customers",
    handle: withModuleAccess(
      "customers",
      withTenantQuery(({ response }, tenantId) => handleListCustomers(response, tenantId)),
    ),
  },
  {
    method: "GET",
    path: "/api/customers/statements",
    handle: withModuleAccess(
      "customers",
      withTenantQuery(({ response }, tenantId) => handleListCustomerStatements(response, tenantId)),
    ),
  },
  {
    method: "POST",
    path: "/api/customers",
    handle: withPermission("manage_customers", ({ request, response, session }) =>
      handleCreateCustomer(request, response, session),
    ),
  },
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
