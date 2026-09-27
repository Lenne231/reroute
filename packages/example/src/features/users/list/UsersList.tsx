import { Link } from "reroute";
import { type User } from "../data/users";
import { getLinkClassName } from "./getLinkClassName";
import { renderLabel } from "./renderLabel";

export function UsersList({ users }: { users: User[] }) {
  return (
    <div>
      <p>All users</p>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link
              to="/users/:id"
              params={{ id: user.id }}
              className={getLinkClassName}
            >
              {(state) => renderLabel(user.name, state)}
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/users/create" className={getLinkClassName}>
        {(state) => renderLabel("Create user", state)}
      </Link>
      <br />
      <Link to="/users/:id" params={{ id: "999" }} className={getLinkClassName}>
        {(state) => renderLabel("User not found demo", state)}
      </Link>
    </div>
  );
}
