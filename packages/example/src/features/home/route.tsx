import { Link } from "../../components/Link";
import { Counter } from "./Counter";

export function resolveHomeRoute() {
  console.log("Resolve home route");

  return {
    page: (
      <div>
        <h1>reroute demo</h1>
        <Link className="nav-link" href="/users">
          Browse users
        </Link>
        <br />
        <Link className="nav-link" href="/fail">
          Trigger fail route
        </Link>
        <br />
        <Link className="nav-link" href="/legacy-users">
          Redirect demo
        </Link>
        <br />
        <Link href="/not-found-demo" className="nav-link">
          Trigger 404 demo
        </Link>
        <Counter />
      </div>
    ),
    statusCode: 200,
  };
}

export default resolveHomeRoute;
