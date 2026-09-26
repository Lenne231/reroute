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
      <br />
      <Link to="/legacy-users" className={getLinkClassName}>
        {({ isActive, isNavigating }) => {
          if (isNavigating) {
            return "Redirect demo (loading...)";
          }

          if (isActive) {
            return "Redirect demo (active)";
          }

          return "Redirect demo";
        }}
      </Link>
      <br />
      <a href="/not-found-demo" className="nav-link">
        Trigger 404 demo
      </a>
    </div>
  );
}

export default resolveHomeRoute;
