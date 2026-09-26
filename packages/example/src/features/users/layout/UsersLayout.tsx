import { Outlet } from "reroute";

export function UsersLayout() {
  return (
    <div>
      <h2>Users</h2>
      <Outlet />
    </div>
  );
}
