import type { ApiRoute } from "../route-dispatch/http.js";
import { handleLogin } from "./http.js";

export const authApiRoutes: ApiRoute[] = [
  {
    method: "POST",
    path: "/api/auth/login",
    public: true,
    handle: ({ request, response }) => handleLogin(request, response),
  },
];
