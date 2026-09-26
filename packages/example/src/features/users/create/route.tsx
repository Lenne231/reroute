import { useNavigate } from "reroute";

function UsersCreatePage() {
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

export default async function resolveUsersCreateRoute() {
  console.log("Resolve users create route");
  await new Promise((resolve) => setTimeout(resolve, 200));
  return <UsersCreatePage />;
}
