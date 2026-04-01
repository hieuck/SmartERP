import type { ServerResponse } from "node:http";

import { sendJson } from "../../http.js";
import { buildOperationsStatusPayload } from "./service.js";

export async function handleGetOperationsStatus(response: ServerResponse): Promise<void> {
  const item = await buildOperationsStatusPayload();
  sendJson(response, 200, { item });
}
