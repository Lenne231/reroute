import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { renderApp } from "./src/App";
import { RouteViewport } from "./src/components/RouteViewport";

export default async function handler(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const renderPathname = requestUrl.pathname.endsWith(".rsc")
    ? requestUrl.pathname.slice(0, -4) || "/"
    : requestUrl.pathname;
  const isPartialRequest = request.headers.get("x-reroute-partial") === "1";
  const { page, redirectTo, statusCode } = await renderApp(renderPathname);

  if (redirectTo) {
    const targetUrl = new URL(redirectTo, requestUrl);
    return Response.redirect(targetUrl, statusCode);
  }

  const payload = isPartialRequest ? (
    page
  ) : (
    <RouteViewport initialPage={page} />
  );
  const rscStream = renderToReadableStream(payload);

  if (requestUrl.pathname.endsWith(".rsc")) {
    return new Response(rscStream, {
      status: statusCode,
      headers: {
        "content-type": "text/x-component;charset=utf-8",
      },
    });
  }

  const ssrModule = await import.meta.viteRsc.import<
    typeof import("./entry.ssr")
  >("./entry.ssr.tsx", {
    environment: "ssr",
  });
  const htmlStream = await ssrModule.handleSsr(rscStream);

  return new Response(htmlStream, {
    status: statusCode,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
