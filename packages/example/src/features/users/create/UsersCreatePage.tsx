import { useNavigate } from "reroute";

export function UsersCreatePage() {
  const navigate = useNavigate();

  return (
    <div>
      <h3>Create user</h3>
      <p>This is a placeholder create page.</p>
      <button type="button" onClick={() => navigate("/users")}>
        Back to users
      </button>
    </div>
  );
}
