import {
  Link,
  RouterProvider,
  createReactRouter,
  type RouterResolvedEntry,
} from "reroute";
import { InitialLoadingScreen } from "./InitialLoadingScreen";
import { routes } from "./routes";

export const router = createReactRouter(routes);

function NotFoundPage({ pathname }: { pathname: string }) {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ marginTop: 0 }}>404</h1>
      <p>There is no route for: {pathname}</p>
      <Link to="/">Go home</Link>
    </div>
  );
}

function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: '"Avenir Next", "Segoe UI", sans-serif',
      }}
    >
      <h1 style={{ marginTop: 0 }}>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <button type="button" onClick={retry} style={{ marginRight: "0.75rem" }}>
        Retry
      </button>
      <Link to="/">Go home</Link>
    </div>
  );
}

export function App({
  initialPath,
  initialEntries,
}: {
  initialPath?: string;
  initialEntries?: RouterResolvedEntry[];
} = {}) {
  return (
    <RouterProvider
      router={router}
      initialPath={initialPath}
      initialEntries={initialEntries}
      fallback={<InitialLoadingScreen message="Loading route" />}
      notFound={(location) => <NotFoundPage pathname={location.pathname} />}
      errorBoundary={({ error, retry }) => (
        <ErrorPage error={error} retry={retry} />
      )}
    />
  );
}
