import type { ReactNode } from "react";
import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import ReactDOM from "react-dom/client";
import { installBrowserNavigation } from "./src/navigation";

void (async () => {
  const rscUrl = `${window.location.pathname}.rsc${window.location.search ? `${window.location.search}&` : "?"}partial=0`;
  const response = await fetch(rscUrl);
  const root = await createFromReadableStream<ReactNode>(response.body!);

  ReactDOM.hydrateRoot(document, root);
  installBrowserNavigation();
})();
