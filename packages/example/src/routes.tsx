import type { ReactNode } from "react";
import { ErrorPage } from "./components/ErrorPage";
import { NotFoundPage } from "./components/NotFoundPage";
import { resolveFailRoute } from "./features/fail/route";
import { resolveHomeRoute } from "./features/home/route";
import { resolveLegacyUsersRoute } from "./features/legacy-users/route";
import { resolveUsersCreateRoute } from "./features/users/create/route";
import { resolveUserDetailRoute } from "./features/users/detail/route";
import { resolveUsersListRoute } from "./features/users/list/route";

export type RouteResolution = {
  page: ReactNode;
  statusCode: number;
  redirectTo?: string;
  replace?: boolean;
};

type RouteDefinition = {
  path: string;
  resolve: (
    params: Record<string, string>,
  ) => RouteResolution | Promise<RouteResolution>;
};

function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

function matchRoutePattern(
  pathname: string,
  pattern: string,
): Record<string, string> | null {
  const normalizedPathname = normalizePathname(pathname);
  const normalizedPattern = normalizePathname(pattern);

  if (normalizedPathname === normalizedPattern) {
    return {};
  }

  if (!normalizedPattern.includes(":")) {
    return null;
  }

  const pathSegments = normalizedPathname.split("/").filter(Boolean);
  const patternSegments = normalizedPattern.split("/").filter(Boolean);

  if (pathSegments.length !== patternSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];

    if (patternSegment.startsWith(":")) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment ?? "");
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

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
    resolve: async () => {
      await resolveFailRoute();
      return resolveHomeRoute();
    },
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
    resolve: async ({ id }) =>
      resolveUserDetailRoute({
        id: decodeURIComponent(id ?? ""),
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
