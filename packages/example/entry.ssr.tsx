import type { ReactNode } from "react";
import {
  createFromReadableStream,
  getClientEntryUrl,
} from "@vitejs/plugin-rsc/ssr";
import { renderToReadableStream } from "react-dom/server.edge";

export async function handleSsr(rscStream: ReadableStream) {
  const root = await createFromReadableStream<ReactNode>(rscStream);

  return renderToReadableStream(root, {
    bootstrapModules: [getClientEntryUrl()],
  });
}
