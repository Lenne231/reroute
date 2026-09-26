import { RouterProvider, createReactRouter } from "reroute";
import { InitialLoadingScreen } from "./InitialLoadingScreen";
import { routes } from "./routes";

const router = createReactRouter(routes);

export function App() {
  return (
    <RouterProvider
      router={router}
      fallback={<InitialLoadingScreen message="Loading route" />}
    />
  );
}
