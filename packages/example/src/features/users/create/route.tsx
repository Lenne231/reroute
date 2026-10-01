import { UsersCreatePage } from "./UsersCreatePage";

export async function resolveUsersCreateRoute() {
  console.log("Resolve users create route");
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    page: <UsersCreatePage />,
    statusCode: 200,
    routeCache: {
      swr: true,
      enabled: true,
      ttlMs: 15000,
    },
  };
}

export default resolveUsersCreateRoute;
