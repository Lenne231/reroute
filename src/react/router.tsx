import React, {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  AnyRouteConfig,
  CompiledRoute,
  Router,
  RoutePaths,
  buildPath,
  createRouter,
  matchPath
} from "../core/router";
import type { HasRequiredParams, ParamsForPath } from "../types";

type ParamsRequirement<TPath extends string> =
  keyof ParamsForPath<TPath> extends never
    ? { params?: never }
    : HasRequiredParams<TPath> extends true
      ? { params: ParamsForPath<TPath> }
      : { params?: ParamsForPath<TPath> };

type NavigateOptions<TPath extends string> = ParamsRequirement<TPath> & {
  search?: URLSearchParams | Record<string, string>;
};

type NavigateArgs<TPath extends string> = HasRequiredParams<TPath> extends true
  ? [options: NavigateOptions<TPath>]
  : [options?: NavigateOptions<TPath>];

type NavigateFunction<TRoutes extends readonly AnyRouteConfig[]> =
  <TPath extends RoutePaths<TRoutes>>(to: TPath, ...args: NavigateArgs<TPath>) => void;

type RouteStateEntry = {
  route: CompiledRoute;
  params: Record<string, string>;
  loaderData: unknown;
  hasResolvedLoader: boolean;
  element?: ReactNode;
};

type RouterState<TRoutes extends readonly AnyRouteConfig[]> = {
  router: Router<TRoutes>;
  entries: RouteStateEntry[];
  navigate: NavigateFunction<TRoutes>;
  location: URL;
};

const RouterContext = createContext<RouterState<any> | null>(null);
const RouteLevelContext = createContext<number>(-1);
const OutletContext = createContext<unknown>(undefined);

function isSameParams(a: Record<string, string>, b: Record<string, string>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function createHref<TPath extends string>(to: TPath, options?: NavigateOptions<TPath>): string {
  const path = buildPath(to, (options?.params ?? {}) as ParamsForPath<TPath>);
  if (!options?.search) {
    return path;
  }

  const search = options.search instanceof URLSearchParams
    ? options.search.toString()
    : new URLSearchParams(options.search).toString();
  return search ? `${path}?${search}` : path;
}

async function resolveLoaders(
  prevEntries: RouteStateEntry[] | undefined,
  nextMatches: Array<{ route: CompiledRoute; params: Record<string, string> }>,
  url: URL,
  signal: AbortSignal
): Promise<RouteStateEntry[]> {
  const nextEntries: RouteStateEntry[] = [];

  for (let index = 0; index < nextMatches.length; index += 1) {
    const match = nextMatches[index];
    const previous = prevEntries?.[index];
    if (
      previous &&
      previous.route === match.route &&
      isSameParams(previous.params, match.params) &&
      (previous.hasResolvedLoader || !match.route.route.loader)
    ) {
      nextEntries.push(previous);
      continue;
    }

    const loaderData = match.route.route.loader
      ? await match.route.route.loader({
          params: match.params,
          location: url,
          context: undefined,
          signal
        })
      : undefined;

    nextEntries.push({
      route: match.route,
      params: match.params,
      loaderData,
      hasResolvedLoader: true
    });
  }

  return nextEntries;
}

function renderEntries(prevEntries: RouteStateEntry[] | undefined, nextEntries: RouteStateEntry[]): RouteStateEntry[] {
  return nextEntries.map((entry, index) => {
    const previous = prevEntries?.[index];
    if (
      previous?.element &&
      previous.route === entry.route &&
      isSameParams(previous.params, entry.params) &&
      previous.loaderData === entry.loaderData
    ) {
      return { ...entry, element: previous.element };
    }

    const rendered = entry.route.route.render({
      params: entry.params,
      loaderData: entry.loaderData
    });

    return {
      ...entry,
      element: (
        <RouteLevelContext.Provider value={index}>
          {rendered}
        </RouteLevelContext.Provider>
      )
    };
  });
}

export function RouterProvider<const TRoutes extends readonly AnyRouteConfig[]>({
  router,
  initialPath = "/"
}: {
  router: Router<TRoutes>;
  initialPath?: string;
}) {
  const initialUrlRef = useRef(new URL(initialPath, "http://localhost"));
  const [entries, setEntries] = useState<RouteStateEntry[]>(() => {
    const matches = matchPath(router.compiledRoutes, initialUrlRef.current.pathname);
    return matches.map((match) => ({
      route: match.route,
      params: match.params,
      loaderData: undefined,
      hasResolvedLoader: !match.route.route.loader
    }));
  });
  const [location, setLocation] = useState<URL>(initialUrlRef.current);
  const [navigationError, setNavigationError] = useState<unknown>(null);
  const entriesRef = useRef(entries);
  const locationRef = useRef(location);
  const routerRef = useRef(router);
  const initialPathRef = useRef(initialPath);
  const mountedRef = useRef(false);
  const previousRouterRef = useRef(router);
  const navigationCounterRef = useRef(0);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    entriesRef.current = entries;
    locationRef.current = location;
    routerRef.current = router;
  }, [entries, location, router]);

  const loadAndCommit = (
    nextUrl: URL,
    previousEntries: RouteStateEntry[],
    activeRouter: Router<TRoutes>
  ) => {
    const requestId = navigationCounterRef.current + 1;
    navigationCounterRef.current = requestId;
    setNavigationError(null);

    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    startTransition(() => {
      void (async () => {
        try {
          const matches = matchPath(activeRouter.compiledRoutes, nextUrl.pathname);
          const loaded = await resolveLoaders(previousEntries, matches, nextUrl, controller.signal);
          if (navigationCounterRef.current !== requestId || routerRef.current !== activeRouter) {
            return;
          }
          const rendered = renderEntries(entriesRef.current, loaded);
          setEntries(rendered);
          setLocation(nextUrl);
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          setNavigationError(error);
        }
      })();
    });
  };

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      previousRouterRef.current = router;
      loadAndCommit(locationRef.current, entriesRef.current, router);
      return () => {
        activeControllerRef.current?.abort();
      };
    }

    if (previousRouterRef.current !== router) {
      previousRouterRef.current = router;
      loadAndCommit(locationRef.current, entriesRef.current, router);
    }
    return () => {
      activeControllerRef.current?.abort();
    };
  }, [router]);

  useEffect(() => {
    if (initialPathRef.current === initialPath) {
      return;
    }
    initialPathRef.current = initialPath;
    const nextUrl = new URL(initialPath, "http://localhost");
    loadAndCommit(nextUrl, entriesRef.current, router);
  }, [initialPath, router]);

  const navigate = useCallback<NavigateFunction<TRoutes>>((to, ...args) => {
    const options = args[0];
    const href = createHref(to, options as NavigateOptions<any>);
    const nextUrl = new URL(href, "http://localhost");
    loadAndCommit(nextUrl, entriesRef.current, routerRef.current);
  }, []);

  const value = useMemo<RouterState<TRoutes>>(
    () => ({
      router,
      entries,
      navigate,
      location
    }),
    [entries, location, navigate, router]
  );

  if (navigationError) {
    throw navigationError;
  }

  if (entries.length === 0) {
    throw new Error(`No route matched path: ${location.pathname}`);
  }

  return <RouterContext.Provider value={value}>{entries[0]?.element ?? null}</RouterContext.Provider>;
}

