import { Link, RouteProps, useNavigate } from "reroute";

type User = {
  id: string;
  name: string;
};

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
  const user = { id: params.id, name: `User ${params.id}` };
  return <UserDetailsPage params={params} user={user} />;
}
