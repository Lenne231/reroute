import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./src/App";
import { resolveInitialRouteStateForUrl } from "./src/initialRouteState";

void (async () => {
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const initial = await resolveInitialRouteStateForUrl(currentUrl);

  if (initial.kind === "redirect") {
    window.location.replace(
      `${initial.targetUrl.pathname}${initial.targetUrl.search}${initial.targetUrl.hash}`,
    );
    return;
  }

  ReactDOM.hydrateRoot(
    document.getElementById("root") as HTMLElement,
    <React.StrictMode>
      <App initialEntries={initial.entries} />
    </React.StrictMode>,
  );
})();
