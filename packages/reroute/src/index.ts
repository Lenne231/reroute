export {
  createRouter,
  defineRoute,
  defineRoutes,
  index,
  path,
  layout,
  buildPath,
  matchPath,
  matchPathBranch,
  getRouteBranchRoot,
  lazyRoute,
  redirect,
  tryMatchPath,
} from "./core/router";

export { createClientEntry, createRSCEntry, createSSREntry } from "./entries";

export type {
  CreateClientEntryOptions,
  CreateRSCEntryOptions,
  CreateSSREntryOptions,
  RSCRenderResult,
} from "./entries";

export { normalizePathname, matchRoutePattern } from "./core/routes";

export type {
  RouteResolution,
  RouteDefinition,
  RouteResolver,
} from "./core/routes";

export type {
  AnyRouteConfig,
  CompiledRoute,
  Register,
  RegisteredRoutes,
  RouteProps,
  ResolveFn,
  ResolveArgs,
  RouteConfig,
  RouteMatch,
  RoutePaths,
  Router,
} from "./core/router";

export type {
  ParamsForPath,
  HasParams,
  HasRequiredParams,
  NormalizePath,
  JoinPath,
  ExtractParamNames,
  ExtractOptionalParamNames,
  ExtractRequiredParamNames,
} from "./types";
