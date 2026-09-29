import { User } from "./types";
import { Link } from "../../../components/Link";

export function UserDetailsPage({
  params,
  user,
}: {
  params: { id: string };
  user: User;
}) {
  return (
    <div>
      <p>{user.name}</p>
      <Link href="/users/2">Visit user 2</Link>
      <br />
      <Link href="/users/3">Visit user 3</Link>
      <small>Current id: {params.id}</small>
      <br />
      <Link href="/users">Back to users</Link>
    </div>
  );
}
