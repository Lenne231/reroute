import type { ReactNode } from "react";
import type { JoinPath, NormalizePath, ParamsForPath } from "../types";

export type ResolveArgs<Params extends Record<string, string>, Context> = {
  params: Params;
  location: URL;
  context: Context;
  signal: AbortSignal;
  setStatusCode: (statusCode: number) => void;
};

export type RouteProps<Path extends string, Context = unknown> = ResolveArgs<
  ParamsForPath<NormalizePath<Path>>,
  Context
>;

export type RedirectResult = {
  readonly __type: "redirect";
  readonly to: string;
  readonly search?: URLSearchParams | Record<string, string>;
  readonly replace?: boolean;
  readonly statusCode?: number;
};

export type RedirectOptions = {
  params?: Record<string, string>;
  search?: URLSearchParams | Record<string, string>;
  replace?: boolean;
  statusCode?: number;
};

export function redirect<TPath extends string>(
  to: TPath,
  options?: RedirectOptions,
): RedirectResult {
  const path = buildPath(to, (options?.params ?? {}) as ParamsForPath<TPath>);
  return {
    __type: "redirect",
    to: path,
    search: options?.search,
    replace: options?.replace,
    statusCode: options?.statusCode ?? 302,
  };
}

export function isRedirectResult(value: unknown): value is RedirectResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "__type" in value &&
    (value as { __type?: unknown }).__type === "redirect"
  );
}

type LazyRouteModule<Params extends Record<string, string>, Context> = {
  default: ResolveFn<Params, Context>;
};

export function lazyRoute<
  Params extends Record<string, string> = Record<string, string>,
  Context = unknown,
>(
  loader: () => Promise<LazyRouteModule<Params, Context>>,
): ResolveFn<Params, Context> {
  return async (args) => (await loader()).default(args);
}

export type ResolveFn<
  Params extends Record<string, string> = Record<string, string>,
  Context = unknown,
> = (
  args: ResolveArgs<Params, Context>,
) => ReactNode | RedirectResult | Promise<ReactNode | RedirectResult>;

export type RouteConfig<Path extends string = string, TContext = unknown> = {
  path: Path;
  resolve: ResolveFn<ParamsForPath<NormalizePath<Path>>, TContext>;
  children?: readonly RouteConfig[];
};

export type AnyRouteConfig = {
  path: string;
  resolve: ResolveFn<any, any>;
  children?: readonly AnyRouteConfig[];
};

export interface Register {}

export type RegisteredRoutes = Register extends {
  routes: infer TRoutes extends readonly AnyRouteConfig[];
}
  ? TRoutes
  : readonly AnyRouteConfig[];

type RoutePathsFromNode<Node extends AnyRouteConfig, Prefix extends string> =
  | NormalizePath<JoinPath<Prefix, Node["path"]>>
  | (Node["children"] extends readonly AnyRouteConfig[]
      ? RoutePaths<
          Node["children"],
          NormalizePath<JoinPath<Prefix, Node["path"]>>
        >
      : never);

export type RoutePaths<
  Routes extends readonly AnyRouteConfig[],
  Prefix extends string = "",
> = {
  [K in keyof Routes]: Routes[K] extends AnyRouteConfig
    ? RoutePathsFromNode<Routes[K], Prefix>
    : never;
}[number];

export type ParamsForRoutePath<
  TRoutes extends readonly AnyRouteConfig[],
  TPath extends RoutePaths<TRoutes>,
> = ParamsForPath<TPath>;

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

export function defineRoute<
  const TPath extends string,
  TContext = unknown,
  const TChildren extends readonly AnyRouteConfig[] | undefined = undefined,
>(route: {
  path: TPath;
  resolve: ResolveFn<ParamsForPath<NormalizePath<TPath>>, TContext>;
  children?: TChildren;
}): RouteConfig<TPath, TContext> & { children?: TChildren };

export function defineRoute(route: any): any {
  return route;
}

export function index<
  TContext = unknown,
  const TChildren extends readonly AnyRouteConfig[] | undefined = undefined,
