import { UsersCreatePage } from "./UsersCreatePage";

export default async function resolveUsersCreateRoute() {
  console.log("Resolve users create route");
  await new Promise((resolve) => setTimeout(resolve, 200));
  return <UsersCreatePage />;
}
