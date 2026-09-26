import { resolveInitialRouteState } from "reroute";
import { router } from "./App";

export async function resolveInitialRouteStateForUrl(url: string) {
  const requestUrl = new URL(url, "http://localhost");
  return resolveInitialRouteState(router, requestUrl);
}
