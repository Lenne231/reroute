import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distClientDir = join(__dirname, "dist/client");
const distServerEntry = join(__dirname, "dist/server/entry-server.js");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function sanitizePath(pathname) {
  const normalized = normalize(pathname).replace(/^([.][.][/\\])+/, "");
  return normalized.startsWith("/") ? normalized.slice(1) : normalized;
}

async function tryServeStatic(pathname, res) {
  const safePath = sanitizePath(pathname);
  const filePath = join(distClientDir, safePath);

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return false;
    }

    const data = await readFile(filePath);
    const contentType =
      MIME_TYPES[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url ?? "/", "http://localhost");

    if (
      requestUrl.pathname.startsWith("/assets/") ||
      extname(requestUrl.pathname)
    ) {
      const served = await tryServeStatic(requestUrl.pathname, res);
      if (served) {
        return;
      }
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }

    const template = await readFile(join(distClientDir, "index.html"), "utf-8");
    const [templateBefore, templateAfter] = template.split("<!--app-html-->");
    const { prepareServerRender, AppForSSR } = await import(
      pathToFileURL(distServerEntry).href
    );
    const requestTarget = `${requestUrl.pathname}${requestUrl.search}${requestUrl.hash}`;
    const { entries, statusCode } = await prepareServerRender(requestTarget);

    res.writeHead(statusCode, { "content-type": "text/html; charset=utf-8" });
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
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(message);
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, () => {
  console.log(`SSR server running at http://localhost:${port}`);
});