export function Outlet({ context }: { context?: unknown } = {}) {
  const state = useContext(RouterContext);
  const level = useContext(RouteLevelContext);

  if (!state || level < 0) {
    return null;
  }

  const nextEntry = state.entries[level + 1];
  if (!nextEntry?.element) {
    return null;
  }

  return <OutletContext.Provider value={context}>{nextEntry.element}</OutletContext.Provider>;
}

export function useOutletContext<TContext = unknown>(): TContext {
  return useContext(OutletContext) as TContext;
}

export function useParams<TParams extends Record<string, string> = Record<string, string>>(): TParams {
  const state = useContext(RouterContext as React.Context<RouterState<any> | null>);
  const level = useContext(RouteLevelContext);
  if (!state) {
    throw new Error("useParams must be used inside RouterProvider");
  }
  if (level < 0) {
    throw new Error("useParams must be used within a matched route render tree");
  }
  return (state.entries[level]?.params ?? {}) as TParams;
}

export function useLoaderData<TData = unknown>(): TData {
  const state = useContext(RouterContext);
  const level = useContext(RouteLevelContext);
  if (!state) {
    throw new Error("useLoaderData must be used inside RouterProvider");
  }
  if (level < 0) {
    throw new Error("useLoaderData must be used within a matched route render tree");
  }
  return state.entries[level]?.loaderData as TData;
}

export function useNavigate<TRoutes extends readonly AnyRouteConfig[]>() {
  const state = useContext(RouterContext as React.Context<RouterState<TRoutes> | null>);
  if (!state) {
    throw new Error("useNavigate must be used inside RouterProvider");
  }
  return state.navigate;
}

export type LinkProps<
  TRoutes extends readonly AnyRouteConfig[],
  TPath extends RoutePaths<TRoutes>
> = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: TPath;
  search?: URLSearchParams | Record<string, string>;
} & ParamsRequirement<TPath>;

export function Link<TRoutes extends readonly AnyRouteConfig[], TPath extends RoutePaths<TRoutes>>({
  to,
  params,
  search,
  onClick,
  ...anchorProps
}: LinkProps<TRoutes, TPath>) {
  const navigate = useNavigate<TRoutes>();
  const href = createHref(to, { params, search } as NavigateOptions<TPath>);
  const target = anchorProps.target;

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target !== undefined && target !== "" && target !== "_self")
    ) {
      return;
    }
    event.preventDefault();
    navigate(to, { params, search } as NavigateOptions<TPath>);
  };

  return <a {...anchorProps} href={href} onClick={handleClick} />;
}

export function createReactRouter<const TRoutes extends readonly AnyRouteConfig[]>(routes: TRoutes) {
  return createRouter({ routes });
}
