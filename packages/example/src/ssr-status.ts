import { createReactRouter, tryMatchPath } from "reroute";
import { routes } from "./routes";

const router = createReactRouter(routes);

export async function resolveStatusCode(url: string): Promise<number> {
  const requestUrl = new URL(url, "http://localhost");
  const matches = tryMatchPath(router.compiledRoutes, requestUrl.pathname);
  if (!matches) {
    return 404;
  }

  const controller = new AbortController();
  let statusCode = 200;
  const setStatusCode = (nextStatusCode: number) => {
    statusCode = nextStatusCode;
  };

  for (const match of matches) {
    await match.route.route.resolve({
      params: match.params,
      location: requestUrl,
      context: undefined,
      signal: controller.signal,
      setStatusCode,
    });
  }

  return statusCode;
}
