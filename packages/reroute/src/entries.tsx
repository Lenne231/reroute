import type { ReactNode } from "react";
import type { RouteCacheConfig } from "./core/routes";

export type RSCRenderResult = {
  page: ReactNode;
  statusCode?: number;
  redirectTo?: string;
  routeCache?: RouteCacheConfig;
};

export type CreateRSCEntryOptions = {
  renderApp: (pathname: string) => Promise<RSCRenderResult>;
  renderToReadableStream: (payload: ReactNode) => ReadableStream;
  getPathname?: (request: Request, requestUrl: URL) => string;
  isPartialRequest?: (request: Request) => boolean;
  createDocument?: (args: {
    page: ReactNode;
    request: Request;
    requestUrl: URL;
    statusCode: number;
    redirectTo?: string;
  }) => ReactNode;
  renderHTML?: (args: {
    rscStream: ReadableStream;
    request: Request;
    requestUrl: URL;
    statusCode: number;
  }) => Promise<ReadableStream | Response>;
};

export function createRSCEntry({
  renderApp,
  renderToReadableStream,
  getPathname,
  isPartialRequest,
  createDocument,
  renderHTML,
}: CreateRSCEntryOptions) {
  return async function handleRscRequest(request: Request): Promise<Response> {
    const requestUrl = new URL(request.url);
    const renderPathname =
      getPathname?.(request, requestUrl) ??
      (requestUrl.pathname.endsWith(".rsc")
        ? requestUrl.pathname.slice(0, -4) || "/"
        : requestUrl.pathname);
    const rootParam = requestUrl.searchParams.get("root");
    const isPartial =
      isPartialRequest?.(request) ??
      (rootParam !== null && rootParam !== undefined);

    const {
      page,
      redirectTo,
      statusCode = 200,
      routeCache,
    } = await renderApp(renderPathname);

    if (redirectTo) {
      const targetUrl = new URL(redirectTo, requestUrl);
      return Response.redirect(targetUrl, statusCode);
    }

    const payload = isPartial
      ? page
      : (createDocument?.({
          page,
          request,
          requestUrl,
          statusCode,
          redirectTo,
        }) ?? page);

    const rscStream = renderToReadableStream(payload);
    const responseHeaders = {
      "content-type": "text/x-component;charset=utf-8",
      ...(routeCache
        ? { "x-reroute-route-cache": JSON.stringify(routeCache) }
        : {}),
    };

    if (requestUrl.pathname.endsWith(".rsc")) {
      return new Response(rscStream, {
        status: statusCode,
        headers: responseHeaders,
      });
    }

    const htmlResult =
      (await renderHTML?.({
        rscStream,
        request,
        requestUrl,
        statusCode,
      })) ?? rscStream;

    if (htmlResult instanceof Response) {
      return htmlResult;
    }

    return new Response(htmlResult, {
      status: statusCode,
      headers: {
        "content-type": "text/html; charset=utf-8",
        ...(routeCache
          ? { "x-reroute-route-cache": JSON.stringify(routeCache) }
          : {}),
      },
    });
  };
}

export type CreateSSREntryOptions = {
  createFromReadableStream: <T>(stream: ReadableStream) => Promise<T>;
  renderToReadableStream: (
    root: ReactNode,
    options?: { bootstrapModules?: string[] },
  ) => ReadableStream | Promise<ReadableStream>;
  getClientEntryUrl: () => string;
};

export function createSSREntry({
  createFromReadableStream,
  renderToReadableStream,
  getClientEntryUrl,
}: CreateSSREntryOptions) {
  return async function handleSsr(rscStream: ReadableStream) {
    const root = await createFromReadableStream<ReactNode>(rscStream);
    return renderToReadableStream(root, {
      bootstrapModules: [getClientEntryUrl()],
    });
  };
}

export type CreateClientEntryOptions = {
  fetchUrl?: (location: Location) => string;
  fetchPage?: (location: Location) => Promise<Response> | Response;
  createFromReadableStream: <T>(stream: ReadableStream | null) => Promise<T>;
  hydrateRoot: (
    container: Element | Document,
    initialChildren: ReactNode,
    options?: unknown,
  ) => unknown;
  installBrowserNavigation?: () => void;
};

export function createClientEntry({
  fetchUrl,
  fetchPage,
  createFromReadableStream,
  hydrateRoot,
  installBrowserNavigation,
}: CreateClientEntryOptions) {
  return async function startClientEntry() {
    const location = window.location;
    const rscUrl =
      fetchUrl?.(location) ?? `${location.pathname}.rsc${location.search}`;
    const requestUrl = new URL(rscUrl, location.href);

    const response =
      (await fetchPage?.(location)) ?? (await fetch(requestUrl.toString()));

    const root = await createFromReadableStream<ReactNode>(response.body);

    hydrateRoot(document, root);
    installBrowserNavigation?.();
  };
}
