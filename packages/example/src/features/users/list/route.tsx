import { UsersList } from "./UsersList";

export async function resolveUsersListRoute() {
  console.log("Resolve users index route");
  //await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    page: <UsersList />,
    statusCode: 200,
  };
}

export default resolveUsersListRoute;
