import type { ReactNode } from "react";
import {
  layoutDefinition,
  matchRoutePattern,
  normalizePathname,
  routeDefinition,
  type RouteDefinition,
  type RouteResolution,
} from "../../reroute/src/core/routes";
import { ErrorPage } from "./components/ErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { resolveFailRoute } from "./features/fail/route";
import { resolveHomeRoute } from "./features/home/route";
import { resolveLegacyUsersRoute } from "./features/legacy-users/route";
import { resolveRootLayout } from "./features/root/route";
import { resolveUsersCreateRoute } from "./features/users/create/route";
import { resolveUserDetailRoute } from "./features/users/detail/route";
import { resolveUsersListRoute } from "./features/users/list/route";

const routeConfig: RouteDefinition[] = [
  layoutDefinition("/", resolveRootLayout),
  routeDefinition("/legacy-users", resolveLegacyUsersRoute),
  routeDefinition("/", resolveHomeRoute),
  routeDefinition("/fail", resolveFailRoute),
  routeDefinition("/users", resolveUsersListRoute),
  routeDefinition("/users/create", resolveUsersCreateRoute),
  routeDefinition("/users/:id", async (params: Record<string, string>) =>
    resolveUserDetailRoute({
      id: params.id ?? "",
    }),
  ),
];

export async function renderApp(pathname: string): Promise<RouteResolution> {
  const normalized = normalizePathname(pathname);

  try {
    const matched = routeConfig
      .map((route) => ({
        route,
        params: matchRoutePattern(normalized, route.path),
      }))
      .filter(
        (
          entry,
        ): entry is {
          route: RouteDefinition;
          params: Record<string, string>;
        } => entry.params !== null,
      );

    const routeMatch = matched.find(({ route }) => route.type === "route");
    if (routeMatch) {
      return (await routeMatch.route.resolve(
        routeMatch.params,
      )) as RouteResolution;
    }

    const layoutMatch = matched.find(({ route }) => route.type === "layout");
    if (layoutMatch) {
      return (await layoutMatch.route.resolve(
        layoutMatch.params,
      )) as RouteResolution;
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
