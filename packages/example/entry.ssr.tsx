import {
  createFromReadableStream,
  getClientEntryUrl,
} from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream } from "react-dom/server.edge";
import { createSSREntry } from "reroute";

export const handleSsr = createSSREntry({
  createFromReadableStream,
  renderToReadableStream,
  getClientEntryUrl,
});
