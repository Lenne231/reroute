import { UsersCreatePage } from "./UsersCreatePage";
import { getHydratedValue } from "../../../ssr-cache";

export default async function resolveUsersCreateRoute() {
  await getHydratedValue("users-create-ready", async () => {
    console.log("Resolve users create route");
    await new Promise((resolve) => setTimeout(resolve, 200));
    return true;
  });
  return <UsersCreatePage />;
}
