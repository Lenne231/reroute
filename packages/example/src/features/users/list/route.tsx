import { UsersList } from "./UsersList";
import { getHydratedValue } from "../../../ssr-cache";
import { getUsers } from "../data/users";

export default async function resolveUsersListRoute() {
  const users = await getHydratedValue("users-list-ready", async () => {
    return await getUsers();
  });

  return <UsersList users={users} />;
}
