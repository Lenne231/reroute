import type { ReactNode } from "react";
import {
  matchRoutePattern,
  normalizePathname,
  type RouteDefinition,
  type RouteResolution,
} from "../../reroute/src/core/routes";
import { ErrorPage } from "./components/ErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { resolveFailRoute } from "./features/fail/route";
import { resolveHomeRoute } from "./features/home/route";
import { resolveLegacyUsersRoute } from "./features/legacy-users/route";
import { resolveUsersCreateRoute } from "./features/users/create/route";
import { resolveUserDetailRoute } from "./features/users/detail/route";
import { resolveUsersListRoute } from "./features/users/list/route";

const routeConfig: RouteDefinition[] = [
  {
    path: "/legacy-users",
    resolve: resolveLegacyUsersRoute,
  },
  {
    path: "/",
    resolve: resolveHomeRoute,
  },
  {
    path: "/fail",
    resolve: resolveFailRoute,
  },
  {
    path: "/users",
    resolve: resolveUsersListRoute,
  },
  {
    path: "/users/create",
    resolve: resolveUsersCreateRoute,
  },
  {
    path: "/users/:id",
    resolve: async (params: Record<string, string>) =>
      resolveUserDetailRoute({
        id: params.id ?? "",
      }),
  },
];

export async function renderApp(pathname: string): Promise<RouteResolution> {
  const normalized = normalizePathname(pathname);

  try {
    for (const route of routeConfig) {
      const params = matchRoutePattern(normalized, route.path);
      if (!params) {
        continue;
      }

      return await route.resolve(params);
    }

    return {
      page: <NotFoundPage pathname={normalized} />,
      statusCode: 404,
    };
  } catch (error) {
    return {
      page: <ErrorPage error={error} />,
      statusCode: 500,
    };
  }
}
