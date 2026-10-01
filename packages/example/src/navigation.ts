import type { ReactNode } from "react";
import { createFromFetch } from "@vitejs/plugin-rsc/browser";
import { getRouteBranchRoot, getRouteCacheKey } from "reroute";
import { setRouteSnapshot } from "./routeState";

function toRscUrl(url: URL) {
  return `${url.pathname}.rsc${url.search}`;
}

function normalizeTarget(target: string | URL) {
  return typeof target === "string"
    ? new URL(target, window.location.href)
    : target;
}

type CachedRoute = {
  data: ReactNode;
  fetchedAt: number;
  expiresAt: number;
  ttlMs: number;
};

function readRouteCacheMetadata(response: Response) {
  const raw = response.headers.get("x-reroute-route-cache");
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as {
      swr?: boolean;
      enabled?: boolean;
      ttlMs?: number;
      duration?: number;
    };

    const ttlMs =
      typeof parsed.ttlMs === "number"
        ? parsed.ttlMs
        : typeof parsed.duration === "number"
          ? parsed.duration
          : undefined;

    if (
      parsed.swr === true &&
      parsed.enabled === true &&
      typeof ttlMs === "number" &&
      ttlMs > 0
    ) {
      return {
        swr: true,
        enabled: true,
        ttlMs,
      };
    }
  } catch {
    // Ignore invalid cache metadata.
  }

  return null;
}

export function createRouteCache() {
  const cache = new Map<string, CachedRoute>();
  const inflight = new Map<string, Promise<ReactNode>>();

  const cacheKeyFor = (url: URL | string) => getRouteCacheKey(url);

  const fetchFresh = async (url: URL): Promise<ReactNode> => {
    const requestUrl = new URL(toRscUrl(url), window.location.href);
    requestUrl.searchParams.set(
      "root",
      getRouteBranchRoot(window.location.pathname, url.pathname),
    );

    const response = await fetch(requestUrl.toString());

    if (response.redirected) {
      const redirectedUrl = new URL(response.url, window.location.href);
      return fetchFresh(redirectedUrl);
    }

    const element = await createFromFetch<ReactNode>(Promise.resolve(response));
    const routeCacheMetadata = readRouteCacheMetadata(response);

    if (routeCacheMetadata) {
      cache.set(cacheKeyFor(url), {
        data: element,
        fetchedAt: Date.now(),
        expiresAt: Date.now() + routeCacheMetadata.ttlMs,
        ttlMs: routeCacheMetadata.ttlMs,
      });
    }

    return element;
  };

  const load = async (url: URL): Promise<ReactNode> => {
    const key = cacheKeyFor(url);
    const cached = cache.get(key);

    if (cached) {
      void (async () => {
        const fresh = await fetchFresh(url);
        const currentUrl = `${window.location.pathname}${window.location.search}`;
        if (currentUrl === key) {
          setRouteSnapshot({ page: fresh });
        }
      })();
      return cached.data;
    }

    const existing = inflight.get(key);
    if (existing) {
      return existing;
    }

    const promise = fetchFresh(url).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, promise);
    return promise;
  };

  return {
    cache,
    cacheKeyFor,
    load,
  };
}

export const routeCache = createRouteCache();

async function loadRoute(url: URL) {
  return routeCache.load(url);
}

export async function navigateTo(target: string | URL, replace = false) {
  const nextUrl = normalizeTarget(target);
  const nextHref = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (nextHref === currentHref && !replace) {
    return;
  }

  const element = await loadRoute(nextUrl);
  setRouteSnapshot({
    page: element,
  });

  if (replace) {
    window.history.replaceState(null, "", nextHref);
  } else {
    window.history.pushState(null, "", nextHref);
  }
}

export function installBrowserNavigation() {
  window.addEventListener("popstate", () => {
    void navigateTo(window.location.href, true);
  });
}
