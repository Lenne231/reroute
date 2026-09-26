import { useNavigate, Link } from "reroute";
import { User } from "./types";

export function UserDetailsPage({
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
