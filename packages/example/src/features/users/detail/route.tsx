import { RouteProps } from "reroute";
import { users } from "../data/users";
import { UserNotFoundPage } from "./UserNotFoundPage";
import { UserDetailsPage } from "./UserDetailsPage";

export default async function resolveUserDetailRoute({
  params,
  setStatusCode,
}: RouteProps<":id">) {
  console.log("Resolve user id route", params.id);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = users.find((candidate) => candidate.id === params.id);
  if (!user) {
    setStatusCode(404);
    return <UserNotFoundPage id={params.id} />;
  }

  return <UserDetailsPage params={params} user={user} />;
}
