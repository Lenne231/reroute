import type { ReactNode } from "react";
import type { JoinPath, NormalizePath, ParamsForPath } from "../types";

export type LoaderArgs<Params extends Record<string, string>, Context> = {
  params: Params;
  location: URL;
  context: Context;
  signal: AbortSignal;
};

export type LoaderFn<Params extends Record<string, string> = Record<string, string>, Data = unknown, Context = unknown> =
  (args: LoaderArgs<Params, Context>) => Data | Promise<Data>;

export type LoaderResult<TLoader> = TLoader extends LoaderFn<any, infer Data, any> ? Awaited<Data> : undefined;

export type RouteConfig<
  Path extends string = string,
  TLoader extends LoaderFn<any, any, any> | undefined = LoaderFn<any, any, any> | undefined
> = {
  path: Path;
  loader?: TLoader;
  render: (args: {
    params: ParamsForPath<NormalizePath<Path>>;
    loaderData: LoaderResult<TLoader>;
  }) => ReactNode;
  children?: readonly RouteConfig[];
};

export type AnyRouteConfig = RouteConfig<string, LoaderFn<any, any, any> | undefined>;

type RoutePathsFromNode<Node extends AnyRouteConfig, Prefix extends string> =
  NormalizePath<JoinPath<Prefix, Node["path"]>> |
  (Node["children"] extends readonly AnyRouteConfig[]
    ? RoutePaths<Node["children"], NormalizePath<JoinPath<Prefix, Node["path"]>>>
    : never);

export type RoutePaths<Routes extends readonly AnyRouteConfig[], Prefix extends string = ""> = {
  [K in keyof Routes]: Routes[K] extends AnyRouteConfig ? RoutePathsFromNode<Routes[K], Prefix> : never;
}[number];

export type ParamsForRoutePath<TRoutes extends readonly AnyRouteConfig[], TPath extends RoutePaths<TRoutes>> =
  ParamsForPath<TPath>;

export type CompiledRoute<TRoute extends AnyRouteConfig = AnyRouteConfig> = {
  id: string;
  fullPath: string;
  path: string;
  route: TRoute;
  children: CompiledRoute[];
  segments: string[];
};

export type Router<TRoutes extends readonly AnyRouteConfig[]> = {
  readonly routes: TRoutes;
  readonly compiledRoutes: CompiledRoute[];
};

export function defineRoute<const TRoute extends AnyRouteConfig>(route: TRoute): TRoute {
  return route;
}

export function defineRoutes<const TRoutes extends readonly AnyRouteConfig[]>(routes: TRoutes): TRoutes {
  return routes;
}

function normalizeRuntimePath(path: string): string {
  if (!path || path === "/") return "/";
  let collapsed = "";
  let previousWasSlash = false;
  for (const char of path) {
    if (char === "/") {
      if (!previousWasSlash) {
        collapsed += char;
      }
      previousWasSlash = true;
      continue;
    }
    previousWasSlash = false;
    collapsed += char;
  }

  let start = 0;
  let end = collapsed.length;
  while (start < end && collapsed[start] === "/") start += 1;
  while (end > start && collapsed[end - 1] === "/") end -= 1;
  const cleaned = collapsed.slice(start, end);
  return cleaned ? `/${cleaned}` : "/";
}

function splitPath(path: string): string[] {
  const normalized = normalizeRuntimePath(path);
  if (normalized === "/") return [];
  return normalized.slice(1).split("/").filter(Boolean);
}

function compileNodes(
  routes: readonly AnyRouteConfig[],
  parentPath: string,
  parentId: string
): CompiledRoute[] {
  const siblingPaths = new Set<string>();
  return routes.map((route, index) => {
    const fullPath = normalizeRuntimePath(parentPath === "/" ? route.path : `${parentPath}/${route.path}`);
    if (siblingPaths.has(fullPath)) {
      throw new Error(`Duplicate sibling route path detected: ${fullPath}`);
    }
    siblingPaths.add(fullPath);
    const id = parentId ? `${parentId}.${index}` : `${index}`;

    return {
      id,
      fullPath,
      path: route.path,
      route,
      segments: splitPath(route.path),
      children: compileNodes(route.children ?? [], fullPath, id)
    };
  });
}

