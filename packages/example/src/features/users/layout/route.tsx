import { Outlet } from "reroute";

export default function resolveUsersLayoutRoute() {
  return (
    <div>
      <h2>Users</h2>
      <Outlet />
    </div>
  );
}
