import React from "react";
import {
  Link,
  Outlet,
  RouterProvider,
  createReactRouter,
  defineRoutes,
  useNavigate
} from "../src";

const routes = defineRoutes([
  {
    path: "",
    render: () => (
      <div>
        <h1>reroute demo</h1>
        <Outlet context={{ appName: "reroute" }} />
      </div>
    ),
    children: [
      {
        path: "users/:id",
        loader: async ({ params }: { params: { id: string } }) => {
          return { id: params.id, name: `User ${params.id}` };
        },
        render: ({ params, loaderData }) => <UserRoute params={params} user={loaderData as { id: string; name: string }} />
      }
    ]
  }
] as const);

function UserRoute({ params, user }: { params: { id: string }; user: { id: string; name: string } }) {
  const navigate = useNavigate<typeof routes>();
  return (
    <div>
      <p>{user.name}</p>
      <Link<typeof routes, "/users/:id"> to="/users/:id" params={{ id: "2" }}>
        Visit user 2
      </Link>
      <button type="button" onClick={() => navigate("/users/:id", { params: { id: "3" } })}>
        Visit user 3
      </button>
      <small>Current id: {params.id}</small>
    </div>
  );
}

const router = createReactRouter(routes);

export function App() {
  return <RouterProvider router={router} initialPath="/users/1" />;
}
