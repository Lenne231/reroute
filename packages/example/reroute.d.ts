import type { routes } from "./src/routes";

declare module "reroute" {
  interface Register {
    routes: typeof routes;
  }
}
