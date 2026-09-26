import { redirect } from "reroute";

export function resolveLegacyUsersRoute() {
  return redirect("/users", { replace: true });
}
