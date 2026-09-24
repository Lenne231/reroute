export {
  createRouter,
  defineRoute,
  defineRoutes,
  buildPath,
  matchPath
} from "./core/router";

export type {
  AnyRouteConfig,
  CompiledRoute,
  LoaderFn,
  LoaderArgs,
  LoaderResult,
  RouteConfig,
  RouteMatch,
  RoutePaths,
  Router
} from "./core/router";

export {
  RouterProvider,
  Outlet,
  Link,
  useLoaderData,
  useNavigate,
  useOutletContext,
  useParams,
  createReactRouter
} from "./react/router";

export type { LinkProps } from "./react/router";
export type {
  ParamsForPath,
  HasParams,
  HasRequiredParams,
  NormalizePath,
  JoinPath,
  ExtractParamNames,
  ExtractOptionalParamNames,
  ExtractRequiredParamNames
} from "./types";
