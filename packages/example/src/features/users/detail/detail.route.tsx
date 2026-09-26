import { Link, RouteProps, useNavigate } from "reroute";
import { users } from "../data/users";

type User = {
  id: string;
  name: string;
};

function UserNotFoundPage({ id }: { id: string }) {
  return (
    <div>
      <h3>User not found</h3>
      <p>No user exists for id: {id}</p>
      <Link to="/users">Back to users</Link>
    </div>
  );
}

function UserDetailsPage({
  params,
  user,
}: {
  params: { id: string };
  user: User;
}) {
  const navigate = useNavigate();

  return (
    <div>
      <p>{user.name}</p>
      <Link to="/users/:id" params={{ id: "2" }}>
        Visit user 2
      </Link>
      <button
        type="button"
        onClick={() => navigate("/users/:id", { params: { id: "3" } })}
      >
        Visit user 3
      </button>
      <small>Current id: {params.id}</small>
      <br />
      <Link to="/users">Back to users</Link>
    </div>
  );
}

export async function resolveUserDetailRoute({ params }: RouteProps<":id">) {
  console.log("Resolve user id route", params.id);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = users.find((candidate) => candidate.id === params.id);
  if (!user) {
    return <UserNotFoundPage id={params.id} />;
  }

  return <UserDetailsPage params={params} user={user} />;
}
