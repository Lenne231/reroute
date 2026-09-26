import { defineRoutes, index, layout, path, lazyRoute } from "reroute";
import { resolveFailRoute } from "./features/fail/route";
import { resolveLegacyUsersRoute } from "./features/legacy-users/route";
import { resolveRootLayout } from "./features/root/route";

export const routes = defineRoutes([
  layout(resolveRootLayout, [
    index(lazyRoute(() => import("./features/home/route"))),
    path("legacy-users", resolveLegacyUsersRoute),
    path("fail", resolveFailRoute),
    layout(
      "users",
      lazyRoute(() => import("./features/users/layout/route")),
      [
        index(lazyRoute(() => import("./features/users/list/route"))),
        path(
          "create",
          lazyRoute(() => import("./features/users/create/route")),
        ),
        path(
          ":id",
          lazyRoute(() => import("./features/users/detail/route")),
        ),
      ],
    ),
  ]),
] as const);
