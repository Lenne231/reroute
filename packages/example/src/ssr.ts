import { resolveInitialRouteStateForUrl } from "./initialRouteState";

export async function prepareServerRender(url: string) {
  return resolveInitialRouteStateForUrl(url);
}
