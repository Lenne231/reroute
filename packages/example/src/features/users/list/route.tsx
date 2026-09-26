import { UsersList } from "./UsersList";

export default async function resolveUsersListRoute() {
  console.log("Resolve users index route");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return <UsersList />;
}
