import { users } from "../data/users";
import { UserNotFoundPage } from "./UserNotFoundPage";
import { UserDetailsPage } from "./UserDetailsPage";

export async function resolveUserDetailRoute({ id }: { id: string }) {
  console.log("Resolve user id route", id);
  //await new Promise((resolve) => setTimeout(resolve, 500));

  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    return {
      statusCode: 404,
      page: <UserNotFoundPage id={id} />,
    };
  }

  return {
    statusCode: 200,
    page: <UserDetailsPage params={{ id }} user={user} />,
  };
}

export default resolveUserDetailRoute;
