import { users } from "../data/users";
import { UserNotFoundPage } from "./UserNotFoundPage";
import { UserDetailsPage } from "./UserDetailsPage";
import { RouteResolution } from "reroute";

export async function resolveUserDetailRoute({
  id,
}: {
  id: string;
}): Promise<RouteResolution> {
  console.log("Resolve user id route", id);
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const currentTime = new Date().toISOString();

  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    return {
      statusCode: 404,
      page: <UserNotFoundPage id={id} />,
    };
  }

  return {
    statusCode: 200,
    page: (
      <UserDetailsPage params={{ id }} user={user} currentTime={currentTime} />
    ),
    routeCache: {
      swr: true,
      enabled: true,
      ttlMs: 15000,
    },
  };
}

export default resolveUserDetailRoute;
