import type { ReactNode } from "react";
import { renderToReadableStream } from "@vitejs/plugin-rsc/rsc/server";
import { createRSCEntry } from "reroute";
import { renderApp } from "./src/App";
import { RouteViewport } from "./src/components/RouteViewport";

export default createRSCEntry({
  renderApp,
  renderToReadableStream,
  createDocument: ({ page, requestUrl }: { page: ReactNode; requestUrl: URL }) => (
    <RouteViewport initialPage={page} pathname={requestUrl.pathname} />
  ),
  renderHTML: async ({ rscStream }: { rscStream: ReadableStream }) => {
    const ssrModule = await import.meta.viteRsc.import<
      typeof import("./entry.ssr")
    >("./entry.ssr.tsx", {
      environment: "ssr",
    });

    return ssrModule.handleSsr(rscStream);
  },
});

if (import.meta.hot) {
  import.meta.hot.accept();
}
