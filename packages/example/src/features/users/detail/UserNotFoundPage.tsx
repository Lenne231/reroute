import { Link } from "../../../components/Link";

export function UserNotFoundPage({ id }: { id: string }) {
  return (
    <div>
      <h3>User not found</h3>
      <p>No user exists for id: {id}</p>
      <Link href="/users">Back to users</Link>
    </div>
  );
}
