# reroute

A type-safe React router with nested route config, typed links/navigation, async route resolution, and outlet-based composition.

## Features

- Type-safe nested route configuration as the single source of truth.
- Route path autocomplete for `Link` and `useNavigate`.
- Compile-time param enforcement for dynamic routes (`/users/:id`).
- Nested route matching with a route stack.
- Async route resolution per route with params + location.
- Transition-safe navigation with `startTransition`.
- `Outlet` for child route composition.
- Parent route resolve reuse when parent match did not change.

## Install

```bash
npm install reroute
```

## Run the example app

This repository includes a runnable Vite example package in [packages/example/package.json](packages/example/package.json).

```bash
cd packages/example
pnpm install
pnpm run dev
```

Then open the URL printed by Vite (usually http://localhost:5173).

You can also run it from the repository root:

```bash
pnpm install
pnpm run example:dev
```

## Quick start

```tsx
import {
  Link,
  Outlet,
  RouterProvider,
  createReactRouter,
  defineRoutes,
  useNavigate,
} from "reroute";

const routes = defineRoutes([
  {
    path: "",
    resolve: () => <Outlet />,
    children: [
      {
        path: "users/:id",
        resolve: async ({ params }) => {
          const user = { id: params.id, name: `User ${params.id}` };
          return <UserPage params={params} user={user} />;
        },
      },
    ],
  },
] as const);

const router = createReactRouter(routes);

function UserPage({
  params,
  user,
}: {
  params: { id: string };
  user: { id: string; name: string };
}) {
  const navigate = useNavigate<typeof routes>();
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Current route param: {params.id}</p>
      <Link<typeof routes, "/users/:id"> to="/users/:id" params={{ id: "2" }}>
        Go to user 2
      </Link>
      <button onClick={() => navigate("/users/:id", { params: { id: "3" } })}>
        Go to user 3
      </button>
    </div>
  );
}

export function App() {
  return <RouterProvider router={router} initialPath="/users/1" />;
}
```

## Route configuration

Use `defineRoutes([...])` with nested `children` to describe the full route tree.

You can also use helpers for clearer intent:

- `layout(routeFn, children)`
- `layout(path, routeFn, children)`
- `path(path, routeFn, children?)`
- `index(routeFn, children?)`

Each route supports:

- `path`
- `resolve` (sync or async)
- optional `children`

`resolve` receives:

- `params`: params parsed from the route pattern
- `location`: the current URL object
- `signal`: abort signal for canceled navigations
- `context`: user context (reserved for future use)

## Type safety details

- Route path unions are inferred from your nested config.
- Dynamic params are inferred from `:param` segments.
- `Link` and `navigate` require `params` when a route has required params, and allow omitting `params` when all params are optional.
- `Link` and `navigate` reject `params` for static routes.

### Central Route Types With declare

If you want to avoid repeating route generics like Link<typeof routes, ...>,
register your route tree once with module augmentation.

Create a declaration file in your app (for example reroute.d.ts):

```ts
import type { routes } from "./src/app/routes";

declare module "reroute" {
  interface Register {
    routes: typeof routes;
  }
}
```

Then you can write:

```tsx
<Link to="/users/create">Create user</Link>
```

and:

```tsx
const navigate = useNavigate();
navigate("/users/:id", { params: { id: "42" } });
```

## Runtime behavior

- A route stack is maintained from root to deepest matched route.
- On navigation, unchanged parent matches are reused.
- Parent route resolve functions are not re-run when only child params change.
- Child rendering is handled by `<Outlet />`.
- Query-string-only navigations re-run resolve functions for matched routes so `location.search`-dependent UI stays fresh.

## 404 handling

Provide a `notFound` renderer on `RouterProvider` to render unmatched paths:

```tsx
function NotFoundPage({ pathname }: { pathname: string }) {
  return <h1>404: {pathname}</h1>;
}

<RouterProvider
  router={router}
  notFound={(location) => <NotFoundPage pathname={location.pathname} />}
/>;
```

Behavior:

- When a URL does not match any route, `notFound` is rendered instead of throwing.
- If `notFound` is omitted, unmatched paths keep the current throwing behavior.

## Error boundaries

Provide an `errorBoundary` renderer on `RouterProvider` to handle route resolve
errors and expose a retry action:

```tsx
<RouterProvider
  router={router}
  errorBoundary={({ error, location, retry }) => (
    <div>
      <h1>Route failed at {location.pathname}</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <button type="button" onClick={retry}>
        Retry
      </button>
    </div>
  )}
/>
```

Behavior:

- When a resolve throws/rejects, `errorBoundary` is rendered instead of throwing.
- Calling `retry` re-runs route resolution for the current URL.
- If `errorBoundary` is omitted, resolve errors keep the current throwing behavior.

## API

- `createRouter` / `createReactRouter`
- `RouterProvider`
- `Link`
- `Outlet`
- `useNavigate`
- `useParams`
- `defineRoute` / `defineRoutes`
- `layout` / `path` / `index`
- `matchPath` (throws when no route matches the provided pathname)
- `tryMatchPath` (returns `null` when no route matches)
- `buildPath` (throws when required path params are missing)
