import type { ReactNode } from "react";
import { createFromFetch } from "@vitejs/plugin-rsc/browser";
import { setRouteSnapshot } from "./routeState";

function toRscUrl(url: URL) {
  return `${url.pathname}.rsc${url.search}`;
}

function normalizeTarget(target: string | URL) {
  return typeof target === "string"
    ? new URL(target, window.location.href)
    : target;
}

async function loadRoute(url: URL) {
  const headers = new Headers();
  headers.set("x-reroute-partial", "1");

  const response = await fetch(toRscUrl(url), { headers });

  if (response.redirected) {
    const redirectedUrl = new URL(response.url, window.location.href);
    return loadRoute(redirectedUrl);
  }

  return createFromFetch<ReactNode>(Promise.resolve(response));
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
