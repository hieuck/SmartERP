import type { ApiRoute } from "../route-dispatch/http.js";
import { withModuleAccess, withPermission, withTenantQuery } from "../route-dispatch/helpers.js";
import {
  handleCreateCustomer,
  handleListCustomers,
  handleListCustomerStatements,
} from "./http.js";

export const customerApiRoutes: ApiRoute[] = [
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
];
