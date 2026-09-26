import { createServer as createHttpServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { createServer as createViteServer } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const templatePath = new URL("./index.html", import.meta.url);

async function start() {
  const vite = await createViteServer({
    root: __dirname,
    server: {
      middlewareMode: true,
      fs: {
        allow: [".."],
      },
    },
    appType: "custom",
  });

  const server = createHttpServer((req, res) => {
    void vite.middlewares(req, res, async () => {
      try {
        const requestUrl = new URL(req.url ?? "/", "http://localhost");
        const rawTemplate = await readFile(templatePath, "utf-8");
        const template = await vite.transformIndexHtml(
          requestUrl.pathname,
          rawTemplate,
        );
        const [templateBefore, templateAfter = ""] =
          template.split("<!--app-html-->");
        const { prepareServerRender, AppForSSR } =
          await vite.ssrLoadModule("/entry-server.tsx");
        const requestTarget = `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`;
        const { entries, statusCode } =
          await prepareServerRender(requestTarget);

        res.writeHead(statusCode, {
          "content-type": "text/html; charset=utf-8",
        });
        res.write(templateBefore);

        const bodyStream = new PassThrough();
        bodyStream.pipe(res, { end: false });
        bodyStream.on("end", () => {
          res.end(templateAfter);
        });

        const stream = renderToPipeableStream(
          AppForSSR({ url: requestTarget, initialEntries: entries }),
          {
            onAllReady() {
              stream.pipe(bodyStream);
            },
            onError(error) {
              console.error(error);
            },
          },
        );
      } catch (error) {
        vite.ssrFixStacktrace(error);
        const message =
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error);
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end(message);
      }
    });
  });

  const basePort = Number(process.env.PORT ?? 4174);
  let currentPort = basePort;

  const listen = () => {
    server.listen(currentPort, () => {
      const message =
        currentPort === basePort
          ? `SSR dev server running at http://localhost:${currentPort}`
          : `SSR dev server running at http://localhost:${currentPort} (base port ${basePort} was in use)`;
      console.log(message);
    });
  };

  server.on("error", (error) => {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "EADDRINUSE"
    ) {
      currentPort += 1;
      listen();
      return;
    }
    throw error;
  });

  listen();
}

void start();
