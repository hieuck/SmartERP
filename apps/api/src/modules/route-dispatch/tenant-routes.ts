import {
  handleCreateTenant,
  handleExportTenantSnapshot,
  handleImportOnboardingDataset,
  handleListTenants,
  handlePreviewRestoreTenantSnapshot,
  handleRestoreTenantSnapshot,
} from "../tenants/index.js";
import type { ApiRoute } from "./http.js";
import { getRequiredTenantId } from "./http.js";
import { withPermission } from "./helpers.js";

export const tenantApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/tenants",
    handle: ({ response }) => handleListTenants(response),
  },
  {
    method: "POST",
    path: "/api/tenants",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handleCreateTenant(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/onboarding/import",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handleImportOnboardingDataset(request, response, session),
    ),
  },
  {
    method: "GET",
    path: "/api/onboarding/export",
    handle: withPermission("manage_tenants", (context) => {
      const tenantId = getRequiredTenantId(context);

      if (!tenantId) {
        return;
      }

      handleExportTenantSnapshot(context.response, tenantId);
    }),
  },
  {
    method: "POST",
    path: "/api/onboarding/restore/preview",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handlePreviewRestoreTenantSnapshot(request, response, session),
    ),
  },
  {
    method: "POST",
    path: "/api/onboarding/restore",
    handle: withPermission("manage_tenants", ({ request, response, session }) =>
      handleRestoreTenantSnapshot(request, response, session),
    ),
  },
];
