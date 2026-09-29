import { UsersLayout } from "./UsersLayout";
import type { ReactNode } from "react";

export async function resolveUsersLayoutRoute({
  children,
}: {
  children: ReactNode;
}) {
  return <UsersLayout>{children}</UsersLayout>;
}

export default resolveUsersLayoutRoute;
