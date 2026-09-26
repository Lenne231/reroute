export { prepareServerRender } from "./src/app/ssr";
import { App } from "./src/app/App";

export function AppForSSR({
  url,
  initialEntries,
}: {
  url: string;
  initialEntries?: Parameters<typeof App>[0]["initialEntries"];
}) {
  return <App initialPath={url} initialEntries={initialEntries} />;
}
