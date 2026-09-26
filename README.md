# reroute

A type-safe React router with nested route config, typed links/navigation, route loaders, and outlet-based composition.

## Features

- Type-safe nested route configuration as the single source of truth.
- Route path autocomplete for `Link` and `useNavigate`.
- Compile-time param enforcement for dynamic routes (`/users/:id`).
- Nested route matching with a route stack.
- Loader execution per route with params + location.
- Transition-safe navigation with `startTransition`.
- `Outlet` + `useOutletContext` for child route composition.
- Parent route render reuse when parent match did not change.

## Install

```bash
npm install reroute
```

## Quick start

```tsx
import {
  Link,
  Outlet,
  RouterProvider,
  createReactRouter,
  defineRoutes,
  useNavigate
} from "reroute";

const routes = defineRoutes([
  {
    path: "",
    render: () => <Outlet />,
    children: [
      {
        path: "users/:id",
        loader: async ({ params }) => ({ id: params.id, name: `User ${params.id}` }),
        render: ({ params, loaderData }) => <UserPage params={params} user={loaderData} />
      }
    ]
  }
] as const);

const router = createReactRouter(routes);

function UserPage({ params, user }: { params: { id: string }; user: { id: string; name: string } }) {
  const navigate = useNavigate<typeof routes>();
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Current route param: {params.id}</p>
      <Link<typeof routes, "/users/:id"> to="/users/:id" params={{ id: "2" }}>
        Go to user 2
      </Link>
      <button onClick={() => navigate("/users/:id", { params: { id: "3" } })}>Go to user 3</button>
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} initialPath="/users/1" />;
}
```

## Route configuration

Use `defineRoutes([...])` with nested `children` to describe the full route tree.

Each route supports:

- `path`
- optional `loader`
- `render`
- optional `children`

`render` receives:

- `params`: params parsed from the route pattern
- `loaderData`: resolved loader data for the route

## Type safety details

- Route path unions are inferred from your nested config.
- Dynamic params are inferred from `:param` segments.
- `Link` and `navigate` require `params` when a route has required params, and allow omitting `params` when all params are optional.
- `Link` and `navigate` reject `params` for static routes.

## Runtime behavior

- A route stack is maintained from root to deepest matched route.
- On navigation, unchanged parent matches are reused.
- Parent route render functions are not re-run when only child matches change.
- Child rendering is handled by `<Outlet />`.
- Query-string-only navigations re-run loaders for matched routes that define a loader so `location.search`-dependent data stays fresh.

## API

- `createRouter` / `createReactRouter`
- `RouterProvider`
- `Link`
- `Outlet`
- `useNavigate`
- `useParams`
- `useLoaderData`
- `useOutletContext`
- `defineRoute` / `defineRoutes`
- `matchPath` (throws when no route matches the provided pathname)
- `buildPath` (throws when required path params are missing)
