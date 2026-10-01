import { createFromReadableStream } from "@vitejs/plugin-rsc/browser";
import ReactDOM from "react-dom/client";
import { createClientEntry, getRouteBranchRoot } from "reroute";
import { installBrowserNavigation } from "./src/navigation";

void createClientEntry({
  createFromReadableStream,
  hydrateRoot: ReactDOM.hydrateRoot,
  installBrowserNavigation,
  fetchPage: () => {
    const requestUrl = new URL(
      `${window.location.pathname}.rsc`,
      window.location.href,
    );
    requestUrl.search = window.location.search;
    return fetch(requestUrl.toString());
  },
})();
