import {
  ensureModuleAccess,
  ensurePermission,
  getRequiredTenantId,
  type ApiRequestContext,
} from "./http.js";

export type RouteHandler = (context: ApiRequestContext) => Promise<void> | void;
export type TenantRouteHandler = (
  context: ApiRequestContext,
  tenantId: string,
) => Promise<void> | void;

export function withPermission(
  permission: Parameters<typeof ensurePermission>[1],
  handler: RouteHandler,
): RouteHandler {
  return async (context) => {
    if (!ensurePermission(context, permission)) {
      return;
    }

    await handler(context);
  };
}

export function withModuleAccess(
  module: Parameters<typeof ensureModuleAccess>[1],
  handler: RouteHandler,
): RouteHandler {
  return async (context) => {
    if (!ensureModuleAccess(context, module)) {
      return;
    }

    await handler(context);
  };
}

export function withTenantQuery(handler: TenantRouteHandler): RouteHandler {
  return async (context) => {
    const tenantId = getRequiredTenantId(context);

    if (!tenantId) {
      return;
    }

    await handler(context, tenantId);
  };
}