>(
  routeFn: ResolveFn<ParamsForPath<NormalizePath<"">>, TContext>,
  children?: TChildren,
): RouteConfig<"", TContext> & { children?: TChildren };

export function index(routeFn: any, children?: any): any {
  return defineRoute({ path: "", resolve: routeFn, children });
}

export function path<
  const TPath extends string,
  TContext = unknown,
  const TChildren extends readonly AnyRouteConfig[] | undefined = undefined,
>(
  path: TPath,
  routeFn: ResolveFn<ParamsForPath<NormalizePath<TPath>>, TContext>,
  children?: TChildren,
): RouteConfig<TPath, TContext> & { children?: TChildren };

export function path(path: any, routeFn: any, children?: any): any {
  return defineRoute({ path, resolve: routeFn, children });
}

export function layout<
  TContext = unknown,
  const TChildren extends readonly AnyRouteConfig[] = readonly AnyRouteConfig[],
>(
  routeFn: ResolveFn<ParamsForPath<NormalizePath<"">>, TContext>,
  children: TChildren,
): RouteConfig<"", TContext> & { children: TChildren };

export function layout<
  const TPath extends string,
  TContext = unknown,
  const TChildren extends readonly AnyRouteConfig[] = readonly AnyRouteConfig[],
>(
  path: TPath,
  routeFn: ResolveFn<ParamsForPath<NormalizePath<TPath>>, TContext>,
  children: TChildren,
): RouteConfig<TPath, TContext> & { children: TChildren };

export function layout(arg1: any, arg2: any, arg3?: any): any {
  if (typeof arg1 === "string") {
    return defineRoute({ path: arg1, resolve: arg2, children: arg3 });
  }

  return defineRoute({ path: "", resolve: arg1, children: arg2 });
}

export function defineRoutes<const TRoutes extends readonly AnyRouteConfig[]>(
  routes: TRoutes,
): TRoutes {
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
  parentId: string,
): CompiledRoute[] {
  const siblingPaths = new Set<string>();
  return routes.map((route, index) => {
    const fullPath = normalizeRuntimePath(
      parentPath === "/" ? route.path : `${parentPath}/${route.path}`,
    );
    const siblingKey = normalizeRuntimePath(route.path);
    if (siblingPaths.has(siblingKey)) {
      throw new Error(`Duplicate sibling route path detected: ${siblingKey}`);
    }
    siblingPaths.add(siblingKey);
    const id = parentId ? `${parentId}.${index}` : `${index}`;

    return {
      id,
      fullPath,
      path: route.path,
      route,
      segments: splitPath(route.path),
      children: compileNodes(route.children ?? [], fullPath, id),
    };
  });
}

function compileNode(
  route: AnyRouteConfig,
  parentPath: string,
  routeId: string,
): CompiledRoute {
  const fullPath = normalizeRuntimePath(
    parentPath === "/" ? route.path : `${parentPath}/${route.path}`,
  );
  return {
    id: routeId,
    fullPath,
    path: route.path,
    route,
    segments: splitPath(route.path),
    children: compileNodes(route.children ?? [], fullPath, routeId),
  };
}

export function createRouter<
  const TRoutes extends readonly AnyRouteConfig[],
