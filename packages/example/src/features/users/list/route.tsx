import { UsersList } from "./UsersList";

export async function resolveUsersListRoute() {
  console.log("Resolve users index route");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    page: <UsersList />,
    statusCode: 200,
    routeCache: {
      swr: true,
      enabled: true,
      ttlMs: 15000,
    },
  };
}

export default resolveUsersListRoute;
