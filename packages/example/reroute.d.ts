import type { routes } from "./src/routes";
import type { HydrationState } from "./src/ssr-cache";

declare global {
  interface Window {
    __REROUTE_INITIAL_DATA__?: HydrationState;
  }
}

declare module "reroute" {
  interface Register {
    routes: typeof routes;
  }
}
