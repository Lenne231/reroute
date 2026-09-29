import { Link } from "../../../components/Link";
import { users } from "../data/users";

export function UsersList() {
  return (
    <div>
      <p>All users</p>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link className="nav-link" href={`/users/${user.id}`}>
              {user.name}
            </Link>
          </li>
        ))}
      </ul>
      <Link className="nav-link" href="/users/create">
        Create user
      </Link>
      <br />
      <Link className="nav-link" href="/users/999">
        User not found demo
      </Link>
    </div>
  );
}
