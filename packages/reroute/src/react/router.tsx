import React, {
  AnchorHTMLAttributes,
  MouseEvent,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  AnyRouteConfig,
  CompiledRoute,
  RegisteredRoutes,
  Router,
  RoutePaths,
  buildPath,
  createRouter,
  tryMatchPath,
} from "../core/router";
import type { HasRequiredParams, ParamsForPath } from "../types";

type ParamsRequirement<TPath extends string> = TPath extends string
  ? keyof ParamsForPath<TPath> extends never
    ? { params?: never }
    : HasRequiredParams<TPath> extends true
      ? { params: ParamsForPath<TPath> }
      : { params?: ParamsForPath<TPath> }
  : never;

type NavigateOptions<TPath extends string> = ParamsRequirement<TPath> & {
  search?: URLSearchParams | Record<string, string>;
  replace?: boolean;
};

type NavigateArgs<TPath extends string> =
  HasRequiredParams<TPath> extends true
    ? [options: NavigateOptions<TPath>]
    : [options?: NavigateOptions<TPath>];

type NavigateFunction<TRoutes extends readonly AnyRouteConfig[]> = <
  TPath extends RoutePaths<TRoutes>,
>(
  to: TPath,
  ...args: NavigateArgs<TPath>
) => void;

type RouteStateEntry = {
  route: CompiledRoute;
  params: Record<string, string>;
  searchKey: string;
  hasResolved: boolean;
  element?: ReactNode;
};

type RouterState<TRoutes extends readonly AnyRouteConfig[]> = {
  router: Router<TRoutes>;
  entries: RouteStateEntry[];
  navigate: NavigateFunction<TRoutes>;
  location: URL;
  pendingHref: string | null;
};

type NotFoundRenderer = ReactNode | ((location: URL) => ReactNode);

export type RouterErrorBoundaryRenderArgs = {
  error: unknown;
  location: URL;
  retry: () => void;
};

export type RouterErrorBoundaryRenderer =
  | ReactNode
  | ((args: RouterErrorBoundaryRenderArgs) => ReactNode);

function urlToHref(url: URL): string {
  return `${url.pathname}${url.search}`;
}

const RouterContext = createContext<RouterState<any> | null>(null);
const RouteLevelContext = createContext<number>(-1);
const NavigationStateContext = createContext(false);

function isSameParams(
  a: Record<string, string>,
  b: Record<string, string>,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function createHref<TPath extends string>(
  to: TPath,
  options?: NavigateOptions<TPath>,
): string {
  const path = buildPath(to, (options?.params ?? {}) as ParamsForPath<TPath>);
  if (!options?.search) {
    return path;
  }

  const search =
    options.search instanceof URLSearchParams
      ? options.search.toString()
      : new URLSearchParams(options.search).toString();
  return search ? `${path}?${search}` : path;
}

function syncBrowserUrl(nextUrl: URL, replace: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const next = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next === current) {
    return;
  }

  if (replace) {
    window.history.replaceState(null, "", next);
    return;
  }

  window.history.pushState(null, "", next);
}

async function resolveEntries(
  prevEntries: RouteStateEntry[] | undefined,
  nextMatches: Array<{ route: CompiledRoute; params: Record<string, string> }>,
  url: URL,
  signal: AbortSignal,
): Promise<RouteStateEntry[]> {
  const nextEntries: RouteStateEntry[] = [];

  for (let index = 0; index < nextMatches.length; index += 1) {
    const match = nextMatches[index];
    const previous = prevEntries?.[index];
    if (
      previous &&
      previous.route === match.route &&
      isSameParams(previous.params, match.params) &&
      previous.searchKey === url.search &&
      previous.hasResolved
    ) {
      nextEntries.push(previous);
      continue;
    }

    const resolved = await match.route.route.resolve({
      params: match.params,
      location: url,
      context: undefined,
      signal,
    });

    nextEntries.push({
      route: match.route,
      params: match.params,
      searchKey: url.search,
      hasResolved: true,
      element: (
        <RouteLevelContext.Provider value={index}>
          {resolved}
        </RouteLevelContext.Provider>
      ),
    });
  }

  return nextEntries;
}

export function RouterProvider<
  const TRoutes extends readonly AnyRouteConfig[],
