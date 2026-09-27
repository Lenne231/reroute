import { resolveInitialRouteStateForUrl } from "./initialRouteState";
import { dehydrateInitialState } from "./ssr-cache";

export async function prepareServerRender(url: string) {
  const initial = await resolveInitialRouteStateForUrl(url);

  return {
    ...initial,
    hydrationState: dehydrateInitialState(),
  };
}
