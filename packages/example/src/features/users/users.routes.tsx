import { Outlet, index, layout, path } from "reroute";
import { resolveUsersCreateRoute } from "./create/create.route";
import { resolveUserDetailRoute } from "./detail/detail.route";
import { resolveUsersListRoute } from "./list/list.route";

function resolveUsersLayoutRoute() {
  return (
    <div>
      <h2>Users</h2>
      <Outlet />
    </div>
  );
}

export const usersRoutes = layout("users", resolveUsersLayoutRoute, [
  index(resolveUsersListRoute),
  path("create", resolveUsersCreateRoute),
  path(":id", resolveUserDetailRoute),
]);
