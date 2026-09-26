export {
  createRouter,
  defineRoute,
  defineRoutes,
  index,
  path,
  layout,
  buildPath,
  matchPath,
  lazyRoute,
  redirect,
  tryMatchPath,
} from "./core/router";

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

export {
  RouterProvider,
  Outlet,
  Navigate,
  Link,
  useIsNavigating,
  useNavigate,
  useParams,
  resolveInitialRouteState,
  createReactRouter,
} from "./react/router";

export type {
  LinkProps,
  LinkRenderState,
  NavigateProps,
  RouterResolvedEntry,
  RouterErrorBoundaryRenderArgs,
  RouterErrorBoundaryRenderer,
} from "./react/router";
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
