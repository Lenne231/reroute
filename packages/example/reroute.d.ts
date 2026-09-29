import type { routes } from "./src/routes";

export {};

declare module "reroute" {
  export * from "../reroute/src/index";

  interface Register {
    routes: typeof routes;
  }
}