>({
  router,
  initialPath,
  fallback,
  notFound,
  errorBoundary,
}: {
  router: Router<TRoutes>;
  initialPath?: string;
  fallback?: ReactNode;
  notFound?: NotFoundRenderer;
  errorBoundary?: RouterErrorBoundaryRenderer;
}) {
  const resolvedInitialPath =
    initialPath ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/");
  const initialUrlRef = useRef(
    new URL(resolvedInitialPath, "http://localhost"),
  );
  const [entries, setEntries] = useState<RouteStateEntry[]>(() => {
    const matches = tryMatchPath(
      router.compiledRoutes,
      initialUrlRef.current.pathname,
    );
    return (matches ?? []).map((match) => ({
      route: match.route,
      params: match.params,
      searchKey: initialUrlRef.current.search,
      hasResolved: false,
    }));
  });
  const [isNotFound, setIsNotFound] = useState(() => entries.length === 0);
  const [location, setLocation] = useState<URL>(initialUrlRef.current);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState<unknown>(null);
  const [isResolvingRoutes, setIsResolvingRoutes] = useState(false);
  const [isPending, startTransition] = useTransition();
  const entriesRef = useRef(entries);
  const locationRef = useRef(location);
  const routerRef = useRef(router);
  const initialPathRef = useRef(initialPath);
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
    activeRouter: Router<TRoutes>,
    historyMode: "none" | "push" | "replace" = "none",
  ) => {
    const requestId = navigationCounterRef.current + 1;
    navigationCounterRef.current = requestId;
    setNavigationError(null);
    setPendingHref(urlToHref(nextUrl));
    setIsResolvingRoutes(true);
    if (historyMode !== "none") {
      syncBrowserUrl(nextUrl, historyMode === "replace");
    }

    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;

    startTransition(() => {
      void (async () => {
        try {
          const matches = tryMatchPath(
            activeRouter.compiledRoutes,
            nextUrl.pathname,
          );
          if (!matches) {
            if (historyMode !== "none") {
              syncBrowserUrl(nextUrl, historyMode === "replace");
            }
            setEntries([]);
            setLocation(nextUrl);
            setIsNotFound(true);
            return;
          }

          const resolved = await resolveEntries(
            previousEntries,
            matches,
            nextUrl,
            controller.signal,
          );
          if (
            navigationCounterRef.current !== requestId ||
            routerRef.current !== activeRouter
          ) {
            return;
          }
          setIsNotFound(false);
          setEntries(resolved);
          setLocation(nextUrl);
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          setLocation(nextUrl);
          setNavigationError(error);
        } finally {
          if (
            navigationCounterRef.current === requestId &&
            routerRef.current === activeRouter
          ) {
            setPendingHref(null);
            setIsResolvingRoutes(false);
          }
        }
      })();
    });

    return controller;
  };

  useEffect(() => {
    const controller = loadAndCommit(
      locationRef.current,
      entriesRef.current,
      router,
      "replace",
    );
    return () => {
      controller.abort();
    };
  }, [router]);

  useEffect(() => {
    if (initialPath === undefined) {
      return;
    }
    if (initialPathRef.current === initialPath) {
      return;
    }
    initialPathRef.current = initialPath;
    const nextUrl = new URL(initialPath, "http://localhost");
    locationRef.current = nextUrl;
    const controller = loadAndCommit(
      nextUrl,
      entriesRef.current,
      router,
      "replace",
    );
    return () => {
      controller.abort();
    };
  }, [initialPath, router]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onPopState = () => {
      const nextUrl = new URL(window.location.href);
      locationRef.current = nextUrl;
      loadAndCommit(nextUrl, entriesRef.current, routerRef.current, "none");
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  const navigate = useCallback<NavigateFunction<TRoutes>>((to, ...args) => {
    const options = args[0];
    const href = createHref(to, options as unknown as NavigateOptions<any>);
    const nextUrl = new URL(href, "http://localhost");
    loadAndCommit(
      nextUrl,
      entriesRef.current,
      routerRef.current,
      options?.replace ? "replace" : "push",
    );
  }, []);

  const retry = useCallback(() => {
    loadAndCommit(
      locationRef.current,
      entriesRef.current,
      routerRef.current,
      "none",
    );
  }, []);

  const value = useMemo<RouterState<TRoutes>>(
    () => ({
      router,
      entries,
      navigate,
      location,
      pendingHref,
    }),
    [entries, location, navigate, pendingHref, router],
  );

  if (navigationError) {
    const renderedErrorBoundary =
      typeof errorBoundary === "function"
        ? errorBoundary({ error: navigationError, location, retry })
        : errorBoundary;

    if (renderedErrorBoundary) {
      return (
        <NavigationStateContext.Provider value={isResolvingRoutes || isPending}>
          <RouterContext.Provider value={value}>
            {renderedErrorBoundary}
          </RouterContext.Provider>
        </NavigationStateContext.Provider>
      );
    }

    throw navigationError;
  }

  if (isNotFound) {
    const renderedNotFound =
      typeof notFound === "function" ? notFound(location) : notFound;
    if (renderedNotFound) {
      return (
        <NavigationStateContext.Provider value={isResolvingRoutes || isPending}>
          <RouterContext.Provider value={value}>
            {renderedNotFound}
          </RouterContext.Provider>
        </NavigationStateContext.Provider>
      );
    }

    throw new Error(`No route matched path: ${location.pathname}`);
  }

  return (
    <NavigationStateContext.Provider value={isResolvingRoutes || isPending}>
      <RouterContext.Provider value={value}>
        {entries[0]?.element ?? fallback ?? null}
      </RouterContext.Provider>
    </NavigationStateContext.Provider>
  );
}

export function Outlet() {
  const state = useContext(RouterContext);
  const level = useContext(RouteLevelContext);

  if (!state || level < 0) {
    return null;
  }

  const nextEntry = state.entries[level + 1];
  if (!nextEntry?.element) {
    return null;
  }

  return nextEntry.element;
}

export function useParams<
  TParams extends Record<string, string> = Record<string, string>,
>(): TParams {
  const state = useContext(
    RouterContext as React.Context<RouterState<any> | null>,
  );
  const level = useContext(RouteLevelContext);
  if (!state) {
    throw new Error("useParams must be used inside RouterProvider");
  }
  if (level < 0) {
    throw new Error(
      "useParams must be used within a matched route render tree",
    );
  }
  return (state.entries[level]?.params ?? {}) as TParams;
}

export function useNavigate<
  TRoutes extends readonly AnyRouteConfig[] = RegisteredRoutes,
>() {
  const state = useContext(
    RouterContext as React.Context<RouterState<TRoutes> | null>,
  );
  if (!state) {
    throw new Error("useNavigate must be used inside RouterProvider");
  }
  return state.navigate;
}

export function useIsNavigating(): boolean {
  return useContext(NavigationStateContext);
}

export type LinkRenderState = {
  isActive: boolean;
  isNavigating: boolean;
};

export type LinkProps<
  TRoutes extends readonly AnyRouteConfig[] = RegisteredRoutes,
  TPath extends RoutePaths<TRoutes> = RoutePaths<TRoutes>,
> = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "className" | "children"
> & {
  to: TPath;
  search?: URLSearchParams | Record<string, string>;
  replace?: boolean;
  className?:
    | AnchorHTMLAttributes<HTMLAnchorElement>["className"]
    | ((
        state: LinkRenderState,
      ) => AnchorHTMLAttributes<HTMLAnchorElement>["className"]);
  children?: ReactNode | ((state: LinkRenderState) => ReactNode);
} & ParamsRequirement<TPath>;

export function Link<
  TRoutes extends readonly AnyRouteConfig[] = RegisteredRoutes,
  TPath extends RoutePaths<TRoutes> = RoutePaths<TRoutes>,
>(props: LinkProps<TRoutes, TPath>) {
  const state = useContext(
    RouterContext as React.Context<RouterState<TRoutes> | null>,
  );
  const globalIsNavigating = useIsNavigating();
  const navigate = useNavigate<TRoutes>();
  const { to, search, replace, onClick, className, children, ...anchorProps } =
    props;
  const params = (props as { params?: ParamsForPath<TPath> }).params;
  const href = createHref(to, {
    params,
    search,
  } as unknown as NavigateOptions<TPath>);

  if (!state) {
    throw new Error("Link must be used inside RouterProvider");
  }

  const linkState: LinkRenderState = {
    isActive: urlToHref(state.location) === href,
    isNavigating: globalIsNavigating && state.pendingHref === href,
  };

  const resolvedClassName =
    typeof className === "function" ? className(linkState) : className;
  const resolvedChildren =
    typeof children === "function" ? children(linkState) : children;

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
    navigate(to, {
      params,
      search,
      replace,
    } as unknown as NavigateOptions<TPath>);
  };

  return (
    <a
      {...anchorProps}
      className={resolvedClassName}
      data-active={linkState.isActive ? "true" : "false"}
      data-navigating={linkState.isNavigating ? "true" : "false"}
      href={href}
      onClick={handleClick}
    >
      {resolvedChildren}
    </a>
  );
}

export function createReactRouter<
  const TRoutes extends readonly AnyRouteConfig[],
>(routes: TRoutes) {
  return createRouter({ routes });
}
