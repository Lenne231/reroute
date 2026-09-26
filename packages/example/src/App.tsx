import {
  RouterProvider,
  createReactRouter,
  type RouterResolvedEntry,
} from "reroute";
import { InitialLoadingScreen } from "./components/InitialLoadingScreen";
import { routes } from "./routes";
import { NotFoundPage } from "./components/NotFoundPage";
import { ErrorPage } from "./components/ErrorPage";

export const router = createReactRouter(routes);

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
