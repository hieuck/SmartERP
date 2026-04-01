import type { IncomingMessage, ServerResponse } from "node:http";

import {
  getDemoSessionByAccessToken,
  getDemoSessionByCredentials,
  type LoginInput,
  type Session,
} from "@smarterp/contracts";

import { readJson, sendJson } from "../../http.js";

function unauthorized(response: ServerResponse): void {
  sendJson(response, 401, { error: "Invalid credentials." });
}

export function authenticationRequired(response: ServerResponse): void {
  sendJson(response, 401, { error: "Authentication required." });
}

export function isPublicRoute(method: string, pathname: string): boolean {
  return (
    (method === "GET" && pathname === "/api/health") ||
    (method === "GET" && pathname === "/api/foundation") ||
    (method === "POST" && pathname === "/api/auth/login")
  );
}

export function getRequestSession(request: IncomingMessage): Session | null {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return getDemoSessionByAccessToken(authorization.slice("Bearer ".length).trim());
}

export async function handleLogin(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const input = await readJson<LoginInput>(request);
  const session = getDemoSessionByCredentials(input);

  if (!session) {
    unauthorized(response);
    return;
  }

  sendJson(response, 200, { session });
}
