import { Link } from "reroute";

export function resolveHomeRoute() {
  console.log("Resolve home route");

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

  return (
    <div>
      <h1>reroute demo</h1>
      <Link to="/users" className={getLinkClassName}>
        {({ isActive, isNavigating }) => {
          if (isNavigating) {
            return "Browse users (loading...)";
          }

          if (isActive) {
            return "Browse users (active)";
          }

          return "Browse users";
        }}
      </Link>
      <br />
      <Link to="/fail" className={getLinkClassName}>
        {({ isActive, isNavigating }) => {
          if (isNavigating) {
            return "Trigger fail route (loading...)";
          }

          if (isActive) {
            return "Trigger fail route (active)";
          }

          return "Trigger fail route";
        }}
      </Link>
    </div>
  );
}
