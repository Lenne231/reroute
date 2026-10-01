import type { ReactNode } from "react";

export function normalizeRoutePath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const normalized = pathname.replace(/\/+$/, "");
  return normalized === "" ? "/" : normalized;
}

export function isUsersRoutePath(pathname: string): boolean {
  const normalized = normalizeRoutePath(pathname);
  return normalized === "/users" || normalized.startsWith("/users/");
}

export type RouteTreeSnapshot = Map<string, ReactNode>;

export type RouteSnapshot = {
  page: ReactNode;
  routeTree?: RouteTreeSnapshot;
};

let currentSnapshot: RouteSnapshot | null = null;
let setSnapshot: ((snapshot: RouteSnapshot) => void) | null = null;

export function getRouteSnapshot() {
  return currentSnapshot;
}

export function setRouteSnapshot(snapshot: RouteSnapshot) {
  currentSnapshot = snapshot;
  setSnapshot?.(snapshot);
}

export function attachRouteSnapshotSetter(
  nextSetter: (snapshot: RouteSnapshot) => void,
) {
  setSnapshot = nextSetter;
  if (currentSnapshot) {
    nextSetter(currentSnapshot);
  }
}
