export { prepareServerRender } from "./src/ssr";
import { App } from "./src/App";

export function AppForSSR({
  url,
  initialEntries,
}: {
  url: string;
  initialEntries?: Parameters<typeof App>[0]["initialEntries"];
}) {
  return <App initialPath={url} initialEntries={initialEntries} />;
}