>(input: { routes: TRoutes }): Router<TRoutes> {
  const { routes } = input;
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("Router requires at least one root route.");
  }

  const siblingPaths = new Set<string>();
  const compiledRoutes = routes.map((route, index) => {
    const fullPath = normalizeRuntimePath(route.path);
    const siblingKey = normalizeRuntimePath(route.path);
    if (siblingPaths.has(siblingKey)) {
      throw new Error(`Duplicate sibling route path detected: ${siblingKey}`);
    }
    siblingPaths.add(siblingKey);
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
  currentParams: Record<string, string>,
): { nextIndex: number; params: Record<string, string> } | null {
  if (routeSegments.length === 0) {
    return { nextIndex: index, params: currentParams };
  }

  const tryMatch = (
    routeIndex: number,
    segmentIndex: number,
    params: Record<string, string>,
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
        if (currentSegment) {
          const consumedParams = {
            ...params,
            [paramName]: decodeURIComponent(currentSegment),
          };
          const consumed = tryMatch(
            routeIndex + 1,
            segmentIndex + 1,
            consumedParams,
          );
          if (consumed) {
            return consumed;
          }
        }

        const skipped = tryMatch(routeIndex + 1, segmentIndex, params);
        if (skipped) {
          return skipped;
        }
        return null;
      }

      if (!currentSegment) {
        return null;
      }

      const consumedParams = {
        ...params,
        [paramName]: decodeURIComponent(currentSegment),
      };
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
  params: Record<string, string>,
): RouteMatch[] | null {
  for (const route of routes) {
    const matched = matchSegments(segments, route.segments, index, params);
    if (!matched) {
      continue;
    }

    const current: RouteMatch = { route, params: matched.params };

    const childMatch = matchNode(
      route.children,
      segments,
      matched.nextIndex,
      matched.params,
    );
    if (childMatch) {
      return [current, ...childMatch];
    }

    if (matched.nextIndex === segments.length) {
      return [current];
    }
  }

  return null;
}

export function getRouteBranchRoot(
  currentPath: string,
  nextPath: string,
): string {
  const currentSegments = normalizeRuntimePath(currentPath)
    .split("/")
    .filter(Boolean);
  const nextSegments = normalizeRuntimePath(nextPath)
    .split("/")
    .filter(Boolean);

  let shared = 0;
  while (
    shared < currentSegments.length &&
    shared < nextSegments.length &&
    currentSegments[shared] === nextSegments[shared]
  ) {
    shared += 1;
  }

  if (shared === 0) {
    return "/";
  }

  return `/${currentSegments.slice(0, shared).join("/")}`;
}

export function getRouteCacheKey(url: URL | string): string {
  const nextUrl =
    typeof url === "string" ? new URL(url, "http://localhost") : url;
  return `${nextUrl.pathname}${nextUrl.search}`;
}

export function matchPath(
  compiledRoutes: CompiledRoute[],
  pathname: string,
): RouteMatch[] {
  const result = tryMatchPath(compiledRoutes, pathname);
  if (!result) {
    throw new Error(`No route matched path: ${pathname}`);
  }
  return result;
}

export function matchPathBranch(
  compiledRoutes: CompiledRoute[],
  pathname: string,
  rootPath?: string | null,
): RouteMatch[] | null {
  const matches = tryMatchPath(compiledRoutes, pathname);
  if (!matches) {
    return null;
  }

  const normalizedRoot = rootPath ? normalizeRuntimePath(rootPath) : "/";
  if (normalizedRoot === "/") {
    return matches;
  }

  const rootIndex = matches.findIndex(
    ({ route }) => normalizeRuntimePath(route.fullPath) === normalizedRoot,
  );

  if (rootIndex === -1) {
    return matches;
  }

  return matches.slice(rootIndex);
}

export function tryMatchPath(
  compiledRoutes: CompiledRoute[],
  pathname: string,
): RouteMatch[] | null {
  const segments = splitPath(pathname);
  const result = matchNode(compiledRoutes, segments, 0, {});
  return result;
}

export function buildPath<TPath extends string>(
  path: TPath,
  params: ParamsForPath<TPath>,
): string {
  const normalized = normalizeRuntimePath(path);
  const segments = normalized.split("/").filter(Boolean);
  const builtSegments = segments.map((segment) => {
    if (!segment.startsWith(":")) {
      return segment;
    }
    const rawKey = segment.slice(1);
    const optional = rawKey.endsWith("?");
    const key = (
      optional ? rawKey.slice(0, -1) : rawKey
    ) as keyof typeof params;
    const value = params[key];
    if (value === undefined) {
      if (optional) {
        return undefined;
      }
      throw new Error(
        `Missing required route param: ${String(key)} for path ${path}`,
      );
    }
    return encodeURIComponent(String(value));
  });
  return `/${builtSegments.filter((segment): segment is string => segment !== undefined).join("/")}`;
}
