import { Link } from "reroute";
import { users } from "../data/users";

export async function resolveUsersListRoute() {
  console.log("Resolve users index route");
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const getLinkClassName = ({
    isActive,
    isNavigating,
  }: {
    isActive: boolean;
    isNavigating: boolean;
  }) =>
    [
      "nav-link",
      isActive ? "nav-link-active" : "",
      isNavigating ? "nav-link-pending" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const renderLabel = (
    label: string,
    { isActive, isNavigating }: { isActive: boolean; isNavigating: boolean },
  ) => {
    if (isNavigating) {
      return `${label} (loading...)`;
    }

    if (isActive) {
      return `${label} (active)`;
    }

    return label;
  };

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
