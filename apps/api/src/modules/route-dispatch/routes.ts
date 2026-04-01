import type { ApiRoute } from "./http.js";
import { controlApiRoutes } from "./control-routes.js";
import { fulfillmentApiRoutes } from "./fulfillment-routes.js";
import { masterDataApiRoutes } from "./master-data-routes.js";
import { publicApiRoutes } from "./public-routes.js";
import { tenantApiRoutes } from "./tenant-routes.js";

export const apiRoutes: ApiRoute[] = [
  ...publicApiRoutes,
  ...tenantApiRoutes,
  ...masterDataApiRoutes,
  ...fulfillmentApiRoutes,
  ...controlApiRoutes,
];
