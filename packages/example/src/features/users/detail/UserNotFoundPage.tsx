import { Link } from "reroute";

export function UserNotFoundPage({ id }: { id: string }) {
  return (
    <div>
      <h3>User not found</h3>
      <p>No user exists for id: {id}</p>
      <Link to="/users">Back to users</Link>
    </div>
  );
}
