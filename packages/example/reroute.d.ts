import type { routes } from "./src/app/routes";

declare module "reroute" {
  interface Register {
    routes: typeof routes;
  }
}
