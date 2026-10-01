import type { ReactNode } from "react";

export type RouteCacheConfig = {
  swr: boolean;
  enabled: boolean;
  ttlMs: number;
};

export type RouteResolution = {
  page: ReactNode;
  statusCode: number;
  redirectTo?: string;
  replace?: boolean;
  routeCache?: RouteCacheConfig;
};

export type RouteResolver = (
  params: Record<string, string>,
) => RouteResolution | Promise<RouteResolution>;

export type RouteDefinition = {
  path: string;
  resolve: RouteResolver;
};

export function normalizePathname(pathname: string) {
  const normalized = pathname.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

export function matchRoutePattern(
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
