import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";

import {
  canAccessModule,
  hasPermission,
  type FoundationModule,
  type Permission,
  type Session,
} from "@smarterp/contracts";

import { sendJson } from "../../http.js";
import { authenticationRequired } from "../auth/index.js";

export type ApiRequestContext = {
  method: string;
  pathname: string;
  request: IncomingMessage;
  response: ServerResponse;
  session: Session | null;
  url: URL;
};

export type ApiRoute = {
  method: string;
  path: string;
  public?: boolean;
  handle: (context: ApiRequestContext) => Promise<void> | void;
};

export function badRequest(response: ServerResponse, message: string): void {
  sendJson(response, 400, { error: message });
}

function forbidden(response: ServerResponse): void {
  sendJson(response, 403, { error: "Forbidden." });
}

export function internalServerError(response: ServerResponse): void {
  sendJson(response, 500, { error: "Internal server error." });
}

export function ensureModuleAccess(
  context: ApiRequestContext,
  module: FoundationModule,
): boolean {
  if (!context.session) {
    authenticationRequired(context.response);
    return false;
  }

  if (canAccessModule(context.session, module)) {
    return true;
  }

  forbidden(context.response);
  return false;
}

export function ensurePermission(
  context: ApiRequestContext,
  permission: Permission,
): boolean {
  if (!context.session) {
    authenticationRequired(context.response);
    return false;
  }

  if (hasPermission(context.session, permission)) {
    return true;
  }

  forbidden(context.response);
  return false;
}

export function getRequiredTenantId(context: ApiRequestContext): string | null {
  const tenantId = context.url.searchParams.get("tenantId");

  if (!tenantId) {
    badRequest(context.response, "tenantId is required.");
    return null;
  }

  return tenantId;
}

export async function dispatchApiRoute(
  context: ApiRequestContext,
  routes: ApiRoute[],
): Promise<boolean> {
  const route = routes.find(
    (candidate) => candidate.method === context.method && candidate.path === context.pathname,
  );

  if (!route) {
    return false;
  }

  if (!route.public && !context.session) {
    authenticationRequired(context.response);
    return true;
  }

  await route.handle(context);
  return true;
}
