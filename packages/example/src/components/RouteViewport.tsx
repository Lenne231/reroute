"use client";

import { useEffect, useState } from "react";
import { RootLayout } from "../features/root/RootLayout";
import { UsersLayout } from "../features/users/layout/UsersLayout";
import {
  attachRouteSnapshotSetter,
  isUsersRoutePath,
  type RouteSnapshot,
  setRouteSnapshot,
} from "../routeState";

type RouteViewportProps = {
  initialPage: React.ReactNode;
  pathname?: string;
};

function renderPage(page: React.ReactNode, pathname: string) {
  const content = isUsersRoutePath(pathname) ? (
    <UsersLayout>{page}</UsersLayout>
  ) : (
    page
  );

  return (
    <RootLayout message="Welcome to the reroute demo!">{content}</RootLayout>
  );
}

export function RouteViewport({ initialPage, pathname }: RouteViewportProps) {
  const [snapshot, setSnapshot] = useState<RouteSnapshot>({
    page: initialPage,
  });
  const currentPathname =
    typeof window !== "undefined"
      ? window.location.pathname
      : pathname ?? "/";

  useEffect(() => {
    attachRouteSnapshotSetter(setSnapshot);
    setRouteSnapshot({ page: initialPage });
  }, [initialPage]);

  return renderPage(snapshot.page, currentPathname);
}
