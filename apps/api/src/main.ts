import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { URL } from "node:url";

import { sendEmpty, sendJson } from "./http.js";
import { getDatabasePath } from "./database.js";
import { getRequestSession } from "./modules/auth/index.js";
import {
  apiRoutes,
  dispatchApiRoute,
  internalServerError,
} from "./modules/route-dispatch/index.js";

const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
  try {
    if (!request.url || !request.method) {
      sendJson(response, 400, { error: "Invalid request." });
      return;
    }

    if (request.method === "OPTIONS") {
      sendEmpty(response);
      return;
    }

    const url = new URL(request.url, "http://localhost:4000");
    const handled = await dispatchApiRoute(
      {
        method: request.method,
        pathname: url.pathname,
        request,
        response,
        session: getRequestSession(request),
        url,
      },
      apiRoutes,
    );

    if (handled) {
      return;
    }

    sendJson(response, 404, { error: "Route not found." });
  } catch (error) {
    console.error("Unhandled API error", error);
    internalServerError(response);
  }
});

const port = Number(process.env.PORT ?? 4000);

server.listen(port, () => {
  console.log(`SmartERP API foundation listening on http://localhost:${port}`);
  console.log(`SmartERP API persistence ready at ${getDatabasePath()}`);
});
