import { handleLogin } from "../auth/index.js";
import {
  handleGetFoundation,
  handleGetHealth,
} from "../foundation/index.js";
import type { ApiRoute } from "./http.js";

export const publicApiRoutes: ApiRoute[] = [
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
  {
    method: "POST",
    path: "/api/auth/login",
    public: true,
    handle: ({ request, response }) => handleLogin(request, response),
  },
];
