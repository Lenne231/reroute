import { RouteProps } from "reroute";
import { getUserById, users } from "../data/users";
import { UserNotFoundPage } from "./UserNotFoundPage";
import { UserDetailsPage } from "./UserDetailsPage";
import { getHydratedValue } from "../../../ssr-cache";

export default async function resolveUserDetailRoute({
  params,
  setStatusCode,
}: RouteProps<":id">) {
  const user = await getHydratedValue(`user-detail:${params.id}`, async () => {
    return (await getUserById(params.id)) ?? null;
  });

  if (!user) {
    setStatusCode(404);
    return <UserNotFoundPage id={params.id} />;
  }

  return <UserDetailsPage params={params} user={user} />;
}
