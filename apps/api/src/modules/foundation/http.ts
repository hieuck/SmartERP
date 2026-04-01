import type { ServerResponse } from "node:http";

import {
  demoAccounts,
  demoCredentials,
  describeApiFoundation,
  foundationModules,
  rewriteMessage,
} from "@smarterp/contracts";

import { sendJson } from "../../http.js";

export function handleGetHealth(response: ServerResponse): void {
  sendJson(response, 200, {
    service: "smarterp-api",
    status: "ok",
    foundation: describeApiFoundation(),
  });
}

export function handleGetFoundation(response: ServerResponse): void {
  sendJson(response, 200, {
    modules: foundationModules,
    message: rewriteMessage,
    demoCredentials,
    demoAccounts: demoAccounts.map(({ email, password, displayName, role }) => ({
      email,
      password,
      displayName,
      role,
    })),
  });
}
