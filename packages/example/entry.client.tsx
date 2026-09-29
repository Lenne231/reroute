import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import ReactDOM from "react-dom/client";
import { createClientEntry } from "reroute";
import { installBrowserNavigation } from "./src/navigation";

void createClientEntry({
  createFromReadableStream,
  hydrateRoot: ReactDOM.hydrateRoot,
  installBrowserNavigation,
  fetchPage: () =>
    fetch(`${window.location.pathname}.rsc${window.location.search}`, {
      headers: {
        "x-reroute-partial": "0",
      },
    }),
})();