function compileNode(route: AnyRouteConfig, parentPath: string, routeId: string): CompiledRoute {
  const fullPath = normalizeRuntimePath(parentPath === "/" ? route.path : `${parentPath}/${route.path}`);
  return {
    id: routeId,
    fullPath,
    path: route.path,
    route,
    segments: splitPath(route.path),
    children: compileNodes(route.children ?? [], fullPath, routeId)
  };
}

export function createRouter<const TRoutes extends readonly AnyRouteConfig[]>(input: { routes: TRoutes }): Router<TRoutes> {
  const { routes } = input;
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("Router requires at least one root route.");
  }

  const siblingPaths = new Set<string>();
  const compiledRoutes = routes.map((route, index) => {
    const fullPath = normalizeRuntimePath(route.path);
    if (siblingPaths.has(fullPath)) {
      throw new Error(`Duplicate sibling route path detected: ${fullPath}`);
    }
    siblingPaths.add(fullPath);
    return compileNode(route, "/", `${index}`);
  });
  return { routes, compiledRoutes };
}

export type RouteMatch = {
  route: CompiledRoute;
  params: Record<string, string>;
};

function matchSegments(
  segments: string[],
  routeSegments: string[],
  index: number,
  currentParams: Record<string, string>
): { nextIndex: number; params: Record<string, string> } | null {
  if (routeSegments.length === 0) {
    return { nextIndex: index, params: currentParams };
  }

  const tryMatch = (
    routeIndex: number,
    segmentIndex: number,
    params: Record<string, string>
  ): { nextIndex: number; params: Record<string, string> } | null => {
    if (routeIndex === routeSegments.length) {
      return { nextIndex: segmentIndex, params };
    }

    const patternSegment = routeSegments[routeIndex];
    const currentSegment = segments[segmentIndex];

    if (patternSegment.startsWith(":")) {
      const rawName = patternSegment.slice(1);
      const optional = rawName.endsWith("?");
      const paramName = optional ? rawName.slice(0, -1) : rawName;

      if (optional) {
        const skipped = tryMatch(routeIndex + 1, segmentIndex, params);
        if (skipped) {
          return skipped;
        }
      }

      if (!currentSegment) {
        return null;
      }

      const consumedParams = { ...params, [paramName]: decodeURIComponent(currentSegment) };
      return tryMatch(routeIndex + 1, segmentIndex + 1, consumedParams);
    }

    if (patternSegment !== currentSegment) {
      return null;
    }

    return tryMatch(routeIndex + 1, segmentIndex + 1, params);
  };

  return tryMatch(0, index, { ...currentParams });
}

function matchNode(
  routes: CompiledRoute[],
  segments: string[],
  index: number,
  params: Record<string, string>
): RouteMatch[] | null {
  for (const route of routes) {
    const matched = matchSegments(segments, route.segments, index, params);
    if (!matched) {
      continue;
    }

    const current: RouteMatch = { route, params: matched.params };

    const childMatch = matchNode(route.children, segments, matched.nextIndex, matched.params);
    if (childMatch) {
      return [current, ...childMatch];
    }

    if (matched.nextIndex === segments.length) {
      return [current];
    }
  }

  return null;
}

export function matchPath(compiledRoutes: CompiledRoute[], pathname: string): RouteMatch[] {
  const segments = splitPath(pathname);
  const result = matchNode(compiledRoutes, segments, 0, {});
  if (!result) {
    throw new Error(`No route matched path: ${pathname}`);
  }
  return result;
}

export function buildPath<TPath extends string>(path: TPath, params: ParamsForPath<TPath>): string {
  const normalized = normalizeRuntimePath(path);
  const segments = normalized.split("/").filter(Boolean);
  const builtSegments = segments.map((segment) => {
    if (!segment.startsWith(":")) {
      return segment;
    }
    const rawKey = segment.slice(1);
    const optional = rawKey.endsWith("?");
    const key = (optional ? rawKey.slice(0, -1) : rawKey) as keyof typeof params;
    const value = params[key];
    if (value === undefined) {
      if (optional) {
        return undefined;
      }
      throw new Error(`Missing required route param: ${String(key)} for path ${path}`);
    }
    return encodeURIComponent(String(value));
  });
  return `/${builtSegments.filter((segment): segment is string => segment !== undefined).join("/")}`;
}
