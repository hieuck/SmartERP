import type { ApiRoute } from "./http.js";
import { approvalApiRoutes } from "../approvals/index.js";
import { authApiRoutes } from "../auth/index.js";
import { customerApiRoutes } from "../customers/index.js";
import { foundationApiRoutes } from "../foundation/index.js";
import { inventoryApiRoutes } from "../inventory/index.js";
import { invoiceApiRoutes } from "../invoices/index.js";
import { operationsApiRoutes } from "../operations/index.js";
import { orderApiRoutes } from "../orders/index.js";
import { productApiRoutes } from "../products/index.js";
import { purchaseOrderApiRoutes } from "../purchase-orders/index.js";
import { reportApiRoutes } from "../reports/index.js";
import { supplierApiRoutes } from "../suppliers/index.js";
import { tenantApiRoutes } from "../tenants/index.js";

export const apiRoutes: ApiRoute[] = [
  ...foundationApiRoutes,
  ...authApiRoutes,
  ...tenantApiRoutes,
  ...customerApiRoutes,
  ...supplierApiRoutes,
  ...productApiRoutes,
  ...inventoryApiRoutes,
  ...orderApiRoutes,
  ...purchaseOrderApiRoutes,
  ...invoiceApiRoutes,
  ...approvalApiRoutes,
  ...reportApiRoutes,
  ...operationsApiRoutes,
];
