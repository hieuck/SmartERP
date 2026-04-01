import type { ApiRoute } from "../route-dispatch/http.js";
import { handleGetFoundation, handleGetHealth } from "./http.js";

export const foundationApiRoutes: ApiRoute[] = [
  {
    method: "GET",
    path: "/api/health",
    public: true,
    handle: ({ response }) => handleGetHealth(response),
  },
  {
    method: "GET",
    path: "/api/foundation",
    public: true,
    handle: ({ response }) => handleGetFoundation(response),
  },
];
